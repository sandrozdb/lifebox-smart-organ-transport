# Cloud e infraestrutura

## Implementado

- backend Node.js/Express apto a usar `process.env.PORT`;
- frontend servido pelo mesmo Express;
- MySQL configurável por variáveis de ambiente e SSL opcional;
- `.env` ignorado e `.env.example` sem credenciais reais;
- Docker e Docker Compose para execução local;
- health check em `/api/health`;
- CI no GitHub Actions com `npm ci`, `npm run check` e `npm test`;
- shutdown e logs básicos no backend.

## Pendente

- escolha do provedor cloud;
- URL pública HTTPS;
- backend publicado;
- MySQL gerenciado;
- secrets configurados no provedor;
- CD real;
- backup e observabilidade do ambiente publicado.

O dashboard mostra estes fatos apenas no painel técnico: Backend LOCAL, MySQL LOCAL, CI ATIVO e itens cloud PENDENTE. Não existe deploy cloud ativo.
