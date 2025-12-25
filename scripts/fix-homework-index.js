
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function fixIndex() {
  try {
    const url = process.env.MONGODB_URL;
    if (!url) throw new Error('No Mongo URL found in .env');

    console.log('Connecting to DB...');
    await mongoose.connect(url);
    console.log('Connected.');
    
    const collection = mongoose.connection.collection('homeworks');
    
    // Drop the problematic single index
    try {
      await collection.dropIndex('userId_1');
      console.log('Successfully dropped index: userId_1');
    } catch (e) {
      console.log('Could not drop userId_1 (may not exist):', e.message);
    }

    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

fixIndex();
