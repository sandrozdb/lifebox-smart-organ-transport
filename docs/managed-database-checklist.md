# Checklist — MySQL gerenciado

Use este roteiro quando um provedor cloud for escolhido. Ele não cria nem configura nenhum banco automaticamente.

## Provisionamento

- [ ] Criar uma instância MySQL gerenciada compatível com a versão usada pelo projeto.
- [ ] Criar o banco lifebox_db.
- [ ] Criar um usuário de aplicação com privilégios mínimos necessários para o MVP.
- [ ] Gerar uma senha forte e armazená-la somente como segredo.
- [ ] Restringir o acesso de rede ao serviço do backend quando o provedor permitir.
- [ ] Habilitar TLS/SSL e obter a orientação de certificado do provedor.

## Variáveis no backend

- [ ] Configurar DB_HOST.
- [ ] Configurar DB_PORT.
- [ ] Configurar DB_USER.
- [ ] Configurar DB_PASSWORD como secret.
- [ ] Configurar DB_NAME=lifebox_db.
- [ ] Configurar DB_SSL=true quando TLS for exigido.
- [ ] Ajustar DB_SSL_REJECT_UNAUTHORIZED conforme a cadeia de certificados do provedor.
- [ ] Manter SEED_DEMO_DATA=false em produção.

## Schema, teste e operação

- [ ] Executar npm run setup-db uma vez contra o banco vazio.
- [ ] Confirmar que a execução não faz DROP e pode ser repetida com segurança.
- [ ] Validar GET /api/health com o banco conectado.
- [ ] Validar uma leitura e sua exibição no dashboard.
- [ ] Configurar backup automático e testar a restauração.
- [ ] Configurar retenção de logs e monitoramento de disponibilidade.
- [ ] Registrar a região, o plano e o responsável pela conta do provedor.