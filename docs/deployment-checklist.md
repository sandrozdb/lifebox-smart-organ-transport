# Checklist de deploy — Render + Aiven

Status acadêmico da etapa Cloud: **CONCLUÍDO**. Os itens ainda abertos abaixo são melhorias de hardening/operabilidade e não bloqueiam o requisito de backend público + banco gerenciado + variáveis seguras + CI/CD.

## A. Aplicação

- [x] Backend Node.js publicado com `npm start`.
- [x] `PORT` fornecida pelo ambiente Render.
- [x] Dashboard e API servidos pelo mesmo Express.
- [x] URL HTTPS pública definida: `https://lifebox-expotech.onrender.com`.

## B. Banco MySQL gerenciado

- [x] Instância Aiven for MySQL criada.
- [x] Banco `lifebox_db` criado.
- [x] Schema aplicado com `npm run setup-db`.
- [x] Conexão TLS configurada com o certificado CA do Aiven.
- [x] Persistência validada após redeploy do Render.
- [ ] Estratégia formal de backup revisada/documentada para uso além da demo.

## C. Variáveis de ambiente

- [x] `NODE_ENV=production`.
- [x] `DB_DRIVER=mysql`.
- [x] `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` configuradas no Render.
- [x] `DB_SSL=true` e `DB_SSL_REJECT_UNAUTHORIZED=true`.
- [x] `DB_SSL_CA` configurada no ambiente do Render.
- [x] `SEED_DEMO_DATA=false` em produção após o seed inicial.
- [x] Nenhum `.env` ou senha enviado ao GitHub.

## D. Saúde e logs

- [x] `GET /api/health` retorna HTTP 200 com o banco disponível.
- [x] Logs do serviço podem ser consultados no Render sem credenciais expostas.
- [x] Health Check Path do Render configurado em `/api/health`.
- [ ] Monitoramento externo/alertas de disponibilidade adicionais.

## E. Container

- [x] Dockerfile construído com sucesso no CI e no Render.
- [x] Imagem inicia com `npm start`.
- [x] Aplicação responde ao health check em produção.
- [x] Variáveis são injetadas pelo ambiente, não pela imagem.

## F. CI

- [x] GitHub Actions executa `npm ci`.
- [x] GitHub Actions executa check/lint/formatação/testes/cobertura/E2E.
- [x] Integração MySQL e build Docker fazem parte do workflow.
- [x] CI aprovada nos commits da etapa Cloud.

## G. CD no Render

- [x] Serviço Docker conectado ao repositório e à branch `main`.
- [x] Auto Deploy configurado como `On Commit`.
- [x] Variáveis e credenciais de produção mantidas fora do repositório.
- [x] Deploy executado sem credenciais no código ou no workflow público.
- [x] Auto Deploy validado na prática: `d67f134` → `3365233` sem `Manual Deploy`.
- [x] Health check pós-deploy confirmado.

## H. Segurança

- [x] HTTPS público validado.
- [x] TLS entre Render e Aiven validado com CA.
- [x] Credencial do banco fora do GitHub.
- [ ] Criar usuário MySQL dedicado de menor privilégio em vez de conta administrativa.
- [ ] Restringir acesso de rede/IP ao MySQL quando compatível com a infraestrutura escolhida.
- [ ] Definir rotina de rotação de senha e backup para um cenário não acadêmico.

## I. Evidências acadêmicas

- [x] URL pública documentada no README e em `docs/cloud.md`.
- [x] `GET /api/health` público validado.
- [x] Dashboard público validado.
- [x] Banco gerenciado conectado e persistência comprovada após redeploy.
- [x] GitHub Actions/CI documentado.
- [x] Auto Deploy/CD documentado e validado por commit real.
- [ ] Capturas dedicadas do painel Render/Aiven para o pacote final de apresentação, se desejado.
