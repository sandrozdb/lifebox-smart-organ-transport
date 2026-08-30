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

A CI do commit de preparação para cloud (`d67f134`) e a do commit que registrou o deploy (`3365233`) foram aprovadas no GitHub Actions.

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
8. a aplicação fica disponível em `https://lifebox-expotech.onrender.com`.

### Validação real do Auto Deploy

O serviço estava no commit `d67f134`. Após o push do commit `3365233` (`docs: register production cloud deployment`), o Render atualizou automaticamente para esse commit sem uso de `Manual Deploy`. Isso valida o CD em produção.

## Relação entre CI e CD

A configuração atual do Render é `On Commit`. Portanto, CI e CD são disparados pelo mesmo push, mas o deploy não fica obrigatoriamente bloqueado aguardando a conclusão da CI.

Para a entrega acadêmica, isso demonstra CI e CD reais. Como evolução de engenharia, o projeto pode futuramente adotar um gate explícito de CI antes do deploy.

## Segredos

Credenciais do Aiven não ficam em workflows públicos nem no repositório. `DB_PASSWORD` e a configuração TLS necessária são fornecidas ao serviço pelo ambiente do Render. O GitHub Actions usa apenas recursos de teste próprios da CI.

**Status: CONCLUÍDO E VALIDADO.**
