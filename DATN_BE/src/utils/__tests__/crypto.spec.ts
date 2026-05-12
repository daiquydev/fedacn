import { hashPassword, comparePassword } from '../crypto'

describe('[Tiện ích] - Mã hóa dữ liệu (Crypto)', () => {
  it('Trường hợp: Mã hóa và kiểm tra mật khẩu thành công', async () => {
    const password = 'password123'
    const hash = await hashPassword(password)
    expect(hash).not.toBe(password)
    const isMatch = await comparePassword(password, hash)
    expect(isMatch).toBe(true)
  })
})
