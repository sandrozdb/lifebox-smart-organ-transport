# Simulação

O simulador gera uma viagem coerente: posição avança numa rota fixa fictícia de São Paulo, bateria reduz gradualmente, velocidade e vibração variam em torno de valores normais.

Cenários: `normal`, `temperatura`, `impacto`, `umidade`, `bateria`, `sinal`, `atraso` e `concluir`. Podem ser acionados no dashboard ou com `POST /api/simulacao/cenario` e corpo `{"cenario":"impacto"}`.

Também há um produtor externo: `npm run simulator -- impacto`. Ele comprova que a API não depende do simulador embutido e representa melhor o futuro ESP32.
