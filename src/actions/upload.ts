"use server";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getPresignedUrl } from "@/lib/s3";
import {
  enforceUploadRateLimit,
  type UploadScope,
  validateImageUploadInput,
} from "@/lib/upload-policy";

export async function getPresignedUrlAction(
  fileName: string,
  contentType: string,
  fileSize: number,
  scope: UploadScope,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const validationResult = validateImageUploadInput({ contentType, fileName, fileSize });
    if (!validationResult.success) {
      return validationResult;
    }

    const rateLimitResult = await enforceUploadRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      return rateLimitResult;
    }

    const { signedUrl, publicUrl } = await getPresignedUrl({
      contentType,
      scope,
      userId: session.user.id,
    });

    return { success: true, signedUrl, publicUrl };
  } catch (error) {
    logger.error("Presigned URL error:", error);
    return { success: false, error: "업로드 URL 생성에 실패했습니다." };
  }
}
