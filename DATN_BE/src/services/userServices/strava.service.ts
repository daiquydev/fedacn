import axios from 'axios'
import UserModel from '~/models/schemas/user.schema'
import SportEventModel from '~/models/schemas/sportEvent.schema'
import SportEventProgressModel from '~/models/schemas/sportEventProgress.schema'
import ActivityTrackingModel from '~/models/schemas/activityTracking.schema'
import SportCategoryModel from '~/models/schemas/sportCategory.schema'
import sportEventProgressService from '~/services/userServices/sportEventProgress.services'
import { config } from 'dotenv'
import { envConfig } from '~/constants/config'
config()

// Helpers
function decodePolyline(str: string, precision: number = 5): [number, number][] {
  let index = 0, lat = 0, lng = 0, coordinates = [];
  let shift = 0, result = 0, byte = null, latitude_change, longitude_change;
  let factor = Math.pow(10, precision);

  while (index < str.length) {
    byte = null; shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += latitude_change;
    lng += longitude_change;
    coordinates.push([lat / factor, lng / factor] as [number, number]);
  }
  return coordinates;
}

// Strava activity.type → tên tiếng Việt
const STRAVA_TYPE_VI: Record<string, string> = {
  Run: 'Chạy bộ',
  Walk: 'Đi bộ',
  TrailRun: 'Chạy trail',
  VirtualRun: 'Chạy ảo',
  Ride: 'Đạp xe đường dài',
  VirtualRide: 'Đạp xe ảo',
  MountainBikeRide: 'Đạp xe địa hình',
  GravelRide: 'Đạp xe sỏi',
  EBikeRide: 'Đạp xe điện',
  Hike: 'Leo núi',
  AlpineSki: 'Trượt tuyết',
  RockClimbing: 'Leo vách đá',
  Swim: 'Bơi lội'
}

function getVietnameseName(stravaType: string): string {
  return STRAVA_TYPE_VI[stravaType] || stravaType
}

