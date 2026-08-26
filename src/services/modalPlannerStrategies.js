const config=require('../config/modalTransport');
const {GroundRoutingProvider}=require('./groundRoutingProvider');

const toRadians=value=>value*Math.PI/180;
function haversine(a,b){
  const r=6371,dLat=toRadians(b.latitude-a.latitude),dLon=toRadians(b.longitude-a.longitude);
  const q=Math.sin(dLat/2)**2+Math.cos(toRadians(a.latitude))*Math.cos(toRadians(b.latitude))*Math.sin(dLon/2)**2;
  return 2*r*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
}
const round=value=>Number(value.toFixed(2));
const segment=(from,to,modal,distanceKm,timeMin,cost,extra={})=>({
  from,to,modal,distanceKm:round(distanceKm),timeMin:round(timeMin),cost:round(cost),
  classification:'SIMULATED_ASSUMPTION',...extra
});
const routing=new GroundRoutingProvider();

async function bestGroundSegment(from,to,conditions,phase){
  const routes=await routing.routes(from,to,conditions);
  const selected=[...routes].sort((a,b)=>a.cost-b.cost||a.timeMin-b.timeMin||a.risk-b.risk)[0];
  return segment(from.name,to.name,'TERRESTRE',selected.distanceKm,selected.timeMin,selected.cost,{
    phase,geometry:selected.geometry,via:selected.via,toll:selected.toll,
    source:selected.source,classification:selected.classification
  });
}
function helicopterAccessSegment(from,to,phase){
  const distanceKm=haversine(from,to)*1.05;
  const helicopter=config.HELICOPTER;
  return segment(from.name,to.name,'HELICÓPTERO',distanceKm,
    distanceKm/helicopter.averageSpeedKmh*60+helicopter.activationTimeMin,
    helicopter.baseCost+distanceKm*helicopter.costPerKm,{
      phase,geometry:[from,to],classification:'SIMULATED_ASSUMPTION',
      source:'Acesso aéreo demonstrativo entre hospital e aeroporto; custo e tempo simulados.'
    }
  );
}
class ModalPlannerStrategy {
  constructor(code){this.code=code;this.config=config[code]}
  travelTime(distance){return distance/this.config.averageSpeedKmh*60}
  operationalSegment(name,time,cost){
    return {from:name,to:name,modal:'OPERACIONAL',distanceKm:0,timeMin:time,cost,
      classification:'SIMULATED_ASSUMPTION'};
  }
}
class GroundTransportStrategy extends ModalPlannerStrategy {
  constructor(){super('GROUND');this.routing=routing}
  async plan({origin,destination,conditions}){
    const routes=await this.routing.routes(origin,destination,conditions);
    return routes.map(route=>({
      id:'PLAN_'+route.id,name:route.name,modal:this.config.name,modalCode:'GROUND',groundRoute:route,
      segments:[{...segment(origin.name,destination.name,'TERRESTRE',route.distanceKm,route.timeMin,route.cost),
        geometry:route.geometry,via:route.via,toll:route.toll,source:route.source,
        classification:route.classification}],requiredInfrastructure:[]
    }));
  }
}
class HelicopterTransportStrategy extends ModalPlannerStrategy {
  constructor(){super('HELICOPTER')}
  async plan({origin,destination,locationProvider,conditions}){
    const [departure,arrival]=await Promise.all([
      conditions.facilities?.HELIPORT_ORIGIN||locationProvider.findFacility(origin,'HELIPORT_ORIGIN'),
      conditions.facilities?.HELIPORT_DESTINATION||locationProvider.findFacility(destination,'HELIPORT_DESTINATION')
    ]);
    const hasOrigin=conditions.originHasHelipad,hasDestination=conditions.destinationHasHelipad;
    const legs=[];
    if(!hasOrigin)legs.push(await bestGroundSegment(origin,departure,conditions,'origem'));
    const airDistance=haversine(hasOrigin?origin:departure,hasDestination?destination:arrival)*1.08;
    legs.push(this.operationalSegment('Acionamento e preparação',
      this.config.activationTimeMin+this.config.preparationTimeMin,this.config.baseCost));
    legs.push(segment(hasOrigin?origin.name:departure.name,hasDestination?destination.name:arrival.name,
      'HELICÓPTERO',airDistance,this.travelTime(airDistance),airDistance*this.config.costPerKm));
    if(!hasDestination)legs.push(await bestGroundSegment(arrival,destination,conditions,'destino'));
    return {id:'PLAN_HELICOPTER',name:'Helicóptero porta a porta',modal:this.config.name,modalCode:'HELICOPTER',
      segments:legs,requiredInfrastructure:['HELIPORT_ORIGIN','HELIPORT_DESTINATION'],facilities:[departure,arrival]};
  }
}
class MultimodalAirTransportStrategy extends ModalPlannerStrategy {
  constructor(){super('AIRPLANE')}
  async plan({origin,destination,locationProvider,conditions}){
    const [departure,arrival]=await Promise.all([
      conditions.facilities?.AIRPORT_ORIGIN||locationProvider.findFacility(origin,'AIRPORT_ORIGIN'),
      conditions.facilities?.AIRPORT_DESTINATION||locationProvider.findFacility(destination,'AIRPORT_DESTINATION')
    ]);
    const accessOptions=[
      {key:'T',label:'Terrestre',available:conditions.groundAccessOriginAvailable!==false,segment:()=>bestGroundSegment(origin,departure,conditions,'acesso ao aeroporto de origem')},
      {key:'H',label:'Helicóptero',available:Boolean(conditions.originHasHelipad&&conditions.infrastructureAvailability.HELIPORT_ORIGIN),segment:async()=>helicopterAccessSegment(origin,departure,'acesso ao aeroporto de origem')}
    ];
    const exitOptions=[
      {key:'T',label:'Terrestre',available:conditions.groundAccessDestinationAvailable!==false,segment:()=>bestGroundSegment(arrival,destination,conditions,'saída do aeroporto de destino')},
      {key:'H',label:'Helicóptero',available:Boolean(conditions.destinationHasHelipad&&conditions.infrastructureAvailability.HELIPORT_DESTINATION),segment:async()=>helicopterAccessSegment(arrival,destination,'saída do aeroporto de destino')}
    ];
    const flightDistance=haversine(departure,arrival)*1.1;
    const flight=segment(departure.name,arrival.name,'AVIÃO',flightDistance,this.travelTime(flightDistance),
      flightDistance*this.config.costPerKm*(1+conditions.airCostIncrease),{
        phase:'voo entre aeroportos',geometry:[departure,arrival],classification:'SIMULATED_ASSUMPTION',
        source:'Voo demonstrativo entre aeroportos reais identificados por ICAO.'
      });
    const preparation=this.operationalSegment('Preparação, embarque e transferência aeroportuária',
      this.config.activationTimeMin+this.config.preparationTimeMin+this.config.transferTimeMin,this.config.baseCost);
    const plans=[];
    for(const access of accessOptions.filter(option=>option.available)){
      for(const exit of exitOptions.filter(option=>option.available)){
        const name=`${access.label} + Avião + ${exit.label}`;
        plans.push({
          id:`PLAN_MULTIMODAL_${access.key}_A_${exit.key}`,
          name,modal:name,modalCode:'AIRPLANE',
          segments:[await access.segment(),preparation,flight,await exit.segment()],
          requiredInfrastructure:[
            'AIRPORT_ORIGIN','AIRPORT_DESTINATION',
            ...(access.key==='H'?['HELIPORT_ORIGIN']:[]),
            ...(exit.key==='H'?['HELIPORT_DESTINATION']:[])
          ],
          facilities:[departure,arrival]
        });
      }
    }
    return plans;
  }
}
function strategies(){
  return [new GroundTransportStrategy(),new HelicopterTransportStrategy(),new MultimodalAirTransportStrategy()];
}
module.exports={ModalPlannerStrategy,GroundTransportStrategy,HelicopterTransportStrategy,
  MultimodalAirTransportStrategy,strategies,haversine,bestGroundSegment,helicopterAccessSegment};