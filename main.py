# backend/main.py

from fastapi import FastAPI, Query
import requests
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("AIzaSyBxKo5zXAnRc4nR0KBt0Fhf5nNpE1XqPuI")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/get_sites")
def get_tourist_sites(city: str = Query(...)):
    # Step 1: Get lat/lon of city
    geo_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={city}&key={GOOGLE_API_KEY}"
    geo_res = requests.get(geo_url).json()
    
    if not geo_res['results']:
        return {"error": "City not found"}
    
    location = geo_res['results'][0]['geometry']['location']
    lat, lon = location['lat'], location['lng']

    # Step 2: Nearby search for tourist places
    radius = 150000  # in meters
    place_types = "tourist_attraction|museum|hindu_temple|church|mosque|park|zoo|amusement_park|art_gallery"
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lon}&radius={radius}&type=point_of_interest&keyword=tourist&key={GOOGLE_API_KEY}"
    
    res = requests.get(url)
    data = res.json()

    results = []
    for place in data.get("results", []):
        results.append({
            "name": place.get("name"),
            "lat": place["geometry"]["location"]["lat"],
            "lon": place["geometry"]["location"]["lng"],
            "address": place.get("vicinity"),
            "place_id": place.get("place_id")
        })

    return {"city": city, "lat": lat, "lon": lon, "places": results}
