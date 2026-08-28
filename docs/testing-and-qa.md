# Testing and QA

## Automação atual

`npm run check` valida a sintaxe JavaScript; `npm run lint` aplica regras de correção; `npm run format:check` verifica o padrão de formatação; `npm test` executa `node:test`; `npm run coverage` mede cobertura com c8; e `npm run e2e` executa os fluxos reais com Playwright. O CI repete essa pilha e inclui integração com MySQL 8.4.

A suíte cobre: perfis de órgãos e preservação, PO, contrato das Strategies, rotas terrestres, helicóptero, planos multimodais e avião, segmentos e mapa, tempo/isquemia, alertas, atuadores digitais, Física, reotimização protegida contra adulteração/replay, resumo isolado por execução, API e repositórios em memória/MySQL.

Última validação local: **83 testes aprovados, 0 falhas e 1 integração MySQL condicional ignorada**. Cobertura: **86,28% de linhas/instruções, 80,90% de branches e 92,10% de funções**. Playwright: **4 cenários aprovados**.

O executor registra o resultado resumido em `work/qa-last-run.json`. Esse arquivo é apenas um artefato auxiliar: se o Windows negar a escrita com `EPERM`, a falha é comunicada como aviso e o código de saída continua refletindo o resultado real da suíte.

## Caso real de bug de interface

A API e os testes estavam funcionando, mas o dashboard congelava porque `renderOptimization()` tentou usar `#optimization-weights`, elemento removido. O erro `Cannot set properties of null` interrompia `refresh()`. O caso reforça que testes unitários e de integração não substituem inspeção do navegador; o fluxo atual removeu essa renderização legada e inclui validação estrutural de seletores relevantes.

## E2E automatizado e auditoria manual

O Playwright cobre quatro fluxos: execução normal, impacto crítico com atuadores, reotimização com confirmação e resumo final. A auditoria manual no navegador integrado complementa esses testes ao validar mapa Leaflet, tiles OpenStreetMap, legibilidade e composição visual.

- [x] Reiniciar; selecionar órgão; calcular plano; iniciar.
- [x] Confirmar tempo simulado, isquemia, margem e mapa.
- [x] Testar temperatura crítica e LED/buzzer; retornar a Normal.
- [x] Testar impacto, atraso, reotimização e aplicação manual.
- [x] Finalizar e conferir resumo da execução atual.

O painel técnico apresenta o resultado real desta execução no navegador integrado; as capturas correspondentes estão em `docs/evidencias/dashboard`.

## MySQL real

`RUN_MYSQL_INTEGRATION=true npm test` habilita a prova de persistência e isolamento por execução. No CI, um serviço MySQL 8.4 recebe o schema antes desse teste. Sem essa variável, o caso é explicitamente marcado como ignorado, nunca como aprovado fictício.
