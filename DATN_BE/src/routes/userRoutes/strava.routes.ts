import { Router } from 'express'
import { getStravaAuthUrlController, stravaCallbackController, verifyStravaWebhookController, stravaWebhookEventController, previewStravaEventController, importStravaEventController } from '~/controllers/userControllers/strava.controller'
import { accessTokenValidator } from '~/middlewares/authUser.middleware'
import { wrapRequestHandler } from '~/utils/handler'

const stravaRouter = Router()

stravaRouter.get('/auth', accessTokenValidator, wrapRequestHandler(getStravaAuthUrlController))
stravaRouter.get('/callback', wrapRequestHandler(stravaCallbackController))

stravaRouter.get('/webhook', wrapRequestHandler(verifyStravaWebhookController))
stravaRouter.post('/webhook', wrapRequestHandler(stravaWebhookEventController))

stravaRouter.get('/preview-event/:eventId', accessTokenValidator, wrapRequestHandler(previewStravaEventController))
stravaRouter.post('/import-event/:eventId', accessTokenValidator, wrapRequestHandler(importStravaEventController))

export default stravaRouter
