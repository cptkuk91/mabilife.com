
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Homework } from "@/models/Homework";
import { IHomeworkData } from "@/types/homework";

// Helper to get the most recent reset time (Monday 6AM KST)
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
  kstReset.setUTCMinutes(0, 0, 0);
  
  return new Date(kstReset.getTime() - (9 * 60 * 60 * 1000));
}

// Helper for Daily Reset (6AM KST)
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
  kstReset.setUTCMinutes(0, 0, 0);
  
  return new Date(kstReset.getTime() - (9 * 60 * 60 * 1000));
}

// Ensure reset logic is applied to a homework doc
async function checkAndReset(homework: any) {
    const currentWeeklyReset = getWeeklyResetTime();
    const currentDailyReset = getDailyResetTime();
    let needsSave = false;
    
    console.log('[checkAndReset] Current Weekly Reset:', currentWeeklyReset);
    console.log('[checkAndReset] Current Daily Reset:', currentDailyReset);
    console.log('[checkAndReset] Homework weekStartDate:', homework.weekStartDate);
    console.log('[checkAndReset] Homework lastDailyReset:', homework.lastDailyReset);
    
    // Check Weekly Reset
    if (new Date(homework.weekStartDate).getTime() < currentWeeklyReset.getTime()) {
      console.log('[checkAndReset] WEEKLY RESET TRIGGERED!');
      homework.weekly = {
          barrier: false,
          blackHole: false,
          fieldBoss: false,
          abyss: false,
          raid: false,
      };
      // Reset daily too
      homework.daily = {
          dailyMission: false,
          dailyDungeon: false,
          silverCoin: false,
          deepDungeon: false,
          partTimeJob: false,
          dailyGift: false,
          gemBox: false,
      };
      
      homework.weekStartDate = currentWeeklyReset;
      homework.lastDailyReset = currentDailyReset;
      needsSave = true;
    } 
    // Check Daily Reset
    else if (new Date(homework.lastDailyReset).getTime() < currentDailyReset.getTime()) {
      console.log('[checkAndReset] DAILY RESET TRIGGERED!');
      homework.daily = {
          dailyMission: false,
          dailyDungeon: false,
          silverCoin: false,
          deepDungeon: false,
          partTimeJob: false,
          dailyGift: false,
          gemBox: false,
      };
      homework.lastDailyReset = currentDailyReset;
      needsSave = true;
    } else {
      console.log('[checkAndReset] No reset needed');
    }

    if (needsSave) {
      await homework.save();
    }
    return homework;
}

export async function getUserCharacters() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { success: false, error: 'Unauthorized' };
  }

  await connectToDatabase();
  const userId = (session.user as any).id;
  
  // Find all characters for user
  let homeworks = await Homework.find({ userId }).sort({ createdAt: 1 });

  // If none, create default 'Main'
  if (!homeworks || homeworks.length === 0) {
      const currentWeeklyReset = getWeeklyResetTime();
      const currentDailyReset = getDailyResetTime();
      const main = await Homework.create({
        userId,
        characterName: 'Main',
        weekStartDate: currentWeeklyReset,
        lastDailyReset: currentDailyReset,
        daily: {},
        weekly: {},
      });
      homeworks = [main];
  }

  // Check resets for all
  const updatedHomeworks = await Promise.all(homeworks.map(h => checkAndReset(h)));

  return { success: true, characters: JSON.parse(JSON.stringify(updatedHomeworks)) };
}

export async function createCharacter(name: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: 'Unauthorized' };
    
    if (!name || name.trim().length === 0) return { success: false, error: 'Name required' };

    await connectToDatabase();
    const userId = (session.user as any).id;
    
    // Check dupe name
    const existing = await Homework.findOne({ userId, characterName: name });
    if (existing) return { success: false, error: 'Character name already exists' };
    
    const currentWeeklyReset = getWeeklyResetTime();
    const currentDailyReset = getDailyResetTime();
    
    const newChar = await Homework.create({
        userId,
        characterName: name,
        weekStartDate: currentWeeklyReset,
        lastDailyReset: currentDailyReset,
        daily: {},
        weekly: {},
    });

    return { success: true, character: JSON.parse(JSON.stringify(newChar)) };
}

export async function deleteCharacter(homeworkId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const userId = (session.user as any).id;
    
    // Use deleteOne or findOneAndDelete
    await Homework.deleteOne({ _id: homeworkId, userId });
    
    return { success: true };
}

export async function updateHomework(homeworkId: string, updates: Partial<IHomeworkData>) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  await connectToDatabase();
  
  const homework = await Homework.findOne({ _id: homeworkId, userId: (session.user as any).id });
  
  if (!homework) {
    return { success: false, error: 'Homework not found' };
  }
  
  if (updates.daily) {
    homework.daily = { ...homework.daily, ...updates.daily };
  }
  if (updates.weekly) {
    homework.weekly = { ...homework.weekly, ...updates.weekly };
  }
  if (updates.memo !== undefined) {
    homework.memo = updates.memo;
  }
  
  await homework.save();
  
  return { success: true, homework: JSON.parse(JSON.stringify(homework)) };
}

export async function toggleTask(homeworkId: string, path: string, value: any) {
    console.log('[toggleTask] Called with:', { homeworkId, path, value });
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        console.log('[toggleTask] Unauthorized');
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    const userId = (session.user as any).id;
    
    console.log('[toggleTask] Updating...', { _id: homeworkId, userId });
    
    // Try with string ID first (for backwards compatibility)
    let result = await Homework.findOneAndUpdate(
        { _id: homeworkId, userId: userId },
        { $set: { [path]: value } },
        { new: true }
    );
    
    // If not found, try with ObjectId
    if (!result) {
        const mongoose = await import('mongoose');
        try {
            const objectId = new mongoose.Types.ObjectId(homeworkId);
            const userObjectId = new mongoose.Types.ObjectId(userId);
            result = await Homework.findOneAndUpdate(
                { _id: objectId, userId: userObjectId },
                { $set: { [path]: value } },
                { new: true }
            );
        } catch (e) {
            console.log('[toggleTask] ObjectId conversion failed');
        }
    }

    console.log('[toggleTask] Result:', result ? JSON.stringify(result.weekly) : 'Not found');

    if (!result) return { success: false, error: 'Failed to update' };

    return { success: true, homework: JSON.parse(JSON.stringify(result)) };
}
