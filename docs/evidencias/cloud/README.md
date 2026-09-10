# Evidências finais — Cloud

Esta pasta contém o **pacote final de oito capturas do Render, Aiven e GitHub Actions**.

Status do pacote: **Cloud 8/8 — CONCLUÍDO**.

> As capturas foram selecionadas sem expor senha, certificado CA, connection string completa, tokens ou outros valores sensíveis.

## Arquivos

| Arquivo | O que aparece | Status |
| --- | --- | --- |
| `01-render-service-live.png` | Web Service oficial `lifebox-expotech` no Render com status Live | VALIDADO |
| `02-render-deploy-main.png` | snapshot de deploy concluído da branch `main` no commit `646145a` | VALIDADO |
| `03-render-environment-keys.png` | nomes das variáveis configuradas, com valores ocultos pela interface | VALIDADO |
| `04-aiven-service-overview.png` | serviço MySQL ativo no Aiven, sem senha exposta | VALIDADO |
| `05-aiven-database.png` | bancos `defaultdb` e `lifebox_db` no serviço gerenciado | VALIDADO |
| `06-health-check-publico.png` | health check público respondendo com sucesso | VALIDADO |
| `07-github-actions-ci84.png` | snapshot histórico de CI verde (#138 no commit `646145a`; nome físico preservado) | VALIDADO |
| `08-dashboard-publico.png` | dashboard aberto pela URL pública | VALIDADO |

Os arquivos `02-render-deploy-main.png` e `07-github-actions-ci84.png` registram snapshots reais de etapas anteriores do fechamento Cloud. Eles continuam válidos como prova visual daquele deploy/CI. A baseline funcional final avançou posteriormente para o commit `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2`, validado pela **CI #152 SUCCESS**.

## URLs de referência

- Dashboard/Backend: `https://lifebox-expotech.onrender.com`
- Health check: `https://lifebox-expotech.onrender.com/api/health`
- Repositório: `sandrozdb/lifebox-smart-organ-transport`

## Checklist de segurança

- [x] nenhum valor de `DB_PASSWORD` visível;
- [x] nenhum conteúdo de `DB_SSL_CA` visível;
- [x] nenhuma connection string completa com senha;
- [x] nenhum token/chave de API;
- [x] dados pessoais desnecessários ausentes;
- [x] status do Render e Aiven legíveis;
- [x] nome do banco/serviço aparece sem credenciais.

## O que essas evidências comprovam

O conjunto final demonstra:

1. aplicação pública em Docker no Render;
2. Auto Deploy ligado à `main`;
3. configuração segura por variáveis de ambiente;
4. banco Aiven for MySQL gerenciado;
5. comunicação TLS com o banco;
6. health check público;
7. CI automatizada no GitHub Actions;
8. dashboard realmente acessível pela internet.

## Referência funcional de fechamento

- baseline: `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2`
- CI: **#152 SUCCESS**
- pacote Cloud: **8/8**
- pacote IoT: **9/9**

Alterações posteriores exclusivamente documentais podem gerar novas execuções de CI sem alterar essa baseline funcional.

Documentação relacionada: [`../../cloud.md`](../../cloud.md), [`../../ci-cd.md`](../../ci-cd.md) e [`../../deployment-checklist.md`](../../deployment-checklist.md).
