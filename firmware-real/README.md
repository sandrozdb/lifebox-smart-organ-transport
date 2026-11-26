# LifeBox — protótipo físico offline (ExpoTech 2026.2)

Esta pasta reúne o firmware **do ESP32 real colocado na caixa**, para demonstração presencial **independente do software online**. A integração IoT do dashboard é executada **somente no ESP32 virtual no Wokwi**, documentado em [`../firmware/`](../firmware/README.md).

> **Limite explícito:** a caixa física **não se conecta ao Wi-Fi, não acessa a API e não envia telemetria ao dashboard/Render/Aiven**. Os dois potenciômetros **simulam** temperatura e impacto: não existem sensores calibrados de temperatura ou aceleração na montagem. O projeto não é equipamento médico.

## O que aparece no OLED (128 × 64)

Ao energizar, uma abertura curta mostra **LIFEBOX — SMART ORGAN TRANSPORT**. Em seguida, o painel exibe:

```text
LIFEBOX
ÓRGÃO: CORAÇÃO
TEMP: 6.2°C
FAIXA: 4°C A 8°C
IMPACTO: 1.4g
CENÁRIO: NORMAL
```

Os números acima são exemplos, não medições reais. A escrita acentuada usa caracteres CP437 (`Ç`, `°`) e acentos desenhados em pixels, pois a fonte padrão do Adafruit GFX não apresenta UTF-8 diretamente.

## Controles e regras

| Entrada ou saída | Pino ESP32 | Papel |
| --- | --- | --- |
| Potenciômetro B10K de temperatura | GPIO34 (terminal central) | Simula de **−2°C a 14°C** |
| Potenciômetro B10K de impacto | GPIO35 (terminal central) | Simula de **0g a 6g** |
| OLED SSD1306 I²C | SDA GPIO21, SCL GPIO22 | Exibe órgão, valores e cenário |
| OLED VDD/GND | 3V3 / GND | Alimentação do módulo compatível |
| LED verde + resistor 220Ω em série | GPIO25 | Transporte ativo, condição normal |
| LED vermelho + resistor 220Ω em série | GPIO26 | Alerta crítico |
| Buzzer pequeno de baixa corrente | GPIO27 | Tom de alerta; conferir adequação elétrica |
| Botão BOOT existente na placa | GPIO0 | Segure 2 s para pausar/retomar o transporte demonstrativo |

Os terminais **externos** de cada B10K vão ao **3V3 e GND**; o terminal **central** vai ao respectivo GPIO ADC. **Nunca ligue 5 V aos GPIOs, ao pino 3V3 ou às entradas dos potenciômetros**. Desconecte USB/energia antes de alterar ligações. O buzzer não deve consumir corrente acima do suportado pelo GPIO; utilize driver/transistor apropriado se necessário. Um buzzer de 5 V não deve ser ligado diretamente ao GPIO.

O firmware possui `INVERTER_TEMP` e `INVERTER_IMPACTO`, inicialmente `true` para a montagem utilizada nos testes. Se algum knob diminuir ao girar para a direita, altere **somente a chave correspondente** para `false`, sem inverter fios.

### Faixas acadêmicas e atuadores

Perfil fixo do protótipo: **coração**. A faixa demonstrativa é **4°C a 8°C, inclusive**, e impacto crítico é **≥ 3,5g**.

```text
ALERTA = TRANSPORTE_ATIVO AND (TEMP_CRITICA OR IMPACTO_CRITICO)
```

- **NORMAL + transporte ativo:** LED verde aceso; vermelho e buzzer desligados.
- **ALERTA + transporte ativo:** LED vermelho aceso, verde apagado e buzzer tocando.
- **Transporte pausado:** ambos os LEDs e buzzer desligados; o OLED indica `AGUARDANDO`.

O transporte demonstrativo **começa ativo** ao ligar a placa. Mantenha BOOT pressionado por 2 segundos para pausar ou retomar; não segure BOOT enquanto estiver ligando o ESP32.

## Como compilar

1. Abra [`sketch.ino`](sketch.ino) na **Arduino IDE**, selecionando a placa correta (nos testes, ESP32 Dev Module) e a porta USB.
2. Instale **ESP32 by Espressif Systems** (core 3.x), **Adafruit GFX Library** e **Adafruit SSD1306**.
3. Compile e envie. O firmware **não ativa Wi-Fi**.
4. Confira a tela de abertura, temperatura e impacto aumentando ao girar os controles no sentido desejado.
5. Com temperatura entre 4°C e 8°C e impacto abaixo de 3,5g, teste o LED verde. Saia da faixa ou aumente o impacto: devem ligar o LED vermelho e o buzzer.
6. Teste a alimentação final e a montagem da caixa, sem componentes metálicos soltos ou umidade junto à eletrônica.

**Situação em 26/11/2026:** firmware organizado para a feira; **a verificação física final do código mais recente depende do teste na placa**. Não confundir com a integração Wokwi já validada.

## Apresentação ao público

Primeiro, demonstre o **dashboard e Wokwi conectados à nuvem**. Depois, apresente a caixa com um **coração cenográfico** e diga:

> “Esta é a demonstração física independente da LifeBox. Aqui vocês podem girar os controles que simulam temperatura e impacto e observar a resposta do OLED, LEDs e alarme. A integração online com o dashboard foi demonstrada no Wokwi.”

Não apresente o protótipo como refrigerador funcional, medidor clínico nem equipamento de transporte de órgãos pronto para uso.
