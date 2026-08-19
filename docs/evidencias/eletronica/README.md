# Evidências — Eletrônica Digital LifeBox

- `01-estado-normal.png`: 0,0,0 → ALERTA/LED/BUZZER = 0
- `02-temperatura-critica.png`: 1,1,0 → ALERTA/LED/BUZZER = 1
- `03-impacto-critico.png`: 1,0,1 → ALERTA/LED/BUZZER = 1
- `04-transporte-inativo.png`: 0,1,1 → ALERTA/LED/BUZZER = 0

Lógica validada:
`ALERTA = TRANSPORTE_ATIVO AND (TEMPERATURA_CRITICA OR IMPACTO_CRITICO)`
