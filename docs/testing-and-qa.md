# Testing and QA

## Automação atual

`npm run check` valida a sintaxe JavaScript; `npm run lint` aplica regras de correção; `npm run format:check` verifica o padrão de formatação; `npm test` executa `node:test`; `npm run coverage` mede cobertura com c8; e `npm run e2e` executa os fluxos reais com Playwright. O CI repete essa pilha e inclui integração com MySQL 8.4.

A suíte cobre: perfis de órgãos e preservação, PO, contrato das Strategies, rotas terrestres, helicóptero, planos multimodais e avião, segmentos e mapa, tempo/isquemia, alertas, atuadores digitais, Física, reotimização protegida contra adulteração/replay, resumo isolado por execução, API e repositórios em memória/MySQL.

Validação local de fechamento em 29/08/2026: **95 testes descobertos, 94 aprovados, 0 falhas e 1 integração MySQL condicional ignorada**. Cobertura: **87,59% de linhas/instruções, 80,82% de branches e 93,16% de funções**.

O Playwright aprovou os **4/4 cenários**. O teste de regressão da reotimização confirma que o frontend recebe o `recommendationId` gerado pelo servidor, envia exclusivamente `{ transporteId, recommendationId }`, recebe sucesso, aplica o plano e limpa a recomendação utilizada. As proteções server-side contra ID inválido, transporte/execução incorretos, expiração, replay, reinício e adulteração permanecem cobertas.

O executor registra o resultado resumido em `work/qa-last-run.json`. Esse arquivo é apenas um artefato auxiliar: se o Windows negar a escrita com `EPERM`, a falha é comunicada como aviso e o código de saída continua refletindo o resultado real da suíte.

No ambiente publicado, `/api/qualidade` não depende desse arquivo local. Como `work/` é ignorado pelo Git e não existe no container limpo do Render, o endpoint usa `src/config/qaBaseline.json` como snapshot versionado da última validação publicada. Quando existe uma execução local mais recente, seus campos substituem os valores do baseline. Isso evita o falso status `PENDENTE` em produção sem transformar ausência de arquivo local em aprovação fictícia.

## Caso real de bug de interface

A API e os testes estavam funcionando, mas o dashboard congelava porque `renderOptimization()` tentou usar `#optimization-weights`, elemento removido. O erro `Cannot set properties of null` interrompia `refresh()`. O caso reforça que testes unitários e de integração não substituem inspeção do navegador; o fluxo atual removeu essa renderização legada e inclui validação estrutural de seletores relevantes.

## E2E automatizado e auditoria manual

O Playwright cobre quatro fluxos: execução normal, impacto crítico com atuadores, reotimização com confirmação e resumo final. A auditoria manual no navegador integrado complementa esses testes ao validar mapa Leaflet, tiles OpenStreetMap, legibilidade e composição visual.

- [x] Reiniciar; selecionar órgão; calcular plano; iniciar.
- [x] Confirmar tempo simulado, isquemia, margem e mapa.
- [x] Testar temperatura crítica e LED/buzzer; retornar a Normal.
- [x] Testar impacto, atraso, reotimização e aplicação manual.
- [x] Finalizar e conferir resumo da execução atual.

O painel técnico apresenta a contagem da suíte Node disponível no momento da captura. O resultado integral do fechamento pré-cloud está registrado neste documento e em `docs/pre-cloud-validation.md`.

## MySQL real

`RUN_MYSQL_INTEGRATION=true npm test` habilita a prova de persistência e isolamento por execução. No CI, um serviço MySQL 8.4 recebe o schema antes desse teste. Sem essa variável, o caso é explicitamente marcado como ignorado, nunca como aprovado fictício.

Na validação local pré-cloud de 29/08/2026, o checkout ainda não possuía credenciais do MySQL remoto e a tentativa explícita foi rejeitada por autenticação antes de inserir qualquer registro. **Esse registro é histórico.** Depois da etapa Cloud, o Aiven for MySQL foi configurado com TLS/CA, o schema foi aplicado com sucesso, o backend do Render iniciou com `DB_DRIVER=mysql`, `/api/health` respondeu com sucesso e a persistência foi confirmada após redeploy.

## Validação pós-cloud

- [x] CI do commit de preparação para cloud aprovada no GitHub Actions;
- [x] backend Docker iniciou no Render em `NODE_ENV=production` e `DB_DRIVER=mysql`;
- [x] health check público validou API + Aiven;
- [x] persistência do banco confirmada após redeploy;
- [x] Auto Deploy do Render validado em push real para `main`.

Detalhes: `docs/cloud.md`, `docs/ci-cd.md` e `docs/deployment-checklist.md`.
