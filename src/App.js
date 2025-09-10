import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});

  function convertToFlag(countryCode) {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }

  useEffect(function(){
    if(location.length >= 3){
      fetchWeather();
    }else{
      setDisplayLocation("");
      setWeather({});
    }
  },[location]);

  

  async function fetchWeather(){
    try {
      // 1) Getting location (geocoding)
      setIsLoading(true);
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results) return;

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
        setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      setWeather({weather: weatherData.daily});
      setIsLoading(false);
    } catch (err) {
      console.err(err);
    }
  }


  return (
    <div className="app">
      <h1>MSH Daily Forcast</h1>
      <div>
        <input type="text" onChange={(e)=>setLocation(e.target.value)} placeholder="Location" />
      </div>
      {/* <button onClick={()=>fetchWeather()}>Get weather</button> */}
      {isLoading ? ( <p className="loader">Loading...</p> ) : (
        <WeatherDetails displayLocation={displayLocation} weather={weather}  />
      )
      }


    </div>
  );
}

function WeatherDetails({ displayLocation, weather }) {
  if (!weather || !weather.weather) {
    return null;
  }

  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather.weather;

  return (
    <div>
      <h2>{displayLocation} Weather Details</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            key={date}
            isToday = {i === 0}
          />
        ))}
      </ul>
    </div>
  );
}




function Day({ date, max, min, code, isToday }) {
  function formatDay(dateStr) {
    return new Intl.DateTimeFormat("en", {
      weekday: "short", // e.g. Mon, Tue
    }).format(new Date(dateStr));
  }

  function getWeatherIcon(wmoCode) {
    const icons = new Map([
      [[0], "☀️"],
      [[1], "🌤"],
      [[2], "⛅️"],
      [[3], "☁️"],
      [[45, 48], "🌫"],
      [[51, 56, 61, 66, 80], "🌦"],
      [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
      [[71, 73, 75, 77, 85, 86], "🌨"],
      [[95], "🌩"],
      [[96, 99], "⛈"],
    ]);
    const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
    if (!arr) return "NOT FOUND";
    return icons.get(arr);
  }

  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? 'Today' : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; {Math.ceil(max)}&deg;
      </p>
    </li>
  );
}


export default App;
