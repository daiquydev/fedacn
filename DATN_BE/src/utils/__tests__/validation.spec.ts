import { validate } from '../validation'
import express from 'express'
import request from 'supertest'
import { body, ValidationChain } from 'express-validator'
import HTTP_STATUS from '~/constants/httpStatus'

const buildAppWithRoute = (validator: ValidationChain) => {
  const app = express()
  app.use(express.json())
  // cast to any to satisfy type, keep runtime .run from ValidationChain
  app.post('/test', validate(validator as any), (req, res) => res.json({ ok: true, body: req.body }))
  return app
}

describe('validation middleware', () => {
  it('passes when validation succeeds', async () => {
    const app = buildAppWithRoute(body('name').isString().notEmpty())
    await request(app).post('/test').send({ name: 'valid' }).expect(200)
  })

  it('returns 422 with mapped errors when validation fails', async () => {
    const app = buildAppWithRoute(body('name').isString().notEmpty())
    const res = await request(app).post('/test').send({ name: '' }).expect(422)
    expect(res.body).toHaveProperty('errors')
  })
})
