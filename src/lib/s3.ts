import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET_NAME = "stacktalk";
const REGION = "us-east-1";
const PRESIGNED_URL_EXPIRY_SECONDS = 3600;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface UploadToS3Params {
  buffer: Buffer;
  taskId: string;
  messageId: string;
  fileName: string;
  contentType: string;
}

export async function uploadToS3({
  buffer,
  taskId,
  messageId,
  fileName,
  contentType,
}: UploadToS3Params): Promise<{ s3Key: string }> {
  const s3Key = `tasks/attachements/${taskId}/${messageId}/${fileName}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return { s3Key };
}

export async function getPresignedUrl(s3Key: string): Promise<string> {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }),
    { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS }
  );
}

export async function getObject(s3Key: string) {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key })
  );
  return {
    body: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  };
}
