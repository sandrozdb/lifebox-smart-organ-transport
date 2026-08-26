# Pesquisa Operacional Logística — LifeBox

> Custos, velocidades, riscos, disponibilidade, infraestrutura e geometrias sem provider externo são premissas **SIMULATED** para fins acadêmicos. O módulo apoia decisão; não substitui coordenação clínica ou logística real.

## Problema de decisão

A LifeBox seleciona o plano logístico de menor custo total dentro do conjunto de alternativas factíveis:

```text
min C_total = soma(custos dos segmentos) + acionamento + preparação + transferências
```

A escolha só acontece quando todas as restrições são atendidas:

- janela máxima de isquemia do órgão;
- isquemia já consumida + tempo simulado previsto;
- margem operacional mínima;
- disponibilidade modal e de infraestrutura;
- perfil de preservação adotado;
- condições logísticas, tempo e risco.

O desempate implementado é: menor custo, maior margem, menor tempo e menor risco.

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

- Curta distância — Modal terrestre;
- Urgência regional — Helicóptero;
- Longa distância interestadual — Plano aéreo multimodal;
- Transporte crítico multimodal — Helicóptero + Avião;
- Janela crítica — nenhuma solução viável.

## Reotimização

Uma condição logística pode disparar novo cálculo. O plano ativo não muda automaticamente:

```text
condição muda → PO recalcula → recomendação → operador avalia → APLICAR NOVO PLANO
```

Quando aplicada, a nova execução parte da posição atual e preserva caminho percorrido, distância, tempo simulado e isquemia. A timeline registra `REOTIMIZACAO_APLICADA`.

O cenário demonstrativo **Anhanguera indisponível** elimina essa alternativa terrestre e permite recomendar a Rodovia dos Bandeirantes sem reiniciar a execução.

## Transparência

O dashboard apresenta cenários, órgão, faixa, isquemia, restrições, alternativas, custo, tempo, margem, composição dos segmentos e solução ótima em área expansível. Não utiliza a antiga apresentação Rota A/Rota B/Rota C.
