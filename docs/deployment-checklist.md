# Checklist genérico de deploy

Este checklist é independente de provedor. O projeto continua funcional localmente enquanto os itens abaixo não forem concluídos.

## A. Aplicação

- [ ] Backend Node.js publicado a partir do comando npm start.
- [ ] Variável PORT fornecida pelo ambiente cloud.
- [ ] Dashboard e API servidos pelo mesmo Express.
- [ ] URL HTTPS pública definida.

## B. Banco MySQL gerenciado

- [ ] Instância MySQL criada.
- [ ] Banco lifebox_db criado.
- [ ] Schema aplicado com npm run setup-db.
- [ ] Conexão TLS configurada quando exigida.
- [ ] Backup automático configurado.

## C. Variáveis de ambiente

- [ ] NODE_ENV=production.
- [ ] DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME configuradas.
- [ ] DB_SSL e DB_SSL_REJECT_UNAUTHORIZED revisadas.
- [ ] SEED_DEMO_DATA=false em produção.
- [ ] Nenhum .env enviado ao GitHub.

## D. Saúde e logs

- [ ] GET /api/health retorna HTTP 200 com o banco disponível.
- [ ] Logs da aplicação podem ser consultados sem expor segredos.
- [ ] Monitoramento de disponibilidade configurado.

## E. Container

- [ ] Dockerfile construído com sucesso.
- [ ] Imagem inicia com npm start.
- [ ] Health check do container responde.
- [ ] Variáveis são injetadas pelo ambiente, não pela imagem.

## F. CI

- [ ] GitHub Actions executa npm ci.
- [ ] GitHub Actions executa npm run check.
- [ ] GitHub Actions executa npm test.
- [ ] Última execução de CI aprovada.

## G. CD futuro

- [ ] Provedor cloud escolhido.
- [ ] Credenciais de deploy armazenadas como secrets.
- [ ] Template de CD adaptado ao provedor escolhido.
- [ ] Deploy executado sem credenciais no código.
- [ ] Health check pós-deploy confirmado.

## H. Segurança

- [ ] HTTPS validado.
- [ ] Menor privilégio aplicado ao usuário do banco.
- [ ] Acesso ao MySQL restrito por rede quando possível.
- [ ] Rotação de senha e estratégia de backup definidas.

## I. Evidências acadêmicas

- [ ] URL pública capturada.
- [ ] GET /api/health capturado.
- [ ] Dashboard público capturado.
- [ ] Banco gerenciado conectado e demonstrado.
- [ ] CI e CD documentados com evidências reais.