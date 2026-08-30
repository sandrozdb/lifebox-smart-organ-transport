# Checklist de Evidências Acadêmicas

Este checklist separa o que já foi validado no repositório do que ainda pode ganhar captura dedicada para a apresentação final.

## MVP e operação

- [x] Dashboard funcionando
- [x] Cálculo do plano ótimo
- [x] Alternativas terrestres, helicóptero e multimodais demonstradas
- [x] Cenário de temperatura crítica
- [x] Cenário de impacto crítico
- [x] LED e buzzer virtuais
- [x] Atraso operacional registrado sem acionar atuadores críticos
- [x] Gráficos/telemetria no dashboard
- [x] Física dinâmica reagindo aos cenários
- [x] Resumo final do transporte
- [x] Reotimização recomendada e aplicada com confirmação do operador

As evidências visuais estão catalogadas em `docs/evidencias/README.md`.

## Fundamentos acadêmicos

- [x] Diagrama C4 Context/Container
- [x] Evidência do padrão Strategy
- [x] Evidência do padrão Observer
- [x] Avaliação SOLID documentada
- [x] Tabela verdade/regra da lógica digital
- [x] Circuito Logisim funcional
- [x] Quatro estados do Logisim: normal, temperatura crítica, impacto crítico e transporte inativo

## Qualidade

- [x] `npm test` aprovado na validação local
- [x] 4/4 cenários E2E aprovados na validação pré-cloud
- [x] Workflow de CI verde no GitHub
- [x] Integração MySQL na CI
- [x] Build Docker na CI

## Cloud

- [x] Backend público no Render
- [x] URL `https://lifebox-expotech.onrender.com`
- [x] `GET /api/health` público respondendo
- [x] Aiven for MySQL conectado via TLS
- [x] Persistência validada após redeploy
- [x] Variáveis/credenciais de produção fora do GitHub
- [x] Auto Deploy do Render validado em push real para `main`
- [x] CI/CD documentado em `docs/ci-cd.md`
- [x] Checklist de deploy atualizado em `docs/deployment-checklist.md`
- [ ] Capturas dedicadas dos painéis Render/Aiven para slides/relatório final, se desejado

## Estado atual

**Cloud e requisitos técnicos principais validados.** A única pendência de evidência aqui é material visual adicional dos provedores para enriquecer a apresentação; ela não representa ausência de deploy ou de banco gerenciado.
