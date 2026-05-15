import mongoose from 'mongoose'
import fs from 'fs'
import axios from 'axios'
import { envConfig } from '../constants/config'
import ActivityTrackingModel from '../models/schemas/activityTracking.schema'
import SportEventProgressModel from '../models/schemas/sportEventProgress.schema'
import SportEventModel from '../models/schemas/sportEvent.schema'

// Activity configuration
const ACTIVITY_CONFIG: any = {
  'Đi bộ': { avgSpeed: 1.4, speedVar: 0.3, calPerKm: 50 },
  'Chạy bộ': { avgSpeed: 2.8, speedVar: 1.0, calPerKm: 65 },
  'Chạy trail': { avgSpeed: 2.4, speedVar: 0.8, calPerKm: 75 },
  'Đạp xe': { avgSpeed: 6.5, speedVar: 2.5, calPerKm: 30 },
  'Bơi lội': { avgSpeed: 0.8, speedVar: 0.2, calPerKm: 200 }, // Kcal per km swimming is high
  'default': { avgSpeed: 2.5, speedVar: 1.0, calPerKm: 60 }
}

async function getRouteFromOSRM(lat: number, lng: number, distance: number = 2000) {
  // Create a small loop around the center
  // Point A: Center
  // Point B: North-East
  // Point C: South-East
  // Point D: Center (closed loop)
  const offset = 0.005; // ~500m
  const coords = [
    `${lng},${lat}`,
    `${lng + offset},${lat + offset}`,
    `${lng + offset * 2},${lat}`,
    `${lng + offset},${lat - offset}`,
    `${lng},${lat}`
  ].join(';')

  try {
    const url = `https://router.project-osrm.org/route/v1/walking/${coords}?overview=full&geometries=geojson`
    const res = await axios.get(url)
    if (res.data.code === 'Ok') {
      const geometry = res.data.routes[0].geometry.coordinates
      return geometry.map((c: any) => ({ lng: c[0], lat: c[1] }))
    }
  } catch (err) {
    console.warn('OSRM failed, using synthetic circular route')
  }

  // Fallback: Synthetic circle
  const points = []
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2
    points.push({
      lat: lat + Math.sin(angle) * 0.005,
      lng: lng + Math.cos(angle) * 0.005
    })
  }
  points.push(points[0])
  return points
}

