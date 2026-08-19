# Estrutura inicial de dados

A modelagem final será refinada durante o desenvolvimento. A estrutura inicial considera pelo menos duas entidades principais.

## transportes

- id
- identificador_caixa
- hospital_origem
- hospital_destino
- inicio_transporte
- fim_transporte
- status

## leituras

- id
- transporte_id
- temperatura
- umidade
- impacto
- latitude
- longitude
- registrado_em

## Objetivo

Manter histórico das condições da LifeBox ao longo de cada transporte, permitindo consultas, geração de indicadores e rastreabilidade dos eventos registrados.

---

## Estado atual do MVP

# Banco de dados

O MySQL usa cinco tabelas: `transportes`, `leituras`, `alertas`, `eventos_rastreabilidade` e `otimizacoes_rota`. Chaves estrangeiras preservam a relação com o transporte e índices por data aceleram histórico e timeline.

`otimizacoes_rota` registra todas as alternativas do lote calculado, score, viabilidade, rota selecionada, pesos, restrições e detalhes normalizados em JSON. As leituras armazenam também os três eixos simulados da aceleração.

Execute `npm run setup-db` após configurar `.env`. `database/schema.sql` é idempotente e `database/seed.sql` cria um transporte demonstrativo sem paciente ou instituição real.
