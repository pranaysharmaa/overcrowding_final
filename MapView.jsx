import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const TouristMap = () => {
  const [location, setLocation] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [searchCity, setSearchCity] = useState('');
  const [center, setCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi
  const [activeMarker, setActiveMarker] = useState(null);

  const apiKey = 'AIzaSyAXmvaBxiaKg13JfxlE5MQzg6ZGnCMAEU8';
  const backendUrl = 'https://google-cloud-run-backend-860426078333.us-central1.run.app';

  const mapContainerStyle = {
    width: '100vw',
    height: '100vh',
  };

  const getColor = (percentDiff) => {
    const baseUrl = "http://maps.google.com/mapfiles/ms/icons/";
    const suffix = `?v=${Date.now()}`; // cache-busting to force icon refresh
    if (percentDiff > 20) return `${baseUrl}red-dot.png${suffix}`;
    if (percentDiff >= -20 && percentDiff <= 20) return `${baseUrl}orange-dot.png${suffix}`;
    return `${baseUrl}blue-dot.png${suffix}`;
  };

  const generateCrowdData = (regular) => {
    const current = Math.floor(regular * (0.7 + Math.random() * 0.6)); // 70%-130% of regular
    const percentDiff = (((current - regular) / regular) * 100).toFixed(1);
    const color = getColor(percentDiff);
    return { regular, current, percentDiff, color };
  };

  const fetchTouristSites = async (lat, lng) => {
    try {
      const res = await fetch(`${backendUrl}/places?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      const enriched = (data.results || []).map((place) => {
        const regular = Math.floor(Math.random() * 1000) + 100;
        return {
          ...place,
          crowd: generateCrowdData(regular),
        };
      });
      setMarkers(enriched);
    } catch (err) {
      console.error('Error fetching tourist places:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchCity) return;
    try {
      const res = await fetch(`${backendUrl}/geocode?city=${searchCity}`);
      const data = await res.json();
      if (data.lat && data.lng) {
        setCenter({ lat: data.lat, lng: data.lng });
        fetchTouristSites(data.lat, data.lng);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setCenter({ lat: latitude, lng: longitude });
        fetchTouristSites(latitude, longitude);
      },
      () => {
        console.warn('Geolocation failed, using default location.');
        fetchTouristSites(center.lat, center.lng);
      }
    );
  }, []);

  // Fluctuate crowd data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkers((prevMarkers) =>
        prevMarkers.map((marker) => ({
          ...marker,
          crowd: generateCrowdData(marker.crowd.regular),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 100,
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0px 0px 10px rgba(0,0,0,0.2)',
      }}>
        <input
          type="text"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          placeholder="Search City"
          style={{ padding: '8px', width: '200px' }}
        />
        <button onClick={handleSearch} style={{ padding: '8px', marginLeft: '5px' }}>
          Search
        </button>
      </div>

      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={12}
        >
          {markers.map((place, idx) => (
            <Marker
              key={idx}
              position={{
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
              }}
              icon={place.crowd.color}
              onMouseOver={() => setActiveMarker(idx)}
              onMouseOut={() => setActiveMarker(null)}
            >
              {activeMarker === idx && (
                <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                  <div>
                    <strong>{place.name}</strong><br />
                    Regular Crowd: {place.crowd.regular}<br />
                    Current Crowd: {place.crowd.current}<br />
                    {place.crowd.percentDiff >= 0 ? '+' : ''}{place.crowd.percentDiff}% from avg
                  </div>
                </InfoWindow>
              )}
            </Marker>
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default TouristMap;
