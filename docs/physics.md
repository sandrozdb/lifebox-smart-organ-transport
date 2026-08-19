# Física para Sistemas Computacionais

Todos os resultados são didáticos e usam telemetria e parâmetros simulados.

## Temperatura

$$\Delta T=T_{final}-T_{inicial}$$

$$taxa=\frac{\Delta T}{\Delta t}\quad[°C/min]$$

## Energia térmica

$$Q=m\,c\,\Delta T$$

O MVP usa massa equivalente e calor específico configurados em `src/config/physics.js`. `Q` é apresentado em joules e não representa o comportamento clínico real de um órgão.

## Aceleração

O futuro MPU6050 fornece eixos X, Y e Z. A resultante é:

$$a=\sqrt{a_x^2+a_y^2+a_z^2}$$

O painel mostra eixos, resultante, pico e impacto. Não é calculada força porque a massa física e o perfil da colisão ainda não foram medidos.

## Eletricidade

$$P=V I\quad[W]$$

$$E=P t\quad[Wh]$$

Tensão e corrente são parâmetros simulados. Quando existir hardware, deverão ser substituídos por medições e características reais do circuito.


## Autonomia estimada da bateria

Com capacidade configurada `C` em Wh, percentual de bateria `p` e potência estimada `P` em W:

$$E_{restante}=C\cdot\frac{p}{100}$$

$$autonomia=\frac{E_{restante}}{P}\quad[h]$$

O MVP usa `bateriaCapacidadeWh` em `src/config/physics.js` e apresenta energia restante e autonomia no retorno da análise física. Capacidade, corrente, tensão, consumo e resultado são simulados até que existam medições do hardware real.