export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    isDay: boolean;
  };
  hourly: {
    time: string[];
    temp: number[];
    weatherCode: number[];
  };
  daily: {
    time: string[];
    tempMax: number[];
    tempMin: number[];
    weatherCode: number[];
    sunrise: string[];
    sunset: string[];
  };
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  alerts: { title: string; description: string; severity: 'warning' | 'critical' }[];
}

export interface LocationSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    const data = await res.json();
    
    if (!res.ok) {
      console.error("Geocoding API error:", data);
      return [];
    }
    
    if (!data.results) {
      return [];
    }

    return data.results.map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country,
      admin1: item.admin1
    }));
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
}

export async function getWeatherData(lat: number, lon: number, locationName: string, country: string): Promise<WeatherData | null> {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);
    const data = await res.json();

    if (!res.ok) {
      console.error("API error:", data);
      return null;
    }

    const alerts: { title: string; description: string; severity: 'warning' | 'critical' }[] = [];
    const code = data.current.weather_code;
    const temp = data.current.temperature_2m;
    
    // Open-Meteo WMO codes
    if (code >= 95) {
      alerts.push({ title: "Thunderstorm Warning", description: "Severe thunderstorms detected in your area.", severity: "critical" });
    } else if (code >= 71 && code <= 77) {
      alerts.push({ title: "Snow Alert", description: "Snowfall expected. Drive carefully.", severity: "warning" });
    } else if (code >= 61 && code <= 67) {
      alerts.push({ title: "Heavy Rain", description: "Heavy rainfall may cause localized flooding.", severity: "warning" });
    } else if (temp > 35) {
      alerts.push({ title: "Heat Advisory", description: "Extremely high temperatures detected.", severity: "warning" });
    } else if (temp < 0) {
      alerts.push({ title: "Freeze Warning", description: "Freezing temperatures detected.", severity: "warning" });
    }

    return {
      current: {
        temp: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
      },
      hourly: {
        time: data.hourly.time.slice(0, 24),
        temp: data.hourly.temperature_2m.slice(0, 24),
        weatherCode: data.hourly.weather_code.slice(0, 24),
      },
      daily: {
        time: data.daily.time.slice(0, 7),
        tempMax: data.daily.temperature_2m_max.slice(0, 7),
        tempMin: data.daily.temperature_2m_min.slice(0, 7),
        weatherCode: data.daily.weather_code.slice(0, 7),
        sunrise: data.daily.sunrise.slice(0, 7),
        sunset: data.daily.sunset.slice(0, 7),
      },
      location: {
        name: locationName,
        country: country,
        lat,
        lon,
      },
      alerts,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<{ name: string; country: string }> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    
    if (!res.ok) {
      console.error("Reverse geocoding API error:", data);
      return { name: "Unknown Location", country: "" };
    }

    if (data && data.address) {
      const name = data.address.city || data.address.town || data.address.village || data.address.suburb || "Unknown Location";
      return { name, country: data.address.country || "" };
    }
    return { name: "Unknown Location", country: "" };
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return { name: "Current Location", country: "" };
  }
}
