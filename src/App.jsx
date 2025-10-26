import { useState } from "react";
import MapView from "./MapView";
import SearchBar from "./SearchBar";
import "./index.css";

export default function App() {
  const [query, setQuery] = useState("");

  return (
    <div className="w-full h-screen overflow-hidden">
      {/* FIXED TOP-LEFT SEARCH BAR (container) */}
      <div id="searchbar-container">
        <SearchBar onSearch={(val) => setQuery(val)} />
      </div>

      {/* MAP BELOW */}
      <MapView searchLocation={query} />
    </div>
  );
}
