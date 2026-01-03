import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export interface IGuide extends Document {
  title: string;
  content: string;
  category: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  views: number;
  likes: number;
  likedBy: string[];
  bookmarks: number;
  bookmarkedBy: string[];
  tags: string[];
  thumbnail?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  slug?: string;
}

const GuideSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  author: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  bookmarks: { type: Number, default: 0 },
  bookmarkedBy: [{ type: String }],
  tags: [{ type: String }],
  thumbnail: { type: String },
  isPublished: { type: Boolean, default: true },
  slug: { type: String, unique: true, sparse: true },
}, {
  timestamps: true,
});

// Text index for search
GuideSchema.index({ title: 'text', content: 'text', tags: 'text' });
// Category index for filtering
GuideSchema.index({ category: 1 });
// Author index
GuideSchema.index({ 'author.id': 1 });

let Guide: Model<IGuide>;

const getGuideModel = async (): Promise<Model<IGuide>> => {
  await connectToDatabase();

  if (mongoose.models.Guide) {
    Guide = mongoose.models.Guide as Model<IGuide>;
  } else {
    Guide = mongoose.model<IGuide>('Guide', GuideSchema);
  }
  return Guide;
};

export default getGuideModel;
