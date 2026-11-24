// LifeBox ExpoTech 2026 — ESP32 físico (demonstração local/offline).
// Dois potenciômetros B10K SIMULAM temperatura e impacto.
// Esta versão NÃO lê sensores reais e NÃO envia dados à API.
// Para conectar o hardware ao Render, implementar uma etapa posterior
// de integração autenticada depois de validar a montagem de bancada.

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

constexpr uint8_t PIN_TEMPERATURE = 34;  // ADC1, terminal central B10K
constexpr uint8_t PIN_IMPACT = 35;       // ADC1, terminal central B10K
constexpr uint8_t PIN_OLED_SDA = 21;
constexpr uint8_t PIN_OLED_SCL = 22;
constexpr uint8_t PIN_GREEN_LED = 25;
constexpr uint8_t PIN_RED_LED = 26;
constexpr uint8_t PIN_BUZZER = 27;

constexpr uint8_t OLED_ADDRESS = 0x3C;
constexpr unsigned long REFRESH_INTERVAL_MS = 150;

// Somente habilitar após verificar que o buzzer é 3,3 V, de baixa corrente
// e que a ligação é segura. Se for 5 V ou consumir demais, usar transistor.
constexpr bool ENABLE_BUZZER = false;

// Limites didáticos para a demonstração com CORAÇÃO.
// Não representam validação de temperatura clínica nem medição de impacto.
constexpr float TEMPERATURE_MIN_C = 4.0f;
constexpr float TEMPERATURE_MAX_C = 8.0f;
constexpr float IMPACT_ALERT_G = 3.5f;

Adafruit_SSD1306 oled(128, 64, &Wire, -1);
bool oledReady = false;
unsigned long lastRefresh = 0;

float readAverageAdc(uint8_t pin) {
  uint32_t total = 0;
  for (int sample = 0; sample < 12; ++sample) {
    total += analogRead(pin);
    delayMicroseconds(250);
  }
  return total / 12.0f;
}

void renderOled(float temperature, float impact, bool alert) {
  if (!oledReady) return;

  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.println("LIFEBOX / ESP32 REAL");
  oled.drawLine(0, 12, 127, 12, SSD1306_WHITE);

  oled.setCursor(0, 18);
  oled.print("TEMP:   ");
  oled.print(temperature, 1);
  oled.println(" C");

  oled.setCursor(0, 30);
  oled.print("IMPACT: ");
  oled.print(impact, 1);
  oled.println(" g");

  oled.setCursor(0, 42);
  oled.print("STATUS: ");
  oled.println(alert ? "ALERTA" : "NORMAL");

  oled.setCursor(0, 55);
  oled.print("VALORES SIMULADOS");
  oled.display();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("LIFEBOX ESP32 FISICO - EXPO TECH");
  Serial.println("ATENCAO: TEMP E IMPACTO SAO SIMULADOS.");

  pinMode(PIN_TEMPERATURE, INPUT);
  pinMode(PIN_IMPACT, INPUT);
  analogReadResolution(12);

  pinMode(PIN_GREEN_LED, OUTPUT);
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  Wire.begin(PIN_OLED_SDA, PIN_OLED_SCL);
  oledReady = oled.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);

  Serial.printf("OLED %s (I2C 0x%02X)\n",
                oledReady ? "OK" : "NAO ENCONTRADO", OLED_ADDRESS);
  Serial.println("POT TEMP GPIO34 / POT IMPACTO GPIO35");
  Serial.println("LED VERDE GPIO25 / LED VERMELHO GPIO26");
  Serial.println("BUZZER DESABILITADO ATE VERIFICACAO ELETRICA.");
}

void loop() {
  const unsigned long now = millis();
  if (now - lastRefresh < REFRESH_INTERVAL_MS) return;
  lastRefresh = now;

  // 0..4095 ADC -> -2..14 C (simulado, na faixa didática).
  // 0..4095 ADC ->  0..6 g (simulado, não há acelerômetro).
  const float temperature = -2.0f +
                            (readAverageAdc(PIN_TEMPERATURE) / 4095.0f) * 16.0f;
  const float impact = (readAverageAdc(PIN_IMPACT) / 4095.0f) * 6.0f;

  const bool temperatureCritical = temperature < TEMPERATURE_MIN_C ||
                                   temperature > TEMPERATURE_MAX_C;
  const bool impactCritical = impact >= IMPACT_ALERT_G;
  const bool alert = temperatureCritical || impactCritical;

  digitalWrite(PIN_GREEN_LED, alert ? LOW : HIGH);
  digitalWrite(PIN_RED_LED, alert ? HIGH : LOW);

  // Para buzzer ativo 3,3 V de baixa corrente e com driver, se necessário.
  const bool beep = ENABLE_BUZZER && alert && (now % 1000UL < 120UL);
  digitalWrite(PIN_BUZZER, beep ? HIGH : LOW);

  renderOled(temperature, impact, alert);
  Serial.printf("[SIMULADO] temp=%.1f C impacto=%.2f g alerta=%s\n",
                temperature, impact, alert ? "SIM" : "NAO");
}
