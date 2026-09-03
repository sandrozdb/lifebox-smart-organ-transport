# Galeria do dashboard — baseline histórica

Esta pasta contém 20 capturas reais da baseline visual recapturada em 29/08/2026. Todas foram produzidas na aplicação em execução, validadas visualmente e salvas como PNG nativo.

As capturas 01–19 continuam documentando operação, PO, multimodalidade, alertas, reotimização, Física, Eletrônica, arquitetura e QA. A captura 20 registra o **estado pré-cloud** e é mantida como evidência histórica do ponto de partida antes da publicação no Render/Aiven.

O catálogo geral está em [`../README.md`](../README.md). As novas capturas finais devem ser adicionadas em [`../iot/`](../iot/README.md) e [`../cloud/`](../cloud/README.md).

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
12. `12-reotimizacao-aplicada.png` — estado após aplicação demonstrada;
13. `13-isquemia-tempo.png` — relógio logístico;
14. `14-fisica.png` — cálculos físicos;
15. `15-logica-digital.png` — expressão e sinais digitais;
16. `16-resumo-final-normal.png` — resumo sem ocorrências;
17. `17-resumo-final-ocorrencias.png` — resumo isolado com ocorrências;
18. `18-qa-status.png` — painel técnico de QA da baseline;
19. `19-arquitetura-status.png` — arquitetura, Strategy e Observer da baseline;
20. `20-cloud-status.png` — **snapshot histórico pré-cloud**.

## Estado atual

O projeto atual já superou a baseline acima:

- deploy público atual: `https://lifebox-expotech.onrender.com`;
- backend: Render Web Service / Docker;
- banco: Aiven for MySQL gerenciado via TLS;
- IoT: ESP32/Wokwi integrado ao backend público;
- telemetria IoT: vinculada à execução ativa e persistida;
- Física e gráficos: funcionando com dados IoT;
- logística: Condições Logísticas e reotimização funcionando no modo IOT;
- CI: GitHub Actions; CI #84 verde;
- CD: Auto Deploy do Render a partir de `main`.

Veja [`../../iot.md`](../../iot.md), [`../../cloud.md`](../../cloud.md), [`../../ci-cd.md`](../../ci-cd.md) e [`../../deployment-checklist.md`](../../deployment-checklist.md).

A auditoria anterior ao deploy permanece em [`../../pre-cloud-validation.md`](../../pre-cloud-validation.md) como registro histórico.
