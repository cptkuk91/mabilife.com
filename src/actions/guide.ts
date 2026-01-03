"use server";

import { auth } from "@/lib/auth";
import getGuideModel, { IGuide } from "@/models/Guide";
import getGuideCommentModel from "@/models/GuideComment";
import { revalidatePath } from "next/cache";

export interface CreateGuideInput {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  thumbnail?: string;
}

export interface GuideResponse {
  success: boolean;
  data?: IGuide | IGuide[] | null;
  error?: string;
  id?: string;
}

// Helper to generate slug
function generateSlug(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    // Remove special characters but keep Korean, alphanumeric, and hyphens. 
    // Usually we might want to keep more, but this is a safe start.
    // If you want to keep everything and just replace spaces, that's also an option for modern browsers.
    // However, clean URLs usually avoid punctuation.
    .replace(/[^a-zA-Z0-9가-힣-]/g, '');
}

// Create a new guide
export async function createGuide(input: CreateGuideInput): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();

    // Generate unique slug
    let slug = generateSlug(input.title);
    let counter = 1;
    let originalSlug = slug;
    
    // Check for duplicate slug
    while (await Guide.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    const guide = await Guide.create({
      title: input.title,
      content: input.content,
      category: input.category,
      tags: input.tags || [],
      thumbnail: input.thumbnail,
      author: {
        id: (session.user as any).id,
        name: session.user.name || "익명",
        image: session.user.image || undefined,
      },
      slug: slug,
    });

    revalidatePath("/guide");
    revalidatePath("/guide/tips");

    return {
      success: true,
      id: guide.slug, // Return slug instead of ID if possible, or we return ID and let client handle redirect? 
      // Existing code expects ID likely. But we want to navigate to slug. 
      // Let's return the slug as `id` property or add a `slug` property to response. 
      // The interface GuideResponse has `id?: string`. I will send slug in `id` if that's what's used for redirection.
    };
  } catch (error) {
    console.error("Create guide error:", error);
    return { success: false, error: "가이드 작성에 실패했습니다." };
  }
}

// Get all guides with optional filters
export async function getGuides(options?: {
  category?: string;
  search?: string;
  limit?: number;
  skip?: number;
  sort?: 'latest' | 'popular' | 'views';
}): Promise<GuideResponse> {
  try {
    const Guide = await getGuideModel();

    const query: Record<string, unknown> = { isPublished: true };
    if (options?.category && options.category !== '전체') {
      query.category = options.category;
    }

    // 검색어가 있으면 제목과 내용에서 검색
    if (options?.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (options?.sort === 'popular') {
      sortOption = { likes: -1, createdAt: -1 };
    } else if (options?.sort === 'views') {
      sortOption = { views: -1, createdAt: -1 };
    }

    const guides = await Guide.find(query)
      .sort(sortOption)
      .skip(options?.skip || 0)
      .limit(options?.limit || 20)
      .lean();

    // 직렬화하여 클라이언트로 전달
    const serializedGuides = guides.map((guide) => ({
      ...guide,
      _id: guide._id.toString(),
      createdAt: guide.createdAt.toISOString(),
      updatedAt: guide.updatedAt.toISOString(),
    }));

    return { success: true, data: serializedGuides as any };
  } catch (error) {
    console.error("Get guides error:", error);
    return { success: false, error: "가이드 목록을 불러오는데 실패했습니다." };
  }
}

// Get a single guide by ID or Slug
export async function getGuideById(idOrSlug: string): Promise<GuideResponse> {
  try {
    const Guide = await getGuideModel();
    let guide;

    // Check if it's a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    if (isValidObjectId) {
      guide = await Guide.findByIdAndUpdate(
        idOrSlug,
        { $inc: { views: 1 } },
        { new: true, timestamps: false }
      ); // Do not lean yet, we might need to save

      // Lazy migration: if found by ID but no slug, generate one
      if (guide && !guide.slug) {
        let slug = generateSlug(guide.title);
        let counter = 1;
        let originalSlug = slug;
        
        while (await Guide.findOne({ slug, _id: { $ne: guide._id } })) {
          slug = `${originalSlug}-${counter}`;
          counter++;
        }
        
        guide.slug = slug;
        await guide.save();
      }
    } 

    // If not found by ID or not a valid ID (or just trying to find by slug), try finding by slug
    // Note: if we found it by ID above, we skip this
    if (!guide) {
      // Decode URI component just in case it was passed encoded
      const decodedSlug = decodeURIComponent(idOrSlug);
      guide = await Guide.findOneAndUpdate(
        { slug: decodedSlug },
        { $inc: { views: 1 } },
        { new: true, timestamps: false }
      );
    }

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    // Convert to plain object if not already (from lean or save)
    const guideObj = guide.toObject ? guide.toObject() : guide;

    // 직렬화하여 클라이언트로 전달
    const serializedGuide = {
      ...guideObj,
      _id: guideObj._id.toString(),
      createdAt: guideObj.createdAt.toISOString(),
      updatedAt: guideObj.updatedAt.toISOString(),
    };

    return { success: true, data: serializedGuide as any };
  } catch (error) {
    console.error("Get guide error:", error);
    return { success: false, error: "가이드를 불러오는데 실패했습니다." };
  }
}

