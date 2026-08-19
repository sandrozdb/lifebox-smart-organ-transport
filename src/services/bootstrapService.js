const repository=require('../repositories');
async function ensureDemo(){const existing=await repository.listTransportes();if(existing.length)return existing[0];const transport=await repository.createTransporte({codigo_transporte:'DEMO-SP-001',identificador_caixa:'LIFEBOX-001',tipo_orgao:'Órgão demonstrativo',hospital_origem:'Hospital Acadêmico Aurora (fictício)',hospital_destino:'Centro Médico Horizonte (fictício)',latitude_origem:-23.561684,longitude_origem:-46.655981,latitude_destino:-23.598393,longitude_destino:-46.676942});return transport}
module.exports={ensureDemo};

