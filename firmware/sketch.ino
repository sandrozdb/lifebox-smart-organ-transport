// LifeBox ESP32 / Wokwi - firmware IoT oficial.
// Sensores -> ESP32 -> Backend -> digitalSignal -> LED/Buzzer/OLED.
// Criticidade e regras do órgão pertencem exclusivamente ao backend.

#include <Adafruit_MPU6050.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
#include <DHTesp.h>
#include <HTTPClient.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <time.h>

constexpr uint8_t DHT_PIN = 14;
constexpr uint8_t BATTERY_ADC_PIN = 34;
constexpr uint8_t LED_PIN = 25;
constexpr uint8_t BUZZER_PIN = 26;
constexpr uint8_t GPS_RX_PIN = 16;
constexpr uint8_t GPS_TX_PIN = 17;
constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t OLED_ADDRESS = 0x3C;

constexpr uint32_t TELEMETRY_INTERVAL_MS = 5000;
constexpr uint32_t STATE_INTERVAL_MS = 3000;
constexpr uint32_t HEARTBEAT_INTERVAL_MS = 1000;
constexpr uint32_t WIFI_RETRY_INTERVAL_MS = 5000;
constexpr uint32_t MPU_RETRY_INTERVAL_MS = 10000;
constexpr uint32_t GPS_INITIAL_WAIT_MS = 8000;
constexpr uint32_t HTTP_TIMEOUT_MS = 10000;
constexpr uint32_t NTP_SYNC_TIMEOUT_MS = 5000;

const char *WIFI_SSID = "Wokwi-GUEST";
const char *WIFI_PASSWORD = "";
const char *API_BASE_URL =
    "https://lifebox-expotech.onrender.com";
const char *DEVICE_ID = "LIFEBOX-WOKWI-001";

DHTesp dht;
Adafruit_MPU6050 mpu;
Adafruit_SSD1306 display(128, 64, &Wire, -1);
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

String backendMode = "IOT";
String backendScenario = "NORMAL";
String organCode = "--";
String organName = "--";
float organMinTemperature = NAN;
float organMaxTemperature = NAN;
float organTargetTemperature = NAN;

bool alertOutput = false;
bool mpuReady = false;
bool oledReady = false;
bool hasClimate = false;
bool clockReady = false;
float lastTemperature = NAN;
float lastHumidity = NAN;
int transportId = 0;

uint32_t lastTelemetryAt = 0;
uint32_t lastStateAt = 0;
uint32_t lastHeartbeatAt = 0;
uint32_t lastWifiRetryAt = 0;
uint32_t lastMpuRetryAt = 0;

float clampValue(float value, float minimum, float maximum) {
  return max(minimum, min(value, maximum));
}

String oledText(String value) {
  const char *accented[] = {"á", "à", "â", "ã", "ä", "Á", "À", "Â",
                            "Ã", "Ä", "é", "ê", "É", "Ê", "í", "Í",
                            "ó", "ô", "õ", "Ó", "Ô", "Õ", "ú", "Ú",
                            "ç", "Ç"};
  const char *ascii[] = {"a", "a", "a", "a", "a", "A", "A", "A", "A",
                         "A", "e", "e", "E", "E", "i", "I", "o", "o",
                         "o", "O", "O", "O", "u", "U", "c", "C"};
  for (size_t index = 0; index < sizeof(accented) / sizeof(accented[0]);
       index++)
    value.replace(accented[index], ascii[index]);
  value.toUpperCase();
  return value;
}

float readBatteryPercent() {
  constexpr float ADC_REFERENCE = 3.3f;
  constexpr float DIVIDER_RATIO = 2.0f;
  constexpr float EMPTY_VOLTAGE = 3.2f;
  constexpr float FULL_VOLTAGE = 4.2f;
  const float pinVoltage =
      (analogRead(BATTERY_ADC_PIN) / 4095.0f) * ADC_REFERENCE;
  return clampValue((pinVoltage * DIVIDER_RATIO - EMPTY_VOLTAGE) * 100.0f /
                        (FULL_VOLTAGE - EMPTY_VOLTAGE),
                    0, 100);
}

int readSignalPercent() {
  if (WiFi.status() != WL_CONNECTED) return 0;
  return constrain(map(WiFi.RSSI(), -100, -50, 0, 100), 0, 100);
}

