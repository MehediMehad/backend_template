import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../libs/s3Client';


const deleteS3Image = async (imagePath: string) => {
  if (!imagePath) {
    console.warn('No image path provided');
    return false;
  }
  try {
    // Use DeleteObjectCommand
    const command = new DeleteObjectCommand({
      Bucket: process.env.DO_SPACE_BUCKET,
      Key: imagePath,
    });

    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error(`Error deleting file ${imagePath}:`, err);
    return false;
  }
};

export const deleteFile = { deleteS3Image };
