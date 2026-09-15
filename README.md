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

You can stream real sensor data from your Raspberry Pi directly into the dashboard.

### 1. Hardware Connections (Raspberry Pi Pinout)

| Component | Sensor | Raspberry Pi Pins | Interface |
|---|---|---|---|
| **Vibration Left** | MPU6050 | SDA (GPIO 2), SCL (GPIO 3), VCC (3.3V), GND, AD0 -> GND (`0x68`) | I2C |
| **Vibration Right** | MPU6050 | SDA (GPIO 2), SCL (GPIO 3), VCC (3.3V), GND, AD0 -> 3.3V (`0x69`) | I2C |
| **Current / Voltage** | INA219 | SDA (GPIO 2), SCL (GPIO 3), VCC (3.3V/5V), GND (`0x40`) | I2C |
| **Load Cell Left** | HX711 | DT -> GPIO 5, SCK -> GPIO 6, VCC (5V), GND | GPIO |
| **Load Cell Right** | HX711 | DT -> GPIO 13, SCK -> GPIO 19, VCC (5V), GND | GPIO |
| **IR Alignment Left** | Optical Beam | Signal -> GPIO 17, VCC (5V), GND | GPIO |
| **IR Alignment Right**| Optical Beam | Signal -> GPIO 27, VCC (5V), GND | GPIO |
| **Emergency Stop** | E-Stop Button | Switch -> GPIO 24 to GND (internal pull-up) | GPIO |
| **Rotary Encoder** | Speed Sensor | Channel A -> GPIO 22, Channel B -> GPIO 23 | GPIO |

---

### 2. Raspberry Pi Software Setup

On your Raspberry Pi:

```bash
# 1. Enable I2C on Raspberry Pi
sudo raspi-config
# Navigate to: Interface Options -> I2C -> Enable -> Finish

# 2. Install Python sensor packages
sudo apt-get update
sudo apt-get install -y python3-pip python3-smbus i2c-tools
pip3 install paho-mqtt smbus2 RPi.GPIO hx711 adafruit-circuitpython-ina219
```

---

### 3. Running Telemetry Ingestion

Find the local IP address of the PC running the dashboard (e.g. `192.168.1.50` via `ipconfig` on Windows).

#### Option A: Direct HTTP Streaming (Recommended — No Broker Needed)
Run on Raspberry Pi:
```bash
python3 firmware/rpi_sensor_publisher.py --http http://192.168.1.50:8000
```

#### Option B: Simulated Hardware (Testing Without Physical Sensors)
If sensors are not yet wired up, you can test the full pipeline using simulated physics:
```bash
python3 firmware/rpi_sensor_publisher.py --simulate --http http://192.168.1.50:8000
```

#### Option C: MQTT Streaming
If using the included Mosquitto broker:
```bash
python3 firmware/rpi_sensor_publisher.py --use-mqtt --broker 192.168.1.50 --port 1883
```

When live telemetry frames arrive from the Raspberry Pi:
1. The backend immediately marks the hardware as **LIVE**.
2. Real-time ML inference runs on every sensor frame.
3. If an anomaly or defect occurs, an SMS alert is sent to maintenance.
4. The dashboard gauges and digital twin reflect the physical conveyor state in real time!

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
