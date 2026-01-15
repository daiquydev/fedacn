import { hashPassword, comparePassword } from '../crypto'

describe('crypto utils', () => {
  it('hashes and verifies password correctly', async () => {
    const plain = 'Test@1234'
    const hashed = await hashPassword(plain)
    expect(hashed).not.toBe(plain)
    const match = await comparePassword(plain, hashed)
    expect(match).toBe(true)
  })
})
