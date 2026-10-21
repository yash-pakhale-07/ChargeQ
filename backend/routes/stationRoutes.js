const express = require('express');
const router = express.Router();
const {
  getStations,
  getDashboardStats,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  seedStations,
} = require('../controllers/stationController');

// Stats route must be placed before :id route
router.get('/stats/dashboard', getDashboardStats);
router.post('/seed', seedStations);

router.route('/')
  .get(getStations)
  .post(createStation);

router.route('/:id')
  .get(getStationById)
  .put(updateStation)
  .delete(deleteStation);

module.exports = router;
