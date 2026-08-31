# Evidências finais — Cloud

Esta pasta está **pronta para receber as capturas reais do Render, Aiven e GitHub Actions**. A infraestrutura já foi validada; os arquivos abaixo são apenas o pacote visual final para GitHub, slides e relatório.

> Antes de subir qualquer imagem, confira se senha, certificado CA, connection string completa, tokens ou outros valores sensíveis não aparecem na captura.

## Padrão de arquivos

| Arquivo | O que deve aparecer | Status do sistema | Upload |
| --- | --- | --- | --- |
| `01-render-service-live.png` | Web Service no Render com status Live e nome do serviço. | VALIDADO | PENDENTE |
| `02-render-deploy-main.png` | deploy recente da branch `main`, preferencialmente com commit visível. | VALIDADO | PENDENTE |
| `03-render-environment-keys.png` | nomes das variáveis configuradas, sem mostrar valores sensíveis. | VALIDADO | PENDENTE |
| `04-aiven-service-overview.png` | serviço MySQL ativo no Aiven, sem senha exposta. | VALIDADO | PENDENTE |
| `05-aiven-database.png` | banco `lifebox_db`/serviço gerenciado ou visão equivalente. | VALIDADO | PENDENTE |
| `06-health-check-publico.png` | `https://lifebox-expotech-iot-test.onrender.com/api/health` respondendo com sucesso. | VALIDADO | PENDENTE |
| `07-github-actions-ci84.png` | CI #84 verde ou uma execução verde mais recente. | VALIDADO | PENDENTE |
| `08-dashboard-publico.png` | dashboard aberto pela URL pública atual. | VALIDADO | PENDENTE |

## Como subir

Salve as imagens diretamente nesta pasta usando **exatamente os nomes acima**. Depois do upload, atualize apenas a coluna `Upload` de `PENDENTE` para `OK`.

## URLs de referência

- Dashboard/Backend: `https://lifebox-expotech-iot-test.onrender.com`
- Health check: `https://lifebox-expotech-iot-test.onrender.com/api/health`
- Repositório: `sandrozdb/lifebox-smart-organ-transport`

## Checklist de segurança antes do commit

- [ ] nenhum `DB_PASSWORD` visível;
- [ ] nenhum conteúdo de `DB_SSL_CA` visível;
- [ ] nenhuma connection string completa com senha;
- [ ] nenhum token/chave de API;
- [ ] dados pessoais removidos quando não forem necessários;
- [ ] status do Render e Aiven legíveis;
- [ ] nome do banco/serviço pode aparecer, mas credenciais não.

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
