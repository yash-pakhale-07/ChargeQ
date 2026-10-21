require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const stationRoutes = require('./routes/stationRoutes');
const errorHandler = require('./middleware/errorHandler');
const Station = require('./models/Station');
const demoStations = require('./seed/seedData');

const app = express();

// Connect to MongoDB
connectDB().then(async () => {
  try {
    const count = await Station.countDocuments();
    if (count === 0) {
      console.log('[Auto-Seed] Station collection is empty. Seeding initial Pune demo stations...');
      await Station.create(demoStations);
      console.log(`[Auto-Seed] Successfully seeded ${demoStations.length} Pune demo stations.`);
    } else {
      console.log(`[Database] Found ${count} existing stations in database.`);
    }
  } catch (seedErr) {
    console.error('[Auto-Seed Error]', seedErr.message);
  }
});

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigins === '*' ? '*' : allowedOrigins.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/stations', stationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend');
const rootPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));
app.use('/frontend', express.static(frontendPath));
app.use(express.static(rootPath));

// Fallback to frontend index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ Pune EV ChargeMap Server running on http://localhost:${PORT}`);
  console.log(`📍 REST API available at http://localhost:${PORT}/api/stations`);
  console.log(`🗺️  GIS Frontend available at http://localhost:${PORT}`);
  console.log(`====================================================`);
});

module.exports = { app, server };
