# WeatherSphere — Real-Time Weather Mobile Application

WeatherSphere is a production-grade, real-time meteorological mobile application engineered with **React, Vite, Tailwind CSS, Python Flask, MySQL, Leaflet, and Recharts**. It features live GPS detection, WMO meteorological interpretations, interactive weather radar overlays, hourly trend curves, 7-day and 14-day forecasts, severe weather alerts, favorite locations, JWT authentication, and PWA installation.

---

## 🚀 Key Features

1. **Live GPS Location, Network IP Auto-Detection & Instant Sharing**
   - Instant GPS coordinate acquisition on startup with seamless Network IP fallback.
   - Automatic reverse geocoding into city, state, and country.
   - **One-Tap Web Share API Integration**: Quick-share live weather summaries directly via native mobile sharing sheets (WhatsApp, Messages, Telegram, Twitter, AirDrop) with smart clipboard fallback.

2. **Global City Search, Autocomplete & Hands-Free Voice Search**
   - High-speed autocomplete dropdown with global and Indian city support (Hyderabad, Khammam, Vijayawada, Mumbai, Bengaluru, Delhi, etc.).
   - **Web Speech API Integration**: Tap the microphone icon in the header for hands-free voice commands (e.g., "Weather in Hyderabad", "Tokyo forecast", "Temperature in London") with real-time speech visualizer and automatic meteorological lookup.

3. **Real-Time Weather Metrics**
   - Temperature in °C / °F with high & low markers.
   - "Feels like" apparent temperature.
   - Humidity percentage with descriptive comfort levels.
   - Wind speed, gusts, and rotating compass needle.
   - Atmospheric pressure in hPa.
   - Visibility distance in kilometers.
   - UV Index with safety advisory guidelines.
   - Golden Sunrise & Sunset solar arc curve.
   - Cloud percentage and conditions.

4. **Interactive Weather Radar & Heatmaps**
   - Full Leaflet + OpenStreetMap engine.
   - Dynamic layers: Precipitation Radar, Temperature Heatmap, Cloud Cover, and Wind Speed.
   - GPS target locking and custom favorites pins.

5. **Dynamic Weather Atmosphere**
   - Animated visual effects adapting to weather: Sunny radiance, falling raindrops, thunderstorm lightning flashes, snowflakes, and starry night skies.

6. **Hourly & 7-Day / 14-Day Forecasts**
   - Horizontally scrollable 36-hour forecast cards.
   - Interactive Recharts temperature and precipitation probability area graphs.
   - Scaled gradient temperature range bars for weekly outlooks.

7. **Weather Alerts & Safety Advisories**
   - Automatic detection of severe conditions: Extreme Heat, Severe Thunderstorms, Heavy Rain Flooding, and High Winds.

8. **Favorites & User Accounts**
   - Save custom cities to MySQL / REST backend.
   - JWT authentication with secure password hashing (bcrypt).
   - Instant synchronization across devices.

9. **PWA Mobile App Experience**
   - Web App Manifest and Service Worker caching.
   - Installable on Android and iOS home screens as a native-feel application.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, Leaflet.
- **Backend Options:**
  - **Full-Stack Node/Express Engine:** Integrated `server.ts` with Vite middleware for instant zero-config live container execution.
  - **Standalone Python Flask Backend:** Modular Flask app in `backend/` with PyMySQL, PyJWT, Werkzeug, and Requests.
- **Database:** MySQL (schema in `database/schema.sql`).
- **APIs:** Open-Meteo High Resolution live meteorological API + OpenWeatherMap 2.5/3.0 API proxy.

---

## 📦 Project Structure

```
├── .env.example              # Environment variables template
├── database/
│   └── schema.sql            # MySQL schema with users, favorites, and settings tables
├── backend/                  # Python Flask REST API
│   ├── app/
│   │   ├── __init__.py       # Flask factory & CORS configuration
│   │   ├── config.py         # App configuration & environment loader
│   │   ├── routes/
│   │   │   ├── auth.py       # JWT registration & login
│   │   │   ├── weather.py    # Current weather, forecast, and geocoding
│   │   │   ├── favorites.py  # User favorites CRUD
│   │   │   └── settings.py   # User settings API
│   │   └── services/
│   │       └── weather_service.py # OpenWeather & Open-Meteo integration
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # Flask entry point
├── src/                      # React Frontend
│   ├── components/
│   │   ├── AuthModal.tsx
│   │   ├── BottomNavigation.tsx
│   │   ├── CurrentWeatherCard.tsx
│   │   ├── DailyForecast.tsx
│   │   ├── ErrorView.tsx
│   │   ├── FavoritesView.tsx
│   │   ├── ForecastView.tsx
│   │   ├── Header.tsx
│   │   ├── HourlyForecast.tsx
│   │   ├── SettingsView.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── WeatherAlertsBanner.tsx
│   │   ├── WeatherBackground.tsx
│   │   ├── WeatherIcon.tsx
│   │   └── WeatherMap.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── WeatherContext.tsx
│   ├── services/
│   │   └── api.ts
│   ├── utils/
│   │   └── weatherUtils.ts
│   ├── types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server.ts                 # Express full-stack server & Vite middleware
├── package.json
└── README.md
```

---

## ⚡ Quick Start Instructions

### 1. Running the Integrated React + Express Applet

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build for production
npm run build
npm start
```

### 2. Setting Up the Python + Flask Backend (Standalone)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### 4. Deploying to Vercel

The project includes pre-configured `vercel.json` and serverless API integration:

1. Push your repository to **GitHub** / **GitLab** / **Bitbucket**.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel will automatically detect the Vite build settings (`buildCommand`: `vite build`, `outputDirectory`: `dist`).
4. (Optional) Set any environment variables like `JWT_SECRET` in Vercel's Project Settings.
5. Click **Deploy**.

---

## 🔐 Environment Variables

Configure `.env` as needed:

```env
# Optional: OpenWeatherMap API Key (Open-Meteo is used by default if blank)
OPENWEATHER_API_KEY=""

# JWT Token Secret
JWT_SECRET="weathersphere-jwt-secret-key-2026"

# MySQL Database Settings (for Flask backend)
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="password"
MYSQL_DATABASE="weather_db"
```
