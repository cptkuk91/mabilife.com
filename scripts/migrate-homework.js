const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

// Get current weekly reset time (Monday 6AM KST)
function getWeeklyResetTime() {
  const now = new Date();
  const nowUnix = now.getTime();
  const kstUnix = nowUnix + (9 * 60 * 60 * 1000);
  const kstDate = new Date(kstUnix);
  
  const kstDay = kstDate.getUTCDay(); // 0-6
  const kstHour = kstDate.getUTCHours();
  
  let daysToSubtract = (kstDay + 6) % 7; // Mon->0
  if (kstDay === 1 && kstHour < 6) {
    daysToSubtract = 7;
  }
  
  const kstReset = new Date(kstDate);
  kstReset.setUTCDate(kstDate.getUTCDate() - daysToSubtract);
  kstReset.setUTCHours(6, 0, 0, 0);
  
  return new Date(kstReset.getTime() - (9 * 60 * 60 * 1000));
}

// Get current daily reset time (6AM KST)
function getDailyResetTime() {
  const now = new Date();
  const nowUnix = now.getTime();
  const kstUnix = nowUnix + (9 * 60 * 60 * 1000);
  const kstDate = new Date(kstUnix);
  
  const kstHour = kstDate.getUTCHours();
  
  const kstReset = new Date(kstDate);
  if (kstHour < 6) {
    kstReset.setUTCDate(kstDate.getUTCDate() - 1);
  }
  kstReset.setUTCHours(6, 0, 0, 0);
  
  return new Date(kstReset.getTime() - (9 * 60 * 60 * 1000));
}

async function migrateHomework() {
  try {
    const url = process.env.MONGODB_URL;
    if (!url) throw new Error('No Mongo URL found in .env');

    console.log('Connecting to DB...');
    await mongoose.connect(url);
    console.log('Connected.');
    
    const collection = mongoose.connection.collection('homeworks');
    
    const currentWeeklyReset = getWeeklyResetTime();
    const currentDailyReset = getDailyResetTime();
    
    console.log('Current Weekly Reset:', currentWeeklyReset);
    console.log('Current Daily Reset:', currentDailyReset);
    
    // Update all documents to have the new weekly structure AND correct reset dates
    const result = await collection.updateMany(
      {},
      {
        $set: {
          'weekly.barrier': 0,
          'weekly.blackHole': 0,
          'weekly.fieldBoss': 0,
          'weekly.abyss': 0,
          'weekly.raid': 0,
          'daily.dailyMission': false,
          'daily.dailyDungeon': false,
          'daily.silverCoin': false,
          'daily.deepDungeon': false,
          'daily.partTimeJob': false,
          'daily.dailyGift': false,
          'daily.gemBox': false,
          'weekStartDate': currentWeeklyReset,
          'lastDailyReset': currentDailyReset,
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
