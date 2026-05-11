import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  Snowflake, 
  CloudLightning, 
  SunDim,
  LucideIcon
} from 'lucide-react';

const monthsAl = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
];

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; condition: string; code: number }>({ 
    temp: 12, 
    condition: 'Kthjellët',
    code: 0
  });

  const weatherIconMap: Record<number, LucideIcon> = {
    0: Sun, 1: SunDim, 2: CloudSun, 3: Cloud,
    45: CloudFog, 48: CloudFog, 51: CloudDrizzle, 53: CloudDrizzle, 55: CloudDrizzle,
    61: CloudRain, 63: CloudRain, 65: CloudRain, 71: Snowflake, 73: Snowflake, 75: Snowflake,
    80: CloudRain, 81: CloudRain, 82: CloudRain, 95: CloudLightning,
  };

  const WeatherIcon = weatherIconMap[weather.code] || Cloud;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Tiranë coordinates
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=41.3275&longitude=19.8187&current=temperature_2m,weather_code"
        );
        const json = await res.json();
        const temp = Math.round(json.current.temperature_2m);
        const code = json.current.weather_code;
        
        const weatherMap: Record<number, string> = {
          0: "Kthjellët", 1: "Kthjellët", 2: "Me re", 3: "Vrenjtur",
          45: "Mjegull", 48: "Mjegull", 51: "Drizë", 53: "Drizë", 55: "Drizë",
          61: "Shi", 63: "Shi", 65: "Shi i dendur", 71: "Borë", 73: "Borë", 75: "Borë",
          80: "Rrebesh", 81: "Rrebesh", 82: "Rrebesh", 95: "Stuhi",
        };

        setWeather({
          temp,
          code,
          condition: weatherMap[code] || "I pastër"
        });
      } catch (e) {
        console.error("Weather fetch error in clock widget:", e);
      }
    };

    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 600000);
    return () => clearInterval(weatherTimer);
  }, []);

  const monthIdx = now.getMonth();
  const day = now.getDate();
  const year = now.getFullYear();
  const albanianDate = `${day} ${monthsAl[monthIdx]} ${year}`.toUpperCase();

  return (
    <div className="flex items-center gap-10 drop-shadow-2xl">
      <div className="text-right flex flex-col gap-0 border-b-2 border-brand-red pb-1">
        <div className="text-6xl font-black tabular-nums tracking-tighter leading-none flex items-center justify-end">
          {format(now, 'HH:mm')}
          <span className="text-brand-red animate-pulse mx-1">:</span>
          <span className="text-4xl opacity-50">{format(now, 'ss')}</span>
        </div>
        <div className="text-2xl uppercase tracking-[0.2em] text-white font-black mt-1">
          {albanianDate}
        </div>
      </div>
      
      <div className="flex items-center gap-6 bg-black/40 px-8 py-5 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red/10 blur-[40px] pointer-events-none" />
        
        <div className="flex flex-col items-start gap-1 relative z-10">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Tiranë</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tabular-nums">{weather.temp}</span>
            <span className="text-xl font-black text-brand-red">°C</span>
          </div>
        </div>
        
        <div className="h-10 w-px bg-white/10 relative z-10" />
        
        <div className="flex flex-col items-center gap-2 relative z-10">
          <WeatherIcon size={32} className="text-brand-red drop-shadow-[0_0_15px_rgba(204,0,0,0.4)]" strokeWidth={2.5} />
          <span className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">
            {weather.condition}
          </span>
        </div>
      </div>
    </div>
  );
}
