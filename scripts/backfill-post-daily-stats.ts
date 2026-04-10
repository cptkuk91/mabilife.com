import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import getPostModel from "@/models/Post";
import getPostDailyStatModel from "@/models/PostDailyStat";

type LegacyViewHistoryBucket = {
  _id: {
    day: Date;
    postId: mongoose.Types.ObjectId;
  };
  viewCount: number;
};

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const todayStart = getTodayStart();

  await connectToDatabase();

  const Post = await getPostModel();
  const PostDailyStat = await getPostDailyStatModel();
  const legacyBuckets = await Post.aggregate<LegacyViewHistoryBucket>([
    {
      $match: {
        "viewHistory.0": { $exists: true },
      },
    },
    {
      $unwind: "$viewHistory",
    },
    {
      $match: {
        "viewHistory.viewedAt": { $lt: todayStart },
      },
    },
    {
      $group: {
        _id: {
          postId: "$_id",
          day: {
            $dateTrunc: {
              date: "$viewHistory.viewedAt",
              unit: "day",
            },
          },
        },
        viewCount: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.day": 1,
        "_id.postId": 1,
      },
    },
  ]);

  const postIds = new Set(legacyBuckets.map((bucket) => bucket._id.postId.toString()));
  const totalViews = legacyBuckets.reduce((sum, bucket) => sum + bucket.viewCount, 0);

  console.log(
    JSON.stringify(
      {
        dryRun: isDryRun,
        legacyBucketCount: legacyBuckets.length,
        postCount: postIds.size,
        todayStart: todayStart.toISOString(),
        totalViews,
      },
      null,
      2,
    ),
  );

  if (isDryRun || legacyBuckets.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const operations = legacyBuckets.map((bucket) => ({
    updateOne: {
      filter: {
        day: bucket._id.day,
        postId: bucket._id.postId,
      },
      update: {
        $set: {
          uniqueViewCount: bucket.viewCount,
          viewCount: bucket.viewCount,
        },
        $setOnInsert: {
          day: bucket._id.day,
          postId: bucket._id.postId,
        },
      },
      upsert: true,
    },
  }));

  const result = await PostDailyStat.bulkWrite(operations, { ordered: false });

  console.log(
    JSON.stringify(
      {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Backfill post_daily_stats failed:", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
