# Checklist de deploy — Render + Aiven

Status acadêmico da etapa Cloud: **CONCLUÍDO**. Os itens abertos abaixo são melhorias de hardening/operabilidade ou capturas visuais adicionais; não bloqueiam o requisito de backend público + banco gerenciado + variáveis seguras + CI/CD + integração IoT.

## A. Aplicação

- [x] Backend Node.js publicado com `npm start`.
- [x] `PORT` fornecida pelo ambiente Render.
- [x] Dashboard e API servidos pelo mesmo Express.
- [x] URL HTTPS pública atual: `https://lifebox-expotech.onrender.com`.
- [x] Firmware ESP32/Wokwi apontando para o mesmo backend público.

## B. Banco MySQL gerenciado

- [x] Instância Aiven for MySQL criada.
- [x] Banco `lifebox_db` criado.
- [x] Schema aplicado com `npm run setup-db`.
- [x] Conexão TLS configurada com o certificado CA do Aiven.
- [x] Persistência validada após redeploy do Render.
- [x] Leituras IoT persistidas com vínculo à execução ativa.
- [ ] Estratégia formal de backup revisada/documentada para uso além da demo.

## C. Variáveis de ambiente

- [x] `NODE_ENV=production`.
- [x] `DB_DRIVER=mysql`.
- [x] `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` configuradas no Render.
- [x] `DB_SSL=true` e `DB_SSL_REJECT_UNAUTHORIZED=true`.
- [x] `DB_SSL_CA` configurada no ambiente do Render.
- [x] `SEED_DEMO_DATA=false` no ambiente publicado após o seed inicial.
- [x] Nenhum `.env`, senha ou certificado real enviado ao GitHub.

## D. Saúde e logs

- [x] `GET /api/health` retorna HTTP 200 com o banco disponível.
- [x] Logs do serviço podem ser consultados no Render sem credenciais expostas.
- [x] Health Check Path do Render configurado em `/api/health`.
- [x] Dispositivo Wokwi validado como online no fluxo IoT.
- [ ] Monitoramento externo/alertas de disponibilidade adicionais.

## E. Container

- [x] Dockerfile construído com sucesso no CI e no Render.
- [x] Imagem inicia com `npm start`.
- [x] Aplicação responde ao health check no ambiente publicado.
- [x] Variáveis são injetadas pelo ambiente, não pela imagem.

## F. CI

- [x] GitHub Actions executa `npm ci`.
- [x] GitHub Actions executa check/lint/formatação/testes/cobertura/E2E.
- [x] Integração MySQL e build Docker fazem parte do workflow.
- [x] CI #84 aprovada em 31/08/2026.
- [x] Testes cobrem vínculo da telemetria IoT à execução.
- [x] Testes cobrem Condições Logísticas disponíveis no modo IOT.
- [x] Playwright atualizado para o comportamento final IOT.

## G. CD no Render

- [x] Serviço Docker conectado ao repositório e à branch `main`.
- [x] Auto Deploy configurado como `On Commit`.
- [x] Variáveis e credenciais mantidas fora do repositório.
- [x] Deploy executado sem credenciais no código ou workflow público.
- [x] Auto Deploy validado durante a etapa Cloud.
- [x] Commit `5db314d` da PR #7 publicado antes da validação manual final do IOT.
- [x] Health check pós-deploy confirmado.

## H. Integração IoT

- [x] Projeto ESP32 público no Wokwi.
- [x] DHT22, MPU6050, GPS, bateria, RSSI, OLED, LED e buzzer integrados.
- [x] Telemetria enviada ao Render por HTTPS.
- [x] Backend associa leitura física ao `execucao_atual_id`.
- [x] Gráficos IoT alimentados pela execução corrente.
- [x] Análise Física IoT validada.
- [x] Resumo final IoT validado.
- [x] Cenários da caixa bloqueados em IOT.
- [x] Condições Logísticas disponíveis em IOT.
- [x] Reotimização e mudança de rota validadas em IOT.

## I. Segurança

- [x] HTTPS público validado.
- [x] TLS entre Render e Aiven validado com CA.
- [x] Credencial do banco fora do GitHub.
- [x] Backend é fonte de verdade do `executionId` e regras de alerta.
- [ ] Criar usuário MySQL dedicado de menor privilégio em vez de conta administrativa.
- [ ] Restringir acesso de rede/IP ao MySQL quando compatível com a infraestrutura escolhida.
- [ ] Definir rotina de rotação de senha e backup para um cenário não acadêmico.

## J. Evidências acadêmicas

- [x] URL pública documentada no README e em `docs/cloud.md`.
- [x] `GET /api/health` público validado.
- [x] Dashboard público validado.
- [x] Banco gerenciado conectado e persistência comprovada.
- [x] GitHub Actions/CI documentado.
- [x] Auto Deploy/CD documentado e validado.
- [x] Pastas e nomes finais de evidências IoT preparados.
- [x] Pastas e nomes finais de evidências Cloud preparados.
- [ ] Subir capturas finais do Wokwi/IoT em `docs/evidencias/iot/`.
- [ ] Subir capturas finais do Render/Aiven/CI em `docs/evidencias/cloud/`.

As duas últimas pendências são apenas upload de material visual. O sistema e a infraestrutura correspondentes já foram validados.
