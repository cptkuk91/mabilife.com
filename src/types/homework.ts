
export interface IDailyTasks {
  // Missions
  dailyMission: boolean;
  // Dungeons
  // Dungeons
  dailyDungeon: boolean;    // 요일 던전
  silverCoin: boolean;      // 은동전
  deepDungeon: boolean;     // 심층 던전
  // Activities
  partTimeJob: boolean;
  // Shop/Exchange
  dailyGift: boolean; // 무료 상품
  gemBox: boolean;    // 보석 상자
}

export interface IWeeklyTasks {
  barrier: number;   // 결계 (0-7)
  blackHole: number; // 검은 구멍 (0-7)
  fieldBoss: number; // 필드보스 (0-4)
  abyss: number;     // 어비스 (0-3)
  raid: number;      // 레이드 (0-3)
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
