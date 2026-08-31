<p align="center">
  <img src="assets/cover.svg" alt="LifeBox — monitoramento inteligente para transporte de órgãos" width="100%">
</p>

# LifeBox — Smart Organ Transport

[![CI](https://github.com/sandrozdb/lifebox-smart-organ-transport/actions/workflows/ci.yml/badge.svg)](https://github.com/sandrozdb/lifebox-smart-organ-transport/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](package.json)

LifeBox é um sistema acadêmico de apoio à decisão, rastreabilidade e monitoramento IoT para transporte de órgãos. O projeto integra planejamento multimodal com Pesquisa Operacional, execução rastreável, reotimização confirmada pelo operador, telemetria física simulada por ESP32/Wokwi, Física, Eletrônica Digital, MySQL gerenciado e infraestrutura em nuvem em uma única demonstração verificável.

**Deploy público atual:** https://lifebox-expotech-iot-test.onrender.com  
**Health check:** https://lifebox-expotech-iot-test.onrender.com/api/health  
**Wokwi público:** https://wokwi.com/projects/473749722940837889

## Status atual

**MVP acadêmico concluído e validado de ponta a ponta.** O fluxo IoT está integrado ao backend público: o ESP32/Wokwi envia telemetria real do simulador para o Render, o backend vincula cada leitura à execução ativa, persiste no Aiven for MySQL e atualiza dashboard, gráficos, Física e resumo final. Condições logísticas continuam disponíveis no modo IoT e podem acionar a reotimização sem transformar eventos operacionais em telemetria artificial.

| Área                 | Tecnologia / estado                                                |
| -------------------- | ------------------------------------------------------------------ |
| Backend              | Node.js 20 / Express em Docker no Render                           |
| IoT                  | ESP32 no Wokwi Web, DHT22, MPU6050, GPS NEO-6M, OLED, LED e buzzer |
| Banco                | Aiven for MySQL gerenciado, persistência por execução e TLS/CA     |
| Frontend e mapa      | HTML, CSS, JavaScript, Leaflet / OpenStreetMap                     |
| Pesquisa Operacional | planejamento multimodal, restrições e reotimização confirmada      |
| Física               | análise dinâmica da execução com telemetria vinculada              |
| Eletrônica           | lógica digital + Logisim + atuadores virtuais/IoT                  |
| Testes               | `node:test`, c8, Playwright E2E e integração MySQL                 |
| Arquitetura          | C4 Context/Container, Strategy, Observer e SOLID documentado       |
| CI/CD                | GitHub Actions + Auto Deploy do Render na `main`                   |
| Cloud                | HTTPS público + Render + Aiven MySQL + secrets fora do repositório |

**Links rápidos:** [IoT](docs/iot.md) · [Arquitetura](docs/architecture.md) · [Cloud](docs/cloud.md) · [Pesquisa Operacional](docs/operations-research.md) · [API](docs/api.md) · [QA](docs/testing-and-qa.md) · [Demo](docs/demo-guide.md) · [Evidências](docs/evidencias/README.md) · [Requisitos](docs/academic-requirements.md) · [Eletrônica](docs/electronics.md) · [Física](docs/physics.md)

## Aviso acadêmico

Este é um projeto acadêmico e demonstrativo. A LifeBox não é um dispositivo médico certificado, não substitui protocolos clínicos, não constitui recomendação médica e não confirma a preservação de órgãos. Os parâmetros de preservação apresentados são referências acadêmicas e devem ser interpretados somente dentro desse contexto.

## Funcionalidades

- dashboard com telemetria, mapa, gráficos, alertas, timeline, Física e resumo por execução;
- perfis de preservação por órgão, faixa térmica de referência, isquemia e margem;
- planos terrestres, helicóptero e multimodais com avião; avião não é solução direta hospital→hospital;
- plano congelado durante a execução e reotimização aplicada somente após confirmação do operador;
- telemetria IoT com temperatura, umidade, aceleração/impacto, bateria, sinal, GPS e velocidade;
- vínculo server-side entre telemetria física e `execucao_atual_id`, sem exigir que o ESP32 conheça o ID da execução;
- Física didática da execução atual: ΔT, taxa, Q, aceleração, potência, energia e autonomia;
- lógica digital `ATIVO AND (TEMP_CRÍTICA OR IMPACTO_CRÍTICO)` com LED/buzzer e circuito Logisim;
- separação de responsabilidades entre os modos: sensores vêm do ESP32 no IOT e do simulador no DEMO;
- condições logísticas disponíveis nos dois modos, com reotimização da PO sem falsificar sensores;
- API Express pública no Render, persistência em Aiven for MySQL via TLS;
- health check público em `/api/health`, CI no GitHub Actions e Auto Deploy do Render.

## Modos de operação

### IOT

```text
Sensores Wokwi → ESP32 → HTTPS → Render/Express → Aiven MySQL
                                      ↓
                          Dashboard + regras + Física
                                      ↓
                           digitalSignal → ESP32
```

No modo **IOT**, Temperatura, Impacto, Umidade, Bateria e Sinal são provenientes do ESP32/Wokwi e não podem ser forçados pelos botões de cenário do dashboard. As **Condições Logísticas** permanecem disponíveis ao operador, pois representam eventos externos à caixa, como trânsito, atraso ou indisponibilidade de um modal.

### DEMO

No modo **DEMO**, o próprio simulador gera a telemetria acadêmica e também permite condições logísticas. O backend continua sendo a fonte de verdade das regras e da reotimização.

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

A arquitetura real, C4 Context/Container, sequência da reotimização, Strategy, Observer, SOLID e trade-offs estão em [docs/architecture.md](docs/architecture.md). A integração ESP32/Wokwi está detalhada em [docs/iot.md](docs/iot.md) e [firmware/README.md](firmware/README.md).

## Disciplinas integradas

| Frente               | Implementação                               | Dashboard / documento         |
| -------------------- | ------------------------------------------- | ----------------------------- |
| Pesquisa Operacional | plano multimodal, restrições e reotimização | planejamento e mapa           |
| Física               | cálculos didáticos da execução atual        | Análise Física expansível     |
| Eletrônica           | `digitalAlertLogic`, ESP32/Wokwi e Logisim  | atuadores e sinais lógicos    |
| Arquitetura          | C4, Strategy, Observer, SOLID               | painel técnico e documentação |
| QA                   | check, lint, testes, coverage, E2E e CI     | documentação de QA            |
| Cloud                | Render + Aiven + TLS + CI/CD                | status real: concluído        |

Veja [requisitos acadêmicos](docs/academic-requirements.md).

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

A validação atual inclui testes específicos para vínculo da telemetria IoT à execução e para a disponibilidade das condições logísticas no modo IOT. A CI #84 foi concluída com sucesso em 31/08/2026; a suíte Node descobriu 108 testes, com 107 aprovados e 1 integração condicional ignorada nessa etapa, e o Playwright aprovou 5/5 fluxos E2E. Detalhes estão em [docs/testing-and-qa.md](docs/testing-and-qa.md).

## Render + Aiven

O backend público usado pelo firmware IoT está em https://lifebox-expotech-iot-test.onrender.com, publicado como Web Service Docker no Render. O banco de produção acadêmica é um **Aiven for MySQL** gerenciado. A comunicação Render → Aiven usa TLS com validação de CA; credenciais e certificado ficam em variáveis do ambiente do provedor e não são versionados.

O banco `lifebox_db` mantém transportes, leituras, alertas, eventos de rastreabilidade e resumos por execução. A persistência após redeploy foi validada, assim como o Auto Deploy do Render a partir da branch `main`.

O plano gratuito do Render pode entrar em suspensão por inatividade, causando atraso na primeira requisição após o período ocioso. Backup avançado, observabilidade externa, usuário MySQL dedicado de menor privilégio e restrição de rede permanecem como hardening futuro, sem bloquear a entrega acadêmica.

Detalhes: [docs/cloud.md](docs/cloud.md), [docs/database.md](docs/database.md), [docs/ci-cd.md](docs/ci-cd.md) e [docs/deployment-checklist.md](docs/deployment-checklist.md).

## Evidências

As 20 capturas anteriores continuam preservadas como baseline pré-cloud. O repositório também está **preparado para receber as evidências finais de IoT e Cloud** com nomes padronizados e checklist pronto para upload:

- [Catálogo geral](docs/evidencias/README.md)
- [Evidências IoT — pasta pronta para upload](docs/evidencias/iot/README.md)
- [Evidências Cloud — pasta pronta para upload](docs/evidencias/cloud/README.md)
- [Checklist final de evidências](docs/evidence-checklist.md)
- [Eletrônica digital e Logisim](docs/electronics-evidence.md)

![Operação normal da LifeBox](docs/evidencias/dashboard/01-dashboard-normal.png)

## Estrutura

```text
public/      dashboard HTML, CSS e JavaScript
src/         API, serviços, regras e persistência
simulator/   telemetria e cenários DEMO
database/    schema MySQL
electronics/ circuito Logisim
firmware/    ESP32/Wokwi, sensores e atuadores
docs/        documentação técnica e evidências
tests/       testes unitários, integração e E2E
```

## Próximas etapas

- subir as capturas finais de IoT e Cloud nas pastas já preparadas em `docs/evidencias/`;
- opcionalmente montar um protótipo físico baseado no firmware validado no Wokwi;
- evoluir hardening, backup e observabilidade para um cenário além da demonstração acadêmica;
- preparar apresentação final, vídeo/pitch e release da ExpoTech.

## Licença

Este projeto está licenciado sob a MIT License. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
