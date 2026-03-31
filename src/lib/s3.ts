import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
    region: process.env.S3_AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY || ''
    }
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME;

interface UploadParams {
    candidateId: string;
    sessionId: string;
    docType: string;
    fileContent: Buffer;
    fileName: string;
    contentType?: string;
}

export async function uploadToS3({ candidateId, sessionId, docType, fileContent, fileName, contentType }: UploadParams) {
    try {
        if (!process.env.S3_AWS_ACCESS_KEY_ID || !process.env.S3_AWS_SECRET_ACCESS_KEY) {
            console.warn('[S3] AWS credentials not configured. Skipping S3 upload.');
            return { success: false, message: 'AWS credentials not configured', uploaded: false };
        }

        const s3Key = `${candidateId}/${sessionId}/${docType}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType || 'application/octet-stream',
            Metadata: {
                candidateId: candidateId,
                sessionId: sessionId,
                docType: docType,
                uploadedAt: new Date().toISOString()
            }
        });

        await s3Client.send(command);

        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.S3_AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;

        return {
            success: true,
            uploaded: true,
            s3Key: s3Key,
            s3Url: s3Url,
            bucket: BUCKET_NAME,
            contentType: contentType
        };
    } catch (error: any) {
        console.error('[S3] Upload error:', error.message);
        return {
            success: false,
            uploaded: false,
            error: error.message
        };
    }
}
