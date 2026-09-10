# Checklist de Evidências Acadêmicas

Este checklist registra o estado final da entrega acadêmica e das evidências versionadas.

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
- [x] Capturas finais IoT adicionadas usando o padrão da pasta (**9/9**).

## Fundamentos acadêmicos

- [x] Diagrama C4 Context/Container atualizado para ESP32/Wokwi + Render + Aiven.
- [x] Evidência do padrão Strategy.
- [x] Evidência do padrão Observer.
- [x] Avaliação SOLID documentada.
- [x] Regra combinacional de geração de `EVENTO_CRITICO` documentada.
- [x] Circuito Logisim sequencial com D Flip-Flop funcional.
- [x] Tabela de estados e reset assíncrono documentados.
- [x] Quatro evidências visuais atuais do Flip-Flop adicionadas (**4/4**).

## Qualidade

- [x] Baseline funcional no commit `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2`.
- [x] GitHub Actions **CI #152 SUCCESS**.
- [x] 110 testes descobertos; 109 aprovados; 0 falhas; 1 skip condicional.
- [x] Cobertura c8: 88,28% linhas/instruções; 79,08% branches; 93,71% funções.
- [x] 5/5 cenários E2E aprovados.
- [x] Integração MySQL dedicada aprovada.
- [x] Build Docker aprovado.
- [x] Teste de vínculo IoT → execução ativa.
- [x] Teste de associação dispositivo → transporte.
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
- [x] Capturas finais Render/Aiven/CI/health/dashboard adicionadas (**8/8**).

## Evidências históricas

- [x] 20 capturas pré-cloud preservadas.
- [x] Evidência antiga de Cloud marcada explicitamente como histórica.
- [x] Circuito Logisim sequencial e quatro capturas eletrônicas atuais preservados.

## Estado final

**Sistema, IoT, Cloud e requisitos acadêmicos principais estão concluídos e validados.** O pacote visual final contém IoT `9/9`, Cloud `8/8` e Eletrônica/Logisim `4/4`.

A referência funcional de fechamento é a `main` no commit `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2`, validada pela **CI #152 SUCCESS**. Atualizações posteriores de documentação podem gerar novas execuções de CI sem alterar essa baseline funcional.

Use:

- `docs/evidencias/iot/README.md` para as capturas IoT;
- `docs/evidencias/cloud/README.md` para Render/Aiven/CI;
- `docs/evidencias/eletronica/README.md` para Logisim;
- `docs/evidencias/README.md` como catálogo geral.
