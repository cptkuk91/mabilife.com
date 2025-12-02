import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedUrl(fileName: string, contentType: string) {
  const bucketName = process.env.S3_BUCKET_NAME;
  const key = `mabilife/uploads/${Date.now()}_${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    // ACL: 'public-read', // Optional based on bucket policy
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  // Return CloudFront URL if available, otherwise S3 URL
  let publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  if (process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
    publicUrl = `${process.env.NEXT_PUBLIC_CLOUDFRONT_URL}/${key}`;
  }

  return { signedUrl, publicUrl };
}
