# API REST

Bases disponíveis:

- produção: `https://lifebox-expotech.onrender.com/api`;
- local: `http://localhost:3000/api`.

Payloads são JSON. Erros seguem:

```json
{ "error": "Mensagem segura", "code": "MACHINE_READABLE_CODE", "details": {} }
```

Erros previsíveis usam `400` (estrutura/ID inválido), `404` (recurso ausente), `409` (conflito de estado) ou `422` (campo semanticamente inválido). Stack, SQL, caminhos locais e credenciais não são retornados.

A URL pública é uma demonstração acadêmica. Não envie dados clínicos, pessoais ou operacionais sensíveis.

## Saúde e qualidade

| Método e path    | Objetivo                                      | Resposta/status                                        |
| ---------------- | --------------------------------------------- | ------------------------------------------------------ |
| `GET /health`    | Verificar API e, com driver MySQL, conexão.   | `200`; `503 SERVICE_UNAVAILABLE`.                      |
| `GET /qualidade` | Último resultado de QA registrado localmente. | `200`; pode ser `PENDENTE` antes da primeira execução. |

Health público: `https://lifebox-expotech.onrender.com/api/health`.

## Planejamento principal

| Método e path                     | Entrada                                                                | Resultado                                                       |
| --------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `GET /planejamento/perfis`        | —                                                                      | Perfis de órgãos.                                               |
| `GET /planejamento/perfis/:code`  | Código como `HEART`.                                                   | `200`; `404` se ausente.                                        |
| `GET /planejamento/cenarios`      | —                                                                      | Cenários acadêmicos.                                            |
| `POST /planejamento/geocodificar` | `{ "query": "...", "role": "origin" }`                         | Ponto conhecido/simulado; `400/422` se inválido.                |
| `POST /planejamento/calcular`     | `organCode`, `origin`, `destination`, `consumedMinutes`, `conditions`. | Alternativas, restrições, factibilidade e plano de menor custo. |

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

| Método e path                              | Objetivo                                                            | Status relevante                    |
| ------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------- |
| `GET /transportes`                         | Listar transportes.                                                 | `200`                               |
| `POST /transportes`                        | Criar transporte com código, caixa, órgão, hospitais e coordenadas. | `201`; `422` para campos inválidos. |
| `GET /transportes/:id`                     | Obter transporte.                                                   | `200`, `400`, `404`                 |
| `POST /transportes/:id/iniciar`            | Iniciar ciclo persistido.                                           | `200`, `404`, `409`                 |
| `POST /transportes/:id/finalizar`          | Finalizar ciclo.                                                    | `200`, `404`, `409`                 |
| `GET /transportes/:id/leituras?limite=100` | Leituras recentes.                                                  | `200`; limite máximo 1000.          |
| `GET /transportes/:id/alertas`             | Alertas do transporte/execução.                                     | `200`                               |
| `GET /transportes/:id/eventos`             | Timeline.                                                           | `200`                               |
| `GET /transportes/:id/rastreabilidade`     | Plano, posição e progresso.                                         | `200`, `404`                        |
| `GET /transportes/:id/resumo`              | Resumo da execução atual/concluída.                                 | `200`, `404/409`                    |
| `POST /telemetria`                         | Registrar leitura de dispositivo/simulador.                         | `201`, `404`, `422`                 |
| `PATCH /alertas/:id/resolver`              | Resolver alerta.                                                    | `200`, `400`, `404`                 |

Telemetria exige `transporteId`, `deviceId`, temperatura, umidade, aceleração/impacto, latitude, longitude, velocidade, bateria e sinal. Percentuais aceitam `0–100`.

## Simulação e reotimização segura

| Método e path                           | Entrada                                                               | Resultado                                             |
| --------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| `GET /simulacao/status`                 | —                                                                     | Estado atual.                                         |
| `POST /simulacao/start`                 | `transporteId`, `rotaId` e, na PO principal, plano/result calculados. | Inicia execução.                                      |
| `POST /simulacao/stop`                  | —                                                                     | Pausa execução.                                       |
| `POST /simulacao/reset`                 | `transporteId`                                                        | Limpa estado em memória.                              |
| `POST /simulacao/cenario`               | `cenario`, `transporteId`                                             | Ativa cenário permitido.                              |
| `POST /simulacao/reotimizar/recomendar` | `transporteId`, `reason`, `conditions`                                | `201` com `recommendationId`, plano e validade.       |
| `POST /simulacao/reotimizar/aplicar`    | Apenas `transporteId` e `recommendationId`.                           | Revalida server-side e aplica; `404/409/422` em erro. |

O endpoint de aplicação ignora qualquer custo, segmento, distância, geometria ou modal arbitrário adicional. A recomendação é vinculada ao transporte e à execução, expira, não aceita replay e é recalculada antes da substituição.

## Física

`GET /fisica/:transporteId` retorna análise térmica, aceleração, potência, energia e autonomia didáticas. IDs inválidos usam `400`; transporte ausente usa `404` quando aplicável.

## Modelo legado A/B/C

Estes endpoints permanecem por compatibilidade e histórico acadêmico. **Não são a PO principal exibida na demo.**

| Método e path                              | Objetivo                                           |
| ------------------------------------------ | -------------------------------------------------- |
| `GET /otimizacao/candidatas/:transporteId` | Candidatos determinísticos do modelo legado.       |
| `GET /otimizacao/:transporteId`            | Última decisão ponderada persistida.               |
| `POST /otimizacao/:transporteId/calcular`  | Normalização, restrições e score ponderado legado. |

O modelo principal é `/planejamento/calcular`: otimização discreta por enumeração de alternativas multimodais factíveis.
