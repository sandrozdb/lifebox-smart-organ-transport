# Testing and QA

## Automação atual

`npm run check` valida a sintaxe JavaScript; `npm run lint` aplica regras de correção; `npm run format:check` verifica o padrão de formatação; `npm test` executa `node:test`; `npm run coverage` mede cobertura com c8; e `npm run e2e` executa os fluxos reais com Playwright. A CI repete essa pilha e inclui integração com MySQL 8.4 e build Docker.

A suíte cobre perfis de órgãos e preservação, PO, contrato das Strategies, rotas terrestres, helicóptero, planos multimodais e avião, segmentos e mapa, tempo/isquemia, alertas, atuadores digitais, Física, reotimização protegida contra adulteração/replay, resumo isolado por execução, API, IoT e repositórios em memória/MySQL.

## Baseline funcional final — CI #152

A baseline funcional de fechamento está no commit `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2`, validado pela **CI #152** em 09/09/2026. Alterações posteriores exclusivamente documentais não mudam essa referência funcional.

Resultados da suíte Node nessa execução:

- **110 testes descobertos**;
- **109 aprovados**;
- **0 falhas**;
- **1 integração MySQL condicional ignorada** durante `npm test`;
- cobertura c8: **88,28% linhas/instruções**, **79,08% branches** e **93,71% funções**.

O Playwright aprovou **5/5 fluxos E2E**. Depois disso, a workflow aplicou o schema no MySQL 8.4 da CI, executou o teste dedicado de integração MySQL com **1/1 aprovado** e concluiu o build Docker com sucesso.

## Regressões IoT adicionadas

A suíte atual inclui testes específicos para:

- telemetria IoT vinculada à execução ativa pelo backend;
- `executionId` enviado pelo cliente incapaz de substituir o ID server-side;
- associação entre dispositivo configurado e transporte;
- dashboard priorizando o transporte associado no modo IOT;
- execução em modo IOT sem criação de telemetria artificial;
- Temperatura, Impacto, Umidade, Bateria e Sinal bloqueados como cenários manuais no IOT;
- Condições Logísticas disponíveis no IOT;
- reotimização continuando sob controle de confirmação/aplicação;
- fluxo E2E em IOT com ações operacionais preservadas.

Esses testes surgiram de falhas reais encontradas durante a integração ESP32/Wokwi: cartões ao vivo podiam funcionar mesmo quando as leituras físicas não estavam ligadas à execução usada por gráficos, Física e resumo. O vínculo passou a ser definido pelo backend antes da persistência.

## Reotimização segura

O teste de regressão confirma que o frontend recebe o `recommendationId` gerado pelo servidor, envia exclusivamente `{ transporteId, recommendationId }`, recebe sucesso, aplica o plano e limpa a recomendação utilizada.

As proteções server-side contra ID inválido, transporte/execução incorretos, expiração, replay, reinício e adulteração permanecem cobertas.

## E2E automatizado

O Playwright cobre cinco fluxos:

1. planejamento e execução normal;
2. comportamento do modo IOT, com cenários da caixa bloqueados e condição logística disponível;
3. impacto crítico com saída digital/atuadores;
4. reotimização com confirmação explícita;
5. resumo final após conclusão.

A auditoria manual complementa esses testes ao validar Leaflet/OpenStreetMap, Wokwi, telemetria física, gráficos, Física, logística e composição visual.

## Checklist manual validado

- [x] Reiniciar; selecionar órgão; calcular plano; iniciar.
- [x] Confirmar tempo simulado, isquemia, margem e mapa.
- [x] Testar temperatura crítica e LED/buzzer no modo apropriado.
- [x] Testar impacto, atraso, reotimização e aplicação manual.
- [x] Alternar entre DEMO e IOT sem misturar fontes de telemetria.
- [x] Receber telemetria física do Wokwi no dashboard.
- [x] Confirmar gráficos e Análise Física com leituras da execução IoT.
- [x] Usar Condições Logísticas durante execução IOT e aplicar nova rota.
- [x] Finalizar e conferir resumo da execução atual.

## MySQL real

`RUN_MYSQL_INTEGRATION=true npm test` habilita a prova de persistência e isolamento por execução. Na CI, um serviço MySQL 8.4 recebe o schema antes do teste dedicado de integração.

No ambiente publicado, o Aiven for MySQL está configurado com TLS/CA. O backend no Render usa `DB_DRIVER=mysql`, `/api/health` valida API + banco e a persistência foi confirmada após redeploy.

## Baseline de QA no dashboard

O endpoint `/api/qualidade` usa `src/config/qaBaseline.json` como snapshot versionado quando não existe uma execução local mais recente. Esse snapshot acompanha a baseline funcional da CI #152.

## Evidências

As capturas antigas permanecem como baseline histórica. Os pacotes finais de [`evidencias/iot`](evidencias/iot/README.md) e [`evidencias/cloud`](evidencias/cloud/README.md) estão concluídos, com IoT `9/9` e Cloud `8/8`.

Detalhes complementares: [`iot.md`](iot.md), [`cloud.md`](cloud.md), [`ci-cd.md`](ci-cd.md) e [`deployment-checklist.md`](deployment-checklist.md).
