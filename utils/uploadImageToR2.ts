import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import mime from "mime-types";
import { CLOUDFLARE_R2_BUCKET, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_ENDPOINT } from "../config/config";

// Initialize the S3Client with Cloudflare R2 settings
const s3Client = new S3Client({
  endpoint: CLOUDFLARE_R2_ENDPOINT,
  region: "auto",  // Cloudflare R2 doesn't require a specific region, so "auto" can be used
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export const uploadImageToR2 = async (fileBuffer: Buffer, fileName: string) => {
  // Prepare the file upload parameters
  const contentType = mime.contentType(path.extname(fileName)) || "application/octet-stream";
  const params = {
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: ObjectCannedACL.public_read, // Use the correct enum value 'public_read'
  };

  try {
    // Create a PutObjectCommand and upload the file
    const command = new PutObjectCommand(params);
    const uploadResult = await s3Client.send(command);
    
    // Return the URL of the uploaded file (Cloudflare R2 URL)
    const fileUrl = `https://${CLOUDFLARE_R2_BUCKET}.${CLOUDFLARE_R2_ENDPOINT}/${fileName}`;
    return fileUrl;
  } catch (error) {
    throw new Error("Error uploading to R2: " + error);
  }
};
