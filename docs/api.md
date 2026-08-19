# API REST

| Método | Endpoint | Finalidade |
|---|---|---|
| GET | `/api/health` | Saúde da API |
| GET/POST | `/api/transportes` | Listar/criar transportes |
| GET | `/api/transportes/:id` | Detalhe |
| POST | `/api/transportes/:id/iniciar` | Iniciar |
| POST | `/api/transportes/:id/finalizar` | Finalizar |
| GET | `/api/transportes/:id/leituras` | Leituras |
| GET | `/api/transportes/:id/alertas` | Alertas |
| GET | `/api/transportes/:id/eventos` | Timeline |
| GET | `/api/transportes/:id/rastreabilidade` | Rota e progresso |
| GET | `/api/transportes/:id/resumo` | Resumo estatístico |
| POST | `/api/telemetria` | Receber dispositivo/simulador |
| PATCH | `/api/alertas/:id/resolver` | Resolver alerta |
| GET | `/api/simulacao/status` | Estado do simulador |
| POST | `/api/simulacao/start` | Iniciar |
| POST | `/api/simulacao/stop` | Pausar |
| POST | `/api/simulacao/reset` | Reiniciar posição/estado |
| POST | `/api/simulacao/cenario` | Ativar cenário |
| GET | `/api/otimizacao/candidatas` | Rotas e parâmetros demonstrativos |
| GET | `/api/otimizacao/:transporteId` | Última decisão persistida |
| POST | `/api/otimizacao/:transporteId/calcular` | Normalizar, filtrar e selecionar rota |
| GET | `/api/fisica/:transporteId` | Análise térmica, aceleração e elétrica |
