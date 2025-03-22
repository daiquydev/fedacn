import { Upload } from '@aws-sdk/lib-storage';
import { S3, PutObjectCommand } from '@aws-sdk/client-s3';
import * as Minio from 'minio';
// Khởi tạo MinIO client
const minioClient = new Minio.Client({
  endPoint: 'localhost',    // MinIO server endpoint
  port: 9000,              // MinIO server port
  useSSL: false,           // SSL
  accessKey: 'minioadmin', // MinIO access key
  secretKey: 'minioadmin'  // MinIO secret key
});
const s3 = new S3({
  endpoint: 'http://localhost:9000',  // MinIO server endpoint
  region: 'us-east-1',               // Chọn region
  credentials: {
    accessKeyId: 'minioadmin',      // MinIO access key
    secretAccessKey: 'minioadmin'   // MinIO secret key
  },
  forcePathStyle: true,  
})
export const uploadFileToS3 = ({
  filename,
  contentType,
  body
}: {
  filename: string
  contentType: string
  body: any
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: 'cookhealthy',
      Key: filename,
      Body: body,
      ContentType: contentType
    },
    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })
  return parallelUploads3.done()
}

export const deleteFileFromS3 = async (filename: string) => {
  try {
    const deleteParams = {
      Bucket: 'cookhealthy',
      Key: filename
    }
    await s3.deleteObject(deleteParams)
  } catch (error) {
    console.log(error)
  }
}
