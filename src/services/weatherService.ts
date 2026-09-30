/**
 * Real-time Weather & Climate Disaster Preparedness Service
 * Uses Open-Meteo public meteorological APIs (No API key required, high reliability)
 */

export interface LiveWeatherData {
  latitude: number;
  longitude: number;
  city: string;
  state?: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed: number;
  windGusts: number;
  surfacePressure: number;
  uvIndex: number;
  timestamp: string;
  isDay: boolean;
  hourly: {
    time: string[];
    temperature: number[];
    precipitationProbability: number[];
    rain: number[];
  };
  daily: {
    time: string[];
    tempMax: number[];
    tempMin: number[];
    precipitationSum: number[];
    uvIndexMax: number[];
    weatherCode: number[];
  };
  disasterAssessment: {
    floodRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
    heatRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
    stormRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
    primaryWarning: string | null;
    actionAdvice: string;
  };
}

// WMO Weather interpretation codes (WW)
const WMO_CODE_MAP: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy cloudburst rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent torrential rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export const weatherService = {
  async fetchLiveWeather(lat: number, lng: number, cityName?: string): Promise<LiveWeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,rain&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max&timezone=auto&forecast_days=3`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather API responded with status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const weatherCode = current.weather_code || 0;
    const weatherDescription = WMO_CODE_MAP[weatherCode] || 'Partly cloudy';
    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const rainNow = current.rain || 0;
    const windSpeed = Math.round(current.wind_speed_10m || 0);
    const windGusts = Math.round(current.wind_gusts_10m || 0);
    const uvMax = Math.round(daily.uv_index_max?.[0] || 6);
    const pressure = Math.round(current.surface_pressure || 1010);

    // Compute Disaster Risk Assessment
    let floodRisk: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
    let heatRisk: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
    let stormRisk: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
    let primaryWarning: string | null = null;
    let actionAdvice = 'Normal weather conditions. Standard civic precautions apply.';

    // Flood & Cloudburst analysis
    const rainSumToday = daily.precipitation_sum?.[0] || 0;
    if (rainNow >= 15 || rainSumToday >= 65 || weatherCode === 82 || weatherCode === 65) {
      floodRisk = 'Critical';
      primaryWarning = 'CLOUDBURST / SEVERE WATERLOGGING RISK DETECTED';
      actionAdvice = 'Heavy deluge in progress. Avoid all road underpasses and subway crossings. Move to higher ground.';
    } else if (rainNow >= 5 || rainSumToday >= 30 || weatherCode === 95 || weatherCode === 96) {
      floodRisk = 'High';
      primaryWarning = 'HEAVY RAINFALL & THUNDERSTORM ADVISORY';
      actionAdvice = 'Expect urban road ponding and traffic snarls. Keep emergency lights charged.';
    } else if (rainNow > 0 || rainSumToday >= 10) {
      floodRisk = 'Moderate';
      actionAdvice = 'Wet road conditions. Exercise caution at intersections.';
    }

    // Heatwave analysis
    if (temp >= 42 || feelsLike >= 45) {
      heatRisk = 'Severe';
      primaryWarning = primaryWarning || 'SEVERE HEATWAVE (LOO) RED ALERT';
      actionAdvice = 'High risk of heatstroke and severe dehydration. Stay in shaded/cooled areas. Drink electrolyte ORS fluids.';
    } else if (temp >= 38 || feelsLike >= 40 || uvMax >= 9) {
      heatRisk = 'High';
      primaryWarning = primaryWarning || 'HIGH UV & HEAT STRESS WARNING';
      actionAdvice = 'Avoid direct sun between 11 AM and 3 PM. Cover head with wet cotton cloth.';
    } else if (temp >= 34) {
      heatRisk = 'Moderate';
    }

    // Gale & Storm analysis
    if (windGusts >= 65 || (weatherCode >= 95 && windSpeed >= 40)) {
      stormRisk = 'Severe';
      primaryWarning = primaryWarning || 'SQUALL & VIOLENT WIND GUST WARNING';
      actionAdvice = 'Secure loose rooftop sheets and hoardings. Keep away from old trees and high-voltage transmission lines.';
    } else if (windGusts >= 40 || weatherCode === 95) {
      stormRisk = 'High';
    } else if (windSpeed >= 25) {
      stormRisk = 'Moderate';
    }

    // Try reverse geocoding if cityName not provided
    let resolvedCity = cityName || 'Local GPS Area';
    if (!cityName) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          resolvedCity = geoData.locality || geoData.city || geoData.principalSubdivision || 'Local GPS Area';
        }
      } catch {
        // Fallback gracefully without throwing
        resolvedCity = `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`;
      }
    }

    return {
      latitude: lat,
      longitude: lng,
      city: resolvedCity,
      temperature: temp,
      apparentTemperature: feelsLike,
      humidity: Math.round(current.relative_humidity_2m || 50),
      precipitation: current.precipitation || 0,
      rain: rainNow,
      weatherCode,
      weatherDescription,
      windSpeed,
      windGusts,
      surfacePressure: pressure,
      uvIndex: uvMax,
      timestamp: current.time,
      isDay: current.is_day === 1,
      hourly: {
        time: hourly.time.slice(0, 12),
        temperature: hourly.temperature_2m.slice(0, 12).map((t: number) => Math.round(t)),
        precipitationProbability: hourly.precipitation_probability.slice(0, 12),
        rain: hourly.rain.slice(0, 12),
      },
      daily: {
        time: daily.time,
        tempMax: daily.temperature_2m_max.map((t: number) => Math.round(t)),
        tempMin: daily.temperature_2m_min.map((t: number) => Math.round(t)),
        precipitationSum: daily.precipitation_sum,
        uvIndexMax: daily.uv_index_max,
        weatherCode: daily.weather_code,
      },
      disasterAssessment: {
        floodRisk,
        heatRisk,
        stormRisk,
        primaryWarning,
        actionAdvice,
      },
    };
  },
};
