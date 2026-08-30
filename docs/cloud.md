# Cloud e infraestrutura — etapa 2 em implementação

## Arquitetura planejada

```text
Wokwi/Cliente
    ↓ HTTPS
Render Web Service (Node.js + Express)
    ↓ MySQL/TLS
Aiven for MySQL
```

**Status: PENDENTE DE DEPLOY.** Ainda não existe URL pública, serviço Render ou
banco Aiven conectados e validados.

## Implementado

- backend Node.js/Express apto a usar `process.env.PORT`;
- frontend servido pelo mesmo Express;
- MySQL configurável por variáveis de ambiente, TLS e certificado CA;
- `.env` ignorado e `.env.example` sem credenciais reais;
- Docker e Docker Compose para execução local;
- health check em `/api/health`;
- CI no GitHub Actions com check, lint, formatação, testes, cobertura, E2E,
  integração MySQL e build Docker;
- shutdown e logs básicos no backend.

## Pendente

- criação e configuração dos serviços no Render e no Aiven;
- URL pública HTTPS;
- backend publicado;
- MySQL gerenciado;
- secrets configurados no provedor;
- CD real;
- backup e observabilidade do ambiente publicado.

O dashboard mostra estes fatos apenas no painel técnico: Backend LOCAL, MySQL LOCAL, CI ATIVO e itens cloud PENDENTE. Não existe deploy cloud ativo.

## Render e Aiven

O Render pode construir o Dockerfile existente diretamente, sem `render.yaml`:

- runtime: Docker;
- branch: `main`;
- build: realizado pelo Dockerfile (`npm ci --omit=dev`);
- start: `npm start` (CMD do Dockerfile);
- health check: `/api/health`;
- auto deploy: após atualização da `main`, condicionado à configuração no painel.

No Aiven, crie o serviço MySQL e o banco indicado em `DB_NAME`. Aplique o schema
uma vez, a partir de uma máquina autorizada a acessar o serviço, com
`npm run setup-db`. O script não executa `DROP`; o seed só roda quando
`SEED_DEMO_DATA=true`. Em produção, mantenha-o como `false`.

Use `DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=true` e configure `DB_SSL_CA` com
o certificado CA em PEM fornecido pelo Aiven. Se o painel não aceitar múltiplas
linhas, represente as quebras como `\n`.
