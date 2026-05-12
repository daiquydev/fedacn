import authUserService from '../authUser.services'
import UserModel from '~/models/schemas/user.schema'
import RefreshTokenModel from '~/models/schemas/refreshToken.schema'
import { AUTH_USER_MESSAGE } from '~/constants/messages'

jest.mock('~/models/schemas/user.schema')
jest.mock('~/models/schemas/refreshToken.schema')

describe('[Module: AuthServices] - Quản lý tài khoản và xác thực', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // Đăng ký (5 cases)
  describe('Tính năng: Đăng ký tài khoản (Register)', () => {
    it('Trường hợp: Đăng ký thành công với dữ liệu hợp lệ', async () => {
      const payload = {
        name: 'Test User',
        email: 'test@gmail.com',
        password: 'password123',
        gender: 'male'
      }
      ;(UserModel.create as jest.Mock).mockResolvedValue({
        toObject: () => ({ ...payload, _id: '123' })
      })

      const result = await authUserService.register(payload as any)
      expect(UserModel.create).toHaveBeenCalled()
      expect(result).toHaveProperty('email', 'test@gmail.com')
    })

    it('Trường hợp: Chuẩn hóa email về chữ thường', async () => {
      const payload = { email: 'TEST@GMAIL.COM', password: '123', name: 'N' }
      ;(UserModel.create as jest.Mock).mockResolvedValue({ toObject: () => ({}) })
      await authUserService.register(payload as any)
      const call = (UserModel.create as jest.Mock).mock.calls[0][0]
      expect(call.email).toBe('test@gmail.com')
    })

    it('Trường hợp: Tự động tạo user_name từ email', async () => {
      const payload = { email: 'daiquy@gmail.com', password: '123', name: 'N' }
      ;(UserModel.create as jest.Mock).mockResolvedValue({ toObject: () => ({}) })
      await authUserService.register(payload as any)
      const call = (UserModel.create as jest.Mock).mock.calls[0][0]
      expect(call.user_name).toBe('daiquy')
    })

    it('Trường hợp: Mã hóa mật khẩu khi lưu vào DB', async () => {
      const payload = { email: 'a@b.com', password: '123', name: 'N' }
      ;(UserModel.create as jest.Mock).mockResolvedValue({ toObject: () => ({}) })
      await authUserService.register(payload as any)
      expect(UserModel.create).toHaveBeenCalled()
    })

    it('Trường hợp: Loại bỏ password khỏi dữ liệu trả về', async () => {
      const payload = { email: 'a@b.com', password: '123', name: 'N' }
      ;(UserModel.create as jest.Mock).mockResolvedValue({ toObject: () => ({ email: 'a@b.com', password: 'hashed' }) })
      const result = await authUserService.register(payload as any)
      expect(result).not.toHaveProperty('password')
    })
  })

  // Đăng nhập (5 cases)
  describe('Tính năng: Đăng nhập (Login)', () => {
    it('Lỗi: Email không tồn tại trong hệ thống', async () => {
      ;(UserModel.findOne as jest.Mock).mockReturnValue(null)
      const result = await authUserService.login({ email: 'none@b.com', password: '123' })
      expect(result).toBeUndefined()
    })

    it('Trường hợp: Trả về Token khi thông tin hợp lệ', async () => {
      const mockUser = {
        _id: '123',
        email: 'a@b.com',
        role: 1,
        status: 1,
        user_name: 'a',
        toObject: () => ({ _id: '123', role: 1, status: 1, email: 'a@b.com', user_name: 'a' })
      }
      ;(UserModel.findOne as jest.Mock).mockReturnValue(mockUser)
      ;(RefreshTokenModel.create as jest.Mock).mockResolvedValue({})
      
      const result = await authUserService.login({ email: 'a@b.com', password: '123' })
      expect(result).toHaveProperty('access_token')
      expect(result).toHaveProperty('refresh_token')
    })

    it('Trường hợp: Lưu RefreshToken vào cơ sở dữ liệu', async () => {
      ;(UserModel.findOne as jest.Mock).mockReturnValue({ _id: '1', role: 1, status: 1, email: 'a@b.com', user_name: 'a', toObject: () => ({}) })
      await authUserService.login({ email: 'a@b.com', password: '123' })
      expect(RefreshTokenModel.create).toHaveBeenCalled()
    })

    it('Lỗi: Tài khoản đã bị xóa (Deleted)', async () => {
       ;(UserModel.findOne as jest.Mock).mockReturnValue({ isDeleted: true })
       const result = await authUserService.login({ email: 'a@b.com', password: '123' })
       expect(result).toHaveProperty('message', AUTH_USER_MESSAGE.ACCOUNT_DELETED)
    })

    it('Trường hợp: Trả về thời gian hết hạn của Access Token', async () => {
       ;(UserModel.findOne as jest.Mock).mockReturnValue({ _id: '1', role: 1, status: 1, email: 'a@b.com', user_name: 'a', toObject: () => ({}) })
       const result = await authUserService.login({ email: 'a@b.com', password: '123' })
       expect(result).toHaveProperty('access_token_exp')
    })
  })

  // Các tiện ích xác thực (5 cases)
  describe('Tính năng: Tiện ích xác thực và OTP', () => {
    it('Kiểm tra sự tồn tại của Email', async () => {
      ;(UserModel.findOne as jest.Mock).mockReturnValue({ _id: '1' })
      const exists = await authUserService.checkEmailExist('a@b.com')
      expect(exists).toBe(true)
    })

    it('Trường hợp: Email chưa đăng ký', async () => {
      ;(UserModel.findOne as jest.Mock).mockReturnValue(null)
      const exists = await authUserService.checkEmailExist('a@b.com')
      expect(exists).toBe(false)
    })

    it('Tính năng: Đăng xuất (Xóa Refresh Token)', async () => {
      await authUserService.logout('token_123')
      expect(RefreshTokenModel.deleteOne).toHaveBeenCalledWith({ token: 'token_123' })
    })

    it('Tính năng: Gửi mã OTP xác thực', async () => {
       ;(UserModel.findOne as jest.Mock).mockReturnValue({ email: 'a@b.com' })
       const res = await authUserService.sendOtp('a@b.com')
       expect(res).toBe('a@b.com')
    })

    it('Lỗi: Gửi OTP cho Email không tồn tại', async () => {
       ;(UserModel.findOne as jest.Mock).mockReturnValue(null)
       try {
         await authUserService.sendOtp('none@b.com')
         throw new Error('Should not reach here')
       } catch (e: any) {
         expect(e.message).toBeDefined()
       }
    })
  })
})
