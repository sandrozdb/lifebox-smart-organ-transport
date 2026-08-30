# Contrato de telemetria

Endpoint: `POST /api/telemetria`, conteúdo `application/json`.

O retorno `201` contém `digitalSignal`. O dispositivo deve aplicar `ledOn` e `buzzerOn` sem recalcular regras críticas localmente.

Controle bidirecional: `GET /api/iot/status` retorna `mode`, `scenario`, `online`, `telemetry` e o último `digitalSignal`. O dashboard altera a fonte com `PUT /api/iot/mode`, usando `{ "mode": "IOT" }` ou `{ "mode": "DEMO" }`.

Campos obrigatórios: `transporteId`, `deviceId`, `temperatura`, `umidade`, `aceleracao`, `impacto`, `latitude`, `longitude`, `velocidade`, `bateria`, `sinal` e `timestamp` ISO 8601. `aceleracaoX`, `aceleracaoY` e `aceleracaoZ` são opcionais durante a transição; quando ausentes, a API preserva compatibilidade usando `aceleracao` como eixo X e zero nos demais.

Consulte `firmware/example-payload.json`. Umidade, bateria e sinal aceitam valores de 0 a 100. Os demais campos precisam ser numéricos. A API calcula alertas; o dispositivo não define severidade.
