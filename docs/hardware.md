# Hardware e protótipo IoT

## Estado atual

**Duas demonstrações distintas:** o ESP32 **virtual no Wokwi** integra sensores e atuadores ao backend público por HTTPS; a **caixa física com ESP32 real** demonstra localmente temperatura e impacto simulados por potenciômetros, com OLED, LEDs e buzzer, **sem Wi-Fi e sem conexão com o dashboard**. Nenhuma delas é uma caixa clínica certificada.

Projeto Wokwi: https://wokwi.com/projects/473749722940837889

A documentação completa do firmware está em [`../firmware/README.md`](../firmware/README.md) e o fluxo IoT em [`iot.md`](iot.md).

## ESP32 virtual (Wokwi)

O ESP32 DevKit V1 é responsável por ler sensores, sincronizar horário, comunicar-se via Wi-Fi/HTTPS com o backend e aplicar os sinais digitais devolvidos pelo servidor.

## Temperatura e umidade

O DHT22 fornece temperatura e umidade. No modo IOT esses valores vêm do sensor do Wokwi e não podem ser substituídos pelos botões de cenário do dashboard.

## Impactos e movimentação

O MPU6050 fornece aceleração nos eixos X/Y/Z. O firmware calcula a magnitude do impacto para envio ao backend, que aplica as regras de criticidade.

## Localização

O GPS NEO-6M customizado do projeto Wokwi gera sentenças NMEA lidas pelo TinyGPSPlus. Latitude, longitude e velocidade são transmitidas junto com a telemetria.

## Bateria e sinal

- bateria: potenciômetro ligado ao ADC representa a tensão da bateria;
- sinal: percentual derivado do RSSI da conexão Wi-Fi.

## Atuadores e interface local

- OLED SSD1306 mostra modo, órgão, temperatura, faixa e estado;
- LED vermelho representa a saída de alerta;
- buzzer representa o alarme sonoro.

No **Wokwi**, o ESP32 não decide quando os atuadores devem ligar. Ele consulta `/api/iot/status` e aplica `digitalSignal.ledOn` e `digitalSignal.buzzerOn` devolvidos pelo backend.

## Pinagem do dispositivo virtual (Wokwi)

| Componente       | Sinal     | ESP32                     |
| ---------------- | --------- | ------------------------- |
| DHT22            | Dados     | GPIO 14                   |
| MPU6050          | SDA / SCL | GPIO 21 / GPIO 22         |
| OLED SSD1306     | SDA / SCL | GPIO 21 / GPIO 22         |
| GPS NEO-6M       | TX / RX   | RX2 GPIO 16 / TX2 GPIO 17 |
| LED              | Ânodo     | GPIO 25                   |
| Buzzer           | Sinal     | GPIO 26                   |
| Bateria simulada | ADC       | GPIO 34                   |

## Comunicação da implementação virtual

```text
Sensores → ESP32 → HTTPS → Render/Express → Aiven MySQL
                                  ↓
                              Dashboard
                                  ↓
                        digitalSignal / perfil
                                  ↓
                         ESP32 OLED/LED/Buzzer
```

O firmware usa `WiFiClientSecure` para comunicação HTTPS com o backend atual em `https://lifebox-expotech.onrender.com`.

## O que já foi validado

- leitura de DHT22, MPU6050, GPS, bateria e RSSI;
- envio periódico de telemetria pela internet;
- dispositivo identificado como online no dashboard;
- persistência das leituras no Aiven;
- vínculo das leituras à execução ativa pelo backend;
- gráficos e Análise Física alimentados pela telemetria IoT;
- resumo final com dados da execução IoT;
- retorno do `digitalSignal` para LED/buzzer;
- perfil térmico do órgão exibido no OLED;
- condições logísticas e reotimização funcionando durante uma execução IOT.

## Caixa física — demonstração local sem Wi-Fi

O [firmware físico](../firmware-real/sketch.ino) utiliza uma montagem separada, com **órgão fixo: coração**. Entradas: B10K no GPIO34 (temperatura simulada de −2°C a 14°C) e B10K no GPIO35 (impacto simulado de 0g a 6g); saídas: OLED SSD1306 I²C (SDA21/SCL22), LED verde GPIO25, LED vermelho GPIO26 e buzzer de baixa corrente GPIO27. Os sinais usam alimentação de 3,3 V e resistores adequados nos LEDs. O botão BOOT (GPIO0) pode pausar/retomar o transporte demonstrativo.

Faixa **didática** para coração: **4°C a 8°C**. Impacto crítico: **≥ 3,5g**. Alarme local = transporte ativo **E** (temperatura fora da faixa **OU** impacto crítico). O OLED exibe órgão, temperatura, faixa, impacto e cenário. Os valores são ajustados pelo visitante e **não representam medições reais de sensores**.

**Estado de verificação:** o código foi preparado para a apresentação física; a validação de montagem e funcionamento completo deve ser confirmada na caixa, sem confundir com os testes concluídos do Wokwi.

**Não existe fluxo de telemetria da caixa física para o Render/Aiven ou dashboard.** Dados vistos no dashboard em modo IOT são do Wokwi.

Ambos os protótipos são acadêmicos e não constituem dispositivos médicos calibrados ou certificados.
