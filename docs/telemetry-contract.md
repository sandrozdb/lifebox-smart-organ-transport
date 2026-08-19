# Contrato de telemetria

Endpoint: `POST /api/telemetria`, conteúdo `application/json`.

Campos obrigatórios: `transporteId`, `deviceId`, `temperatura`, `umidade`, `aceleracao`, `impacto`, `latitude`, `longitude`, `velocidade`, `bateria`, `sinal` e `timestamp` ISO 8601. `aceleracaoX`, `aceleracaoY` e `aceleracaoZ` são opcionais durante a transição; quando ausentes, a API preserva compatibilidade usando `aceleracao` como eixo X e zero nos demais.

Consulte `firmware/example-payload.json`. Umidade, bateria e sinal aceitam valores de 0 a 100. Os demais campos precisam ser numéricos. A API calcula alertas; o dispositivo não define severidade.
