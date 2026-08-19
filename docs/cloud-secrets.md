# Variáveis de ambiente e segredos

O LifeBox usa variáveis de ambiente para separar configuração pública de dados sensíveis. Nunca publique um arquivo .env, senhas, tokens ou chaves no GitHub.

| Variável | Finalidade | Sensível? | Onde configurar |
|---|---|---:|---|
| NODE_ENV | Define o ambiente de execução, por exemplo production. | Não | Serviço cloud |
| PORT | Porta entregue pelo serviço Node.js. | Não | Serviço cloud |
| DB_HOST | Endereço do MySQL local ou gerenciado. | Não | Serviço cloud |
| DB_PORT | Porta do MySQL. | Não | Serviço cloud |
| DB_USER | Usuário de acesso ao banco. | Geralmente não | Serviço cloud |
| DB_PASSWORD | Senha do usuário do banco. | Sim | Secret do provedor cloud |
| DB_NAME | Nome do banco de dados. | Não | Serviço cloud |
| DB_SSL | Ativa ou desativa TLS na conexão MySQL. | Não | Serviço cloud |
| DB_SSL_REJECT_UNAUTHORIZED | Define a validação do certificado TLS do MySQL. | Não | Serviço cloud |
| DB_CONNECT_TIMEOUT_MS | Tempo máximo de conexão com o banco. | Não | Serviço cloud |
| DB_CONNECTION_LIMIT | Limite do pool de conexões MySQL. | Não | Serviço cloud |
| SEED_DEMO_DATA | Controla a carga opcional de dados demonstrativos no setup. | Não | Serviço cloud |
| DEPLOY_TOKEN | Token que poderá autenticar um deploy automatizado futuro. | Sim | GitHub Secret e/ou secret do provedor |
| DEPLOY_WEBHOOK_URL | URL de webhook de deploy futuro, se o provedor utilizar esse modelo. | Pode ser | GitHub Secret e/ou secret do provedor |

## Regras de segurança

- O arquivo .env é local e já está ignorado pelo Git.
- Use .env.example apenas como modelo: ele não contém valores reais.
- Configure DB_PASSWORD e futuros tokens diretamente no painel de segredos do provedor.
- Para CI/CD, guarde segredos em GitHub Actions Secrets; não os escreva no workflow.
- Não registre valores de variáveis sensíveis em logs, prints de terminal ou documentação.
- Em produção, use DB_SSL=true quando o MySQL gerenciado fornecer TLS.