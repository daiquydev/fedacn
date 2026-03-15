import { useState, useEffect, useRef, useCallback } from 'react'

// Haversine formula to calculate distance between two GPS points (in metres)
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000 // Earth's radius in metres
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

// Format duration (seconds) to HH:MM:SS
export function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Format pace (seconds per km) to MM'SS"
export function formatPace(secondsPerKm) {
    if (!secondsPerKm || !isFinite(secondsPerKm) || secondsPerKm <= 0) return '-:--'
    const minutes = Math.floor(secondsPerKm / 60)
    const seconds = Math.floor(secondsPerKm % 60)
    return `${minutes}'${String(seconds).padStart(2, '0')}"`
}

// Estimate calories burned using kcal_per_unit from SportCategory
// Ngoài trời: kcalPerKm × distance(km)
function estimateCalories(distanceMetres, kcalPerKm) {
    if (!kcalPerKm || kcalPerKm <= 0) return 0
    const distanceKm = distanceMetres / 1000
    return Math.round(kcalPerKm * distanceKm)
}

export default function useActivityTracking() {
    const [isTracking, setIsTracking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [duration, setDuration] = useState(0)
    const [distance, setDistance] = useState(0) // metres
    const [currentSpeed, setCurrentSpeed] = useState(0) // m/s
    const [maxSpeed, setMaxSpeed] = useState(0) // m/s
    const [avgSpeed, setAvgSpeed] = useState(0) // m/s
    const [avgPace, setAvgPace] = useState(0) // seconds per km
    const [calories, setCalories] = useState(0)
    const [gpsPoints, setGpsPoints] = useState([])
    const [currentPosition, setCurrentPosition] = useState(null)
    const [gpsAccuracy, setGpsAccuracy] = useState(null)
    const [activityType, setActivityType] = useState('running')
    const [gpsError, setGpsError] = useState(null)
    const [kcalPerKm, setKcalPerKm] = useState(0)

    // Split/Lap tracking
    const [splits, setSplits] = useState([]) // [{ km: 1, time: 285, pace: '4:45' }, ...]
    const lastSplitDistRef = useRef(0)
    const lastSplitTimeRef = useRef(0)

    // GPS Anti-cheat flags
    const [gpsFlags, setGpsFlags] = useState([]) // [{ type: 'teleport'|'speed', ... }]

    const timerRef = useRef(null)
    const watchIdRef = useRef(null)
    const wakeLockRef = useRef(null)
    const pauseIntervalsRef = useRef([])
    const lastPositionRef = useRef(null)
    const distanceRef = useRef(0)
    const durationRef = useRef(0)
    const isPausedRef = useRef(false)
    const kcalPerKmRef = useRef(0)

    // Keep refs in sync
    useEffect(() => {
        isPausedRef.current = isPaused
    }, [isPaused])

    // Request wake lock to keep screen on
    const requestWakeLock = useCallback(async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen')
            }
        } catch (err) {
            console.log('Wake Lock not supported or denied:', err)
        }
    }, [])

    const releaseWakeLock = useCallback(() => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release()
            wakeLockRef.current = null
        }
    }, [])

    // Start GPS tracking
    const startGps = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsError('Trình duyệt không hỗ trợ GPS')
            return
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed, accuracy, altitude } = position.coords
                const point = {
                    lat: latitude,
                    lng: longitude,
                    timestamp: Date.now(),
                    speed: speed || 0,
                    altitude: altitude || 0
                }

                setCurrentPosition({ lat: latitude, lng: longitude })
                setGpsAccuracy(accuracy)
                setGpsError(null)

                if (isPausedRef.current) return

                // Filter out inaccurate GPS readings (> 30m)
                if (accuracy > 30) return

                const lastPos = lastPositionRef.current
                if (lastPos) {
                    const dist = haversineDistance(lastPos.lat, lastPos.lng, latitude, longitude)
                    const timeDiff = (point.timestamp - lastPos.timestamp) / 1000

                    // GPS Anti-cheat: flag teleport (>500m jump)
                    if (dist > 500) {
                        setGpsFlags(prev => [...prev, {
                            type: 'teleport', distance: Math.round(dist),
                            timestamp: Date.now(), lat: latitude, lng: longitude
                        }])
                        // Skip this point entirely
                        lastPositionRef.current = point
                        setGpsPoints((prev) => [...prev, point])
                        return
                    }

                    // GPS Anti-cheat: flag impossible speed (>50km/h = 13.9m/s)
                    if (timeDiff > 0 && dist / timeDiff > 13.9) {
                        setGpsFlags(prev => [...prev, {
                            type: 'speed', speed: Math.round(dist / timeDiff * 3.6),
                            timestamp: Date.now()
                        }])
                    }

                    // Filter noise: ignore movements < 3m or > 100m (GPS jump)
                    if (dist >= 3 && dist <= 100) {
                        distanceRef.current += dist
                        setDistance(distanceRef.current)

                        // Split/Lap: auto-split every km
                        const currentKm = Math.floor(distanceRef.current / 1000)
                        const lastKm = Math.floor(lastSplitDistRef.current / 1000)
                        if (currentKm > lastKm && currentKm > 0) {
                            const splitTime = durationRef.current - lastSplitTimeRef.current
                            setSplits(prev => [...prev, {
                                km: currentKm,
                                time: splitTime,
                                pace: formatPace(splitTime) // pace for this km
                            }])
                            lastSplitDistRef.current = currentKm * 1000
                            lastSplitTimeRef.current = durationRef.current
                        }
                    }
                }

                // Update current speed from GPS
                if (speed !== null && speed > 0) {
                    setCurrentSpeed(speed)
                    setMaxSpeed((prev) => Math.max(prev, speed))
                } else if (lastPos) {
                    const timeDiff = (point.timestamp - lastPos.timestamp) / 1000
                    if (timeDiff > 0) {
                        const dist = haversineDistance(lastPos.lat, lastPos.lng, latitude, longitude)
                        const calculatedSpeed = dist / timeDiff
                        if (calculatedSpeed < 15) {
                            setCurrentSpeed(calculatedSpeed)
                            setMaxSpeed((prev) => Math.max(prev, calculatedSpeed))
                        }
                    }
                }

                lastPositionRef.current = point
                setGpsPoints((prev) => [...prev, point])
            },
            (error) => {
                console.error('GPS Error:', error)
                setGpsError(error.message)
            },
            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 10000
            }
        )
    }, [])

    // Start tracking
    const start = useCallback(
        (type = 'running', options = {}) => {
            setActivityType(type)
            const kcalVal = options.kcalPerKm || 0
            setKcalPerKm(kcalVal)
            kcalPerKmRef.current = kcalVal
            setIsTracking(true)
            setIsPaused(false)
            distanceRef.current = 0
            durationRef.current = 0
            pauseIntervalsRef.current = []

            requestWakeLock()
            startGps()

            // Timer - count every second
            timerRef.current = setInterval(() => {
                if (!isPausedRef.current) {
                    durationRef.current += 1
                    setDuration(durationRef.current)
                }
            }, 1000)
        },
        [requestWakeLock, startGps]
    )

    // Pause
    const pause = useCallback(() => {
        setIsPaused(true)
        setCurrentSpeed(0)
        pauseIntervalsRef.current.push({ start: Date.now(), end: null })
    }, [])

    // Resume
    const resume = useCallback(() => {
        setIsPaused(false)
        const intervals = pauseIntervalsRef.current
        if (intervals.length > 0 && intervals[intervals.length - 1].end === null) {
            intervals[intervals.length - 1].end = Date.now()
        }
        requestWakeLock()
    }, [requestWakeLock])

    // Stop (complete)
    const stop = useCallback(() => {
        setIsTracking(false)
        setIsPaused(false)

        // Close pause interval if open
        const intervals = pauseIntervalsRef.current
        if (intervals.length > 0 && intervals[intervals.length - 1].end === null) {
            intervals[intervals.length - 1].end = Date.now()
        }

        // Clear timer
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }

        // Stop GPS
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }

        releaseWakeLock()
    }, [releaseWakeLock])

    // Discard
    const discard = useCallback(() => {
        stop()
        setDistance(0)
        setDuration(0)
        setGpsPoints([])
        setCurrentSpeed(0)
        setMaxSpeed(0)
        setAvgSpeed(0)
        setAvgPace(0)
        setCalories(0)
        distanceRef.current = 0
        durationRef.current = 0
        lastPositionRef.current = null
        pauseIntervalsRef.current = []
    }, [stop])

    // Update computed values whenever distance or duration changes
    useEffect(() => {
        if (duration > 0 && distance > 0) {
            const avg = distance / duration
            setAvgSpeed(avg)
            // Pace: seconds per km
            const pace = 1000 / avg
            setAvgPace(pace)
        }
        setCalories(estimateCalories(distance, kcalPerKm))
    }, [distance, kcalPerKm])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
            releaseWakeLock()
        }
    }, [releaseWakeLock])

    // Get current data snapshot for saving
    const getSnapshot = useCallback(() => {
        return {
            gpsRoute: gpsPoints,
            totalDistance: distanceRef.current,
            totalDuration: durationRef.current,
            avgSpeed,
            maxSpeed,
            avgPace,
            calories,
            pauseIntervals: pauseIntervalsRef.current,
            splits,
            gpsFlags
        }
    }, [gpsPoints, avgSpeed, maxSpeed, avgPace, calories, splits, gpsFlags])

    return {
        isTracking,
        isPaused,
        duration,
        distance,
        currentSpeed,
        maxSpeed,
        avgSpeed,
        avgPace,
        calories,
        gpsPoints,
        currentPosition,
        gpsAccuracy,
        gpsError,
        activityType,
        setActivityType,
        splits,
        gpsFlags,
        start,
        pause,
        resume,
        stop,
        discard,
        getSnapshot,
        pauseIntervals: pauseIntervalsRef.current
    }
}
