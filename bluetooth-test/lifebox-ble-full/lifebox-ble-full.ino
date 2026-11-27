// LIFEBOX — SMART ORGAN TRANSPORT
// ExpoTech 2026.2 | Protótipo físico OFFLINE.
// Órgão fixo: CORAÇÃO; temperatura e impacto SIMULADOS por B10K.
// Não usa Wi-Fi ou API; transmite dados por BLE ao navegador próximo.
// EXPERIMENTAL: firmware-real/sketch.ino permanece como versão de segurança.
// Firmware destinado a ESP32 Arduino Core 3.x.

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

const int PIN_TEMP = 34;
const int PIN_IMPACTO = 35;
const int LED_VERDE = 25;
const int LED_VERMELHO = 26;
const int PIN_BUZZER = 27;
const int BOTAO_BOOT = 0;

Adafruit_SSD1306 display(128, 64, &Wire, -1);

// Faixas didáticas da demonstração, NÃO clínicas.
const float TEMP_MIN = 4.0f;
const float TEMP_MAX = 8.0f;
const float IMPACTO_MAX = 3.5f;
const float TEMP_SIM_MIN = -2.0f;
const float TEMP_SIM_MAX = 14.0f;
const float IMPACTO_SIM_MIN = 0.0f;
const float IMPACTO_SIM_MAX = 6.0f;

// Na montagem testada, a inversão deixa a leitura crescer no sentido horário.
// Se algum potenciômetro aumentar no sentido contrário, troque só a chave.
const bool INVERTER_TEMP = true;
const bool INVERTER_IMPACTO = true;

float temperatura = 0.0f;
float impacto = 0.0f;
bool transporteAtivo = true;
bool buzzerOK = false;
// Mantem o PWM estavel: apenas atualiza o tom quando o alerta muda.
bool buzzerLigado = false;
bool botaoAnterior = false;
bool botaoAlternado = false;
unsigned long inicioBotao = 0;
unsigned long ultimaTela = 0;
unsigned long ultimaTransmissaoBLE = 0;

const char *BLE_SERVICE_UUID = "2d514649-4c65-426f-7820-202600000001";
const char *BLE_CHAR_UUID = "2d514649-4c65-426f-7820-202600000002";
BLEServer *bleServidor = nullptr;
BLECharacteristic *bleCaracteristica = nullptr;
volatile bool bleConectado = false;
bool bleEstavaConectado = false;

class LifeBoxBLECallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    bleConectado = true;
    Serial.println("LifeBox: Bluetooth conectado");
  }
  void onDisconnect(BLEServer *server) override {
    bleConectado = false;
    Serial.println("LifeBox: Bluetooth desconectado");
  }
};

