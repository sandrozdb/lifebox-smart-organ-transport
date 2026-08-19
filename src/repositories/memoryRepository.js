function createMemoryRepository() {
  const db={transportes:[],leituras:[],alertas:[],eventos:[],otimizacoes:[]}; const next=key=>db[key].length+1; const now=()=>new Date().toISOString();
  const repo={
    reset(){Object.values(db).forEach(items=>items.length=0)},
    async listTransportes(){return [...db.transportes].reverse()}, async getTransporte(id){return db.transportes.find(x=>x.id===Number(id))},
    async createTransporte(data){const row={id:next('transportes'),...data,status:'PREPARADO',inicio_transporte:null,fim_transporte:null,criado_em:now()};db.transportes.push(row);return row},
    async updateTransporte(id,fields){const row=await this.getTransporte(id);Object.assign(row,fields);return row},
    async createLeitura(data){const row={id:next('leituras'),transporte_id:Number(data.transporteId),temperatura:data.temperatura,umidade:data.umidade,aceleracao:data.aceleracao,aceleracao_x:data.aceleracaoX??data.aceleracao,aceleracao_y:data.aceleracaoY??0,aceleracao_z:data.aceleracaoZ??0,impacto:data.impacto,latitude:data.latitude,longitude:data.longitude,velocidade:data.velocidade,bateria:data.bateria,sinal:data.sinal,device_id:data.deviceId,registrado_em:data.timestamp||now()};db.leituras.push(row);return row},
    async getLeituras(id,limit=100){return db.leituras.filter(x=>x.transporte_id===Number(id)).slice(-limit).reverse()},
    async createAlerta(data){const row={id:next('alertas'),transporte_id:Number(data.transporteId),leitura_id:data.leituraId,tipo:data.tipo,severidade:data.severidade,mensagem:data.mensagem,valor:data.valor??null,resolvido:false,criado_em:now()};db.alertas.push(row);return row},
    async getAlertas(id){return db.alertas.filter(x=>x.transporte_id===Number(id)).reverse()},
    async getRecentAlerta(id,tipo,since){return db.alertas.findLast(x=>x.transporte_id===Number(id)&&x.tipo===tipo&&new Date(x.criado_em)>=new Date(since))},
    async resolveAlerta(id){const row=db.alertas.find(x=>x.id===Number(id));if(row)row.resolvido=true;return row},
    async createEvento(data){const row={id:next('eventos'),transporte_id:Number(data.transporteId),tipo_evento:data.tipoEvento,descricao:data.descricao,latitude:data.latitude??null,longitude:data.longitude??null,registrado_em:data.registradoEm||now()};db.eventos.push(row);return row},
    async getEventos(id){return db.eventos.filter(x=>x.transporte_id===Number(id)).reverse()},
    async saveOptimization(transporteId,result){const batchId=now();for(const route of result.routes)db.otimizacoes.push({id:next('otimizacoes'),transporte_id:Number(transporteId),rota:route.id,nome_rota:route.nome,distancia:route.distancia,tempo_estimado:route.tempoEstimado,risco:route.risco,custo:route.custo,score:route.score,viavel:route.viavel,selecionada:route.selecionada,pesos_utilizados:result.weights,restricoes_aplicadas:result.constraints,detalhes_calculo:{normalized:route.normalized,partials:route.partials,violations:route.violations},criado_em:batchId});return result},
    async getLatestOptimization(id){const rows=db.otimizacoes.filter(x=>x.transporte_id===Number(id));if(!rows.length)return null;const latest=rows.at(-1).criado_em;const batch=rows.filter(x=>x.criado_em===latest);return{routes:batch,selectedRouteId:batch.find(x=>x.selecionada)?.rota,weights:batch[0].pesos_utilizados,constraints:batch[0].restricoes_aplicadas}},
    async summary(id){const rows=await this.getLeituras(id,100000);if(!rows.length)return{total_leituras:0};const temp=rows.map(x=>x.temperatura),hum=rows.map(x=>x.umidade);return{total_leituras:rows.length,temperatura_min:Math.min(...temp),temperatura_max:Math.max(...temp),temperatura_media:temp.reduce((a,b)=>a+b,0)/temp.length,umidade_min:Math.min(...hum),umidade_max:Math.max(...hum),impactos:rows.filter(x=>x.impacto>=1.8).length,percentual_tempo_limites:rows.filter(x=>x.temperatura>=2&&x.temperatura<=8).length/rows.length*100,bateria_final:rows[0].bateria}}
  };return repo;
}
module.exports={createMemoryRepository};
