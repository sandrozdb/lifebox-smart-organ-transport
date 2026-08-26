const crypto=require('crypto');
function hashCoordinate(text,axis){const hex=crypto.createHash('sha256').update(String(text)).digest('hex').slice(axis?8:0,8+(axis?8:0));const fraction=parseInt(hex,16)/0xffffffff;return axis?-46.9+fraction*.7:-23.8+fraction*.55}
class SimulatedLocationProvider{
 async geocode(query,role){const label=String(query||'').trim()||`${role==='origin'?'Hospital doador':'Hospital receptor'} simulado`;return {name:label,latitude:hashCoordinate(label,0),longitude:hashCoordinate(label,1),provider:'SIMULATED',classification:'SIMULATED_DATA',notice:'Localização simulada: configure um provedor externo para geocodificação real.'}}
 async findFacility(point,type){const offset=type.includes('AIRPORT')?.095:.028;return {name:`Infraestrutura ${type==='AIRPORT_ORIGIN'||type==='AIRPORT_DESTINATION'?'aeroportuária':'de heliponto'} simulada`,latitude:point.latitude+(type.endsWith('ORIGIN')?offset:-offset),longitude:point.longitude+(type.endsWith('ORIGIN')?offset:-offset),type,provider:'SIMULATED',classification:'SIMULATED_DATA',available:true}}
}
class NominatimLocationProvider{
 async geocode(query,role){if(!global.fetch)throw new Error('Fetch indisponível para geocodificação externa.');const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;const response=await fetch(url,{headers:{'User-Agent':'LifeBox-Academic-MVP/1.0'}});if(!response.ok)throw new Error(`Geocodificação externa indisponível (${response.status}).`);const data=await response.json();if(!data[0])throw new Error('Endereço não localizado pelo provedor externo.');return {name:data[0].display_name,latitude:Number(data[0].lat),longitude:Number(data[0].lon),role,provider:'NOMINATIM',classification:'EXTERNAL_OPEN_DATA',notice:'Geocodificação obtida do OpenStreetMap/Nominatim; confirmar operacionalmente antes de uso real.'}}
}
class FallbackLocationProvider{
 constructor(primary=new NominatimLocationProvider(),fallback=new SimulatedLocationProvider()){this.primary=primary;this.fallback=fallback}
 async geocode(query,role){try{return await this.primary.geocode(query,role)}catch(error){const simulated=await this.fallback.geocode(query,role);return {...simulated,fallbackReason:error.message}}}
 async findFacility(point,type){return this.fallback.findFacility(point,type)}
}
module.exports={SimulatedLocationProvider,NominatimLocationProvider,FallbackLocationProvider};