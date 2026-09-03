# Arquitetura da LifeBox

Esta documentação descreve a implementação atual: dashboard público, backend Node.js/Express no Render, Aiven for MySQL, simulador DEMO, ESP32/Wokwi em modo IOT, reotimização e CI/CD.

## C4 Level 1 — System Context

```mermaid
flowchart LR
  OP[Operador logístico] -->|HTTPS| LB[LifeBox\nSistema acadêmico de apoio à decisão\nRender]
  ESP[ESP32 / Wokwi] -->|Telemetria JSON via HTTPS| LB
  LB -->|Estado / digitalSignal| ESP
  LB -->|Mapa-base e atribuição| OSM[OpenStreetMap]
  LB -->|MySQL/TLS| DATA[(Aiven for MySQL\nBanco gerenciado)]
  GH[GitHub] -->|push na main| RENDER[Render Auto Deploy]
  GH -->|push / pull request| CI[GitHub Actions CI]
  RENDER --> LB
```

O operador calcula planos, acompanha a execução, altera condições logísticas e confirma reotimizações. O ESP32/Wokwi envia telemetria ambiental e física, enquanto o backend permanece como fonte de verdade para criticidade, execução, regras digitais e decisão logística.

O deploy público atualmente usado pelo firmware está em `https://lifebox-expotech.onrender.com`. A persistência usa Aiven for MySQL com TLS e validação de CA.

## C4 Level 2 — Container

```mermaid
flowchart LR
  OP[Operador] -->|HTTPS| WEB[Dashboard\nHTML, CSS, JavaScript, Leaflet\nservido pelo Express]
  WEB -->|JSON REST| API[API Node.js / Express\nRender Web Service]
  ESP[ESP32 / Wokwi] -->|Telemetria HTTPS| API
  API -->|status + digitalSignal| ESP
  SIM[Simulador DEMO] -->|cenários acadêmicos| API
  API -->|MySQL/TLS| MYSQL[(Aiven for MySQL)]
  API -.->|Contrato equivalente em testes| MEM[(Repository em memória)]
  WEB -->|HTTPS e tiles| OSM[OpenStreetMap]
  CI[GitHub Actions CI] -->|check, lint, format, testes, E2E, MySQL e Docker| CODE[Código-fonte]
  CODE -->|push na main| CD[Render Auto Deploy]
  CD --> API
```

| Container / serviço   | Responsabilidade                                                                 |
| --------------------- | -------------------------------------------------------------------------------- |
| Dashboard             | Planejamento, mapa, telemetria, alertas, Física, Eletrônica, logística e resumo. |
| API Express no Render | Validação HTTP, regras, coordenação dos casos de uso e respostas JSON.           |
| ESP32 / Wokwi         | Lê sensores, envia telemetria e aplica `digitalSignal`/perfil recebidos.         |
| Simulador DEMO        | Gera telemetria acadêmica quando o modo não é IOT.                               |
| Aiven for MySQL       | Estado durável de transportes, leituras, alertas, timeline e resumos.            |
| Repository em memória | Testes rápidos e determinísticos; não é banco de produção.                       |
| GitHub Actions        | Integração contínua e validações automatizadas.                                  |
| Render Auto Deploy    | Entrega contínua da branch `main` no serviço público.                            |

## Componentes do backend

```mermaid
flowchart TB
  ROUTES[Routes Express] --> PLAN[Planning Services]
  ROUTES --> SIMS[Simulation Service]
  ROUTES --> EXEC[ExecutionPlan Service]
  ROUTES --> PHYS[Physics Service]
  ROUTES --> IOT[IotState Service]
  ROUTES --> TEL[Telemetry Service]
  PLAN --> STRAT[Modal Planner Strategies]
  STRAT --> GROUND[GroundRouting Provider / Adapter]
  SIMS --> EXEC
  SIMS --> TEL
  TEL --> SUBJECT[AlertNotifier]
  SUBJECT --> OBS[TimelineAlertObserver]
  TEL --> REPO[Repository contract]
  PHYS --> REPO
  OBS --> REPO
  REPO --> MYSQL[(MySQL)]
```

O diagrama agrupa responsabilidades; não representa um componente para cada arquivo.

## Responsabilidade do backend no IoT

O ESP32 não recebe nem decide `execucao_id`. Ao receber telemetria física, `telemetryService` consulta o transporte e associa a leitura ao `execucao_atual_id` antes da persistência.

Essa decisão server-side evita que um cliente antigo ou adulterado atribua leituras a outra execução. Gráficos, Física e resumo final consultam a telemetria pelo identificador da execução atual.

A separação dos modos é deliberada:

