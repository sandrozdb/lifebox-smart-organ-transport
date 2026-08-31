# LifeBox ESP32 IoT no Wokwi

Esta pasta contém todos os arquivos necessários para executar o dispositivo LifeBox diretamente no **Wokwi Web**, sem PlatformIO e sem Wokwi for VS Code.

## Como abrir no Wokwi

1. Acesse o projeto público [LifeBox ESP32 IoT](https://wokwi.com/projects/473749722940837889).
2. Para montar uma cópia, crie um projeto ESP32 no Wokwi Web.
3. Copie para o projeto os seis arquivos desta pasta, preservando exatamente os nomes:
   `sketch.ino`, `diagram.json`, `gps-neo6m.chip.json`,
   `gps-neo6m.chip.c`, `libraries.txt` e `README.md`.
4. Inicie a simulação. O Serial Monitor é configurado em `diagram.json` para aparecer sempre.

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

| Componente       | Sinal     | ESP32                     |
| ---------------- | --------- | ------------------------- |
| DHT22            | Dados     | GPIO 14                   |
| MPU6050          | SDA / SCL | GPIO 21 / GPIO 22         |
| OLED SSD1306     | SDA / SCL | GPIO 21 / GPIO 22         |
| GPS NEO-6M       | TX / RX   | RX2 GPIO 16 / TX2 GPIO 17 |
| LED              | Ânodo     | GPIO 25                   |
| Buzzer           | Sinal     | GPIO 26                   |
| Bateria simulada | ADC       | GPIO 34                   |

Todos os módulos compartilham alimentação e terra conforme `diagram.json`.

## Estado inicial da simulação

- DHT22: **4,0 °C** e **58%** de umidade;
- MPU6050: posição estável, em condição normal, até ocorrer interação física na simulação;
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

O ESP32 envia telemetria para o backend de teste no Render. O backend persiste as leituras no Aiven e disponibiliza o estado ao dashboard. Na direção inversa, o dispositivo consulta `/api/iot/status` para obter modo, cenário, transporte, perfil térmico do órgão e `digitalSignal`.

O backend continua sendo a fonte de verdade das regras. O ESP32 apenas apresenta o estado no OLED e aplica `digitalSignal.ledOn` e `digitalSignal.buzzerOn`; não calcula localmente temperatura crítica, impacto crítico ou alerta.

## Arquivos

- `sketch.ino`: firmware principal do ESP32;
- `diagram.json`: componentes, posições, conexões e configuração do Serial Monitor;
- `gps-neo6m.chip.json`: pinos e controles visuais do GPS customizado;
- `gps-neo6m.chip.c`: geração das sentenças NMEA RMC e GGA;
- `libraries.txt`: bibliotecas instaladas pelo Wokwi Web;
- `README.md`: documentação do protótipo.
