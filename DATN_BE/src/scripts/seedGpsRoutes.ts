import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import ActivityTrackingModel from '../models/schemas/activityTracking.schema'

/**
 * Seed GPS route data for completed activities that have empty gpsRoute.
 * Generates a realistic ~ 2km running route around HCM city area.
 */
async function seedGpsRoutes() {
    await mongoose.connect(envConfig.mongoURL)
    console.log('Connected to MongoDB')

    // Find completed activities with empty or very short gpsRoute
    const activities = await ActivityTrackingModel.find({
        status: 'completed',
        $or: [{ gpsRoute: { $size: 0 } }, { gpsRoute: { $size: 1 } }, { gpsRoute: { $exists: false } }]
    })

    console.log(`Found ${activities.length} activities without GPS route data`)

    if (activities.length === 0) {
        console.log('No activities to update. Exiting...')
        await mongoose.disconnect()
        return
    }

    // Generate a realistic running route (~2km loop around Thu Duc / HCMC area)
    // Base coordinates: near Đại Học Quốc Gia HCM
    const baseRoutes = [
        // Route A: ~2.1km loop near Thu Duc
        generateRoute(10.8700, 106.8030, 2100, 'loop', 60),
        // Route B: ~1.5km straight run
        generateRoute(10.8720, 106.8010, 1500, 'straight', 45),
        // Route C: ~3.0km mixed route
        generateRoute(10.8680, 106.8050, 3000, 'zigzag', 90)
    ]

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i]
        const route = baseRoutes[i % baseRoutes.length]
        const startTime = new Date(activity.startTime).getTime()

        // Assign GPS route with timestamps
        const gpsRoute = route.map((point, idx) => ({
            lat: point.lat,
            lng: point.lng,
            timestamp: startTime + idx * 5000, // 5-second intervals
            speed: 1.5 + Math.random() * 2.5 // 1.5 ~ 4 m/s (5.4 ~ 14.4 km/h)
        }))

        // Calculate realistic stats
        let totalDistance = 0
        for (let j = 1; j < gpsRoute.length; j++) {
            totalDistance += haversine(gpsRoute[j - 1].lat, gpsRoute[j - 1].lng, gpsRoute[j].lat, gpsRoute[j].lng)
        }

        const totalDuration = gpsRoute.length * 5 // seconds
        const avgSpeed = totalDistance > 0 ? totalDistance / totalDuration : 0
        const maxSpeed = Math.max(...gpsRoute.map((p) => p.speed || 0))
        const avgPace = totalDistance > 0 ? totalDuration / (totalDistance / 1000) : 0
        const calories = Math.round(totalDistance / 1000 * 65) // ~65 kcal/km

        await ActivityTrackingModel.updateOne(
            { _id: activity._id },
            {
                $set: {
                    gpsRoute,
                    totalDistance: Math.round(totalDistance),
                    totalDuration,
                    avgSpeed: Number(avgSpeed.toFixed(4)),
                    maxSpeed: Number(maxSpeed.toFixed(4)),
                    avgPace: Number(avgPace.toFixed(2)),
                    calories
                }
            }
        )

        console.log(
            `✅ Updated activity ${activity._id}: ${(totalDistance / 1000).toFixed(2)}km, ${gpsRoute.length} GPS points, ${Math.round(totalDuration / 60)}min`
        )
    }

    console.log(`\nDone! Updated ${activities.length} activities with GPS route data.`)
    await mongoose.disconnect()
}

/** Generate a list of {lat, lng} points for a running route */
function generateRoute(
    baseLat: number,
    baseLng: number,
    distanceMeters: number,
    style: 'loop' | 'straight' | 'zigzag',
    numPoints: number
) {
    const points: { lat: number; lng: number }[] = []
    const meterPerDegLat = 111320
    const meterPerDegLng = 111320 * Math.cos((baseLat * Math.PI) / 180)

    if (style === 'loop') {
        // Circular-ish loop
        const radius = distanceMeters / (2 * Math.PI)
        for (let i = 0; i < numPoints; i++) {
            const angle = (2 * Math.PI * i) / numPoints
            const jitterLat = (Math.random() - 0.5) * 0.00005
            const jitterLng = (Math.random() - 0.5) * 0.00005
            points.push({
                lat: baseLat + (radius * Math.sin(angle)) / meterPerDegLat + jitterLat,
                lng: baseLng + (radius * Math.cos(angle)) / meterPerDegLng + jitterLng
            })
        }
        // Close the loop
        points.push({ lat: points[0].lat, lng: points[0].lng })
    } else if (style === 'straight') {
        // Straight line with slight curves (heading NE)
        const stepLat = (distanceMeters * 0.7) / numPoints / meterPerDegLat
        const stepLng = (distanceMeters * 0.7) / numPoints / meterPerDegLng
        for (let i = 0; i < numPoints; i++) {
            const curve = Math.sin((i / numPoints) * Math.PI) * 0.0003
            points.push({
                lat: baseLat + stepLat * i + curve,
                lng: baseLng + stepLng * i + (Math.random() - 0.5) * 0.00003
            })
        }
    } else {
        // Zigzag pattern
        const stepLat = (distanceMeters * 0.5) / numPoints / meterPerDegLat
        for (let i = 0; i < numPoints; i++) {
            const zigzag = ((i % 2 === 0 ? 1 : -1) * distanceMeters * 0.15) / meterPerDegLng
            const progress = i / numPoints
            points.push({
                lat: baseLat + stepLat * i,
                lng: baseLng + zigzag * (0.3 + Math.random() * 0.4) + progress * 0.001
            })
        }
    }

    return points
}

/** Haversine distance in meters */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

seedGpsRoutes().catch(console.error)
