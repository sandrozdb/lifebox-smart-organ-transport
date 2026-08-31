# API REST

Bases disponíveis:

- pública atual: `https://lifebox-expotech-iot-test.onrender.com/api`;
- local: `http://localhost:3000/api`.

Payloads são JSON. Erros seguem:

```json
{ "error": "Mensagem segura", "code": "MACHINE_READABLE_CODE", "details": {} }
```

Erros previsíveis usam `400` (estrutura/ID inválido), `404` (recurso ausente), `409` (conflito de estado) ou `422` (campo semanticamente inválido). Stack, SQL, caminhos locais e credenciais não são retornados.

A URL pública é uma demonstração acadêmica. Não envie dados clínicos, pessoais ou operacionais sensíveis.

## Saúde e qualidade

| Método e path | Objetivo | Resposta/status |
| --- | --- | --- |
| `GET /health` | Verificar API e, com driver MySQL, conexão. | `200`; `503 SERVICE_UNAVAILABLE`. |
| `GET /qualidade` | Último resultado de QA publicado. | `200`; baseline versionado quando não há arquivo local. |

Health público: `https://lifebox-expotech-iot-test.onrender.com/api/health`.

## IoT

| Método e path | Entrada | Resultado |
| --- | --- | --- |
| `GET /iot/status?deviceId=...` | `deviceId` opcional | modo, dispositivo, transporte, perfil térmico e `digitalSignal` |
| `PUT /iot/mode` | `{ "mode": "IOT" }` ou `{ "mode": "DEMO" }` | altera a fonte de telemetria do dashboard |
| `PUT /iot/profile` | `{ "organCode": "KIDNEY" }` | publica perfil térmico; durante execução ativa respeita o perfil congelado |
| `POST /telemetria` | leitura física/simulada | persiste leitura e processa regras/alertas |

No modo IOT, o ESP32/Wokwi consulta `/iot/status` e envia telemetria por `/telemetria`. O dispositivo não define `execucao_id`: o backend associa a leitura ao `execucao_atual_id` do transporte antes da persistência. Um `executionId` arbitrário enviado pelo cliente não substitui a decisão server-side.

Os cenários manuais de Temperatura, Impacto, Umidade, Bateria e Sinal permanecem bloqueados em IOT. Condições Logísticas continuam disponíveis ao operador e usam o mesmo fluxo de reotimização segura do DEMO.

Detalhes em [`iot.md`](iot.md).

## Planejamento principal

| Método e path | Entrada | Resultado |
| --- | --- | --- |
| `GET /planejamento/perfis` | — | Perfis de órgãos. |
| `GET /planejamento/perfis/:code` | Código como `HEART`. | `200`; `404` se ausente. |
| `GET /planejamento/cenarios` | — | Cenários acadêmicos. |
| `POST /planejamento/geocodificar` | `{ "query": "...", "role": "origin" }` | Ponto conhecido/simulado; `400/422` se inválido. |
| `POST /planejamento/calcular` | `organCode`, `origin`, `destination`, `consumedMinutes`, `conditions`. | Alternativas, restrições, factibilidade e plano de menor custo. |

Exemplo mínimo:

```json
{
  "organCode": "HEART",
  "consumedMinutes": 45,
  "origin": { "name": "São Paulo", "latitude": -23.55, "longitude": -46.63 },
  "destination": { "name": "Brasília", "latitude": -15.79, "longitude": -47.88 }
}
```

## Transporte, telemetria e resumo

| Método e path | Objetivo | Status relevante |
| --- | --- | --- |
| `GET /transportes` | Listar transportes. | `200` |
| `POST /transportes` | Criar transporte com código, caixa, órgão, hospitais e coordenadas. | `201`; `422` para campos inválidos. |
| `GET /transportes/:id` | Obter transporte. | `200`, `400`, `404` |
| `POST /transportes/:id/iniciar` | Iniciar ciclo persistido. | `200`, `404`, `409` |
| `POST /transportes/:id/finalizar` | Finalizar ciclo. | `200`, `404`, `409` |
| `GET /transportes/:id/leituras?limite=100` | Leituras da execução corrente. | `200`; limite máximo 1000. |
| `GET /transportes/:id/alertas` | Alertas do transporte/execução. | `200` |
| `GET /transportes/:id/eventos` | Timeline. | `200` |
| `GET /transportes/:id/rastreabilidade` | Plano, posição e progresso. | `200`, `404` |
| `GET /transportes/:id/resumo` | Resumo da execução atual/concluída. | `200`, `404/409` |
| `POST /telemetria` | Registrar leitura de dispositivo/simulador. | `201`, `404`, `409`, `422` |
| `PATCH /alertas/:id/resolver` | Resolver alerta. | `200`, `400`, `404` |

Telemetria exige `transporteId`, `deviceId`, temperatura, umidade, aceleração/impacto, latitude, longitude, velocidade, bateria e sinal. Percentuais aceitam `0–100`.

## Simulação e reotimização segura

| Método e path | Entrada | Resultado |
| --- | --- | --- |
| `GET /simulacao/status` | — | Estado atual. |
| `POST /simulacao/start` | `transporteId`, `rotaId` e, na PO principal, plano/result calculados. | Inicia execução. |
| `POST /simulacao/stop` | — | Pausa execução. |
| `POST /simulacao/reset` | `transporteId` | Limpa estado em memória. |
| `POST /simulacao/cenario` | `cenario`, `transporteId` | Ativa cenário permitido; condições da caixa são bloqueadas em IOT. |
| `POST /simulacao/reotimizar/recomendar` | `transporteId`, `reason`, `conditions` | `201` com `recommendationId`, plano e validade. |
| `POST /simulacao/reotimizar/aplicar` | Apenas `transporteId` e `recommendationId`. | Revalida server-side e aplica; `404/409/422` em erro. |

O endpoint de aplicação ignora qualquer custo, segmento, distância, geometria ou modal arbitrário adicional. A recomendação é vinculada ao transporte e à execução, expira, não aceita replay e é recalculada antes da substituição.

## Física

`GET /fisica/:transporteId` retorna análise térmica, aceleração, potência, energia e autonomia didáticas da execução corrente. Em IOT, a análise usa leituras físicas do Wokwi vinculadas server-side à execução ativa.

## Modelo legado A/B/C

Estes endpoints permanecem por compatibilidade e histórico acadêmico. **Não são a PO principal exibida na demo.**

| Método e path | Objetivo |
| --- | --- |
| `GET /otimizacao/candidatas/:transporteId` | Candidatos determinísticos do modelo legado. |
| `GET /otimizacao/:transporteId` | Última decisão ponderada persistida. |
| `POST /otimizacao/:transporteId/calcular` | Normalização, restrições e score ponderado legado. |

O modelo principal é `/planejamento/calcular`: otimização discreta por enumeração de alternativas multimodais factíveis.
