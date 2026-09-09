# Evidências finais — Cloud

Esta pasta contém o **pacote final de oito capturas do Render, Aiven e GitHub Actions**. Status do pacote: **Cloud 8/8**.

> Antes de subir qualquer imagem, confira se senha, certificado CA, connection string completa, tokens ou outros valores sensíveis não aparecem na captura.

## Padrão de arquivos

| Arquivo | O que deve aparecer | Status do sistema | Upload |
| --- | --- | --- | --- |
| `01-render-service-live.png` | Web Service oficial `lifebox-expotech` no Render com status Live. | VALIDADO | OK |
| `02-render-deploy-main.png` | deploy concluído da branch `main`, no commit `646145a`. | VALIDADO | OK |
| `03-render-environment-keys.png` | nomes das variáveis configuradas, com valores ocultos pela interface. | VALIDADO | OK |
| `04-aiven-service-overview.png` | serviço MySQL ativo no Aiven, sem senha exposta. | VALIDADO | OK |
| `05-aiven-database.png` | bancos `defaultdb` e `lifebox_db` no serviço gerenciado. | VALIDADO | OK |
| `06-health-check-publico.png` | `https://lifebox-expotech.onrender.com/api/health` respondendo com sucesso. | VALIDADO | OK |
| `07-github-actions-ci84.png` | CI final #138 verde no commit `646145a` (nome físico preservado). | VALIDADO | OK |
| `08-dashboard-publico.png` | dashboard aberto pela URL pública atual. | VALIDADO | OK |

## Como subir

Salve as imagens diretamente nesta pasta usando **exatamente os nomes acima**. Depois do upload, atualize apenas a coluna `Upload` de `PENDENTE` para `OK`.

## URLs de referência

- Dashboard/Backend: `https://lifebox-expotech.onrender.com`
- Health check: `https://lifebox-expotech.onrender.com/api/health`
- Repositório: `sandrozdb/lifebox-smart-organ-transport`

## Checklist de segurança antes do commit

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

Documentação relacionada: [`../../cloud.md`](../../cloud.md), [`../../ci-cd.md`](../../ci-cd.md) e [`../../deployment-checklist.md`](../../deployment-checklist.md).

Referência atual da aplicação: `main` em `7d3ce046836ff2266701e48e6ec9666b7dba555a`, com CI `#147 SUCCESS`.
