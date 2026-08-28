# Evidências visuais — LifeBox

As 20 imagens do dashboard foram recapturadas em 27/08/2026 na aplicação real em `http://localhost:3000`, por automação do navegador integrado, com zoom de 100% e viewport desktop 1920×1080. Os arquivos têm assinatura PNG nativa; não foram usados mockups, geração de imagens ou edição para simular estados.

Os mapas foram validados com Leaflet inicializado e tiles reais do OpenStreetMap completos (`naturalWidth = 256`). Sensores, instituições, tempos, custos, rotas e ocorrências permanecem identificados como dados simulados ou premissas acadêmicas.

## 1. Operação e rastreabilidade

- [01 — Dashboard normal](dashboard/01-dashboard-normal.png): visão completa da execução terrestre, com telemetria, mapa, plano e resumo final.
- [04 — Transporte em andamento](dashboard/04-transporte-andamento.png): comprova marcador deslocado, percurso, distância percorrida/restante, tempo e isquemia.
- [13 — Isquemia e tempo](dashboard/13-isquemia-tempo.png): enquadra o relógio logístico, o limite máximo e a margem restante.

## 2. Pesquisa Operacional

- [02 — Plano terrestre](dashboard/02-po-terrestre.png): comprova órgão, preservação, custo, tempo, margem, plano ótimo e alternativas factíveis.
- [03 — Rota terrestre no mapa](dashboard/03-rota-terrestre-mapa.png): comprova origem, destino, geometria da rota, marcador e vias comparadas.

## 3. Multimodalidade

- [05 — Plano aéreo multimodal](dashboard/05-plano-aereo-multimodal.png): comprova Terrestre + Avião + Terrestre para longa distância, nunca avião isolado.
- [06 — Aeroportos no mapa](dashboard/06-aeroportos-mapa.png): comprova segmentos e identificação dos aeroportos SBSP/SBBR.
- [07 — Helicóptero + avião](dashboard/07-helicoptero-aviao.png): comprova o plano crítico Helicóptero + Avião + Terrestre e seus segmentos.

## 4. Alertas e atuadores

- [08 — Temperatura crítica](dashboard/08-alerta-temperatura.png): comprova faixa violada, ocorrência, LED ligado e buzzer ativo.
- [09 — Impacto crítico](dashboard/09-alerta-impacto.png): comprova leitura de 4,40 g, ocorrência, LED ligado e buzzer ativo.
- [10 — Atraso operacional](dashboard/10-alerta-atraso.png): comprova motivo operacional com LED e buzzer desligados, separando atraso de alerta crítico.

## 5. Reotimização

- [11 — Reotimização recomendada](dashboard/11-reotimizacao-recomendada.png): comprova indisponibilidade da Anhanguera, plano recomendado, motivo e decisão manual.
- [12 — Reotimização aplicada](dashboard/12-reotimizacao-aplicada.png): comprova aplicação da Bandeirantes com posição, caminho, tempo e isquemia preservados.

## 6. Física

- [14 — Análise física](dashboard/14-fisica.png): comprova ΔT, taxa térmica, Q, aceleração, pico, potência, energia e autonomia.

## 7. Eletrônica e lógica digital

- [15 — Lógica digital](dashboard/15-logica-digital.png): comprova entradas binárias, equação, saída, LED e buzzer no cenário crítico.
- [Circuito no Logisim](eletronica/README.md): preserva as quatro evidências válidas de estado normal, temperatura crítica, impacto crítico e transporte inativo.

## 8. Arquitetura

- [19 — Arquitetura do sistema](dashboard/19-arquitetura-status.png): comprova Frontend → API Express → Serviços → Repository → MySQL, Strategy e Observer.

## 9. Qualidade e testes

- [18 — Status de QA](dashboard/18-qa-status.png): comprova 77 testes aprovados e E2E manual validado no painel real.

## 10. Cloud e infraestrutura

- [20 — Status de infraestrutura](dashboard/20-cloud-status.png): comprova backend/MySQL locais e CI ativo; cloud pública, DB gerenciado e CD continuam corretamente pendentes.

## 11. Resumos finais

- [16 — Execução normal](dashboard/16-resumo-final-normal.png): comprova nova viagem sem ocorrências, sensores normais e atuadores desligados.
- [17 — Execução com ocorrências](dashboard/17-resumo-final-ocorrencias.png): comprova impacto, alertas únicos, reotimização e resumo isolado da execução atual.

## Metadados da captura

| Arquivos | Dimensão | Formato | Escala |
|---|---:|---|---:|
| 01–12 e 14–20 | 1920×1080 | PNG nativo | 100% |
| 13 | 1920×360, recorte de viewport | PNG nativo | 100% |

## Validação executada

- `npm run check`: aprovado;
- `npm test`: 77 aprovados, 0 falhas;
- 17 cenários E2E executados no dashboard real;
- console do navegador sem erro crítico;
- health check HTTP 200;
- 20/20 imagens validadas como PNG nativo;
- quatro evidências válidas do Logisim preservadas.

