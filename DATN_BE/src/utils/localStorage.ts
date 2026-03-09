import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'
import sharp from 'sharp'

// Cloudinary config (dung chung tu env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export interface UploadedFile {
  originalname: string
  buffer: Buffer
  mimetype: string
  size: number
}

export interface ProcessedFile {
  filename: string
  path: string
  url: string
  size: number
}

/**
 * Upload file len Cloudinary (truoc day luu local disk).
 * Giu nguyen interface ProcessedFile de khong can sua post.services.ts
 */
export const uploadFileToLocal = async ({
  filename,
  contentType,
  body
}: {
  filename: string
  contentType: string
  body: Buffer
}): Promise<ProcessedFile> => {
  // Xu ly anh voi Sharp (resize + convert webp) truoc khi upload
  const processedBuffer = await sharp(body)
    .resize(1200, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 85 })
    .toBuffer()

  return new Promise((resolve, reject) => {
    // Tao public_id tu ten file (bo extension)
    const publicId = `posts/${filename.replace(/\.[^/.]+$/, '')}_${Date.now()}`

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
        resolve({
          filename: result.public_id,
          path: result.secure_url,   // Full HTTPS URL
          url: result.secure_url,    // Full HTTPS URL
          size: result.bytes
        })
      }
    )

    streamifier.createReadStream(processedBuffer).pipe(uploadStream)
  })
}

export const uploadMultipleFilesToLocal = async (files: UploadedFile[]): Promise<ProcessedFile[]> => {
  const uploadPromises = files.map(file =>
    uploadFileToLocal({
      filename: file.originalname,
      contentType: file.mimetype,
      body: file.buffer
    })
  )
  return Promise.all(uploadPromises)
}

/**
 * Xoa file tren Cloudinary.
 * filePath co the la public_id hoac secure_url
 */
export const deleteFileFromLocal = async (filePath: string): Promise<void> => {
  try {
    // Neu la full URL, lay public_id tu URL
    let publicId = filePath
    if (filePath.startsWith('https://res.cloudinary.com/')) {
      // Extract public_id tu URL: .../upload/v.../public_id.ext
      const match = filePath.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
      if (match) publicId = match[1]
    } else {
      // Neu la path tuong doi, lay ten file khong co extension
      publicId = filePath.replace(/^\/uploads\/images\/posts\//, '').replace(/\.[^/.]+$/, '')
    }
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('[Cloudinary] Error deleting file:', error)
  }
}

export default {
  uploadFileToLocal,
  uploadMultipleFilesToLocal,
  deleteFileFromLocal
}
