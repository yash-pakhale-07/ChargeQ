/**
 * Pune EV ChargeMap - Application Logic & State Controller
 * Upgraded Full-Stack Architecture with Leaflet GIS & MongoDB Persistence
 */

(function () {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  // Supported EV models with battery capacity, charging speeds, connectors & ranges
  const VEHICLES = [
    {
      id: 'nexon',
      name: 'Tata Nexon EV',
      kwh: 40.5,
      dc: 60,
      ac: 7.2,
      conn: ['CCS2', 'Type 2'],
      maxRange: 325,
      description: 'Tata Nexon EV (Long Range) · 40.5 kWh battery · 60 kW DC CCS2 fast charging.',
    },
    {
      id: 'tiago',
      name: 'Tata Tiago EV',
      kwh: 24.0,
      dc: 25,
      ac: 7.2,
      conn: ['CCS2', 'Type 2'],
      maxRange: 215,
      description: 'Tata Tiago EV (Long Range) · 24.0 kWh battery · 25 kW DC CCS2 fast charging.',
    },
    {
      id: 'zs',
      name: 'MG ZS EV',
      kwh: 50.3,
      dc: 76,
      ac: 11.0,
      conn: ['CCS2', 'Type 2'],
      maxRange: 340,
      description: 'MG ZS EV · 50.3 kWh battery · 76 kW DC CCS2 high-speed fast charging.',
    },
    {
      id: 'comet',
      name: 'MG Comet EV',
      kwh: 17.3,
      dc: 0,
      ac: 7.4,
      conn: ['Type 2'],
      maxRange: 160,
      description: 'MG Comet EV · 17.3 kWh battery · Type 2 AC fast charging (no DC port).',
    },
    {
      id: 'xuv400',
      name: 'Mahindra XUV400',
      kwh: 39.4,
      dc: 50,
      ac: 7.2,
      conn: ['CCS2', 'Type 2'],
      maxRange: 300,
      description: 'Mahindra XUV400 EL Pro · 39.4 kWh battery · 50 kW DC CCS2 fast charging.',
    },
    {
      id: 'kona',
      name: 'Hyundai Kona Electric',
      kwh: 39.2,
      dc: 50,
      ac: 7.2,
      conn: ['CCS2', 'Type 2'],
      maxRange: 310,
      description: 'Hyundai Kona Electric · 39.2 kWh battery · 50 kW DC CCS2 fast charging.',
    },
    {
      id: 'atto3',
      name: 'BYD Atto 3',
      kwh: 60.5,
      dc: 80,
      ac: 11.0,
      conn: ['CCS2', 'Type 2'],
      maxRange: 420,
      description: 'BYD Atto 3 Blade Battery · 60.5 kWh battery · 80 kW DC CCS2 ultra-fast charging.',
    },
  ];

  // Guaranteed fallback demo stations in Pune if backend/MongoDB is offline
  const DEFAULT_DEMO_STATIONS = [
    {
      _id: 'demo-hinj',
      name: 'VoltHub Hinjewadi Phase 1',
      short: 'Hinjewadi',
      address: 'Plot 28, Rajiv Gandhi Infotech Park, Hinjawadi Phase 1, Pune, Maharashtra 411057',
      area: 'Hinjewadi',
      latitude: 18.5913,
      longitude: 73.7389,
      connectorTypes: ['CCS2', 'Type 2', 'CHAdeMO'],
      chargingSpeed: 120,
      totalChargers: 6,
      availableChargers: 3,
      occupiedChargers: 2,
      pricePerKwh: 19.0,
      idleFeePerMin: 2.0,
      status: 'Operational',
      amenities: ['Café', 'Restroom', 'Covered bays', '24/7 Security', 'Wi-Fi'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 120, st: 'busy', rem: 22 },
        { id: 2, type: 'CCS2', kw: 60, st: 'busy', rem: 9 },
        { id: 3, type: 'CCS2', kw: 60, st: 'free', rem: 0 },
        { id: 4, type: 'Type 2', kw: 22, st: 'free', rem: 0 },
        { id: 5, type: 'Type 2', kw: 22, st: 'free', rem: 0 },
        { id: 6, type: 'CHAdeMO', kw: 50, st: 'off', rem: 0 },
      ],
    },
    {
      _id: 'demo-wakad',
      name: 'GridPoint Wakad Expressway Hub',
      short: 'Wakad',
      address: 'Near Datta Mandir Road & Mumbai-Bangalore Highway, Wakad, Pune, Maharashtra 411057',
      area: 'Wakad',
      latitude: 18.5987,
      longitude: 73.7663,
      connectorTypes: ['CCS2', 'Type 2', 'GB/T'],
      chargingSpeed: 60,
      totalChargers: 4,
      availableChargers: 1,
      occupiedChargers: 3,
      pricePerKwh: 17.5,
      idleFeePerMin: 2.0,
      status: 'Operational',
      amenities: ['Restroom', 'Snacks', 'Convenience Store'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 60, st: 'busy', rem: 14 },
        { id: 2, type: 'CCS2', kw: 60, st: 'busy', rem: 28 },
        { id: 3, type: 'Type 2', kw: 22, st: 'free', rem: 0 },
        { id: 4, type: 'GB/T', kw: 15, st: 'busy', rem: 40 },
      ],
    },
    {
      _id: 'demo-baner',
      name: 'VoltHub Baner High Street',
      short: 'Baner',
      address: 'Balewadi High Street Link Road, Baner, Pune, Maharashtra 411045',
      area: 'Baner',
      latitude: 18.5590,
      longitude: 73.7868,
      connectorTypes: ['CCS2', 'Type 2'],
      chargingSpeed: 150,
      totalChargers: 5,
      availableChargers: 2,
      occupiedChargers: 3,
      pricePerKwh: 20.0,
      idleFeePerMin: 3.0,
      status: 'Operational',
      amenities: ['Café', 'Restroom', 'Wi-Fi', 'Valet Parking'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 150, st: 'busy', rem: 16 },
        { id: 2, type: 'CCS2', kw: 120, st: 'busy', rem: 31 },
        { id: 3, type: 'CCS2', kw: 60, st: 'free', rem: 0 },
        { id: 4, type: 'Type 2', kw: 22, st: 'free', rem: 0 },
        { id: 5, type: 'Type 2', kw: 22, st: 'busy', rem: 42 },
      ],
    },
    {
      _id: 'demo-koth',
      name: 'ChargeNest Kothrud Karve Road',
      short: 'Kothrud',
      address: 'Opposite Karve Statue, Karve Road, Kothrud, Pune, Maharashtra 411038',
      area: 'Kothrud',
      latitude: 18.5074,
      longitude: 73.8077,
      connectorTypes: ['CCS2', 'Type 2'],
      chargingSpeed: 60,
      totalChargers: 4,
      availableChargers: 2,
      occupiedChargers: 2,
      pricePerKwh: 16.5,
      idleFeePerMin: 2.0,
      status: 'Operational',
      amenities: ['Restroom', '24/7 Access'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 60, st: 'free', rem: 0 },
        { id: 2, type: 'CCS2', kw: 30, st: 'free', rem: 0 },
        { id: 3, type: 'Type 2', kw: 22, st: 'busy', rem: 19 },
        { id: 4, type: 'Type 2', kw: 22, st: 'busy', rem: 35 },
      ],
    },
    {
      _id: 'demo-vim',
      name: 'GridPoint Viman Nagar Aeromall',
      short: 'Viman Nagar',
      address: 'Near Pune International Airport, Aeromall Nagar Road, Viman Nagar, Pune, Maharashtra 411014',
      area: 'Viman Nagar',
      latitude: 18.5679,
      longitude: 73.9143,
      connectorTypes: ['CCS2', 'Type 2', 'CHAdeMO'],
      chargingSpeed: 120,
      totalChargers: 5,
      availableChargers: 2,
      occupiedChargers: 3,
      pricePerKwh: 18.5,
      idleFeePerMin: 2.5,
      status: 'Operational',
      amenities: ['Airport Shuttle', 'Café', 'Restroom'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 120, st: 'busy', rem: 24 },
        { id: 2, type: 'CCS2', kw: 60, st: 'busy', rem: 8 },
        { id: 3, type: 'CCS2', kw: 60, st: 'free', rem: 0 },
        { id: 4, type: 'Type 2', kw: 22, st: 'free', rem: 0 },
        { id: 5, type: 'CHAdeMO', kw: 50, st: 'busy', rem: 18 },
      ],
    },
    {
      _id: 'demo-had',
      name: 'PunePulse Hadapsar MegaHub',
      short: 'Hadapsar',
      address: 'Pune-Solapur Highway, Near Gadital & Hadapsar Flyover, Pune, Maharashtra 411028',
      area: 'Hadapsar',
      latitude: 18.5029,
      longitude: 73.9282,
      connectorTypes: ['CCS2', 'Type 2', 'GB/T'],
      chargingSpeed: 120,
      totalChargers: 4,
      availableChargers: 3,
      occupiedChargers: 1,
      pricePerKwh: 17.0,
      idleFeePerMin: 2.0,
      status: 'Operational',
      amenities: ['Highway Diner', 'Restroom', 'EV Tech Support'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 120, st: 'free', rem: 0 },
        { id: 2, type: 'CCS2', kw: 60, st: 'free', rem: 0 },
        { id: 3, type: 'Type 2', kw: 22, st: 'free', rem: 0 },
        { id: 4, type: 'GB/T', kw: 30, st: 'busy', rem: 25 },
      ],
    },
    {
      _id: 'demo-mag',
      name: 'VoltHub Magarpatta Cybercity',
      short: 'Magarpatta',
      address: 'Tower 4 Commercial Complex, Magarpatta City, Hadapsar, Pune, Maharashtra 411013',
      area: 'Magarpatta',
      latitude: 18.5158,
      longitude: 73.9272,
      connectorTypes: ['CCS2', 'Type 2'],
      chargingSpeed: 150,
      totalChargers: 6,
      availableChargers: 4,
      occupiedChargers: 2,
      pricePerKwh: 19.5,
      idleFeePerMin: 2.0,
      status: 'Operational',
      amenities: ['Food Court', 'Restroom', 'Covered bays'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 150, st: 'free', rem: 0 },
        { id: 2, type: 'CCS2', kw: 120, st: 'free', rem: 0 },
        { id: 3, type: 'CCS2', kw: 60, st: 'busy', rem: 19 },
        { id: 4, type: 'Type 2', kw: 22, st: 'free', rem: 0 },
        { id: 5, type: 'Type 2', kw: 22, st: 'free', rem: 0 },
        { id: 6, type: 'Type 2', kw: 22, st: 'busy', rem: 33 },
      ],
    },
    {
      _id: 'demo-shiv',
      name: 'ChargeNest Shivajinagar Junction',
      short: 'Shivajinagar',
      address: 'Near Savitribai Phule Pune University Circle, Ganeshkhind Road, Shivajinagar, Pune, Maharashtra 411005',
      area: 'Shivajinagar',
      latitude: 18.5308,
      longitude: 73.8475,
      connectorTypes: ['CCS2', 'Type 2', 'CHAdeMO'],
      chargingSpeed: 150,
      totalChargers: 5,
      availableChargers: 1,
      occupiedChargers: 3,
      pricePerKwh: 21.0,
      idleFeePerMin: 3.0,
      status: 'Operational',
      amenities: ['Café', 'Restroom', 'Wi-Fi'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 150, st: 'busy', rem: 11 },
        { id: 2, type: 'CCS2', kw: 150, st: 'busy', rem: 25 },
        { id: 3, type: 'CCS2', kw: 60, st: 'busy', rem: 36 },
        { id: 4, type: 'CHAdeMO', kw: 50, st: 'free', rem: 0 },
        { id: 5, type: 'Type 2', kw: 22, st: 'off', rem: 0 },
      ],
    },
    {
      _id: 'demo-kp',
      name: 'EcoCharge Koregaon Park',
      short: 'Koregaon Park',
      address: 'Lane 7, Near South Main Road, Koregaon Park, Pune, Maharashtra 411001',
      area: 'Koregaon Park',
      latitude: 18.5362,
      longitude: 73.8940,
      connectorTypes: ['CCS2', 'Type 2', 'CHAdeMO'],
      chargingSpeed: 60,
      totalChargers: 4,
      availableChargers: 2,
      occupiedChargers: 2,
      pricePerKwh: 22.0,
      idleFeePerMin: 3.0,
      status: 'Operational',
      amenities: ['Artisan Coffee', 'Restroom', 'Wi-Fi'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 60, st: 'free', rem: 0 },
        { id: 2, type: 'CCS2', kw: 60, st: 'busy', rem: 15 },
        { id: 3, type: 'Type 2', kw: 22, st: 'busy', rem: 28 },
        { id: 4, type: 'CHAdeMO', kw: 50, st: 'free', rem: 0 },
      ],
    },
    {
      _id: 'demo-aundh',
      name: 'SmartEV Aundh ITI Hub',
      short: 'Aundh',
      address: 'ITI Road, Parihar Chowk, Aundh, Pune, Maharashtra 411007',
      area: 'Aundh',
      latitude: 18.5596,
      longitude: 73.8071,
      connectorTypes: ['CCS2', 'Type 2'],
      chargingSpeed: 60,
      totalChargers: 4,
      availableChargers: 0,
      occupiedChargers: 0,
      pricePerKwh: 17.0,
      idleFeePerMin: 2.0,
      status: 'Maintenance',
      amenities: ['Restroom', 'Shopping Complex Adjacent'],
      isDemo: true,
      ports: [
        { id: 1, type: 'CCS2', kw: 60, st: 'off', rem: 0 },
        { id: 2, type: 'CCS2', kw: 30, st: 'off', rem: 0 },
        { id: 3, type: 'Type 2', kw: 22, st: 'off', rem: 0 },
        { id: 4, type: 'Type 2', kw: 22, st: 'off', rem: 0 },
      ],
    },
  ];

  // Application State
  const state = {
    stations: [],
    stats: {
      totalStations: 0,
      availableChargers: 0,
      fastChargers: 0,
      occupiedChargers: 0,
    },
    userLocation: {
      lat: 18.5204,
      lng: 73.8567,
      label: 'Pune Central (Default)',
    },
    veh: VEHICLES[0],
    pct: 22,
    target: 80,
    fit: true,
    free: false,
    minKw: 0,
    q: '',
    sort: 'near',
    connector: 'all',
    status: 'all',
    view: 'list',
    sel: null,
    editingId: null,
    deletingId: null,
    user: null, // active simulation session (queue, held, charging, booked)
    isUsingFallback: false,
    isPickingStationLocation: false,
  };

  let chargeMapInstance = null;

  /* ==================== HAVERSINE DISTANCE FORMULA ==================== */
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /* ==================== HELPERS ==================== */
  function fmtTime(mins) {
    if (mins < 60) return mins + ' min';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} h${m ? ` ${m} min` : ''}`;
  }

  function fitsCar(portType) {
    if (!state.veh || !state.veh.conn) return true;
    return state.veh.conn.includes(portType);
  }

  function effectiveKw(p) {
    if (!state.veh) return p.kw;
    if (p.type === 'Type 2') {
      return Math.min(p.kw, state.veh.ac || 7.2);
    }
    if (state.veh.dc === 0) return 0;
    return Math.min(p.kw, state.veh.dc || 50);
  }

  function getUsablePorts(st) {
    if (!st.ports || !st.ports.length) return [];
    return st.ports.filter((p) => fitsCar(p.type) && p.st !== 'off');
  }

  function getFreePorts(st) {
    return getUsablePorts(st).filter((p) => p.st === 'free');
  }

  function getBestPort(st) {
    const usable = getUsablePorts(st);
    if (!usable.length) return null;
    return usable.reduce((prev, curr) => (effectiveKw(curr) > effectiveKw(prev) ? curr : prev));
  }

  function currentStation() {
    return state.stations.find((s) => s._id === state.sel || s.id === state.sel);
  }

  function stationById(id) {
    return state.stations.find((s) => s._id === id || s.id === id);
  }

  function holdMinutes(st) {
    return Math.min(30, Math.max(10, (st.drive || 10) + 2));
  }

  function rangeKm(veh = state.veh, pct = state.pct) {
    if (!veh) return 0;
    const max = veh.maxRange || Math.round(veh.kwh / 0.13);
    return Math.max(1, Math.round((pct / 100) * max));
  }

  function getStationStatus(st) {
    if (st.status === 'Maintenance') {
      return { kind: 'off', label: 'Under Maintenance', count: 'M', start: Infinity, wait: Infinity };
    }
    if (st.status === 'Offline') {
      return { kind: 'off', label: 'Offline', count: '×', start: Infinity, wait: Infinity };
    }

    const usable = getUsablePorts(st);
    const free = getFreePorts(st).length;

    if (!usable.length) {
      return { kind: 'off', label: 'No port fits car', count: '×', start: Infinity, wait: Infinity };
    }

    const queue = st.queue || 0;
    if (free > 0 && queue === 0) {
      return { kind: 'good', label: `${free} free now`, count: free, start: st.drive || 5, wait: 0 };
    }

    const wait = Math.max(15, queue * 20);
    return {
      kind: wait <= 20 ? 'warn' : 'bad',
      label: `~${wait} min wait`,
      count: 0,
      wait: wait,
      start: Math.max(st.drive || 5, wait),
    };
  }

  function maxKwOf(st) {
    if (st.ports && st.ports.length) {
      return Math.max(...st.ports.map((p) => p.kw));
    }
    return st.chargingSpeed || 60;
  }

  /* ==================== TOAST MESSAGES ==================== */
  function showToast(msg, type = 'info') {
    const container = $('#toasts');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚡';
    t.innerHTML = `<span>${icon}</span> <div>${msg}</div>`;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 4500);
  }

  /* ==================== DATA FETCHING & FALLBACK ==================== */
  async function loadData() {
    try {
      const params = {
        userLat: state.userLocation.lat,
        userLng: state.userLocation.lng,
        sort: state.sort,
      };

      if (state.q.trim()) params.q = state.q.trim();
      if (state.status !== 'all') params.status = state.status;
      if (state.connector !== 'all') params.connectorType = state.connector;
      if (state.minKw > 0) params.minKw = state.minKw;
      if (state.free) params.onlyAvailable = 'true';

      const [stationsRes, statsRes] = await Promise.all([
        window.api.getStations(params),
        window.api.getDashboardStats(),
      ]);

      if (stationsRes.success && Array.isArray(stationsRes.data) && stationsRes.data.length > 0) {
        state.stations = stationsRes.data;
        state.isUsingFallback = false;
      } else {
        useFallbackStations();
      }

      if (statsRes.success) {
        state.stats = statsRes.data || {};
      } else {
        calculateFallbackStats();
      }
    } catch (err) {
      console.warn('Backend API unavailable. Falling back to local demo Pune stations.', err);
      useFallbackStations();
    }

    // Attach computed distances from user location to all stations
    recalculateStationDistances();
    renderKPIs();
    renderList();
    if (chargeMapInstance) {
      chargeMapInstance.renderStations(state.stations, state.sel);
      chargeMapInstance.setUserLocation(state.userLocation.lat, state.userLocation.lng, state.userLocation.label);
    }
  }

  function useFallbackStations() {
    state.isUsingFallback = true;
    state.stations = JSON.parse(JSON.stringify(DEFAULT_DEMO_STATIONS));
    calculateFallbackStats();
  }

  function calculateFallbackStats() {
    let avail = 0;
    let occ = 0;
    let fast = 0;
    state.stations.forEach((s) => {
      avail += s.availableChargers || 0;
      occ += s.occupiedChargers || 0;
      if (s.chargingSpeed >= 50) fast += s.totalChargers || 0;
    });
    state.stats = {
      totalStations: state.stations.length,
      availableChargers: avail,
      fastChargers: fast,
      occupiedChargers: occ,
    };
  }

  function recalculateStationDistances() {
    state.stations.forEach((st) => {
      st.dist = calculateDistanceKm(state.userLocation.lat, state.userLocation.lng, st.latitude, st.longitude);
      st.drive = Math.max(3, Math.round(st.dist * 2.5)); // rough city driving estimate
    });

    // Apply active sort
    if (state.sort === 'near') {
      state.stations.sort((a, b) => a.dist - b.dist);
    } else if (state.sort === 'price') {
      state.stations.sort((a, b) => a.pricePerKwh - b.pricePerKwh);
    } else if (state.sort === 'power') {
      state.stations.sort((a, b) => (b.chargingSpeed || 60) - (a.chargingSpeed || 60));
    } else if (state.sort === 'name') {
      state.stations.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  /* ==================== RENDER KPI DASHBOARD ==================== */
  function renderKPIs() {
    $('#kpiTotal').textContent = state.stats.totalStations || 0;
    $('#kpiAvailable').textContent = state.stats.availableChargers || 0;
    $('#kpiFast').textContent = state.stats.fastChargers || 0;
    $('#kpiOccupied').textContent = state.stats.occupiedChargers || 0;
  }

  /* ==================== VEHICLE & BATTERY CHIP ==================== */
  function renderVehicleChip() {
    const low = state.pct < 20;
    const chip = $('#vehChip');
    if (!chip) return;
    const estRange = rangeKm();
    chip.innerHTML = `
      <span class="batt ${low ? 'low' : ''}"><i style="width: ${state.pct}%"></i></span>
      <span style="min-width: 0">
        <b>${state.veh ? state.veh.name : 'Select Car'}</b>
        <span class="s mono">${Math.round(state.pct)}% · ~${estRange} km range</span>
      </span>
    `;
  }

  /* ==================== STATION LIST ==================== */
  function renderList() {
    const cardsContainer = $('#cards');
    if (!cardsContainer) return;

    let filtered = state.stations.slice();

    // Query filter
    if (state.q.trim()) {
      const q = state.q.trim().toLowerCase();
      filtered = filtered.filter(
        (st) =>
          st.name.toLowerCase().includes(q) ||
          st.area.toLowerCase().includes(q) ||
          (st.address && st.address.toLowerCase().includes(q))
      );
    }

    // Connector type filter
    if (state.connector !== 'all') {
      filtered = filtered.filter((st) => (st.connectorTypes || []).includes(state.connector));
    }

    // Power filter
    if (state.minKw > 0) {
      filtered = filtered.filter((st) => (st.chargingSpeed || 60) >= state.minKw);
    }

    // Status filter
    if (state.status !== 'all') {
      filtered = filtered.filter((st) => st.status === state.status);
    }

    // Free now filter
    if (state.free) {
      filtered = filtered.filter((st) => (st.availableChargers || 0) > 0 && st.status === 'Operational');
    }

    // In-memory filter for vehicle connector fit
    if (state.fit && state.veh) {
      filtered = filtered.filter((st) => getUsablePorts(st).length > 0);
    }

    if (!filtered.length) {
      cardsContainer.innerHTML = `
        <div class="empty">
          <b>No charging stations match your filters</b>
          <p class="note">Try loosening your power requirement, changing connector types, or clearing filters.</p>
          <button class="btn sm" data-act="clear">Clear filters</button>
        </div>
      `;
      $('#count').textContent = `0 of ${state.stations.length} stations`;
      return;
    }

    const currentRange = rangeKm();
    $('#count').textContent = `${filtered.length} of ${state.stations.length} stations`;

    cardsContainer.innerHTML = filtered
      .map((st) => {
        const s = getStationStatus(st);
        const isSelected = state.sel === st._id;
        const mine = state.user && state.user.sid === st._id && state.user.pid;

        const segs = (st.ports || [])
          .map((p) => {
            const isHeld = mine && state.user.pid === p.id;
            const fits = fitsCar(p.type);
            return `<i class="seg ${isHeld ? 'held' : p.st} ${fits ? '' : 'dim'}"></i>`;
          })
          .join('');

        const types = (st.connectorTypes || []).join(' · ');
        const withinBatteryRange = st.dist <= currentRange;
        const rangeBadge = withinBatteryRange
          ? `<span style="color:var(--good);font-weight:600;font-size:11.5px">✓ Within battery range</span>`
          : `<span style="color:var(--bad);font-weight:700;font-size:11.5px">⚠️ Beyond current range (~${currentRange} km)</span>`;

        const plugInText =
          s.start !== Infinity
            ? `<span>Plug in in <b class="mono">~${s.start} min</b></span>`
            : '';

        const demoBadge = st.isDemo
          ? `<span class="demo-badge">Demo</span>`
          : `<span class="demo-badge" style="color:var(--accent);border-color:var(--accent-soft)">Live</span>`;

        return `
          <article class="card ${isSelected ? 'sel' : ''}" data-act="select" data-id="${st._id}" role="button" tabindex="0">
            <div class="c-top">
              <div>
                <h3>${st.name} ${demoBadge}</h3>
                <p class="sub">${st.area} · <b class="mono">${st.dist} km</b> (direct) · ~${st.drive} min drive (city est.)</p>
              </div>
              <span class="pill ${s.kind}">${s.label}</span>
            </div>
            <div class="segs" aria-hidden="true">${segs}</div>
            <div class="c-meta">
              ${plugInText}
              <span><b class="mono">₹${st.pricePerKwh}</b>/kWh</span>
              <span>up to <b class="mono">${maxKwOf(st)} kW</b></span>
              <span>${types}</span>
              ${rangeBadge}
            </div>
            <div class="card-actions">
              <button class="btn-card" data-act="edit" data-id="${st._id}" title="Edit station">✏️ Edit</button>
              <button class="btn-card danger" data-act="confirmDelete" data-id="${st._id}" title="Delete station">🗑️ Delete</button>
            </div>
          </article>
        `;
      })
      .join('');
  }

  /* ==================== STATION DETAIL DRAWER ==================== */
  function renderDetail() {
    const st = currentStation();
    const drawer = $('#detail');
    if (!drawer) return;

    if (!st) {
      drawer.hidden = true;
      drawer.style.display = 'none';
      drawer.innerHTML = '';
      return;
    }

    drawer.hidden = false;
    drawer.style.display = 'flex';
    const s = getStationStatus(st);
    const demoBadge = st.isDemo
      ? `<span class="demo-badge">Demo Data</span>`
      : `<span class="demo-badge" style="color:var(--accent)">Live Station</span>`;

    drawer.innerHTML = `
      <div class="d-head">
        <button class="icon-btn" data-act="close" aria-label="Close station details">
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <h2>${st.name} ${demoBadge}</h2>
          <p class="sub">${st.address || st.area}</p>
        </div>
        <a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.name + ' ' + (st.address || st.area) + ' Pune')}">
          Navigate
        </a>
      </div>
      <div class="d-body">
        <div class="facts">
          <div class="fact">
            <span>Distance (direct)</span>
            <b class="mono">${st.dist} km</b>
          </div>
          <div class="fact">
            <span>City Drive (est.)</span>
            <b class="mono">${st.drive} min</b>
          </div>
          <div class="fact">
            <span>Price</span>
            <b class="mono">₹${st.pricePerKwh}/kWh</b>
          </div>
        </div>

        <div class="sec">
          <h3>Ports <span class="live"><i></i>Live Status</span></h3>
          <div class="ports" id="dPorts">
            ${(st.ports || []).map((p) => portTileHtml(st, p)).join('')}
          </div>
        </div>

        <div class="sec" id="dAct">
          <h3>${state.user && state.user.sid === st._id ? 'Your Active Session' : 'Reserve or Plug In'}</h3>
          ${actionBoxHtml(st)}
        </div>

        <div class="sec">
          <h3>Cost & Charging Time Estimator</h3>
          <div class="box est">
            <div class="rng">
              <label for="rngCur"><span>Current Battery</span><span class="mono" id="vCur">${Math.round(state.pct)}%</span></label>
              <input id="rngCur" type="range" min="5" max="95" step="1" value="${state.pct}">
            </div>
            <div class="rng">
              <label for="rngTar"><span>Charge Up To</span><span class="mono" id="vTar">${state.target}%</span></label>
              <input id="rngTar" type="range" min="20" max="100" step="5" value="${state.target}">
            </div>
            <div class="out" id="estOut"></div>
            <p class="note">DC fast charging naturally throttles above 80% to protect battery health.</p>
          </div>
        </div>

        <div class="sec">
          <h3>Book an Arrival Slot</h3>
          <div class="slots" id="dSlots">${slotsHtml(st)}</div>
        </div>

        <div class="sec">
          <h3>Station Information</h3>
          <div class="kv">
            <div><span>Status</span><b class="pill ${s.kind}" style="font-size:11px">${st.status}</b></div>
            <div><span>Max Charging Speed</span><b class="mono">${st.chargingSpeed || 60} kW</b></div>
            <div><span>Idle Fee</span><b class="mono">₹${st.idleFeePerMin || 2}/min after 10 min</b></div>
            <div><span>Coordinates</span><b class="mono">${st.latitude.toFixed(4)}, ${st.longitude.toFixed(4)}</b></div>
            <div><span>Payment Modes</span><b>UPI, Card, RFID, NetBanking</b></div>
          </div>
          <div class="tags" style="margin-top: 12px;">
            ${(st.amenities || []).map((a) => `<span class="tag">${a}</span>`).join('')}
          </div>
        </div>

        <div class="sec">
          <h3>Station Operator Actions</h3>
          <div class="detail-operator-actions">
            <button class="btn sm" data-act="edit" data-id="${st._id}">✏️ Edit Station Details</button>
            <button class="btn sm danger" data-act="confirmDelete" data-id="${st._id}">🗑️ Delete Station</button>
          </div>
        </div>
      </div>
    `;

    updateEstimator();
  }

  function portTileHtml(st, p) {
    const u = state.user;
    const mine = u && u.sid === st._id && u.pid === p.id;
    const fits = fitsCar(p.type);
    let txt = 'Free';
    let cls = p.st;

    if (mine) {
      txt = u.type === 'charging' ? 'Charging you' : 'Held for you';
      cls = 'mine';
    } else if (p.st === 'free') {
      txt = 'Free';
    } else if (p.st === 'busy') {
      txt = `Free in ${p.rem || 15} min`;
    } else if (p.st === 'held') {
      txt = 'Reserved';
    } else {
      txt = 'Offline';
    }

    return `
      <div class="port ${cls} ${fits ? '' : 'nofit'}">
        <div class="pk">
          <b>P${p.id}</b>
          <span>${p.type}</span>
        </div>
        <div class="kw mono">${p.kw}<small> kW</small></div>
        <div class="ps"><i class="dot"></i>${txt}</div>
        ${fits ? '' : '<div class="nf">Not for your car</div>'}
      </div>
    `;
  }

  function actionBoxHtml(st) {
    const u = state.user;

    if (u && u.sid === st._id) {
      if (u.type === 'queue') {
        return `
          <div class="box hl">
            <div class="big"><b class="mono">#${u.ahead + 1}</b><span>in the queue</span></div>
            <p class="note">${u.ahead} EV(s) ahead of you. We will hold a port for you once ready.</p>
            <button class="btn block danger" data-act="leave">Leave Queue</button>
          </div>
        `;
      }
      if (u.type === 'held') {
        return `
          <div class="box hl">
            <div class="big"><b class="mono">Port ${u.pid}</b><span>held for <span class="mono">${u.hold} min</span></span></div>
            <div class="bar"><i style="width: ${Math.max(0, (u.hold / u.max) * 100)}%"></i></div>
            <button class="btn block primary" data-act="start">I Have Arrived, Start Charging</button>
            <button class="btn block" data-act="release">Release Port</button>
          </div>
        `;
      }
      if (u.type === 'charging') {
        const prog = Math.min(100, Math.max(0, ((u.pct - u.start) / (u.target - u.start)) * 100));
        return `
          <div class="box hl">
            <div class="big"><b class="mono">${Math.round(u.pct)}%</b><span>heading to ${u.target}%</span></div>
            <div class="bar"><i style="width: ${prog}%"></i></div>
            <p class="note"><span class="mono">~${u.eta} min</span> remaining · <span class="mono">₹${Math.round(u.cost)}</span> spent so far</p>
            <button class="btn block danger" data-act="stop">Stop Charging Session</button>
          </div>
        `;
      }
      if (u.type === 'booked') {
        return `
          <div class="box hl">
            <div class="big"><b class="mono">${u.time}</b><span>slot confirmed</span></div>
            <p class="note">Your port will be reserved 10 minutes prior to your arrival.</p>
            <button class="btn block danger" data-act="cancelbook">Cancel Booking</button>
          </div>
        `;
      }
    }

    if (st.status !== 'Operational') {
      return `<div class="box"><p class="note">This station is currently ${st.status}. Please choose another charging hub.</p></div>`;
    }

    const freePorts = getFreePorts(st);
    if (freePorts.length > 0) {
      const best = getBestPort(st);
      return `
        <div class="box hl">
          <div class="big"><b class="mono">${freePorts.length}</b><span>free port(s) right now</span></div>
          <p class="note">Port ${best.id} (${best.type}, ${best.kw} kW) is immediately available. Hold it for ${holdMinutes(st)} minutes while you navigate over.</p>
          <button class="btn block primary" data-act="hold">Hold Port ${best.id} for Me</button>
        </div>
      `;
    }

    return `
      <div class="box">
        <div class="big"><b class="mono">${st.queue || 0}</b><span>in wait queue</span></div>
        <p class="note">Join the digital queue. You will be notified the instant a charger frees up.</p>
        <button class="btn block primary" data-act="join">Join Digital Queue</button>
      </div>
    `;
  }

  function slotTimes() {
    const d = new Date();
    let m = d.getHours() * 60 + d.getMinutes();
    m = Math.ceil((m + 15) / 30) * 30;
    return Array.from({ length: 8 }, (_, i) => {
      const t = (m + i * 30) % 1440;
      return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    });
  }

  function slotsHtml(st) {
    const times = slotTimes();
    const u = state.user;
    return times
      .map((t, i) => {
        const isCurrentBooking = u && u.type === 'booked' && u.sid === st._id && u.time === t;
        const availableCount = i % 3 === 0 ? 0 : Math.max(1, (st.totalChargers || 4) - 2);
        return `
          <button class="slot ${isCurrentBooking ? 'on' : ''}" data-act="book" data-slot="${t}" ${availableCount ? '' : 'disabled'}>
            <b class="mono">${t}</b>
            <span>${availableCount ? `${availableCount} open` : 'Full'}</span>
          </button>
        `;
      })
      .join('');
  }

  function updateEstimator() {
    const st = currentStation();
    const out = $('#estOut');
    if (!st || !out) return;

    $('#vCur').textContent = `${Math.round(state.pct)}%`;
    $('#vTar').textContent = `${state.target}%`;

    const b = getBestPort(st);
    if (!b) {
      out.innerHTML = `<p class="note" style="grid-column:1/-1">No charger at this station fits your car model.</p>`;
      return;
    }

    const eff = effectiveKw(b);
    const kwh = (state.veh ? state.veh.kwh : 40) * ((state.target - state.pct) / 100);
    const min = Math.round((kwh / (eff * 0.92)) * 60);
    const cost = Math.round(kwh * st.pricePerKwh);

    out.innerHTML = `
      <div><span>Time</span><b class="mono">${fmtTime(Math.max(min, 1))}</b></div>
      <div><span>Energy</span><b class="mono">${kwh.toFixed(1)} kWh</b></div>
      <div><span>Cost</span><b class="mono">₹${cost}</b></div>
    `;
  }

  /* ==================== FORM: ADD & EDIT STATION ==================== */
  function openStationModal(stationToEdit = null) {
    state.editingId = stationToEdit ? stationToEdit._id : null;
    const modal = $('#stationModal');
    const title = $('#stationModalTitle');
    const submitBtn = $('#btnSaveStation');
    const alertBox = $('#stationFormAlert');

    alertBox.className = 'form-alert';
    alertBox.textContent = '';

    if (stationToEdit) {
      title.textContent = 'Edit Charging Station';
      submitBtn.textContent = 'Update Station';
      $('#stName').value = stationToEdit.name || '';
      $('#stArea').value = stationToEdit.area || '';
      $('#stAddress').value = stationToEdit.address || '';
      $('#stLat').value = stationToEdit.latitude || '';
      $('#stLng').value = stationToEdit.longitude || '';
      $('#stSpeed').value = stationToEdit.chargingSpeed || 60;
      $('#stTotal').value = stationToEdit.totalChargers || 4;
      $('#stAvail').value = stationToEdit.availableChargers !== undefined ? stationToEdit.availableChargers : 2;
      $('#stPrice').value = stationToEdit.pricePerKwh || 18;
      $('#stStatus').value = stationToEdit.status || 'Operational';
      $('#stAmenities').value = (stationToEdit.amenities || []).join(', ');

      const connList = stationToEdit.connectorTypes || ['CCS2'];
      $$('input[name="connectorType"]').forEach((cb) => {
        cb.checked = connList.includes(cb.value);
      });
    } else {
      title.textContent = 'Add New Charging Station';
      submitBtn.textContent = 'Save Station to Database';
      $('#stName').value = '';
      $('#stArea').value = '';
      $('#stAddress').value = '';
      $('#stLat').value = '';
      $('#stLng').value = '';
      $('#stSpeed').value = '120';
      $('#stTotal').value = '4';
      $('#stAvail').value = '3';
      $('#stPrice').value = '19.0';
      $('#stStatus').value = 'Operational';
      $('#stAmenities').value = 'Café, Restroom, Covered bays, Wi-Fi';

      $$('input[name="connectorType"]').forEach((cb) => {
        cb.checked = cb.value === 'CCS2' || cb.value === 'Type 2';
      });
    }

    modal.hidden = false;
    modal.style.display = 'grid';
  }

  function closeStationModal() {
    const modal = $('#stationModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    state.editingId = null;
    state.isPickingStationLocation = false;
    if (chargeMapInstance) {
      chargeMapInstance.stopLocationPicker(true);
      chargeMapInstance.clearPickerMarker();
    }
  }

  async function handleStationFormSubmit(e) {
    e.preventDefault();
    const alertBox = $('#stationFormAlert');
    alertBox.className = 'form-alert';
    alertBox.textContent = '';

    const name = $('#stName').value.trim();
    const area = $('#stArea').value.trim();
    const address = $('#stAddress').value.trim();
    const lat = parseFloat($('#stLat').value);
    const lng = parseFloat($('#stLng').value);
    const speed = parseFloat($('#stSpeed').value);
    const total = parseInt($('#stTotal').value, 10);
    const avail = parseInt($('#stAvail').value, 10);
    const price = parseFloat($('#stPrice').value);
    const status = $('#stStatus').value;
    const amenities = $('#stAmenities').value.trim();

    const selectedConnectors = Array.from($$('input[name="connectorType"]:checked')).map(
      (cb) => cb.value
    );

    // Client-side Validation
    if (!name) {
      showFormError('Station name is required.');
      return;
    }
    if (!area) {
      showFormError('Area / Locality is required (e.g. Hinjawadi, Baner).');
      return;
    }
    if (!address) {
      showFormError('Full street address is required.');
      return;
    }
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showFormError('Please enter valid coordinates or use the "Pick on Map" button.');
      return;
    }
    if (selectedConnectors.length === 0) {
      showFormError('Please select at least one connector type (e.g. CCS2, Type 2).');
      return;
    }
    if (isNaN(speed) || speed <= 0) {
      showFormError('Charging speed must be a positive number (kW).');
      return;
    }
    if (isNaN(total) || total < 1) {
      showFormError('Total chargers must be at least 1.');
      return;
    }
    if (isNaN(avail) || avail < 0 || avail > total) {
      showFormError('Available chargers must be between 0 and total chargers.');
      return;
    }
    if (isNaN(price) || price < 0) {
      showFormError('Price per kWh must be a positive number.');
      return;
    }

    const payload = {
      name,
      area,
      address,
      latitude: lat,
      longitude: lng,
      connectorTypes: selectedConnectors,
      chargingSpeed: speed,
      totalChargers: total,
      availableChargers: avail,
      pricePerKwh: price,
      status,
      amenities: amenities.split(',').map((s) => s.trim()).filter(Boolean),
    };

    const submitBtn = $('#btnSaveStation');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving to Database...';

    try {
      if (state.editingId) {
        const res = await window.api.updateStation(state.editingId, payload);
        showToast(`Station "${res.data.name}" updated successfully!`, 'success');
      } else {
        const res = await window.api.createStation(payload);
        showToast(`Station "${res.data.name}" created and added to map!`, 'success');
      }

      closeStationModal();
      await loadData();

      // If updating currently viewed station, re-render drawer
      if (state.sel === state.editingId) {
        renderDetail();
      }
    } catch (err) {
      showFormError(err.message || 'Error saving station record.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = state.editingId ? 'Update Station' : 'Save Station to Database';
    }
  }

  function showFormError(msg) {
    const alertBox = $('#stationFormAlert');
    alertBox.className = 'form-alert danger visible';
    alertBox.textContent = msg;
  }

  /* ==================== DELETE MODAL ==================== */
  function openDeleteModal(id) {
    const st = stationById(id);
    if (!st) return;
    state.deletingId = id;
    $('#deleteStationName').textContent = st.name;
    const modal = $('#deleteModal');
    modal.hidden = false;
    modal.style.display = 'grid';
  }

  function closeDeleteModal() {
    const modal = $('#deleteModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    state.deletingId = null;
  }

  async function handleConfirmDelete() {
    if (!state.deletingId) return;
    const btn = $('#btnConfirmDelete');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    try {
      const res = await window.api.deleteStation(state.deletingId);
      showToast(res.message || 'Station deleted successfully', 'success');

      if (state.sel === state.deletingId) {
        state.sel = null;
        renderDetail();
      }

      closeDeleteModal();
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete station', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete Station';
    }
  }

  /* ==================== USER SIMULATION ACTIVITY ==================== */
  function renderActivity() {
    const u = state.user;
    const container = $('#activity');
    if (!container) return;

    if (!u) {
      container.innerHTML = '';
      return;
    }

    const st = stationById(u.sid);
    if (!st) {
      state.user = null;
      container.innerHTML = '';
      return;
    }

    let html = '';
    if (u.type === 'queue') {
      html = `
        <div class="act">
          <div class="act-t">
            <b>You are #${u.ahead + 1} in the queue</b>
            <span class="mono">~${(u.ahead + 1) * 15} min</span>
          </div>
          <p>${st.name}. ${u.ahead} car(s) ahead of you. A port will be held for you once available.</p>
          <div class="act-b">
            <button class="btn sm" data-act="select" data-id="${st._id}">View Station</button>
            <button class="btn sm danger" data-act="leave">Leave Queue</button>
          </div>
        </div>
      `;
    } else if (u.type === 'held') {
      html = `
        <div class="act">
          <div class="act-t">
            <b>Port ${u.pid} is held for you</b>
            <span class="mono">${u.hold} min left</span>
          </div>
          <div class="bar"><i style="width: ${Math.max(0, (u.hold / u.max) * 100)}%"></i></div>
          <p>${st.name}. Please plug in before the reservation hold expires.</p>
          <div class="act-b">
            <button class="btn sm primary" data-act="start">Start Charging</button>
            <button class="btn sm" data-act="release">Release Port</button>
          </div>
        </div>
      `;
    } else if (u.type === 'charging') {
      const prog = Math.min(100, Math.max(0, ((u.pct - u.start) / (u.target - u.start)) * 100));
      html = `
        <div class="act">
          <div class="act-t">
            <b>Charging at ${st.short || st.name}</b>
            <span class="mono">${Math.round(u.pct)}% → ${u.target}%</span>
          </div>
          <div class="bar"><i style="width: ${prog}%"></i></div>
          <p><span class="mono">~${u.eta} min</span> remaining · <span class="mono">₹${Math.round(u.cost)}</span> spent</p>
          <div class="act-b">
            <button class="btn sm danger" data-act="stop">Stop Charging</button>
          </div>
        </div>
      `;
    } else if (u.type === 'booked') {
      html = `
        <div class="act">
          <div class="act-t">
            <b>Arrival Booked for ${u.time}</b>
            <span class="mono">${st.short || st.name}</span>
          </div>
          <p>${st.name}. Your charging port is held 10 minutes prior to slot.</p>
          <div class="act-b">
            <button class="btn sm" data-act="select" data-id="${st._id}">View Station</button>
            <button class="btn sm danger" data-act="cancelbook">Cancel Booking</button>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function tickSimulation() {
    const u = state.user;
    if (u && u.type === 'held') {
      u.hold--;
      if (u.hold <= 0) {
        state.user = null;
        showToast('Your reservation hold expired.');
      }
      renderActivity();
      if (state.sel === u.sid) renderDetail();
    } else if (u && u.type === 'charging') {
      const st = stationById(u.sid);
      if (st) {
        const kwhPerMin = (u.eff * 0.92) / 60;
        const addPct = (kwhPerMin / (state.veh ? state.veh.kwh : 40)) * 100;
        u.pct = Math.min(u.target, u.pct + addPct);
        u.kwh += kwhPerMin;
        u.cost = u.kwh * st.pricePerKwh;
        u.eta = Math.max(1, Math.ceil((u.target - u.pct) / addPct));

        if (u.pct >= u.target) {
          state.pct = u.target;
          state.user = null;
          showToast(`Charging complete! Battery charged to ${u.target}%. Cost: ₹${Math.round(u.cost)}`, 'success');
        }
      }
      renderActivity();
      renderVehicleChip();
      if (state.sel === u.sid) renderDetail();
    }
  }

  /* ==================== ACTIONS DISPATCHER ==================== */
  const ACT = {
    select(el) {
      const id = el.dataset.id;
      state.sel = id;
      renderList();
      renderDetail();
      if (chargeMapInstance) {
        chargeMapInstance.focusStation(id);
      }
      if (window.innerWidth < 920 && state.view === 'map') {
        ACT.view({ dataset: { v: 'list' } });
      }
    },
    close() {
      state.sel = null;
      renderDetail();
      renderList();
      if (chargeMapInstance) {
        chargeMapInstance.renderStations(state.stations, null);
      }
    },
    view(el) {
      state.view = el.dataset.v;
      $('#app').dataset.view = state.view;
      $$('.tabs button').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.v === state.view));
      });
      if (state.view === 'map' && chargeMapInstance && chargeMapInstance.map) {
        setTimeout(() => chargeMapInstance.map.invalidateSize(), 150);
      }
    },
    tog(el) {
      const k = el.dataset.k;
      state[k] = !state[k];
      el.setAttribute('aria-pressed', String(state[k]));
      renderList();
    },
    clear() {
      state.fit = false;
      state.free = false;
      state.minKw = 0;
      state.q = '';
      state.connector = 'all';
      state.status = 'all';
      $('#q').value = '';
      $('#pw').value = '0';
      $('#selConnector').value = 'all';
      $('#selStatus').value = 'all';
      $$('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      renderList();
    },
    edit(el) {
      const id = el.dataset.id;
      const st = stationById(id);
      if (st) openStationModal(st);
    },
    confirmDelete(el) {
      const id = el.dataset.id;
      openDeleteModal(id);
    },
    addStation() {
      openStationModal(null);
    },
    pickLocation() {
      const modal = $('#stationModal');
      const curLat = parseFloat($('#stLat').value) || 18.5204;
      const curLng = parseFloat($('#stLng').value) || 73.8567;

      // 1. Temporarily hide modal so it no longer blocks Leaflet GIS map interaction
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
      }
      state.isPickingStationLocation = true;

      // Switch to map view on small screens
      if (window.innerWidth < 920) {
        ACT.view({ dataset: { v: 'map' } });
      }

      showToast('Click anywhere on the Pune map to set station coordinates', 'info');

      // 2 & 3. Start coordinate picker on Leaflet GIS map
      chargeMapInstance.startLocationPicker(
        curLat,
        curLng,
        (lat, lng) => {
          state.isPickingStationLocation = false;
          // 4. Automatically populate latitude and longitude fields
          $('#stLat').value = lat;
          $('#stLng').value = lng;

          // 5. Exit map-picking mode and reopen modal with all form values preserved
          if (modal) {
            modal.hidden = false;
            modal.style.display = 'grid';
          }
          showToast(`Selected coordinates: ${lat}, ${lng}`, 'success');
        },
        () => {
          state.isPickingStationLocation = false;
          // 6. Cancellation: Reopen modal with all form values preserved
          if (modal) {
            modal.hidden = false;
            modal.style.display = 'grid';
          }
          showToast('Location selection cancelled', 'info');
        }
      );
    },
    pickUserLocation() {
      if (window.innerWidth < 920) {
        ACT.view({ dataset: { v: 'map' } });
      }
      showToast('Click on the map to set your location pin', 'info');
      chargeMapInstance.startUserLocationPicker(
        (lat, lng) => {
          state.userLocation = { lat, lng, label: 'Your Custom Pin' };
          showToast(`Updated location to (${lat}, ${lng})`, 'success');
          recalculateStationDistances();
          renderList();
          renderKPIs();
        },
        () => {
          showToast('Location selection cancelled', 'info');
        }
      );
    },
    join() {
      const st = currentStation();
      if (!st) return;
      state.user = { type: 'queue', sid: st._id, ahead: st.queue || 0 };
      showToast(`Joined digital queue at ${st.name}`);
      renderActivity();
      renderDetail();
    },
    leave() {
      state.user = null;
      showToast('You left the queue');
      renderActivity();
      renderDetail();
    },
    hold() {
      const st = currentStation();
      if (!st) return;
      const best = getBestPort(st);
      const hm = holdMinutes(st);
      state.user = {
        type: 'held',
        sid: st._id,
        pid: best ? best.id : 1,
        hold: hm,
        max: hm,
      };
      showToast(`Port ${best ? best.id : 1} held for you for ${hm} minutes`);
      renderActivity();
      renderDetail();
    },
    release() {
      state.user = null;
      showToast('Port reservation released');
      renderActivity();
      renderDetail();
    },
    start() {
      const u = state.user;
      if (!u || u.type !== 'held') return;
      const st = stationById(u.sid);
      const best = getBestPort(st) || { kw: 60, type: 'CCS2' };
      const eff = effectiveKw(best);
      const target = Math.max(state.target, Math.min(100, state.pct + 5));
      const kwhNeed = (state.veh ? state.veh.kwh : 40) * ((target - state.pct) / 100);
      const eta = Math.max(1, Math.ceil((kwhNeed / (eff * 0.92)) * 60));

      state.user = {
        type: 'charging',
        sid: st._id,
        pid: u.pid,
        eff: eff,
        start: state.pct,
        pct: state.pct,
        target: target,
        kwh: 0,
        cost: 0,
        eta: eta,
      };
      showToast(`Charging started on Port ${u.pid} at ${eff} kW`);
      renderActivity();
      renderDetail();
    },
    stop() {
      const u = state.user;
      if (!u || u.type !== 'charging') return;
      state.pct = Math.round(u.pct);
      state.user = null;
      showToast(`Charging session completed at ${state.pct}%. Cost: ₹${Math.round(u.cost)}`, 'success');
      renderActivity();
      renderVehicleChip();
      renderDetail();
    },
    book(el) {
      const st = currentStation();
      if (!st) return;
      const slotTime = el.dataset.slot;
      state.user = { type: 'booked', sid: st._id, time: slotTime };
      showToast(`Arrival slot ${slotTime} booked at ${st.name}`);
      renderActivity();
      renderDetail();
    },
    cancelbook() {
      state.user = null;
      showToast('Booking cancelled');
      renderActivity();
      renderDetail();
    },
    veh() {
      initVehicleDropdown();
      const sel = $('#selVeh');
      if (sel && state.veh) {
        sel.value = state.veh.id;
        sel.classList.remove('error');
      }
      const errorEl = $('#vehError');
      if (errorEl) errorEl.style.display = 'none';

      const rng = $('#rngPct');
      if (rng) rng.value = state.pct;

      updateVehicleModalSpecs(state.veh, state.pct);
      const modal = $('#vehModal');
      if (modal) {
        modal.hidden = false;
        modal.style.display = 'grid';
      }
      if (sel) sel.focus();
    },
    vehDismiss() {
      const modal = $('#vehModal');
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
      }
    },
    vehClose() {
      const sel = $('#selVeh');
      const selectedId = sel ? sel.value : '';
      const chosenVeh = VEHICLES.find((v) => v.id === selectedId);

      const errorEl = $('#vehError');
      if (!chosenVeh) {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.textContent = 'Please select a valid EV model from the dropdown.';
        }
        if (sel) {
          sel.classList.add('error');
          sel.focus();
        }
        return;
      }

      if (sel) sel.classList.remove('error');
      if (errorEl) errorEl.style.display = 'none';

      const rng = $('#rngPct');
      const chosenPct = rng ? Math.max(5, Math.min(100, Number(rng.value))) : state.pct;

      // Persist chosen vehicle and battery level to application state
      state.veh = chosenVeh;
      state.pct = chosenPct;
      if (state.target <= state.pct) {
        state.target = Math.min(100, state.pct + 5);
      }

      // Close modal cleanly
      const modal = $('#vehModal');
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
      }

      // Refresh all dependent dashboard & map views
      renderVehicleChip();
      renderList();
      updateEstimator();
      if (chargeMapInstance) {
        chargeMapInstance.renderStations(state.stations, state.sel);
        if (chargeMapInstance.map) chargeMapInstance.map.invalidateSize();
      }

      showToast(`Selected ${chosenVeh.name} (${chosenPct}% battery · ~${rangeKm()} km range)`, 'success');
    },
    recenterPune() {
      if (chargeMapInstance) {
        chargeMapInstance.fitAllStations();
      }
    },
    locateMe() {
      if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser. Using Pune Central.', 'error');
        return;
      }
      showToast('Detecting your GPS location...', 'info');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          state.userLocation = { lat, lng, label: 'Your Current GPS Location' };
          if (chargeMapInstance) {
            chargeMapInstance.setUserLocation(lat, lng, 'You (GPS)');
            chargeMapInstance.map.flyTo([lat, lng], 14);
          }
          showToast(`Located near (${lat}, ${lng})`, 'success');
          recalculateStationDistances();
          renderList();
          renderKPIs();
        },
        (err) => {
          showToast(`Geolocation note: ${err.message}. Showing Pune Central location.`, 'info');
        },
        { timeout: 7000, maximumAge: 60000 }
      );
    },
    seedData() {
      if (confirm('Re-seed Pune database with official demo stations? Existing records will be reset.')) {
        window.api.seedStations().then((res) => {
          showToast(res.message, 'success');
          loadData();
        }).catch((err) => {
          showToast('Database reset fallback to default demo stations.', 'info');
          useFallbackStations();
          recalculateStationDistances();
          renderKPIs();
          renderList();
          if (chargeMapInstance) chargeMapInstance.renderStations(state.stations, null);
        });
      }
    },
  };

  /**
   * Populate vehicle dropdown with placeholder and all supported EV models
   */
  function initVehicleDropdown() {
    const sel = $('#selVeh');
    if (!sel) return;

    let optionsHtml = `<option value="" disabled ${!state.veh ? 'selected' : ''}>Select your EV</option>`;
    optionsHtml += VEHICLES.map((v) => {
      const isSelected = state.veh && state.veh.id === v.id;
      const dcText = v.dc > 0 ? `${v.dc} kW DC` : 'AC only';
      return `<option value="${v.id}" ${isSelected ? 'selected' : ''}>${v.name} (${v.kwh} kWh · ${dcText})</option>`;
    }).join('');

    sel.innerHTML = optionsHtml;
    updateVehicleModalSpecs(state.veh, state.pct);
  }

  /**
   * Dynamically update vehicle specifications and range estimation inside the modal
   */
  function updateVehicleModalSpecs(veh, pct = state.pct) {
    const errorEl = $('#vehError');
    if (errorEl && veh) errorEl.style.display = 'none';

    const specBattery = $('#specBattery');
    const specDc = $('#specDc');
    const specAc = $('#specAc');
    const specConn = $('#specConn');
    const vEstimatedRange = $('#vEstimatedRange');
    const vFullRange = $('#vFullRange');
    const vInfo = $('#vInfo');
    const vPctM = $('#vPctM');
    const rngPct = $('#rngPct');

    if (vPctM) vPctM.textContent = `${Math.round(pct)}%`;
    if (rngPct && Number(rngPct.value) !== pct) rngPct.value = pct;

    if (!veh) {
      if (specBattery) specBattery.textContent = '-- kWh';
      if (specDc) specDc.textContent = '-- kW';
      if (specAc) specAc.textContent = '-- kW';
      if (specConn) specConn.textContent = '--';
      if (vEstimatedRange) vEstimatedRange.textContent = '-- km';
      if (vFullRange) vFullRange.textContent = '-- km';
      if (vInfo) vInfo.textContent = 'Please choose your electric vehicle from the dropdown above.';
      return;
    }

    const currentEstKm = rangeKm(veh, pct);

    if (specBattery) specBattery.textContent = `${veh.kwh} kWh`;
    if (specDc) specDc.textContent = veh.dc > 0 ? `${veh.dc} kW` : 'None (AC only)';
    if (specAc) specAc.textContent = `${veh.ac} kW`;
    if (specConn) specConn.textContent = veh.conn.join(', ');
    if (vEstimatedRange) vEstimatedRange.textContent = `~${currentEstKm} km`;
    if (vFullRange) vFullRange.textContent = `${veh.maxRange} km`;
    if (vInfo) {
      vInfo.innerHTML = `<b>${veh.name}</b> · ${veh.kwh} kWh capacity · Connectors: <b>${veh.conn.join(', ')}</b><br>${veh.description}`;
    }
  }

  /* ==================== GLOBAL MAP INTERFACE ==================== */
  window.selectStationFromMap = function (id) {
    state.sel = id;
    renderList();
    renderDetail();
    if (window.innerWidth < 920 && state.view === 'map') {
      ACT.view({ dataset: { v: 'list' } });
    }
  };

  /* ==================== EVENT LISTENERS ==================== */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'A') return;
    const fn = ACT[el.dataset.act];
    if (fn) fn(el);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.isPickingStationLocation && chargeMapInstance) {
        chargeMapInstance.cancelLocationPicker();
      } else if (chargeMapInstance && chargeMapInstance.isPickingUserLocation) {
        chargeMapInstance.cancelUserLocationPicker();
      } else if (!$('#stationModal').hidden) {
        closeStationModal();
      } else if (!$('#deleteModal').hidden) {
        closeDeleteModal();
      } else if (!$('#vehModal').hidden) {
        ACT.vehDismiss();
      } else if (state.sel) {
        ACT.close();
      }
    }
  });

  // Search input debouncing
  let searchTimeout = null;
  $('#q').addEventListener('input', (e) => {
    state.q = e.target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(renderList, 200);
  });

  // Filter dropdowns
  $('#pw').addEventListener('change', (e) => {
    state.minKw = Number(e.target.value);
    renderList();
  });

  $('#sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    recalculateStationDistances();
    renderList();
  });

  $('#selConnector').addEventListener('change', (e) => {
    state.connector = e.target.value;
    renderList();
  });

  $('#selStatus').addEventListener('change', (e) => {
    state.status = e.target.value;
    renderList();
  });

  // Range and Battery Inputs
  document.addEventListener('input', (e) => {
    const id = e.target.id;
    if (id === 'rngCur') {
      state.pct = Number(e.target.value);
      if (state.target <= state.pct) state.target = Math.min(100, state.pct + 5);
      const tarInput = $('#rngTar');
      if (tarInput) tarInput.value = state.target;
      renderVehicleChip();
      updateEstimator();
      renderList();
    } else if (id === 'rngPct') {
      const val = Number(e.target.value);
      const sel = $('#selVeh');
      const veh = VEHICLES.find((v) => v.id === (sel ? sel.value : '')) || state.veh;
      updateVehicleModalSpecs(veh, val);
    } else if (id === 'rngTar') {
      state.target = Math.max(Number(e.target.value), Math.min(100, state.pct + 5));
      updateEstimator();
    }
  });

  // Car model selection change event
  $('#selVeh').addEventListener('change', (e) => {
    const val = e.target.value;
    const veh = VEHICLES.find((v) => v.id === val);
    const rng = $('#rngPct');
    const currentPct = rng ? Number(rng.value) : state.pct;

    const errorEl = $('#vehError');
    if (veh) {
      if (errorEl) errorEl.style.display = 'none';
      e.target.classList.remove('error');
      updateVehicleModalSpecs(veh, currentPct);
    } else {
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Please select a valid EV model.';
      }
      e.target.classList.add('error');
      updateVehicleModalSpecs(null, currentPct);
    }
  });

  // Form Submissions
  $('#stationForm').addEventListener('submit', handleStationFormSubmit);
  $('#btnCloseModal').addEventListener('click', closeStationModal);
  $('#btnCancelStation').addEventListener('click', closeStationModal);

  const btnCancelMapPicker = $('#btnCancelMapPicker');
  if (btnCancelMapPicker) {
    btnCancelMapPicker.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (state.isPickingStationLocation && chargeMapInstance) {
        chargeMapInstance.cancelLocationPicker();
      } else if (chargeMapInstance && chargeMapInstance.isPickingUserLocation) {
        chargeMapInstance.cancelUserLocationPicker();
      }
    });
  }

  $('#btnCancelDelete').addEventListener('click', closeDeleteModal);
  $('#btnConfirmDelete').addEventListener('click', handleConfirmDelete);

  // Initialize Leaflet Map, Vehicle Dropdown, and App on DOM Ready
  window.addEventListener('DOMContentLoaded', () => {
    // Explicitly ensure all modals and drawer are hidden initially
    const vehModal = $('#vehModal');
    if (vehModal) {
      vehModal.hidden = true;
      vehModal.style.display = 'none';
    }
    const stModal = $('#stationModal');
    if (stModal) {
      stModal.hidden = true;
      stModal.style.display = 'none';
    }
    const delModal = $('#deleteModal');
    if (delModal) {
      delModal.hidden = true;
      delModal.style.display = 'none';
    }
    const detailDrawer = $('#detail');
    if (detailDrawer) {
      detailDrawer.hidden = true;
      detailDrawer.style.display = 'none';
    }

    // Populate vehicle dropdown and vehicle chip
    initVehicleDropdown();
    renderVehicleChip();

    // Initialize GIS Leaflet Map
    chargeMapInstance = new window.ChargeMap('leaflet-map', {
      center: [state.userLocation.lat, state.userLocation.lng],
      zoom: 12,
    });

    chargeMapInstance.onStationSelected = (id) => {
      window.selectStationFromMap(id);
    };

    // Load initial stations from database (or fallback)
    loadData();

    // Attempt automatic geolocation in background with graceful fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          state.userLocation = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            label: 'You (GPS)',
          };
          if (chargeMapInstance) {
            chargeMapInstance.setUserLocation(state.userLocation.lat, state.userLocation.lng, 'You (GPS)');
          }
          recalculateStationDistances();
          renderList();
          renderKPIs();
        },
        () => {
          // Gracefully keep Pune Central
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    }

    // Simulation ticks every 3 seconds
    setInterval(tickSimulation, 3000);
  });
})();
