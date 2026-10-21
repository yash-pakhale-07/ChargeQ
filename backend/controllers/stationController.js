const Station = require('../models/Station');
const demoStations = require('../seed/seedData');

// Haversine formula to compute great-circle distance in kilometers
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
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

// @desc    Get all stations with optional search, filters, sorting & distance
// @route   GET /api/stations
exports.getStations = async (req, res, next) => {
  try {
    const {
      q,
      status,
      connectorType,
      minKw,
      onlyAvailable,
      maxPrice,
      userLat,
      userLng,
      sort,
    } = req.query;

    const query = {};

    // Search query for name, short, address, area
    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [{ name: regex }, { short: regex }, { address: regex }, { area: regex }];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Connector type filter
    if (connectorType && connectorType !== 'all') {
      query.connectorTypes = connectorType;
    }

    // Minimum power filter
    if (minKw && Number(minKw) > 0) {
      query.chargingSpeed = { $gte: Number(minKw) };
    }

    // Only available chargers
    if (onlyAvailable === 'true') {
      query.availableChargers = { $gt: 0 };
      query.status = 'Operational';
    }

    // Max price filter
    if (maxPrice && Number(maxPrice) > 0) {
      query.pricePerKwh = { $lte: Number(maxPrice) };
    }

    let stations = await Station.find(query).lean();

    // Default Pune user reference (e.g. Pune Central / Shivajinagar 18.5308, 73.8475)
    const refLat = userLat ? Number(userLat) : 18.5204;
    const refLng = userLng ? Number(userLng) : 73.8567;

    // Attach computed distance & estimated drive time
    stations = stations.map((st) => {
      const dist = calculateHaversineKm(refLat, refLng, st.latitude, st.longitude);
      const drive = Math.max(3, Math.round(dist * 2.5)); // rough city driving estimate
      return {
        ...st,
        dist,
        drive,
      };
    });

    // Sorting
    if (sort === 'near') {
      stations.sort((a, b) => a.dist - b.dist);
    } else if (sort === 'price') {
      stations.sort((a, b) => a.pricePerKwh - b.pricePerKwh);
    } else if (sort === 'power') {
      stations.sort((a, b) => b.chargingSpeed - a.chargingSpeed);
    } else if (sort === 'name') {
      stations.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Default: operational first, then near
      stations.sort((a, b) => {
        if (a.status === 'Operational' && b.status !== 'Operational') return -1;
        if (a.status !== 'Operational' && b.status === 'Operational') return 1;
        return a.dist - b.dist;
      });
    }

    res.json({
      success: true,
      count: stations.length,
      data: stations,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard metrics dynamically from MongoDB
// @route   GET /api/stations/stats/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const stations = await Station.find().lean();

    let totalStations = stations.length;
    let availableChargers = 0;
    let occupiedChargers = 0;
    let fastChargers = 0;
    let operationalStations = 0;
    let maintenanceStations = 0;
    let offlineStations = 0;
    let totalPrice = 0;

    stations.forEach((st) => {
      if (st.status === 'Operational') {
        operationalStations++;
        availableChargers += st.availableChargers || 0;
        occupiedChargers += st.occupiedChargers || 0;
      } else if (st.status === 'Maintenance') {
        maintenanceStations++;
      } else {
        offlineStations++;
      }

      totalPrice += st.pricePerKwh || 0;

      // Count fast chargers (charging speed >= 50 kW or ports with >= 50 kW)
      if (st.ports && st.ports.length > 0) {
        fastChargers += st.ports.filter((p) => p.kw >= 50).length;
      } else if (st.chargingSpeed >= 50) {
        fastChargers += st.totalChargers || 0;
      }
    });

    const averagePrice = totalStations > 0 ? (totalPrice / totalStations).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        totalStations,
        availableChargers,
        occupiedChargers,
        fastChargers,
        operationalStations,
        maintenanceStations,
        offlineStations,
        averagePrice: Number(averagePrice),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single station by ID
// @route   GET /api/stations/:id
exports.getStationById = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: `Station with ID ${req.params.id} not found`,
      });
    }
    res.json({
      success: true,
      data: station,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new charging station
// @route   POST /api/stations
exports.createStation = async (req, res, next) => {
  try {
    const {
      name,
      short,
      address,
      area,
      latitude,
      longitude,
      connectorTypes,
      chargingSpeed,
      totalChargers,
      availableChargers,
      pricePerKwh,
      idleFeePerMin,
      status,
      amenities,
    } = req.body;

    // Validate required fields
    if (!name || !address || !area || latitude === undefined || longitude === undefined || !chargingSpeed || !totalChargers || pricePerKwh === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, address, area, latitude, longitude, chargingSpeed, totalChargers, and pricePerKwh',
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.',
      });
    }

    // Normalize connectorTypes
    let connectors = connectorTypes;
    if (typeof connectorTypes === 'string') {
      connectors = connectorTypes.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (!connectors || connectors.length === 0) {
      connectors = ['CCS2'];
    }

    // Build ports based on totalChargers and connectors
    const numChargers = Number(totalChargers) || 2;
    const speed = Number(chargingSpeed) || 60;
    const availCount = availableChargers !== undefined ? Math.min(Number(availableChargers), numChargers) : Math.ceil(numChargers / 2);
    const stat = status || 'Operational';

    const ports = [];
    for (let i = 1; i <= numChargers; i++) {
      const type = connectors[(i - 1) % connectors.length];
      const isFree = i <= availCount && stat === 'Operational';
      ports.push({
        id: i,
        type: type,
        kw: speed,
        st: stat !== 'Operational' ? 'off' : isFree ? 'free' : 'busy',
        rem: isFree ? 0 : Math.floor(Math.random() * 25) + 10,
      });
    }

    // Amenities parsing
    let parsedAmenities = amenities;
    if (typeof amenities === 'string') {
      parsedAmenities = amenities.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (!parsedAmenities || parsedAmenities.length === 0) {
      parsedAmenities = ['Restroom', 'Covered bays'];
    }

    const station = await Station.create({
      name: name.trim(),
      short: short && short.trim() ? short.trim() : name.trim().split(' ')[0],
      address: address.trim(),
      area: area.trim(),
      latitude: lat,
      longitude: lng,
      connectorTypes: connectors,
      chargingSpeed: speed,
      totalChargers: numChargers,
      availableChargers: stat === 'Operational' ? availCount : 0,
      occupiedChargers: stat === 'Operational' ? numChargers - availCount : 0,
      pricePerKwh: Number(pricePerKwh),
      idleFeePerMin: idleFeePerMin !== undefined ? Number(idleFeePerMin) : 2.0,
      status: stat,
      amenities: parsedAmenities,
      ports,
      isDemo: false, // user added stations are live/real operator stations!
    });

    res.status(201).json({
      success: true,
      message: 'Charging station created successfully',
      data: station,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update existing charging station
// @route   PUT /api/stations/:id
exports.updateStation = async (req, res, next) => {
  try {
    let station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: `Station with ID ${req.params.id} not found`,
      });
    }

    const {
      name,
      short,
      address,
      area,
      latitude,
      longitude,
      connectorTypes,
      chargingSpeed,
      totalChargers,
      availableChargers,
      pricePerKwh,
      idleFeePerMin,
      status,
      amenities,
    } = req.body;

    if (name) station.name = name.trim();
    if (short) station.short = short.trim();
    if (address) station.address = address.trim();
    if (area) station.area = area.trim();
    if (status) station.status = status;

    if (latitude !== undefined) station.latitude = Number(latitude);
    if (longitude !== undefined) station.longitude = Number(longitude);
    if (latitude !== undefined && longitude !== undefined) {
      station.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    if (pricePerKwh !== undefined) station.pricePerKwh = Number(pricePerKwh);
    if (idleFeePerMin !== undefined) station.idleFeePerMin = Number(idleFeePerMin);
    if (chargingSpeed !== undefined) station.chargingSpeed = Number(chargingSpeed);

    if (connectorTypes) {
      let connectors = connectorTypes;
      if (typeof connectorTypes === 'string') {
        connectors = connectorTypes.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (connectors.length > 0) station.connectorTypes = connectors;
    }

    if (amenities) {
      let parsed = amenities;
      if (typeof amenities === 'string') {
        parsed = amenities.split(',').map((s) => s.trim()).filter(Boolean);
      }
      station.amenities = parsed;
    }

    // If totalChargers or availableChargers changed, rebuild/update ports
    if (totalChargers !== undefined || availableChargers !== undefined || chargingSpeed !== undefined) {
      const numChargers = totalChargers !== undefined ? Number(totalChargers) : station.totalChargers;
      const speed = station.chargingSpeed;
      const connectors = station.connectorTypes;
      const availCount = availableChargers !== undefined ? Math.min(Number(availableChargers), numChargers) : Math.min(station.availableChargers, numChargers);

      station.totalChargers = numChargers;
      station.ports = [];
      for (let i = 1; i <= numChargers; i++) {
        const type = connectors[(i - 1) % connectors.length];
        const isFree = i <= availCount && station.status === 'Operational';
        station.ports.push({
          id: i,
          type: type,
          kw: speed,
          st: station.status !== 'Operational' ? 'off' : isFree ? 'free' : 'busy',
          rem: isFree ? 0 : Math.floor(Math.random() * 25) + 10,
        });
      }
      station.availableChargers = station.status === 'Operational' ? availCount : 0;
      station.occupiedChargers = station.status === 'Operational' ? numChargers - availCount : 0;
    }

    await station.save();

    res.json({
      success: true,
      message: 'Charging station updated successfully',
      data: station,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete charging station
// @route   DELETE /api/stations/:id
exports.deleteStation = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: `Station with ID ${req.params.id} not found`,
      });
    }

    await Station.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Station "${station.name}" deleted successfully`,
      data: { id: req.params.id, name: station.name },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset or Seed demo stations
// @route   POST /api/stations/seed
exports.seedStations = async (req, res, next) => {
  try {
    await Station.deleteMany({});
    const created = await Station.create(demoStations);
    res.json({
      success: true,
      message: `Successfully seeded ${created.length} demo stations in Pune`,
      count: created.length,
      data: created,
    });
  } catch (err) {
    next(err);
  }
};
