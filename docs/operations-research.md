# Pesquisa Operacional — otimização de rota

> Os valores utilizados são simulados e têm finalidade acadêmica.

## Problema de decisão

Escolher exatamente uma rota entre alternativas candidatas antes do transporte. Para cada rota `i`:

$$x_i \in \{0,1\}$$

$$x_i = 1 \text{ se a rota i for escolhida; caso contrário } x_i = 0$$

Restrição de escolha:

$$\sum_i x_i = 1$$

## Normalização

Tempo, distância, risco e custo têm escalas diferentes. Para cada critério de minimização:

$$n(v)=\frac{v-v_{min}}{v_{max}-v_{min}}$$

Quando máximo e mínimo são iguais, o valor normalizado é zero, pois o critério não diferencia as alternativas.

## Função objetivo

$$\min Z_i=w_tT_i+w_rR_i+w_dD_i+w_cC_i$$

Pesos demonstrativos em `src/config/operationsResearch.js`: tempo 40%, risco 30%, distância 20% e custo 10%. A soma deve ser 1.

## Restrições

Antes do ranking, o serviço elimina rotas indisponíveis ou que excedem tempo, risco, distância ou que têm sinal insuficiente. Entre as viáveis, vence o menor score; empate é resolvido de modo determinístico pelo identificador.

## Alternativas

- Rota A: alternativa equilibrada;
- Rota B: menor tempo e risco;
- Rota C: menor distância, mas comunicação insuficiente na configuração padrão.

O dashboard mostra originais, normalizados, parcelas ponderadas, score, viabilidade e ranking. A decisão é persistida em `otimizacoes_rota`; o simulador passa a usar os pontos da rota selecionada.

## Limitações

O modelo não usa trânsito real, emergências viárias, previsão meteorológica ou restrições clínicas. Confiabilidade e custos são parâmetros demonstrativos. Em produção, fontes verificadas e validação de especialistas serão necessárias.

