import { verifyAccessToken } from '../common'
import { ErrorWithStatus } from '../error'
import HTTP_STATUS from '~/constants/httpStatus'
import jwt from 'jsonwebtoken'
import { envConfig } from '~/constants/config'

describe('common.verifyAccessToken', () => {
  const secret = envConfig.JWT_SECRET_ACCESS_TOKEN
  const samplePayload = { user_id: 'user123', role: 'user' }

  it('throws UNAUTHORIZED when token missing', async () => {
    await expect(verifyAccessToken('')).rejects.toBeInstanceOf(ErrorWithStatus)
    await expect(verifyAccessToken('')).rejects.toHaveProperty('status', HTTP_STATUS.UNAUTHORIZED)
  })

  it('returns decoded payload when token is valid', async () => {
    const token = jwt.sign(samplePayload, secret, { expiresIn: '1h' })
    const decoded = await verifyAccessToken(token)
    expect(decoded).toMatchObject(samplePayload)
  })

  it('throws UNAUTHORIZED when token is invalid', async () => {
    const token = jwt.sign(samplePayload, 'wrongsecret', { expiresIn: '1h' })
    await expect(verifyAccessToken(token)).rejects.toHaveProperty('status', HTTP_STATUS.UNAUTHORIZED)
  })
})
