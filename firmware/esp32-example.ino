// LifeBox ESP32 / Wokwi. Regras e severidades pertencem ao backend.
#include <Adafruit_MPU6050.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
#include <DHTesp.h>
#include <HTTPClient.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <esp_crt_bundle.h>

extern const uint8_t rootca_crt_bundle_start[]
    asm("_binary_x509_crt_bundle_start");
extern const uint8_t rootca_crt_bundle_end[]
    asm("_binary_x509_crt_bundle_end");

constexpr uint8_t DHT_PIN=15, BATTERY_ADC_PIN=34, LED_PIN=25, BUZZER_PIN=26;
constexpr uint8_t GPS_RX_PIN=16, GPS_TX_PIN=17;
constexpr uint32_t TELEMETRY_INTERVAL_MS=5000, STATE_INTERVAL_MS=3000;
const char* WIFI_SSID="Wokwi-GUEST";
const char* WIFI_PASSWORD="";
const char* API_BASE_URL="https://lifebox-expotech.onrender.com";
const char* DEVICE_ID="LIFEBOX-WOKWI-001";
constexpr int TRANSPORT_ID=1;

DHTesp dht;
Adafruit_MPU6050 mpu;
Adafruit_SSD1306 display(128,64,&Wire,-1);
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);
String backendMode="IOT", backendScenario="NORMAL";
bool alertOutput=false;
uint32_t lastTelemetryAt=0, lastStateAt=0;

float clampValue(float value,float minimum,float maximum){return max(minimum,min(value,maximum));}
float readBatteryPercent(){
  // Potenciometro = tensao no ADC apos divisor. Calibrar em hardware real.
  constexpr float ADC_REFERENCE=3.3f, DIVIDER_RATIO=2.0f;
  constexpr float EMPTY_VOLTAGE=3.2f, FULL_VOLTAGE=4.2f;
  const float pinVoltage=(analogRead(BATTERY_ADC_PIN)/4095.0f)*ADC_REFERENCE;
  const float voltage=pinVoltage*DIVIDER_RATIO;
  return clampValue((voltage-EMPTY_VOLTAGE)*100.0f/(FULL_VOLTAGE-EMPTY_VOLTAGE),0,100);
}
int readSignalPercent(){
  if(WiFi.status()!=WL_CONNECTED)return 0;
  return constrain(map(WiFi.RSSI(),-100,-50,0,100),0,100);
}
void applyDigitalSignal(JsonVariantConst signal){
  alertOutput=signal["alertOutput"]|false;
  digitalWrite(LED_PIN,(signal["ledOn"]|false)?HIGH:LOW);
  if(signal["buzzerOn"]|false)tone(BUZZER_PIN,1800);else noTone(BUZZER_PIN);
}
void drawStatus(float temperature,float humidity){
  display.clearDisplay();display.setTextColor(SSD1306_WHITE);display.setTextSize(1);display.setCursor(0,0);
  display.printf("LIFEBOX %s\nMODO: %s\nCENARIO: %s\n",WiFi.isConnected()?"ONLINE":"OFFLINE",backendMode.c_str(),backendScenario.c_str());
  display.printf("TEMP: %.1f C\nUMID: %.1f %%\nALERTA: %d",temperature,humidity,alertOutput?1:0);display.display();
}
bool beginRequest(HTTPClient& http,WiFiClientSecure& client,const String& path){
  if(WiFi.status()!=WL_CONNECTED)return false;
  client.setCACertBundle(rootca_crt_bundle_start,
                         rootca_crt_bundle_end-rootca_crt_bundle_start);
  return http.begin(client,String(API_BASE_URL)+path);
}
void readBackendState(){
  WiFiClientSecure client;HTTPClient http;if(!beginRequest(http,client,"/api/iot/status"))return;
  if(http.GET()==HTTP_CODE_OK){JsonDocument response;if(deserializeJson(response,http.getString())==DeserializationError::Ok){
    backendMode=String((const char*)response["mode"]);backendMode.toUpperCase();
    backendScenario=String((const char*)response["scenario"]);backendScenario.toUpperCase();applyDigitalSignal(response["digitalSignal"]);}}
  http.end();
}
void sendTelemetry(){
  TempAndHumidity climate=dht.getTempAndHumidity();sensors_event_t acceleration,gyro,mpuTemperature;mpu.getEvent(&acceleration,&gyro,&mpuTemperature);
  if(isnan(climate.temperature)||isnan(climate.humidity)||!gps.location.isValid()||!gps.speed.isValid()){
    Serial.println("Telemetria aguardando sensores validos");return;
  }
  const float ax=acceleration.acceleration.x/SENSORS_GRAVITY_STANDARD,ay=acceleration.acceleration.y/SENSORS_GRAVITY_STANDARD,az=acceleration.acceleration.z/SENSORS_GRAVITY_STANDARD;
  const float resultant=sqrtf(ax*ax+ay*ay+az*az),impact=fabsf(resultant-1.0f);
  JsonDocument payload;payload["transporteId"]=TRANSPORT_ID;payload["deviceId"]=DEVICE_ID;payload["temperatura"]=climate.temperature;payload["umidade"]=climate.humidity;
  payload["aceleracao"]=resultant;payload["aceleracaoX"]=ax;payload["aceleracaoY"]=ay;payload["aceleracaoZ"]=az;payload["impacto"]=impact;
  payload["latitude"]=gps.location.lat();payload["longitude"]=gps.location.lng();payload["velocidade"]=gps.speed.kmph();
  payload["bateria"]=readBatteryPercent();payload["sinal"]=readSignalPercent();payload["timestamp"]=String(millis());
  String body;serializeJson(payload,body);WiFiClientSecure client;HTTPClient http;if(!beginRequest(http,client,"/api/telemetria"))return;
  http.addHeader("Content-Type","application/json");const int statusCode=http.POST(body);Serial.printf("POST telemetria: %d\n",statusCode);
  if(statusCode==HTTP_CODE_CREATED){JsonDocument response;if(deserializeJson(response,http.getString())==DeserializationError::Ok)applyDigitalSignal(response["digitalSignal"]);}
  http.end();drawStatus(climate.temperature,climate.humidity);
}
void setup(){
  Serial.begin(115200);pinMode(LED_PIN,OUTPUT);pinMode(BUZZER_PIN,OUTPUT);analogReadResolution(12);Wire.begin(21,22);dht.setup(DHT_PIN,DHTesp::DHT22);gpsSerial.begin(9600,SERIAL_8N1,GPS_RX_PIN,GPS_TX_PIN);
  if(!mpu.begin())Serial.println("MPU6050 nao encontrado");mpu.setAccelerometerRange(MPU6050_RANGE_8_G);if(!display.begin(SSD1306_SWITCHCAPVCC,0x3C))Serial.println("OLED nao encontrado");
  WiFi.mode(WIFI_STA);WiFi.begin(WIFI_SSID,WIFI_PASSWORD,6);while(WiFi.status()!=WL_CONNECTED){delay(250);Serial.print('.');}Serial.printf("Wi-Fi conectado, RSSI %d dBm\n",WiFi.RSSI());drawStatus(0,0);
}
void loop(){
  while(gpsSerial.available())gps.encode(gpsSerial.read());const uint32_t now=millis();
  if(now-lastStateAt>=STATE_INTERVAL_MS){lastStateAt=now;readBackendState();}if(now-lastTelemetryAt>=TELEMETRY_INTERVAL_MS){lastTelemetryAt=now;sendTelemetry();}delay(5);
}
