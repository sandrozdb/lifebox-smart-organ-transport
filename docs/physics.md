# Física para Sistemas Computacionais

A LifeBox usa um **modelo acadêmico de Física** que pode ser alimentado por duas fontes de telemetria: simulador DEMO ou sensores do ESP32/Wokwi no modo IOT. Os cálculos não representam validação clínica, desempenho de equipamento médico real ou parâmetro definitivo de preservação.

## Fonte dos dados

A análise usa apenas as leituras da execução atual, identificada por `execucao_id`.

- **DEMO:** as leituras são geradas pelo simulador acadêmico;
- **IOT:** temperatura, umidade, aceleração/impacto, bateria, sinal e GPS vêm do ESP32/Wokwi e são associados server-side à execução ativa antes da persistência.

O tempo dos cálculos é `transportElapsedMinutes`, controlado pelo relógio de execução do MVP; não é simplesmente a diferença do relógio real entre requisições.

## Grandezas exibidas

- `ΔT = T_atual - T_inicial`;
- `taxa térmica = ΔT / Δt` em °C/min;
- `Q = m · c · ΔT` em J, usando massa equivalente e calor específico configurados;
- `a = sqrt(ax² + ay² + az²)` para aceleração resultante;
- `P = V · I` e `E = P · t` para o modelo elétrico;
- energia restante e autonomia estimada a partir do percentual de bateria e potência atual.

A faixa térmica exibida é a `referenceRangeC` do perfil do órgão escolhido no plano ativo. A seção **Análise Física da Execução** mostra órgão, faixa, status térmico, variação, tempo, aceleração/pico e energia da execução atual.

## Comportamento no DEMO

- **Normal:** pequenas variações demonstrativas;
- **Temperatura crítica:** altera ΔT, taxa e Q;
- **Impacto:** altera a resultante e registra o maior pico;
- **Bateria baixa:** reduz energia restante e autonomia;
- **Reiniciar:** inicia nova execução sem acumular leituras anteriores.

## Comportamento no IOT

No IOT os botões que alterariam artificialmente as condições da caixa ficam bloqueados. A Análise Física reage às leituras realmente recebidas do Wokwi.

A integração foi validada após o backend passar a vincular cada leitura física ao `execucao_atual_id`; com isso, gráficos, Física e resumo final usam a mesma execução.

## Implementação

- parâmetros: `src/config/physics.js`;
- cálculo: `src/services/physicsService.js`;
- persistência das leituras: repository MySQL/Aiven;
- integração IoT: [`iot.md`](iot.md).

## Evidência

A captura final da Física em modo IOT está planejada como `docs/evidencias/iot/05-fisica-iot.png`. A pasta já está pronta para receber o arquivo.
