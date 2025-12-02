import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export interface IComment extends Document {
  postId: string;
  content: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  parentId?: string; // For replies
  likes: number;
  likedBy: string[];
  isAccepted: boolean; // 채택된 답변 여부
  acceptedAt?: Date; // 채택된 시간
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  postId: { type: String, required: true, index: true },
  content: { type: String, required: true },
  author: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
  },
  parentId: { type: String, default: null, index: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  isAccepted: { type: Boolean, default: false },
  acceptedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

// Indexes
CommentSchema.index({ postId: 1, createdAt: 1 });
CommentSchema.index({ parentId: 1 });

let Comment: Model<IComment>;

const getCommentModel = async (): Promise<Model<IComment>> => {
  await connectToDatabase();

  if (mongoose.models.Comment) {
    Comment = mongoose.models.Comment as Model<IComment>;
  } else {
    Comment = mongoose.model<IComment>('Comment', CommentSchema);
  }
  return Comment;
};

export default getCommentModel;
