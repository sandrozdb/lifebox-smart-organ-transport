# Física para Sistemas Computacionais

A LifeBox usa um **modelo acadêmico com telemetria simulada**. Os resultados não representam validação clínica, desempenho de equipamento real ou parâmetro médico definitivo.

## Fonte dos dados

A análise usa apenas as leituras da execução atual, identificada pelo `execucao_id`. O tempo dos cálculos é `transportElapsedMinutes`, controlado pelo relógio simulado; não é a diferença do relógio real entre requisições.

## Grandezas exibidas

- `ΔT = T_atual - T_inicial`;
- `taxa térmica = ΔT / Δt` em °C/min;
- `Q = m · c · ΔT` em J, usando massa equivalente e calor específico configurados;
- `a = sqrt(ax² + ay² + az²)` para aceleração resultante;
- `P = V · I` e `E = P · t` para o modelo elétrico;
- energia restante e autonomia estimada a partir do percentual de bateria e potência atual.

A faixa térmica exibida é a `referenceRangeC` do perfil do órgão escolhido no plano ativo. A seção **Análise Física da Execução** do dashboard mostra órgão, faixa, status térmico, variação, tempo simulado, aceleração/pico e energia da execução atual.

## Reação aos cenários

- **Normal:** pequenas variações demonstrativas;
- **Temperatura crítica:** altera ΔT, taxa e Q;
- **Impacto:** altera a resultante e registra o maior pico;
- **Bateria baixa:** reduz energia restante e autonomia;
- **Reiniciar:** inicia uma nova execução sem acumular leituras anteriores.

Os parâmetros ficam em `src/config/physics.js`; o cálculo está em `src/services/physicsService.js`.
