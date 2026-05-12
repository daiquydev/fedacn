import { validate } from '../validation'
import { defaultErrorHandler } from '~/middlewares/error.middleware'
import express from 'express'
import request from 'supertest'
import { body, ValidationChain } from 'express-validator'
import HTTP_STATUS from '~/constants/httpStatus'

const buildAppWithRoute = (validator: ValidationChain) => {
  const app = express()
  app.use(express.json({ limit: '50mb' }))
  // cast to any to satisfy type, keep runtime .run from ValidationChain
  app.post('/test', validate(validator as any), (req, res) => res.json({ ok: true, body: req.body }))
  app.use(defaultErrorHandler)
  return app
}

describe('[Tiện ích] - Middleware kiểm tra dữ liệu (Validation)', () => {
  it('Trường hợp: Dữ liệu hợp lệ (Pass)', async () => {
    const app = buildAppWithRoute(body('name').isString().notEmpty())
    await request(app).post('/test').send({ name: 'Valid' }).expect(200)
  })

  it('Trường hợp: Dữ liệu không hợp lệ (Trả về 422)', async () => {
    const app = buildAppWithRoute(body('name').isString().notEmpty())
    const res = await request(app).post('/test').send({ name: '' }).expect(422)
    expect(res.body).toHaveProperty('errors')
  })
})
