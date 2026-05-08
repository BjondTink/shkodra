import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const monthsAl = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
];

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; condition: string }>({ temp: 12, condition: 'Kthjellët' });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=42.0683&longitude=19.5011&current=temperature_2m,weather_code"
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
    <div className="flex items-center gap-10">
      <div className="text-right">
        <div className="text-4xl font-mono leading-none tracking-tight tabular-nums font-black">
          {format(now, 'HH:mm')}<span className="text-brand-red animate-pulse">:</span>{format(now, 'ss')}
        </div>
        <div className="text-sm uppercase tracking-widest text-white/60 font-black mt-1">
          {albanianDate}
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-0 bg-white/10 px-6 py-3 rounded-xl border border-white/20 shadow-xl backdrop-blur-md">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Shkodër</span>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black">{weather.temp}°C</span>
          <span className="text-[10px] font-black uppercase text-brand-red rotate-90 origin-left translate-x-1 whitespace-nowrap">
            {weather.condition}
          </span>
        </div>
      </div>
    </div>
  );
}
