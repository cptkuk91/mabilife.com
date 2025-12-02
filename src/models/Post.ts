import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export interface IPost extends Document {
  content: string;
  type: '잡담' | '질문' | '정보';
  images: string[];
  author: {
    id: string;
    name: string;
    image?: string;
  };
  isSolved?: boolean; // Only for '질문'
  likes: number;
  likedBy: string[];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  content: { type: String, required: true },
  type: { type: String, required: true, enum: ['잡담', '질문', '정보'] },
  images: [{ type: String }],
  author: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
  },
  isSolved: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  commentCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Indexes
PostSchema.index({ createdAt: -1 });
PostSchema.index({ type: 1 });
PostSchema.index({ 'author.id': 1 });

let Post: Model<IPost>;

const getPostModel = async (): Promise<Model<IPost>> => {
  await connectToDatabase();

  if (mongoose.models.Post) {
    Post = mongoose.models.Post as Model<IPost>;
  } else {
    Post = mongoose.model<IPost>('Post', PostSchema);
  }
  return Post;
};

export default getPostModel;
