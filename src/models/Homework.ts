
import mongoose, { Schema, Document, Model } from 'mongoose';
import { IHomeworkData } from '@/types/homework';

// Extend the pure interface for Mongoose
// We omit _id from IHomeworkData because Document has _id (but it might be ObjectId)
// We also need to ensure userId is ObjectId here if we want type safety in DB ops
export interface IHomeworkDocument extends Document, Omit<IHomeworkData, '_id' | 'userId'> {
  userId: mongoose.Types.ObjectId;
}

const DailyTasksSchema = new Schema({
  dailyMission: { type: Boolean, default: false },
  blackHole: { type: [Boolean], default: [false, false, false] },
  summoningBadge: { type: [Boolean], default: [false, false] },
  deepDungeon: { type: Boolean, default: false },
  tower: { type: Boolean, default: false },
  dailyDungeon: { type: Boolean, default: false },
  partTimeJob: { type: Boolean, default: false },
  dailyGift: { type: Boolean, default: false },
  crystalBox: { type: Number, default: 0 },
  fergusOre: { type: Boolean, default: false },
  endelyonHolyWater: { type: Boolean, default: false },
}, { _id: false });

const WeeklyBossesSchema = new Schema({
    peri: { type: Boolean, default: false },
    crabvach: { type: Boolean, default: false },
    krama: { type: Boolean, default: false },
    drohnenem: { type: Boolean, default: false },
}, { _id: false });

const WeeklyTasksSchema = new Schema({
  weeklyMission: { type: Boolean, default: false },
  guildMission: { type: [Boolean], default: [false, false, false, false, false, false] },
  fieldBosses: { type: WeeklyBossesSchema, default: () => ({}) },
  sunkenRuins: { type: Boolean, default: false },
  collapsedAltar: { type: Boolean, default: false },
  hallOfDestruction: { type: Boolean, default: false },
  glasGhaibhleann: { type: Boolean, default: false },
  guardian: { type: Boolean, default: false },
  bellast: { type: Boolean, default: false },
  weeklyShop: { type: Boolean, default: false },
  advancedSeal: { type: Boolean, default: false },
}, { _id: false });

const HomeworkSchema = new Schema<IHomeworkDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    characterName: { type: String, default: 'Main' },
    weekStartDate: { type: Date, required: true },
    lastDailyReset: { type: Date, required: true },
    daily: { type: DailyTasksSchema, default: () => ({}) },
    weekly: { type: WeeklyTasksSchema, default: () => ({}) },
    memo: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound index to ensure one record per user per character
HomeworkSchema.index({ userId: 1, characterName: 1 }, { unique: true });

export const Homework: Model<IHomeworkDocument> = mongoose.models.Homework || mongoose.model<IHomeworkDocument>('Homework', HomeworkSchema);
