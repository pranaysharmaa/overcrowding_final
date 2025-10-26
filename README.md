# *CrowdMap – Real-Time Tourist Crowd View*

A React + FastAPI app that lets you search a city and view nearby tourist attractions on a Google Map. Each place shows a simulated live crowd level.
Back end uses Google Geocoding + Places Nearby (no hardcoding), front end uses Google Maps JavaScript API.

# *Features*

Search by city (Delhi, Agra, …)

Map centers on the city; markers for top attractions

Click a marker for “regular vs. current” crowd (simulated)

Worship places excluded (temple/church/mosque)

Clean, fixed Google-Maps style search bar (top-left)

# *Repo Structure*

<img width="678" height="1014" alt="image" src="https://github.com/user-attachments/assets/01ac991c-5f14-41ec-97f2-81e4d2018aed" />




# *Prerequisites*

Node.js ≥ 18

Python ≥ 3.10

A Google Cloud project with:

Geocoding API enabled

Places API enabled

Maps JavaScript API enabled

Two API keys:

Server key for backend (GOOGLE_API_KEY)

Browser key for frontend (VITE_GOOGLE_MAPS_API_KEY)

Git (optional)

# *1) Backend Setup (Python venv)*

From the repo root:

Create & activate virtual environment

python3 -m venv .venv

THEN

FOR *macOS/Linux:*

source .venv/bin/activate

FOR *Windows (PowerShell):*

.\.venv\Scripts\Activate.ps1


# Install backend deps
pip install -r requirements.txt

# Backend .env

Create a file named .env in the repo root:

ENTER THIS IN THE FILE :

GOOGLE_API_KEY=YOUR_SERVER_SIDE_GOOGLE_PLACES_API_KEY

# Run the backend with uvicorn (hot reload)

uvicorn main:app --reload --port 8010

YOU CAN Open docs: http://127.0.0.1:8010/docs TO CHECK

# 2) Frontend Setup (Vite + React + Tailwind)

If package.json already exists, just install:

npm install


If you need to create it (fresh machine), run:

npm init -y

npm install react react-dom @vitejs/plugin-react

npm install -D vite tailwindcss postcss autoprefixer

npx tailwindcss init -p



Use this package.json snippet (merge if you already have one):

<img width="562" height="858" alt="image" src="https://github.com/user-attachments/assets/476c843c-ec4e-4d26-81a2-b15815b99194" />


Tailwind glue (already in repo, but for reference):

postcss.config.cjs

tailwind.config.cjs

src/index.css includes:

@tailwind base;

@tailwind components;

@tailwind utilities;

html, body, #root { height:100%; margin:0; padding:0; }

# Frontend .env (Vite)

Create /.env (or .env.local) next to package.json:

ENTER THE Backend URL IN THE FILE :

VITE_BACKEND_URL=http://127.0.0.1:8010

# Browser (Maps JS) key – this one is safe to expose in frontend

VITE_GOOGLE_MAPS_API_KEY=YOUR_BROWSER_GOOGLE_MAPS_JS_KEY

GOOGLE_API_KEY= AIzaSyBnwEoESL5TFF1v3QCOsu-WcjYsqcRkLpU

Keys must start with VITE_ to be available to the frontend.

Run the frontend

npm install 

npm run dev


Then open the URL Vite prints (usually http://localhost:5173


