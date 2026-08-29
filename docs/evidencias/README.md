# Evidências visuais — LifeBox

As 20 imagens do dashboard foram recapturadas do zero em 29/08/2026 na aplicação real em `http://localhost:3000`, com viewport preferencial de 1920×1080 e zoom de 100%. Os arquivos têm assinatura PNG nativa; não foram usados mockups nem geração de imagens para simular estados.

Os mapas foram validados com Leaflet inicializado e tiles reais do OpenStreetMap completos (`naturalWidth = 256`). Sensores, instituições, tempos, custos, rotas e ocorrências permanecem identificados como dados simulados ou premissas acadêmicas.

## 1. Operação e rastreabilidade

- [01 — Dashboard normal](dashboard/01-dashboard-normal.png): visão completa da execução terrestre, com telemetria, mapa, plano e resumo final.
- [04 — Transporte em andamento](dashboard/04-transporte-andamento.png): comprova marcador deslocado, percurso, distância percorrida/restante, tempo e isquemia.
- [13 — Isquemia e tempo](dashboard/13-isquemia-tempo.png): enquadra o relógio logístico, o limite máximo e a margem restante.

## 2. Pesquisa Operacional

- [02 — Plano terrestre](dashboard/02-po-terrestre.png): comprova órgão, preservação, custo, tempo, margem, plano ótimo e alternativas factíveis.
- [03 — Base científica](dashboard/03-base-cientifica.png): comprova órgão, faixa térmica, alvo acadêmico, janela de isquemia, margem e fontes oficial/científica.

## 3. Multimodalidade

- [05 — Plano aéreo multimodal](dashboard/05-plano-aereo-multimodal.png): comprova Terrestre + Avião + Terrestre para longa distância, nunca avião isolado.
- [06 — Aeroportos no mapa](dashboard/06-aeroportos-mapa.png): comprova segmentos e identificação dos aeroportos SBSP/SBBR.
- [07 — Helicóptero + avião](dashboard/07-helicoptero-aviao.png): comprova o plano crítico Helicóptero + Avião + Terrestre e seus segmentos.

## 4. Alertas e atuadores

- [08 — Temperatura crítica](dashboard/08-alerta-temperatura.png): comprova faixa violada, ocorrência, LED ligado e buzzer ativo.
- [09 — Impacto crítico](dashboard/09-alerta-impacto.png): comprova leitura de 4,40 g, ocorrência, LED ligado e buzzer ativo.
- [10 — Atraso operacional](dashboard/10-alerta-atraso.png): comprova motivo operacional com LED e buzzer desligados, separando atraso de alerta crítico.

## 5. Reotimização

- [11 — Reotimização recomendada](dashboard/11-reotimizacao-recomendada.png): comprova transporte terrestre indisponível, plano recomendado, motivo e decisão manual.
- [12 — Reotimização aplicada](dashboard/12-reotimizacao-aplicada.png): comprova aplicação da Bandeirantes com posição, caminho, tempo e isquemia preservados.

## 6. Física

- [14 — Análise física](dashboard/14-fisica.png): comprova ΔT, taxa térmica, Q, aceleração, pico, potência, energia e autonomia.

## 7. Eletrônica e lógica digital

- [15 — Lógica digital](dashboard/15-logica-digital.png): comprova entradas binárias, equação, saída, LED e buzzer no cenário crítico.
- [Circuito no Logisim](eletronica/README.md): preserva as quatro evidências válidas de estado normal, temperatura crítica, impacto crítico e transporte inativo.

## 8. Arquitetura

- [19 — Arquitetura do sistema](dashboard/19-arquitetura-status.png): comprova Frontend → API Express → Serviços → Repository → MySQL, Strategy e Observer.

## 9. Qualidade e testes

- [18 — Status de QA](dashboard/18-qa-status.png): registra o painel de QA após a suíte Node e a aprovação dos quatro cenários E2E; os resultados completos estão em `docs/testing-and-qa.md`.

## 10. Cloud e infraestrutura

- [20 — Status de infraestrutura](dashboard/20-cloud-status.png): comprova backend/MySQL locais e CI ativo; cloud pública, DB gerenciado e CD continuam corretamente pendentes.

## 11. Resumos finais

- [16 — Execução normal](dashboard/16-resumo-final-normal.png): comprova nova viagem sem ocorrências, sensores normais e atuadores desligados.
- [17 — Execução com ocorrências](dashboard/17-resumo-final-ocorrencias.png): comprova impacto, alertas únicos, reotimização e resumo isolado da execução atual.

## Metadados da captura

| Arquivos | Dimensão | Formato | Escala |
| --- | ---: | --- | ---: |
| 01–17 | 1920×1080 | PNG nativo | 100% |
| 18–19 | 445×181, recorte focal nativo | PNG nativo | 100% |
| 20 | 446×181, recorte focal nativo | PNG nativo | 100% |

## Validação executada

- `npm run check`: aprovado;
- `npm test`: 95 descobertos, 94 aprovados, 0 falhas e 1 integração MySQL condicional ignorada;
- `npm run coverage`: 87,59% de linhas/instruções, 80,82% de branches e 93,16% de funções;
- `npm run e2e`: 4/4 cenários aprovados, incluindo aplicação segura da reotimização com `recommendationId` server-side;
- cenários adicionais auditados manualmente no dashboard real;
- console do navegador sem erro crítico;
- health check HTTP 200;
- 20/20 imagens abertas e validadas como atuais, coerentes e PNG nativo; as evidências 11, 12 e 18 foram recapturadas após a correção funcional;
- quatro evidências válidas do Logisim, com o estado normal recapturado como 1,0,0 → saída 0.

