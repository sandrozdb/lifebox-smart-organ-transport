# Demo acadêmica — aproximadamente 3 minutos

## Preparação

Use **Reiniciar**, selecione o cenário conhecido e aguarde API, Leaflet e tiles estabilizarem. Confirme ausência de recomendação pendente. O projeto é acadêmico, simulado e não certifica preservação clínica.

## Roteiro

- **0:00–0:20 — problema e LifeBox:** transporte exige tempo, rastreabilidade e controle ambiental; a LifeBox integra monitoramento e apoio à decisão.
- **0:20–0:45 — perfil:** mostre faixa térmica, janela de isquemia, margem e separação entre fonte científica e parâmetro acadêmico.
- **0:45–1:10 — PO:** calcule o plano, compare alternativas factíveis/inviáveis e destaque `MIN C_total` dentro do conjunto enumerado.
- **1:10–1:30 — execução:** inicie e mostre mapa, segmento, posição, tempo, isquemia e margem.
- **1:30–1:50 — ocorrência:** ative temperatura ou impacto; mostre alerta, timeline e `ATIVO AND (TEMP_CRÍTICA OR IMPACTO_CRÍTICO)`.
- **1:50–2:20 — reotimização:** altere uma condição logística, mostre a recomendação, confirme e destaque preservação de caminho, tempo e isquemia.
- **2:20–2:40 — Física e Eletrônica:** apresente fórmulas didáticas e circuito Logisim.
- **2:40–3:00 — arquitetura e QA:** C4, Strategy, Observer, testes/CI e Cloud ainda **PENDENTE**.

## Modelo legado

O modelo A/B/C de score ponderado permanece apenas para compatibilidade/histórico nos endpoints `/api/otimizacao`. Ele não faz parte da demo principal. A PO atual é o planejamento multimodal em `/api/planejamento`.

## Plano B sem internet

Se os tiles OSM não carregarem, não improvise cache irregular. Use as evidências em [`docs/evidencias`](evidencias/README.md) e continue demonstrando coordenadas, segmentos, API, isquemia, Física, alertas e reotimização.
