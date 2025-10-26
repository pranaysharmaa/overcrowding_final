import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const DELHI = { lat: 28.6139, lng: 77.2090 };
const containerStyle = { width: "100%", height: "100vh" };

const EXCLUDE_TYPES = new Set([
  "place_of_worship","temple","hindu_temple","church","mosque","synagogue","gurdwara","gurudwara",
]);

export default function MapView({ searchLocation }) {
  const [center, setCenter] = useState(DELHI);
  const [zoom, setZoom] = useState(12);
  const [places, setPlaces] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const { isLoaded, loadError } = useJsApiLoader({ id: "google-map-script", googleMapsApiKey: apiKey });

  const mapRef = useRef(null);
  const onLoad = (m) => (mapRef.current = m);
  const onUnmount = () => (mapRef.current = null);

  const iconFor = (pct) => {
    const base = "https://maps.google.com/mapfiles/ms/icons/";
    const color = pct > 20 ? "red" : pct < -20 ? "blue" : "orange";
    return `${base}${color}-dot.png`;
  };

  const baselineFor = (name) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return 60 + (h % 141);
  };

  useEffect(() => {
    if (!places.length) return;
    const id = setInterval(() => {
      setPlaces((prev) => prev.map((p) => ({ ...p, current: Math.round(p.regular * (0.75 + Math.random() * 0.5)) })));
      setActive((cur) => (cur ? { ...cur, current: Math.round(cur.regular * (0.75 + Math.random() * 0.5)) } : cur));
    }, 4500);
    return () => clearInterval(id);
  }, [places.length]);

  useEffect(() => { fetchCity("Delhi"); }, []); // eslint-disable-line
  useEffect(() => { if (searchLocation) fetchCity(searchLocation); }, [searchLocation]); // eslint-disable-line

  async function fetchCity(city) {
    setLoading(true); setMsg(""); setActive(null);
    try {
      const params = new URLSearchParams({ city, radius: "20000", limit: "50" });
      const url = `${backendUrl}/get_sites?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Backend ${res.status}`);
      const data = await res.json();

      const c = { lat: data.lat ?? data.latitude, lng: data.lng ?? data.lon };
      if (c.lat && c.lng) { setCenter(c); setZoom(12); mapRef.current?.panTo(c); }

      const normalized = (data.places || [])
        .map((p) => {
          const lat = p.lat ?? p.center?.lat ?? p.geometry?.location?.lat;
          const lng = p.lng ?? p.center?.lng ?? p.center?.lon ?? p.geometry?.location?.lng;
          return { name: p.name, lat, lng, address: p.address, place_id: p.place_id ?? p.id ?? `${lat},${lng}`, types: (p.types || []).map((t) => String(t).toLowerCase()) };
        })
        .filter((p) => p.lat && p.lng);

      const noWorship = normalized.filter((p) => !p.types.some((t) => EXCLUDE_TYPES.has(t)));

      const withCrowd = noWorship.map((p) => {
        const regular = baselineFor(p.name);
        const current = Math.round(regular * (0.9 + Math.random() * 0.4));
        return { ...p, regular, current };
      });

      setPlaces(withCrowd);
      if (!withCrowd.length) setMsg("No attractions found. Try another city.");
    } catch (e) {
      console.error(e);
      setMsg("Server is busy. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const mapOptions = useMemo(() => ({
    streetViewControl: false, mapTypeControl: false, fullscreenControl: true, clickableIcons: false,
  }), []);

  if (loadError) return <div className="w-full h-screen flex items-center justify-center text-red-600">Failed to load Google Maps JS.</div>;
  if (!isLoaded) return <div className="p-4">Loading map…</div>;

  return (
    <>
      {loading && <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[9998] bg-white/90 shadow px-3 py-1 rounded-md text-sm">Loading attractions…</div>}
      {msg && !loading && <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[9998] bg-white/95 shadow px-3 py-1 rounded-md text-sm">{msg}</div>}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onClick={() => setActive(null)}
      >
        {places.map((p) => {
          const deltaPct = Math.round(((p.current - p.regular) / p.regular) * 100);
          return (
            <Marker
              key={p.place_id}
              position={{ lat: p.lat, lng: p.lng }}
              icon={iconFor(deltaPct)}
              onClick={() => setActive(p)}
            />
          );
        })}

        {active && (
          <InfoWindow
            position={{ lat: active.lat, lng: active.lng }}
            onCloseClick={() => setActive(null)}
            options={{ disableAutoPan: true }}
          >
            <div className="text-sm">
              <div className="font-semibold">{active.name}</div>
              {active.address && <div className="text-gray-600">{active.address}</div>}
              <div className="mt-1">
                Regular: <b>{active.regular}</b> · Current: <b>{active.current}</b>{" "}
                (<b>{Math.round(((active.current - active.regular) / active.regular) * 100)}%</b>)
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </>
  );
}
