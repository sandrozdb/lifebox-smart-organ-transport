# LifeBox ESP32 / Wokwi

O protótipo usa ESP32 DevKit, DHT22, MPU6050, GPS, OLED SSD1306, LED, buzzer e um potenciômetro como fonte analógica de tensão para o ADC da bateria.

Arquivos para importar no Wokwi:

- `esp32-example.ino`: firmware;
- `diagram.json`: circuito e ligações;
- `libraries.txt`: bibliotecas utilizadas.

O firmware conecta à rede pública `Wokwi-GUEST`, envia telemetria ao ambiente de teste em `https://lifebox-expotech-iot-test.onrender.com/api/telemetria` e consulta `GET /api/iot/status?deviceId=...`. A validação TLS usa o pacote de certificados raiz do ESP32.

O transporte não fica fixo no firmware. O backend associa `IOT_DEVICE_ID` a `IOT_TRANSPORT_ID` no ambiente do serviço e devolve o transporte autorizado em `/api/iot/status`. Sem uma associação válida, o ESP32 registra o bloqueio no Serial Monitor e não envia telemetria.

As leituras não são constantes no firmware:

- temperatura e umidade: DHT22;
- aceleração X/Y/Z e impacto: MPU6050;
- latitude, longitude e velocidade: GPS;
- bateria: ADC com conversão tensão/percentual calibrável;
- sinal: RSSI da conexão Wi-Fi.

O backend é a fonte de verdade. O ESP32 não decide se temperatura ou impacto são críticos; LED e buzzer apenas reproduzem `digitalSignal` recebido da API.

No Wokwi, os controles visuais dos componentes alteram as grandezas físicas simuladas. O cenário de demonstração do dashboard muda apenas o estado mostrado no OLED e não altera sensores.

Para hardware físico, troque SSID/senha fora do repositório, calibre o divisor resistivo da bateria e revise os pinos conforme a placa. Nunca versionar credenciais.
