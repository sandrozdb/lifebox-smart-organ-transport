# Cloud e infraestrutura — etapa 2 em implementação

## Arquitetura planejada

```text
Wokwi/Cliente
    ↓ HTTPS
Render Web Service (Node.js + Express)
    ↓ MySQL/TLS
Aiven for MySQL
```

**Status: EM IMPLEMENTAÇÃO.** O backend já está publicado em
https://lifebox-expotech.onrender.com, conectado ao Aiven for MySQL e com
persistência após redeploy validada. O Auto Deploy do Render ainda está em
validação.

## Implementado

- backend Node.js/Express apto a usar `process.env.PORT`;
- frontend servido pelo mesmo Express;
- MySQL configurável por variáveis de ambiente, TLS e certificado CA;
- `.env` ignorado e `.env.example` sem credenciais reais;
- Docker e Docker Compose para execução local;
- health check em `/api/health`;
- CI no GitHub Actions com check, lint, formatação, testes, cobertura, E2E,
  integração MySQL e build Docker;
- shutdown e logs básicos no backend;
- backend publicado no Render em https://lifebox-expotech.onrender.com;
- Aiven MySQL conectado;
- persistência após redeploy validada.

## Pendente

- validação do Auto Deploy/CD real;
- backup e observabilidade do ambiente publicado.

## Render e Aiven

O Render constrói o Dockerfile existente diretamente, sem `render.yaml`:

- runtime: Docker;
- branch: `main`;
- build: realizado pelo Dockerfile (`npm ci --omit=dev`);
- start: `npm start` (CMD do Dockerfile);
- health check: `/api/health`;
- auto deploy: após atualização da `main`, em validação neste momento.

No Aiven, o serviço MySQL e o banco indicado em `DB_NAME` já estão configurados.
O schema foi aplicado com `npm run setup-db`. O script não executa `DROP`; o
seed só roda quando `SEED_DEMO_DATA=true`. Em produção, mantenha-o como `false`.

Use `DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=true` e configure `DB_SSL_CA` com
o certificado CA em PEM fornecido pelo Aiven. Se o painel não aceitar múltiplas
linhas, represente as quebras como `\n`.
