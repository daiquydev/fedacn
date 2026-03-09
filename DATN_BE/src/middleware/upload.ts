import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { Request, Response, NextFunction } from 'express'
import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Multer dung memoryStorage (khong luu disk)
const storage = multer.memoryStorage()

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Chi cho phep upload file anh!'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
})

/**
 * Middleware xu ly anh va upload len Cloudinary.
 * Sau khi upload, gan thong tin vao req.uploadedFile.
 */
export const processImage = (folder: 'recipes' | 'ingredients' = 'recipes') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next()
      }

      const fileId = uuidv4()
      const publicId = `${folder}/${fileId}`

      // Xu ly anh voi Sharp truoc khi upload
      const processedBuffer = await sharp(req.file.buffer)
        .resize(800, 600, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toBuffer()

      // Upload len Cloudinary
      const uploadResult = await new Promise<{ secure_url: string; public_id: string; bytes: number }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              public_id: publicId,
              resource_type: 'image',
              overwrite: true
            },
            (error, result) => {
              if (error || !result) {
                return reject(error || new Error('Cloudinary upload failed'))
              }
              resolve(result as { secure_url: string; public_id: string; bytes: number })
            }
          )
          streamifier.createReadStream(processedBuffer).pipe(uploadStream)
        }
      )

      // Gan thong tin file vao request de su dung o controller
      req.uploadedFile = {
        id: fileId,
        originalName: req.file.originalname,
        filename: uploadResult.public_id,
        path: uploadResult.secure_url,   // Full Cloudinary HTTPS URL
        mimetype: 'image/webp',
        size: uploadResult.bytes,
        uploadedAt: new Date()
      }

      next()
    } catch (error: any) {
      console.error('[Cloudinary] Error processing image:', error)
      res.status(500).json({
        success: false,
        message: 'Loi khi xu ly anh',
        error: error.message
      })
    }
  }
}

/**
 * Xoa anh tren Cloudinary theo URL hoac public_id
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    let publicId = filePath
    if (filePath.startsWith('https://res.cloudinary.com/')) {
      const match = filePath.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
      if (match) publicId = match[1]
    } else {
      publicId = filePath.replace(/\.[^/.]+$/, '')
    }
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('[Cloudinary] Error deleting file:', error)
  }
}

// Export upload middleware
export const uploadSingle = upload.single('image')
export const uploadMultiple = upload.array('images', 5)

export default {
  uploadSingle,
  uploadMultiple,
  processImage,
  deleteFile
}
