# LifeBox ESP32 IoT no Wokwi

Esta pasta contém todos os arquivos necessários para executar o dispositivo LifeBox diretamente no **Wokwi Web**, sem PlatformIO e sem Wokwi for VS Code.

**Status: integração concluída e validada com o backend público.**

- Wokwi: https://wokwi.com/projects/473749722940837889
- Backend atual: https://lifebox-expotech-iot-test.onrender.com
- Documentação IoT: [`../docs/iot.md`](../docs/iot.md)

## Como abrir no Wokwi

1. Acesse o projeto público [LifeBox ESP32 IoT](https://wokwi.com/projects/473749722940837889).
2. Para montar uma cópia, crie um projeto ESP32 no Wokwi Web.
3. Copie para o projeto os seis arquivos desta pasta, preservando exatamente os nomes: `sketch.ino`, `diagram.json`, `gps-neo6m.chip.json`, `gps-neo6m.chip.c`, `libraries.txt` e `README.md`.
4. Inicie a simulação.

O Wokwi instala as dependências declaradas em `libraries.txt`. Este projeto não usa `platformio.ini`, `wokwi.toml` nem a pasta `.pio`.

## Componentes

- ESP32 DevKit V1;
- DHT22 para temperatura e umidade;
- MPU6050 para aceleração nos eixos X/Y/Z e cálculo de impacto;
- GPS NEO-6M customizado, que envia localização e velocidade em sentenças NMEA;
- OLED SSD1306 I²C no endereço `0x3C`;
- LED vermelho com resistor de 220 Ω;
- buzzer;
- potenciômetro representando a tensão lida pelo ADC da bateria.

## Pinagem

| Componente | Sinal | ESP32 |
| --- | --- | --- |
| DHT22 | Dados | GPIO 14 |
| MPU6050 | SDA / SCL | GPIO 21 / GPIO 22 |
| OLED SSD1306 | SDA / SCL | GPIO 21 / GPIO 22 |
| GPS NEO-6M | TX / RX | RX2 GPIO 16 / TX2 GPIO 17 |
| LED | Ânodo | GPIO 25 |
| Buzzer | Sinal | GPIO 26 |
| Bateria simulada | ADC | GPIO 34 |

Todos os módulos compartilham alimentação e terra conforme `diagram.json`.

## Estado inicial da simulação

- DHT22: **4,0 °C** e **58%** de umidade;
- MPU6050: condição normal até ocorrer interação física na simulação;
- GPS: latitude, longitude e velocidade vêm dos controles do chip NEO-6M e são transmitidas como NMEA;
- LED e buzzer: desligados até o backend devolver um `digitalSignal` ativo.

Esses valores iniciais configuram os componentes do simulador. O firmware não substitui a leitura do DHT22 nem cria uma velocidade GPS fixa.

## Fluxo IoT

```text
Sensores → ESP32 → HTTPS → Render → Aiven → Dashboard
                         ↓
Dashboard → Render → /api/iot/status → ESP32 → OLED
                         ↓
                   digitalSignal → LED/Buzzer
```

O ESP32 envia telemetria ao backend público atual em `https://lifebox-expotech-iot-test.onrender.com`. O backend persiste as leituras no Aiven e disponibiliza o estado ao dashboard. Na direção inversa, o dispositivo consulta `/api/iot/status` para obter modo, transporte, perfil térmico do órgão e `digitalSignal`.

## Fonte de verdade

O backend continua sendo a fonte de verdade das regras. O ESP32:

- não calcula temperatura crítica;
- não decide impacto crítico;
- não escolhe plano logístico;
- não conhece `execucao_id`;
- não decide quando LED/buzzer devem ligar.

O dispositivo apenas lê sensores, envia telemetria, exibe o estado no OLED e aplica `digitalSignal.ledOn` / `digitalSignal.buzzerOn`.

O backend associa cada leitura física ao `execucao_atual_id` do transporte antes da persistência. Isso alimenta corretamente gráficos, Física e resumo final da viagem atual.

## Comportamento dos modos

### IOT

- sensores da caixa vêm deste ESP32/Wokwi;
- botões de cenário de Temperatura, Impacto, Umidade, Bateria e Sinal ficam bloqueados no dashboard;
- Condições Logísticas continuam disponíveis ao operador;
- a PO pode recomendar e aplicar nova rota durante a execução IoT.

### DEMO

- a telemetria vem do simulador do backend;
- cenários manuais da caixa ficam disponíveis;
- Condições Logísticas e reotimização usam o mesmo fluxo seguro.

## O que foi validado

- conexão Wi-Fi do Wokwi;
- sincronização NTP;
- leitura de DHT22;
- leitura do MPU6050;
- GPS customizado NEO-6M;
- bateria simulada via ADC;
- sinal baseado em RSSI;
- envio periódico de telemetria HTTPS;
- ESP32 ONLINE no dashboard;
- persistência no Aiven;
- vínculo da telemetria com a execução ativa;
- gráficos IoT;
- Análise Física IoT;
- resumo final IoT;
- perfil do órgão no OLED;
- LED/buzzer via `digitalSignal`;
- Condições Logísticas e reotimização durante IOT.

## Arquivos

- `sketch.ino`: firmware principal do ESP32;
- `diagram.json`: componentes, posições, conexões e configuração do projeto;
- `gps-neo6m.chip.json`: pinos e controles visuais do GPS customizado;
- `gps-neo6m.chip.c`: geração das sentenças NMEA RMC e GGA;
- `libraries.txt`: bibliotecas instaladas pelo Wokwi Web;
- `README.md`: documentação do protótipo.

## Evidências

A pasta [`../docs/evidencias/iot`](../docs/evidencias/iot/README.md) está preparada para receber as capturas finais do Wokwi, dashboard, gráficos, Física, logística, reotimização e resumo final.
