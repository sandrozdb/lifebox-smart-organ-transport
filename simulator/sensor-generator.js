const { pointAt } = require('./route-generator');
const jitter=(amount)=> (Math.random()-.5)*amount;

function generate(state) {
  state.tick+=1;
  const slow=state.scenario==='atraso';
  state.progress=Math.min(1,state.progress+(slow ? .003 : .012));
  let temperatura=5+jitter(.35),umidade=58+jitter(2),impacto=Math.max(0,.12+jitter(.12)),aceleracao=.25+jitter(.18),bateria=Math.max(0,state.battery-.04),sinal=88+jitter(5),velocidade=slow?8+jitter(2):38+jitter(8);
  if(state.scenario==='temperatura')temperatura=Math.min(12,5+state.scenarioTick*.9);
  if(state.scenario==='umidade')umidade=Math.min(91,58+state.scenarioTick*5);
  if(state.scenario==='impacto'&&state.scenarioTick>=1&&state.scenarioTick<=3){impacto=4.4;aceleracao=4.8}
  if(state.scenario==='bateria')bateria=Math.max(7,state.battery-6);
  state.battery=bateria;
  if(state.scenario==='sinal'){sinal=state.scenarioTick<7?0:82}
  if(state.scenario==='concluir'){state.progress=1;velocidade=0}
  const location=pointAt(state.progress,state.routeId),ax=aceleracao,ay=jitter(.16),az=.98+jitter(.08);
  return {transporteId:state.transporteId,deviceId:'LIFEBOX-001',cenario:state.scenario,temperatura:+temperatura.toFixed(2),umidade:+umidade.toFixed(2),aceleracao:+aceleracao.toFixed(3),aceleracaoX:+ax.toFixed(3),aceleracaoY:+ay.toFixed(3),aceleracaoZ:+az.toFixed(3),impacto:+impacto.toFixed(3),...location,velocidade:+Math.max(0,velocidade).toFixed(2),bateria:+bateria.toFixed(2),sinal:+Math.max(0,sinal).toFixed(2),timestamp:new Date().toISOString()};
}
module.exports={generate};
