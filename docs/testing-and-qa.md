# Testing and QA

## Automação atual

`npm run check` valida a sintaxe JavaScript; `npm run lint` aplica regras de correção; `npm run format:check` verifica o padrão de formatação; `npm test` executa `node:test`; `npm run coverage` mede cobertura com c8; e `npm run e2e` executa os fluxos reais com Playwright. O CI repete essa pilha e inclui integração com MySQL 8.4.

A suíte cobre: perfis de órgãos e preservação, PO, contrato das Strategies, rotas terrestres, helicóptero, planos multimodais e avião, segmentos e mapa, tempo/isquemia, alertas, atuadores digitais, Física, reotimização protegida contra adulteração/replay, resumo isolado por execução, API e repositórios em memória/MySQL.

Validação local de fechamento em 29/08/2026: **95 testes descobertos, 94 aprovados, 0 falhas e 1 integração MySQL condicional ignorada**. Cobertura: **87,59% de linhas/instruções, 80,82% de branches e 93,16% de funções**.

O Playwright aprovou os **4/4 cenários**. O teste de regressão da reotimização confirma que o frontend recebe o `recommendationId` gerado pelo servidor, envia exclusivamente `{ transporteId, recommendationId }`, recebe sucesso, aplica o plano e limpa a recomendação utilizada. As proteções server-side contra ID inválido, transporte/execução incorretos, expiração, replay, reinício e adulteração permanecem cobertas.

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

O painel técnico apresenta a contagem da suíte Node disponível no momento da captura. O resultado integral do fechamento está registrado neste documento e em `docs/pre-cloud-validation.md`.

## MySQL real

`RUN_MYSQL_INTEGRATION=true npm test` habilita a prova de persistência e isolamento por execução. No CI, um serviço MySQL 8.4 recebe o schema antes desse teste. Sem essa variável, o caso é explicitamente marcado como ignorado, nunca como aprovado fictício. Na validação local de 29/08/2026, o serviço MySQL 8 estava ativo, mas o checkout não possuía credenciais configuradas; a tentativa explícita foi rejeitada por autenticação antes de inserir qualquer registro.
