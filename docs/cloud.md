# Cloud Computing

## IMPLEMENTADO

O LifeBox é cloud-ready e pode ser publicado em qualquer serviço compatível com Node.js, container Docker e MySQL remoto gerenciado. O frontend e a API continuam servidos pelo mesmo Express, portanto não exigem CORS adicional nessa arquitetura.

```text
Usuário / ESP32
       ↓ HTTPS
Backend Node.js em nuvem pública
       ↓ TLS opcional por provedor
MySQL gerenciado
```

- porta configurada por `PORT`;
- ambiente por `NODE_ENV`;
- conexão MySQL por `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`;
- SSL/TLS opcional por `DB_SSL` e `DB_SSL_REJECT_UNAUTHORIZED`;
- pool de conexões, timeout e encerramento gracioso;
- health check em `GET /api/health`, incluindo verificação de MySQL quando aplicável;
- Docker com `npm ci --omit=dev`, comando `npm start` e health check;
- GitHub Actions executando `npm ci`, `npm run check` e `npm test` em push e pull request;
- `npm run setup-db` idempotente, sem `DROP` e com seed somente quando `SEED_DEMO_DATA=true`.

## Variáveis de produção

```text
NODE_ENV=production
PORT
DB_DRIVER=mysql
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
DB_SSL=true|false
DB_SSL_REJECT_UNAUTHORIZED=true|false
DB_CONNECT_TIMEOUT_MS
DB_CONNECTION_LIMIT
SEED_DEMO_DATA=false
```

`DB_PASSWORD` pertence aos secrets da plataforma cloud. GitHub Secrets só serão necessários se um futuro workflow de CD precisar de token, webhook ou credencial de deploy.

## PENDENTE DE EXECUÇÃO

- escolher o provedor cloud compatível;
- criar o serviço Node.js e URL HTTPS pública;
- criar MySQL gerenciado, usuário com menor privilégio e backup;
- configurar secrets e variáveis de produção no provedor;
- executar `npm run setup-db` uma vez com `SEED_DEMO_DATA=false`;
- configurar health check, logs, HTTPS e regras de rede;
- definir o mecanismo de CD (integração GitHub da plataforma ou workflow com secret);
- capturar evidências reais de deploy, URL pública, health check e banco conectado.

Nenhum deploy, conta cloud, banco gerenciado ou recurso pago foi criado por este projeto.
## Guias desta preparação

- [Variáveis e segredos](cloud-secrets.md)
- [Checklist do MySQL gerenciado](managed-database-checklist.md)
- [CI/CD](ci-cd.md)
- [Checklist de deploy](deployment-checklist.md)