void scanI2c() {
  Serial.println("[I2C] SCAN START");
  uint8_t devices = 0;
  for (uint8_t address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("[I2C] DEVICE 0x%02X\n", address);
      devices++;
    }
  }
  Serial.printf("[I2C] SCAN END | DEVICES=%u\n", devices);
}

void showDiagnostic(const String &line1, const String &line2 = "",
                    const String &line3 = "", const String &line4 = "") {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("LIFEBOX DEBUG");
  display.println("----------------");
  if (line1.length()) display.println(line1);
  if (line2.length()) display.println(line2);
  if (line3.length()) display.println(line3);
  if (line4.length()) display.println(line4);
  display.display();
}

void showBoot() {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(18, 16);
  display.println("LIFEBOX");
  display.setTextSize(1);
  display.setCursor(48, 42);
  display.println("BOOT");
  display.display();
}

void drawStatus() {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.printf("LIFEBOX %s %s\n",
                 WiFi.status() == WL_CONNECTED ? "ON" : "OFF",
                 backendMode.c_str());
  display.printf("ORGAO: %.12s\n", organName.c_str());
  if (hasClimate)
    display.printf("TEMP: %.1f C\n", lastTemperature);
  else
    display.println("TEMP: --");
  if (!isnan(organMinTemperature) && !isnan(organMaxTemperature))
    display.printf("FAIXA: %.0f-%.0f C\n", organMinTemperature,
                   organMaxTemperature);
  else
    display.println("FAIXA: --");
  display.printf("ALERTA: %s\n", alertOutput ? "SIM" : "NAO");
  display.printf("CEN: %.12s", backendScenario.c_str());
  display.display();
}

void applyDigitalSignal(JsonVariantConst signal) {
  if (signal.isNull()) {
    alertOutput = false;
    digitalWrite(LED_PIN, LOW);
    noTone(BUZZER_PIN);
    Serial.println("[BACKEND] digitalSignal ausente -> atuadores seguros");
    return;
  }
  alertOutput = signal["alertOutput"] | false;
  const bool ledOn = signal["ledOn"] | false;
  const bool buzzerOn = signal["buzzerOn"] | false;
  digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
  if (buzzerOn)
    tone(BUZZER_PIN, 1800);
  else
    noTone(BUZZER_PIN);
  Serial.printf("[LED] %s | [BUZZER] %s | ALERTA=%d\n",
                ledOn ? "ON" : "OFF", buzzerOn ? "ON" : "OFF",
                alertOutput);
}

void processGps() {
  while (gpsSerial.available()) gps.encode(gpsSerial.read());
}

bool waitForGps() {
  Serial.println("[GPS] aguardando NEO-6M...");
  const uint32_t startedAt = millis();
  while (millis() - startedAt < GPS_INITIAL_WAIT_MS) {
    processGps();
    if (gps.location.isValid() && gps.speed.isValid()) {
      Serial.printf("[GPS] OK | CHARS=%lu | LAT=%.6f | LON=%.6f | SPEED=%.1f km/h\n",
                    gps.charsProcessed(), gps.location.lat(),
                    gps.location.lng(), gps.speed.kmph());
      return true;
    }
    delay(10);
  }
  Serial.printf("[GPS] AGUARDANDO FIX | CHARS=%lu | LOC=%d | SPEED=%d\n",
                gps.charsProcessed(), gps.location.isValid(),
                gps.speed.isValid());
  showDiagnostic("GPS AGUARDANDO", "SEM HARD STOP", "TENTARA NOVAMENTE");
  return false;
}

bool isValidUtcTime(const struct tm &utcTime) {
  const int year = utcTime.tm_year + 1900;
  return year >= 2024 && year <= 2100;
}

bool synchronizeClock() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  struct tm utcTime;
  const bool received = getLocalTime(&utcTime, NTP_SYNC_TIMEOUT_MS);
  const bool valid = received && isValidUtcTime(utcTime);
  Serial.printf("[NTP] UTC %s\n", valid ? "OK" : "INVALIDO");
  return valid;
}

String isoTimestampUtc() {
  struct tm utcTime;
  if (!getLocalTime(&utcTime, 100) || !isValidUtcTime(utcTime)) return "";
  char timestamp[21];
  if (strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ",
               &utcTime) == 0)
    return "";
  return String(timestamp);
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("[WIFI] conectando Wokwi-GUEST...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 6);
  const uint32_t startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 15000) {
    processGps();
    delay(250);
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WIFI] CONECTADO | IP=%s | RSSI=%d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
    if (!clockReady) clockReady = synchronizeClock();
  } else {
    Serial.println("[WIFI] FALHA | nova tentativa no loop");
    showDiagnostic("WIFI OFFLINE", "TENTARA NOVAMENTE");
  }
}

