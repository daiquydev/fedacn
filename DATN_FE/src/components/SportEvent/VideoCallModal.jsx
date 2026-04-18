import { roundKcal } from '../../utils/mathUtils'
import React, {
    useState, useEffect, useRef, useCallback, useMemo
} from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import {
    MdVideocam, MdVideocamOff, MdMic, MdMicOff,
    MdScreenShare, MdStopScreenShare, MdCallEnd,
    MdFiberManualRecord, MdPerson, MdWarning,
    MdFaceRetouchingNatural
} from 'react-icons/md'
import { FaEye, FaEyeSlash, FaCrown } from 'react-icons/fa'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { joinVideoSession, endVideoSession } from '../../apis/sportEventApi'
import sportCategoryApi from '../../apis/sportCategoryApi'
import { getAccessTokenFromLS, getProfileFromLS } from '../../utils/auth'
import { getAvatarSrc } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import { useQuery } from '@tanstack/react-query'

// ─── Config ──────────────────────────────────────────────────────────────────
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
}

const ABSENCE_THRESHOLD = 10   // seconds of no face before pausing
const AI_INTERVAL = 3000        // ms between face checks
const SCREENSHOT_INTERVAL = 10  // seconds between screenshots when face detected
const MAX_SCREENSHOTS = 5
const CLOUD_NAME = 'da9cghklv'
const UPLOAD_PRESET = 'fedacn_unsigned'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0') }
function fmtTime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

// ─── RemoteVideo: attaches srcObject from a MediaStream to a <video> element ─
function RemoteVideo({ stream, trackCount = 0, muted = false, className = '', style = {}, peerName = '' }) {
    const ref = useRef(null)
    useEffect(() => {
        const el = ref.current
        if (!el || !stream) return
        // Always re-set srcObject to ensure video/audio tracks are playing
        el.srcObject = stream
        el.play().catch(() => { })
    }, [stream, trackCount])  // trackCount forces re-run when tracks are added to same stream
    return (
        <video
            ref={ref}
            autoPlay
            playsInline
            muted={muted}
            className={className}
            style={style}
            data-peer-video="true"
            data-peer-name={peerName}
        />
    )
}

// ─── SelfPreviewVideo: mirrors local webcam (muted) ────────────────────────
function SelfPreviewVideo({ stream, camOn, isMain = false }) {
    const ref = useRef(null)
    useEffect(() => {
        const el = ref.current
        if (!el || !stream) return
        if (el.srcObject !== stream) {
            el.srcObject = stream
        }
        el.play().catch(() => { })
    }, [stream])
    return (
        <div className={`relative w-full h-full`}>
            <video
                ref={ref}
                autoPlay
                playsInline
                muted
                className={`w-full h-full ${isMain ? 'object-contain' : 'object-cover'}`}
                style={{ transform: 'scaleX(-1)' }}
            />
            {!camOn && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <MdVideocamOff className="text-gray-500 text-5xl" />
                </div>
            )}
        </div>
    )
}


// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VideoCallModal({ event, onClose, onCallEnded }) {
    const { id: eventId } = useParams()

    // ── Who is the event creator?
    // event.createdBy can be:
    //   - a populated object: { _id: '...', name: '...', avatar: '...' }
    //   - a plain ObjectId string (rare, if not populated)
    const creatorId = useMemo(() => {
        const c = event?.createdBy
        if (!c) return null
        if (typeof c === 'object' && c._id) return String(c._id)
        return String(c)
    }, [event])

    // Creator info for display (from populated object)
    const creatorInfo = useMemo(() => {
        const c = event?.createdBy
        if (c && typeof c === 'object') return c  // { _id, name, avatar }
        return null
    }, [event])


    // ── Self profile
    const profileRef = useRef(getProfileFromLS())
    const myId = profileRef.current?._id
    const myName = profileRef.current?.name || 'Bạn'
    const myAvatar = profileRef.current?.avatar || null
    const iAmCreator = useMemo(() => myId && creatorId && myId === creatorId, [myId, creatorId])

    // ── Media state
    const [micOn, setMicOn] = useState(true)
    const [camOn, setCamOn] = useState(true)
    const [isSharing, setIsSharing] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const [isEnding, setIsEnding] = useState(false)
    const isEndingRef = useRef(false)  // synchronous guard to prevent double endVideoSession call
    const [showEndConfirm, setShowEndConfirm] = useState(false)
    const [socketError, setSocketError] = useState(null)

    // ── Peers: Map<socketId, { stream, userId, userName, userAvatar }>
    const [peers, setPeers] = useState({})  // { [socketId]: { stream, userId, userName, userAvatar } }
    const [pinnedSocketId, setPinnedSocketId] = useState(null) // manually pinned to main
    const [localStream, setLocalStream] = useState(null) // React state version for SelfPreviewVideo re-render

    // ── Timer + AI
    const [totalSecs, setTotal] = useState(0)
    const [activeSecs, setActive] = useState(0)
    const [isPaused, setPaused] = useState(false)
    const [faceDetected, setFace] = useState(true)
    const [aiReady, setAiReady] = useState(false)
    const [aiError, setAiError] = useState(null)
    const [absenceSecs, setAbsenceSecs] = useState(0)

    // ── Refs
    const localStreamRef = useRef(null)
    const screenStreamRef = useRef(null)
    const peerConnsRef = useRef({})
    const socketRef = useRef(null)
    const vsIdRef = useRef(null)
    const totalRef = useRef(0)
    const activeRef = useRef(0)
    const pausedRef = useRef(false)
    const absenceRef = useRef(0)
    const timerRef = useRef(null)
    const aiTimerRef = useRef(null)
    const faceApiRef = useRef(null)
    const localVideoRef = useRef(null)      // For AI detection (always shows local cam)
    const camOnRef = useRef(true)            // Synchronous cam state for AI interval
    const screenshotsRef = useRef([])        // Captured screenshot URLs
    const lastScreenshotRef = useRef(0)      // Timestamp of last screenshot
    const uploadPromisesRef = useRef([])     // Bug 3: track in-flight screenshot uploads

    const syncPause = useCallback((v) => { pausedRef.current = v; setPaused(v) }, [])

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false

        async function init() {
            // 1. Join API
            try {
                const res = await joinVideoSession(eventId, {})
                if (!cancelled) vsIdRef.current = res?.data?.result?._id
            } catch (err) {
                toast.error('Không thể tham gia: ' + (err?.response?.data?.message || err.message))
            }

            // 2. Local media
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
                localStreamRef.current = stream
                setLocalStream(stream)  // trigger re-render for SelfPreviewVideo
                // Attach to local video element for AI detection
                if (localVideoRef.current) localVideoRef.current.srcObject = stream
            } catch {
                toast.error('Không truy cập được camera/mic')
            }

            // 3. Socket + WebRTC
            setupSocket()

            // 4. AI (non-blocking)
            loadFaceApi().catch(() => { })

            // 5. Timers
            startTimers()

            if (!cancelled) setIsReady(true)
        }

        init()
        return () => { cancelled = true; cleanup() }
    }, []) // eslint-disable-line

    // ─────────────────────────────────────────────────────────────────────────
    // SOCKET / WebRTC
    // ─────────────────────────────────────────────────────────────────────────
    function setupSocket() {
        const token = getAccessTokenFromLS()
        const socket = io(SOCKET_URL, {
            auth: { token: `Bearer ${token}` },
            transports: ['polling', 'websocket']
        })
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('[VC] Socket connected:', socket.id)
            socket.emit('vc:join-room', {
                roomId: eventId,
                userId: myId,
                userName: myName,
                userAvatar: myAvatar
            })
        })

        socket.on('connect_error', err => {
            setSocketError('Socket lỗi: ' + err.message)
        })

        // Existing peers in room → received with full user info now
        socket.on('vc:existing-peers', async ({ peers: peerList }) => {
            // peerList = [{ socketId, userId, userName, userAvatar }, ...]
            for (const peer of peerList) {
                // Pre-populate peer info immediately (before track arrives)
                setPeers(prev => ({
                    ...prev,
                    [peer.socketId]: {
                        ...(prev[peer.socketId] || {}),
                        userId: peer.userId,
                        userName: peer.userName,
                        userAvatar: peer.userAvatar
                    }
                }))
                await createPeerConnection(peer.socketId, true)
            }
        })

        // New peer joined → pre-populate info, but DON'T initiate offer
        // The NEW peer will initiate via vc:existing-peers to avoid SDP glare
        socket.on('vc:user-joined', async ({ socketId, userId, userName, userAvatar }) => {
            setPeers(prev => ({
                ...prev,
                [socketId]: { ...(prev[socketId] || {}), userId, userName, userAvatar }
            }))
            // isInitiator = false: we wait for their offer (they'll initiate via vc:existing-peers)
            await createPeerConnection(socketId, false)
        })

        socket.on('vc:offer', async ({ offer, from, fromUserId, fromUserName, fromUserAvatar }) => {
            // Pre-populate peer info from offer data
            if (fromUserId) {
                setPeers(prev => ({
                    ...prev,
                    [from]: {
                        ...(prev[from] || {}),
                        userId: fromUserId,
                        userName: fromUserName,
                        userAvatar: fromUserAvatar
                    }
                }))
            }
            await createPeerConnection(from, false)
            const pc = peerConnsRef.current[from]
            if (!pc) return
            await pc.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket.emit('vc:answer', { to: from, answer })
        })

        socket.on('vc:answer', async ({ answer, from }) => {
            const pc = peerConnsRef.current[from]
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
        })

        socket.on('vc:ice-candidate', async ({ candidate, from }) => {
            const pc = peerConnsRef.current[from]
            if (pc && candidate) {
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch { }
            }
        })

        socket.on('vc:user-left', ({ socketId }) => removePeer(socketId))
        socket.on('peer-left', ({ socketId }) => removePeer(socketId))
    }

    async function createPeerConnection(remoteSocketId, isInitiator) {
        if (peerConnsRef.current[remoteSocketId]) {
            console.log(`[WebRTC] PC already exists for ${remoteSocketId}, skipping`)
            return
        }

        console.log(`[WebRTC] Creating PC for ${remoteSocketId}, initiator=${isInitiator}`)
        console.log(`[WebRTC] Local tracks:`, localStreamRef.current?.getTracks().map(t => t.kind))

        const pc = new RTCPeerConnection(ICE_SERVERS)
        peerConnsRef.current[remoteSocketId] = pc

        const tracks = localStreamRef.current?.getTracks() || []
        tracks.forEach(t => {
            pc.addTrack(t, localStreamRef.current)
            console.log(`[WebRTC] Added local ${t.kind} track to PC`)
        })

        pc.onicecandidate = e => {
            if (e.candidate) {
                console.log(`[WebRTC] ICE candidate → ${remoteSocketId}:`, e.candidate.type)
                socketRef.current?.emit('vc:ice-candidate', { to: remoteSocketId, candidate: e.candidate })
            } else {
                console.log(`[WebRTC] ICE gathering complete for ${remoteSocketId}`)
            }
        }

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE state for ${remoteSocketId}:`, pc.iceConnectionState)
        }

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state for ${remoteSocketId}:`, pc.connectionState)
            if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
                removePeer(remoteSocketId)
            }
        }

        pc.onsignalingstatechange = () => {
            console.log(`[WebRTC] Signaling state for ${remoteSocketId}:`, pc.signalingState)
        }

        pc.ontrack = e => {
            console.log(`[WebRTC] ✅ ontrack from ${remoteSocketId}:`, e.track.kind, 'streams:', e.streams.length)
            // Always prefer e.streams[0] — browser bundles audio+video into one stream
            if (e.streams && e.streams[0]) {
                setPeers(prev => ({
                    ...prev,
                    [remoteSocketId]: {
                        ...(prev[remoteSocketId] || {}),
                        stream: e.streams[0]
                    }
                }))
                return
            }
            // Fallback: build MediaStream manually (Safari / edge cases)
            if (!peerConnsRef.current[`stream_${remoteSocketId}`]) {
                peerConnsRef.current[`stream_${remoteSocketId}`] = new MediaStream()
            }
            const ms = peerConnsRef.current[`stream_${remoteSocketId}`]
            ms.addTrack(e.track)
            setPeers(prev => ({
                ...prev,
                [remoteSocketId]: {
                    ...(prev[remoteSocketId] || {}),
                    stream: ms,
                    _trackCount: (prev[remoteSocketId]?._trackCount || 0) + 1
                }
            }))
        }

        if (isInitiator) {
            console.log(`[WebRTC] Creating offer → ${remoteSocketId}`)
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socketRef.current?.emit('vc:offer', { to: remoteSocketId, offer })
            console.log(`[WebRTC] Offer sent → ${remoteSocketId}`)
        }
    }

    function removePeer(socketId) {
        peerConnsRef.current[socketId]?.close()
        delete peerConnsRef.current[socketId]
        setPeers(prev => { const n = { ...prev }; delete n[socketId]; return n })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEDIA CONTROLS
    // ─────────────────────────────────────────────────────────────────────────
    const toggleMic = useCallback(() => {
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn })
        setMicOn(v => !v)
    }, [micOn])

    const toggleCam = useCallback(() => {
        const next = !camOn
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = next })
        camOnRef.current = next
        // Bug 2 fix: reset absence counter immediately when turning cam back ON
        // avoids the frozen 9s badge because the counter was never cleared
        if (next) {
            absenceRef.current = 0
            setAbsenceSecs(0)
            setFace(true)   // optimistically mark as present so badge clears instantly
        }
        setCamOn(next)
    }, [camOn])

    const toggleScreenShare = useCallback(async () => {
        if (isSharing) {
            screenStreamRef.current?.getTracks().forEach(t => t.stop())
            screenStreamRef.current = null
            const camTrack = localStreamRef.current?.getVideoTracks()[0]
            Object.values(peerConnsRef.current).forEach(pc => {
                const s = pc.getSenders().find(s => s.track?.kind === 'video')
                if (s && camTrack) s.replaceTrack(camTrack)
            })
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
            setIsSharing(false)
            socketRef.current?.emit('vc:screen-sharing', { roomId: eventId, sharing: false })
        } else {
            try {
                const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                screenStreamRef.current = screen
                const screenTrack = screen.getVideoTracks()[0]
                Object.values(peerConnsRef.current).forEach(pc => {
                    const s = pc.getSenders().find(s => s.track?.kind === 'video')
                    if (s) s.replaceTrack(screenTrack)
                })
                if (localVideoRef.current) localVideoRef.current.srcObject = screen
                screenTrack.onended = () => {
                    setIsSharing(false)
                    screenStreamRef.current = null
                    const camTrack = localStreamRef.current?.getVideoTracks()[0]
                    Object.values(peerConnsRef.current).forEach(pc => {
                        const s = pc.getSenders().find(s => s.track?.kind === 'video')
                        if (s && camTrack) s.replaceTrack(camTrack)
                    })
                    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
                    socketRef.current?.emit('vc:screen-sharing', { roomId: eventId, sharing: false })
                }
                setIsSharing(true)
                socketRef.current?.emit('vc:screen-sharing', { roomId: eventId, sharing: true })
            } catch (err) {
                if (err.name !== 'NotAllowedError') toast.error('Không thể chia sẻ màn hình')
            }
        }
    }, [isSharing, eventId])

    // ─────────────────────────────────────────────────────────────────────────
    // AI + TIMERS
    // ─────────────────────────────────────────────────────────────────────────
    async function loadFaceApi() {
        const MAX_RETRIES = 3
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[AI] Loading face-api model (attempt ${attempt}/${MAX_RETRIES})...`)
                const faceapi = await import('face-api.js')
                faceApiRef.current = faceapi
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
                setAiReady(true)
                setAiError(null)
                console.log('[AI] Face detection model loaded successfully')
                return
            } catch (err) {
                console.warn(`[AI] Attempt ${attempt} failed:`, err?.message || err)
                if (attempt < MAX_RETRIES) {
                    // Exponential backoff: 1s, 2s, 4s
                    const delay = Math.pow(2, attempt - 1) * 1000
                    await new Promise(r => setTimeout(r, delay))
                } else {
                    const msg = 'AI không khả dụng — thời gian sẽ được tính trọn (không phát hiện vắng mặt)'
                    setAiError(msg)
                    console.error(`[AI] All ${MAX_RETRIES} attempts failed. Falling back to full-time counting.`)
                    toast.error(msg, { duration: 5000, icon: '🤖' })
                }
            }
        }
    }

    function startTimers() {
        timerRef.current = setInterval(() => {
            totalRef.current += 1
            setTotal(totalRef.current)
            if (!pausedRef.current) { activeRef.current += 1; setActive(activeRef.current) }
        }, 1000)

        aiTimerRef.current = setInterval(async () => {
            // ── Bug 1 fix: unified absence handler used in ALL absence paths ──
            const markAbsent = () => {
                absenceRef.current += AI_INTERVAL / 1000
                setAbsenceSecs(absenceRef.current)
                if (absenceRef.current >= ABSENCE_THRESHOLD && !pausedRef.current) syncPause(true)
            }

            // ── Camera OFF → face detection impossible, treat as absent ──────
            if (!camOnRef.current) {
                setFace(false)
                markAbsent()
                return
            }

            // ── AI model or video element not ready yet ───────────────────────
            if (!faceApiRef.current || !localVideoRef.current) return

            // ── Check if video has actual frame data ──────────────────────────
            const vid = localVideoRef.current
            if (vid.readyState < 2 || vid.videoWidth === 0) {
                // Video not decoded yet — count as absent to handle covered-camera edge case
                markAbsent()
                return
            }

            try {
                const faceapi = faceApiRef.current
                // Keep scoreThreshold at 0.5 — lowering it increases false positives
                // (e.g., a palm covering the camera gets detected as a face at 0.4)
                const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                const rawFaces = await faceapi.detectAllFaces(vid, opts)

                // Filter out detections where the bounding box occupies more than 65%
                // of the video frame area. When a hand covers the camera close-up,
                // the skin blob fills ~80-100% of the frame and would score as a "face".
                // A real face in a webcam call typically takes 5%-65% of the frame.
                const frameArea = vid.videoWidth * vid.videoHeight
                const validFaces = frameArea > 0
                    ? rawFaces.filter(det => {
                          const b = det.box
                          const ratio = (b.width * b.height) / frameArea
                          return ratio >= 0.02 && ratio <= 0.65
                      })
                    : rawFaces

                const detected = validFaces.length > 0
                setFace(detected)

                if (!detected) {
                    // Face not found (or blob was too large → hand covering camera)
                    markAbsent()
                } else {
                    // Face confirmed → reset absence counter and unpause
                    absenceRef.current = 0
                    setAbsenceSecs(0)
                    if (pausedRef.current) syncPause(false)

                    // ── Screenshot: capture composite frame when face is present ──
                    const now = Date.now()
                    if (
                        screenshotsRef.current.length < MAX_SCREENSHOTS &&
                        now - lastScreenshotRef.current >= SCREENSHOT_INTERVAL * 1000 &&
                        camOnRef.current
                    ) {
                        lastScreenshotRef.current = now
                        captureScreenshot()  // non-blocking; promise tracked for Bug 3
                    }
                }
            } catch {
                // Bug 1 fix: if AI throws (model error, canvas read error, etc.)
                // we still penalise absence rather than silently ignoring it
                markAbsent()
            }
        }, AI_INTERVAL)
    }

    // ── Screenshot helper — extracted so it can be awaited or fire-and-forget ─
    async function captureScreenshot() {
        try {
            const allVideos = []
            if (localVideoRef.current) {
                allVideos.push({ video: localVideoRef.current, name: 'Bạn', mirror: true })
            }
            const remoteVideoEls = document.querySelectorAll('video[data-peer-video]')
            remoteVideoEls.forEach((v) => {
                if (v.readyState >= 2 && v.videoWidth > 0) {
                    allVideos.push({ video: v, name: v.getAttribute('data-peer-name') || 'Người dùng', mirror: false })
                }
            })
            if (allVideos.length === 0) return

            const W = 960, H = 540
            const canvas = document.createElement('canvas')
            canvas.width = W
            canvas.height = H
            const ctx = canvas.getContext('2d')

            const gradient = ctx.createLinearGradient(0, 0, W, H)
            gradient.addColorStop(0, '#1e1b4b')
            gradient.addColorStop(1, '#312e81')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, W, H)

            const count = allVideos.length
            const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3
            const rows = Math.ceil(count / cols)
            const pad = 6
            const cellW = (W - pad * (cols + 1)) / cols
            const cellH = (H - pad * (rows + 1) - 28) / rows
            const headerH = 28

            ctx.fillStyle = 'rgba(0,0,0,0.5)'
            ctx.fillRect(0, 0, W, headerH)
            ctx.fillStyle = '#ef4444'
            ctx.beginPath()
            ctx.arc(16, headerH / 2, 4, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 12px sans-serif'
            ctx.fillText('● LIVE', 24, headerH / 2 + 4)

            allVideos.forEach((entry, idx) => {
                const col = idx % cols
                const row = Math.floor(idx / cols)
                const x = pad + col * (cellW + pad)
                const y = headerH + pad + row * (cellH + pad)
                const r = 8
                ctx.save()
                ctx.beginPath()
                ctx.moveTo(x + r, y)
                ctx.lineTo(x + cellW - r, y)
                ctx.quadraticCurveTo(x + cellW, y, x + cellW, y + r)
                ctx.lineTo(x + cellW, y + cellH - r)
                ctx.quadraticCurveTo(x + cellW, y + cellH, x + cellW - r, y + cellH)
                ctx.lineTo(x + r, y + cellH)
                ctx.quadraticCurveTo(x, y + cellH, x, y + cellH - r)
                ctx.lineTo(x, y + r)
                ctx.quadraticCurveTo(x, y, x + r, y)
                ctx.closePath()
                ctx.clip()
                if (entry.mirror) {
                    ctx.translate(x + cellW, 0)
                    ctx.scale(-1, 1)
                    ctx.drawImage(entry.video, 0, y, cellW, cellH)
                    ctx.setTransform(1, 0, 0, 1, 0, 0)
                } else {
                    ctx.drawImage(entry.video, x, y, cellW, cellH)
                }
                ctx.fillStyle = 'rgba(0,0,0,0.6)'
                ctx.fillRect(x, y + cellH - 22, cellW, 22)
                ctx.fillStyle = '#fff'
                ctx.font = '11px sans-serif'
                ctx.fillText(entry.name, x + 8, y + cellH - 7)
                ctx.restore()
            })

            // Bug 3 fix: wrap upload in a Promise and register it so handleEndCall can await it
            const uploadPromise = new Promise((resolve) => {
                canvas.toBlob(async (blob) => {
                    if (!blob || screenshotsRef.current.length >= MAX_SCREENSHOTS) { resolve(); return }
                    try {
                        const formData = new FormData()
                        formData.append('file', blob, `call_screenshot_${Date.now()}.jpg`)
                        formData.append('upload_preset', UPLOAD_PRESET)
                        formData.append('folder', 'video-call-screenshots')
                        const res = await fetch(
                            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                            { method: 'POST', body: formData }
                        )
                        if (res.ok) {
                            const data = await res.json()
                            screenshotsRef.current = [...screenshotsRef.current, data.secure_url]
                            console.log(`[Screenshot] Captured ${screenshotsRef.current.length}/${MAX_SCREENSHOTS}`)
                        }
                    } catch (err) {
                        console.warn('[Screenshot] Upload failed:', err)
                    } finally {
                        resolve()  // always resolve so Promise.allSettled doesn't hang
                    }
                }, 'image/jpeg', 0.85)
            })

            // Register promise — handleEndCall will await all of these
            uploadPromisesRef.current = [...uploadPromisesRef.current, uploadPromise]
        } catch { }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLEANUP + END
    // ─────────────────────────────────────────────────────────────────────────
    function cleanup() {
        clearInterval(timerRef.current)
        clearInterval(aiTimerRef.current)
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        screenStreamRef.current?.getTracks().forEach(t => t.stop())
        Object.values(peerConnsRef.current).forEach(pc => pc.close())
        peerConnsRef.current = {}
        socketRef.current?.emit('vc:leave-room', { roomId: eventId })
        socketRef.current?.disconnect()
    }

    const handleEndCall = useCallback(async () => {
        if (isEndingRef.current) return
        isEndingRef.current = true
        setIsEnding(true)
        setShowEndConfirm(false)

        // Stop timers first so activeRef / totalRef are frozen at final values
        clearInterval(timerRef.current)
        clearInterval(aiTimerRef.current)

        // Bug 3 fix: wait for any in-flight screenshot uploads to finish
        // before reading screenshotsRef.current — gives Cloudinary time to respond
        if (uploadPromisesRef.current.length > 0) {
            try {
                await Promise.allSettled(uploadPromisesRef.current)
            } catch { }
        }

        // Now safe to clean up WebRTC/socket (screenshots are already saved)
        cleanup()

        if (!vsIdRef.current) { onClose(); return }
        try {
            const res = await endVideoSession(eventId, vsIdRef.current, {
                activeSeconds: activeRef.current,
                totalSeconds: totalRef.current,
                screenshots: screenshotsRef.current
            })
            const result = res?.data?.result
            const summary = result?.summary
            if (summary) {
                const vsId = vsIdRef.current
                const joinedAt = result?.videoSession?.joinedAt
                onCallEnded({
                    ...summary,
                    _id: summary._id ?? vsId,
                    ...(joinedAt ? { joinedAt } : {})
                })
            }
            else { toast.error('Không lưu được kết quả'); onClose() }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi lưu kết quả')
            onClose()
        }
    }, [eventId, onCallEnded, onClose]) // eslint-disable-line

    // ─────────────────────────────────────────────────────────────────────────
    // DERIVED
    // ─────────────────────────────────────────────────────────────────────────
    const peerEntries = useMemo(() => Object.entries(peers), [peers])
    const creatorPeerEntry = useMemo(() => {
        if (!creatorId) return null
        return peerEntries.find(([, p]) => p.userId === creatorId) || null
    }, [peerEntries, creatorId])

    // Determine what shows in MAIN AREA:
    // Priority: pinnedSocketId > creator (if in call) > iAmCreator > null
    const mainEntry = useMemo(() => {
        if (pinnedSocketId === 'self') return { type: 'self' }  // local video pinned
        if (pinnedSocketId) {
            const p = peers[pinnedSocketId]
            if (p) return { type: 'remote', socketId: pinnedSocketId, peer: p }
        }
        // Default: creator
        if (iAmCreator) return { type: 'self' }
        if (creatorPeerEntry) return { type: 'remote', socketId: creatorPeerEntry[0], peer: creatorPeerEntry[1] }
        return null  // creator not in call yet
    }, [pinnedSocketId, peers, iAmCreator, creatorPeerEntry])

    // Toggle pin a sidebar entry onto main (or unpin if clicking same)
    const handlePin = useCallback((socketId) => {
        setPinnedSocketId(prev => prev === socketId ? null : socketId)
    }, [])

    // All peers that should show in sidebar (all except the one in main)
    const sidebarEntries = useMemo(() => {
        const mainSocketId = mainEntry?.socketId || null
        const result = []
        // Add self if not main
        const selfIsMain = mainEntry?.type === 'self'
        if (!selfIsMain) {
            result.push({ type: 'self', socketId: 'self' })
        }
        // Add creator in sidebar if not in main (and not self)
        if (creatorPeerEntry && mainSocketId !== creatorPeerEntry[0]) {
            result.push({ type: 'remote', socketId: creatorPeerEntry[0], peer: creatorPeerEntry[1], isCreator: true })
        }
        // Other peers (not creator, not main)
        peerEntries.forEach(([sid, p]) => {
            if (p.userId === creatorId) return  // already handled above
            if (sid === mainSocketId) return     // in main
            result.push({ type: 'remote', socketId: sid, peer: p, isCreator: false })
        })
        return result
    }, [mainEntry, peerEntries, creatorId, creatorPeerEntry])

    // ── Fetch kcal_per_unit from SportCategory for realtime calorie display
    const { data: categoriesData } = useQuery({
        queryKey: ['sportCategories'],
        queryFn: () => sportCategoryApi.getAll()
    })

    const kcalPerMinute = useMemo(() => {
        const categories = categoriesData?.data?.result || []
        const matched = categories.find(c => c.name === event?.category)
        return matched?.kcal_per_unit || 0
    }, [categoriesData, event?.category])

    const realtimeKcal = useMemo(() => {
        if (!kcalPerMinute || kcalPerMinute <= 0) return 0
        return roundKcal(kcalPerMinute * (activeSecs / 60))
    }, [kcalPerMinute, activeSecs])

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col select-none"
            style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fce7f3 30%, #ede9fe 60%, #e0f2fe 100%)' }}>

            {/* ── Top Bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                        <MdFiberManualRecord className="text-red-500 animate-pulse text-xs" />
                        <span className="text-red-600 text-[11px] font-medium">LIVE</span>
                    </div>
                    <div>
                        <h2 className="text-gray-800 font-bold text-sm leading-tight">{event?.name}</h2>
                        <p className="text-gray-400 text-[11px]">{event?.category}</p>
                    </div>
                    {!isReady && <AiOutlineLoading3Quarters className="animate-spin text-indigo-400 text-sm ml-1" />}
                </div>

                <div className="flex items-center gap-3">
                    {socketError && (
                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200
                                        text-red-600 text-xs px-2.5 py-1 rounded-full">
                            <MdWarning className="flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{socketError}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 bg-white/60 rounded-full px-4 py-1.5 border border-gray-200">
                        <div className="text-center">
                            <p className="font-mono text-gray-800 text-sm font-bold tabular-nums">{fmtTime(totalSecs)}</p>
                            <p className="text-gray-400 text-[9px] uppercase">Tham gia</p>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div className="text-center">
                            <p className={`font-mono text-sm font-bold tabular-nums ${isPaused ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                {fmtTime(activeSecs)}
                            </p>
                            <p className="text-gray-400 text-[9px] uppercase">Thực tế</p>
                        </div>
                        {kcalPerMinute > 0 && (
                            <>
                                <div className="w-px h-6 bg-gray-200" />
                                <div className="text-center">
                                    <p className="font-mono text-orange-600 text-sm font-bold tabular-nums">🔥 {realtimeKcal}</p>
                                    <p className="text-gray-400 text-[9px] uppercase">Kcal</p>
                                </div>
                            </>
                        )}
                        <div className="w-px h-6 bg-gray-200" />
                        <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                            ${isPaused ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isPaused ? '⏸ Tạm dừng' : '▶ Đang tập'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden min-h-0 gap-0">

                {/* ═══ LEFT PANEL — PARTICIPANTS ONLY ═══════════════ */}
                <div className="w-56 flex-shrink-0 flex flex-col overflow-y-auto"
                    style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>

                    {/* ── AI Camera (compact) ──────────────────────── */}
                    <div className="p-2.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <div className="relative rounded-xl overflow-hidden bg-black/30 aspect-video">
                            <video ref={localVideoRef} autoPlay playsInline muted
                                className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                            {!camOn && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <MdVideocamOff className="text-white/30 text-2xl" />
                                </div>
                            )}
                            {/* Face status badge */}
                            <div className={`absolute bottom-1 left-1 flex items-center gap-1 text-[9px] font-medium
                                px-1.5 py-0.5 rounded-full backdrop-blur-sm
                                ${faceDetected ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                                {faceDetected
                                    ? <><FaEye className="text-[9px]" /> Có mặt</>
                                    : <><FaEyeSlash className="text-[9px]" /> Vắng {absenceSecs > 0 ? `(${absenceSecs}s)` : ''}</>
                                }
                            </div>
                            {/* AI Status badge */}
                            <div className={`absolute top-1 right-1 flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${
                                aiReady ? 'bg-emerald-600/80 text-white' 
                                : aiError ? 'bg-red-600/80 text-white'
                                : 'bg-amber-500/80 text-white'
                            }`}>
                                {aiReady ? (
                                    <><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> AI</>
                                ) : aiError ? (
                                    <><MdWarning className="text-[8px]" /> AI ✗</>
                                ) : (
                                    <><AiOutlineLoading3Quarters className="animate-spin text-[7px]" /> AI</>
                                )}
                            </div>
                        </div>
                        {aiError && (
                            <div className="flex items-center gap-1 text-yellow-400/70 text-[9px] bg-yellow-500/10 rounded-lg px-2 py-1 mt-1.5">
                                <MdWarning className="flex-shrink-0 text-[9px]" /> {aiError}
                            </div>
                        )}
                    </div>

                    {/* ── Participants ──────────────────────────────── */}
                    <div className="flex-1 p-3 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-indigo-600 text-[10px] uppercase font-bold tracking-widest">
                                Người tham gia
                            </p>
                            <span className="text-indigo-400 text-[10px] bg-indigo-50 rounded-full px-1.5 py-0.5">
                                {peerEntries.length + 1}
                            </span>
                        </div>
                        <p className="text-gray-400 text-[10px] mb-2">Nhấn để đưa lên màn hình chính</p>

                        {sidebarEntries.map(entry => {
                            const isPinned = pinnedSocketId === entry.socketId
                            return (
                                <div key={entry.socketId} onClick={() => handlePin(entry.socketId)}
                                    className={`mb-2 cursor-pointer group relative rounded-xl overflow-hidden transition-all border
                                        ${isPinned
                                            ? 'border-indigo-400 shadow-lg shadow-indigo-500/20'
                                            : 'border-white/5 hover:border-white/20'
                                        }`}>
                                    <div className="aspect-video" style={{ background: 'rgba(0,0,40,0.5)' }}>
                                        {entry.type === 'self' ? (
                                            <SelfPreviewVideo stream={localStream} camOn={camOn} />
                                        ) : entry.peer?.stream ? (
                                            <RemoteVideo stream={entry.peer.stream} trackCount={entry.peer._trackCount || 0} className="w-full h-full object-cover" peerName={entry.peer?.userName || 'Người dùng'} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {entry.peer?.userAvatar
                                                    ? <img src={entry.peer.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover opacity-60" />
                                                    : <MdPerson className="text-white/20 text-2xl" />
                                                }
                                            </div>
                                        )}
                                    </div>

                                    {/* Name bar */}
                                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1
                                                    bg-gradient-to-t from-black/80 to-transparent flex items-center gap-1">
                                        {(entry.isCreator || (entry.type === 'self' && iAmCreator)) &&
                                            <FaCrown className="text-yellow-400 text-[9px] flex-shrink-0" />}
                                        <span className="text-white text-[10px] font-medium truncate">
                                            {entry.type === 'self' ? `${myName} (Bạn)` : (entry.peer?.userName || 'Người dùng')}
                                        </span>
                                        {entry.type === 'self' && !micOn &&
                                            <MdMicOff className="text-red-400 text-[9px] ml-auto flex-shrink-0" />}
                                    </div>

                                    {/* Hover hint */}
                                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10
                                                    transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                                            {isPinned ? '📌 Đang xem' : 'Xem'}
                                        </span>
                                    </div>

                                    {isPinned && (
                                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center text-[7px] text-white">📌</div>
                                    )}
                                </div>
                            )
                        })}

                        {peerEntries.length === 0 && (
                            <p className="text-gray-400 text-[10px] text-center py-4">Chưa có ai tham gia</p>
                        )}
                    </div>
                </div>

                {/* ═══ MAIN AREA WITH OVERLAY HUD ═════════════════════ */}
                <div className="flex-1 relative p-3 flex items-center justify-center">
                    {mainEntry?.type === 'self' ? (
                        <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl"
                            style={{ boxShadow: '0 0 60px rgba(99,102,241,0.15)' }}>
                            <SelfPreviewVideo stream={localStream} camOn={camOn} isMain />
                            {/* Name badge */}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2
                                            bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                {iAmCreator && <FaCrown className="text-yellow-400 text-sm" />}
                                <span className="text-white text-sm font-medium">
                                    {myName}{iAmCreator ? ' (Chủ sự kiện)' : ' (Bạn)'}
                                </span>
                                {!micOn && <MdMicOff className="text-red-400 text-xs" />}
                            </div>
                            {isSharing && (
                                <div className="absolute top-16 left-4 bg-emerald-600/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                                    🖥️ Đang chia sẻ màn hình
                                </div>
                            )}
                            {pinnedSocketId === 'self' && (
                                <button onClick={() => setPinnedSocketId(null)}
                                    className="absolute top-16 right-4 bg-black/50 backdrop-blur-sm text-white text-xs
                                                px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 transition">
                                    📌 Bỏ ghim
                                </button>
                            )}
                        </div>
                    ) : mainEntry?.type === 'remote' ? (
                        <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl"
                            style={{ boxShadow: '0 0 60px rgba(99,102,241,0.15)' }}>
                            {mainEntry.peer?.stream ? (
                                <RemoteVideo stream={mainEntry.peer.stream} trackCount={mainEntry.peer._trackCount || 0} className="w-full h-full object-cover" peerName={mainEntry.peer?.userName || 'Người dùng'} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4"
                                    style={{ background: 'rgba(0,0,40,0.6)' }}>
                                    {mainEntry.peer?.userAvatar
                                        ? <img src={mainEntry.peer.userAvatar} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white/10" />
                                        : <MdPerson className="text-white/20 text-8xl" />
                                    }
                                    <p className="text-white/40 text-sm">Camera đang tắt</p>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2
                                            bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                {mainEntry.peer?.userId === creatorId && <FaCrown className="text-yellow-400 text-sm" />}
                                <span className="text-white text-sm font-medium">
                                    {mainEntry.peer?.userName || 'Người dùng'}
                                    {mainEntry.peer?.userId === creatorId ? ' (Chủ sự kiện)' : ''}
                                </span>
                            </div>
                            {pinnedSocketId && pinnedSocketId !== 'self' && (
                                <button onClick={() => setPinnedSocketId(null)}
                                    className="absolute top-16 right-4 bg-black/50 backdrop-blur-sm text-white text-xs
                                                px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 transition">
                                    📌 Bỏ ghim
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Creator hasn't joined yet */
                        <div className="flex flex-col items-center justify-center gap-5 text-center max-w-xs">
                            <div className="relative">
                                <div className="w-28 h-28 rounded-full border-2 border-indigo-500/30 flex items-center justify-center"
                                    style={{ background: 'rgba(99,102,241,0.08)' }}>
                                    {creatorInfo?.avatar
                                        ? (
                                            <img
                                                src={getAvatarSrc(creatorInfo.avatar, useravatar)}
                                                alt=""
                                                className="w-full h-full rounded-full object-cover opacity-40"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null
                                                    e.currentTarget.src = useravatar
                                                }}
                                            />
                                        )
                                        : <FaCrown className="text-indigo-400/40 text-5xl" />
                                    }
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-yellow-500/15 border border-yellow-500/30 rounded-full flex items-center justify-center">
                                    <FaCrown className="text-yellow-400 text-base" />
                                </div>
                            </div>
                            <div>
                                <p className="text-white/70 text-lg font-semibold mb-1">
                                    {creatorInfo?.name || 'Chủ sự kiện'} chưa tham gia
                                </p>
                                <p className="text-white/30 text-xs">Màn hình chính hiển thị khi chủ sự kiện vào call</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-2">
                                <AiOutlineLoading3Quarters className="animate-spin text-indigo-400 text-sm" />
                                <span className="text-white/40 text-sm">Đang chờ...</span>
                            </div>
                        </div>
                    )}

                    {/* ═══ OVERLAY HUD — Only AI status (timer/kcal moved to top bar) ═══ */}
                    {/* Top-right: AI Status overlay */}
                    <div className="absolute top-5 right-5 z-10">
                        <div className={`flex items-center gap-2 text-xs font-semibold rounded-full px-4 py-2 border ${
                            aiReady ? 'text-emerald-700 border-emerald-200 bg-emerald-50/80'
                            : aiError ? 'text-red-700 border-red-200 bg-red-50/80'
                            : 'text-amber-700 border-amber-200 bg-amber-50/80'
                        }`} style={{ backdropFilter: 'blur(8px)' }}>
                            {aiReady ? (
                                <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> ✅ AI đang theo dõi</>
                            ) : aiError ? (
                                <><MdWarning /> ❌ AI lỗi</>
                            ) : (
                                <><AiOutlineLoading3Quarters className="animate-spin" /> ⏳ AI đang tải...</>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Control Bar ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-4 py-3 flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <CtrlBtn active={micOn} onIcon={<MdMic />} offIcon={<MdMicOff />}
                    label={micOn ? 'Tắt mic' : 'Bật mic'} onClick={toggleMic} />
                <CtrlBtn active={camOn} onIcon={<MdVideocam />} offIcon={<MdVideocamOff />}
                    label={camOn ? 'Tắt cam' : 'Bật cam'} onClick={toggleCam} />
                <CtrlBtn active={!isSharing} onIcon={<MdScreenShare />} offIcon={<MdStopScreenShare />}
                    label={isSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'} onClick={toggleScreenShare}
                    greenWhenActive={isSharing} />

                <div className="w-px h-8 bg-gray-300 mx-1" />

                <button onClick={() => setShowEndConfirm(true)} disabled={isEnding}
                    className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500
                                    flex items-center justify-center text-white text-xl
                                    transition-all active:scale-95 shadow-lg shadow-red-700/40
                                    disabled:opacity-50">
                        {isEnding ? <AiOutlineLoading3Quarters className="animate-spin" /> : <MdCallEnd />}
                    </div>
                    <span className="text-gray-500 text-[10px] group-hover:text-gray-700 transition-colors">Kết thúc</span>
                </button>
            </div>

            {/* ── End Confirm — Glassmorphism Modal ───────────────────── */}
            {showEndConfirm && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="rounded-3xl p-7 max-w-sm w-full mx-4 shadow-2xl text-center"
                        style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
                        <div className="text-4xl mb-3">👋</div>
                        <h3 className="text-gray-800 text-xl font-bold mb-2">Rời khỏi cuộc gọi?</h3>
                        <p className="text-gray-400 text-sm mb-5">Kết quả sẽ được ghi nhận vào tiến độ sự kiện.</p>
                        
                        <div className="flex gap-3 mb-5 p-3 rounded-2xl border border-gray-100" style={{ background: '#f8fafc' }}>
                            <div className="flex-1 text-center">
                                <p className="font-mono text-2xl font-bold text-gray-800">{fmtTime(totalSecs)}</p>
                                <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-wide">Tham gia</p>
                            </div>
                            <div style={{ width: 1, background: '#e2e8f0' }} />
                            <div className="flex-1 text-center">
                                <p className="font-mono text-2xl font-bold text-emerald-600">{fmtTime(activeSecs)}</p>
                                <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-wide">Thực tế</p>
                            </div>
                            {kcalPerMinute > 0 && (
                                <>
                                    <div style={{ width: 1, background: '#e2e8f0' }} />
                                    <div className="flex-1 text-center">
                                        <p className="font-mono text-2xl font-bold text-orange-500">{realtimeKcal}</p>
                                        <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-wide">🔥 Kcal</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowEndConfirm(false)}
                                className="flex-1 py-3 rounded-2xl font-medium transition-all active:scale-[0.97]"
                                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
                                Tiếp tục
                            </button>
                            <button onClick={handleEndCall} disabled={isEnding}
                                className="flex-1 py-3 rounded-2xl font-bold transition-all active:scale-[0.97] disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' }}>
                                {isEnding ? <AiOutlineLoading3Quarters className="animate-spin mx-auto" /> : 'Rời khỏi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


// ─── CtrlBtn ──────────────────────────────────────────────────────────────────
function CtrlBtn({ active, onIcon, offIcon, label, onClick, greenWhenActive = false }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 group">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center
                             text-lg transition-all active:scale-95 shadow-md
                             ${!active ? 'bg-red-600 hover:bg-red-500 text-white'
                    : greenWhenActive
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}>
                {active ? onIcon : offIcon}
            </div>
            <span className="text-gray-500 text-[10px] group-hover:text-gray-700 transition-colors whitespace-nowrap">
                {label}
            </span>
        </button>
    )
}

