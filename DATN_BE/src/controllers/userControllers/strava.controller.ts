import { Request, Response } from 'express'
import stravaService from '~/services/userServices/strava.service'
import { envConfig } from '~/constants/config'

export const getStravaAuthUrlController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as any
  const url = await stravaService.getAuthUrl(user_id)
  return res.json({ message: 'Success', result: url })
}

export const stravaCallbackController = async (req: Request, res: Response) => {
  const { code, state } = req.query as any
  if (!code || !state) {
    return res.status(400).json({ message: 'Missing code or state' })
  }
  const userId = state
  await stravaService.exchangeToken(code, userId)
  return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/me?strava_connected=success`)
}

export const verifyStravaWebhookController = async (req: Request, res: Response) => {
  const challenge = req.query['hub.challenge']
  const token = req.query['hub.verify_token']
  
  if (token === envConfig.STRAVA_VERIFY_TOKEN || 'FITCONNECT_STRAVA_TOKEN') {
    return res.json({ 'hub.challenge': challenge })
  }
  return res.status(403).json({ message: 'Invalid verify token' })
}

export const stravaWebhookEventController = async (req: Request, res: Response) => {
  const event = req.body
  console.log('Strava webhook event received:', event)
  
  // Acknowledge quickly to prevent Strava from resending
  res.status(200).send('EVENT_RECEIVED')
  
  // Process the event asynchronously
  stravaService.processActivity(event).catch((err) => {
    console.error('Failed to process Strava activity async:', err)
  })
}

export const previewStravaEventController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as any
  const { eventId } = req.params

  const result = await stravaService.previewActivitiesForEvent(user_id, eventId)
  return res.json({ message: 'Success', result })
}

export const importStravaEventController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as any
  const { eventId } = req.params
  const { activityIds } = req.body

  if (!activityIds || !Array.isArray(activityIds) || activityIds.length === 0) {
    return res.status(400).json({ message: 'Cần cung cấp ít nhất 1 bài tập (activityIds)' })
  }

  const result = await stravaService.importActivitiesForEvent(user_id, eventId, activityIds)
  return res.json({ message: 'Đã nhập thành công', result })
}

export const disconnectStravaController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as any
  await stravaService.disconnectStrava(user_id)
  return res.json({ message: 'Đã hủy kết nối Strava' })
}
