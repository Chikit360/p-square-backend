const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', async () => {
  console.log('Connected to MongoDB');

  try {
    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    if (collectionNames.length === 0) {
      console.log('No collections found in the database.');
      process.exit(0);
    }

    console.log('Collections found:', collectionNames);

    // Drop each collection
    await Promise.all(collectionNames.map(async (name) => {
      await mongoose.connection.db.dropCollection(name);
      console.log(`Dropped collection: ${name}`);
    }));

    console.log('All collections have been deleted successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error dropping collections:', error);
    process.exit(1);
  }
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});
