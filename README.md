<p align="center">
  <img src="assets/cover.svg" alt="LifeBox — monitoramento inteligente para transporte de órgãos" width="100%">
</p>

# LifeBox — Smart Organ Transport

[![CI](https://github.com/sandrozdb/lifebox-smart-organ-transport/actions/workflows/ci.yml/badge.svg)](https://github.com/sandrozdb/lifebox-smart-organ-transport/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](package.json)

LifeBox é um sistema acadêmico de apoio à decisão, rastreabilidade e monitoramento IoT para transporte de órgãos. O projeto integra planejamento multimodal com Pesquisa Operacional, execução rastreável, reotimização confirmada pelo operador, telemetria física simulada por ESP32/Wokwi, Física, Eletrônica Digital, MySQL gerenciado e infraestrutura em nuvem em uma única demonstração verificável.

**Deploy público:** https://lifebox-expotech.onrender.com  
**Health check:** https://lifebox-expotech.onrender.com/api/health  
**Wokwi:** https://wokwi.com/projects/473749722940837889  
**Relatório técnico:** [LifeBox — Relatório Técnico — ExpoTech 2026.2](docs/LifeBox-Relatorio-Tecnico-ExpoTech-2026.2.pdf)

## Status da entrega

**MVP acadêmico concluído e validado de ponta a ponta.** O ESP32/Wokwi envia telemetria ao backend público no Render; o backend vincula cada leitura à execução ativa, persiste no Aiven for MySQL e atualiza dashboard, gráficos, Física, alertas, atuadores, reotimização e resumo final.

| Área | Tecnologia / estado |
| --- | --- |
| Backend | Node.js 20 / Express em Docker no Render |
| IoT | ESP32/Wokwi, DHT22, MPU6050, GPS NEO-6M, OLED, LED e buzzer |
| Banco | Aiven for MySQL gerenciado, persistência por execução e TLS/CA |
| Frontend e mapa | HTML, CSS, JavaScript, Leaflet / OpenStreetMap |
| Pesquisa Operacional | planejamento multimodal, restrições e reotimização confirmada |
| Física | análise dinâmica da execução com telemetria vinculada |
| Eletrônica | lógica combinacional no backend/Wokwi + extensão sequencial no Logisim |
| Arquitetura | C4 Context/Container, Strategy, Observer e SOLID |
| QA | `node:test`, c8, Playwright, MySQL integration e Docker build |
| CI/CD | GitHub Actions + Auto Deploy do Render na `main` |
| Cloud | HTTPS público + Render + Aiven MySQL + segredos fora do repositório |

**Pacote final de evidências:** IoT `9/9` · Cloud `8/8` · Eletrônica/Logisim `4/4`.

**Baseline funcional fechada:** commit `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2`, validado pela GitHub Actions **CI #152** em 09/09/2026. Nessa execução: **110 testes**, **109 aprovados**, **1 skip condicional**, **0 falhas**, cobertura c8 de **88,28% linhas/instruções**, **79,08% branches** e **93,71% funções**, **5/5 E2E**, integração MySQL aprovada e build Docker aprovado. Alterações posteriores de documentação não mudam essa baseline funcional.

**Links rápidos:** [IoT](docs/iot.md) · [Arquitetura](docs/architecture.md) · [Cloud](docs/cloud.md) · [Pesquisa Operacional](docs/operations-research.md) · [API](docs/api.md) · [QA](docs/testing-and-qa.md) · [Demo](docs/demo-guide.md) · [Evidências](docs/evidencias/README.md) · [Requisitos](docs/academic-requirements.md) · [Eletrônica](docs/electronics.md) · [Física](docs/physics.md)

## Aviso acadêmico

Este é um projeto acadêmico e demonstrativo. A LifeBox não é um dispositivo médico certificado, não substitui protocolos clínicos, não constitui recomendação médica e não confirma a preservação de órgãos. Os parâmetros apresentados são referências acadêmicas e devem ser interpretados somente dentro desse contexto.

## Funcionalidades

- dashboard com telemetria, mapa, gráficos, alertas, timeline, Física e resumo por execução;
- perfis de preservação por órgão, faixa térmica de referência, isquemia e margem;
- planos terrestres, helicóptero e multimodais com avião;
- plano congelado durante a execução e reotimização aplicada somente após confirmação do operador;
- telemetria IoT com temperatura, umidade, aceleração/impacto, bateria, sinal, GPS e velocidade;
- vínculo server-side entre telemetria física e `execucao_atual_id`, sem exigir que o ESP32 conheça o ID da execução;
- Física didática: ΔT, taxa, Q, aceleração, potência, energia e autonomia;
- lógica digital `ATIVO AND (TEMP_CRÍTICA OR IMPACTO_CRÍTICO)` com LED/buzzer;
- circuito Logisim com D Flip-Flop como extensão sequencial acadêmica separada;
- separação entre sensores IoT e condições logísticas externas;
- API Express pública, persistência MySQL via TLS, health check, CI e Auto Deploy.

## Modos de operação

### IOT

```text
Sensores Wokwi → ESP32 → HTTPS → Render/Express → Aiven MySQL
                                      ↓
                          Dashboard + regras + Física
                                      ↓
                           digitalSignal → ESP32
```

No modo **IOT**, Temperatura, Impacto, Umidade, Bateria e Sinal são provenientes do ESP32/Wokwi. As **Condições Logísticas** permanecem disponíveis ao operador porque representam eventos externos à caixa, como trânsito, atraso ou indisponibilidade de um modal.

### DEMO

No modo **DEMO**, o simulador gera a telemetria acadêmica e também permite condições logísticas. O backend continua sendo a fonte de verdade das regras e da reotimização.

## Arquitetura publicada

```text
ESP32/Wokwi ──HTTPS──┐
                     ↓
Operador ──HTTPS──> Render Web Service (Node.js + Express)
                     ↓ MySQL/TLS
               Aiven for MySQL
                     ↓
       Dashboard, gráficos, Física, alertas,
       timeline, resumo e reotimização
```

A arquitetura C4, sequência da reotimização, Strategy, Observer, SOLID e trade-offs estão em [docs/architecture.md](docs/architecture.md). A integração ESP32/Wokwi está detalhada em [docs/iot.md](docs/iot.md) e [firmware/README.md](firmware/README.md).

## Disciplinas integradas

| Frente | Implementação | Evidência principal |
| --- | --- | --- |
| Pesquisa Operacional | plano multimodal, restrições e reotimização | planejamento, mapa e `docs/operations-research.md` |
| Física | cálculos didáticos da execução atual | Análise Física + `docs/physics.md` |
| Eletrônica | lógica digital, ESP32/Wokwi e Logisim | atuadores + `docs/electronics.md` |
| Arquitetura | C4, Strategy, Observer e SOLID | `docs/architecture.md` |
| QA | check, lint, coverage, E2E, MySQL e Docker | `docs/testing-and-qa.md` |
| Cloud | Render + Aiven + TLS + CI/CD | `docs/cloud.md` e evidências Cloud |

Veja também [requisitos acadêmicos](docs/academic-requirements.md).

## Execução local

Pré-requisitos: Node.js 20+ e MySQL 8 local, ou repository em memória conforme configuração de ambiente.

```powershell
npm install
Copy-Item .env.example .env
npm run setup-db
npm start
```

Abra `http://localhost:3000`. O `.env` permanece local e não deve conter credenciais em documentação ou commits.

## Testes

```powershell
npm run check
npm run lint
npm run format:check
npm test
npm run coverage
npm run e2e
```

A baseline funcional final está documentada em [docs/testing-and-qa.md](docs/testing-and-qa.md). O badge no topo do README sempre mostra o estado mais recente da workflow.

## Render + Aiven

O backend público usado pelo firmware IoT está em `https://lifebox-expotech.onrender.com`, publicado como Web Service Docker no Render. O banco de produção acadêmica é um **Aiven for MySQL** gerenciado. A comunicação Render → Aiven usa TLS com validação de CA; credenciais e certificado ficam em variáveis do ambiente do provedor e não são versionados.

O banco `lifebox_db` mantém transportes, leituras, alertas, eventos de rastreabilidade e resumos por execução. A persistência após redeploy foi validada, assim como o Auto Deploy do Render a partir da branch `main`.

O plano gratuito do Render pode apresentar cold start após inatividade. Backup avançado, observabilidade externa, usuário MySQL dedicado de menor privilégio e restrição de rede permanecem como hardening futuro e não bloqueiam a entrega acadêmica.

Detalhes: [docs/cloud.md](docs/cloud.md), [docs/database.md](docs/database.md), [docs/ci-cd.md](docs/ci-cd.md) e [docs/deployment-checklist.md](docs/deployment-checklist.md).

## Evidências

O pacote final está versionado em [`docs/evidencias`](docs/evidencias/README.md):

- [IoT / Wokwi — 9/9](docs/evidencias/iot/README.md)
- [Cloud — 8/8](docs/evidencias/cloud/README.md)
- [Eletrônica / Flip-Flop](docs/evidencias/eletronica/README.md)
- [Checklist final](docs/evidence-checklist.md)

As 20 capturas pré-cloud também permanecem preservadas como baseline histórica. A captura antiga de Cloud é explicitamente histórica e não representa o ambiente publicado atual.

## Estrutura

```text
public/      dashboard HTML, CSS e JavaScript
src/         API, serviços, regras e persistência
simulator/   telemetria e cenários DEMO
database/    schema MySQL
electronics/ circuito Logisim
firmware/    ESP32/Wokwi, sensores e atuadores
docs/        documentação técnica, relatório e evidências
tests/       testes unitários, integração e E2E
```

## Apresentação ExpoTech

A apresentação final foi planejada como demonstração ao vivo: dashboard no notebook e Wokwi em um segundo monitor/TV. O roteiro está em [`docs/demo-guide.md`](docs/demo-guide.md), com evidências locais como plano B caso a internet não esteja disponível.

## Evoluções futuras

- opcionalmente montar um protótipo físico baseado no firmware validado no Wokwi;
- evoluir hardening, backups, observabilidade e controle de acesso para um cenário além da demonstração acadêmica;
- integrar provedores externos de dados logísticos quando fizer sentido fora do contexto acadêmico.

## Licença

Este projeto está licenciado sob a MIT License. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
