import requests
import datetime
from app.config import Config

class WeatherService:
    @staticmethod
    def get_weather_by_coords(lat, lon, units='metric'):
        # If user has OpenWeatherMap API Key, use it
        if Config.OPENWEATHER_API_KEY:
            try:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units={units}&appid={Config.OPENWEATHER_API_KEY}"
                resp = requests.get(url, timeout=6)
                if resp.status_code == 200:
                    data = resp.json()
                    return data
            except Exception as e:
                print("OpenWeatherMap fetch failed, falling back to Open-Meteo:", e)

        # Fallback to Open-Meteo (ultra-fast, no key required, highly accurate)
        url = (
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m"
            f"&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,surface_pressure,visibility,wind_speed_10m,uv_index"
            f"&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max"
            f"&timezone=auto"
        )
        resp = requests.get(url, timeout=8)
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    def search_cities(query):
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={query}&count=10&language=en&format=json"
        resp = requests.get(url, timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            return data.get('results', [])
        return []

    @staticmethod
    def reverse_geocode(lat, lon):
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&zoom=10"
            headers = {'User-Agent': 'WeatherSphere-App/1.0'}
            resp = requests.get(url, headers=headers, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                address = data.get('address', {})
                city = address.get('city') or address.get('town') or address.get('village') or address.get('county') or address.get('state_district') or 'Current Location'
                state = address.get('state', '')
                country = address.get('country', '')
                return {
                    'city': city,
                    'state': state,
                    'country': country,
                    'display_name': data.get('display_name', f"{city}, {country}")
                }
        except Exception:
            pass
        return {'city': 'Current Location', 'state': '', 'country': '', 'display_name': 'Current Location'}
