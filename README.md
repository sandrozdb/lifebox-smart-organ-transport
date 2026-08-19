# LifeBox

**Sistema Inteligente de Monitoramento para Transporte de Órgãos**

A LifeBox é uma solução inteligente desenvolvida para aumentar a segurança e a rastreabilidade no transporte de órgãos destinados a transplantes. O sistema utiliza sensores integrados a um microcontrolador para monitorar continuamente as condições da caixa térmica durante o trajeto.

## Objetivo

Permitir que hospitais e equipes responsáveis acompanhem remotamente as condições do transporte, aumentando o controle, a rastreabilidade e a capacidade de resposta diante de alterações críticas.

## Monitoramento previsto

- Temperatura
- Umidade
- Impactos e movimentações excessivas
- Localização
- Tempo de transporte

## Funcionamento

Os sensores coletam os dados da caixa térmica e os enviam para o sistema de monitoramento. A plataforma apresenta as informações em um dashboard e poderá emitir alertas quando algum parâmetro ultrapassar os limites definidos.

Fluxo conceitual:

`Sensores → ESP32 → API → Banco de Dados → Dashboard → Alertas`

## Stack planejada

### Hardware
- ESP32
- DHT22 ou sensor equivalente de temperatura e umidade
- MPU6050 para detecção de impactos e movimentação
- GPS NEO-6M para localização

### Software
- Node.js
- Express
- MySQL
- HTML
- CSS
- JavaScript
- API REST

## Status

Projeto acadêmico em desenvolvimento. O MVP inicial será construído de forma incremental, começando pela API, banco de dados, simulador de dados e dashboard. A integração com os sensores físicos será adicionada nas etapas seguintes do projeto.

## Aplicação

A proposta da LifeBox é unir IoT, monitoramento remoto e análise de dados para contribuir com um processo mais seguro, rastreável e controlado no transporte de órgãos.
