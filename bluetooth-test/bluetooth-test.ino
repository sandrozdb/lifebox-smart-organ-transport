// LifeBox - prova de conceito BLE, sem Wi-Fi (ESP32 Arduino Core 3.x).
// TESTE SEPARADO: nao substitui firmware-real/sketch.ino.
// Entradas fisicas: B10K temperatura GPIO34, B10K impacto GPIO35.
// Os valores sao SIMULADOS. Sem finalidade clinica.

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

const int PIN_TEMP = 34;
const int PIN_IMPACTO = 35;
const bool INVERTER_TEMP = true;
const bool INVERTER_IMPACTO = true;

const char *SERVICE_UUID = "2d514649-4c65-426f-7820-202600000001";
const char *CHARACTERISTIC_UUID = "2d514649-4c65-426f-7820-202600000002";

BLEServer *server = nullptr;
BLECharacteristic *txCharacteristic = nullptr;
volatile bool connected = false;
bool connectedBefore = false;
unsigned long lastUpdate = 0;

class LifeBoxServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    connected = true;
    Serial.println("Notebook conectado via BLE");
  }
  void onDisconnect(BLEServer *server) override {
    connected = false;
    Serial.println("Notebook desconectado");
  }
};

float simulatedValue(int pin, float minimum, float maximum, bool invert) {
  float ratio = analogRead(pin) / 4095.0f;
  if (invert) ratio = 1.0f - ratio;
  return minimum + ratio * (maximum - minimum);
}

void setup() {
  Serial.begin(115200);
  delay(400);
  analogReadResolution(12);
  pinMode(PIN_TEMP, INPUT);
  pinMode(PIN_IMPACTO, INPUT);

  // Nao chamar WiFi.begin(): usa somente o radio BLE.
  BLEDevice::init("LifeBox BLE");
  server = BLEDevice::createServer();
  server->setCallbacks(new LifeBoxServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);
  txCharacteristic = service->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  txCharacteristic->addDescriptor(new BLE2902());
  txCharacteristic->setValue("0.0,0.00");
  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.println("LifeBox BLE anunciado; use Chrome ou Edge no notebook.");
}

void loop() {
  if (!connected && connectedBefore) {
    delay(100);
    server->startAdvertising();
    connectedBefore = false;
  }
  if (connected && !connectedBefore) {
    connectedBefore = true;
  }

  if (millis() - lastUpdate >= 500) {
    lastUpdate = millis();
    float temp = simulatedValue(PIN_TEMP, -2.0f, 14.0f, INVERTER_TEMP);
    float impact = simulatedValue(PIN_IMPACTO, 0.0f, 6.0f, INVERTER_IMPACTO);

    // CSV compacto (bem menor que 20 bytes) evita depender de MTU grande.
    char payload[20];
    snprintf(payload, sizeof(payload), "%.1f,%.2f", temp, impact);
    txCharacteristic->setValue((uint8_t *)payload, strlen(payload));
    if (connected) txCharacteristic->notify();
    Serial.println(payload);
  }
  delay(10);
}
