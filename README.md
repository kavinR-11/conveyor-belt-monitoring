# Industrial Conveyor Belt Monitoring System

An end-to-end industrial SCADA & Digital Twin platform for conveyor belts featuring **real-time hardware telemetry**, **machine learning defect classification (98.38% accuracy)**, and **Twilio SMS emergency escalation**.

---

## 🚀 Key Features

- **Live Digital Twin**: 3D & 2D dynamic conveyor visualizer showing real-time belt speed, load cells (Load Cell 1 / Load Cell 2), drive motor status, and tension.
- **ML Anomaly & Defect Detection**:
  - Supervised Random Forest Classifier trained on 328,000+ real operational records with **98.38% test accuracy**.
  - Detects **NORMAL**, **BELT MISALIGNMENT**, and **OBJECT/JAM DETECTED**.
  - Unsupervised Isolation Forest for unknown novel anomalies.
- **Automated SMS Emergency Alerts**: Real-time SMS dispatch via Twilio to plant admins and maintenance teams when critical defects or jams occur.
- **Raspberry Pi Telemetry Support**: Real hardware ingestion via HTTP REST (`/api/telemetry`) and MQTT.

---

## 🔌 Connecting Raspberry Pi to the Dashboard

## 🌐 System Architecture

```
[Physical Sensors]
  - Dual MPU6050 (Vibration Left & Right via I2C)
  - Dual HX711 (Load Cell 1 & 2 via GPIO)
  - INA219 (Motor Current / Power via I2C)
  - Optical IR & E-Stop
         │
         ▼ (I2C / GPIO)
  ┌──────────────┐
  │  ESP32 Node  │ (Runs firmware/esp32_sensor_node.ino)
  └──────┬───────┘
         │
         ▼ (MQTT over Wi-Fi, Topic: conveyor/cv-iron-01/telemetry)
  ┌──────────────┐
  │ Raspberry Pi │ (Runs Mosquitto Broker + firmware/rpi_mqtt_gateway.py)
  └──────┬───────┘
         │
         ▼ (HTTP POST /api/telemetry at 10 Hz)
  ┌──────────────┐
  │  PC Backend  │ (FastAPI + Random Forest 98.38% + Twilio SMS)
  └──────┬───────┘
         │
         ▼ (WebSocket real-time stream)
  ┌──────────────┐
  │ SCADA Dash   │ (React Digital Twin, Gauges, Anomaly Alerts)
  └──────────────┘
```

---

## 🔌 Sensor & Hardware Setup

### 1. ESP32 Sensor Wiring

Wire your physical sensors to the **ESP32** microcontroller:

| Component | Sensor Module | ESP32 GPIO Pin | Notes |
|---|---|---|---|
| **Vibration Left** | MPU6050 #1 | SDA: GPIO 21, SCL: GPIO 22 | AD0 pin to GND (`0x68`) |
| **Vibration Right** | MPU6050 #2 | SDA: GPIO 21, SCL: GPIO 22 | AD0 pin to 3.3V (`0x69`) |
| **Motor Current** | INA219 | SDA: GPIO 21, SCL: GPIO 22 | Default address (`0x40`) |
| **Load Cell 1 (Left)** | HX711 #1 | DT: GPIO 16, SCK: GPIO 4 | 5V & GND |
| **Load Cell 2 (Right)**| HX711 #2 | DT: GPIO 17, SCK: GPIO 18 | 5V & GND |
| **Left Tracking IR** | Optical Switch | Signal: GPIO 34 | Internal pull-up |
| **Right Tracking IR**| Optical Switch | Signal: GPIO 35 | Internal pull-up |
| **Emergency Stop** | E-Stop Button | Pin: GPIO 32 to GND | Active LOW |

Flash the firmware:
1. Open [`firmware/esp32_sensor_node/esp32_sensor_node.ino`](file:///c:/users/reach/conveyor-belt-monitoring/firmware/esp32_sensor_node/esp32_sensor_node.ino) in Arduino IDE.
2. Set your `WIFI_SSID`, `WIFI_PASSWORD`, and `MQTT_BROKER` (your Raspberry Pi's IP address).
3. Upload to your ESP32.

---

### 2. Raspberry Pi Setup (MQTT Broker + Gateway)

On your Raspberry Pi:

```bash
# 1. Install and start Mosquitto MQTT broker
sudo apt update
sudo apt install -y mosquitto mosquitto-clients python3-pip
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Allow external connections from ESP32:
sudo nano /etc/mosquitto/conf.d/local.conf
# Add these two lines:
#   listener 1883
#   allow_anonymous true
sudo systemctl restart mosquitto

# 2. Install gateway dependencies
pip3 install paho-mqtt

# 3. Run the gateway forwarder to your PC dashboard
# (Replace 192.168.1.3 with your PC's IP address)
python3 firmware/rpi_mqtt_gateway.py --dashboard http://192.168.1.3:8000
```

The Raspberry Pi will:
1. Receive telemetry published by the ESP32 over MQTT.
2. Forward it immediately via HTTP POST to the PC's FastAPI backend.
3. The dashboard digital twin and gauges update in real time at 10 Hz!
4. If the ML engine detects any fault or belt misalignment, an SMS is immediately sent to maintenance.

---

## 🖥️ Starting the Application Locally

### 1. Backend (FastAPI + ML + SMS)
```bash
cd backend
pip install -r requirements.txt

# Start backend server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Configure Twilio SMS credentials in `backend/.env`:
```ini
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
ALERT_PHONE_ADMIN=+91xxxxxxxxxx
ALERT_PHONE_MAINTENANCE=+91xxxxxxxxxx
```

### 2. Frontend Dashboard (React + Vite + Tailwind/Vanilla CSS)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧠 Retraining the ML Model
To retrain the Random Forest and Isolation Forest models on sensor datasets:
```bash
python ai/train_model.py
```
Outputs model binaries to `ai/models/`.
