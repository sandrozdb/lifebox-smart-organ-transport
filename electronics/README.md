# Circuito digital de alerta sequencial — LifeBox 2050

O arquivo [`lifebox-alert-logic.circ`](lifebox-alert-logic.circ) é uma extensão sequencial acadêmica para o Logisim Evolution 4.1.0.

A detecção que o circuito recebe é a mesma usada pelo software:

```text
CONDICAO_CRITICA = TEMPERATURA_CRITICA OR IMPACTO_CRITICO
EVENTO_CRITICO = TRANSPORTE_ATIVO AND CONDICAO_CRITICA
```

No Logisim, um D Flip-Flop acrescenta memória:

```text
D = Q OR EVENTO_CRITICO

RESET = 1  → Q = 0 imediatamente
CLOCK ↑ e RESET = 0 → Q(n+1) = D

ALERTA = LED = BUZZER = Q
```

`TEMPERATURA_CRITICA` e `IMPACTO_CRITICO` são sinais booleanos gerados pelo software depois da avaliação da telemetria; o circuito não processa medições analógicas. Umidade, bateria, sinal, atraso e reotimização são alertas operacionais e não entram nessa lógica.

## Como demonstrar

1. Abra `lifebox-alert-logic.circ` no Logisim Evolution 4.1.0.
2. Com `RESET = 0`, mantenha os sinais críticos em `0`: `Q` permanece `0`.
3. Ative `TRANSPORTE_ATIVO` e uma condição crítica para produzir `EVENTO_CRITICO = 1`.
4. Aguarde ou avance uma borda de subida do `CLOCK`: `Q` passa a `1`.
5. Normalize a condição crítica: `Q` continua em `1`.
6. Ative `RESET = 1`: `Q` volta imediatamente a `0`, sem novo clock.

O backend/Wokwi continua deliberadamente combinacional: `digitalSignal` acompanha a condição crítica atual. O Flip-Flop não foi atribuído ao firmware, à API ou aos atuadores reais.

As quatro evidências visuais estão em [`../docs/evidencias/eletronica/`](../docs/evidencias/eletronica/) e documentadas em [`../docs/electronics-evidence.md`](../docs/electronics-evidence.md).
