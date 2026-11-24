# LifeBox — ESP32 físico (ExpoTech)

Firmware **independente e offline** para o protótipo de bancada da LifeBox com
**2 potenciômetros B10K**, **OLED SSD1306 I²C**, **LED verde**, **LED vermelho**
e buzzer opcional.

> Atenção: os potenciômetros geram **valores simulados**. A caixa não mede
> temperatura nem impacto reais, não refrigera órgãos e não possui finalidade
> clínica. O firmware Wokwi existente permanece em [`../firmware`](../firmware).

## Componentes do kit comprado

- 1 ESP32 Dev Module (confirmar versão e pinagem ao chegar);
- 1 display OLED 0,96" 128×64 I²C (confirmar os 4 pinos);
- 1 protoboard e jumpers;
- 2 potenciômetros lineares B10K e seus knobs;
- 1 LED verde e 1 LED vermelho;
- 2 resistores de 220 Ω, um **em série com cada LED**;
- 1 buzzer ativo, apenas após confirmar alimentação e corrente;
- cabo Micro-USB e carregador USB 5 V compatíveis.

## Ligações previstas

| Peça | Pino ESP32 | Observação |
| --- | --- | --- |
| B10K Temperatura, terminal central | GPIO 34 | Extremos: **3V3** e **GND** |
| B10K Impacto, terminal central | GPIO 35 | Extremos: **3V3** e **GND** |
| OLED SDA | GPIO 21 | Módulo I²C, normalmente 4 pinos |
| OLED SCL | GPIO 22 | Módulo I²C, normalmente 4 pinos |
| OLED VCC e GND | 3V3 / GND | Confirmar compatibilidade com 3,3 V |
| LED verde, ânodo | GPIO 25 | Resistor 220 Ω em série; cátodo ao GND |
| LED vermelho, ânodo | GPIO 26 | Resistor 220 Ω em série; cátodo ao GND |
| Buzzer ativo, controle | GPIO 27 | **Desabilitado inicialmente**; avaliar driver/transistor |

Os potenciômetros não recebem **5 V** nas extremidades. O valor medido
pelo ADC deve permanecer na faixa **0 a 3,3 V**.

### Esquema de cada potenciômetro

```text
ESP32 3V3 ── terminal externo do B10K
ESP32 GPIO34/35 ── terminal central do B10K
ESP32 GND ── outro terminal externo do B10K
```

Se o valor crescer girando para o lado errado, basta inverter os
**terminais externos** do potenciômetro (nunca ligar 5 V).

## Primeira compilação

1. Instale a Arduino IDE e o suporte à placa **ESP32 by Espressif Systems**.
2. Instale as bibliotecas **Adafruit GFX Library** e **Adafruit SSD1306**
   pelo Gerenciador de Bibliotecas.
3. Selecione a placa ESP32 Dev Module (ou o modelo efetivamente entregue).
4. Abra `sketch.ino`; conecte o cabo USB **somente após revisar a fiação**.
5. Compile e envie; abra o Monitor Serial em **115200 baud**.
6. Confira o OLED e gire os dois potenciômetros.
7. Teste os LEDs verde e vermelho antes de instalar a caixa.

Se o OLED não aparecer, verifique endereço I²C (`0x3C` ou `0x3D`),
SDA/SCL e soldagem dos pinos. Nem todo OLED é I²C.

## Comportamento

- Temperatura simulada: **−2 a 14 °C**, ajustada pelo GPIO 34.
- Impacto simulado: **0 a 6 g**, ajustado pelo GPIO 35.
- Estado normal didático: **4 a 8 °C** e impacto abaixo de **3,5 g**.
- Estado de alerta: temperatura fora dessa faixa ou impacto ≥ 3,5 g.
- LED verde indica normal; vermelho indica alerta.
- Buzzer está **desabilitado por padrão** (`ENABLE_BUZZER = false`).
  Habilite somente depois de validar o tipo de buzzer e o circuito de
  acionamento. Para buzzer 5 V ou consumo elevado use transistor/driver.

Os limites configurados são **demonstrativos para o perfil de coração**;
para outros órgãos, as regras do backend são diferentes.

## Montagem na caixa

1. Testar tudo na protoboard, **fora da caixa**.
2. Preparar um **painel rígido** externo (PVC/acrílico/plástico).
3. Fixar os potenciômetros pelo eixo e suas porcas nessa placa, não apenas
   no isopor.
4. Recortar o mínimo necessário para a janelinha do OLED, medindo o módulo
   real recebido. Não deixar o OLED pressionado pelo isopor.
5. Prender o ESP32 e os fios dentro de um compartimento seco, aliviando a
   tração do cabo USB. Não deixar pontas metálicas expostas.
6. Evitar o umidificador ou manter qualquer reservatório e névoa totalmente
   fora do compartimento elétrico.

Os terminais achatados dos B10K vendidos para soldagem não são conexões
firmes de protoboard. Para uma feira com visitantes girando knobs, use
fios **soldados e isolados** ou conectores apropriados; garras jacaré
servem apenas para um teste controlado.

## Como se relaciona com o sistema web?

O sistema atual já tem modo **DEMO** e modo **IOT** com Wokwi enviando
telemetria para o backend Render/Aiven. Este firmware físico, por enquanto,
é uma **demonstração local independente**. Não há Wi-Fi, GPS ou envio de
telemetria para a API nesta versão.

A página [Demonstração IoT](../public/iot-lab.html) apresenta as três
experiências separadamente. Depois de validar o circuito físico,
poderemos integrar via Wi-Fi/HTTPS com um identificador próprio de
dispositivo e transporte selecionado, sem misturar dados reais e virtuais.
