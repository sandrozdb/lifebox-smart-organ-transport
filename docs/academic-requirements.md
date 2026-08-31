# Requisitos acadêmicos — LifeBox

| Disciplina  | Requisito                  | Implementação                                        | Dashboard / operação     | Evidência                   | Status    |
| ----------- | -------------------------- | ---------------------------------------------------- | ------------------------ | --------------------------- | --------- |
| Eletrônica  | Lógica digital             | `digitalAlertLogic`, Logisim e atuadores ESP32/Wokwi | sinais 0/1, LED e buzzer | circuito + IoT              | CONCLUÍDO |
| Física      | Cálculos dinâmicos         | `physicsService`                                     | análise por execução     | testes + telemetria IoT     | CONCLUÍDO |
| Arquitetura | GoF, SOLID e componentes   | Strategy, Observer e serviços                        | painel técnico compacto  | `docs/architecture.md`      | CONCLUÍDO |
| PO          | Otimização multimodal      | planos, segmentos e reotimização                     | planejamento e mapa      | testes + dashboard          | CONCLUÍDO |
| QA          | Testes, CI e E2E           | `node:test`, c8, Playwright e MySQL no CI            | validações automatizadas | CI #84 + documentação       | CONCLUÍDO |
| Cloud       | Publicação e DB gerenciado | Render + Aiven MySQL + TLS + variáveis seguras       | deploy público e health  | `docs/cloud.md` + checklist | CONCLUÍDO |

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

O backend atualmente usado pelo firmware está publicado em `https://lifebox-expotech-iot-test.onrender.com`, com banco Aiven for MySQL gerenciado, conexão TLS com CA, variáveis de ambiente fora do repositório, persistência validada e Auto Deploy do Render a partir da branch `main`.

O GitHub Actions permanece responsável pela CI. No modo atual `On Commit`, CI e deploy são disparados pelo mesmo push e não formam um gate sequencial obrigatório; essa limitação está documentada em `docs/ci-cd.md`.

## QA atual

A CI #84 foi concluída com sucesso em 31/08/2026. A suíte Node descobriu 108 testes, com 107 aprovados, 0 falhas e 1 integração condicional ignorada nessa etapa. O Playwright aprovou 5/5 fluxos E2E.

## Checagem de consistência

Para órgão, faixa, isquemia, alerta, tempo, Física, telemetria e plano, verificar `config → serviço → API → dashboard → documentação`. Valores divergentes exigem justificativa explícita.

O protótipo IoT é virtual no Wokwi e os dados logísticos continuam acadêmicos/simulados; o projeto não representa um dispositivo médico certificado.
