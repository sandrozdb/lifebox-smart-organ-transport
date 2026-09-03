# Integração IoT — ESP32 + Wokwi + Render + Aiven

## Status

**CONCLUÍDA E VALIDADA.** A LifeBox possui um dispositivo ESP32 executado no Wokwi Web, conectado pela internet ao backend público no Render e ao banco Aiven for MySQL.

- Wokwi: https://wokwi.com/projects/473749722940837889
- Backend público atual: https://lifebox-expotech.onrender.com
- Health check: https://lifebox-expotech.onrender.com/api/health
- Firmware: [`../firmware`](../firmware/README.md)

## Fluxo real do protótipo

```text
DHT22 ───────────────┐
MPU6050 ─────────────┤
GPS NEO-6M ──────────┤
Bateria/ADC ─────────┤
Wi-Fi/RSSI ──────────┤
                     ↓
               ESP32 / Wokwi
                     ↓ HTTPS
              Render / Express
              ↙             ↘
       Aiven MySQL        Dashboard
              ↑             ↓
              └──── regras / Física
                            ↓
                   digitalSignal
                            ↓
                  ESP32 LED/Buzzer/OLED
```

## Sensores e dados

O firmware envia periodicamente:

- temperatura do DHT22;
- umidade do DHT22;
- aceleração X/Y/Z e impacto calculado a partir do MPU6050;
- latitude, longitude e velocidade do GPS NEO-6M customizado;
- bateria simulada via ADC;
- sinal baseado no RSSI do Wi-Fi;
- identificação do dispositivo e timestamp sincronizado via NTP.

O firmware não decide criticidade clínica, não escolhe rota e não calcula alertas. O backend continua sendo a fonte de verdade.

## Vínculo com a execução

O ESP32 não precisa conhecer nem enviar `execucao_id`. Quando uma leitura física chega ao backend, `telemetryService` consulta o transporte e associa a telemetria ao `execucao_atual_id` antes da persistência.

Isso permite que os endpoints de leituras, a Análise Física e o resumo final consultem exatamente a telemetria da execução corrente, sem misturar viagens anteriores do mesmo transporte.

O backend também sobrescreve qualquer tentativa de `executionId` enviada pelo cliente. O identificador da execução ativa é sempre decidido server-side.

## Modos IOT e DEMO

### IOT

No modo `IOT`:

- Temperatura, Impacto, Umidade, Bateria e Sinal vêm do ESP32/Wokwi;
- os botões que simulam condições da caixa ficam bloqueados;
- as Condições Logísticas permanecem disponíveis ao operador;
- a PO pode recomendar e aplicar uma nova rota sem alterar artificialmente a telemetria;
- o simulador de execução continua responsável pelo relógio, progresso logístico e snapshot da rota, mas não cria leituras ambientais artificiais.

### DEMO

No modo `DEMO`:

- o simulador gera a telemetria acadêmica;
- os cenários da caixa ficam disponíveis;
- as mesmas Condições Logísticas e o mesmo fluxo de reotimização continuam disponíveis.

Essa separação mantém o comportamento de apresentação sem misturar sensor físico simulado no Wokwi com eventos logísticos externos.

## Reotimização no modo IOT

A integração foi validada com o transporte em andamento e o ESP32 enviando telemetria. Eventos como `Trânsito intenso` e `Transporte terrestre indisponível` permanecem clicáveis no modo IOT e seguem o mesmo fluxo seguro do DEMO:

1. o operador ativa uma condição logística;
2. o backend recalcula a partir do estado atual;
3. uma recomendação é criada com `recommendationId`;
4. o dashboard apresenta o novo plano;
5. a aplicação só ocorre após confirmação explícita;
6. posição, histórico, tempo e isquemia já consumidos são preservados.

## Atuadores

O ESP32 consulta `/api/iot/status`. O backend responde com o estado operacional e `digitalSignal`.

O firmware apenas aplica:

- `digitalSignal.ledOn` → LED;
- `digitalSignal.buzzerOn` → buzzer;
- perfil do órgão e estado atual → OLED.

A regra digital permanece no backend:

```text
ALERTA = TRANSPORTE_ATIVO AND (TEMPERATURA_CRITICA OR IMPACTO_CRITICO)
```

## Endpoints IoT

| Método | Endpoint                       | Uso                            |
| ------ | ------------------------------ | ------------------------------ |
| `GET`  | `/api/iot/status?deviceId=...` | estado consultado pelo ESP32   |
| `PUT`  | `/api/iot/mode`                | alterna `IOT` / `DEMO`         |
| `PUT`  | `/api/iot/profile`             | publica perfil térmico ativo   |
| `POST` | `/api/telemetria`              | recebe leitura física/simulada |

## Persistência no Aiven

As leituras aceitas são persistidas no Aiven for MySQL via TLS. O `execucao_id` permite isolar telemetria, alertas, Física e resumo final por viagem.

Credenciais do Aiven e certificado CA não ficam no GitHub. O Render recebe essas configurações por variáveis de ambiente.

## Validação automatizada

A CI inclui regressões específicas para:

- vínculo de telemetria IoT à execução ativa;
- rejeição de `executionId` arbitrário vindo do dispositivo;
- modo IOT sem telemetria artificial;
- disponibilidade das Condições Logísticas no modo IOT;
- preservação dos cenários da caixa como exclusivos do DEMO;
- fluxo E2E do dashboard em IOT.

A CI #84 terminou verde em 31/08/2026.

## Evidências visuais

A pasta [`evidencias/iot`](evidencias/iot/README.md) já contém o padrão de nomes e o roteiro de capturas finais. Basta adicionar as imagens reais usando os nomes definidos para que o catálogo final fique organizado.

## Limite do protótipo

O hardware validado é um protótipo virtual no Wokwi. Ele demonstra integração de sensores, firmware, comunicação HTTPS, backend, banco e atuadores, mas não equivale a um dispositivo médico físico, calibrado ou certificado.
