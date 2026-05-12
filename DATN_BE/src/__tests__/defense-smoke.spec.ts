import request from 'supertest'
import { app } from '../index'
import UserModel from '~/models/schemas/user.schema'
import authUserService from '~/services/userServices/authUser.services'
import * as cryptoUtils from '~/utils/crypto'

describe('[Kiểm thử khói] - Bảo mật tầng sâu (Defense Smoke)', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('API: Kiểm tra endpoint gốc (GET /) trả về thông báo chào mừng', async () => {
    const res = await request(app).get('/').expect(200)
    expect(res.text).toContain('Hello World')
  })

  it('API: Đăng nhập với Dependencies được Mock (POST /api/auth/users/login)', async () => {
    const findOneSpy = jest.spyOn(UserModel, 'findOne').mockImplementation(() => {
      return {
        isDeleted: false,
        password: 'hashed-password'
      } as any
    })
    const compareSpy = jest.spyOn(cryptoUtils, 'comparePassword').mockResolvedValue(true)
    const loginSpy = jest.spyOn(authUserService, 'login').mockResolvedValue({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token'
    } as any)

    const res = await request(app).post('/api/auth/users/login').send({
      email: 'smoke.user@example.com',
      password: 'Aa@123456'
    })

    expect(res.status).toBe(200)
    expect(res.body?.result?.access_token).toBe('mock_access_token')
    expect(res.body?.result?.refresh_token).toBe('mock_refresh_token')

    findOneSpy.mockRestore()
    compareSpy.mockRestore()
    loginSpy.mockRestore()
  })

  it('Bảo mật: Từ chối tạo Post khi thiếu Token (POST /api/posts)', async () => {
    const res = await request(app).post('/api/posts').send({
      content: 'smoke post content'
    })

    expect([401, 422]).toContain(res.status)
  })

  it('Bảo mật: Từ chối tham gia Thử thách khi chưa xác thực (POST /api/challenges/:id/join)', async () => {
    const res = await request(app).post('/api/challenges/challenge-id-smoke/join').send({})

    expect(res.status).toBe(401)
    expect(res.body?.message).toBe('Token is required')
  })

  it('Bảo mật: Từ chối tham gia Luyện tập khi chưa xác thực (POST /api/trainings/:id/join)', async () => {
    const res = await request(app).post('/api/trainings/training-id-smoke/join').send({})

    expect(res.status).toBe(401)
    expect(res.body?.message).toBe('Token is required')
  })
})
