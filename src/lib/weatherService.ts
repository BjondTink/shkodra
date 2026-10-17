// Weather and Currency service for Albanian TV broadcast
interface CityConfig {
  name: string;
  lat: number;
  lon: number;
}

export const ALBANIAN_CITIES: CityConfig[] = [
  { name: "Tiranë", lat: 41.3275, lon: 19.8187 },
  { name: "Shkodër", lat: 42.0683, lon: 19.5011 },
  { name: "Durrës", lat: 41.3236, lon: 19.4559 },
  { name: "Vlorë", lat: 40.4661, lon: 19.4897 },
  { name: "Elbasan", lat: 41.1125, lon: 20.0822 },
  { name: "Korçë", lat: 40.6159, lon: 20.7778 },
  { name: "Fier", lat: 40.7239, lon: 19.5561 },
  { name: "Gjirokastër", lat: 40.0758, lon: 20.1389 },
  { name: "Sarandë", lat: 39.8755, lon: 20.0056 },
  { name: "Lezhë", lat: 41.7836, lon: 19.6425 },
  { name: "Berat", lat: 40.7058, lon: 19.9522 },
  { name: "Kukës", lat: 42.0767, lon: 20.42 },
  { name: "Prishtinë", lat: 42.6629, lon: 21.1655 },
  { name: "Prizren", lat: 42.2139, lon: 20.7397 }
];

export const WEATHER_CONDITIONS: Record<number, string> = {
  0: "Kthjellët",
  1: "Kthjellët",
  2: "Me re",
  3: "Vrenjtur",
  45: "Mjegull",
  48: "Mjegull",
  51: "Drizë",
  53: "Drizë",
  55: "Drizë",
  61: "Shi",
  63: "Shi",
  65: "Shi i dendur",
  71: "Borë",
  73: "Borë",
  75: "Borë",
  80: "Rrebesh",
  81: "Rrebesh",
  82: "Rrebesh",
  95: "Stuhi"
};

export interface CityWeatherData {
  name: string;
  temp: number;
  code: number;
  condition: string;
}

export interface TickerResponse {
  weather: CityWeatherData[];
  rates: string[];
  lastUpdated: string;
}

// In-memory cache
let weatherCache: { timestamp: number; data: CityWeatherData[] } | null = null;
let ratesCache: { timestamp: number; data: string[] } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Fallback data in case external APIs are unreachable
const FALLBACK_WEATHER: CityWeatherData[] = [
  { name: "Tiranë", temp: 16, code: 0, condition: "Kthjellët" },
  { name: "Shkodër", temp: 15, code: 1, condition: "Kthjellët" },
  { name: "Durrës", temp: 17, code: 0, condition: "Kthjellët" },
  { name: "Vlorë", temp: 18, code: 0, condition: "Kthjellët" },
  { name: "Elbasan", temp: 16, code: 1, condition: "Kthjellët" },
  { name: "Korçë", temp: 12, code: 2, condition: "Me re" },
  { name: "Fier", temp: 17, code: 0, condition: "Kthjellët" },
  { name: "Gjirokastër", temp: 16, code: 1, condition: "Kthjellët" },
  { name: "Sarandë", temp: 19, code: 0, condition: "Kthjellët" },
  { name: "Lezhë", temp: 15, code: 1, condition: "Kthjellët" },
  { name: "Berat", temp: 17, code: 0, condition: "Kthjellët" },
  { name: "Kukës", temp: 11, code: 2, condition: "Me re" },
  { name: "Prishtinë", temp: 13, code: 1, condition: "Kthjellët" },
  { name: "Prizren", temp: 14, code: 1, condition: "Kthjellët" }
];

const FALLBACK_RATES: string[] = [
  "EUR/LEK: 100.25",
  "USD/LEK: 92.40",
  "CHF/LEK: 104.20",
  "GBP/LEK: 118.50",
  "Kursi Zyrtar (LEK)"
];

export async function fetchAlbanianWeather(): Promise<CityWeatherData[]> {
  const now = Date.now();
  if (weatherCache && (now - weatherCache.timestamp < CACHE_TTL_MS)) {
    return weatherCache.data;
  }

  try {
    const lats = ALBANIAN_CITIES.map(c => c.lat).join(",");
    const lons = ALBANIAN_CITIES.map(c => c.lon).join(",");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "AlbanianBroadcastApp/1.0" }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const json = await res.json();
    let data: CityWeatherData[] = [];

    if (Array.isArray(json)) {
      data = json.map((entry: any, idx: number) => {
        const city = ALBANIAN_CITIES[idx];
        const temp = Math.round(entry.current?.temperature_2m ?? 15);
        const code = entry.current?.weather_code ?? 0;
        return {
          name: city.name,
          temp,
          code,
          condition: WEATHER_CONDITIONS[code] || "Kthjellët"
        };
      });
    } else if (json.current) {
      // Single city response
      const temp = Math.round(json.current.temperature_2m);
      const code = json.current.weather_code;
      data = [{
        name: ALBANIAN_CITIES[0].name,
        temp,
        code,
        condition: WEATHER_CONDITIONS[code] || "Kthjellët"
      }];
    }

    if (data.length > 0) {
      weatherCache = { timestamp: now, data };
      return data;
    }
  } catch (err: any) {
    // If cache exists even if expired, use it; otherwise use static fallback
    if (weatherCache) {
      return weatherCache.data;
    }
  }

  return FALLBACK_WEATHER;
}

export async function fetchExchangeRates(): Promise<string[]> {
  const now = Date.now();
  if (ratesCache && (now - ratesCache.timestamp < CACHE_TTL_MS * 2)) {
    return ratesCache.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://open.er-api.com/v6/latest/ALL", {
      signal: controller.signal,
      headers: { "User-Agent": "AlbanianBroadcastApp/1.0" }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.result === "success" && data.rates) {
        const rates = data.rates;
        const getPriceInLek = (code: string) => {
          const rate = rates[code];
          if (!rate) return "--";
          return (1 / rate).toFixed(2);
        };

        const ratesList = [
          `EUR/LEK: ${getPriceInLek('EUR')}`,
          `USD/LEK: ${getPriceInLek('USD')}`,
          `CHF/LEK: ${getPriceInLek('CHF')}`,
          `GBP/LEK: ${getPriceInLek('GBP')}`,
          `Kursi Zyrtar (LEK)`
        ];

        ratesCache = { timestamp: now, data: ratesList };
        return ratesList;
      }
    }
  } catch (err: any) {
    if (ratesCache) {
      return ratesCache.data;
    }
  }

  return FALLBACK_RATES;
}

export async function getTickerData(): Promise<TickerResponse> {
  const [weather, rates] = await Promise.all([
    fetchAlbanianWeather(),
    fetchExchangeRates()
  ]);

  return {
    weather,
    rates,
    lastUpdated: new Date().toISOString()
  };
}
