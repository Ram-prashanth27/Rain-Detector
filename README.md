# Rain Detection Dashboard – Clothes‑Shelter Automation

A web dashboard that integrates weather forecast data and a microcontroller sensor (ESP32) to help automate and secure outdoor clothes‑shelter operations when rain or high‑humidity conditions are detected.

## 🚀 Features

* Live weather at your location (temperature, rain chance)
* Hourly forecast with actionable safety tips: e.g., “Carry umbrella if rain chance > 40%”, “Avoid drying clothes if humidity > 80%”
* Visual prompt to “Move to Shelter” when rain/humidity thresholds are crossed
* Integration with an ESP32 sensor (for local humidity/rain detection) – shows connection status
* Button/link to live satellite weather data for broader context
* Clean, mobile‑friendly dashboard (hosted via Firebase/Netlify/whatever you used)

## 🔍 Why this exists

Many households use clotheslines outside. But unexpected rain or high humidity can spoil the drying process, damage clothes, or even waste energy if you use a powered dryer. This project automates awareness of those conditions and helps you respond proactively — e.g., retracting awnings, pulling clothes in, or cancelling a dryer cycle.

## 🧩 Architecture & Tech Stack

* Front‑end: HTML + CSS + JavaScript (or React/Vue if used)
* Weather Data: Leveraging a public API (e.g., OpenWeatherMap, WeatherAPI) to fetch live weather & hourly forecast
* Microcontroller: ESP32 used as a local sensor to detect shelter/humidity/rain status (connected to WiFi and pushing data via MQTT/HTTP)
* Hosting: Deployed to Firebase Hosting (or whichever you used) at the URL above
* Optional: Satellite imagery data linked via a separate external provider
* Threshold logic: e.g., rain chance > 40 %, humidity > 80 % triggers alerts

## 🖥️ Getting Started

### Prerequisites

* Node.js and npm/yarn (if using a build system)
* An API key for the weather service provider (e.g., OpenWeatherMap)
* ESP32 board + sensor (rain/humidity) with WiFi credentials

### Installation

```bash
git clone https://github.com/your‑username/your‑repo.git
cd your‑repo
npm install      # or yarn
```

## 🧪 ESP32 Side Setup

* Use Arduino IDE or PlatformIO
* Connect a rain sensor or capacitive soil/humidity sensor to ESP32
* Connect the ESP32 to WiFi and program it to send periodic data (e.g., humidity, rain detection) via HTTP POST or MQTT
* On the dashboard side, the front‑end polls or subscribes to the ESP32 endpoint and updates UI accordingly.

## ✅ Usage

* Open the dashboard in your browser or mobile device
* The dashboard fetches your local weather and shows current temperature + rain chances
* The “CLOTHES SHELTER” section shows the ESP32 connection status and prompts to “Move to Shelter” when thresholds are exceeded
* Hourly forecast tab shows next few hours and safety‑tips
* “Check Satellite Weather Data” button opens a detailed satellite view for deeper insight

## 💡 Tips & Ideas for Extension

* Add push notifications (via Service Workers) when the “Move to Shelter” alert triggers
* Integrate a motorised clothesline with ESP32 to automatically retract the shelter
* Store historical data (rain/humidity) in a database (e.g., Firebase Firestore) and visualise trends
* Add user‑customisable thresholds from the UI
* Multilingual support for non‑English users
* UX: Add progressive‑web‑app support so you can install the dashboard as an app

## 🛠️ Libraries & Dependencies

* React
* Axios (for HTTP requests)
* A weather‑API SDK 
* custom styling

## 🎓 Credits & Acknowledgements

* Weather data provided by [Weather API ]
* Satellite imagery by [satellite data]
* Inspired by smart home & IoT automation use‑cases (thanks to open community)
* Built by ** Ram Prashanth S ** 