// O compilador Web do Wokwi não expõe os símbolos do bundle de CAs do ESP32.
// O endpoint continua HTTPS, mas a validação do certificado é desabilitada
// somente na simulação. Hardware físico deve usar uma CA configurada.
bool beginRequest(HTTPClient &http, WiFiClientSecure &client,
                  const String &path) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[API] bloqueada: Wi-Fi desconectado");
    return false;
  }
  client.setInsecure();
  client.setTimeout(HTTP_TIMEOUT_MS / 1000);
  client.setHandshakeTimeout(HTTP_TIMEOUT_MS / 1000);
  Serial.println("[TLS] HTTPS Wokwi sem validacao de CA (simulacao)");
  if (!http.begin(client, String(API_BASE_URL) + path)) return false;
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.useHTTP10(true);
  return true;
}

bool readBackendState() {
  Serial.println("[API] GET /api/iot/status");
  WiFiClientSecure client;
  HTTPClient http;
  const String path = String("/api/iot/status?deviceId=") + DEVICE_ID;
  if (!beginRequest(http, client, path)) {
    Serial.println("[API] GET STATUS BEGIN FAIL");
    return false;
  }
  const int httpCode = http.GET();
  const String body = http.getString();
  Serial.printf("[API] GET STATUS HTTP %d\n", httpCode);
  if (httpCode != HTTP_CODE_OK) {
    Serial.printf("[API] GET FALHOU | BODY=%s\n", body.c_str());
    http.end();
    return false;
  }
  JsonDocument response;
  const DeserializationError error = deserializeJson(response, body);
  if (error != DeserializationError::Ok) {
    Serial.printf("[API] JSON INVALIDO: %s\n", error.c_str());
    http.end();
    return false;
  }
  backendMode = String((const char *)(response["mode"] | "IOT"));
  backendMode.toUpperCase();
  backendScenario = String((const char *)(response["scenario"] | "NORMAL"));
  backendScenario.toUpperCase();
  const int associatedId = response["transportId"] | 0;
  if (associatedId > 0) transportId = associatedId;

  JsonObjectConst organ = response["organ"];
  if (!organ.isNull()) {
    organCode = String((const char *)(organ["code"] | "--"));
    organName = oledText(String((const char *)(organ["name"] | "--")));
    JsonArrayConst range = organ["referenceRangeC"];
    if (range.size() >= 2) {
      organMinTemperature = range[0].as<float>();
      organMaxTemperature = range[1].as<float>();
    }
    organTargetTemperature = organ["targetTemperatureC"] | NAN;
  }
  applyDigitalSignal(response["digitalSignal"]);
  Serial.printf(
      "[BACKEND] MODE=%s | CENARIO=%s | TRANSPORT=%d | ORGAO=%s | "
      "FAIXA=%.1f..%.1f | ALVO=%.1f | ALERTA=%d\n",
      backendMode.c_str(), backendScenario.c_str(), transportId,
      organCode.c_str(), organMinTemperature, organMaxTemperature,
      organTargetTemperature, alertOutput);
  http.end();
  drawStatus();
  return true;
}

bool readClimate(TempAndHumidity &climate) {
  climate = dht.getTempAndHumidity();
  const bool valid = !isnan(climate.temperature) && !isnan(climate.humidity);
  if (valid) {
    lastTemperature = climate.temperature;
    lastHumidity = climate.humidity;
    hasClimate = true;
    Serial.printf("[DHT22] TEMP=%.1f C | HUM=%.1f %% | STATUS=OK\n",
                  climate.temperature, climate.humidity);
  } else {
    Serial.printf("[DHT22] FAIL | STATUS=%s\n", dht.getStatusString());
    showDiagnostic("DHT22 FAIL", dht.getStatusString(), "TENTARA NOVAMENTE");
  }
  return valid;
}

bool readAcceleration(sensors_event_t &acceleration) {
  sensors_event_t gyro, sensorTemperature;
  if (!mpuReady) {
    Serial.println("[MPU6050] FAIL | dispositivo indisponivel");
    return false;
  }
  mpu.getEvent(&acceleration, &gyro, &sensorTemperature);
  return true;
}

