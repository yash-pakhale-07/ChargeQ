/**
 * Pune EV ChargeMap - Leaflet GIS Integration
 * Real-world OpenStreetMap GIS mapping with custom markers and interactive location picking
 */

class ChargeMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.defaultCenter = options.center || [18.5204, 73.8567]; // Pune Central
    this.defaultZoom = options.zoom || 12;
    this.map = null;
    this.markersGroup = null;
    this.userMarker = null;
    this.pickerMarker = null;
    this.isPickingLocation = false;
    this.isPickingUserLocation = false;
    this.onLocationPicked = null;
    this.onUserLocationPicked = null;
    this.onStationSelected = null;
    this.selectedStationId = null;
    this.stations = [];

    this.init();
  }

  init() {
    if (!window.L) {
      console.error('Leaflet is not loaded!');
      return;
    }

    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Map container #${this.containerId} not found in DOM!`);
      return;
    }

    // Initialize Leaflet map
    this.map = L.map(this.containerId, {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      zoomControl: true,
      minZoom: 9,
      maxZoom: 19,
    });

    // Add standard OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);

    // Default Pune User Marker
    this.setUserLocation(this.defaultCenter[0], this.defaultCenter[1], 'Pune Center (Default)');

    // Ensure map tiles recalculate correctly after initial layout
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 250);
  }

  /**
   * Set user's current GPS / reference location on the map
   */
  setUserLocation(lat, lng, label = 'You') {
    if (!this.map) return;
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div class="user-pin" title="${label}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    this.userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
      .bindTooltip(`📍 ${label}`, { permanent: false, direction: 'top' })
      .addTo(this.map);
  }

  /**
   * Render or update all station markers from database records
   * @param {Array} stations
   * @param {string|null} selectedId
   */
  renderStations(stations, selectedId = null) {
    if (!this.map || !this.markersGroup) return;
    this.stations = stations || [];
    this.selectedStationId = selectedId;
    this.markersGroup.clearLayers();

    this.stations.forEach((st) => {
      if (!st.latitude || !st.longitude) return;

      const isSelected = selectedId && (st._id === selectedId || st.id === selectedId);
      
      // Determine status kind
      let kind = 'good';
      let countText = st.availableChargers !== undefined ? st.availableChargers : 0;

      if (st.status === 'Maintenance') {
        kind = 'off';
        countText = 'M';
      } else if (st.status === 'Offline') {
        kind = 'off';
        countText = '×';
      } else if (st.availableChargers === 0) {
        kind = 'bad';
        countText = '0';
      } else if (st.availableChargers <= 1) {
        kind = 'warn';
        countText = st.availableChargers;
      }

      const iconHtml = `
        <div class="pin-container ${isSelected ? 'selected' : ''}">
          <div class="pin-bubble pin-${kind}">
            <span>${countText}</span>
          </div>
          <span class="pin-tag">${st.short || st.name.split(' ')[0]}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-station-pin',
        html: iconHtml,
        iconSize: [60, 48],
        iconAnchor: [30, 24],
      });

      const marker = L.marker([st.latitude, st.longitude], {
        icon: customIcon,
        riseOnHover: true,
      });

      // Marker popup content
      const popupContent = `
        <div style="font-family: var(--f-body); min-width: 200px;">
          <b style="font-size: 14px; display: block; margin-bottom: 2px;">${st.name}</b>
          <div style="font-size: 12px; color: #555; margin-bottom: 6px;">${st.area} · <span style="font-weight: 700; color: #111;">₹${st.pricePerKwh}/kWh</span></div>
          <div style="font-size: 11.5px; margin-bottom: 8px;">
            <span style="font-weight: 700;">${st.chargingSpeed || 60} kW</span> · ${(st.connectorTypes || []).join(', ')}
          </div>
          <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
            Distance: <b>${st.dist !== undefined ? `${st.dist} km` : 'Calculating...'}</b>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="pill ${kind}" style="font-size: 10.5px;">${st.status === 'Operational' ? `${st.availableChargers}/${st.totalChargers} Free` : st.status}</span>
            <button class="btn sm primary" style="min-height: 28px; padding: 0 10px; font-size: 11.5px;" onclick="window.selectStationFromMap('${st._id || st.id}')">View Details</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { offset: [0, -18] });

      marker.on('click', (e) => {
        if (this.isPickingLocation && this._mapPickerClickHandler) {
          this._mapPickerClickHandler({ latlng: { lat: st.latitude, lng: st.longitude } });
          if (e && e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          return;
        }
        if (this.onStationSelected) {
          this.onStationSelected(st._id || st.id);
        }
      });

      this.markersGroup.addLayer(marker);
    });
  }

  /**
   * Focus/Pan to a specific station on the map
   */
  focusStation(id) {
    if (!this.map) return;
    const st = this.stations.find((s) => s._id === id || s.id === id);
    if (st && st.latitude && st.longitude) {
      this.map.flyTo([st.latitude, st.longitude], 15, {
        animate: true,
        duration: 0.8,
      });
      this.selectedStationId = id;
      this.renderStations(this.stations, id);
    }
  }

  /**
   * Reset view to show all Pune stations
   */
  fitAllStations() {
    if (!this.map) return;
    if (!this.stations.length) {
      this.map.flyTo(this.defaultCenter, this.defaultZoom);
      return;
    }
    const bounds = L.latLngBounds(
      this.stations
        .filter((s) => s.latitude && s.longitude)
        .map((s) => [s.latitude, s.longitude])
    );
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }

  /**
   * Enable interactive map click mode for selecting station coordinates
   */
  startLocationPicker(initialLat, initialLng, callback, onCancel = null) {
    this.isPickingLocation = true;
    this.onLocationPicked = callback;
    this.onLocationPickerCancel = onCancel;

    if (this.map && this.map.getContainer()) {
      this.map.getContainer().style.cursor = 'crosshair';
    }

    const banner = document.getElementById('mapPickerBanner');
    if (banner) {
      const bannerText = document.getElementById('mapPickerBannerText');
      if (bannerText) {
        bannerText.textContent = '📍 Click anywhere on the Pune map to set station coordinates';
      } else {
        banner.textContent = '📍 Click anywhere on the Pune map to set station coordinates';
      }
      banner.hidden = false;
      banner.style.display = 'flex';
      if (window.L && L.DomEvent) {
        L.DomEvent.disableClickPropagation(banner);
      }
    }

    if (initialLat && initialLng) {
      this.setPickerLocation(initialLat, initialLng);
      this.map.panTo([initialLat, initialLng]);
    }

    // Remove any previous temporary listener
    if (this._mapPickerClickHandler && this.map) {
      this.map.off('click', this._mapPickerClickHandler);
      this._mapPickerClickHandler = null;
    }

    // Attach temporary map click listener
    this._mapPickerClickHandler = (e) => {
      const { lat, lng } = e.latlng;
      const formattedLat = Number(lat.toFixed(5));
      const formattedLng = Number(lng.toFixed(5));
      this.setPickerLocation(formattedLat, formattedLng);
      const cb = this.onLocationPicked;
      this.stopLocationPicker(false);
      if (cb) {
        cb(formattedLat, formattedLng);
      }
    };

    this.map.on('click', this._mapPickerClickHandler);

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 50);
  }

  /**
   * Disable interactive map click mode for station
   */
  stopLocationPicker(removeMarker = true) {
    // Remove temporary map event listener
    if (this._mapPickerClickHandler && this.map) {
      this.map.off('click', this._mapPickerClickHandler);
      this._mapPickerClickHandler = null;
    }

    this.isPickingLocation = false;
    this.onLocationPicked = null;
    this.onLocationPickerCancel = null;

    if (this.map && this.map.getContainer()) {
      this.map.getContainer().style.cursor = '';
    }

    const banner = document.getElementById('mapPickerBanner');
    if (banner) {
      banner.hidden = true;
      banner.style.display = 'none';
    }

    if (removeMarker && this.pickerMarker && this.map) {
      this.map.removeLayer(this.pickerMarker);
      this.pickerMarker = null;
    }

    if (this.map) {
      this.map.invalidateSize();
    }
  }

  /**
   * Cancel location picking
   */
  cancelLocationPicker() {
    const cancelCb = this.onLocationPickerCancel;
    this.stopLocationPicker(true);
    if (cancelCb) {
      cancelCb();
    }
  }

  /**
   * Clear any placed picker marker
   */
  clearPickerMarker() {
    if (this.pickerMarker && this.map) {
      this.map.removeLayer(this.pickerMarker);
      this.pickerMarker = null;
    }
  }

  /**
   * Enable manual user location picker on map
   */
  startUserLocationPicker(callback, onCancel = null) {
    this.stopLocationPicker(true);
    this.isPickingUserLocation = true;
    this.onUserLocationPicked = callback;
    this.onUserLocationPickerCancel = onCancel;

    if (this.map && this.map.getContainer()) {
      this.map.getContainer().style.cursor = 'crosshair';
    }

    const banner = document.getElementById('mapPickerBanner');
    if (banner) {
      const bannerText = document.getElementById('mapPickerBannerText');
      if (bannerText) {
        bannerText.textContent = '📍 Click anywhere on Pune map to set your location';
      } else {
        banner.textContent = '📍 Click anywhere on Pune map to set your location';
      }
      banner.hidden = false;
      banner.style.display = 'flex';
      if (window.L && L.DomEvent) {
        L.DomEvent.disableClickPropagation(banner);
      }
    }

    if (this._userPickerClickHandler && this.map) {
      this.map.off('click', this._userPickerClickHandler);
      this._userPickerClickHandler = null;
    }

    this._userPickerClickHandler = (e) => {
      const { lat, lng } = e.latlng;
      const formattedLat = Number(lat.toFixed(5));
      const formattedLng = Number(lng.toFixed(5));
      this.setUserLocation(formattedLat, formattedLng, 'You (Custom Location)');
      const cb = this.onUserLocationPicked;
      this.stopUserLocationPicker();
      if (cb) {
        cb(formattedLat, formattedLng);
      }
    };

    this.map.on('click', this._userPickerClickHandler);

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 50);
  }

  stopUserLocationPicker() {
    if (this._userPickerClickHandler && this.map) {
      this.map.off('click', this._userPickerClickHandler);
      this._userPickerClickHandler = null;
    }

    this.isPickingUserLocation = false;
    this.onUserLocationPicked = null;
    this.onUserLocationPickerCancel = null;

    if (this.map && this.map.getContainer()) {
      this.map.getContainer().style.cursor = '';
    }

    const banner = document.getElementById('mapPickerBanner');
    if (banner) {
      banner.hidden = true;
      banner.style.display = 'none';
    }

    if (this.map) {
      this.map.invalidateSize();
    }
  }

  cancelUserLocationPicker() {
    const cancelCb = this.onUserLocationPickerCancel;
    this.stopUserLocationPicker();
    if (cancelCb) {
      cancelCb();
    }
  }

  /**
   * Place or drag picker marker
   */
  setPickerLocation(lat, lng) {
    if (!this.map) return;
    const formattedLat = Number(Number(lat).toFixed(5));
    const formattedLng = Number(Number(lng).toFixed(5));

    if (this.pickerMarker) {
      this.pickerMarker.setLatLng([formattedLat, formattedLng]);
    } else {
      const pickerIcon = L.divIcon({
        className: 'picker-pin-wrapper',
        html: `<div class="picker-pin">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      this.pickerMarker = L.marker([formattedLat, formattedLng], {
        icon: pickerIcon,
        draggable: true,
      }).addTo(this.map);

      this.pickerMarker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        if (this.onLocationPicked) {
          this.onLocationPicked(Number(position.lat.toFixed(5)), Number(position.lng.toFixed(5)));
        }
      });
    }
  }
}

window.ChargeMap = ChargeMap;
