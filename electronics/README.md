# Circuito digital de alerta — LifeBox 2050

## Objetivo

Este circuito demonstra, no Logisim Evolution, a mesma lógica combinacional usada pelo MVP para acionar o alerta local da LifeBox.

> É uma demonstração acadêmica de lógica digital. Não representa um circuito físico validado nem especifica componentes, corrente, tensão ou limites médicos.

## Equação booleana

```text
ALERTA = TRANSPORTE_ATIVO AND (TEMPERATURA_CRITICA OR IMPACTO_CRITICO)
```

As saídas `LED` e `BUZZER` recebem o mesmo sinal de `ALERTA`.

## Componentes utilizados

- 3 pinos de entrada: `TRANSPORTE_ATIVO`, `TEMPERATURA_CRITICA` e `IMPACTO_CRITICO`;
- 1 porta OR de duas entradas;
- 1 porta AND de duas entradas;
- 3 pinos de saída: `ALERTA`, `LED` e `BUZZER`;
- fios para distribuir a saída da porta AND às três saídas.

A organização visual é: entradas à esquerda, porta OR no centro, porta AND após a OR e saídas à direita.

## Relação com o software

O arquivo [`src/services/digitalAlertLogic.js`](../src/services/digitalAlertLogic.js) calcula:

```js
const criticalCondition = Boolean(temperatureCritical || impactCritical);
const alertOutput = Boolean(transportActive && criticalCondition);
```

O circuito em [`lifebox-alert-logic.circ`](lifebox-alert-logic.circ) reproduz essa expressão sem mudanças. No dashboard, `ledOn` e `buzzerOn` também recebem `alertOutput`; por isso LED e buzzer virtuais seguem a mesma regra do circuito.

Em um protótipo físico futuro, o ESP32 poderá enviar o sinal `ALERTA` a GPIOs. O acionamento elétrico real do LED e do buzzer exigirá dimensionamento e estágio de saída adequados.

## Como abrir no Logisim Evolution

1. Instale e abra o Logisim Evolution.
2. Escolha **File > Open**.
3. Selecione o arquivo `electronics/lifebox-alert-logic.circ`.
4. Escolha a ferramenta **Poke** (ícone da mão/dedo).
5. Clique nas entradas para alternar entre `0` e `1`.
6. Observe as saídas `ALERTA`, `LED` e `BUZZER`.

## Como testar

- **Estado normal:** mantenha as três entradas em `0`. Todas as saídas ficam em `0`.
- **Temperatura crítica em transporte ativo:** defina `TRANSPORTE_ATIVO=1` e `TEMPERATURA_CRITICA=1`. As três saídas ficam em `1`.
- **Impacto crítico em transporte ativo:** defina `TRANSPORTE_ATIVO=1` e `IMPACTO_CRITICO=1`. As três saídas ficam em `1`.
- **Transporte inativo:** defina `TRANSPORTE_ATIVO=0` e ative uma ou ambas as condições críticas. As saídas permanecem em `0`.

## Tabela verdade

| TRANSPORTE_ATIVO | TEMPERATURA_CRITICA | IMPACTO_CRITICO | ALERTA |
|---:|---:|---:|---:|
| 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 |
| 0 | 1 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 1 |
| 1 | 1 | 0 | 1 |
| 1 | 1 | 1 | 1 |

Como `LED = ALERTA` e `BUZZER = ALERTA`, ambas as saídas têm os mesmos valores da última coluna.