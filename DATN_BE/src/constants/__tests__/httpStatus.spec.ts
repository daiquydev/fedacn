import HTTP_STATUS from '../httpStatus'

describe('HTTP_STATUS constants', () => {
  it('contains common codes', () => {
    expect(HTTP_STATUS.OK).toBe(200)
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
    expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422)
  })

  it('is immutable (frozen)', () => {
    expect(Object.isFrozen(HTTP_STATUS)).toBe(true)
  })
})
