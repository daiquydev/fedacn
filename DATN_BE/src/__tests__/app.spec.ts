import request from 'supertest'
import { app } from '../index'

describe('App basic routes', () => {
  it('returns Hello World on root path', async () => {
    const res = await request(app).get('/').expect(200)
    expect(res.text).toContain('Hello World')
  })
})
