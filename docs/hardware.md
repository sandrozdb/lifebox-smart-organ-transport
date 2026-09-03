# Hardware e protótipo IoT

## Estado atual

**Protótipo virtual concluído no Wokwi Web.** O MVP não possui uma caixa física clínica, mas já executa o firmware ESP32 com sensores e atuadores simulados, enviando telemetria real do simulador para o backend público.

Projeto Wokwi: https://wokwi.com/projects/473749722940837889

A documentação completa do firmware está em [`../firmware/README.md`](../firmware/README.md) e o fluxo IoT em [`iot.md`](iot.md).

## ESP32

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

O ESP32 não decide quando os atuadores devem ligar. Ele consulta `/api/iot/status` e aplica `digitalSignal.ledOn` e `digitalSignal.buzzerOn` devolvidos pelo backend.

## Pinagem

| Componente       | Sinal     | ESP32                     |
| ---------------- | --------- | ------------------------- |
| DHT22            | Dados     | GPIO 14                   |
| MPU6050          | SDA / SCL | GPIO 21 / GPIO 22         |
| OLED SSD1306     | SDA / SCL | GPIO 21 / GPIO 22         |
| GPS NEO-6M       | TX / RX   | RX2 GPIO 16 / TX2 GPIO 17 |
| LED              | Ânodo     | GPIO 25                   |
| Buzzer           | Sinal     | GPIO 26                   |
| Bateria simulada | ADC       | GPIO 34                   |

## Comunicação

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

## Evolução para hardware físico

A próxima etapa de hardware é opcional para o escopo acadêmico atual. Uma implementação física exigiria escolha elétrica definitiva, alimentação real, calibração, ensaios ambientais, conectividade móvel, segurança do dispositivo e validação técnica/clinicamente apropriada.

O protótipo Wokwi demonstra a arquitetura e a integração de ponta a ponta, mas não representa um dispositivo médico calibrado ou certificado.
