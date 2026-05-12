import HTTP_STATUS from '../httpStatus'

describe('[Hệ thống] - Các mã trạng thái HTTP (HttpStatus)', () => {
  it('Trường hợp: Chứa các mã trạng thái phổ biến (200, 401, 422, 500)', () => {
    expect(HTTP_STATUS.OK).toBe(200)
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
    expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422)
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
  })

  it('Kiểm tra: Object HTTP_STATUS là bất biến (Frozen)', () => {
    expect(Object.isFrozen(HTTP_STATUS)).toBe(true)
  })
})