class StravaService {
  /**
   * Gen auth URL
   */
  async getAuthUrl(userId: string) {
    const clientId = envConfig.STRAVA_CLIENT_ID
    const redirectUri = envConfig.STRAVA_REDIRECT_URI || 'http://localhost:5000/api/strava/callback'
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=activity:read_all&state=${userId}`
  }

  /**
   * Exchange code for token
   */
  async exchangeToken(code: string, userId: string) {
    const clientId = envConfig.STRAVA_CLIENT_ID
    const clientSecret = envConfig.STRAVA_CLIENT_SECRET

    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code'
    })

    const data = response.data
    const tokenExpiresAt = new Date(data.expires_at * 1000)

    await UserModel.findByIdAndUpdate(userId, {
      stravaProviderId: data.athlete.id.toString(),
      stravaAccessToken: data.access_token,
      stravaRefreshToken: data.refresh_token,
      stravaTokenExpiresAt: tokenExpiresAt
    })

    return data
  }

  async disconnectStrava(userId: string) {
    await UserModel.findByIdAndUpdate(userId, {
      $unset: {
        stravaProviderId: 1,
        stravaAccessToken: 1,
        stravaRefreshToken: 1,
        stravaTokenExpiresAt: 1
      }
    })
  }

  /**
   * Process webhook activity create event
   */
  async processActivity(event: any) {
    if (event.object_type !== 'activity' || event.aspect_type !== 'create') {
      return
    }

    const ownerId = event.owner_id.toString()
    const activityId = event.object_id
    
    // Find user by strava id
    const user = await UserModel.findOne({ stravaProviderId: ownerId })
    if (!user) return

    let accessToken = user.stravaAccessToken
    // Check if token expired
    if (user.stravaTokenExpiresAt && new Date() >= user.stravaTokenExpiresAt) {
      try {
        const response = await axios.post('https://www.strava.com/oauth/token', {
          client_id: envConfig.STRAVA_CLIENT_ID,
          client_secret: envConfig.STRAVA_CLIENT_SECRET,
          refresh_token: user.stravaRefreshToken,
          grant_type: 'refresh_token'
        })
        const data = response.data
        accessToken = data.access_token
        await UserModel.findByIdAndUpdate(user._id, {
          stravaAccessToken: data.access_token,
          stravaRefreshToken: data.refresh_token,
          stravaTokenExpiresAt: new Date(data.expires_at * 1000)
        })
      } catch (err) {
        console.error('Failed to refresh Strava token:', err)
        return
      }
    }

    try {
      // Fetch the actual activity details using the access token
      const activityRes = await axios.get(`https://www.strava.com/api/v3/activities/${activityId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const activity = activityRes.data

      const distanceKm = Number((activity.distance / 1000).toFixed(2)) // Strava returns meters
      const timeMinutes = Number((activity.moving_time / 60).toFixed(2)) // Strava returns seconds
      const kcal = activity.calories || 0

      const now = new Date()
      // Find all active outdoor events for this user
      const activeEvents = await SportEventModel.find({
        eventType: 'Ngoài trời',
        startDate: { $lte: now },
        endDate: { $gte: now },
        participants_ids: user._id
      })

      for (const sportEvent of activeEvents) {
        // Filter by category: chỉ sync nếu activity.type khớp với stravaTypes của category
        const allowedTypes = await this.getAllowedStravaTypes(sportEvent.category)
        if (allowedTypes.length > 0 && !allowedTypes.includes(activity.type)) {
          continue
        }

        let value = 0
        const unit = (sportEvent.targetUnit || '').toLowerCase().trim()

        if (unit === 'km') {
          value = distanceKm
        } else if (['phút', 'phut', 'minute', 'minutes'].includes(unit)) {
          value = timeMinutes
        } else if (['kcal', 'calo', 'cal', 'calories'].includes(unit)) {
          value = kcal
        } else {
          value = distanceKm // Fallback to distance
        }

        if (value > 0) {
          await sportEventProgressService.addProgressService({
            eventId: sportEvent._id.toString(),
            userId: user._id.toString(),
            value: value,
            unit: sportEvent.targetUnit || 'km',
            distance: distanceKm,
            time: timeMinutes.toString(),
            calories: kcal,
            notes: `Strava Sync: ${activity.name}`,
            source: 'gps'
          })
        }
      }
    } catch (err) {
      console.error('Error fetching/processing Strava activity:', err)
    }
  }

  private async fetchRawStravaActivitiesForEvent(userId: string, eventId: string) {
    const user = await UserModel.findById(userId)
    if (!user || !user.stravaProviderId) {
      throw new Error('Chưa kết nối Strava')
    }

    let accessToken = user.stravaAccessToken
    if (user.stravaTokenExpiresAt && new Date() >= user.stravaTokenExpiresAt) {
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: envConfig.STRAVA_CLIENT_ID,
        client_secret: envConfig.STRAVA_CLIENT_SECRET,
        refresh_token: user.stravaRefreshToken,
        grant_type: 'refresh_token'
      })
      const data = response.data
      accessToken = data.access_token
      await UserModel.findByIdAndUpdate(userId, {
        stravaAccessToken: data.access_token,
        stravaRefreshToken: data.refresh_token,
        stravaTokenExpiresAt: new Date(data.expires_at * 1000)
      })
    }

    const sportEvent = await SportEventModel.findById(eventId)
    if (!sportEvent) throw new Error('Không tìm thấy sự kiện')
    if (sportEvent.eventType !== 'Ngoài trời') throw new Error('Sự kiện này không hỗ trợ ghi hoạt động ngoài trời')

    const now = new Date()
    if (sportEvent.startDate && new Date(sportEvent.startDate) > now) {
        throw new Error('Sự kiện chưa bắt đầu, không thể đồng bộ dữ liệu')
    }
    if (sportEvent.endDate && new Date(sportEvent.endDate) < now) {
        throw new Error('Sự kiện đã kết thúc, không thể đồng bộ dữ liệu mới')
    }

    const afterEpoch = Math.floor(new Date(sportEvent.startDate).getTime() / 1000)
    const endTime = sportEvent.endDate ? new Date(sportEvent.endDate) : new Date()
    endTime.setHours(23, 59, 59, 999)
    const beforeEpoch = Math.floor(Math.min(endTime.getTime(), Date.now()) / 1000)

    const activityRes = await axios.get(`https://www.strava.com/api/v3/athlete/activities`, {
      params: { 
        after: afterEpoch,
        before: beforeEpoch,
        per_page: 50 
      },
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    
    return { sportEvent, activities: activityRes.data }
  }

  async previewActivitiesForEvent(userId: string, eventId: string) {
    const { sportEvent, activities } = await this.fetchRawStravaActivitiesForEvent(userId, eventId)
    const previewList = []

    // Lấy danh sách Strava types cho phép từ DB theo category của sự kiện
    const allowedTypes = await this.getAllowedStravaTypes(sportEvent.category)

    for (const activity of activities) {
      // Filter theo category: nếu có cấu hình stravaTypes thì chỉ lấy các type khớp
      if (allowedTypes.length > 0 && !allowedTypes.includes(activity.type)) continue
      
      const activityIdStr = activity.id.toString()
      const exists = await SportEventProgressModel.exists({
        userId,
        stravaActivityId: activityIdStr
      })
      
      if (!exists) {
        const distanceKm = Number((activity.distance / 1000).toFixed(2))
        const timeMinutes = Number((activity.moving_time / 60).toFixed(2))
        const kcal = activity.calories || Math.round(distanceKm * 65 * (activity.type === 'Ride' ? 0.4 : activity.type === 'Walk' ? 0.75 : 1))

        previewList.push({
          stravaId: activityIdStr,
          name: activity.name,
          type: getVietnameseName(activity.type),
          startDate: activity.start_date || activity.start_date_local,
          distance: distanceKm,
          movingTime: timeMinutes,
          calories: kcal
        })
      }
    }
    return previewList
  }

  async importActivitiesForEvent(userId: string, eventId: string, activityIds: string[]) {
    const { sportEvent, activities } = await this.fetchRawStravaActivitiesForEvent(userId, eventId)

    // Lấy danh sách Strava types cho phép từ DB
    const allowedTypes = await this.getAllowedStravaTypes(sportEvent.category)

    let syncedCount = 0
    let totalDistanceAdded = 0
    const newActivities = []

    for (const activity of activities) {
      // Filter theo category
      if (allowedTypes.length > 0 && !allowedTypes.includes(activity.type)) continue
      
      const activityIdStr = activity.id.toString()
      if (!activityIds.includes(activityIdStr)) continue
      
      const exists = await SportEventProgressModel.exists({
        userId,
        stravaActivityId: activityIdStr
      })
      
      if (!exists) {
        const distanceKm = Number((activity.distance / 1000).toFixed(2))
        const timeMinutes = Number((activity.moving_time / 60).toFixed(2))
        const kcal = activity.calories || Math.round(distanceKm * 65 * (activity.type === 'Ride' ? 0.4 : activity.type === 'Walk' ? 0.75 : 1))

        let value = 0
        const unit = (sportEvent.targetUnit || '').toLowerCase().trim()
        if (unit === 'km') value = distanceKm
        else if (['phút', 'phut', 'minute', 'minutes'].includes(unit)) value = timeMinutes
        else if (['kcal', 'calo', 'cal', 'calories'].includes(unit)) value = kcal
        else value = distanceKm

        if (value > 0) {
          const runDate = new Date(activity.start_date || activity.start_date_local)
          
          await sportEventProgressService.addProgressService({
            eventId: sportEvent._id.toString(),
            userId: userId,
            date: runDate,
            value: value,
            unit: sportEvent.targetUnit || 'km',
            distance: distanceKm,
            time: timeMinutes.toString(),
            calories: kcal,
            notes: `Strava: ${activity.name}`,
            source: 'gps',
            stravaActivityId: activityIdStr
          } as any)
          
          const polylineStr = activity.map?.summary_polyline || ''
          const decodedCoords = polylineStr ? decodePolyline(polylineStr) : []
          const startTimestamp = new Date(activity.start_date || activity.start_date_local).getTime()
          const totalMs = (activity.moving_time || 0) * 1000
          const intervalMs = decodedCoords.length > 0 ? totalMs / decodedCoords.length : 0

          const gpsRoute = decodedCoords.map((coord, i) => ({
            lat: coord[0],
            lng: coord[1],
            timestamp: startTimestamp + (i * intervalMs),
            speed: activity.average_speed || 0
          }))

          await ActivityTrackingModel.create({
            eventId: sportEvent._id,
            userId: userId,
            activityType: getVietnameseName(activity.type),
            status: 'completed',
            startTime: new Date(activity.start_date || activity.start_date_local),
            endTime: new Date(startTimestamp + totalMs),
            totalDuration: activity.moving_time || 0,
            totalDistance: activity.distance || 0,
            avgSpeed: activity.average_speed || 0,
            maxSpeed: (activity.max_speed > 0 ? activity.max_speed : activity.average_speed) || 0,
            calories: kcal,
            gpsRoute: gpsRoute,
            source: 'strava'
          })
          
          syncedCount++
          totalDistanceAdded += distanceKm
          newActivities.push({ name: activity.name, distance: distanceKm, type: activity.type })
        }
      }
    }

    return { syncedCount, totalDistanceAdded, newActivities }
  }

  /**
   * Lấy danh sách Strava activity types cho phép từ DB theo tên category
   * Trả về mảng rỗng nếu category không có cấu hình → cho phép tất cả
   */
  private async getAllowedStravaTypes(categoryName: string): Promise<string[]> {
    try {
      const category = await SportCategoryModel.findOne({ 
        name: categoryName, 
        isDeleted: { $ne: true } 
      })
      return category?.stravaTypes?.length ? category.stravaTypes : []
    } catch {
      return []
    }
  }
}

export default new StravaService()