void sendTelemetry() {
  Serial.println("------------------------------------------------");
  Serial.println("[TELEMETRIA] ciclo iniciado");
  if (backendMode != "IOT") {
    Serial.printf("[TELEMETRIA] BLOQUEADA: MODO %s (dashboard usa DEMO)\n",
                  backendMode.c_str());
    drawStatus();
    return;
  }

  TempAndHumidity climate;
  const bool dhtValid = readClimate(climate);
  sensors_event_t acceleration;
  const bool accelerationValid = readAcceleration(acceleration);
  processGps();
  Serial.printf(
      "[GPS] CHARS=%lu | LOC=%s | SPEED=%s | LAT=%.6f | LON=%.6f | "
      "KMH=%.1f\n",
      gps.charsProcessed(), gps.location.isValid() ? "VALID" : "INVALID",
      gps.speed.isValid() ? "VALID" : "INVALID",
      gps.location.isValid() ? gps.location.lat() : 0.0,
      gps.location.isValid() ? gps.location.lng() : 0.0,
      gps.speed.isValid() ? gps.speed.kmph() : 0.0);

  bool blocked = false;
  if (!dhtValid) {
    Serial.println("[TELEMETRIA] BLOQUEADA: DHT22 INVALIDO");
    blocked = true;
  }
  if (!accelerationValid) {
    Serial.println("[TELEMETRIA] BLOQUEADA: MPU6050 INVALIDO");
    blocked = true;
  }
  if (!gps.location.isValid()) {
    Serial.println("[TELEMETRIA] BLOQUEADA: GPS LOCALIZACAO INVALIDA");
    blocked = true;
  }
  if (!gps.speed.isValid()) {
    Serial.println("[TELEMETRIA] BLOQUEADA: GPS VELOCIDADE INVALIDA");
    blocked = true;
  }
  if (transportId <= 0) {
    Serial.println("[TELEMETRIA] BLOQUEADA: SEM TRANSPORTE ASSOCIADO");
    blocked = true;
  }
  if (blocked) {
    drawStatus();
    return;
  }

  const float ax =
      acceleration.acceleration.x / SENSORS_GRAVITY_STANDARD;
  const float ay =
      acceleration.acceleration.y / SENSORS_GRAVITY_STANDARD;
  const float az =
      acceleration.acceleration.z / SENSORS_GRAVITY_STANDARD;
  const float resultant = sqrtf(ax * ax + ay * ay + az * az);
  const float impact = fabsf(resultant - 1.0f);
  const float battery = readBatteryPercent();
  const int signal = readSignalPercent();
  Serial.printf(
      "[MPU6050] X=%.2f g | Y=%.2f g | Z=%.2f g | RESULT=%.2f g | "
      "IMPACT=%.2f g\n",
      ax, ay, az, resultant, impact);
  Serial.printf("[BATTERY] %.1f %% | [WIFI] SIGNAL=%d %% | RSSI=%d dBm\n",
                battery, signal, WiFi.RSSI());

  if (!clockReady) clockReady = synchronizeClock();
  const String timestamp = isoTimestampUtc();
  if (timestamp.isEmpty()) {
    clockReady = false;
    Serial.println("[TELEMETRIA] BLOQUEADA: HORARIO UTC INVALIDO");
    drawStatus();
    return;
  }

  JsonDocument payload;
  payload["transporteId"] = transportId;
  payload["deviceId"] = DEVICE_ID;
  payload["temperatura"] = climate.temperature;
  payload["umidade"] = climate.humidity;
  payload["aceleracao"] = resultant;
  payload["aceleracaoX"] = ax;
  payload["aceleracaoY"] = ay;
  payload["aceleracaoZ"] = az;
  payload["impacto"] = impact;
  payload["latitude"] = gps.location.lat();
  payload["longitude"] = gps.location.lng();
  payload["velocidade"] = gps.speed.kmph();
  payload["bateria"] = battery;
  payload["sinal"] = signal;
  payload["timestamp"] = timestamp;

  String requestBody;
  serializeJson(payload, requestBody);
  Serial.printf("[API] POST /api/telemetria | BODY=%s\n",
                requestBody.c_str());
  WiFiClientSecure client;
  HTTPClient http;
  if (!beginRequest(http, client, "/api/telemetria")) {
    Serial.println("[API] POST BEGIN FAIL");
    return;
  }
  http.addHeader("Content-Type", "application/json");
  const int httpCode = http.POST(requestBody);
  const String responseBody = http.getString();
  Serial.printf("[API] POST /api/telemetria -> HTTP %d\n", httpCode);
  Serial.printf("[API] RESPONSE=%s\n", responseBody.c_str());
  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    JsonDocument response;
    const DeserializationError error =
        deserializeJson(response, responseBody);
    if (error == DeserializationError::Ok) {
      applyDigitalSignal(response["digitalSignal"]);
      Serial.printf(
          "[BACKEND] TEMP=%.1f | HUM=%.1f | IMPACT=%.2f | ALERTA=%d\n",
          climate.temperature, climate.humidity, impact, alertOutput);
    } else {
      Serial.printf("[API] RESPONSE JSON INVALIDO: %s\n", error.c_str());
    }
  } else {
    Serial.println("[API] POST FALHOU");
  }
  http.end();
  drawStatus();
  Serial.println("[TELEMETRIA] ciclo concluido");
}

