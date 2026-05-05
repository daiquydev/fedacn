import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/utils/error'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']))
  }

  // Axios error hoặc bất kỳ error có circular reference
  if (err?.isAxiosError || err?.request || err?.response) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: err.message || 'External API error',
      errorInfo: {
        status: err.response?.status,
        data: err.response?.data
      }
    })
  }

  Object.getOwnPropertyNames(err).forEach((key) => {
    try {
      Object.defineProperty(err, key, { enumerable: true })
    } catch {}
  })

  let errorInfo: any = {}
  try {
    errorInfo = omit(err, ['stack'])
    JSON.stringify(errorInfo) // test circular
  } catch {
    errorInfo = { name: err.name }
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo
  })
}
