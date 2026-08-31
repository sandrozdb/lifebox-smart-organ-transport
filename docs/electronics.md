# Eletrônica Digital e Analógica

## Estado atual

O circuito clínico físico ainda não foi construído, mas o **protótipo eletrônico virtual foi implementado e validado no Wokwi Web** com ESP32, sensores, OLED, LED e buzzer.

Projeto: https://wokwi.com/projects/473749722940837889

```text
Grandeza física → sensor/módulo → ESP32 → JSON/HTTPS → API no Render
                                           ↑             ↓
                                      OLED/LED/Buzzer ← digitalSignal
```

| Componente    | Grandeza/função                   | Interface usada no protótipo |
| ------------- | --------------------------------- | ---------------------------- |
| DHT22         | Temperatura e umidade             | sinal digital no GPIO 14     |
| MPU6050       | Aceleração nos três eixos         | I2C, GPIO 21/22              |
| GPS NEO-6M    | Latitude, longitude e velocidade  | UART, RX2/TX2 GPIO 16/17     |
| ESP32         | Leitura, Wi-Fi e integração HTTPS | GPIO, ADC, I2C, UART e Wi-Fi |
| Potenciômetro | Bateria simulada                  | ADC GPIO 34                  |
| OLED SSD1306  | Estado local                      | I2C, endereço `0x3C`         |
| LED           | Alerta visual                     | GPIO 25                      |
| Buzzer        | Alerta sonoro                     | GPIO 26                      |

Entradas digitais representam estados discretos ou protocolos; entradas analógicas convertem tensão contínua pelo ADC. I2C permite compartilhar o barramento entre MPU6050 e OLED, enquanto UART é usada pelo GPS customizado.

## Lógica digital de alerta

A lógica combinacional é calculada em `src/services/digitalAlertLogic.js`:

```text
ALERTA = TRANSPORTE_ATIVO AND (TEMPERATURA_CRITICA OR IMPACTO_CRITICO)
```

Tabela verdade:

| Transporte ativo | Temperatura crítica | Impacto crítico | ALERTA / LED / buzzer |
| ---------------: | ------------------: | --------------: | --------------------: |
| 0                | 0                   | 0               | 0                     |
| 0                | 0                   | 1               | 0                     |
| 0                | 1                   | 0               | 0                     |
| 0                | 1                   | 1               | 0                     |
| 1                | 0                   | 0               | 0                     |
| 1                | 0                   | 1               | 1                     |
| 1                | 1                   | 0               | 1                     |
| 1                | 1                   | 1               | 1                     |

```mermaid
flowchart LR
  A[TRANSPORTE_ATIVO] --> AND[Porta AND]
  T[TEMPERATURA_CRITICA] --> OR[Porta OR]
  I[IMPACTO_CRITICO] --> OR
  OR --> AND
  AND --> O[ALERTA]
  O --> L[GPIO: LED]
  O --> B[GPIO: Buzzer]
```

## Backend como fonte de verdade

No protótipo Wokwi, o ESP32 **não replica a regra digital**. O firmware envia a leitura e consulta `/api/iot/status`. O backend decide a criticidade e devolve `digitalSignal`.

O dispositivo aplica apenas:

- `digitalSignal.ledOn` no LED;
- `digitalSignal.buzzerOn` no buzzer;
- perfil/estado no OLED.

Isso evita divergência entre a regra mostrada no dashboard e uma regra paralela no firmware.

## DEMO x IOT

- **DEMO:** temperatura/impacto críticos podem ser forçados pelos cenários acadêmicos do dashboard;
- **IOT:** temperatura, impacto, umidade, bateria e sinal vêm dos sensores Wokwi e os botões de cenário da caixa ficam bloqueados;
- **ambos:** Condições Logísticas não acionam LED/buzzer por si só, pois são eventos operacionais e não sinais críticos da caixa.

## Logisim

O circuito em [`../electronics/lifebox-alert-logic.circ`](../electronics/lifebox-alert-logic.circ) representa a mesma expressão booleana usada pelo backend. As capturas estão documentadas em [`electronics-evidence.md`](electronics-evidence.md).

## Limite físico

O Wokwi demonstra pinagem, protocolos, ADC, I2C, UART, lógica e integração com o software. Uma montagem física exigiria alimentação/regulação, proteção elétrica, dimensionamento de corrente, estágio adequado para atuadores, calibração e ensaios antes de qualquer uso real.

Mais detalhes: [`hardware.md`](hardware.md), [`iot.md`](iot.md) e [`../firmware/README.md`](../firmware/README.md).
