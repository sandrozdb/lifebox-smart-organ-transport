# Evidências visuais — LifeBox

Todas as imagens do dashboard foram capturadas em 26/08/2026 na aplicação real em `http://localhost:3000`, por automação do navegador integrado, em viewport desktop 1920×1080. Não foram usados mockups, geração de imagens ou edição para simular estados.

Os mapas foram validados com Leaflet inicializado e tiles reais do OpenStreetMap completos (`naturalWidth = 256`). Sensores, instituições, tempos, custos, rotas e ocorrências permanecem identificados como dados simulados ou premissas acadêmicas.

| Evidência | Cenário | O que comprova | Disciplina / requisito |
|---|---|---|---|
| [01-dashboard-normal](dashboard/01-dashboard-normal.png) | Nova execução em Normal | Temperatura na faixa, mapa, indicadores, zero alertas e atuadores desligados | MVP / telemetria |
| [02-po-terrestre](dashboard/02-po-terrestre.png) | Curta distância | Rim, perfil SCS, isquemia, plano terrestre, custo, tempo, margem e alternativas | PO / decisão factível |
| [03-rota-terrestre-mapa](dashboard/03-rota-terrestre-mapa.png) | Planejamento terrestre | Origem, destino, geometria, marcador e vias comparadas | PO / roteamento |
| [04-transporte-andamento](dashboard/04-transporte-andamento.png) | Transporte ativo | Marcador deslocado, percurso, distância percorrida/restante, tempo e isquemia | Rastreabilidade |
| [05-plano-aereo-multimodal](dashboard/05-plano-aereo-multimodal.png) | São Paulo → Brasília | Plano Terrestre + Avião + Terrestre selecionado, nunca avião isolado | PO / multimodalidade |
| [06-aeroportos-mapa](dashboard/06-aeroportos-mapa.png) | Plano aéreo | Segmentos e aeroportos reais SBSP/SBBR identificados no mapa | PO / infraestrutura |
| [07-helicoptero-aviao](dashboard/07-helicoptero-aviao.png) | Crítico multimodal | Helicóptero + Avião + Terrestre, segmentos e mapa | PO / restrições |
| [08-alerta-temperatura](dashboard/08-alerta-temperatura.png) | Temperatura crítica ativa | Faixa violada, banner, LED ligado e buzzer ativo | Eletrônica / lógica digital |
| [09-alerta-impacto](dashboard/09-alerta-impacto.png) | Impacto crítico ativo | 4,40 g, banner, LED ligado e buzzer ativo | Eletrônica / lógica digital |
| [10-alerta-atraso](dashboard/10-alerta-atraso.png) | Atraso operacional | Motivo legível com LED e buzzer desligados | Operação / separação de alertas |
| [11-reotimizacao-recomendada](dashboard/11-reotimizacao-recomendada.png) | Anhanguera indisponível | Plano atual, recomendado, motivo e confirmação manual | PO / apoio à decisão |
| [12-reotimizacao-aplicada](dashboard/12-reotimizacao-aplicada.png) | Aplicação da Bandeirantes | Posição, caminho, tempo e isquemia preservados | PO / reotimização |
| [13-isquemia-tempo](dashboard/13-isquemia-tempo.png) | Execução ativa | Tempo simulado, isquemia total, máximo e margem restante | PO / relógio logístico |
| [14-fisica](dashboard/14-fisica.png) | Análise física aberta | ΔT, taxa, Q, aceleração, pico, potência, energia e autonomia | Física |
| [15-logica-digital](dashboard/15-logica-digital.png) | Temperatura crítica | Entradas 0/1, equação, saída, LED e buzzer | Eletrônica |
| [16-resumo-final-normal](dashboard/16-resumo-final-normal.png) | Nova viagem sem ocorrências | Zero impactos/alertas e resumo isolado da execução | QA / resumo |
| [17-resumo-final-ocorrencias](dashboard/17-resumo-final-ocorrencias.png) | Temperatura crítica → Normal | Uma ocorrência única sem acumular a execução anterior | QA / deduplicação |
| [18-qa-status](dashboard/18-qa-status.png) | Painel técnico aberto | 77 testes aprovados e E2E manual validado | QA |
| [19-arquitetura-status](dashboard/19-arquitetura-status.png) | Painel técnico aberto | Frontend, API, Serviços, Repository, MySQL, Strategy e Observer | Arquitetura |
| [20-cloud-status](dashboard/20-cloud-status.png) | Painel técnico aberto | Backend/MySQL local, CI ativo; Cloud, DB gerenciado e CD pendentes | Cloud / status real |

## Eletrônica no Logisim

As quatro evidências válidas do circuito foram preservadas em [`eletronica/`](eletronica/README.md): estado normal, temperatura crítica, impacto crítico e transporte inativo.

## Validação executada

- `npm run check`: aprovado;
- `npm test`: 77 aprovados, 0 falhas;
- cenários E2E executados no dashboard real;
- console do navegador sem erros;
- health check HTTP 200;
- evidências antigas equivalentes da interface anterior substituídas.
