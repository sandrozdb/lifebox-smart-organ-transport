(()=>{
  const $=selector=>document.querySelector(selector);
  let profiles=[],scenarios=[],activeScenario,activeConditions={},lastResult,lastShown;
  const api=async(path,options={})=>{
    const response=await fetch(path,{headers:{'Content-Type':'application/json'},...options});
    const data=await response.json();
    if(!response.ok)throw Error(data.erro||'Falha');
    return data;
  };
  const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
  const reasonLabel=key=>({
    delay40:'Atraso logístico de 40 min',traffic30:'Aumento de 30% no tempo terrestre',
    helicopterUnavailable:'Helicóptero indisponível',airportUnavailable:'Aeroporto indisponível',
    airCost20:'Aumento de 20% no custo aéreo',consumed30:'Acréscimo de 30 min no tempo de isquemia',
    groundRouteUnavailable:'Rodovia Anhanguera indisponível'
  }[key]||'Condição operacional atualizada');
  const profile=()=>profiles.find(item=>item.code===$('#planning-organ').value);
  const clone=value=>JSON.parse(JSON.stringify(value));
  function renderProfile(){
    const item=profile();if(!item)return;
    window.lifeBoxActiveProfile=item;
    $('#planning-profile').innerHTML=`<b>PERFIL DE PRESERVAÇÃO · ${item.name.toUpperCase()}</b><span>SCS</span><span>${item.preservation.referenceRangeC.join('–')} °C <em>CIENTÍFICO</em></span><span>Alvo acadêmico: ${item.preservation.targetTemperatureC} °C</span><span>Janela: ${item.ischemia.officialMaxMinutes} min <em>OFICIAL</em></span><span>Margem: ${item.ischemia.operationalSafetyMarginMinutes} min</span>`;
  }
  function science(){
    const item=profile(),element=$('#planning-science-panel');
    element.innerHTML=`<h4>Base científica — ${item.name}</h4>${item.preservation.sources.map(source=>`<p><b>${source.classification==='OFFICIAL_DATA'?'DADO OFICIAL':'DADO CIENTÍFICO'}</b> · <a href="${source.url}" target="_blank" rel="noreferrer">${source.title} (${source.year})</a></p>`).join('')}<p>Temperatura-alvo e margens são premissas acadêmicas do modelo.</p>`;
    element.classList.toggle('hidden');
  }
  function scenario(){return scenarios.find(item=>item.id===$('#planning-scenario').value)}
  function setScenario(){
    activeScenario=scenario();activeConditions=clone(activeScenario.conditions||{});
    $('#planning-organ').value=activeScenario.organCode;
    $('#planning-consumed').value=activeScenario.consumedMinutes;
    $('#planning-origin').value=activeScenario.origin.name;
    $('#planning-destination').value=activeScenario.destination.name;
    $('#planning-description').textContent=activeScenario.description;
    renderProfile();clearLogisticButtons();calculate();
  }
  function clearLogisticButtons(){document.querySelectorAll('[data-logistic]').forEach(button=>button.classList.remove('active'))}
  function toggleLogistic(button){
    const key=button.dataset.logistic,active=button.classList.toggle('active');
    if(key==='traffic30')activeConditions.trafficIncrease=active?.3:0;
    if(key==='groundRouteUnavailable')activeConditions.groundRouteUnavailable=active?'GROUND_ANHANGUERA':null;
    if(key==='delay40')activeConditions.delayMinutes=active?40:0;
    if(key==='helicopterUnavailable'){
      activeConditions.modalAvailability=activeConditions.modalAvailability||{};
      activeConditions.modalAvailability.HELICOPTER=!active;
    }
    if(key==='airportUnavailable'){
      activeConditions.infrastructureAvailability=activeConditions.infrastructureAvailability||{};
      activeConditions.infrastructureAvailability.AIRPORT_ORIGIN=!active;
      activeConditions.infrastructureAvailability.AIRPORT_DESTINATION=!active;
    }
    if(key==='airCost20')activeConditions.airCostIncrease=active?.2:0;
    if(key==='consumed30')activeConditions.extraConsumedMinutes=active?30:0;
    calculate(key);
  }
  function payload(reoptimize=false){
    const custom=$('#planning-custom').checked;
    const tracking=window.lifeBoxExecutionTracking;
    const currentOrigin=reoptimize&&tracking?.current
      ?{name:'Posição atual da LifeBox',latitude:tracking.current.latitude,longitude:tracking.current.longitude}
      :null;
    return {
      organCode:profile().code,
      consumedMinutes:reoptimize&&tracking?.ischemiaTotalMinutes!==undefined
        ?Number(tracking.ischemiaTotalMinutes):Number($('#planning-consumed').value||0),
      origin:currentOrigin||(custom?{query:$('#planning-origin').value}:activeScenario.origin),
      destination:custom?{query:$('#planning-destination').value}:activeScenario.destination,
      conditions:activeConditions
    };
  }
  function planPoints(plan){
    const lookup={};
    [lastResult.origin,lastResult.destination,...(plan.facilities||[])].forEach(point=>lookup[point.name]=point);
    const points=[];
    plan.segments.forEach(segment=>{
      if(lookup[segment.from])points.push({...lookup[segment.from],modal:segment.modal});
      if(lookup[segment.to])points.push({...lookup[segment.to],modal:segment.modal});
    });
    return points.filter((point,index,all)=>index===0||point.latitude!==all[index-1].latitude||point.longitude!==all[index-1].longitude);
  }
  function showOnMap(plan){lastShown=plan;if(plan&&window.lifeBoxShowPlan)window.lifeBoxShowPlan(plan,lastResult,planPoints(plan))}
  function reoptimizationMarkup(recommendation){
    return `<p class="reoptimization"><b>REOTIMIZAÇÃO DA PO · ${recommendation.status}</b><br>Plano atual: ${recommendation.currentPlan?.modal||'Sem solução viável'}<br>Plano recomendado: ${recommendation.plan.modal}<br>Motivo da reotimização: ${reasonLabel(recommendation.reason)}<br><button id="apply-reoptimization" class="primary">APLICAR NOVO PLANO</button></p>`;
  }
  function render(result,reason){
    const previous=lastResult?.selected;
    lastResult=result;window.lifeBoxPlanningResult=result;
    const selected=result.selected,res=$('#planning-result');
    res.className='planning-result';
    res.innerHTML=selected?`<strong>PLANO ÓTIMO · ${selected.modal}</strong><span>${result.origin.name} → ${result.destination.name}</span><span>${selected.timeMin.toFixed(0)} min · ${money(selected.cost)} · margem ${selected.marginMinutes.toFixed(0)} min · FACTÍVEL</span>${selected.groundRoute?`<span>Via: ${selected.groundRoute.via} · pedágio demonstrativo: ${money(selected.groundRoute.toll)}</span>`:''}<p>Menor custo entre as alternativas que satisfazem as restrições do órgão.</p>`:`<strong>NENHUMA SOLUÇÃO VIÁVEL</strong><span>O sistema não força uma alternativa vencedora.</span>`;
    const activePlan=window.lifeBoxActiveExecutionPlan;
    if(reason&&window.lifeBoxExecutionActive&&selected&&activePlan?.id!==selected.id){
      window.lifeBoxReoptimizationRecommendation={status:'RECOMENDADA',plan:selected,result,reason,currentPlan:activePlan};
      res.insertAdjacentHTML('beforeend',reoptimizationMarkup(window.lifeBoxReoptimizationRecommendation));
    }else if(reason&&previous?.id!==selected?.id){
      res.insertAdjacentHTML('beforeend',`<p class="reoptimization"><b>REOTIMIZAÇÃO DA PO</b><br>Plano anterior: ${previous?.modal||'Sem solução viável'} · Novo plano: ${selected?.modal||'SEM SOLUÇÃO VIÁVEL'}<br>Motivo da reotimização: ${reasonLabel(reason)}</p>`);
    }
    $('#planning-table').innerHTML=result.alternatives.map(item=>`<tr data-plan="${item.id}" class="${item.selected?'route-selected':''} ${item.status==='FACTIVEL'?'':'route-infeasible'}"><td>${item.name}${item.groundRoute?`<br><small>Via: ${item.groundRoute.via}</small>`:''}<br><button data-view-plan="${item.id}">VER NO MAPA</button></td><td>${item.modal}</td><td>${item.timeMin.toFixed(0)} min</td><td>${money(item.cost)}</td><td>${item.marginMinutes.toFixed(0)} min</td><td>${item.status}</td><td>${item.motivo}</td></tr>`).join('');
    $('#planning-calculations').innerHTML=`<div class="po-math-card"><h4>MODELO MATEMÁTICO</h4><b>FUNÇÃO OBJETIVO</b><strong>MIN C_total</strong><p>C_total = soma dos custos dos segmentos + acionamento + preparação + transferências</p><b>RESTRIÇÕES</b><ul>${result.constraints.map(item=>`<li>${item}</li>`).join('')}</ul></div><h4>ANÁLISE DAS ALTERNATIVAS</h4><div class="po-alternatives">${result.alternatives.map(item=>`<article class="po-alternative status-${item.status}"><header><b>${item.name}</b><span>${item.modal}</span></header><div class="po-values"><span>Tempo total<strong>${item.timeMin.toFixed(0)} min</strong></span><span>Custo total<strong>${money(item.cost)}</strong></span><span>Margem<strong>${item.marginMinutes.toFixed(0)} min</strong></span></div><p class="po-status">${item.status.replace('_',' ')}</p><p>${item.motivo}</p><details><summary>VER COMPOSIÇÃO DO PLANO</summary>${item.segments.map((segment,index)=>`<div class="po-segment"><b>Trecho ${index+1}</b><span>${segment.from} → ${segment.to}</span><span>${segment.modal} · ${segment.distanceKm.toFixed(1)} km · ${segment.timeMin.toFixed(0)} min · ${money(segment.cost)}</span></div>`).join('')}</details></article>`).join('')}</div><article class="po-solution"><h4>SOLUÇÃO ÓTIMA</h4>${selected?`<b>${selected.modal}</b><p>Tempo: ${selected.timeMin.toFixed(0)} min · Custo: ${money(selected.cost)} · Margem: ${selected.marginMinutes.toFixed(0)} min</p><p>Menor custo entre todas as alternativas que atendem às restrições.</p>`:'<p>Nenhum plano logístico factível disponível.</p>'}</article>`;
    showOnMap(selected||result.alternatives[0]);
    if(!window.lifeBoxExecutionActive)window.lifeBoxCurrentPlan=selected;
  }
  async function calculate(reason){
    try{
      $('#planning-result').textContent='Calculando planos...';
      const reoptimize=Boolean(reason&&window.lifeBoxExecutionActive&&window.lifeBoxExecutionTracking?.current);
      render(await api('/api/planejamento/calcular',{method:'POST',body:JSON.stringify(payload(reoptimize))}),reason);
    }catch(error){$('#planning-result').textContent=error.message}
  }
  async function applyRecommendation(){
    const recommendation=window.lifeBoxReoptimizationRecommendation;
    if(!recommendation)return;
    try{
      await api('/api/simulacao/reotimizar/aplicar',{method:'POST',body:JSON.stringify({
        transporteId:window.lifeBoxTransportId,plan:recommendation.plan,result:recommendation.result,
        reason:reasonLabel(recommendation.reason)
      })});
      window.lifeBoxActiveExecutionPlan=recommendation.plan;
      window.lifeBoxCurrentPlan=recommendation.plan;
      recommendation.status='APLICADA';
      $('#planning-result').insertAdjacentHTML('beforeend',`<p class="reoptimization"><b>REOTIMIZAÇÃO APLICADA</b><br>O plano ativo foi atualizado a partir da posição atual. Tempo, isquemia e caminho já percorrido foram preservados.</p>`);
      window.lifeBoxReoptimizationRecommendation=null;
    }catch(error){$('#planning-result').insertAdjacentHTML('beforeend',`<p class="reoptimization">Não foi possível aplicar a reotimização: ${error.message}</p>`)}
  }
  function custom(){$('#planning-custom-fields').classList.toggle('hidden',!$('#planning-custom').checked)}
  async function init(){
    [profiles,scenarios]=await Promise.all([api('/api/planejamento/perfis'),api('/api/planejamento/cenarios')]);
    $('#planning-organ').innerHTML=profiles.map(item=>`<option value="${item.code}">${item.name}</option>`).join('');
    $('#planning-scenario').innerHTML=scenarios.map(item=>`<option value="${item.id}">${item.name}</option>`).join('');
    setScenario();
    $('#planning-scenario').onchange=setScenario;
    $('#planning-organ').onchange=renderProfile;
    $('#planning-science').onclick=science;
    $('#planning-calculate').onclick=()=>calculate();
    $('#planning-custom').onchange=custom;
    $('#planning-table').onclick=event=>{const id=event.target.dataset.viewPlan;if(id)showOnMap(lastResult.alternatives.find(item=>item.id===id))};
    $('#planning-back-optimal').onclick=()=>showOnMap(lastResult.selected);
    document.querySelectorAll('[data-logistic]').forEach(button=>button.onclick=()=>toggleLogistic(button));
    document.addEventListener('click',event=>{if(event.target.id==='apply-reoptimization')applyRecommendation()});
    window.lifeBoxRecalculate=reason=>calculate(reason);
    window.lifeBoxResetLogistics=()=>setScenario();
  }
  init().catch(console.error);
})();
