const mongoose = require('mongoose');

const PortSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T'],
      default: 'CCS2',
    },
    kw: { type: Number, required: true, min: 1 },
    st: {
      type: String,
      enum: ['free', 'busy', 'held', 'off'],
      default: 'free',
    },
    rem: { type: Number, default: 0 }, // remaining minutes if busy
    hold: { type: Number, default: 0 }, // hold minutes if held
  },
  { _id: false }
);

const StationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Station name is required'],
      trim: true,
      maxlength: [120, 'Station name cannot exceed 120 characters'],
    },
    short: {
      type: String,
      trim: true,
      default: function () {
        return this.name ? this.name.split(' ')[0] : 'Station';
      },
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    area: {
      type: String,
      required: [true, 'Area / Locality is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be >= -90'],
      max: [90, 'Latitude must be <= 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be >= -180'],
      max: [180, 'Longitude must be <= 180'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere',
      },
    },
    connectorTypes: {
      type: [String],
      required: [true, 'At least one connector type is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one connector type is required',
      },
    },
    chargingSpeed: {
      type: Number,
      required: [true, 'Charging speed (max kW) is required'],
      min: [1, 'Charging speed must be at least 1 kW'],
    },
    totalChargers: {
      type: Number,
      required: [true, 'Total chargers count is required'],
      min: [1, 'Must have at least 1 charger'],
    },
    availableChargers: {
      type: Number,
      default: 0,
      min: [0, 'Available chargers cannot be negative'],
    },
    occupiedChargers: {
      type: Number,
      default: 0,
      min: [0, 'Occupied chargers cannot be negative'],
    },
    pricePerKwh: {
      type: Number,
      required: [true, 'Price per kWh is required'],
      min: [0, 'Price must be 0 or positive'],
    },
    idleFeePerMin: {
      type: Number,
      default: 2,
      min: [0, 'Idle fee must be 0 or positive'],
    },
    status: {
      type: String,
      enum: ['Operational', 'Maintenance', 'Offline'],
      default: 'Operational',
    },
    amenities: {
      type: [String],
      default: ['Restroom', 'Café', 'Covered bays'],
    },
    ports: [PortSchema],
    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to keep location.coordinates, short name, and port counts in sync
StationSchema.pre('validate', function (next) {
  if (this.longitude !== undefined && this.latitude !== undefined) {
    this.location = {
      type: 'Point',
      coordinates: [Number(this.longitude), Number(this.latitude)],
    };
  }

  if (!this.short && this.name) {
    this.short = this.name.split(' ')[0];
  }

  // Ensure ports exist and match totalChargers
  if (!this.ports || this.ports.length === 0) {
    const defaultType = this.connectorTypes && this.connectorTypes.length > 0 ? this.connectorTypes[0] : 'CCS2';
    const total = this.totalChargers || 2;
    const avail = Math.min(this.availableChargers !== undefined ? this.availableChargers : Math.ceil(total / 2), total);
    
    this.ports = [];
    for (let i = 1; i <= total; i++) {
      const type = this.connectorTypes && this.connectorTypes.length > 0
        ? this.connectorTypes[(i - 1) % this.connectorTypes.length]
        : defaultType;
      const isFree = i <= avail && this.status === 'Operational';
      this.ports.push({
        id: i,
        type: type,
        kw: this.chargingSpeed || 60,
        st: this.status !== 'Operational' ? 'off' : (isFree ? 'free' : 'busy'),
        rem: isFree ? 0 : Math.floor(Math.random() * 30) + 10,
      });
    }
  }

  // Calculate availableChargers and occupiedChargers from ports
  if (this.ports && this.ports.length > 0) {
    this.totalChargers = this.ports.length;
    if (this.status !== 'Operational') {
      this.availableChargers = 0;
      this.occupiedChargers = 0;
    } else {
      this.availableChargers = this.ports.filter(p => p.st === 'free').length;
      this.occupiedChargers = this.ports.filter(p => p.st === 'busy' || p.st === 'held').length;
    }
  }

  next();
});

module.exports = mongoose.model('Station', StationSchema);
