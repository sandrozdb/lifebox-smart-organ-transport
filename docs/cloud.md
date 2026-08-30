# Cloud e infraestrutura — etapa 2 concluída

## Arquitetura publicada

```text
Wokwi/Cliente
    ↓ HTTPS
Render Web Service (Node.js + Express)
    ↓ MySQL/TLS
Aiven for MySQL
```

**Status: CONCLUÍDA.** O backend está publicado em
https://lifebox-expotech.onrender.com, conectado ao Aiven for MySQL, com
persistência após redeploy validada e Auto Deploy do Render confirmado a partir
de push na branch `main`.

## Implementado e validado

- backend Node.js/Express publicado no Render;
- frontend servido pelo mesmo Express em HTTPS;
- URL pública: https://lifebox-expotech.onrender.com;
- uso de `process.env.PORT` no ambiente Render;
- MySQL gerenciado no Aiven conectado ao backend de produção;
- conexão MySQL protegida com TLS e certificado CA;
- variáveis de ambiente e credenciais configuradas fora do repositório;
- `.env` ignorado e `.env.example` sem credenciais reais;
- banco `lifebox_db` com schema aplicado via `npm run setup-db`;
- persistência dos dados confirmada após redeploy do serviço;
- `SEED_DEMO_DATA=false` mantido em produção após criação inicial controlada;
- health check em `/api/health` validado no ambiente público;
- Dockerfile utilizado diretamente pelo Render para build e execução;
- CI no GitHub Actions com check, lint, formatação, testes, cobertura, E2E,
  integração MySQL e build Docker;
- GitHub Actions executado com sucesso após push na `main`;
- Auto Deploy/CD do Render validado: o commit `3365233`
  (`docs: register production cloud deployment`) foi detectado e publicado
  automaticamente sem uso de Manual Deploy;
- shutdown e logs básicos disponíveis no backend.

## Render

Configuração validada do Web Service:

- runtime: Docker;
- branch: `main`;
- plano: Free;
- build: realizado pelo Dockerfile (`npm ci --omit=dev`);
- start: `npm start` (CMD do Dockerfile);
- health check: `/api/health`;
- Auto Deploy: `On Commit`;
- serviço público: https://lifebox-expotech.onrender.com.

A instância gratuita pode entrar em modo de inatividade, portanto a primeira
requisição após um período sem uso pode apresentar atraso de inicialização. Isso
não altera a persistência dos dados, que permanece no Aiven for MySQL.

## Aiven for MySQL

O serviço MySQL gerenciado e o banco indicado em `DB_NAME` estão configurados e
operacionais. O schema foi aplicado com `npm run setup-db`. O script não executa
`DROP`; o seed só roda quando `SEED_DEMO_DATA=true`. Em produção, ele permanece
como `false`.

A conexão usa `DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=true` e `DB_SSL_CA` com
o certificado CA em PEM fornecido pelo Aiven.

## Melhorias operacionais futuras

Backup dedicado, métricas avançadas, alertas e observabilidade externa podem ser
adicionados como evolução operacional. Esses itens não impedem a conclusão da
etapa acadêmica atual de Cloud Computing, já que backend em nuvem pública, banco
gerenciado, configuração segura e CI/CD foram implementados e validados.
