import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export type RuneGrade = 'mythic' | 'legendary' | 'epic' | 'normal';
export type RuneSlot = '무기' | '방어구' | '장신구' | '엠블럼' | '보석';

export interface IRune extends Document {
  id: string; // The specific ID used in the code (e.g. 'hero', 'flame')
  name: string; // Korean name
  slot: RuneSlot;
  grade: RuneGrade;
  effect: string; // Short summary
  description: string; // Full tooltip text
  imageUrl?: string;
  tags: string[]; // e.g. ["판매 가능", "거래 불가"]
  isSaleable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RuneSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  slot: { type: String, required: true },
  grade: { type: String, required: true, default: 'normal' },
  effect: { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl: { type: String },
  tags: { type: [String], default: [] },
  isSaleable: { type: Boolean, default: true },
}, {
  timestamps: true,
});

let Rune: Model<IRune>;

const getRuneModel = async () => {
  const db = await connectToDatabase();
  // Using the main connection
  if (db.models.Rune) {
    Rune = db.models.Rune as Model<IRune>;
  } else {
    Rune = db.model<IRune>('Rune', RuneSchema);
  }
  return Rune;
};

export default getRuneModel;
