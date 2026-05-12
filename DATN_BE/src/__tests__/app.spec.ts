import request from 'supertest'
import { app } from '../index'

describe('[Hệ thống] - Kiểm tra khởi tạo ứng dụng', () => {
  it('Trường hợp: Truy cập đường dẫn gốc (/) trả về Hello World', async () => {
    const res = await request(app).get('/').expect(200)
    expect(res.text).toBe('Hello World!')
  })
})
