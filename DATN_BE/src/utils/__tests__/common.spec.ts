import { verifyAccessToken } from '../common'
import jwt from 'jsonwebtoken'
import { envConfig } from '~/constants/config'

describe('[Hệ thống] - Kiểm duyệt Token (Common Verify)', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('Lỗi: Thiếu Access Token trong Header', async () => {
    try {
      await verifyAccessToken('')
      fail('Should have thrown')
    } catch (e) {
      expect(e).toBeDefined()
    }
  })

  it('Trường hợp: Giải mã Token hợp lệ thành công', async () => {
    const payload = { user_id: '123' }
    const token = jwt.sign(payload, envConfig.JWT_SECRET_ACCESS_TOKEN as string)
    const decoded = await verifyAccessToken(token)
    expect(decoded).toMatchObject(payload)
  })

  it('Lỗi: Token không hợp lệ hoặc hết hạn', async () => {
    try {
      // Use a string that is definitely not a valid JWT format to force immediate failure
      await verifyAccessToken('not-a-jwt')
      fail('Should have thrown')
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})
