# Checklist de Deploy

Use esta lista apenas após escolher um provedor cloud compatível com Node.js e MySQL.

- [ ] Backend publicado
- [ ] URL HTTPS pública
- [ ] `GET /api/health` retorna `200`
- [ ] MySQL gerenciado conectado
- [ ] Schema aplicado com `npm run setup-db`
- [ ] `SEED_DEMO_DATA=false` em produção
- [ ] Secrets configurados somente na plataforma cloud
- [ ] CI aprovado no GitHub
- [ ] CD configurado e testado
- [ ] Dashboard público testado
- [ ] Logs de produção verificados sem segredos
- [ ] Backup do banco configurado

Status atual: **PENDENTE** — nenhum deploy real foi executado.