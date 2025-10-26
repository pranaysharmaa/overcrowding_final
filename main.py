# main.py — FastAPI backend using Google Geocoding + Places Nearby
# Mode: G2 (type=tourist_attraction + keyword search)
import os, time
from typing import List, Dict, Any, Optional

import requests
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("Set GOOGLE_API_KEY in environment (or .env)")

app = FastAPI(title="CrowdMap (Google Places)", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "CrowdMap/1.1 (server)"})


# ---------- Helpers ----------
def google_geocode(city: str) -> Dict[str, float]:
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": city, "key": GOOGLE_API_KEY}
    r = SESSION.get(url, params=params, timeout=20)
    r.raise_for_status()
    data = r.json()
    if data.get("status") != "OK" or not data.get("results"):
        raise HTTPException(status_code=404, detail=f"City not found: {city}")
    loc = data["results"][0]["geometry"]["location"]
    return {"lat": float(loc["lat"]), "lng": float(loc["lng"])}


EXCLUDE_TYPES = {
    "place_of_worship", "church", "mosque", "hindu_temple",
    "synagogue", "gurdwara", "gurudwara", "temple"
}

# keywords broaden coverage beyond just tourist_attraction
KW = "tourist OR museum OR monument OR gallery OR fort OR palace OR memorial OR heritage OR viewpoint"


def google_places_nearby(
    lat: float,
    lng: float,
    radius: int,
    limit: int = 50,
    type_: str = "tourist_attraction",
    keyword: Optional[str] = KW,
) -> List[Dict[str, Any]]:
    """
    Pages through Google Places Nearby (20 per page) until `limit` or no more pages.
    Filters out worship places. Returns normalized items: name, lat, lng, address, place_id, types, rating info.
    """
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    collected: List[Dict[str, Any]] = []
    seen = set()

    params = {
        "location": f"{lat},{lng}",
        "radius": str(radius),
        "type": type_,
        "key": GOOGLE_API_KEY,
    }
    if keyword:
        params["keyword"] = keyword

    page = 0
    while True:
        r = SESSION.get(url, params=params, timeout=20)
        r.raise_for_status()
        data = r.json()
        status = data.get("status")

        if status not in ("OK", "ZERO_RESULTS"):
            # Common: OVER_QUERY_LIMIT, REQUEST_DENIED, INVALID_REQUEST
            raise HTTPException(status_code=502, detail=f"Google Places error: {status}")

        for p in data.get("results", []):
            place_id = p.get("place_id")
            if place_id in seen:
                continue
            seen.add(place_id)

            types = [t.lower() for t in p.get("types", [])]
            if any(t in EXCLUDE_TYPES for t in types):
                continue

            geom = p.get("geometry", {}).get("location", {})
            plat, plng = geom.get("lat"), geom.get("lng")
            if plat is None or plng is None:
                continue

            collected.append({
                "name": p.get("name"),
                "lat": float(plat),
                "lng": float(plng),
                "address": p.get("vicinity") or p.get("formatted_address"),
                "place_id": place_id,
                "types": types,
                "rating": p.get("rating"),
                "user_ratings_total": p.get("user_ratings_total"),
            })
            if len(collected) >= limit:
                break

        if len(collected) >= limit:
            break

        next_token = data.get("next_page_token")
        if not next_token:
            break

        # Google needs ~2s before next_page_token is valid
        time.sleep(2.0)
        params = {"pagetoken": next_token, "key": GOOGLE_API_KEY}
        page += 1
        if page >= 2:  # 3 pages max (20 * 3 = 60)
            break

    # Rank popular-first: (user_ratings_total, rating)
    collected.sort(
        key=lambda x: ((x.get("user_ratings_total") or 0), (x.get("rating") or 0.0)),
        reverse=True,
    )
    return collected[:limit]


# ---------- Endpoints ----------
@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/ping")
def ping():
    return {"ok": True, "service": "google-places"}

@app.get("/geocode")
def geocode(city: str = Query(..., description="City name, e.g. 'Delhi'")):
    return google_geocode(city)

@app.get("/places")
def places(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(20000, ge=100, le=50000),
    limit: int = Query(50, ge=10, le=60),
):
    items = google_places_nearby(lat, lng, radius, limit=limit)
    return {"results": items}

@app.get("/get_sites")
def get_sites(
    city: str = Query(...),
    radius: int = Query(20000, ge=100, le=50000),
    limit: int = Query(50, ge=10, le=60),
):
    coords = google_geocode(city)
    items = google_places_nearby(coords["lat"], coords["lng"], radius, limit=limit)
    return {"city": city, "lat": coords["lat"], "lng": coords["lng"], "places": items}
