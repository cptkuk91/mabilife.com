import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export interface IGuideComment extends Document {
  guideId: string;
  content: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  parentId?: string; // For replies
  likes: number;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GuideCommentSchema: Schema = new Schema({
  guideId: { type: String, required: true, index: true },
  content: { type: String, required: true },
  author: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
  },
  parentId: { type: String, default: null, index: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
}, {
  timestamps: true,
});

// Indexes
GuideCommentSchema.index({ guideId: 1, createdAt: 1 });
GuideCommentSchema.index({ parentId: 1 });

let GuideComment: Model<IGuideComment>;

const getGuideCommentModel = async (): Promise<Model<IGuideComment>> => {
  await connectToDatabase();

  if (mongoose.models.GuideComment) {
    GuideComment = mongoose.models.GuideComment as Model<IGuideComment>;
  } else {
    GuideComment = mongoose.model<IGuideComment>('GuideComment', GuideCommentSchema);
  }
  return GuideComment;
};

export default getGuideCommentModel;
