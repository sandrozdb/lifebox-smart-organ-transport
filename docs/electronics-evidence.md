# Evidências de eletrônica digital

A lógica do circuito foi validada no Logisim Evolution 4.1.0 em todas as oito combinações da tabela verdade. Os itens abaixo registram as evidências concluídas nesta etapa acadêmica.

- [x] Circuito compatível com Logisim Evolution 4.1.0.
- [x] Lógica sem valores de erro (`E`).
- [x] Estado normal demonstrado.
- [x] Temperatura crítica acionando LED e buzzer.
- [x] Impacto crítico acionando LED e buzzer.
- [x] Transporte inativo bloqueando o alerta.
- [x] Tabela verdade completa conferida.
- [x] Comparação realizada com `src/services/digitalAlertLogic.js`.

## Evidências visuais validadas

### Estado normal

![Estado normal da lógica digital](evidencias/eletronica/01-estado-normal.png)

Comprova que, sem condição crítica ativa, ALERTA, LED e BUZZER permanecem desligados.

### Temperatura crítica

![Temperatura crítica acionando alerta](evidencias/eletronica/02-temperatura-critica.png)

Comprova que temperatura crítica durante transporte ativo aciona ALERTA, LED e BUZZER.

### Impacto crítico

![Impacto crítico acionando alerta](evidencias/eletronica/03-impacto-critico.png)

Comprova que impacto crítico durante transporte ativo aciona a mesma saída digital de alerta.

### Transporte inativo

![Transporte inativo bloqueando alerta](evidencias/eletronica/04-transporte-inativo.png)

Comprova que o transporte inativo bloqueia o alerta mesmo quando há uma condição crítica.
