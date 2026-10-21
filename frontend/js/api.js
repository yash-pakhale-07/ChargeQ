/**
 * Pune EV ChargeMap - REST API Client
 * Interacts with Node.js & Express backend backed by MongoDB
 */
const API_BASE = '/api/stations';

const api = {
  /**
   * Fetch all charging stations with optional query parameters
   * @param {Object} params - { q, status, connectorType, minKw, onlyAvailable, userLat, userLng, sort }
   */
  async getStations(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });

    const url = `${API_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch stations (${res.status})`);
    }
    return await res.json();
  },

  /**
   * Fetch dynamic dashboard stats from MongoDB
   */
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/stats/dashboard`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch dashboard metrics');
    }
    return await res.json();
  },

  /**
   * Fetch a single station by its MongoDB _id
   * @param {string} id
   */
  async getStationById(id) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Station not found (${id})`);
    }
    return await res.json();
  },

  /**
   * Create a new charging station in MongoDB
   * @param {Object} data
   */
  async createStation(data) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.message || `Failed to create station (${res.status})`);
    }
    return result;
  },

  /**
   * Update an existing charging station in MongoDB
   * @param {string} id
   * @param {Object} data
   */
  async updateStation(id, data) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.message || `Failed to update station (${res.status})`);
    }
    return result;
  },

  /**
   * Delete a charging station from MongoDB
   * @param {string} id
   */
  async deleteStation(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.message || `Failed to delete station (${res.status})`);
    }
    return result;
  },

  /**
   * Re-seed demo stations in Pune
   */
  async seedStations() {
    const res = await fetch(`${API_BASE}/seed`, {
      method: 'POST',
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.message || 'Failed to re-seed demo stations');
    }
    return result;
  },
};

window.api = api;
