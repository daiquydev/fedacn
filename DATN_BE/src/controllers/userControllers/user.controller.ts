import { Request, Response } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGE } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/authUser.request'
import usersService from '~/services/userServices/user.services'
import { ErrorWithStatus } from '~/utils/error'

export const getMeController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const me = await usersService.getMe({
    user_id: user.user_id
  })
  return res.json({
    message: USER_MESSAGE.GET_ME_SUCCESS,
    result: me
  })
}

export const getUserController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload
  const result = await usersService.getUserById({
    id: id,
    user_id: user.user_id
  })
  return res.json({
    message: USER_MESSAGE.GET_USER_SUCCESS,
    result: result
  })
}

export const followUserController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { follow_id } = req.body
  if (user.user_id === follow_id) {
    throw new ErrorWithStatus({
      message: USER_MESSAGE.CANNOT_FOLLOW_YOURSELF,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
  const result = await usersService.followUserService({
    user_id: user.user_id,
    follow_id: follow_id
  })
  return res.json({
    message: USER_MESSAGE.FOLLOW_USER_SUCCESS,
    result: result
  })
}

export const unfollowUserController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { follow_id } = req.body
  const result = await usersService.unfollowUserService({
    user_id: user.user_id,
    follow_id: follow_id
  })
  return res.json({
    message: USER_MESSAGE.UNFOLLOW_USER_SUCCESS,
    result: result
  })
}

export const updateAvatarUserController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const file = req.file
  const result = await usersService.updateAvatarUserService({
    user_id: user.user_id,
    image: file
  })
  return res.json({
    message: USER_MESSAGE.UPDATE_USER_SUCCESS,
    result: result
  })
}

export const updateCoverAvatarUserController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const file = req.file
  const result = await usersService.updateCoverAvatarUserService({
    user_id: user.user_id,
    image: file
  })
  return res.json({
    message: USER_MESSAGE.UPDATE_USER_SUCCESS,
    result: result
  })
}

export const updateUserController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { name, user_name, birthday, address, gender } = req.body
  const result = await usersService.updateUserService({
    user_id: user.user_id,
    name: name,
    user_name: user_name,
    birthday: birthday ? new Date(birthday) : undefined,
    address: address,
    gender: gender
  })
  return res.json({
    message: USER_MESSAGE.UPDATE_USER_SUCCESS,
    result: result
  })
}

export const updateHealthProfileUserController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const result = await usersService.updateHealthProfileService({
    user_id: user.user_id,
    ...req.body
  })
  return res.json({
    message: USER_MESSAGE.UPDATE_USER_SUCCESS,
    result: result
  })
}

export const updatePasswordUserController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { old_password, new_password } = req.body
  const result = await usersService.changePasswordService({
    user_id: user.user_id,
    old_password: old_password,
    new_password: new_password
  })
  return res.json({
    message: USER_MESSAGE.UPDATE_PASSWORD_SUCCESS,
    result: result
  })
}

export const getBookmarkedUserController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const result = await usersService.getBookmarkedUserService({
    user_id: user.user_id
  })
  return res.json({
    message: USER_MESSAGE.GET_BOOKMARKED_SUCCESS,
    result: result
  })
}

export const recommendUsersController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const result = await usersService.recommendUsersService({
    user_id: user.user_id
  })
  return res.json({
    message: USER_MESSAGE.RECOMMEND_USER_SUCCESS,
    result: result
  })
}

export const requestUpgradeToChefController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { reason, proof } = req.body
  const result = await usersService.requestUpgradeToChefService({
    user_id: user.user_id,
    reason: reason,
    proof: proof
  })
  return res.json({
    message: USER_MESSAGE.REQUEST_UPGRADE_SUCCESS,
    result: result
  })
}

export const getMeStatsController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const result = await usersService.getMeStats({
    user_id: user.user_id
  })
  return res.json({
    message: 'Lấy thống kê thành công',
    result: result
  })
}

export const getTodayActivityController = async (req: Request, res: Response) => {
  const viewer = req.decoded_authorization as TokenPayload
  const { id } = req.params as { id: string }
  const allowed = new Set(['today', '24h', '7days', '1month', '6months', 'all', 'custom'])
  let range = (req.query.range as string) || '7days'
  if (!allowed.has(range)) range = '7days'
  const startDate = (req.query.startDate as string) || undefined
  const endDate = (req.query.endDate as string) || undefined

  if (range === 'custom') {
    if (!startDate || !endDate) {
      throw new ErrorWithStatus({
        message: 'Vui lòng chọn khoảng ngày (startDate, endDate) cho bộ lọc tùy chỉnh',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    const s = new Date(startDate)
    s.setHours(0, 0, 0, 0)
    const e = new Date(endDate)
    e.setHours(0, 0, 0, 0)
    if (s.getTime() > e.getTime()) {
      throw new ErrorWithStatus({
        message: 'Ngày bắt đầu không được sau ngày kết thúc',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
  }

  const result = await usersService.getTodayActivitySummary({
    target_user_id: id,
    viewer_user_id: viewer.user_id,
    range,
    startDate,
    endDate
  })
  return res.json({
    message: 'Lấy thống kê hoạt động thành công',
    result
  })
}
