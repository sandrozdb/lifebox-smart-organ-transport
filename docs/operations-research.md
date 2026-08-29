# Pesquisa Operacional Logística — LifeBox

> Custos, velocidades, riscos, disponibilidade, infraestrutura e geometrias sem provider externo são premissas **SIMULATED** para fins acadêmicos. O módulo apoia decisão; não substitui coordenação clínica ou logística real.

## Problema de otimização discreta por enumeração

A LifeBox enumera um conjunto finito de planos multimodais e seleciona o plano de menor custo entre as alternativas factíveis:

```text
min C_total = soma(custos dos segmentos) + acionamento + preparação + transferências
```

A escolha só acontece quando todas as restrições são atendidas:

- janela máxima de isquemia do órgão;
- isquemia já consumida + tempo simulado previsto;
- margem operacional mínima;
- disponibilidade modal e de infraestrutura;
- perfil de preservação adotado como contexto do órgão;
- condições logísticas e infraestrutura.

O desempate implementado é: menor custo, maior margem, menor tempo e menor risco.

Para cada alternativa enumerada, pode-se interpretar `xᵢ ∈ {0,1}` e `Σxᵢ = 1` entre as alternativas elegíveis. O sistema não usa MILP, solver ou programação inteira: a optimalidade é garantida somente dentro do conjunto finito que as Strategies geram.

## Planejamento em dois níveis

1. Cada estratégia constrói e avalia suas alternativas: terrestre, helicóptero e aéreo multimodal.
2. Os melhores planos factíveis são comparados globalmente para obter a solução recomendada.

`GroundRoutingProvider` fornece alternativas terrestres. Na ausência de provider externo, as opções como Rodovia dos Bandeirantes e Rodovia Anhanguera são geometrias e condições **SIMULATED**, não cálculo de roteamento real.

## Planos e segmentos

Um plano é composto por segmentos. Pode ser terrestre, helicóptero ou multimodal. Todo plano aéreo inclui acesso e saída do aeroporto:

```text
Hospital → TERRESTRE ou HELICÓPTERO → aeroporto origem
         → AVIÃO → aeroporto destino
         → TERRESTRE ou HELICÓPTERO → hospital
```

Os aeroportos configurados são identificados por ICAO; infraestrutura de helicóptero é marcada como `SIMULATED` ou premissa acadêmica quando não houver confirmação real.

## Cenários demonstrativos

- 01 · Terrestre · Rodovia Anhanguera;
- 02 · Terrestre · Rodovia dos Bandeirantes;
- 03 · Terrestre · Rota estimada;
- 04 · Helicóptero porta a porta;
- 05 · Terrestre + Helicóptero + Terrestre;
- 06 · Terrestre + Avião + Terrestre;
- 07 · Helicóptero + Avião + Terrestre;
- 08 · Terrestre + Avião + Helicóptero;
- 09 · Helicóptero + Avião + Helicóptero;
- 10 · Nenhum plano factível.

Os exemplos alternam entre coração, pulmão, rim, fígado, pâncreas e intestino,
com diferentes tempos de isquemia já consumida. Cada combinação permanece
dentro das restrições do perfil demonstrado, exceto o cenário 10, configurado
deliberadamente sem solução factível.

As origens e os destinos também variam entre corredores regionais e
interestaduais das regiões Sul, Sudeste, Nordeste, Norte e Centro-Oeste. Nos
planos aéreos, os aeroportos são associados automaticamente às capitais de cada
cenário.

## Reotimização server-side

Uma condição logística pode disparar novo cálculo. O plano ativo não muda automaticamente:

```text
condição muda → PO recalcula → recomendação → operador avalia → APLICAR NOVO PLANO
```

Quando aplicada, a nova execução parte da posição atual e preserva caminho percorrido, distância, tempo simulado e isquemia. A timeline registra `REOTIMIZACAO_APLICADA`.

O backend emite um `recommendationId` vinculado a transporte e execução. Na confirmação, ele verifica validade e replay, recalcula a alternativa a partir do snapshot atual e não confia em custo, segmentos, geometria ou modal fornecidos pelo frontend.

A condição atual de interface **Transporte terrestre indisponível** elimina a rota terrestre ativa e força novo cálculo entre os modais ainda disponíveis. O caso interno/histórico que indisponibiliza especificamente a Anhanguera e recomenda a Bandeirantes permanece coberto por teste, sem ser apresentado como nome do controle atual.

## Transparência

O dashboard apresenta cenários, órgão, faixa, isquemia, restrições, alternativas, custo, tempo, margem, composição dos segmentos e solução ótima em área expansível. Não utiliza a antiga apresentação Rota A/Rota B/Rota C.

## Modelo legado A/B/C

`routeOptimizationService`, `weightedRouteScoringStrategy`, `operationsResearch.js`, suas tabelas e endpoints `/api/otimizacao` são mantidos como **LEGACY / COMPATIBILIDADE / HISTÓRICO**. Esse modelo normaliza candidatos e aplica score ponderado; não é a PO principal atual e não deve ser apresentado como tal.
