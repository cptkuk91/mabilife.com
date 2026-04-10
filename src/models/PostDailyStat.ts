import mongoose, { Schema, Document, Model } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

export interface IPostDailyStat extends Document {
  postId: mongoose.Types.ObjectId;
  day: Date;
  uniqueViewCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostDailyStatSchema = new Schema<IPostDailyStat>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    day: { type: Date, required: true },
    uniqueViewCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

PostDailyStatSchema.index({ postId: 1, day: 1 }, { unique: true });
PostDailyStatSchema.index({ day: -1, uniqueViewCount: -1 });

let PostDailyStat: Model<IPostDailyStat>;

const getPostDailyStatModel = async (): Promise<Model<IPostDailyStat>> => {
  await connectToDatabase();

  if (mongoose.models.PostDailyStat) {
    PostDailyStat = mongoose.models.PostDailyStat as Model<IPostDailyStat>;
  } else {
    PostDailyStat = mongoose.model<IPostDailyStat>(
      "PostDailyStat",
      PostDailyStatSchema,
      "post_daily_stats",
    );
  }

  return PostDailyStat;
};

export default getPostDailyStatModel;
