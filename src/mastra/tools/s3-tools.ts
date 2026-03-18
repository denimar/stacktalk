import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  });
}

const BUCKET = process.env.S3_BUCKET_NAME ?? 'pipelord';

export const s3PutObject = createTool({
  id: 's3-put-object',
  description: 'Upload a file to AWS S3. Supports text content (HTML, markdown, JSON, SVG) and base64-encoded binary content (images, PDFs). Use base64 encoding for binary files.',
  inputSchema: z.object({
    key: z.string().describe('The S3 object key (path), e.g. "agents-attachements/{taskId}/{role-name}/prototype.html"'),
    content: z.string().describe('The file content. For text files, provide the raw text. For binary files (images), provide base64-encoded content.'),
    contentType: z.string().describe('The MIME type, e.g. "text/html", "text/markdown", "image/png", "application/pdf"'),
    isBase64: z.boolean().optional().default(false).describe('Set to true if the content is base64-encoded (for binary files like images)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    key: z.string(),
    bucket: z.string(),
    size: z.number(),
    url: z.string(),
  }),
  execute: async ({ key, content, contentType, isBase64 }) => {
    const s3Client = createS3Client();
    const body = isBase64 ? Buffer.from(content, 'base64') : Buffer.from(content, 'utf-8');
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return {
      success: true,
      key,
      bucket: BUCKET,
      size: body.byteLength,
      url: `/api/serve-file?key=${encodeURIComponent(key)}`,
    };
  },
});

export const s3ListObjects = createTool({
  id: 's3-list-objects',
  description: 'List objects in the S3 bucket with an optional prefix filter.',
  inputSchema: z.object({
    prefix: z.string().optional().describe('Filter objects by key prefix, e.g. "agents-attachements/{taskId}/{role-name}/"'),
    maxKeys: z.number().optional().default(100).describe('Maximum number of keys to return'),
  }),
  outputSchema: z.object({
    objects: z.array(z.object({
      key: z.string(),
      size: z.number(),
      lastModified: z.string(),
    })),
    count: z.number(),
  }),
  execute: async ({ prefix, maxKeys }) => {
    const s3Client = createS3Client();
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix ?? undefined,
      MaxKeys: maxKeys,
    });
    const response = await s3Client.send(command);
    const objects = (response.Contents ?? []).map(obj => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified?.toISOString() ?? '',
    }));
    return { objects, count: objects.length };
  },
});

export const s3GetObject = createTool({
  id: 's3-get-object',
  description: 'Download an object from S3. Returns text content directly or base64-encoded binary content.',
  inputSchema: z.object({
    key: z.string().describe('The S3 object key to download'),
  }),
  outputSchema: z.object({
    key: z.string(),
    contentType: z.string(),
    size: z.number(),
    content: z.string(),
    isBase64: z.boolean(),
  }),
  execute: async ({ key }) => {
    const s3Client = createS3Client();
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    const response = await s3Client.send(command);
    const bodyBytes = await response.Body?.transformToByteArray();
    if (!bodyBytes) {
      throw new Error(`Object not found: ${key}`);
    }
    const contentType = response.ContentType ?? 'application/octet-stream';
    const isText = contentType.startsWith('text/') || contentType === 'application/json' || contentType === 'image/svg+xml';
    return {
      key,
      contentType,
      size: bodyBytes.length,
      content: isText ? Buffer.from(bodyBytes).toString('utf-8') : Buffer.from(bodyBytes).toString('base64'),
      isBase64: !isText,
    };
  },
});

export const s3DeleteObject = createTool({
  id: 's3-delete-object',
  description: 'Delete an object from S3.',
  inputSchema: z.object({
    key: z.string().describe('The S3 object key to delete'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    key: z.string(),
  }),
  execute: async ({ key }) => {
    const s3Client = createS3Client();
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await s3Client.send(command);
    return { success: true, key };
  },
});

export const s3Tools = {
  s3PutObject,
  s3ListObjects,
  s3GetObject,
  s3DeleteObject,
};
