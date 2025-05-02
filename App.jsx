import { useState } from "react";
import SearchBar from "./components/SearchBar";
import MapView from "./components/MapView";

function App() {
  const [searchLocation, setSearchLocation] = useState("");

  return (
    <>
      <SearchBar onSearch={setSearchLocation} />
      <MapView searchLocation={searchLocation} />
    </>
  );
}

export default App;
