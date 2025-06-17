import React, { useState, useEffect } from 'react';

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY; // Replace with your OpenWeatherMap API key
  const CITY = 'Grenada, GD';

  useEffect(() => {
    if (!API_KEY) {
      setError("OpenWeatherMap API key is not set. Please set REACT_APP_OPENWEATHER_API_KEY in your .env file.");
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [API_KEY]);

  if (loading) {
    return <div style={{ color: 'white', padding: '10px', borderRadius: '8px' }}>Loading weather...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '10px', borderRadius: '8px' }}>Error: {error}</div>;
  }

  if (!weatherData) {
    return <div style={{ color: 'white', padding: '10px', borderRadius: '8px' }}>No weather data available.</div>;
  }

  const temperature = Math.round(weatherData.main.temp);
  const description = weatherData.weather[0].description;
  const iconCode = weatherData.weather[0].icon;
  const iconUrl = `http://openweathermap.org/img/wn/${iconCode}.png`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      borderRadius: '8px',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <img
        src={iconUrl}
        alt={description}
        style={{ width: '50px', height: '50px', marginRight: '10px' }}
      />
      <div>
        <div style={{ fontSize: '20px', fontWeight: 'semibold' }}>{temperature}°C</div>
        <div style={{ fontSize: '16px', textTransform: 'capitalize', color: '#cccccc' }}>{description}</div>
      </div>
    </div>
  );
};

export default Weather; 