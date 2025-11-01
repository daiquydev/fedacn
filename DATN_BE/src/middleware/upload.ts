import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import db from '~/config/lowdb';

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Tạo các thư mục con
const imagesDir = path.join(uploadsDir, 'images');
const recipesDir = path.join(imagesDir, 'recipes');
const ingredientsDir = path.join(imagesDir, 'ingredients');

[imagesDir, recipesDir, ingredientsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Cấu hình multer để lưu file tạm thời
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Chỉ cho phép upload ảnh
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware xử lý và lưu ảnh
export const processImage = (folder: 'recipes' | 'ingredients' = 'recipes') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next();
      }

      const fileId = uuidv4();
      const filename = `${fileId}.webp`;
      const targetDir = folder === 'recipes' ? recipesDir : ingredientsDir;
      const filePath = path.join(targetDir, filename);

      // Xử lý ảnh với Sharp
      await sharp(req.file.buffer)
        .resize(800, 600, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(filePath);

      // Lưu thông tin file vào database
      const fileRecord = {
        id: fileId,
        originalName: req.file.originalname,
        filename: filename,
        path: `/uploads/images/${folder}/${filename}`,
        mimetype: 'image/webp',
        size: fs.statSync(filePath).size,
        uploadedAt: new Date()
      };

      db.get('files')
        .push(fileRecord)
        .write();

      // Gắn thông tin file vào request để sử dụng ở controller
      req.uploadedFile = fileRecord;
      
      next();
    } catch (error: any) {
      console.error('Error processing image:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý ảnh',
        error: error.message
      });
    }
  };
};

// Middleware xóa file
export const deleteFile = (filePath: string) => {
  try {
    const fullPath = path.join(__dirname, '../../', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      
      // Xóa record trong database
      const filename = path.basename(filePath);
      db.get('files')
        .remove({ filename })
        .write();
        
      console.log(`Deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Export upload middleware
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', 5);

export default {
  uploadSingle,
  uploadMultiple,
  processImage,
  deleteFile
};
