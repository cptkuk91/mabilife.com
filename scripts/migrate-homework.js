const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function migrateHomework() {
  try {
    const url = process.env.MONGODB_URL;
    if (!url) throw new Error('No Mongo URL found in .env');

    console.log('Connecting to DB...');
    await mongoose.connect(url);
    console.log('Connected.');
    
    const collection = mongoose.connection.collection('homeworks');
    
    // Update all documents to have the new weekly structure
    const result = await collection.updateMany(
      {},
      {
        $set: {
          'weekly.barrier': 0,
          'weekly.blackHole': 0,
          'weekly.fieldBoss': 0,
          'weekly.abyss': 0,
          'weekly.raid': 0,
        },
        $unset: {
          'weekly.weeklyMission': '',
          'weekly.guildMission': '',
          'weekly.fieldBosses': '',
          'weekly.sunkenRuins': '',
          'weekly.collapsedAltar': '',
          'weekly.hallOfDestruction': '',
          'weekly.glasGhaibhleann': '',
          'weekly.guardian': '',
          'weekly.bellast': '',
          'weekly.weeklyShop': '',
          'weekly.advancedSeal': '',
          'daily.blackHole': '',
          'daily.summoningBadge': '',
          'daily.tower': '',
          'daily.crystalBox': '',
          'daily.fergusOre': '',
          'daily.endelyonHolyWater': '',
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} documents.`);
    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

migrateHomework();
