# Circuito digital de alerta — LifeBox 2050

O circuito em `lifebox-alert-logic.circ` reproduz a lógica do software:

```text
ALERTA = TRANSPORTE_ATIVO AND (TEMPERATURA_CRITICA OR IMPACTO_CRITICO)
```

`TEMPERATURA_CRITICA` não é uma medição analógica do circuito: é o sinal booleano gerado depois que o software compara a temperatura com a faixa de referência do órgão do plano ativo. `IMPACTO_CRITICO` também é um sinal lógico resultante da regra de software.

Fluxo acadêmico: sensor/simulação → API e perfil do órgão → sinais 0/1 → OR/AND → `ALERTA` → LED e buzzer. Umidade, bateria, sinal, atraso e reotimização são alertas operacionais e não acionam esta lógica.

O arquivo usa três pinos de entrada, OR, AND e três saídas (`ALERTA`, `LED`, `BUZZER`). Abra no Logisim Evolution 4.1.0, escolha **Poke** e alterne os pinos entre 0 e 1. `LED` e `BUZZER` sempre recebem o mesmo valor de `ALERTA`.

É uma evidência acadêmica: não especifica circuito elétrico real, tensão, corrente ou validação clínica.
