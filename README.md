<p align="center">
  <img src="assets/cover.svg" alt="LifeBox — monitoramento inteligente para transporte de órgãos" width="100%">
</p>

# LifeBox — Smart Organ Transport

[![CI](https://github.com/sandrozdb/lifebox-smart-organ-transport/actions/workflows/ci.yml/badge.svg)](https://github.com/sandrozdb/lifebox-smart-organ-transport/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](package.json)

LifeBox é um sistema acadêmico de apoio à decisão e rastreabilidade para transporte de órgãos. O diferencial é integrar planejamento multimodal sob restrições, execução rastreável, reotimização confirmada pelo operador, monitoramento simulado, Física, Eletrônica e infraestrutura em nuvem em uma única demonstração verificável.

**Deploy público:** https://lifebox-expotech.onrender.com

## Stack e status

| Área            | Tecnologia / estado                                                       |
| --------------- | ------------------------------------------------------------------------- |
| Backend         | Node.js 20 / Express em Docker no Render                                  |
| Banco           | Aiven for MySQL gerenciado; repository em memória nos testes              |
| Frontend e mapa | HTML, CSS, JavaScript, Leaflet / OpenStreetMap                            |
| Testes          | `node:test`, coverage e Playwright E2E                                    |
| Arquitetura     | C4 Context/Container, Strategy, Observer e SOLID documentado honestamente |
| CI/CD           | GitHub Actions + Auto Deploy do Render                                    |
| Cloud           | **CONCLUÍDA**: HTTPS público, MySQL gerenciado, secrets e CD validados    |

**Links rápidos:** [Deploy](https://lifebox-expotech.onrender.com) · [Arquitetura](docs/architecture.md) · [Cloud](docs/cloud.md) · [Pesquisa Operacional](docs/operations-research.md) · [API](docs/api.md) · [QA](docs/testing-and-qa.md) · [Validação pré-cloud](docs/pre-cloud-validation.md) · [Demo](docs/demo-guide.md) · [Evidências](docs/evidencias/README.md) · [Requisitos](docs/academic-requirements.md) · [Eletrônica](docs/electronics.md) · [Física](docs/physics.md)

## Aviso acadêmico

Este é um projeto acadêmico e demonstrativo. A LifeBox não é um dispositivo médico certificado, não substitui protocolos clínicos, não constitui recomendação médica e não confirma a preservação de órgãos. Os parâmetros de preservação apresentados são referências acadêmicas e devem ser interpretados somente dentro desse contexto.

## Funcionalidades

- dashboard com telemetria, mapa, alertas, timeline e resumo por execução;
- perfis de preservação por órgão, faixa térmica de referência, isquemia e margem;
- planos terrestres, helicóptero e multimodais com avião; avião não é solução direta hospital→hospital;
- plano congelado durante a execução e reotimização aplicada somente após confirmação;
- Física didática da execução atual: ΔT, taxa, Q, aceleração, potência, energia e autonomia;
- lógica digital `ATIVO AND (TEMP_CRÍTICA OR IMPACTO_CRÍTICO)` com LED/buzzer virtuais e circuito Logisim;
- API Express em produção no Render, com persistência em Aiven for MySQL via TLS;
- health check público em `/api/health`, CI no GitHub Actions e Auto Deploy do Render.

## Arquitetura

```text
Simulador / futuro ESP32
          ↓ HTTPS
Render Web Service (Node.js + Express)
          ↓ MySQL/TLS
Aiven for MySQL
          ↓
Dashboard, mapa, alertas, timeline e reotimização
```

A arquitetura real, C4 Context/Container, sequência da reotimização, Strategy, Observer, SOLID e trade-offs estão em [docs/architecture.md](docs/architecture.md).

## Disciplinas integradas

| Frente               | Implementação                               | Dashboard / documento         |
| -------------------- | ------------------------------------------- | ----------------------------- |
| Pesquisa Operacional | plano multimodal, restrições e reotimização | planejamento e mapa           |
| Física               | cálculos didáticos da execução atual        | Análise Física expansível     |
| Eletrônica           | `digitalAlertLogic` + Logisim               | atuadores e sinais lógicos    |
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

Abra [http://localhost:3000](http://localhost:3000). O `.env` permanece local e não deve conter credenciais em documentação ou commits.

## Testes

```powershell
npm run check
npm run lint
npm run format:check
npm test
npm run coverage
npm run e2e
```

A estratégia, o checklist E2E manual e o caso de bug de interface estão em [docs/testing-and-qa.md](docs/testing-and-qa.md). O CI executa as validações definidas no workflow em push e pull request.

## Infraestrutura e limites

O backend está publicado em https://lifebox-expotech.onrender.com por meio de um Web Service Docker no Render. O banco de produção é um Aiven for MySQL gerenciado, acessado com TLS e certificado CA. Variáveis sensíveis são mantidas no ambiente do provedor, fora do repositório. A persistência foi validada após redeploy e o Auto Deploy do Render foi validado a partir de commits na `main`. Detalhes estão em [docs/cloud.md](docs/cloud.md).

O serviço usa a camada gratuita do Render e pode entrar em suspensão por inatividade, causando atraso na primeira requisição após o período ocioso. Backup avançado e observabilidade permanecem como melhorias futuras, sem bloquear a entrega acadêmica atual.

## Evidências

- [Catálogo das 20 evidências reais](docs/evidencias/README.md)
- [Galeria do dashboard](docs/evidencias/dashboard/README.md)
- [Eletrônica digital e Logisim](docs/electronics-evidence.md)
- [Circuito Logisim](electronics/lifebox-alert-logic.circ)

![Operação normal da LifeBox](docs/evidencias/dashboard/01-dashboard-normal.png)

## Estrutura

```text
public/      dashboard HTML, CSS e JavaScript
src/         API, serviços, regras e persistência
simulator/   telemetria e cenários simulados
database/    schema MySQL
electronics/ circuito Logisim
docs/        documentação técnica e evidências
tests/       testes automatizados
```

## Próximas etapas

- integrar ESP32/sensores via Wokwi à mesma API pública, mantendo o backend como fonte de verdade;
- consolidar evidências da integração IoT + Cloud;
- evoluir backup e observabilidade do ambiente publicado;
- preparar apresentação final, documentação consolidada e release da ExpoTech.

## Licença

Este projeto está licenciado sob a MIT License. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