void iniciarBLE() {
  BLEDevice::init("LifeBox BLE");
  bleServidor = BLEDevice::createServer();
  bleServidor->setCallbacks(new LifeBoxBLECallbacks());
  BLEService *servico = bleServidor->createService(BLE_SERVICE_UUID);
  bleCaracteristica = servico->createCharacteristic(
    BLE_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  bleCaracteristica->addDescriptor(new BLE2902());
  bleCaracteristica->setValue("0.0,0.00,1");
  servico->start();
  BLEAdvertising *anuncio = BLEDevice::getAdvertising();
  anuncio->addServiceUUID(BLE_SERVICE_UUID);
  anuncio->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.println("LifeBox BLE pronto (sem Wi-Fi)");
}

void transmitirBLE() {
  if (!bleCaracteristica || millis() - ultimaTransmissaoBLE < 500) return;
  ultimaTransmissaoBLE = millis();
  // Temperatura simulada, impacto simulado, transporte ativo (1 ou 0).
  // Payload compacto, compativel com o teste BLE anterior.
  char payload[20];
  snprintf(payload, sizeof(payload), "%.1f,%.2f,%d",
           temperatura, impacto, transporteAtivo ? 1 : 0);
  bleCaracteristica->setValue((uint8_t *)payload, strlen(payload));
  if (bleConectado) bleCaracteristica->notify();
  if (!bleConectado && bleEstavaConectado) {
    delay(100);
    bleServidor->startAdvertising();
    bleEstavaConectado = false;
  }
  if (bleConectado) bleEstavaConectado = true;
}


void acentoAgudo(int x, int y) {
  display.drawPixel(x + 2, y + 1, SSD1306_WHITE);
  display.drawPixel(x + 3, y, SSD1306_WHITE);
}

void acentoTil(int x, int y) {
  display.drawPixel(x, y + 1, SSD1306_WHITE);
  display.drawPixel(x + 1, y, SSD1306_WHITE);
  display.drawPixel(x + 2, y, SSD1306_WHITE);
  display.drawPixel(x + 3, y + 1, SSD1306_WHITE);
  display.drawPixel(x + 4, y + 1, SSD1306_WHITE);
}

void imprimirGrau() {
  display.write((uint8_t)0xF8);
}

float converterLeitura(int leitura, float minimo, float maximo, bool inverter) {
  float proporcao = leitura / 4095.0f;
  if (inverter) proporcao = 1.0f - proporcao;
  return minimo + proporcao * (maximo - minimo);
}

void lerSensores() {
  temperatura = converterLeitura(
    analogRead(PIN_TEMP), TEMP_SIM_MIN, TEMP_SIM_MAX, INVERTER_TEMP
  );
  impacto = converterLeitura(
    analogRead(PIN_IMPACTO), IMPACTO_SIM_MIN, IMPACTO_SIM_MAX, INVERTER_IMPACTO
  );
}

bool temperaturaCritica() {
  return temperatura < TEMP_MIN || temperatura > TEMP_MAX;
}

bool impactoCritico() {
  return impacto >= IMPACTO_MAX;
}

bool emAlerta() {
  return transporteAtivo && (temperaturaCritica() || impactoCritico());
}

void verificarBotao() {
  bool pressionado = digitalRead(BOTAO_BOOT) == LOW;
  if (pressionado && !botaoAnterior) {
    inicioBotao = millis();
    botaoAlternado = false;
  }
  if (pressionado && !botaoAlternado && millis() - inicioBotao >= 2000) {
    transporteAtivo = !transporteAtivo;
    botaoAlternado = true;
  }
  botaoAnterior = pressionado;
}

void atualizarAtuadores() {
  bool alerta = emAlerta();
  digitalWrite(LED_VERDE, (transporteAtivo && !alerta) ? HIGH : LOW);
  digitalWrite(LED_VERMELHO, alerta ? HIGH : LOW);
  // Buzzer PASSIVO: o tom de 2 kHz e continuo enquanto houver alerta.
  // Nao reinicia o PWM em cada passagem pelo loop.
  if (buzzerOK) {
    if (alerta && !buzzerLigado) {
      ledcWriteTone(PIN_BUZZER, 2000);
      buzzerLigado = true;
    } else if (!alerta && buzzerLigado) {
      ledcWriteTone(PIN_BUZZER, 0);
      buzzerLigado = false;
    }
  }
}

void telaInicial() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(20, 7);
  display.println("LIFEBOX");
  display.drawFastHLine(15, 31, 98, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(29, 38);
  display.println("SMART ORGAN");
  display.setCursor(38, 49);
  display.println("TRANSPORT");
  display.display();
  delay(2500);
}

void atualizarOLED() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  display.setCursor(0, 0);
  display.println("LIFEBOX");
  display.drawFastHLine(0, 9, 128, SSD1306_WHITE);

  // ÓRGÃO: CORAÇÃO. Ç via fonte CP437, demais acentos em pixels.
  display.setCursor(0, 15);
  display.print("ORGAO: CORA");
  display.write((uint8_t)0x80); // Ç
  display.print("AO");
  acentoAgudo(0, 12); // Ó
  acentoTil(18, 12);  // Ã em ÓRGÃO
  acentoTil(72, 12);  // Ã em CORAÇÃO

  display.setCursor(0, 27);
  display.print("TEMP: ");
  display.print(temperatura, 1);
  imprimirGrau();
  display.print("C");

  display.setCursor(0, 37);
  display.print("FAIXA: ");
  display.print(TEMP_MIN, 0);
  imprimirGrau();
  display.print("C A ");
  display.print(TEMP_MAX, 0);
  imprimirGrau();
  display.print("C");

  display.setCursor(0, 47);
  display.print("IMPACTO: ");
  display.print(impacto, 1);
  display.print("g");

  // Posição conferida no protótipo físico: acento do A em CENÁRIO.
  display.setCursor(0, 57);
  display.print("CENARIO: ");
  if (!transporteAtivo) {
    display.print("AGUARDANDO");
  } else if (emAlerta()) {
    display.print("ALERTA");
  } else {
    display.print("NORMAL");
  }
  acentoAgudo(18, 55); // Á em CENÁRIO
  display.display();
}

void setup() {
  Serial.begin(115200);
  delay(300);

  // NENHUMA INICIALIZAÇÃO DE WI-FI.
  analogReadResolution(12);
  pinMode(PIN_TEMP, INPUT);
  pinMode(PIN_IMPACTO, INPUT);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);
  pinMode(BOTAO_BOOT, INPUT_PULLUP);
  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_VERMELHO, LOW);

  buzzerOK = ledcAttach(PIN_BUZZER, 2000, 8);
  if (buzzerOK) ledcWriteTone(PIN_BUZZER, 0);

  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED NAO ENCONTRADO");
    while (true) delay(1000);
  }
  display.cp437(true);

  telaInicial();
  lerSensores();
  atualizarAtuadores();
  atualizarOLED();
  iniciarBLE();
  Serial.println("LIFEBOX FISICA BLE PRONTA");
}

void loop() {
  verificarBotao();
  lerSensores();
  atualizarAtuadores();
  transmitirBLE();
  if (millis() - ultimaTela >= 150) {
    ultimaTela = millis();
    atualizarOLED();
  }
  delay(20);
}
