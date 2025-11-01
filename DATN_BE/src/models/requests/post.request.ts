import type { Express } from 'express'

export interface CreatePostBody {
  content: string
  privacy: string
  file: Express.Multer.File[]
  user_id: string
}
