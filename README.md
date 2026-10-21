# Pune EV ChargeMap ⚡🗺️

A modern, full-stack EV Charging Station Directory & GIS Availability Map for Pune, Maharashtra. Built with **Node.js**, **Express.js**, **MongoDB**, **Leaflet.js**, and **OpenStreetMap**.

---

## 🚀 Key Features

1. **Realistic Pune EV Network (Demo Data):**
   - Pre-seeded with 10 real-world EV charging hubs across major Pune localities: **Hinjawadi**, **Wakad**, **Baner**, **Kothrud**, **Viman Nagar**, **Hadapsar**, **Magarpatta**, **Shivajinagar**, **Koregaon Park**, and **Aundh**.
   - Includes real GPS coordinates, charger types (CCS2, Type 2, CHAdeMO, GB/T), speeds (kW), port availability, and pricing (₹/kWh).
   - Demo records are clearly tagged with a `DEMO` badge in the UI.

2. **Full CRUD Operator Controls:**
   - **Add Charging Station:** Complete form for station owners/operators with validation.
   - **Interactive GIS Location Picker:** Click **"📍 Pick on Map"** to click anywhere on the OpenStreetMap canvas and auto-populate precise latitude and longitude.
   - **Edit Station:** Real-time updates to pricing, status, capacity, or location.
   - **Delete Station:** Modal confirmation with instant map & database synchronization.

3. **Leaflet.js & OpenStreetMap GIS Integration:**
   - Real interactive cartography centered on Pune (`18.5204° N, 73.8567° E`).
   - Dynamic HTML pin markers colored by real-time status:
     - 🟢 **Green**: Port(s) free now
     - 🟠 **Amber**: Short wait / high occupancy
     - 🔴 **Red**: Fully occupied
     - ⚪ **Gray**: Under maintenance or offline
   - User GPS location detection (`Locate Me`) and distance calculation using the Haversine formula.

4. **Dynamic Dashboard KPIs:**
   - Dynamic metrics computed directly from MongoDB:
     - **Total Stations**
     - **Available Chargers**
     - **Fast Chargers (≥ 50 kW)**
     - **Occupied / Busy Chargers**

5. **Driver Tools & Simulation:**
   - EV Model selector (Tata Nexon EV, MG ZS EV, Mahindra XUV400, Tata Tiago EV, Nissan Leaf) with battery capacity and connector compatibility.
   - Real-time battery range estimator and DC fast charging cost calculator.
   - Queue joining, 15-minute port holding, slot reservations, and live charging session simulation.

---

## 📁 Project Structure

```
EV_Supply/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Mongoose connection
│   ├── controllers/
│   │   └── stationController.js  # CRUD handlers, Haversine distance, and KPI metrics
│   ├── middleware/
│   │   └── errorHandler.js       # Centralized error handling
│   ├── models/
│   │   └── Station.js            # Mongoose schema with 2dsphere GeoJSON index
│   ├── routes/
│   │   └── stationRoutes.js      # Express API routes
│   ├── seed/
│   │   ├── seedData.js           # 10 realistic Pune EV stations
│   │   └── seed.js               # Standalone database seeder script
│   └── server.js                 # Express server & static file serving
├── frontend/
│   ├── css/
│   │   └── style.css             # Design system tokens, Leaflet styling & layout
│   ├── js/
│   │   ├── api.js                # REST API client
│   │   ├── map.js                # Leaflet map manager & location picker
│   │   └── app.js                # UI state, event dispatcher & simulation
│   └── index.html                # Upgraded web application
├── ChargeQ.html                  # Root reference application
├── .env                          # Local environment variables (configured)
├── .env.example                  # Environment template
├── package.json                  # Scripts & dependencies
└── README.md                     # Documentation
```

---

## 🛠️ Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local Community Server running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

---

## ⚡ Quick Start Guide

### 1. Clone & Install Dependencies

```bash
cd EV_Supply
npm install
```

### 2. Configure Environment Variables

The project includes `.env` and `.env.example`. Review or edit `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/pune_ev_chargemap
CORS_ORIGIN=*
```

> **MongoDB Tip**: If using MongoDB Atlas, replace `MONGODB_URI` with your cloud connection string:
> `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pune_ev_chargemap?retryWrites=true&w=majority`

### 3. Seed Database with Pune Stations

Run the seeder to populate realistic demo records:

```bash
npm run seed
```

*(Note: The server will also automatically seed these 10 demo records if the database collection is empty on startup!)*

### 4. Start the Application

```bash
npm start
```

Open your browser at:
👉 **`http://localhost:5000`**

---

## 📡 REST API Documentation

### Base URL: `/api/stations`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stations` | List stations with search (`q`), filter (`status`, `connectorType`, `minKw`, `onlyAvailable`), and sorting (`near`, `price`, `power`, `name`). Computes distance from `userLat`/`userLng`. |
| `GET` | `/api/stations/stats/dashboard` | Dynamically returns total stations, available, fast, and occupied chargers from MongoDB. |
| `GET` | `/api/stations/:id` | Fetch details of a single station by MongoDB ObjectId. |
| `POST` | `/api/stations` | Create a new charging station with validation. |
| `PUT` | `/api/stations/:id` | Update an existing charging station. |
| `DELETE` | `/api/stations/:id` | Delete a charging station by ID. |
| `POST` | `/api/stations/seed` | Reset and re-seed official demo records. |

### Sample POST Request (`/api/stations`)

```json
{
  "name": "VoltHub Baner High Street",
  "area": "Baner",
  "address": "Balewadi High Street Link Road, Baner, Pune 411045",
  "latitude": 18.5590,
  "longitude": 73.7868,
  "connectorTypes": ["CCS2", "Type 2"],
  "chargingSpeed": 150,
  "totalChargers": 5,
  "availableChargers": 2,
  "pricePerKwh": 20.0,
  "status": "Operational",
  "amenities": ["Café", "Restroom", "Wi-Fi"]
}
```

---

## 🧪 Testing the Workflow

1. **View GIS Map**: Open `http://localhost:5000`. You will see all 10 stations mapped across Pune with status-coded badges.
2. **Select on Map / List**: Click on any marker or card (e.g. *VoltHub Hinjewadi*) to slide open the Station Details drawer.
3. **Add Station with Map Pin**:
   - Click the top right **"+ Add Station"** button.
   - Click **"📍 Pick on Map"**.
   - Click anywhere on the map to set coordinates automatically.
   - Fill in the station name, price, connectors, and click **Save Station to Database**.
   - The station is persisted to MongoDB and immediately appears on both the map and list!
4. **Edit & Delete**: Click **Edit** or **Delete** on any station to update or remove it from MongoDB.
