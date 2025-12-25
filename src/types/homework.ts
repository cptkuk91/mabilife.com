
export interface IDailyTasks {
  // Missions
  dailyMission: boolean;
  // Dungeons
  blackHole: boolean[]; // 3 steps
  summoningBadge: boolean[]; // 2 steps
  deepDungeon: boolean;
  tower: boolean;
  dailyDungeon: boolean;
  // Activities
  partTimeJob: boolean;
  // Shop/Exchange
  dailyGift: boolean; // Free fashion
  crystalBox: number; // 0-10
  fergusOre: boolean;
  endelyonHolyWater: boolean;
}

export interface IWeeklyBosses {
    peri: boolean;
    crabvach: boolean;
    krama: boolean;
    drohnenem: boolean;
}

export interface IWeeklyTasks {
  // Missions
  weeklyMission: boolean;
  guildMission: boolean[]; // 6 stages
  // Bosses
  fieldBosses: IWeeklyBosses;
  // Abyss
  sunkenRuins: boolean;
  collapsedAltar: boolean;
  hallOfDestruction: boolean;
  // Raids
  glasGhaibhleann: boolean;
  guardian: boolean;
  bellast: boolean;
  // Shop/Exchange
  weeklyShop: boolean;
  advancedSeal: boolean; // Example exchange
}

// Pure data interface without Mongoose dependencies
export interface IHomeworkData {
  _id: string;
  userId: string;
  characterName: string;
  weekStartDate: Date | string;
  lastDailyReset: Date | string;
  daily: IDailyTasks;
  weekly: IWeeklyTasks;
  memo: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