void printHeartbeat() {
  Serial.printf(
      "[LIFEBOX] RODANDO | WIFI=%s | MODE=%s | TRANSPORT=%d | GPS=%s | "
      "DHT=%s | MPU=%s\n",
      WiFi.status() == WL_CONNECTED ? "ONLINE" : "OFFLINE",
      backendMode.c_str(), transportId,
      gps.location.isValid() && gps.speed.isValid() ? "OK" : "WAIT",
      hasClimate ? "OK" : "WAIT", mpuReady ? "OK" : "WAIT");
}

void setup() {
  Serial.begin(115200);
  Serial.println("================================================");
  Serial.println("        LIFEBOX ESP32 / WOKWI INICIANDO");
  Serial.println("================================================");
  Serial.println("[BOOT] Serial 115200 OK");

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  noTone(BUZZER_PIN);
  Serial.println("[BOOT] LED/Buzzer OK");
  analogReadResolution(12);
  Serial.println("[BOOT] ADC GPIO34 OK");

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Serial.println("[BOOT] I2C SDA=21 SCL=22");
  scanI2c();
  oledReady = display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  Serial.printf("[BOOT] OLED %s | ADDRESS=0x3C\n",
                oledReady ? "OK" : "FAIL");
  showBoot();

  dht.setup(DHT_PIN, DHTesp::DHT22);
  delay(1200);
  TempAndHumidity initialClimate;
  if (!readClimate(initialClimate))
    Serial.println("[BOOT] DHT22 aguardara nova leitura");

  mpuReady = mpu.begin();
  Serial.printf("[BOOT] MPU6050 %s\n", mpuReady ? "OK" : "FAIL");
  if (mpuReady) mpu.setAccelerometerRange(MPU6050_RANGE_8_G);

  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("[BOOT] GPS NEO-6M UART2 RX16/TX17 9600 baud");
  waitForGps();

  connectWiFi();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[BOOT] sincronizando backend...");
    readBackendState();
    Serial.println("[BOOT] primeira tentativa de telemetria...");
    sendTelemetry();
  }
  lastStateAt = millis();
  lastTelemetryAt = millis();
  lastHeartbeatAt = millis();
  Serial.println("================================================");
  Serial.println("[BOOT] LIFEBOX PRONTA");
  Serial.println("================================================");
  drawStatus();
}

void loop() {
  processGps();
  const uint32_t now = millis();
  if (WiFi.status() != WL_CONNECTED &&
      now - lastWifiRetryAt >= WIFI_RETRY_INTERVAL_MS) {
    lastWifiRetryAt = now;
    connectWiFi();
  }
  if (!mpuReady && now - lastMpuRetryAt >= MPU_RETRY_INTERVAL_MS) {
    lastMpuRetryAt = now;
    mpuReady = mpu.begin();
    Serial.printf("[MPU6050] RETRY %s\n", mpuReady ? "OK" : "FAIL");
    if (mpuReady) mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  }
  if (now - lastStateAt >= STATE_INTERVAL_MS) {
    lastStateAt = now;
    readBackendState();
  }
  if (now - lastTelemetryAt >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryAt = now;
    sendTelemetry();
  }
  if (now - lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatAt = now;
    printHeartbeat();
  }
  delay(10);
}