async function seedAllOutdoorEvents() {
  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB')

  const outdoorEvents = await SportEventModel.find({ eventType: 'Ngoài trời' })
  console.log(`Processing ${outdoorEvents.length} outdoor events`)

  for (const event of outdoorEvents) {
    console.log(`--- Event: ${event.name} (${event.category}) ---`)
    
    const participants = event.participants_ids || []
    if (participants.length === 0) {
      console.log('No participants, skipping')
      continue
    }

    // Determine center location
    let centerLat = 21.0285; // Default Hanoi
    let centerLng = 105.8542;
    
    // Try to get coordinates from event object (assuming it might have lat/lng or parse from address)
    // For now, use some known locations based on name
    if (event.name.includes('Thống Nhất')) { centerLat = 21.0167; centerLng = 105.8475; }
    else if (event.name.includes('Hồ Tây')) { centerLat = 21.0583; centerLng = 105.8250; }
    else if (event.name.includes('Mỹ Đình')) { centerLat = 21.0205; centerLng = 105.7739; }
    else if (event.name.includes('Bạch Mã')) { centerLat = 16.1972; centerLng = 107.8597; }
    else if (event.name.includes('Tao Đàn')) { centerLat = 10.7744; centerLng = 106.6924; }
    else if (event.name.includes('Lê Thị Riêng')) { centerLat = 10.7850; centerLng = 106.6660; }
    else if (event.location && event.location.includes('TP.HCM')) { centerLat = 10.7626; centerLng = 106.6602; }

    const masterRoute = await getRouteFromOSRM(centerLat, centerLng)
    console.log(`Generated master route with ${masterRoute.length} points`)

    // Calculate approx loop distance
    let totalLoopDistanceM = 0
    for (let i = 0; i < masterRoute.length - 1; i++) {
      const p1 = masterRoute[i], p2 = masterRoute[i+1]
      const d = Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2)) * 111319 // rough estimate
      totalLoopDistanceM += d
    }

    const config = ACTIVITY_CONFIG[event.category] || ACTIVITY_CONFIG['default']
    
    // Clear existing
    await ActivityTrackingModel.deleteMany({ eventId: event._id })
    await SportEventProgressModel.deleteMany({ eventId: event._id })

    const eventStart = new Date(event.startDate)
    const eventEnd = event.endDate ? new Date(event.endDate) : new Date()
    const today = new Date()
    const limitDate = eventEnd < today ? eventEnd : today

    for (const userId of participants) {
      let currentDate = new Date(eventStart)
      while (currentDate <= limitDate) {
        // 50% chance of activity per day
        if (Math.random() > 0.5) {
          const startTime = new Date(currentDate)
          const startHour = Math.random() > 0.5 ? (5 + Math.floor(Math.random() * 4)) : (16 + Math.floor(Math.random() * 4))
          startTime.setHours(startHour, Math.floor(Math.random() * 60))

          const distanceFactor = 0.3 + Math.random() * 1.5
          const currentDistanceM = totalLoopDistanceM * distanceFactor
          const avgSpeed = config.avgSpeed + (Math.random() - 0.5) * config.speedVar
          const currentDuration = Math.round(currentDistanceM / avgSpeed)

          const startIndex = Math.floor(Math.random() * masterRoute.length)
          const numPointsNeeded = Math.max(5, Math.round(masterRoute.length * distanceFactor))
          
          const userJitterLat = (Math.random() - 0.5) * 0.0003
          const userJitterLng = (Math.random() - 0.5) * 0.0003

          const gpsRoute = []
          for (let i = 0; i < numPointsNeeded; i++) {
            const originalPoint = masterRoute[(startIndex + i) % masterRoute.length]
            gpsRoute.push({
              lat: Number((originalPoint.lat + userJitterLat + (Math.random()-0.5)*0.00005).toFixed(6)),
              lng: Number((originalPoint.lng + userJitterLng + (Math.random()-0.5)*0.00005).toFixed(6)),
              timestamp: startTime.getTime() + Math.round((i / numPointsNeeded) * currentDuration * 1000),
              speed: Number((avgSpeed * (0.8 + Math.random() * 0.4)).toFixed(2))
            })
          }

          const activity = await ActivityTrackingModel.create({
            eventId: event._id,
            userId,
            activityType: event.category || 'Chạy bộ',
            status: 'completed',
            startTime,
            endTime: new Date(startTime.getTime() + currentDuration * 1000),
            totalDuration: currentDuration,
            totalDistance: currentDistanceM,
            avgSpeed: Number(avgSpeed.toFixed(2)),
            maxSpeed: Number((avgSpeed * 1.4).toFixed(2)),
            avgPace: currentDistanceM > 0 ? Number(((currentDuration / 60) / (currentDistanceM / 1000)).toFixed(2)) : 0,
            calories: Math.round((currentDistanceM / 1000) * config.calPerKm),
            gpsRoute,
            source: 'app'
          })

          await SportEventProgressModel.create({
            eventId: event._id,
            userId,
            date: startTime,
            value: currentDistanceM / 1000,
            unit: 'km',
            distance: currentDistanceM / 1000,
            calories: Math.round((currentDistanceM / 1000) * config.calPerKm),
            time: `${Math.round(currentDuration / 60)} phút`,
            source: 'gps',
            activityTrackingId: activity._id
          })
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
    console.log(`Seeded ${participants.length} participants for ${event.name}`)
  }

  console.log('ALL outdoor events seeded successfully!')
  await mongoose.disconnect()
}

seedAllOutdoorEvents().catch(console.error)
