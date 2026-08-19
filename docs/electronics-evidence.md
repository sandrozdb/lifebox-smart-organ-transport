# Evidências — Eletrônica Digital

A lógica combinacional demonstrada no circuito é:

```text
ALERTA = TRANSPORTE_ATIVO AND (TEMPERATURA_CRITICA OR IMPACTO_CRITICO)
```

O circuito correspondente está em [`electronics/lifebox-alert-logic.circ`](../electronics/lifebox-alert-logic.circ) e foi validado no Logisim Evolution 4.1.0.

## Lógica combinacional

A porta **OR** recebe `TEMPERATURA_CRITICA` e `IMPACTO_CRITICO`. Sua saída indica que existe ao menos uma condição crítica.

A porta **AND** recebe a saída da OR e `TRANSPORTE_ATIVO`. Assim, o alerta só é ativado se o transporte estiver ativo e houver temperatura crítica ou impacto crítico.

No software, a mesma lógica é implementada em [`src/services/digitalAlertLogic.js`](../src/services/digitalAlertLogic.js):

```js
const criticalCondition = Boolean(temperatureCritical || impactCritical);
const alertOutput = Boolean(transportActive && criticalCondition);
```

`alertOutput` também controla os estados virtuais `ledOn` e `buzzerOn`.

## Tabela verdade

| TRANSPORTE_ATIVO | TEMPERATURA_CRITICA | IMPACTO_CRITICO | ALERTA / LED / BUZZER |
|---:|---:|---:|---:|
| 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 |
| 0 | 1 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 1 |
| 1 | 1 | 0 | 1 |
| 1 | 1 | 1 | 1 |

## 1. Estado normal

Transporte inativo e nenhuma condição crítica. ALERTA, LED e BUZZER permanecem desligados.

![Estado normal](evidencias/eletronica/01-estado-normal.png)

## 2. Temperatura crítica

Com o transporte ativo e temperatura crítica, a saída de alerta é ativada, acionando LED e BUZZER.

![Temperatura crítica](evidencias/eletronica/02-temperatura-critica.png)

## 3. Impacto crítico

Com o transporte ativo e impacto crítico, a lógica digital ativa ALERTA, LED e BUZZER.

![Impacto crítico](evidencias/eletronica/03-impacto-critico.png)

## 4. Transporte inativo

Mesmo com condições críticas, o alerta não é acionado quando TRANSPORTE_ATIVO = 0.

![Transporte inativo](evidencias/eletronica/04-transporte-inativo.png)

## Evidências concluídas

- [x] Circuito compatível com Logisim Evolution 4.1.0.
- [x] Lógica sem valores de erro (`E`).
- [x] Estado normal demonstrado.
- [x] Temperatura crítica acionando LED e buzzer.
- [x] Impacto crítico acionando LED e buzzer.
- [x] Transporte inativo bloqueando o alerta.
- [x] Tabela verdade completa conferida.
- [x] Comparação realizada com `src/services/digitalAlertLogic.js`.
