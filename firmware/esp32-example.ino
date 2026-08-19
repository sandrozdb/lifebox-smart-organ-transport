/* Exemplo de integração futura — depende de hardware físico.
   Este código ilustra o contrato HTTP. Sensores, bibliotecas e calibração não foram testados. */
#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "CONFIGURE_SSID";
const char* WIFI_PASSWORD = "CONFIGURE_PASSWORD";
const char* API_URL = "http://IP_DO_NOTEBOOK:3000/api/telemetria";

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void loop() {
  // Futuro: substituir valores demonstrativos por leituras DHT22, MPU6050 e NEO-6M.
  String json = "{\"transporteId\":1,\"deviceId\":\"LIFEBOX-001\",\"temperatura\":4.2,\"umidade\":65,\"aceleracao\":0.12,\"impacto\":0,\"latitude\":-23.5505,\"longitude\":-46.6333,\"velocidade\":42,\"bateria\":87,\"sinal\":92,\"timestamp\":\"2026-01-01T12:00:00.000Z\"}";
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http; http.begin(API_URL); http.addHeader("Content-Type", "application/json");
    int statusCode = http.POST(json); Serial.println(statusCode); http.end();
  }
  delay(5000);
}

