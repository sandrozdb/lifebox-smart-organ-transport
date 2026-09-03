# CI/CD

## CI implementada

O workflow em `.github/workflows/ci.yml` é executado em push e pull request. Ele executa, nesta ordem:

1. `npm ci`;
2. instalação do Chromium;
3. check, lint e verificação de formatação;
4. testes e cobertura;
5. testes E2E;
6. aplicação do schema em um MySQL isolado da CI;
7. teste de integração MySQL;
8. build do Dockerfile.

## Validação atual

A **CI #84** foi concluída com sucesso em 31/08/2026 após a alteração que liberou Condições Logísticas no modo IOT sem reativar cenários artificiais da caixa.

Nessa execução:

- check, lint e Prettier: aprovados;
- suíte Node: 108 descobertos, 107 aprovados, 0 falhas e 1 integração condicional ignorada nessa etapa;
- coverage: 88,28% linhas/instruções, 79,00% branches e 93,71% funções;
- Playwright: 5/5 fluxos E2E aprovados;
- integração MySQL: aprovada no job dedicado;
- build Docker: aprovado;
- resultado final do workflow: `success`.

## CD implementado no Render

O CD real usa o Auto Deploy nativo do Render, conectado ao repositório `sandrozdb/lifebox-smart-organ-transport` e à branch `main`.

Fluxo atual:

1. um push entra na `main`;
2. o GitHub Actions inicia a CI;
3. o Render detecta o novo commit com `Auto-Deploy: On Commit`;
4. o Render constrói o `Dockerfile`;
5. variáveis e segredos são injetados pelo ambiente do Render;
6. o serviço inicia com `npm start`;
7. o health check em `/api/health` valida API e banco;
8. a aplicação fica disponível no serviço público atual.

**URL atual usada pelo firmware IoT:** `https://lifebox-expotech.onrender.com`.

## Validação prática do Auto Deploy

O Auto Deploy já havia sido validado na etapa Cloud inicial e continuou sendo usado durante a integração IoT. A PR #7 foi incorporada à `main` no commit `5db314d`, e o serviço público foi atualizado antes da validação manual do modo IOT + Condições Logísticas + reotimização.

Esse fluxo demonstra entrega contínua real a partir da `main`.

## Relação entre CI e CD

A configuração atual do Render é `On Commit`. Portanto, CI e CD são disparados pelo mesmo push, mas o deploy não fica obrigatoriamente bloqueado aguardando a conclusão da CI.

Para a entrega acadêmica, isso demonstra CI e CD reais. Como evolução de engenharia, o projeto pode adotar um gate explícito de CI antes do deploy.

## Segredos

Credenciais do Aiven não ficam em workflows públicos nem no repositório. `DB_PASSWORD`, `DB_SSL_CA` e demais valores sensíveis são fornecidos ao serviço pelo ambiente do Render. O GitHub Actions usa apenas recursos de teste próprios da CI.

## Evidências

A pasta [`evidencias/cloud`](evidencias/cloud/README.md) está preparada para receber capturas do Render, Aiven, GitHub Actions, health check e dashboard publicado sem exposição de segredos.

**Status: CONCLUÍDO E VALIDADO.**
