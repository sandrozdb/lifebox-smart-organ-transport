# Checklist de deploy — Render + Aiven

Status acadêmico da etapa Cloud: **CONCLUÍDO**. Os itens abertos abaixo são melhorias de hardening/operabilidade para um cenário além da demonstração acadêmica; não bloqueiam o requisito de backend público + banco gerenciado + variáveis seguras + CI/CD + integração IoT.

## A. Aplicação

- [x] Backend Node.js publicado com `npm start`.
- [x] `PORT` fornecida pelo ambiente Render.
- [x] Dashboard e API servidos pelo mesmo Express.
- [x] URL HTTPS pública: `https://lifebox-expotech.onrender.com`.
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
- [x] Baseline funcional `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2` validada pela **CI #152 SUCCESS**.
- [x] Suíte Node: 110 testes; 109 aprovados; 0 falhas; 1 skip condicional.
- [x] Cobertura c8: 88,28% linhas/instruções; 79,08% branches; 93,71% funções.
- [x] Playwright: 5/5 E2E aprovados.
- [x] Integração MySQL dedicada: 1/1 aprovada.
- [x] Build Docker aprovado.
- [x] Testes cobrem vínculo da telemetria IoT à execução.
- [x] Testes cobrem Condições Logísticas disponíveis no modo IOT.

## G. CD no Render

- [x] Serviço Docker conectado ao repositório e à branch `main`.
- [x] Auto Deploy configurado como `On Commit`.
- [x] Variáveis e credenciais mantidas fora do repositório.
- [x] Deploy executado sem credenciais no código ou workflow público.
- [x] Auto Deploy validado durante a etapa Cloud e integração IoT.
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
- [x] Capturas finais do Wokwi/IoT adicionadas em `docs/evidencias/iot/` (**9/9**).
- [x] Capturas finais do Render/Aiven/CI/health/dashboard adicionadas em `docs/evidencias/cloud/` (**8/8**).

## Estado final

Pacote visual final concluído: **IoT 9/9** e **Cloud 8/8**. A referência funcional de fechamento é o commit `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2`, validado pela **CI #152 SUCCESS**. Novas execuções de CI decorrentes apenas de atualização documental não substituem essa baseline funcional.
