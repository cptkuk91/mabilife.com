'use server';

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

// S3 Client 초기화
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'uritabi';
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL || 'https://d2gg9iclns4v4e.cloudfront.net';

// 파일 타입 검증
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 확장자 추출
function getFileExtension(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  return mimeToExt[mimeType] || 'jpg';
}

// 단일 이미지 업로드 (sharp 없이 원본 업로드)
export async function uploadImage(file: File, folder: string): Promise<{ key: string; url: string }> {
  try {
    // 파일 검증
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds 10MB limit`);
    }

    // 파일명 생성 (폴더/날짜/고유ID-원본파일명)
    const date = new Date();
    const dateFolder = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    const originalName = file.name.replace(/\.[^/.]+$/, ''); // 확장자 제거
    const extension = getFileExtension(file.type);
    const fileName = `${nanoid()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '')}.${extension}`;
    const key = `${folder}/${dateFolder}/${fileName}`;

    // ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // S3에 업로드
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000', // 1년 캐싱
    });

    await s3Client.send(command);

    // CloudFront URL 생성
    const url = `${CLOUDFRONT_URL}/${key}`;

    return { key, url };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 배치 이미지 업로드 (병렬 처리)
export async function uploadImagesBatch(
  files: File[],
  folder: string,
  batchSize: number = 5 // 동시 업로드 개수 제한
): Promise<Array<{ key: string; url: string; originalName: string }>> {
  const results: Array<{ key: string; url: string; originalName: string }> = [];

  // 파일을 배치로 나누기
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    // 현재 배치를 병렬로 업로드
    const batchPromises = batch.map(async (file) => {
      try {
        const { key, url } = await uploadImage(file, folder);
        return { key, url, originalName: file.name };
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // 개별 파일 실패 시 null 반환
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // null이 아닌 결과만 추가
    results.push(...batchResults.filter((result): result is { key: string; url: string; originalName: string } => result !== null));
  }

  return results;
}

// FormData에서 파일과 메타데이터를 함께 처리하는 헬퍼 함수
export interface ImageWithMetadata {
  file: File;
  alt?: string;
  description?: string;
}

export async function uploadImagesWithMetadata(
  images: ImageWithMetadata[],
  folder: string,
  batchSize: number = 5
): Promise<Array<{ key: string; url: string; alt?: string; description?: string }>> {
  const results: Array<{ key: string; url: string; alt?: string; description?: string }> = [];

  // 배치 처리
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);

    const batchPromises = batch.map(async (item) => {
      try {
        const { key, url } = await uploadImage(item.file, folder);
        const result: { key: string; url: string; alt?: string; description?: string } = {
          key,
          url
        };

        // Only add optional properties if they exist
        if (item.alt !== undefined) {
          result.alt = item.alt;
        }
        if (item.description !== undefined) {
          result.description = item.description;
        }

        return result;
      } catch (error) {
        console.error(`Failed to upload image:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter((result): result is NonNullable<typeof result> => result !== null);
    results.push(...validResults);
  }

  return results;
}

// S3에서 이미지 삭제
export async function deleteImage(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
}

// 여러 이미지 삭제
export async function deleteImages(keys: string[]): Promise<{ success: string[]; failed: string[] }> {
  const results = await Promise.all(
    keys.map(async (key) => {
      const success = await deleteImage(key);
      return { key, success };
    })
  );

  return {
    success: results.filter(r => r.success).map(r => r.key),
    failed: results.filter(r => !r.success).map(r => r.key)
  };
}

// event.ts에서 사용하는 인터페이스에 맞춰 추가
export interface UploadParams {
  file: File;
  key: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// uploadToS3 - event.ts에서 사용하는 함수
export async function uploadToS3(params: UploadParams): Promise<UploadResult> {
  try {
    const { file, key } = params;

    // 파일 검증
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds 10MB limit`
      };
    }

    // ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // S3에 업로드
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000', // 1년 캐싱
    });

    await s3Client.send(command);

    // CloudFront URL 생성
    const url = `${CLOUDFRONT_URL}/${key}`;

    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// deleteFromS3 - event.ts에서 사용하는 함수
export async function deleteFromS3(key: string): Promise<boolean> {
  return deleteImage(key);
}

// ============================================
// Presigned URL 기반 클라이언트 직접 업로드
// Vercel 4.5MB 제한 우회용
// ============================================

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  folder: string;
}

export interface PresignedUrlResponse {
  success: boolean;
  uploadUrl?: string;
  key?: string;
  error?: string;
}

// 단일 Presigned URL 생성
export async function getPresignedUploadUrl(
  request: PresignedUrlRequest
): Promise<PresignedUrlResponse> {
  try {
    const { fileName, fileType, folder } = request;

    // 파일 타입 검증
    if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
      return {
        success: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      };
    }

    // 파일명 생성
    const date = new Date();
    const dateFolder = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    const originalName = fileName.replace(/\.[^/.]+$/, '');
    const extension = getFileExtension(fileType);
    const uniqueFileName = `${nanoid()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '')}.${extension}`;
    const key = `${folder}/${dateFolder}/${uniqueFileName}`;

    // Presigned URL 생성
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      CacheControl: 'public, max-age=31536000',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5분 유효

    return {
      success: true,
      uploadUrl,
      key
    };
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate upload URL'
    };
  }
}

// 여러 개의 Presigned URL 일괄 생성
export async function getPresignedUploadUrls(
  requests: PresignedUrlRequest[]
): Promise<PresignedUrlResponse[]> {
  const results = await Promise.all(
    requests.map(request => getPresignedUploadUrl(request))
  );
  return results;
}
