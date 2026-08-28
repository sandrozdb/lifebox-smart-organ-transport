# Arquitetura da LifeBox

Esta documentação descreve a implementação atual. Cloud pública aparece apenas como evolução futura.

## C4 Level 1 — System Context

```mermaid
flowchart LR
  OP[Operador logístico] -->|Opera e confirma decisões| LB[LifeBox\nSistema acadêmico de apoio à decisão]
  SIM[Simulador / futura caixa IoT] -->|Telemetria JSON via HTTP| LB
  LB -->|Mapa-base e atribuição| OSM[OpenStreetMap]
  LB -->|Persiste transporte, leituras e eventos| DATA[(Armazenamento local\nMySQL)]
  CLOUD[Cloud pública futura\nPENDENTE] -.-> LB
```

O operador consulta planejamento, acompanha a execução e confirma uma reotimização. O simulador representa a futura caixa IoT; não há hardware clínico conectado. OpenStreetMap fornece tiles, enquanto rotas, custos, tempos e riscos do MVP são acadêmicos/simulados.

## C4 Level 2 — Container

```mermaid
flowchart LR
  OP[Operador] -->|HTTPS futuro / HTTP local| WEB[Dashboard\nHTML, CSS, JavaScript, Leaflet]
  WEB -->|JSON REST| API[API Node.js / Express]
  SIM[Simulador Node.js] -->|JSON REST| API
  API -->|SQL| MYSQL[(MySQL 8 local)]
  API -.->|Contrato equivalente em testes| MEM[(Repository em memória)]
  WEB -->|HTTPS e tiles| OSM[OpenStreetMap]
  CI[GitHub Actions CI] -->|check, lint, format, testes e coverage| CODE[Código-fonte]
```

| Container             | Responsabilidade                                                      |
| --------------------- | --------------------------------------------------------------------- |
| Dashboard             | Planejamento, mapa, telemetria, alertas, Física, Eletrônica e resumo. |
| API Express           | Validação HTTP, coordenação dos casos de uso e respostas JSON.        |
| Simulador             | Gera cenários e telemetria acadêmica.                                 |
| MySQL                 | Estado durável de transportes, leituras, alertas, timeline e resumos. |
| Repository em memória | Testes rápidos e determinísticos; não é banco de produção.            |

## Componentes do backend

```mermaid
flowchart TB
  ROUTES[Routes Express] --> PLAN[Planning Services]
  ROUTES --> SIMS[Simulation Service]
  ROUTES --> EXEC[ExecutionPlan Service]
  ROUTES --> PHYS[Physics Service]
  PLAN --> STRAT[Modal Planner Strategies]
  STRAT --> GROUND[GroundRouting Provider / Adapter]
  SIMS --> EXEC
  SIMS --> TEL[Telemetry Service]
  TEL --> SUBJECT[AlertNotifier]
  SUBJECT --> OBS[TimelineAlertObserver]
  TEL --> REPO[Repository contract]
  OBS --> REPO
  REPO --> MYSQL[(MySQL)]
```

O diagrama agrupa responsabilidades; não representa um componente para cada arquivo.

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

  Dashboard->>API: ocorrência e condições atuais
  API->>Simulation: recomendar(transporte, condições)
  Simulation->>Execution: snapshot atual
  Simulation->>Planning: recalcular da posição/isquemia atuais
  Planning-->>Simulation: plano factível selecionado
  Simulation-->>Dashboard: recommendationId + resumo da recomendação
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
- **Services:** regras de planejamento, simulação, execução, Física e telemetria.
- **Observers:** propagam efeitos secundários de alertas sem acoplar a regra à timeline.
- **Repositories:** contrato implícito comum às implementações MySQL e memória.
- **Config:** perfis de órgãos e premissas acadêmicas centralizadas.

O simulador independente usa a API. O modo de demonstração embutido também pode coordenar serviços dentro do processo para manter uma execução local simples; essa é uma escolha de MVP, não um microserviço.

## Strategy

O Context é [`organPlanningService.calculate`](../src/services/organPlanningService.js). As strategies em [`modalPlannerStrategies.js`](../src/services/modalPlannerStrategies.js) são:

- `GroundTransportStrategy`;
- `HelicopterTransportStrategy`;
- `MultimodalAirTransportStrategy`.

Contrato implícito: `plan({ origin, destination, locationProvider, conditions })` retorna uma alternativa ou lista de alternativas com `id`, `name`, `modal`, `modalCode`, `segments` e `requiredInfrastructure`. Testes contratuais verificam a forma comum. [`groundRoutingProvider.js`](../src/services/groundRoutingProvider.js) é um provider/adapter de roteamento terrestre, não a Strategy principal.

## Observer

[`AlertNotifier`](../src/observers/alertNotifier.js) é Publisher/Subject; [`TimelineAlertObserver`](../src/observers/timelineAlertObserver.js) é Subscriber/Observer. `subscribe` registra o observador e `notify` publica uma ocorrência. Existe um único observer porque ele atende um efeito real; observers artificiais não foram adicionados.

## SOLID — avaliação honesta

- **SRP — parcial/forte:** Física, lógica digital, execução e providers são coesos; `simulationService` ainda é um orquestrador amplo por escolha de MVP.
- **OCP — forte no planejamento:** modalities e observers podem ser estendidos sem reescrever seus consumidores.
- **LSP — demonstrado no limite das Strategies:** todas atendem o mesmo contrato comportamental.
- **ISP — não formalizado:** JavaScript/CommonJS usa contratos pequenos e implícitos; interfaces fictícias não foram criadas.
- **DIP — parcial:** memória/MySQL são substituíveis e providers podem ser fornecidos ao planejamento, mas a composição principal ainda seleciona implementações concretas na inicialização.

## Trade-offs e limitações

- execution plan e recommendationId ativos ficam em memória e são perdidos no reinício;
- processo único é suficiente para o MVP local; múltiplas instâncias dependem da fase Cloud;
- rotas, custos, tempos, risco e disponibilidade são acadêmicos/simulados;
- autenticação completa será necessária antes de exposição pública;
- MySQL é local; backend público, banco gerenciado e CD continuam **PENDENTES**.
