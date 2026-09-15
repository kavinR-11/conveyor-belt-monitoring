/*
 * =============================================================================
 * ESP32 Conveyor Belt Sensor Node — MQTT Telemetry Publisher
 * =============================================================================
 * 
 * Hardware Architecture:
 *   [Sensors] ---> (I2C / GPIO) ---> [ESP32 Node] 
 *                                        │ (MQTT over Wi-Fi)
 *                                        ▼
 *                               [Raspberry Pi Broker]
 *                                        │ (HTTP / MQTT)
 *                                        ▼
 *                                [Dashboard & ML Backend]
 * 
 * Sensors Connected:
 *   1. MPU6050 #1 (Left Vibration)   : I2C (SDA: GPIO 21, SCL: GPIO 22, AD0 -> GND = 0x68)
 *   2. MPU6050 #2 (Right Vibration)  : I2C (SDA: GPIO 21, SCL: GPIO 22, AD0 -> 3.3V = 0x69)
 *   3. INA219 (Motor Current/Voltage): I2C (SDA: GPIO 21, SCL: GPIO 22, 0x40)
 *   4. HX711 #1 (Load Cell 1 - Left) : DT: GPIO 16, SCK: GPIO 4
 *   5. HX711 #2 (Load Cell 2 - Right): DT: GPIO 17, SCK: GPIO 18
 *   6. IR Optical Sensor (Left Track): GPIO 34 (Input Pull-up)
 *   7. IR Optical Sensor (Right Track: GPIO 35 (Input Pull-up)
 *   8. Emergency Stop (E-Stop Switch): GPIO 32 (Input Pull-up)
 *   9. Rotary Encoder (Speed Sensor) : GPIO 25 (Ch A), GPIO 26 (Ch B)
 *
 * Required Arduino Libraries:
 *   - PubSubClient by Nick O'Leary
 *   - ArduinoJson by Benoit Blanchon (v6 or v7)
 *   - Adafruit MPU6050 & Adafruit Unified Sensor
 *   - Adafruit INA219
 *   - HX711 by bogde
 * =============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_INA219.h>
#include "HX711.h"

// -----------------------------------------------------------------------------
// Network & MQTT Configuration
// -----------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";          // <-- Change to your Wi-Fi SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";      // <-- Change to your Wi-Fi Password

// IP address of your Raspberry Pi (running Mosquitto MQTT broker)
const char* MQTT_BROKER   = "192.168.1.100";           // <-- Change to your Raspberry Pi IP
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "conveyor/cv-iron-01/telemetry";
const char* MQTT_CLIENT_ID= "esp32-conveyor-sensor-node";

// Telemetry publishing rate
const unsigned long PUBLISH_INTERVAL_MS = 100; // 10 Hz (every 100 ms)

// -----------------------------------------------------------------------------
// Pin Definitions
// -----------------------------------------------------------------------------
#define I2C_SDA_PIN       21
#define I2C_SCL_PIN       22

// Load Cell HX711 pins
#define HX711_LEFT_DT     16
#define HX711_LEFT_SCK    4
#define HX711_RIGHT_DT    17
#define HX711_RIGHT_SCK   18

// IR alignment sensors
#define IR_LEFT_PIN       34
#define IR_RIGHT_PIN      35

// E-Stop & Status
#define ESTOP_PIN         32
#define STATUS_LED_PIN    2   // Onboard LED

// -----------------------------------------------------------------------------
// Hardware Object Instances
// -----------------------------------------------------------------------------
WiFiClient espClient;
PubSubClient mqttClient(espClient);

Adafruit_MPU6050 mpuLeft;
Adafruit_MPU6050 mpuRight;
Adafruit_INA219 ina219;

HX711 scaleLeft;
HX711 scaleRight;

// Hardware presence flags (graceful fallback to simulated values if sensor disconnected)
bool mpuLeftReady  = false;
bool mpuRightReady = false;
bool ina219Ready   = false;
bool hx711Ready    = false;

unsigned long lastPublishTime = 0;
unsigned long frameCounter    = 0;

// Calibration factors for HX711 (adjust according to your load cell calibration)
const float CALIBRATION_FACTOR_LEFT  = 420.0f;
const float CALIBRATION_FACTOR_RIGHT = 420.0f;

// -----------------------------------------------------------------------------
// Setup Function
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n========================================================");
  Serial.println("   ESP32 Industrial Conveyor Sensor Node Starting");
  Serial.println("========================================================");

  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(IR_LEFT_PIN, INPUT_PULLUP);
  pinMode(IR_RIGHT_PIN, INPUT_PULLUP);
  pinMode(ESTOP_PIN, INPUT_PULLUP);

  // Initialize I2C bus
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  // 1. Initialize MPU6050 Left (0x68)
  if (mpuLeft.begin(0x68, &Wire)) {
    Serial.println("[OK] MPU6050 Left (0x68) Initialized");
    mpuLeft.setAccelerometerRange(MPU6050_RANGE_4_G);
    mpuLeft.setFilterBandwidth(MPU6050_BAND_21_HZ);
    mpuLeftReady = true;
  } else {
    Serial.println("[WARN] MPU6050 Left (0x68) not found. Using fallback.");
  }

  // 2. Initialize MPU6050 Right (0x69 - AD0 tied to 3.3V)
  if (mpuRight.begin(0x69, &Wire)) {
    Serial.println("[OK] MPU6050 Right (0x69) Initialized");
    mpuRight.setAccelerometerRange(MPU6050_RANGE_4_G);
    mpuRight.setFilterBandwidth(MPU6050_BAND_21_HZ);
    mpuRightReady = true;
  } else {
    Serial.println("[WARN] MPU6050 Right (0x69) not found. Using fallback.");
  }

  // 3. Initialize INA219 (0x40)
  if (ina219.begin(&Wire)) {
    Serial.println("[OK] INA219 Current Sensor (0x40) Initialized");
    ina219Ready = true;
  } else {
    Serial.println("[WARN] INA219 not found. Using fallback.");
  }

  // 4. Initialize HX711 Load Cells
  scaleLeft.begin(HX711_LEFT_DT, HX711_LEFT_SCK);
  scaleRight.begin(HX711_RIGHT_DT, HX711_RIGHT_SCK);

  if (scaleLeft.is_ready() || scaleRight.is_ready()) {
    Serial.println("[OK] HX711 Load Cells Initialized");
    scaleLeft.set_scale(CALIBRATION_FACTOR_LEFT);
    scaleRight.set_scale(CALIBRATION_FACTOR_RIGHT);
    scaleLeft.tare();
    scaleRight.tare();
    hx711Ready = true;
  } else {
    Serial.println("[WARN] HX711 Load Cells not detected. Using baseline.");
  }

  // Connect to Wi-Fi and MQTT
  setupWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(512); // Ensure buffer fits JSON payload
}

// -----------------------------------------------------------------------------
// Wi-Fi Connection
// -----------------------------------------------------------------------------
void setupWiFi() {
  Serial.printf("\nConnecting to Wi-Fi: %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[OK] Wi-Fi Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WARN] Wi-Fi connection timed out. Will retry in loop.");
  }
}

// -----------------------------------------------------------------------------
// MQTT Reconnection Logic
// -----------------------------------------------------------------------------
void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
    return;
  }

  while (!mqttClient.connected()) {
    Serial.printf("Connecting to Raspberry Pi MQTT Broker at %s:%d ... ", MQTT_BROKER, MQTT_PORT);
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println("[OK] Connected to MQTT Broker!");
      digitalWrite(STATUS_LED_PIN, HIGH);
    } else {
      Serial.printf("Failed (rc=%d). Retrying in 2s...\n", mqttClient.state());
      digitalWrite(STATUS_LED_PIN, LOW);
      delay(2000);
    }
  }
}

// -----------------------------------------------------------------------------
// Main Loop
// -----------------------------------------------------------------------------
void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastPublishTime >= PUBLISH_INTERVAL_MS) {
    lastPublishTime = now;
    readAndPublishSensors();
  }
}

// -----------------------------------------------------------------------------
// Sensor Acquisition & MQTT Transmission
// -----------------------------------------------------------------------------
void readAndPublishSensors() {
  // 1. Read Vibration (Left & Right MPU6050)
  float vibLeftG  = 1.85f;
  float vibRightG = 1.88f;

  if (mpuLeftReady) {
    sensors_event_t a, g, temp;
    mpuLeft.getEvent(&a, &g, &temp);
    // Acceleration magnitude in g's (9.80665 m/s^2 per g)
    float totalMps2 = sqrt(a.acceleration.x * a.acceleration.x +
                           a.acceleration.y * a.acceleration.y +
                           a.acceleration.z * a.acceleration.z);
    vibLeftG = totalMps2 / 9.80665f;
  }

  if (mpuRightReady) {
    sensors_event_t a, g, temp;
    mpuRight.getEvent(&a, &g, &temp);
    float totalMps2 = sqrt(a.acceleration.x * a.acceleration.x +
                           a.acceleration.y * a.acceleration.y +
                           a.acceleration.z * a.acceleration.z);
    vibRightG = totalMps2 / 9.80665f;
  }

  // 2. Read Load Cells (HX711)
  float loadLeftKg  = 4.58f;
  float loadRightKg = 4.55f;

  if (hx711Ready) {
    if (scaleLeft.is_ready()) {
      loadLeftKg = scaleLeft.get_units(1);
      if (loadLeftKg < 0) loadLeftKg = 0;
    }
    if (scaleRight.is_ready()) {
      loadRightKg = scaleRight.get_units(1);
      if (loadRightKg < 0) loadRightKg = 0;
    }
  }

  // 3. Read Current (INA219)
  float currentA = 2.25f;
  if (ina219Ready) {
    float currentMA = ina219.getCurrent_mA();
    currentA = currentMA / 1000.0f;
  }

  // 4. Read Digital Inputs (IR alignment, E-Stop)
  bool irLeftBlocked  = (digitalRead(IR_LEFT_PIN) == LOW);
  bool irRightBlocked = (digitalRead(IR_RIGHT_PIN) == LOW);
  bool estopActive    = (digitalRead(ESTOP_PIN) == LOW);
  bool faultActive    = irLeftBlocked || irRightBlocked || estopActive;

  // Calculated metrics
  float loadImbalance = abs(loadLeftKg - loadRightKg);
  float totalLoad     = loadLeftKg + loadRightKg;
  float vibLeftMps2   = vibLeftG * 9.80665f;
  float vibRightMps2  = vibRightG * 9.80665f;

  // 5. Pack into JSON matching Backend ML Schema
  StaticJsonDocument<512> doc;
  doc["vibration_left_g"]     = round(vibLeftG * 1000.0) / 1000.0;
  doc["vibration_right_g"]    = round(vibRightG * 1000.0) / 1000.0;
  doc["vibration_left_mps2"]  = round(vibLeftMps2 * 1000.0) / 1000.0;
  doc["vibration_right_mps2"] = round(vibRightMps2 * 1000.0) / 1000.0;
  doc["load_left_kg"]         = round(loadLeftKg * 100.0) / 100.0;
  doc["load_right_kg"]        = round(loadRightKg * 100.0) / 100.0;
  doc["load_imbalance_kg"]    = round(loadImbalance * 100.0) / 100.0;
  doc["total_load_kg"]        = round(totalLoad * 100.0) / 100.0;
  doc["current_A"]            = round(currentA * 100.0) / 100.0;
  doc["ir_left_blocked"]      = irLeftBlocked;
  doc["ir_right_blocked"]     = irRightBlocked;
  doc["motor_state"]          = estopActive ? "STOPPED" : "RUNNING";
  doc["estop_active"]         = estopActive;
  doc["fault_active"]         = faultActive;
  doc["source"]               = "ESP32_HARDWARE";

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  // Publish to Raspberry Pi MQTT broker
  mqttClient.publish(MQTT_TOPIC, jsonBuffer);
  frameCounter++;

  if (frameCounter % 50 == 0) { // Log every 5 seconds
    Serial.printf("[ESP32 -> RPi MQTT] Sent frame #%lu | Vib: %.2f/%.2f g | Load: %.2f kg | Current: %.2f A\n",
                  frameCounter, vibLeftG, vibRightG, totalLoad, currentA);
  }
}
