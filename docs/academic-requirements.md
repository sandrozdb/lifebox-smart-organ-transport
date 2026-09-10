# Requisitos acadêmicos — LifeBox

Todas as frentes obrigatórias da entrega estão concluídas:

- **Eletrônica:** lógica digital combinacional no software, ESP32/Wokwi com LED e buzzer e extensão sequencial com D Flip-Flop no Logisim; evidências: Wokwi + quatro capturas do circuito.
- **Física:** cálculos dinâmicos no `physicsService`, alimentados pela execução atual; evidências: testes + telemetria IoT.
- **Arquitetura:** C4 Context/Container, Strategy, Observer, serviços e avaliação SOLID; evidência: `docs/architecture.md`.
- **Pesquisa Operacional:** planejamento multimodal, restrições e reotimização; evidências: testes, planejamento e mapa.
- **QA:** `node:test`, c8, Playwright e MySQL na CI; evidência: CI #152 + documentação.
- **Cloud:** Render + Aiven MySQL + TLS + variáveis seguras; evidências: deploy público, health check e checklist.

Na Eletrônica, o backend/Wokwi permanece combinacional: `EVENTO_CRITICO = TRANSPORTE_ATIVO AND (TEMPERATURA_CRITICA OR IMPACTO_CRITICO)`. O circuito Logisim é uma extensão sequencial acadêmica com D Flip-Flop, que memoriza o evento até `RESET`; essa memória não foi atribuída ao backend, firmware ou atuadores do protótipo IoT.

## Integração IoT complementar

Além das disciplinas acima, o projeto possui integração IoT funcional:

- ESP32 executado no Wokwi Web;
- DHT22, MPU6050, GPS NEO-6M, bateria, sinal, OLED, LED e buzzer;
- telemetria enviada por HTTPS ao Render;
- persistência no Aiven for MySQL;
- vínculo server-side da leitura à execução ativa;
- gráficos, Física e resumo final alimentados pela telemetria IoT;
- Condições Logísticas funcionando durante IOT;
- reotimização e troca de rota validadas no modo IOT.

Detalhes em [`iot.md`](iot.md) e [`../firmware/README.md`](../firmware/README.md).

## Cloud validada

O backend usado pelo firmware está publicado em `https://lifebox-expotech.onrender.com`, com banco Aiven for MySQL gerenciado, conexão TLS com CA, variáveis de ambiente fora do repositório, persistência validada e Auto Deploy do Render a partir da branch `main`.

O GitHub Actions permanece responsável pela CI. No modo atual `On Commit`, CI e deploy são disparados pelo mesmo push e não formam um gate sequencial obrigatório; essa limitação está documentada em `docs/ci-cd.md`.

## QA final

A baseline funcional final está no commit `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2`, validado pela **CI #152** em 09/09/2026. A suíte Node descobriu **110 testes**, com **109 aprovados**, **0 falhas** e **1 integração condicional ignorada** durante `npm test`. O Playwright aprovou **5/5 fluxos E2E**; a integração MySQL dedicada e o build Docker também foram aprovados.

Cobertura c8 da baseline: **88,28% linhas/instruções**, **79,08% branches** e **93,71% funções**.

## Checagem de consistência

Para órgão, faixa, isquemia, alerta, tempo, Física, telemetria e plano, verificar `config → serviço → API → dashboard → documentação`. Valores divergentes exigem justificativa explícita.

O protótipo IoT é virtual no Wokwi e os dados logísticos continuam acadêmicos/simulados; o projeto não representa um dispositivo médico certificado.
