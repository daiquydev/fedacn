const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/lowdb');

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Cấu hình multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Chỉ cho phép upload ảnh
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Middleware xử lý ảnh sau khi upload
const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const fileId = uuidv4();
    const filename = `${fileId}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Resize và optimize ảnh
    await sharp(req.file.buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    // Lưu thông tin file vào lowdb
    const fileRecord = {
      id: fileId,
      originalName: req.file.originalname,
      filename,
      mimetype: 'image/webp',
      size: (await fs.stat(filepath)).size,
      url: `/uploads/${filename}`,
      uploadedAt: new Date().toISOString(),
    };

    db.get('files').push(fileRecord).write();

    // Gắn thông tin file vào request
    req.uploadedFile = fileRecord;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware xử lý multiple files
const processMultipleImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileId = uuidv4();
      const filename = `${fileId}.webp`;
      const filepath = path.join(uploadsDir, filename);

      await sharp(file.buffer)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);

      const fileRecord = {
        id: fileId,
        originalName: file.originalname,
        filename,
        mimetype: 'image/webp',
        size: (await fs.stat(filepath)).size,
        url: `/uploads/${filename}`,
        uploadedAt: new Date().toISOString(),
      };

      db.get('files').push(fileRecord).write();
      uploadedFiles.push(fileRecord);
    }

    req.uploadedFiles = uploadedFiles;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  processImage,
  processMultipleImages,
};