// Update a guide
export async function updateGuide(
  id: string,
  input: Partial<CreateGuideInput>
): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();
    const guide = await Guide.findById(id);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    if (guide.author.id !== (session.user as any).id) {
      return { success: false, error: "수정 권한이 없습니다." };
    }

    const updated = await Guide.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true }
    ).lean();

    revalidatePath("/guide");
    revalidatePath(`/guide/tips/${id}`);

    return { success: true, data: updated as IGuide };
  } catch (error) {
    console.error("Update guide error:", error);
    return { success: false, error: "가이드 수정에 실패했습니다." };
  }
}

// Delete a guide
export async function deleteGuide(id: string): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();
    const guide = await Guide.findById(id);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    if (guide.author.id !== (session.user as any).id) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }

    // 가이드에 달린 모든 댓글 삭제
    const GuideComment = await getGuideCommentModel();
    await GuideComment.deleteMany({ guideId: id });

    // 가이드 삭제
    await Guide.findByIdAndDelete(id);

    revalidatePath("/guide");
    revalidatePath("/guide/tips");

    return { success: true };
  } catch (error) {
    console.error("Delete guide error:", error);
    return { success: false, error: "가이드 삭제에 실패했습니다." };
  }
}

// Toggle like on a guide
export async function toggleGuideLike(id: string): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();
    const guide = await Guide.findById(id);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    const userId = (session.user as any).id;
    const hasLiked = guide.likedBy.includes(userId);

    if (hasLiked) {
      await Guide.findByIdAndUpdate(
        id,
        { $pull: { likedBy: userId }, $inc: { likes: -1 } },
        { timestamps: false }
      );
    } else {
      await Guide.findByIdAndUpdate(
        id,
        { $push: { likedBy: userId }, $inc: { likes: 1 } },
        { timestamps: false }
      );
    }

    revalidatePath(`/guide/tips/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Toggle like error:", error);
    return { success: false, error: "좋아요 처리에 실패했습니다." };
  }
}

// Toggle bookmark on a guide
export async function toggleGuideBookmark(id: string): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();
    const guide = await Guide.findById(id);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    const userId = (session.user as any).id;
    const hasBookmarked = guide.bookmarkedBy.includes(userId);

    if (hasBookmarked) {
      await Guide.findByIdAndUpdate(
        id,
        { $pull: { bookmarkedBy: userId }, $inc: { bookmarks: -1 } },
        { timestamps: false }
      );
    } else {
      await Guide.findByIdAndUpdate(
        id,
        { $push: { bookmarkedBy: userId }, $inc: { bookmarks: 1 } },
        { timestamps: false }
      );
    }

    revalidatePath(`/guide/tips/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    return { success: false, error: "북마크 처리에 실패했습니다." };
  }
}
