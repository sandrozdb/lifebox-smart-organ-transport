const $=selector=>document.querySelector(selector);
let transportId=1,map,layers={},dismissedOverlayKey=null;
const formatDate=value=>value?new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(String(value).includes('T')?value:String(value).replace(' ','T'))):'--';
const formatMinutes=value=>{const minutes=Math.max(0,Math.floor(Number(value)||0)),hours=Math.floor(minutes/60),rest=minutes%60;return hours?`${hours}h ${rest.toString().padStart(2,'0')}min`:`${rest} min`};async function api(path,options={}){
  const response=await fetch(path,{headers:{'Content-Type':'application/json'},...options});
  const data=await response.json();
  if(!response.ok)throw new Error(data.erro||'Falha na operação');
  return data;
}
function statusVisual(status){
  const critical=status==='CRITICO',attention=status==='ATENCAO',element=$('#general-status');
  element.textContent=critical?'ALERTA CRÍTICO':attention?'ATENÇÃO':status==='CONCLUIDO'?'CONCLUÍDO':'NORMAL';
  element.className=`status-badge ${critical?'critical':attention?'attention':'normal'}`;
}
function updateMetrics(reading,transport){
  if(!reading)return;
  $('#temperature').textContent=Number(reading.temperatura).toFixed(1);
  $('#humidity').textContent=Number(reading.umidade).toFixed(1);
  $('#impact').textContent=Number(reading.impacto).toFixed(2);
  $('#impact-label').textContent=reading.impacto>=1.8?'Ocorrência detectada':'Movimento normal';
  $('#battery').textContent=Number(reading.bateria).toFixed(0);
  $('#signal').textContent=Number(reading.sinal).toFixed(0);
  statusVisual(transport.status);
}
function updateExecutionMetrics(tracking){
  const minutes=Math.max(0,Math.floor(Number(tracking.transportElapsedMinutes||0))),hours=Math.floor(minutes/60),rest=minutes%60;
  const formattedTime=hours?`${hours}h ${rest.toString().padStart(2,'0')}min`:`${rest} min`;
  $('#elapsed').textContent=formattedTime;
  if(tracking.ischemiaTotalMinutes===undefined)return;
  const ischemia=Math.max(0,Math.floor(Number(tracking.ischemiaTotalMinutes))),maximum=Math.floor(Number(tracking.maximumIschemiaMinutes));
  const margin=Math.floor(Number(tracking.remainingMarginMinutes)),safety=Number(tracking.operationalSafetyMarginMinutes||0);
  $('#simulated-transport-time').textContent=`TEMPO DE TRANSPORTE ${formattedTime}`;
  $('#simulated-ischemia').textContent=`ISQUEMIA TOTAL ${ischemia} / ${maximum} min`;
  $('#simulated-margin').textContent=`MARGEM RESTANTE ${margin} min`;
  const card=$('#ischemia-card');
  $('#ischemia').textContent=`${ischemia} / ${maximum} min`;
  $('#ischemia-detail').textContent=`Margem: ${margin} min`;
  card.classList.toggle('attention',margin>=0&&margin<safety);
  card.classList.toggle('critical',margin<0);
}
function drawCharts(readings){
  const data=[...readings].reverse().slice(-40);
  LifeBoxCharts.draw($('#chart-temperature'),data.map(item=>Number(item.temperatura)),'#1ed6c5');
  LifeBoxCharts.draw($('#chart-humidity'),data.map(item=>Number(item.umidade)),'#49a7ff');
  LifeBoxCharts.draw($('#chart-impact'),data.map(item=>Number(item.impacto)),'#ff5367');
  LifeBoxCharts.draw($('#chart-battery'),data.map(item=>Number(item.bateria)),'#38da8a');
}
function createTrackingMarker(position){
  return L.circleMarker(position,{radius:9,color:'#fff',fillColor:'#1ed6c5',fillOpacity:1})
    .addTo(map).bindPopup('LifeBox simulada');
}
function initMap(tracking){
  if(!window.L||map)return;
  const origin=tracking.origin,destination=tracking.destination;
  map=L.map('map',{zoomControl:true}).setView([origin.latitude,origin.longitude],8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap',maxZoom:19
  }).addTo(map);
  layers.path=L.polyline([],{color:'#fff',weight:4,opacity:.95}).addTo(map);
  layers.current=createTrackingMarker([origin.latitude,origin.longitude]);
  layers.origin=L.marker([origin.latitude,origin.longitude]).addTo(map).bindPopup(`Origem: ${origin.name}`);
  layers.destination=L.marker([destination.latitude,destination.longitude]).addTo(map).bindPopup(`Destino: ${destination.name}`);
  map.fitBounds(L.latLngBounds([[origin.latitude,origin.longitude],[destination.latitude,destination.longitude]]),{padding:[20,20]});
}
function updateTracking(tracking){
  initMap(tracking);
  if(map&&tracking.current){
    const position=[Number(tracking.current.latitude),Number(tracking.current.longitude)];
    if(!layers.current)layers.current=createTrackingMarker(position);
    else layers.current.setLatLng(position);
    if(tracking.path?.length)layers.path.setLatLngs(tracking.path.map(point=>[point.latitude,point.longitude]));
    map.invalidateSize();
  }
  $('#progress-bar').style.width=`${tracking.progress||0}%`;
  const segment=tracking.currentSegment;
  $('#progress-label').textContent=segment
    ?`TRECHO ${tracking.segmentIndex+1}/${tracking.totalSegments} · ${segment.modal} · ${Number(tracking.progress).toFixed(0)}% total`
    :`${Number(tracking.progress||0).toFixed(0)}% · ${tracking.routeName}`;
  $('#traveled').textContent=`${Number(tracking.traveledKm||0).toFixed(1)} km`;
  $('#remaining').textContent=`${Number(tracking.remainingKm||0).toFixed(1)} km`;
  $('#current-coordinates').textContent=tracking.current
    ?`${Number(tracking.current.latitude).toFixed(5)}, ${Number(tracking.current.longitude).toFixed(5)}`
    :'Aguardando GPS';
  updateExecutionMetrics(tracking);
}
function renderPhysics(data){
  if(!data.available){$('#physics-grid').innerHTML=`<div class="empty">${data.message}</div>`;return}
  const {thermal:t,acceleration:a,electrical:e,organ}=data,range=organ?.referenceRangeC?.join('–')||'demonstrativa';
  $('#physics-grid').innerHTML=`<div class="physics-group"><h4>Termodinâmica didática</h4><p>Órgão <b>${organ?.name||'—'}</b></p><p>Faixa de referência <b>${range} °C</b></p><p>Status térmico <b>${t.status}</b></p><p>Temperatura inicial <b>${t.initial.toFixed(2)} °C</b></p><p>ΔT <b>${t.deltaT>=0?'+':''}${t.deltaT.toFixed(2)} °C</b></p><p>Tempo simulado <b>${formatMinutes(t.elapsedMinutes)}</b></p><p>ΔT/Δt <b>${t.rateCPerMinute.toFixed(3)} °C/min</b></p><p>Q = mcΔT <b>${t.heatJoules.toFixed(0)} J</b></p></div><div class="physics-group"><h4>Aceleração simulada</h4><p>Eixo X <b>${a.x.toFixed(3)} g</b></p><p>Eixo Y <b>${a.y.toFixed(3)} g</b></p><p>Eixo Z <b>${a.z.toFixed(3)} g</b></p><p>Resultante <b>${a.resultant.toFixed(3)} g</b></p><p>Maior pico <b>${a.peak.toFixed(3)} g</b></p></div><div class="physics-group"><h4>Grandezas elétricas</h4><p>P = VI <b>${e.powerWatts.toFixed(2)} W</b></p><p>E = Pt <b>${e.energyWh.toFixed(3)} Wh</b></p><p>Energia restante <b>${e.remainingEnergyWh.toFixed(2)} Wh</b></p><p>Autonomia estimada <b>${e.estimatedAutonomyHours.toFixed(2)} h</b></p><small>${data.disclaimer}</small></div>`;
}
function renderAlerts(items){
  $('#alert-count').textContent=items.filter(item=>!Boolean(item.resolvido)).length;
  const element=$('#alerts');element.className='scroll-list';
  element.innerHTML=items.map(item=>`<div class="alert-item severity-${item.severidade}"><i class="alert-icon"></i><div><strong>${item.tipo} · ${item.severidade}</strong><p>${item.mensagem}${item.valor!==null?` Valor: ${Number(item.valor).toFixed(2)}`:''}</p><time>${formatDate(item.criado_em)} · ${item.resolvido?'Resolvido':'Ativo'}</time></div>${item.resolvido?'':`<button class="resolve" data-resolve="${item.id}">Resolver</button>`}</div>`).join('')||'<div class="empty">Nenhum alerta registrado.</div>';
}
function renderActuators(signal={}){
  const ledOn=Boolean(signal.ledOn),buzzerOn=Boolean(signal.buzzerOn);
  $('#virtual-led').classList.toggle('active',ledOn);$('#virtual-buzzer').classList.toggle('active',buzzerOn);
  $('#led-status').textContent=ledOn?'LIGADO':'DESLIGADO';$('#buzzer-status').textContent=buzzerOn?'ATIVO':'DESLIGADO';
  $('#digital-transport-active').textContent=signal.transportActive?'SIM':'NÃO';
  $('#digital-temperature-critical').textContent=signal.temperatureCritical?'1':'0';
  $('#digital-impact-critical').textContent=signal.impactCritical?'1':'0';
  $('#digital-alert-output').textContent=signal.alertOutput?'1':'0';
}
function renderPresentationAlert(transport,alerts){
  const overlay=$('#presentation-alert'),current=alerts.find(alert=>!Boolean(alert.resolvido));
  if(!current||!['ATENCAO','CRITICO'].includes(transport.status)){
    overlay.classList.add('hidden');dismissedOverlayKey=null;return;
  }
  const key=`${current.id}-${current.severidade}`;
  if(dismissedOverlayKey===key)return;
  const labels={TEMPERATURA:'TEMPERATURA CRÍTICA',IMPACTO:'IMPACTO CRÍTICO',UMIDADE:'UMIDADE ALTA',BATERIA:'BATERIA BAIXA',SINAL:'PERDA DE SINAL',ATRASO:'ATRASO LOGÍSTICO'};
  const profile=window.lifeBoxActiveProfile,organ=profile?.name||transport.tipo_orgao||'órgão selecionado';
  let message=current.mensagem;
  if(current.tipo==='TEMPERATURA'){
    const range=profile?.preservation?.referenceRangeC;
    message=`Atual: ${Number(current.valor).toFixed(1)} °C${range?`\nFaixa de referência — ${organ}: ${range.join('–')} °C`:''}`;
  }else if(current.tipo==='IMPACTO')message=`Impacto detectado: ${Number(current.valor).toFixed(2)} g.`;
  $('#presentation-alert-title').textContent=`⚠ ${labels[current.tipo]||current.tipo}`;
  $('#presentation-alert-message').textContent=message;
  overlay.querySelector('p').textContent=current.tipo==='ATRASO'?'ALERTA OPERACIONAL':'OCORRÊNCIA EM TEMPO REAL';
  overlay.dataset.key=key;overlay.classList.remove('hidden');
}
function renderTimeline(items){
  const element=$('#timeline');element.className='scroll-list';
  element.innerHTML=items.map(item=>`<div class="timeline-item"><i class="timeline-dot"></i><div><strong>${item.tipo_evento.replaceAll('_',' ')}</strong><p>${item.descricao}</p></div><time>${formatDate(item.registrado_em)}</time></div>`).join('')||'<div class="empty">Nenhum evento registrado.</div>';
}
async function renderSummary(){
  const summary=await api(`/api/transportes/${transportId}/resumo`);
  if(summary.status_final!=='CONCLUIDO')return;
  $('#summary-section').classList.remove('hidden');
  const values=[['Duração simulada',`${Number(summary.duracao_minutos||0).toFixed(1)} min`],['Isquemia',`${Number(summary.isquemia_inicial_minutos||0).toFixed(0)} → ${Number(summary.isquemia_final_minutos||0).toFixed(0)} min`],['Margem final',`${Number(summary.margem_final_minutos||0).toFixed(0)} min`],['Temperatura',`${Number(summary.temperatura_min||0).toFixed(1)} / ${Number(summary.temperatura_max||0).toFixed(1)} °C`],['Umidade',`${Number(summary.umidade_min||0).toFixed(1)} / ${Number(summary.umidade_max||0).toFixed(1)}%`],['Impactos críticos',summary.impactos_criticos||0],['Alertas únicos',summary.numero_alertas||0],['Tempo na faixa',`${Number(summary.percentual_tempo_limites||0).toFixed(0)}%`],['Bateria final',`${Number(summary.bateria_final||0).toFixed(0)}%`],['Reotimizações',summary.quantidade_reotimizacoes||0],['Plano final',summary.plano_final?.modal||'—'],['Distância percorrida',`${Number(summary.plano_final?.distancia_percorrida_km||0).toFixed(1)} km`]];
  $('#summary-grid').innerHTML=values.map(([label,value])=>`<div><b>${value}</b><span>${label}</span></div>`).join('');
}
function renderQaStatus(qa){
  $('#qa-test-count').textContent=qa.passed===null?'PENDENTE':`${qa.passed} aprovados${qa.failed?` · ${qa.failed} falharam`:''}`;
  $('#qa-last-validation').textContent=qa.validatedAt?`${qa.status} · ${formatDate(qa.validatedAt)}`:'PENDENTE';
}async function refresh(){
  try{
    const transports=await api('/api/transportes');
    if(!transports.length)return;
    const transport=transports.find(item=>item.status!=='CONCLUIDO')||transports[0];
    transportId=transport.id;
    window.lifeBoxTransportId=transportId;
    const [readings,alerts,events,tracking,simulation,physics,qa]=await Promise.all([
      api(`/api/transportes/${transportId}/leituras?limite=100`),
      api(`/api/transportes/${transportId}/alertas`),
      api(`/api/transportes/${transportId}/eventos`),
      api(`/api/transportes/${transportId}/rastreabilidade`),
      api('/api/simulacao/status'),
      api(`/api/fisica/${transportId}`),
      api(`/api/qualidade`)
    ]);
    $('#transport-code').textContent=transport.codigo_transporte;
    $('#sim-status').textContent=simulation.running?'Executando':'Pausado';
    window.lifeBoxExecutionActive=Boolean(simulation.running);
    if(simulation.logistics){window.lifeBoxExecutionTracking={...tracking,...simulation.logistics};if(simulation.running&&!window.lifeBoxActiveExecutionPlan)window.lifeBoxActiveExecutionPlan={id:simulation.logistics.planId,modal:simulation.logistics.modal}}
    updateMetrics(readings[0]||simulation.initialTelemetry,transport);
    updateTracking(window.lifeBoxExecutionTracking||tracking);
    drawCharts(readings);
    renderAlerts(alerts);
    renderTimeline(events);
    renderPresentationAlert(transport,alerts);
    renderActuators(simulation.digitalSignal);
    renderPhysics(physics);
    renderQaStatus(qa);
    if(transport.status==='CONCLUIDO')await renderSummary();
    $('#system-status').textContent='Sistema online';
  }catch(error){
    $('#system-status').textContent='API indisponível';
    $('#system-dot').className='dot critical';
    console.error('[LifeBox] dashboard refresh failed:',error);
  }
}
document.addEventListener('click',async event=>{
  const action=event.target.dataset.action,scenario=event.target.dataset.scenario,resolve=event.target.dataset.resolve,dismiss=event.target.id==='dismiss-presentation-alert';
  if(dismiss){dismissedOverlayKey=$('#presentation-alert').dataset.key;$('#presentation-alert').classList.add('hidden');return}
  if(!action&&!scenario&&!resolve)return;
  try{
    if(action){
      if(action==='start'&&!window.lifeBoxCurrentPlan)throw new Error('Nenhum plano logístico factível disponível.');
      if(action==='reset'){
        dismissedOverlayKey=null;
        $('#presentation-alert').classList.add('hidden');
        renderActuators({ledOn:false,buzzerOn:false});
      }
      const simulationResponse=await api(`/api/simulacao/${action}`,{method:'POST',body:JSON.stringify({
        transporteId:transportId,rotaId:'LOGISTICS_PLAN',
        plan:window.lifeBoxCurrentPlan,result:window.lifeBoxPlanningResult
      })});
      if(action==='start'){window.lifeBoxExecutionActive=true;window.lifeBoxActiveExecutionPlan=window.lifeBoxCurrentPlan;window.lifeBoxExecutionTracking=simulationResponse.logistics}
      if(action==='reset'){window.lifeBoxExecutionActive=false;window.lifeBoxActiveExecutionPlan=null;window.lifeBoxReoptimizationRecommendation=null}
    }
    if(scenario)await api('/api/simulacao/cenario',{method:'POST',body:JSON.stringify({cenario:scenario,transporteId:transportId})});
    if(resolve)await api(`/api/alertas/${resolve}/resolver`,{method:'PATCH'});
    $('#action-feedback').textContent=scenario?`Cenário “${event.target.textContent.trim()}” ativado.`:'Comando executado.';
    await refresh();
  }catch(error){$('#action-feedback').textContent=error.message}
});
window.lifeBoxShowPlan=(plan,result,points)=>{
  window.lifeBoxPlanningActive=true;window.lifeBoxInspectedPlan=plan;
  if(!window.L){document.querySelector('#map .map-fallback').innerHTML='<strong>Biblioteca do mapa não carregada</strong><p>Verifique a conexão com o Leaflet.</p>';return}
  if(!map){
    map=L.map('map',{zoomControl:true}).setView([result.origin.latitude,result.origin.longitude],8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(map);
    layers.path=L.polyline([],{color:'#fff',weight:4,opacity:.95}).addTo(map);
    layers.current=createTrackingMarker([result.origin.latitude,result.origin.longitude]);
  }
  layers.planning?.forEach(item=>item.remove());layers.planning=[];
  const marker=(point,label)=>L.marker([point.latitude,point.longitude]).addTo(map).bindPopup(`${label}: ${point.icao?`${point.icao} — `:''}${point.name||''}`);
  layers.planning.push(marker(result.origin,'Hospital doador'),marker(result.destination,'Hospital receptor'));
  (plan.facilities||[]).forEach(facility=>{
    const facilityMarker=marker(facility,`${facility.type?.includes('AIRPORT')?'Aeroporto':'Infraestrutura'} · ${facility.classification==='REAL_OPEN_DATA'?'REAL':'SIMULADA'}`);
    if(facility.icao)facilityMarker.bindTooltip(`${facility.icao} · ${facility.name}`,{permanent:true,direction:'top'});
    layers.planning.push(facilityMarker);
  });
  (plan.segments||[]).forEach((segment,index)=>{
    const start=segment.origin||points[index],end=segment.destination||points[index+1];
    const geometry=(segment.geometry?.length?segment.geometry:[start,end]).filter(Boolean);
    if(geometry.length<2)return;
    const aerial=['AVIÃO','HELICÓPTERO'].includes(segment.modal);
    layers.planning.push(L.polyline(geometry.map(point=>[point.latitude,point.longitude]),{
      color:aerial?'#49a7ff':'#1ed6c5',weight:4,dashArray:aerial?'8 7':null
    }).addTo(map));
  });
  const all=[result.origin,result.destination,...(plan.facilities||[])];
  map.invalidateSize();map.fitBounds(L.latLngBounds(all.map(point=>[point.latitude,point.longitude])),{padding:[30,30]});
  $('#route-name').textContent=`${result.origin.name} → ${result.destination.name} · Plano: ${plan.modal}`;
  $('#map-mode').textContent='PLANEJAMENTO';
  const start=document.querySelector('[data-action="start"]');
  if(start)start.disabled=!plan.viavel;
  $('#start-requirement').textContent=plan.viavel?'Plano logístico factível disponível.':'Nenhum plano logístico factível disponível.';
};
refresh();setInterval(refresh,2000);window.addEventListener('resize',()=>map?.invalidateSize());
