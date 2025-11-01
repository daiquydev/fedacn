import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '../../uploads');
const postsDir = path.join(uploadsDir, 'images', 'posts');

if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface ProcessedFile {
  filename: string;
  path: string;
  url: string;
  size: number;
}

export const uploadFileToLocal = async ({
  filename,
  contentType,
  body
}: {
  filename: string;
  contentType: string;
  body: Buffer;
}): Promise<ProcessedFile> => {
  try {
    const fileId = uuidv4();
    const extension = path.extname(filename);
    const baseName = path.basename(filename, extension);
    const newFilename = `${baseName}_${fileId}.webp`;
    const filePath = path.join(postsDir, newFilename);

    // Process image with Sharp
    const processedBuffer = await sharp(body)
      .resize(1200, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Save file
    fs.writeFileSync(filePath, processedBuffer);

    return {
      filename: newFilename,
      path: `/uploads/images/posts/${newFilename}`,
      url: `/uploads/images/posts/${newFilename}`,
      size: processedBuffer.length
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

export const uploadMultipleFilesToLocal = async (files: UploadedFile[]): Promise<ProcessedFile[]> => {
  const uploadPromises = files.map(file => 
    uploadFileToLocal({
      filename: file.originalname,
      contentType: file.mimetype,
      body: file.buffer
    })
  );

  return Promise.all(uploadPromises);
};

export const deleteFileFromLocal = (filePath: string): void => {
  try {
    const fullPath = path.join(__dirname, '../../', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

export default {
  uploadFileToLocal,
  uploadMultipleFilesToLocal,
  deleteFileFromLocal
};
