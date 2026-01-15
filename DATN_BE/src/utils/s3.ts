import * as Minio from 'minio'

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost'
const MINIO_PORT = Number(process.env.MINIO_PORT || 9000)
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true'
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin'
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin'
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'cookhealthy'
const MINIO_PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT

const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY
})

const ensureBucket = async () => {
  const exists = await minioClient.bucketExists(MINIO_BUCKET)
  if (!exists) {
    await minioClient.makeBucket(MINIO_BUCKET, 'us-east-1')
  }
}

export const uploadFileToS3 = async ({
  filename,
  contentType,
  body
}: {
  filename: string
  contentType: string
  body: Buffer | string
}) => {
  await ensureBucket()
  const size = Buffer.isBuffer(body) ? body.length : undefined
  await minioClient.putObject(MINIO_BUCKET, filename, body, size, {
    'Content-Type': contentType
  })

  // Xây public URL ổn định, tự thêm port nếu MINIO_PUBLIC_ENDPOINT thiếu
  const buildPublicBase = () => {
    if (MINIO_PUBLIC_ENDPOINT) {
      try {
        const url = new URL(MINIO_PUBLIC_ENDPOINT)
        const defaultHttp = !url.port && url.protocol === 'http:' && MINIO_PORT !== 80
        const defaultHttps = !url.port && url.protocol === 'https:' && MINIO_PORT !== 443
        if (defaultHttp || defaultHttps) {
          url.port = MINIO_PORT.toString()
        }
        return url.toString().replace(/\/$/, '')
      } catch {
        // Nếu env không hợp lệ, fallback sang cấu hình nội bộ
      }
    }
    return `${MINIO_USE_SSL ? 'https' : 'http'}://${MINIO_ENDPOINT}:${MINIO_PORT}`
  }

  const publicBase = buildPublicBase()

  return {
    Location: `${publicBase}/${MINIO_BUCKET}/${filename}`,
    Key: filename,
    Bucket: MINIO_BUCKET
  }
}

export const deleteFileFromS3 = async (filename: string) => {
  try {
    const exists = await minioClient.bucketExists(MINIO_BUCKET)
    if (!exists) return
    await minioClient.removeObject(MINIO_BUCKET, filename)
  } catch (error) {
    console.log(error)
  }
}
