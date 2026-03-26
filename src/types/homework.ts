
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
  barrier: boolean;    // 결계
  blackHole: boolean;  // 검은 구멍
  fieldBoss: boolean;  // 필드 보스
  abyss: boolean;      // 어비스
  raid: boolean;       // 레이드
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
