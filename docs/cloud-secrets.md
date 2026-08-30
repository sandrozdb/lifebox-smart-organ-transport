# Variáveis de ambiente e segredos

O LifeBox usa variáveis de ambiente para separar configuração pública de dados sensíveis. Nunca publique `.env`, senhas, tokens ou chaves no GitHub.

## Produção atual

O backend público roda no Render e acessa um Aiven for MySQL gerenciado. As variáveis de produção são configuradas no ambiente do serviço Render, não no repositório.

| Variável                     | Finalidade                                             | Sensível? | Produção atual                        |
| ---------------------------- | ------------------------------------------------------ | --------- | ------------------------------------- |
| `NODE_ENV`                   | Define o ambiente de execução.                         | Não       | `production`                          |
| `PORT`                       | Porta HTTP do processo.                                | Não       | fornecida automaticamente pelo Render |
| `DB_DRIVER`                  | Seleciona o repository persistente.                    | Não       | `mysql`                               |
| `DB_HOST`                    | Host do MySQL gerenciado.                              | Não       | configurado no Render                 |
| `DB_PORT`                    | Porta do MySQL.                                        | Não       | configurada no Render                 |
| `DB_USER`                    | Usuário de acesso ao banco.                            | Config.   | configurado no Render                 |
| `DB_PASSWORD`                | Senha do usuário do banco.                             | **Sim**   | secret no Render                      |
| `DB_NAME`                    | Nome do banco de dados.                                | Não       | `lifebox_db`                          |
| `DB_SSL`                     | Ativa TLS na conexão MySQL.                            | Não       | `true`                                |
| `DB_SSL_REJECT_UNAUTHORIZED` | Exige validação do certificado TLS.                    | Não       | `true`                                |
| `DB_SSL_CA`                  | CA em PEM usada para validar o Aiven.                  | Não*      | variável de ambiente no Render        |
| `DB_CONNECT_TIMEOUT_MS`      | Timeout de conexão com o banco.                        | Não       | configurado no Render                 |
| `DB_CONNECTION_LIMIT`        | Limite do pool de conexões.                            | Não       | configurado no Render                 |
| `SEED_DEMO_DATA`             | Controla criação opcional do transporte demonstrativo. | Não       | `false` em produção                   |

\* O certificado CA não é uma credencial privada como uma senha ou chave secreta. Mesmo assim, o projeto o mantém fora do código para não acoplar o repositório a uma configuração específica do provedor.

## Regras de segurança

- `.env` é local e está ignorado pelo Git.
- `.env.example` é apenas modelo e não contém credenciais reais.
- `DB_PASSWORD` é configurada somente no Render.
- `DB_SSL=true` e `DB_SSL_REJECT_UNAUTHORIZED=true` permanecem ativos em produção.
- `DB_SSL_CA` contém o CA fornecido pelo Aiven e é lido pelo processo em runtime.
- `SEED_DEMO_DATA=false` é o estado normal de produção; ele foi habilitado apenas temporariamente para criar o transporte demonstrativo inicial.
- O Render fornece `PORT`; não fixe manualmente uma porta de produção.
- O GitHub Actions não precisa das credenciais do banco de produção: a integração MySQL da CI usa um banco isolado do workflow.
- Não registre senhas, valores sensíveis ou conteúdo de variáveis privadas em logs, screenshots ou documentação.

## Hardening futuro

A demonstração acadêmica está publicada, mas ainda pode evoluir com usuário MySQL de menor privilégio, restrição de rede/IP, rotação periódica de credenciais, backup formal e observabilidade adicional.
