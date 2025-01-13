import path from "path";
import fs from "fs";
import AWS from "aws-sdk";
import mime from "mime-types";

import { CLOUDFLARE_R2_BUCKET } from "../config/config";
import { CLOUDFLARE_R2_ACCESS_KEY_ID } from "../config/config";
import { CLOUDFLARE_R2_SECRET_ACCESS_KEY } from "../config/config";
import { CLOUDFLARE_R2_ENDPOINT } from "../config/config";

const s3 = new AWS.S3({
  endpoint: CLOUDFLARE_R2_ENDPOINT,
  accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
});

export const uploadImageToR2 = async (fileBuffer: Buffer, fileName: string) => {
  const params = {
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mime.contentType(path.extname(fileName)) || "application/octet-stream",
    ACL: 'public-read', // Optional: Make the file publicly accessible
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location; // Return the URL of the uploaded file
  } catch (error) {
    throw new Error('Error uploading to R2: ' + error.message);
  }
};