const ROUTES = Object.freeze([
  { id:'ROTA_A',nome:'Rota A — Equilibrada',distancia:32,tempoEstimado:48,risco:.48,custo:52,transito:'MODERADO',confiabilidade:.88,sinal:82,disponivel:true,points:[[-23.561684,-46.655981],[-23.5655,-46.6538],[-23.5712,-46.6570],[-23.5787,-46.6615],[-23.5862,-46.6678],[-23.5925,-46.6725],[-23.598393,-46.676942]] },
  { id:'ROTA_B',nome:'Rota B — Menor tempo e risco',distancia:38,tempoEstimado:42,risco:.25,custo:61,transito:'LEVE',confiabilidade:.95,sinal:91,disponivel:true,points:[[-23.561684,-46.655981],[-23.5660,-46.6620],[-23.5718,-46.6679],[-23.5796,-46.6732],[-23.5874,-46.6778],[-23.5941,-46.6798],[-23.598393,-46.676942]] },
  { id:'ROTA_C',nome:'Rota C — Menor distância',distancia:29,tempoEstimado:58,risco:.32,custo:47,transito:'INTENSO',confiabilidade:.84,sinal:38,disponivel:true,points:[[-23.561684,-46.655981],[-23.5681,-46.6588],[-23.5750,-46.6612],[-23.5820,-46.6646],[-23.5891,-46.6682],[-23.5948,-46.6724],[-23.598393,-46.676942]] }
].map(route=>({...route,points:route.points.map(([latitude,longitude])=>({latitude,longitude}))})));

function getRoute(routeId='ROTA_A'){return ROUTES.find(route=>route.id===routeId)||ROUTES[0]}

function pointAt(progress,routeId='ROTA_A') {
  const points=getRoute(routeId).points;const safe=Math.max(0,Math.min(progress,1)); const scaled=safe*(points.length-1); const index=Math.floor(scaled); const next=Math.min(index+1,points.length-1); const fraction=scaled-index;
  return {latitude:points[index].latitude+(points[next].latitude-points[index].latitude)*fraction,longitude:points[index].longitude+(points[next].longitude-points[index].longitude)*fraction};
}
const DEMO_ROUTE=getRoute().points;
module.exports={ROUTES,DEMO_ROUTE,getRoute,pointAt};
