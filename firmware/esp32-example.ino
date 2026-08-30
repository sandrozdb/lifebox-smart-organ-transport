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

extern const uint8_t rootca_crt_bundle_start[] asm("_binary_x509_crt_bundle_start");
extern const uint8_t rootca_crt_bundle_end[] asm("_binary_x509_crt_bundle_end");

constexpr uint8_t DHT_PIN=15, BATTERY_ADC_PIN=34, LED_PIN=25, BUZZER_PIN=26;
constexpr uint8_t GPS_RX_PIN=16, GPS_TX_PIN=17;
constexpr uint32_t TELEMETRY_INTERVAL_MS=5000, STATE_INTERVAL_MS=3000;
const char* WIFI_SSID="Wokwi-GUEST";
const char* WIFI_PASSWORD="";
const char* API_BASE_URL="https://lifebox-expotech-iot-test.onrender.com";
const char* DEVICE_ID="LIFEBOX-WOKWI-001";

DHTesp dht; Adafruit_MPU6050 mpu; Adafruit_SSD1306 display(128,64,&Wire,-1);
TinyGPSPlus gps; HardwareSerial gpsSerial(2);
String backendMode="IOT", backendScenario="NORMAL";
bool alertOutput=false, mpuReady=false, oledReady=false;
int transportId=0;
uint32_t lastTelemetryAt=0, lastStateAt=0;

