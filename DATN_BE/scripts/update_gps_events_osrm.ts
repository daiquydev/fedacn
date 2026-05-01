import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import { buildGpsRouteForSeed } from './osrmGpsRoute'

// Đảm bảo không skip OSRM để có route thực tế
process.env.SEED_SKIP_OSRM = '0'
dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL || ''

const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  'Công viên Thống Nhất, Hà Nội': { lat: 21.0117, lng: 105.8443 },
  'Hồ Tây, Hà Nội': { lat: 21.0535, lng: 105.8199 },
  'Khu đô thị Sala, TP.HCM': { lat: 10.7721, lng: 106.7228 },
  'Công viên Gia Định, TP.HCM': { lat: 10.8121, lng: 106.6800 },
  'Phố đi bộ Nguyễn Huệ, TP.HCM': { lat: 10.7738, lng: 106.7028 },
  'Hồ Gươm, Hà Nội': { lat: 21.0285, lng: 105.8525 },
  'Khu du lịch sinh thái': { lat: 10.801, lng: 106.665 }
}
const DEFAULT_COORDS = { lat: 10.783, lng: 106.695 }

function getBaseCoords(location: string): { lat: number; lng: number } {
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (location.includes(key) || key.includes(location)) return coords
  }
  return DEFAULT_COORDS
}

function hashMod(str: string, mod: number) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h % mod
}

async function fixGps() {
  await mongoose.connect(MONGODB_URL)
  console.log('✅ Đã kết nối DB')
  
  // Find events created recently by names
  const events = await SportEventModel.find({ name: { $in: [
    'Chạy bộ cộng đồng vì sức khỏe', 
    'Đạp xe xuyên thành phố', 
    'Đi bộ khám phá Hồ Tây', 
    'Bơi lội mùa hè', 
    'Chinh phục đỉnh núi Bạch Mã'
  ]}})

  console.log(`📋 Đã tìm thấy ${events.length} sự kiện cần sửa GPS.`)

  for (const ev of events) {
    console.log(`\n==============================================`)
    console.log(`Đang xử lý sự kiện: ${ev.name}`)
    const baseCoords = getBaseCoords(ev.location)
    
    const activities = await ActivityTrackingModel.find({ eventId: ev._id })
    console.log(`- Có ${activities.length} hoạt động GPS cần sửa đổi...`)
    
    let updated = 0
    let failed = 0
    let lastLogTime = Date.now()

    for (let i = 0; i < activities.length; i++) {
      const act = activities[i]
      
      const userIdStr = act.userId.toString()
      const userHash = hashMod(userIdStr, 360)
      const baseLat = baseCoords.lat + (hashMod(userIdStr + 'lat', 200) / 100000 - 0.001) * 0.5
      const baseLng = baseCoords.lng + (hashMod(userIdStr + 'lng', 200) / 100000 - 0.001) * 0.5
      // Add more variation using the activity _id
      const bearingDeg = (hashMod(ev._id.toString() + userIdStr, 360) + userHash * 0.01 + hashMod(act._id.toString(), 360)) % 360
      
      const targetKm = act.totalDistance / 1000
      
      try {
        const result = await buildGpsRouteForSeed({
          baseLat,
          baseLng,
          targetKm,
          bearingDeg,
          category: act.activityType,
          startMs: new Date(act.startTime!).getTime(),
          endMs: new Date(act.endTime!).getTime(),
          avgSpeedMs: act.avgSpeed,
          altBase: 10,
          altAmp: 5,
          seed: hashMod(act._id.toString(), 10000)
        })
        
        if (result.points && result.points.length > 0) {
          act.gpsRoute = result.points as any
          // Update totalDistance based on OSRM result if there is a big difference, or keep it similar
          // Actually updating it makes it more realistic
          act.totalDistance = result.lengthM
          await act.save()
          updated++
        } else {
          failed++
        }
      } catch (err) {
        failed++
      }

      if (Date.now() - lastLogTime > 3000) {
         console.log(`  [Tiến độ] ${i+1}/${activities.length} (Đã cập nhật: ${updated}, Lỗi: ${failed})`)
         lastLogTime = Date.now()
      }
    }
    console.log(`✅ Hoàn thành sự kiện ${ev.name}: Đã cập nhật ${updated}, Lỗi OSRM ${failed}`)
  }
  
  await mongoose.disconnect()
  console.log('\n🎉 Đã cập nhật xong tất cả GPS thực tế!')
}

fixGps()
