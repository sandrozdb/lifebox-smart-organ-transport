# Demo acadêmica — aproximadamente 3 minutos

## Preparação

Preferencialmente abra o deploy público em `https://lifebox-expotech.onrender.com`. Como a instância gratuita pode entrar em suspensão por inatividade, acesse a URL alguns minutos antes da apresentação e aguarde o serviço ficar responsivo.

Use **Reiniciar**, selecione o cenário conhecido e aguarde API, Leaflet e tiles estabilizarem. Confirme ausência de recomendação pendente. O projeto é acadêmico, simulado e não certifica preservação clínica.

## Roteiro

- **0:00–0:20 — problema e LifeBox:** transporte exige tempo, rastreabilidade e controle ambiental; a LifeBox integra monitoramento e apoio à decisão.
- **0:20–0:45 — perfil:** mostre faixa térmica, janela de isquemia, margem e separação entre fonte científica e parâmetro acadêmico.
- **0:45–1:10 — PO:** calcule o plano, compare alternativas factíveis/inviáveis e destaque `MIN C_total` dentro do conjunto enumerado.
- **1:10–1:30 — execução:** inicie e mostre mapa, segmento, posição, tempo, isquemia e margem.
- **1:30–1:50 — ocorrência:** ative temperatura ou impacto; mostre alerta, timeline e `ATIVO AND (TEMP_CRÍTICA OR IMPACTO_CRÍTICO)`.
- **1:50–2:20 — reotimização:** altere uma condição logística, mostre a recomendação, confirme e destaque preservação de caminho, tempo e isquemia.
- **2:20–2:40 — Física e Eletrônica:** apresente fórmulas didáticas e circuito Logisim.
- **2:40–3:00 — arquitetura, QA e Cloud:** mostre C4, Strategy, Observer, CI e explique que o backend está em Docker no Render, com Aiven MySQL gerenciado via TLS e Auto Deploy a partir da `main`.

## Modelo legado

O modelo A/B/C de score ponderado permanece apenas para compatibilidade/histórico nos endpoints `/api/otimizacao`. Ele não faz parte da demo principal. A PO atual é o planejamento multimodal em `/api/planejamento`.

## Evidência rápida de Cloud

Se houver tempo, abra `https://lifebox-expotech.onrender.com/api/health` para demonstrar o backend público. A persistência no Aiven e o Auto Deploy estão documentados em `docs/cloud.md`, `docs/ci-cd.md` e `docs/deployment-checklist.md`.

## Plano B sem internet

Se os tiles OSM ou o deploy público não estiverem acessíveis, use a execução local e as evidências em [`docs/evidencias`](evidencias/README.md). Continue demonstrando coordenadas, segmentos, API, isquemia, Física, alertas e reotimização. Para a parte Cloud, use a documentação e as evidências já registradas no repositório.
