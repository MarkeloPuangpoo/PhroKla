import { useEffect, useState } from "react";

export function WeatherWidget({ lat, lng, apiKey }: { lat: number; lng: number; apiKey: string }) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lng || !apiKey) return;
    setLoading(true);
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=th`)
      .then(res => res.json())
      .then(data => {
        setWeather(data);
        setLoading(false);
      })
      .catch(err => {
        setError("โหลดข้อมูลอากาศล้มเหลว");
        setLoading(false);
      });
  }, [lat, lng, apiKey]);

  if (loading) return <div className="text-xs text-muted-foreground">กำลังโหลดอากาศ...</div>;
  if (error) return <div className="text-xs text-destructive">{error}</div>;
  if (!weather || weather.cod !== 200) return <div className="text-xs text-destructive">ไม่พบข้อมูลอากาศ</div>;

  return (
    <div className="flex items-center gap-2 text-xs bg-blue-50 rounded px-2 py-1">
      {weather.weather?.[0]?.icon && (
        <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt="icon" className="w-8 h-8" />
      )}
      <div>
        <div className="font-bold text-sm">{weather.name}</div>
        <div>{weather.weather?.[0]?.description}</div>
        <div className="font-semibold">{Math.round(weather.main.temp)}°C</div>
      </div>
    </div>
  );
} 