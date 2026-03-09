import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'

// Cấu hình Cloudinary từ biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

/**
 * Upload file lên Cloudinary.
 * Interface giữ nguyên như uploadFileToS3 cũ để không cần sửa code ở các services.
 * Trả về { Location, Key, Bucket } tương thích với code cũ.
 */
export const uploadFileToS3 = async ({
  filename,
  contentType,
  body
}: {
  filename: string
  contentType: string
  body: Buffer | string
}): Promise<{ Location: string; Key: string; Bucket: string }> => {
  return new Promise((resolve, reject) => {
    // Xác định resource_type: 'video' cho video, 'image' cho ảnh, 'raw' cho file khác
    let resourceType: 'image' | 'video' | 'raw' = 'raw'
    if (contentType.startsWith('image/')) resourceType = 'image'
    else if (contentType.startsWith('video/')) resourceType = 'video'

    // Lấy public_id từ filename (bỏ extension để Cloudinary quản lý)
    const publicId = filename.replace(/\.[^/.]+$/, '')

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload failed'))
        }
        resolve({
          Location: result.secure_url, // URL công khai HTTPS
          Key: result.public_id,
          Bucket: process.env.CLOUDINARY_CLOUD_NAME || ''
        })
      }
    )

    // Chuyển Buffer thành Stream để upload
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body)
    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

/**
 * Xóa file trên Cloudinary theo public_id (Key).
 * Interface giữ nguyên như deleteFileFromS3 cũ.
 */
export const deleteFileFromS3 = async (filename: string): Promise<void> => {
  try {
    // filename có thể là public_id hoặc tên file có extension
    const publicId = filename.replace(/\.[^/.]+$/, '')
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('[Cloudinary] Error deleting file:', error)
  }
}
