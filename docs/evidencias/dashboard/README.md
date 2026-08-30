# Galeria do dashboard

Esta pasta contém 20 capturas reais da baseline visual recapturada em 29/08/2026. Todas foram produzidas na aplicação em execução, validadas visualmente e salvas como PNG nativo.

As capturas 01–19 continuam documentando operação, PO, multimodalidade, alertas, reotimização, Física, Eletrônica, arquitetura e QA. A captura 20 registra o **estado pré-cloud** e é mantida como evidência histórica do ponto de partida antes da publicação no Render/Aiven.

O catálogo completo está organizado em [`../README.md`](../README.md). As quatro evidências válidas do circuito Logisim permanecem separadas em [`../eletronica/`](../eletronica/README.md).

## Arquivos

1. `01-dashboard-normal.png` — operação normal;
2. `02-po-terrestre.png` — PO e plano terrestre;
3. `03-base-cientifica.png` — perfil e fontes científicas;
4. `04-transporte-andamento.png` — execução e rastreabilidade;
5. `05-plano-aereo-multimodal.png` — plano com avião;
6. `06-aeroportos-mapa.png` — aeroportos e segmentos no mapa;
7. `07-helicoptero-aviao.png` — composição helicóptero + avião;
8. `08-alerta-temperatura.png` — temperatura crítica e atuadores;
9. `09-alerta-impacto.png` — impacto crítico e atuadores;
10. `10-alerta-atraso.png` — alerta operacional sem atuadores;
11. `11-reotimizacao-recomendada.png` — recomendação aguardando decisão;
12. `12-reotimizacao-aplicada.png` — estado visual após aplicação demonstrada;
13. `13-isquemia-tempo.png` — relógio logístico;
14. `14-fisica.png` — cálculos físicos;
15. `15-logica-digital.png` — expressão e sinais digitais;
16. `16-resumo-final-normal.png` — resumo sem ocorrências;
17. `17-resumo-final-ocorrencias.png` — resumo isolado com ocorrências;
18. `18-qa-status.png` — painel técnico de QA da baseline;
19. `19-arquitetura-status.png` — arquitetura, Strategy e Observer da baseline;
20. `20-cloud-status.png` — **snapshot histórico pré-cloud**: infraestrutura local e Cloud ainda pendente naquele momento.

## Estado Cloud atual

O estado atual não é mais o mostrado na captura 20:

- deploy público: `https://lifebox-expotech.onrender.com`;
- backend: Render Web Service / Docker;
- banco: Aiven for MySQL gerenciado via TLS;
- CI: GitHub Actions;
- CD: Auto Deploy do Render validado em `main`;
- persistência: validada após redeploy.

Veja [`../../cloud.md`](../../cloud.md), [`../../ci-cd.md`](../../ci-cd.md) e [`../../deployment-checklist.md`](../../deployment-checklist.md).

A auditoria anterior ao deploy permanece em [`../../pre-cloud-validation.md`](../../pre-cloud-validation.md) como registro histórico da qualidade antes da etapa Cloud.
