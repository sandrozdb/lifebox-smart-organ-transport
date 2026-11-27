// LIFEBOX — SMART ORGAN TRANSPORT
// ExpoTech 2026.2 | Protótipo físico OFFLINE.
// Órgao configurável via BLE; temperatura e impacto SIMULADOS por B10K.
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
// Mesmo conjunto de faixas do backend (src/config/organProfiles.js).
// Limites didaticos, nao prescricoes para transporte real.
struct PerfilOrgao {
  const char *code;
  const char *nomeOLED;
  float minimo;
  float maximo;
};
const PerfilOrgao PERFIS[] = {
  {"HEART",    "CORACAO",  4.0f, 8.0f},
  {"LUNG",     "PULMAO",   0.0f, 4.0f},
  {"KIDNEY",   "RIM",      0.0f, 4.0f},
  {"LIVER",    "FIGADO",   0.0f, 4.0f},
  {"PANCREAS", "PANCREAS", 0.0f, 4.0f},
  {"INTESTINE","INTESTINO",0.0f, 4.0f}
};
const uint8_t QTD_PERFIS = sizeof(PERFIS) / sizeof(PERFIS[0]);
uint8_t perfilAtual = 0; // Coracao ao iniciar, mesmo sem Bluetooth.
volatile int perfilPendente = -1;
const float IMPACTO_MAX = 3.5f; // Limite de impacto demonstrativo; >= 3.5 g e critico.
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
// Inicializa PAUSADO para impedir alertas antes de iniciar a caixa.
bool transporteAtivo = false;
volatile int transportePendente = -1; // -1=nada; 0=pausar; 1=iniciar
bool buzzerOK = false;
// Mantem o PWM estavel: apenas atualiza o tom quando o alerta muda.
bool buzzerLigado = false;
bool botaoAnterior = false;
bool botaoAlternado = false;
unsigned long inicioBotao = 0;
unsigned long ultimaTela = 0;
unsigned long ultimaTransmissaoBLE = 0;
unsigned long ultimoDiagnostico = 0;

const char *BLE_SERVICE_UUID = "2d514649-4c65-426f-7820-202600000001";
const char *BLE_CHAR_UUID = "2d514649-4c65-426f-7820-202600000002";
const char *BLE_COMMAND_UUID = "2d514649-4c65-426f-7820-202600000003";
BLEServer *bleServidor = nullptr;
BLECharacteristic *bleCaracteristica = nullptr;
BLECharacteristic *bleComando = nullptr;
volatile bool bleConectado = false;
bool bleEstavaConectado = false;

class LifeBoxBLECallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    bleConectado = true;
    Serial.println("LifeBox: Bluetooth conectado");
  }
  void onDisconnect(BLEServer *server) override {
    bleConectado = false;
    // Fail-safe da demonstracao: conexao BLE perdida pausa o transporte.
    // O botao BOOT continua permitindo iniciar a caixa offline.
    transportePendente = 0;
    Serial.println("LifeBox: Bluetooth desconectado; pausando transporte");
  }
};

// Callback BLE roda fora do loop. Apenas registra a solicitacao:
class LifeBoxCommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    String comando = characteristic->getValue();
    comando.trim();
    comando.toUpperCase();
    if (comando == "START") {
      transportePendente = 1;
      return;
    }
    if (comando == "PAUSE" || comando == "STOP" || comando == "RESET") {
      transportePendente = 0;
      return;
    }
    for (uint8_t i = 0; i < QTD_PERFIS; ++i) {
      if (comando == PERFIS[i].code) {
        perfilPendente = i;
        return;
      }
    }
    Serial.println("BLE: perfil desconhecido ignorado");
  }
};

void aplicarPerfilPendente() {
  int recebido = perfilPendente;
  if (recebido < 0) return;
  perfilPendente = -1;
  if (recebido >= QTD_PERFIS) return;
  perfilAtual = static_cast<uint8_t>(recebido);
  Serial.print("Orgao selecionado: ");
  Serial.println(PERFIS[perfilAtual].code);
}

