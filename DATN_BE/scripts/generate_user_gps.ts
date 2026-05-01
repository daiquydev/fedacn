import mongoose from 'mongoose'
import dotenv from 'dotenv'
import moment from 'moment'
import axios from 'axios'
import SportEventModel from '../src/models/schemas/sportEvent.schema'
import SportEventProgressModel from '../src/models/schemas/sportEventProgress.schema'
import ActivityTrackingModel from '../src/models/schemas/activityTracking.schema'
import SportCategoryModel from '../src/models/schemas/sportCategory.schema'
import UserModel from '../src/models/schemas/user.schema'

dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL || ''
const EVENT_ID = '69f31841ff933c90499665de'

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

// ─── GPS base coordinates mapped to event locations ───
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
  const locLower = location.toLowerCase()
  if (locLower.includes('hà nội')) return LOCATION_COORDS['Hồ Gươm, Hà Nội']
  if (locLower.includes('tp.hcm') || locLower.includes('hồ chí minh'))
    return LOCATION_COORDS['Phố đi bộ Nguyễn Huệ, TP.HCM']
  return DEFAULT_COORDS
}

function decodeValhallaPolyline(str: string, precision: number = 6) {
  let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision);
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
      coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}

async function getRealRoutePoints(startLng: number, startLat: number, endLng: number, endLat: number, startTime: Date, targetPaceMinPerKm: number) {
  try {
    const url = 'https://valhalla1.openstreetmap.de/route?json=' + encodeURIComponent(JSON.stringify({
      locations: [
        { lat: startLat, lon: startLng },
        { lat: endLat, lon: endLng }
      ],
      costing: 'pedestrian'
    }));
    
    const res = await axios.get(url, { timeout: 10000 });
    if (res.data && res.data.trip && res.data.trip.legs && res.data.trip.legs.length > 0) {
      const leg = res.data.trip.legs[0];
      const coords = decodeValhallaPolyline(leg.shape); // mảng [[lng, lat], ...]
      const points: any[] = [];
      const startTs = startTime.getTime();
      const actualDistanceKm = res.data.trip.summary.length;
      const actualDistanceM = actualDistanceKm * 1000;
      
      const durationSeconds = Math.round(actualDistanceKm * targetPaceMinPerKm * 60);
      
      for (let i = 0; i < coords.length; i++) {
        const [lng, lat] = coords[i];
        const t = (i / (coords.length - 1 || 1)) * durationSeconds;
        points.push({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          timestamp: Math.round(startTs + t * 1000),
          speed: Number((actualDistanceM / durationSeconds * rand(0.8, 1.2)).toFixed(2)),
          altitude: Number(rand(3, 15).toFixed(1))
        });
      }
      return { points, distanceM: actualDistanceM, durationSeconds };
    }
  } catch (error: any) {
    console.error('Valhalla API Error:', error.message);
  }
  return null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const run = async () => {
  try {
    console.log('🔗 Đang kết nối MongoDB...')
    await mongoose.connect(MONGODB_URL)
    console.log('✅ Kết nối thành công!')

    const event = await SportEventModel.findById(EVENT_ID)
    if (!event) {
      console.log('❌ Không tìm thấy event:', EVENT_ID)
      process.exit(1)
    }

    console.log(`📌 Event: ${event.name} (${event.category})`)

    const allUsers = await UserModel.find({});
    if (allUsers.length === 0) {
      console.log('❌ Không có user nào trong hệ thống.')
      process.exit(1)
    }

    // Lấy khoảng 70% users
    const shuffledUsers = allUsers.sort(() => 0.5 - Math.random());
    const selectedCount = Math.max(1, Math.ceil(allUsers.length * 0.7));
    const selectedUsers = shuffledUsers.slice(0, selectedCount);

    console.log(`📌 Chọn ${selectedUsers.length}/${allUsers.length} users (70%) để tham gia sự kiện.`);

    // Lấy config kcal
    let kcalPerKm = 60;
    const cat = await SportCategoryModel.findOne({ name: event.category })
    if (cat && cat.kcal_per_unit > 0) {
      kcalPerKm = cat.kcal_per_unit;
    }

    const eventStart = moment(event.startDate)
    const now = moment('2026-04-30T16:07:40+07:00')
    
    if (eventStart.isAfter(now)) {
      console.log('⚠️ Sự kiện chưa bắt đầu so với thời gian hiện tại.')
      process.exit(0)
    }

    const baseCoords = getBaseCoords(event.location || '')
    
    // Xóa toàn bộ dữ liệu cũ của event trước khi tạo lại
    await ActivityTrackingModel.deleteMany({ eventId: event._id });
    await SportEventProgressModel.deleteMany({ eventId: event._id });
    console.log('🧹 Đã xóa toàn bộ dữ liệu hoạt động cũ của sự kiện để tạo lại chính xác.');

    let totalActivities = 0;
    let eventParticipantsIds = new Set(event.participants_ids?.map(id => id.toString()) || []);

    for (let uIndex = 0; uIndex < selectedUsers.length; uIndex++) {
      const user = selectedUsers[uIndex];
      console.log(`\n👤 [${uIndex+1}/${selectedUsers.length}] Đang xử lý user: ${user.name} (${user.email})`);

      if (!eventParticipantsIds.has(user._id.toString())) {
        eventParticipantsIds.add(user._id.toString());
      }

      await ActivityTrackingModel.deleteMany({ eventId: event._id, userId: user._id });
      await SportEventProgressModel.deleteMany({ eventId: event._id, userId: user._id });

      const profileType = Math.random(); // Phân loại mức độ chạy
      let runDayJumpMin = 2, runDayJumpMax = 4;
      let distanceRadiusMin = 0.01, distanceRadiusMax = 0.02;
      let distanceMaxLimit = 10; // km

      let profileName = "Bình thường";
      if (profileType < 0.3) { // Chạy ít
        runDayJumpMin = 4; runDayJumpMax = 8;
        distanceRadiusMin = 0.005; distanceRadiusMax = 0.01;
        distanceMaxLimit = 3.5;
        profileName = "Chạy ít";
      } else if (profileType > 0.8) { // Chạy nhiều
        runDayJumpMin = 1; runDayJumpMax = 2;
        distanceRadiusMin = 0.02; distanceRadiusMax = 0.05;
        distanceMaxLimit = 25;
        profileName = "Chạy nhiều";
      }
      console.log(`   🏃 Profile: ${profileName} (Max: ${distanceMaxLimit}km)`);

      let loopStart = eventStart.clone().startOf('day')
      let loopEnd = now.clone().endOf('day')

      const runDays = []
      let curr = loopStart.clone().add(Math.floor(rand(0, 3)), 'days') // Bắt đầu random trong 3 ngày đầu
      while (curr.isSameOrBefore(now)) {
        runDays.push(curr.clone())
        curr.add(Math.floor(rand(runDayJumpMin, runDayJumpMax + 1)), 'days')
      }

      const activityBatch: any[] = []
      const progressBatch: any[] = []

      for (const day of runDays) {
        const h = Math.floor(rand(5, 20)) // 5h sáng đến 20h tối
        const m = Math.floor(rand(0, 60))
        const startTime = day.clone().hours(h).minutes(m).seconds(0).toDate()
        
        const startLng = baseCoords.lng + rand(-distanceRadiusMin, distanceRadiusMin)
        const startLat = baseCoords.lat + rand(-distanceRadiusMin, distanceRadiusMin)
        
        const endLng = startLng + rand(-distanceRadiusMax, distanceRadiusMax)
        const endLat = startLat + rand(-distanceRadiusMax, distanceRadiusMax)
        
        const targetPace = rand(5.0, 9.0); // 5 to 9 min/km
        
        // Cần delay chút tránh rate limit OSRM (1 request mỗi 200ms)
        await sleep(300);
        
        const routeData = await getRealRoutePoints(startLng, startLat, endLng, endLat, startTime, targetPace)
        
        if (!routeData || routeData.points.length === 0) {
          continue
        }
        
        const distanceM = routeData.distanceM
        const distanceKm = Number((distanceM / 1000).toFixed(2))
        
        // Lọc bớt các quãng đường vô lý (do valhalla vẽ vòng vèo)
        if(distanceKm < 0.5 || distanceKm > distanceMaxLimit) {
            continue
        }
        
        const durationSeconds = routeData.durationSeconds
        const endTime = moment(startTime).add(durationSeconds, 'seconds').toDate()
        const avgSpeedMs = distanceM / durationSeconds
        const maxSpeedMs = avgSpeedMs * rand(1.1, 1.3)
        const avgPace = Number(((durationSeconds / 60) / distanceKm).toFixed(2))
        const calories = Math.round(distanceKm * kcalPerKm)

        activityBatch.push({
          eventId: event._id,
          userId: user._id,
          activityType: event.category || 'Chạy bộ',
          status: 'completed',
          startTime,
          endTime,
          totalDuration: durationSeconds,
          totalDistance: distanceM,
          avgSpeed: Number(avgSpeedMs.toFixed(2)),
          maxSpeed: Number(maxSpeedMs.toFixed(2)),
          avgPace,
          calories,
          gpsRoute: routeData.points,
          pauseIntervals: []
        })

        const durationMinCalc = Math.floor(durationSeconds / 60)
        progressBatch.push({
          eventId: event._id,
          userId: user._id,
          date: startTime,
          value: distanceKm,
          unit: 'km',
          distance: distanceKm,
          calories,
          time: `${durationMinCalc} phút`,
          source: 'gps',
          notes: `Hoạt động ${event.category} - ${distanceKm}km trong ${durationMinCalc} phút`
        })
      }

      if (activityBatch.length > 0) {
        await ActivityTrackingModel.insertMany(activityBatch)
        await SportEventProgressModel.insertMany(progressBatch)
        console.log(`   ✅ Đã lưu ${activityBatch.length} hoạt động cho ${user.email}`);
        totalActivities += activityBatch.length;
      } else {
        console.log(`   ⚠️ Không có hoạt động nào được tạo cho ${user.email}`);
      }
    }

    // Cập nhật mảng participants cho Event một lần
    await SportEventModel.updateOne(
      { _id: event._id },
      {
        $set: { participants_ids: Array.from(eventParticipantsIds) },
        participants: eventParticipantsIds.size
      }
    )
    console.log(`\n🎉 HOÀN THÀNH! Tổng cộng đã tạo ${totalActivities} hoạt động cho ${selectedUsers.length} user. Cập nhật ${eventParticipantsIds.size} participants vào event.`);

  } catch (err) {
    console.error(err)
  } finally {
    mongoose.disconnect()
    console.log('🔌 Đã ngắt kết nối MongoDB')
    process.exit(0)
  }
}

run()

