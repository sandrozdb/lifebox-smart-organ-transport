# Checklist de Evidências Acadêmicas

Este checklist separa o que já foi validado tecnicamente do que ainda precisa apenas de captura visual final.

## MVP e operação

- [x] Dashboard funcionando.
- [x] Cálculo do plano ótimo.
- [x] Alternativas terrestres, helicóptero e multimodais demonstradas.
- [x] Cenários de temperatura e impacto no modo DEMO.
- [x] LED e buzzer virtuais.
- [x] Atraso operacional sem acionar atuadores críticos.
- [x] Gráficos/telemetria no dashboard.
- [x] Física dinâmica.
- [x] Resumo final do transporte.
- [x] Reotimização recomendada e aplicada com confirmação do operador.

## IoT / Wokwi

- [x] ESP32 executado no Wokwi Web.
- [x] DHT22, MPU6050, GPS, bateria e RSSI integrados.
- [x] OLED, LED e buzzer integrados.
- [x] Telemetria enviada por HTTPS ao Render.
- [x] ESP32 ONLINE no dashboard.
- [x] Backend vinculando leitura à execução ativa.
- [x] Gráficos IoT preenchidos.
- [x] Análise Física usando a execução IoT.
- [x] Resumo final IoT com telemetria agregada.
- [x] Cenários manuais da caixa bloqueados no modo IOT.
- [x] Condições Logísticas disponíveis no modo IOT.
- [x] Reotimização e troca de rota funcionando durante IOT.
- [x] Pasta `docs/evidencias/iot/` preparada com nomes finais.
- [ ] Subir as capturas finais IoT usando o padrão da pasta.

## Fundamentos acadêmicos

- [x] Diagrama C4 Context/Container atualizado para ESP32/Wokwi + Render + Aiven.
- [x] Evidência do padrão Strategy.
- [x] Evidência do padrão Observer.
- [x] Avaliação SOLID documentada.
- [x] Regra combinacional de geração de `EVENTO_CRITICO` documentada.
- [x] Circuito Logisim sequencial com D Flip-Flop funcional.
- [x] Tabela de estados e reset assíncrono documentados.
- [x] Quatro evidências visuais atuais do Flip-Flop adicionadas.

## Qualidade

- [x] `npm test` cobriu 108 testes na CI #84.
- [x] 107 aprovados, 0 falhas e 1 integração condicional ignorada nessa etapa.
- [x] 5/5 cenários E2E aprovados.
- [x] Workflow de CI verde no GitHub.
- [x] Integração MySQL na CI.
- [x] Build Docker na CI.
- [x] Teste de vínculo IoT → execução ativa.
- [x] Teste de Condições Logísticas no modo IOT.

## Cloud

- [x] Backend público no Render.
- [x] URL atual `https://lifebox-expotech.onrender.com`.
- [x] `GET /api/health` público respondendo.
- [x] Aiven for MySQL conectado via TLS/CA.
- [x] Persistência validada após redeploy.
- [x] Variáveis/credenciais fora do GitHub.
- [x] Auto Deploy do Render validado a partir da `main`.
- [x] CI/CD documentado em `docs/ci-cd.md`.
- [x] Checklist de deploy atualizado em `docs/deployment-checklist.md`.
- [x] Pasta `docs/evidencias/cloud/` preparada com nomes finais.
- [ ] Subir as capturas finais Render/Aiven/CI/health usando o padrão da pasta.

## Evidências históricas

- [x] 20 capturas pré-cloud preservadas.
- [x] Evidência antiga de Cloud marcada explicitamente como histórica.
- [x] Circuito Logisim sequencial e quatro capturas eletrônicas atuais preservados.

## Estado atual

**Sistema, IoT, Cloud e requisitos acadêmicos principais estão concluídos e validados.** As únicas pendências deste checklist são os uploads das novas capturas finais para enriquecer GitHub, slides e relatório.

Use:

- `docs/evidencias/iot/README.md` para as capturas IoT;
- `docs/evidencias/cloud/README.md` para Render/Aiven/CI;
- `docs/evidencias/README.md` como catálogo geral.
