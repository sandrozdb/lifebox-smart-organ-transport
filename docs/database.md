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
