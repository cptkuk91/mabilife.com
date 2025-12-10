import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRanking extends Document {
  rank: number;
  server: string;
  characterName: string;
  job: string;
  score: number;
  rankingType: string; // 'total', 'combat', 'charm', 'life'
  crawledAt: Date;
}

const RankingSchema: Schema = new Schema(
  {
    rank: { type: Number, required: true },
    server: { type: String, required: true },
    characterName: { type: String, required: true },
    job: { type: String, required: true },
    score: { type: Number, required: true },
    rankingType: { type: String, required: true, default: 'total', index: true },
    crawledAt: { type: Date, default: Date.now, index: true }, // To easily find the latest batch
  },
  {
    timestamps: true,
  }
);

// Compound index for useful queries
RankingSchema.index({ rankingType: 1, server: 1, crawledAt: -1 });
RankingSchema.index({ rankingType: 1, job: 1, crawledAt: -1 });

// TTL Index: Automatically delete documents created more than 30 days ago
RankingSchema.index({ crawledAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const Ranking: Model<IRanking> =
  mongoose.models.Ranking || mongoose.model<IRanking>("Ranking", RankingSchema);

export default Ranking;
