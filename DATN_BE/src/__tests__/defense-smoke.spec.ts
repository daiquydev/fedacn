import request from 'supertest'
import { app } from '../index'
import UserModel from '~/models/schemas/user.schema'
import authUserService from '~/services/userServices/authUser.services'
import * as cryptoUtils from '~/utils/crypto'

describe('Defense smoke flows', () => {
  it('GET / returns service greeting', async () => {
    const res = await request(app).get('/').expect(200)
    expect(res.text).toContain('Hello World')
  })

  it('POST /api/auth/users/login returns token payload with mocked dependencies', async () => {
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

  it('POST /api/posts rejects create post when access token is missing', async () => {
    const res = await request(app).post('/api/posts').send({
      content: 'smoke post content'
    })

    expect([401, 422]).toContain(res.status)
  })

  it('POST /api/challenges/:id/join rejects unauthenticated user', async () => {
    const res = await request(app).post('/api/challenges/challenge-id-smoke/join').send({})

    expect(res.status).toBe(401)
    expect(res.body?.message).toBe('Token is required')
  })

  it('POST /api/trainings/:id/join rejects unauthenticated user', async () => {
    const res = await request(app).post('/api/trainings/training-id-smoke/join').send({})

    expect(res.status).toBe(401)
    expect(res.body?.message).toBe('Token is required')
  })
})
