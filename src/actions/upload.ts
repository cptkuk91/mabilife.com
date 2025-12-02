"use server";

import { getPresignedUrl } from "@/lib/s3";

export async function getPresignedUrlAction(fileName: string, contentType: string) {
  try {
    const { signedUrl, publicUrl } = await getPresignedUrl(fileName, contentType);
    return { success: true, signedUrl, publicUrl };
  } catch (error) {
    console.error("Presigned URL error:", error);
    return { success: false, error: "Failed to generate upload URL" };
  }
}