void aplicarComandoTransportePendente() {
  int solicitado = transportePendente;
  if (solicitado < 0) return;
  transportePendente = -1;
  transporteAtivo = solicitado == 1;
  Serial.print("TRANSPORTE FISICO: ");
  Serial.println(transporteAtivo ? "ATIVO" : "PAUSADO");
}

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
  // Primeira leitura BLE ja reflete os potenciometros reais da montagem,
  // evitando um alerta falso ao conectar antes da primeira notificacao.
  char primeiroPayload[20];
  snprintf(primeiroPayload, sizeof(primeiroPayload), "%.1f,%.2f,%d,%u,2",
           temperatura, impacto, transporteAtivo ? 1 : 0, perfilAtual);
  bleCaracteristica->setValue((uint8_t *)primeiroPayload, strlen(primeiroPayload));
  bleComando = servico->createCharacteristic(
    BLE_COMMAND_UUID, BLECharacteristic::PROPERTY_WRITE
  );
  bleComando->setCallbacks(new LifeBoxCommandCallbacks());
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
  // CSV: temperatura, impacto, ativo, indice de perfil (0..5), versao=2.
  // Permanece pequeno para MTU BLE padrao, sem depender de Wi-Fi.
  char payload[20];
  snprintf(payload, sizeof(payload), "%.1f,%.2f,%d,%u,2",
           temperatura, impacto, transporteAtivo ? 1 : 0, perfilAtual);
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

void acentoCircunflexo(int x, int y) {
  display.drawPixel(x + 1, y + 1, SSD1306_WHITE);
  display.drawPixel(x + 2, y, SSD1306_WHITE);
  display.drawPixel(x + 3, y + 1, SSD1306_WHITE);
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
  return temperatura < PERFIS[perfilAtual].minimo ||
         temperatura > PERFIS[perfilAtual].maximo;
}

bool impactoCritico() {
  return impacto >= IMPACTO_MAX;
}

bool emAlerta() {
  // LOGICA DIGITAL: ATIVO AND (TEMP_CRITICA OR IMPACTO_CRITICO).
  // Temperatura considera a faixa demonstrativa do orgao escolhido.
  // Impacto critico a partir de 3,5 g (potenciometro simulado).
  // Quando pausado pelo BOOT, nenhum atuador pode ser ligado.
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

  // Desenha nome dinamico e acentos na fonte 5x7 Adafruit GFX.
  display.setCursor(0, 15);
  display.print("ORGAO: ");
  if (perfilAtual == 0) {
    display.print("CORA");
    display.write((uint8_t)0x80); // Ç CP437
    display.print("AO");
    acentoTil(72, 12); // Ã em CORAÇÃO, preservado da montagem
  } else {
    display.print(PERFIS[perfilAtual].nomeOLED);
    if (perfilAtual == 1) acentoTil(66, 12);          // PULMÃO
    if (perfilAtual == 3) acentoAgudo(48, 12);        // FÍGADO
    if (perfilAtual == 4) acentoCircunflexo(48, 12);  // PÂNCREAS
  }
  acentoAgudo(0, 12); // Ó em ÓRGÃO
  acentoTil(18, 12);  // Ã em ÓRGÃO

  display.setCursor(0, 27);
  display.print("TEMP: ");
  display.print(temperatura, 1);
  imprimirGrau();
  display.print("C");

  display.setCursor(0, 37);
  display.print("FAIXA: ");
  display.print(PERFIS[perfilAtual].minimo, 0);
  imprimirGrau();
  display.print("C A ");
  display.print(PERFIS[perfilAtual].maximo, 0);
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
  Serial.println(buzzerOK ? "BUZZER PWM: OK" : "BUZZER PWM: FALHA");

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
  aplicarComandoTransportePendente();
  aplicarPerfilPendente();
  verificarBotao();
  lerSensores();
  atualizarAtuadores();
  if (millis() - ultimoDiagnostico >= 2000) {
    ultimoDiagnostico = millis();
    Serial.printf("BLEv2 ATIVO=%d TEMP=%.1f TEMP_CRIT=%d IMPACTO=%.2f IMPACTO_CRIT=%d ALARME=%d\n",
      transporteAtivo ? 1 : 0, temperatura, temperaturaCritica() ? 1 : 0,
      impacto, impactoCritico() ? 1 : 0, emAlerta() ? 1 : 0);
  }
  transmitirBLE();
  if (millis() - ultimaTela >= 150) {
    ultimaTela = millis();
    atualizarOLED();
  }
  delay(20);
}