- **IOT:** sensores vêm do ESP32/Wokwi; cenários manuais da caixa ficam bloqueados;
- **DEMO:** telemetria é gerada pelo simulador;
- **ambos:** Condições Logísticas permanecem disponíveis ao operador e podem disparar reotimização.

## Sequência da reotimização

```mermaid
sequenceDiagram
  actor Operador
  participant Dashboard
  participant API
  participant Planning as OrganPlanningService
  participant Simulation as SimulationService
  participant Execution as ExecutionPlanService
  participant Timeline as Repository/Timeline

  Operador->>Dashboard: ativa condição logística
  Dashboard->>API: condições atuais
  API->>Simulation: recomendar(transporte, condições)
  Simulation->>Execution: snapshot atual
  Simulation->>Planning: recalcular da posição/isquemia atuais
  Planning-->>Simulation: plano factível selecionado
  Simulation-->>Dashboard: recommendationId + resumo
  Dashboard-->>Operador: exibe plano e motivo
  Operador->>Dashboard: confirma aplicação
  Dashboard->>API: recommendationId
  API->>Simulation: aplicar recommendationId
  Simulation->>Execution: revalida execução e snapshot
  Simulation->>Planning: recalcula server-side
  Planning-->>Simulation: recomendação ainda factível
  Simulation->>Execution: substitui plano e preserva histórico
  Simulation->>Timeline: registra REOTIMIZACAO_APLICADA
  Simulation-->>Dashboard: estado atualizado
```

O navegador não é autoridade sobre custo, segmentos, geometria ou modal. A recomendação possui ID, vínculo com transporte/execução, validade curta, proteção contra replay e recálculo antes da aplicação.

## Camadas e fronteiras

- **Routes:** adaptam HTTP, validam IDs/payloads e delegam casos de uso.
- **Services:** regras de planejamento, simulação, execução, Física, IoT e telemetria.
- **Observers:** propagam efeitos secundários de alertas sem acoplar a regra à timeline.
- **Repositories:** contrato implícito comum às implementações MySQL e memória.
- **Config:** perfis de órgãos e premissas acadêmicas centralizadas.
- **Firmware:** coleta e apresentação local; não replica regras do backend.

## Strategy

O Context é [`organPlanningService.calculate`](../src/services/organPlanningService.js). As strategies em [`modalPlannerStrategies.js`](../src/services/modalPlannerStrategies.js) são:

- `GroundTransportStrategy`;
- `HelicopterTransportStrategy`;
- `MultimodalAirTransportStrategy`.

Contrato implícito: `plan({ origin, destination, locationProvider, conditions })` retorna uma alternativa ou lista de alternativas com `id`, `name`, `modal`, `modalCode`, `segments` e `requiredInfrastructure`. Testes contratuais verificam a forma comum. [`groundRoutingProvider.js`](../src/services/groundRoutingProvider.js) é provider/adapter de roteamento terrestre, não a Strategy principal.

## Observer

[`AlertNotifier`](../src/observers/alertNotifier.js) é Publisher/Subject; [`TimelineAlertObserver`](../src/observers/timelineAlertObserver.js) é Subscriber/Observer. `subscribe` registra o observador e `notify` publica uma ocorrência.

## SOLID — avaliação honesta

- **SRP — parcial/forte:** Física, IoT, lógica digital, execução e providers são coesos; `simulationService` ainda é um orquestrador amplo por escolha de MVP.
- **OCP — forte no planejamento:** modalidades e observers podem ser estendidos sem reescrever seus consumidores.
- **LSP — demonstrado no limite das Strategies:** todas atendem o mesmo contrato comportamental.
- **ISP — não formalizado:** JavaScript/CommonJS usa contratos pequenos e implícitos; interfaces fictícias não foram criadas.
- **DIP — parcial:** memória/MySQL são substituíveis e providers podem ser fornecidos ao planejamento, mas a composição principal ainda seleciona implementações concretas na inicialização.

## Trade-offs e limitações

- `execution plan` e `recommendationId` ativos ficam em memória do processo e podem ser perdidos em reinício; dados persistidos no MySQL permanecem no Aiven;
- o plano gratuito do Render pode sofrer cold start após inatividade;
- o Auto Deploy está em `On Commit`: CI e CD partem do mesmo push, mas o deploy não espera obrigatoriamente a conclusão da CI;
- o protótipo IoT é virtual no Wokwi, não hardware médico físico ou certificado;
- rotas, custos, tempos, risco e disponibilidade são acadêmicos/simulados;
- o serviço é uma demonstração acadêmica pública sem autenticação completa e não deve receber dados clínicos, pessoais ou operacionais sensíveis;
- restrição de rede do banco, usuário de menor privilégio, rotação de credenciais, backup avançado e observabilidade são melhorias de hardening futuras.