float clampValue(float value,float minimum,float maximum){return max(minimum,min(value,maximum));}
float readBatteryPercent(){
  constexpr float ADC_REFERENCE=3.3f, DIVIDER_RATIO=2.0f, EMPTY_VOLTAGE=3.2f, FULL_VOLTAGE=4.2f;
  const float pinVoltage=(analogRead(BATTERY_ADC_PIN)/4095.0f)*ADC_REFERENCE;
  return clampValue((pinVoltage*DIVIDER_RATIO-EMPTY_VOLTAGE)*100.0f/(FULL_VOLTAGE-EMPTY_VOLTAGE),0,100);
}
int readSignalPercent(){if(WiFi.status()!=WL_CONNECTED)return 0;return constrain(map(WiFi.RSSI(),-100,-50,0,100),0,100);}
void scanI2c(){
  Serial.println("I2C SCAN START");
  for(uint8_t address=1;address<127;address++){Wire.beginTransmission(address);if(Wire.endTransmission()==0)Serial.printf("I2C device 0x%02X\n",address);}
  Serial.println("I2C SCAN END");
}
void showBoot(){
  if(!oledReady)return;
  display.clearDisplay();display.setTextColor(SSD1306_WHITE);display.setTextSize(2);display.setCursor(18,16);
  display.println("LIFEBOX");display.setTextSize(1);display.setCursor(48,42);display.println("BOOT");display.display();
}
void applyDigitalSignal(JsonVariantConst signal){
  alertOutput=signal["alertOutput"]|false;
  digitalWrite(LED_PIN,(signal["ledOn"]|false)?HIGH:LOW);
  if(signal["buzzerOn"]|false)tone(BUZZER_PIN,1800);else noTone(BUZZER_PIN);
}
void drawStatus(float temperature,float humidity){
  if(!oledReady)return;
  display.clearDisplay();display.setTextColor(SSD1306_WHITE);display.setTextSize(1);display.setCursor(0,0);
  display.printf("LIFEBOX %s\nMODO: %s\nCENARIO: %s\n",WiFi.isConnected()?"ONLINE":"OFFLINE",backendMode.c_str(),backendScenario.c_str());
  display.printf("TEMP: %.1f C\nUMID: %.1f %%\nALERTA: %d",temperature,humidity,alertOutput?1:0);display.display();
}
bool beginRequest(HTTPClient& http,WiFiClientSecure& client,const String& path){
  if(WiFi.status()!=WL_CONNECTED)return false;
  client.setCACertBundle(rootca_crt_bundle_start,rootca_crt_bundle_end-rootca_crt_bundle_start);
  return http.begin(client,String(API_BASE_URL)+path);
}
void logGps(){
  Serial.printf("GPS chars=%lu location=%s speed=%s lat=%.6f lon=%.6f kmh=%.2f\n",gps.charsProcessed(),gps.location.isValid()?"VALID":"INVALID",gps.speed.isValid()?"VALID":"INVALID",gps.location.isValid()?gps.location.lat():0.0,gps.location.isValid()?gps.location.lng():0.0,gps.speed.isValid()?gps.speed.kmph():0.0);
}
void readBackendState(){
  WiFiClientSecure client;HTTPClient http;const String path=String("/api/iot/status?deviceId=")+DEVICE_ID;
  if(!beginRequest(http,client,path)){Serial.println("GET /api/iot/status -> HTTP BEGIN FAIL");return;}
  const int statusCode=http.GET();Serial.printf("GET /api/iot/status -> HTTP %d\n",statusCode);
  const String responseBody=http.getString();if(responseBody.length())Serial.println(responseBody);
  if(statusCode==HTTP_CODE_OK){JsonDocument response;if(deserializeJson(response,responseBody)==DeserializationError::Ok){
    backendMode=String((const char*)response["mode"]);backendMode.toUpperCase();backendScenario=String((const char*)response["scenario"]);backendScenario.toUpperCase();
    const int associatedId=response["transportId"]|0;if(associatedId>0)transportId=associatedId;applyDigitalSignal(response["digitalSignal"]);}}
  http.end();
}
void sendTelemetry(){
  const TempAndHumidity climate=dht.getTempAndHumidity();sensors_event_t acceleration,gyro,mpuTemperature;if(mpuReady)mpu.getEvent(&acceleration,&gyro,&mpuTemperature);
  logGps();const bool dhtValid=!isnan(climate.temperature)&&!isnan(climate.humidity);Serial.printf("DHT %s\n",dhtValid?"OK":"FAIL");
  if(!dhtValid||!mpuReady||!gps.location.isValid()||!gps.speed.isValid()||transportId<=0){
    Serial.printf("TELEMETRY BLOCKED dht=%d mpu=%d gpsLocation=%d gpsSpeed=%d transportId=%d\n",dhtValid,mpuReady,gps.location.isValid(),gps.speed.isValid(),transportId);return;}
  const float ax=acceleration.acceleration.x/SENSORS_GRAVITY_STANDARD,ay=acceleration.acceleration.y/SENSORS_GRAVITY_STANDARD,az=acceleration.acceleration.z/SENSORS_GRAVITY_STANDARD;
  const float resultant=sqrtf(ax*ax+ay*ay+az*az),impact=fabsf(resultant-1.0f);
  JsonDocument payload;payload["transporteId"]=transportId;payload["deviceId"]=DEVICE_ID;payload["temperatura"]=climate.temperature;payload["umidade"]=climate.humidity;
  payload["aceleracao"]=resultant;payload["aceleracaoX"]=ax;payload["aceleracaoY"]=ay;payload["aceleracaoZ"]=az;payload["impacto"]=impact;
  payload["latitude"]=gps.location.lat();payload["longitude"]=gps.location.lng();payload["velocidade"]=gps.speed.kmph();payload["bateria"]=readBatteryPercent();payload["sinal"]=readSignalPercent();payload["timestamp"]=String(millis());
  Serial.printf("WiFi RSSI %d dBm\n",WiFi.RSSI());String body;serializeJson(payload,body);WiFiClientSecure client;HTTPClient http;
  if(!beginRequest(http,client,"/api/telemetria")){Serial.println("POST /api/telemetria -> HTTP BEGIN FAIL");return;}
  http.addHeader("Content-Type","application/json");const int statusCode=http.POST(body);Serial.printf("POST /api/telemetria -> HTTP %d\n",statusCode);
  const String responseBody=http.getString();if(responseBody.length())Serial.println(responseBody);
  if(statusCode==HTTP_CODE_CREATED){JsonDocument response;if(deserializeJson(response,responseBody)==DeserializationError::Ok)applyDigitalSignal(response["digitalSignal"]);}
  http.end();drawStatus(climate.temperature,climate.humidity);
}
void setup(){
  Serial.begin(115200);Serial.println("BOOT LIFEBOX");pinMode(LED_PIN,OUTPUT);pinMode(BUZZER_PIN,OUTPUT);digitalWrite(LED_PIN,LOW);noTone(BUZZER_PIN);
  analogReadResolution(12);Wire.begin(21,22);scanI2c();oledReady=display.begin(SSD1306_SWITCHCAPVCC,0x3C);Serial.printf("OLED %s\n",oledReady?"OK":"FAIL");showBoot();
  dht.setup(DHT_PIN,DHTesp::DHT22);delay(1200);const TempAndHumidity initialClimate=dht.getTempAndHumidity();Serial.printf("DHT %s\n",(!isnan(initialClimate.temperature)&&!isnan(initialClimate.humidity))?"OK":"FAIL");
  mpuReady=mpu.begin();Serial.printf("MPU %s\n",mpuReady?"OK":"FAIL");if(mpuReady)mpu.setAccelerometerRange(MPU6050_RANGE_8_G);gpsSerial.begin(9600,SERIAL_8N1,GPS_RX_PIN,GPS_TX_PIN);
  WiFi.mode(WIFI_STA);WiFi.begin(WIFI_SSID,WIFI_PASSWORD,6);while(WiFi.status()!=WL_CONNECTED){delay(250);Serial.print('.');}
  Serial.printf("\nWiFi RSSI %d dBm\n",WiFi.RSSI());drawStatus(initialClimate.temperature,initialClimate.humidity);
}
void loop(){
  while(gpsSerial.available())gps.encode(gpsSerial.read());const uint32_t now=millis();
  if(now-lastStateAt>=STATE_INTERVAL_MS){lastStateAt=now;readBackendState();}
  if(now-lastTelemetryAt>=TELEMETRY_INTERVAL_MS){lastTelemetryAt=now;sendTelemetry();}
  delay(5);
}

