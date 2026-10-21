require('dotenv').config();
const mongoose = require('mongoose');
const Station = require('../models/Station');
const demoStations = require('./seedData');

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pune_ev_chargemap';
    await mongoose.connect(mongoURI);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Remove existing demo stations or clear collection
    const deleted = await Station.deleteMany({});
    console.log(`[Seed] Cleared ${deleted.deletedCount} existing station records.`);

    // Insert new stations
    const created = await Station.create(demoStations);
    console.log(`[Seed] Successfully inserted ${created.length} Pune EV charging stations!`);
    console.log('[Seed] Seeded areas:', created.map(s => s.area).join(', '));

    if (require.main === module) {
      await mongoose.connection.close();
      console.log('[Seed] MongoDB connection closed.');
      process.exit(0);
    }
    return created;
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = seedDB;
