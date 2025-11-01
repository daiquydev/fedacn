import { Request } from 'express'
import { TokenPayload } from './models/requests/authUser.request'
import { FileRecord } from './config/lowdb'

declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    uploadedFile?: FileRecord
  }
}
