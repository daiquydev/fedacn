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
import { getAccessTokenFromLS, getProfileFromLS } from '../../utils/auth'

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0') }
function fmtTime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

// ─── RemoteVideo: attaches srcObject from a MediaStream to a <video> element ─
function RemoteVideo({ stream, trackCount = 0, muted = false, className = '', style = {} }) {
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
    const localVideoRef = useRef(null)  // For AI detection (always shows local cam)

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
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn })
        setCamOn(v => !v)
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
        try {
            const faceapi = await import('face-api.js')
            faceApiRef.current = faceapi
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
            setAiReady(true)
        } catch {
            setAiError('Không tải được AI model')
        }
    }

    function startTimers() {
        timerRef.current = setInterval(() => {
            totalRef.current += 1
            setTotal(totalRef.current)
            if (!pausedRef.current) { activeRef.current += 1; setActive(activeRef.current) }
        }, 1000)

        aiTimerRef.current = setInterval(async () => {
            if (!faceApiRef.current || !localVideoRef.current) return
            try {
                const faceapi = faceApiRef.current
                const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 })
                const detected = (await faceapi.detectAllFaces(localVideoRef.current, opts)).length > 0
                setFace(detected)
                if (!detected) {
                    absenceRef.current += AI_INTERVAL / 1000
                    setAbsenceSecs(absenceRef.current)
                    if (absenceRef.current >= ABSENCE_THRESHOLD && !pausedRef.current) syncPause(true)
                } else {
                    absenceRef.current = 0
                    setAbsenceSecs(0)
                    if (pausedRef.current) syncPause(false)
                }
            } catch { }
        }, AI_INTERVAL)
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
        // Use ref for synchronous guard (state is async and can be stale in closure)
        if (isEndingRef.current) return
        isEndingRef.current = true
        setIsEnding(true)
        setShowEndConfirm(false)
        clearInterval(timerRef.current)
        clearInterval(aiTimerRef.current)
        cleanup()
        if (!vsIdRef.current) { onClose(); return }
        try {
            const res = await endVideoSession(eventId, vsIdRef.current, {
                activeSeconds: activeRef.current,
                totalSeconds: totalRef.current
            })
            const summary = res?.data?.result?.summary
            if (summary) onCallEnded(summary)
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

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col select-none"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 50%, #0f2744 100%)' }}>

            {/* ── Top Bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
                style={{ background: 'rgba(15,23,60,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 rounded-full px-2.5 py-1">
                        <MdFiberManualRecord className="text-red-400 animate-pulse text-xs" />
                        <span className="text-red-300 text-[11px] font-medium">LIVE</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-sm leading-tight">{event?.name}</h2>
                        <p className="text-indigo-300/60 text-[11px]">{event?.category}</p>
                    </div>
                    {!isReady && <AiOutlineLoading3Quarters className="animate-spin text-indigo-400 text-sm ml-1" />}
                </div>

                <div className="flex items-center gap-3">
                    {socketError && (
                        <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40
                                        text-red-300 text-xs px-2.5 py-1 rounded-full">
                            <MdWarning className="flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{socketError}</span>
                        </div>
                    )}
                    <div className="text-right">
                        <p className="font-mono text-white/80 text-xs tabular-nums">{fmtTime(totalSecs)} tham gia</p>
                        <p className={`font-mono text-xs tabular-nums font-semibold ${isPaused ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {fmtTime(activeSecs)} thực tế
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Body ─────────────────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden min-h-0 gap-0">

                {/* ═══ LEFT PANEL ═══════════════════════════════════ */}
                <div className="w-64 flex-shrink-0 flex flex-col overflow-y-auto"
                    style={{ background: 'rgba(15,23,60,0.6)', backdropFilter: 'blur(8px)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

                    {/* ── AI + Timer block ──────────────────────────── */}
                    <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-2.5">
                            <p className="text-indigo-300/70 text-[10px] uppercase font-bold tracking-widest">AI Hiện diện</p>
                            <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                ${isPaused ? 'bg-yellow-500/15 text-yellow-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                                {isPaused ? '⏸' : '▶'} {isPaused ? 'Tạm dừng' : 'Tính giờ'}
                            </div>
                        </div>

                        {/* AI Camera + face status */}
                        <div className="relative rounded-xl overflow-hidden bg-black/30 aspect-video mb-2.5">
                            <video ref={localVideoRef} autoPlay playsInline muted
                                className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                            {!camOn && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <MdVideocamOff className="text-white/30 text-2xl" />
                                </div>
                            )}
                            {/* Face status badge */}
                            <div className={`absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] font-medium
                                px-1.5 py-0.5 rounded-full backdrop-blur-sm
                                ${faceDetected ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                                {faceDetected
                                    ? <><FaEye className="text-[9px]" /> Nhận diện</>
                                    : <><FaEyeSlash className="text-[9px]" /> Không thấy {absenceSecs > 0 ? `(${absenceSecs}s)` : ''}</>
                                }
                            </div>
                            {aiReady && (
                                <div className="absolute top-1.5 right-1.5 bg-indigo-600/80 text-[9px] text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">AI</div>
                            )}
                        </div>

                        {(!aiReady && !aiError) && (
                            <div className="flex items-center gap-1.5 text-indigo-300/50 text-[10px] mb-2">
                                <AiOutlineLoading3Quarters className="animate-spin" /> Đang tải AI...
                            </div>
                        )}
                        {aiError && (
                            <div className="flex items-center gap-1 text-yellow-400/70 text-[10px] bg-yellow-500/10 rounded-lg px-2 py-1 mb-2">
                                <MdWarning className="flex-shrink-0" /> {aiError}
                            </div>
                        )}

                        {/* Timer cards */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <p className="text-white/40 text-[9px] mb-0.5 uppercase tracking-wide">Tham gia</p>
                                <p className="font-mono text-white text-sm font-bold tabular-nums">{fmtTime(totalSecs)}</p>
                            </div>
                            <div className={`rounded-xl p-2.5 text-center ${isPaused
                                ? 'bg-yellow-500/10 border border-yellow-500/20'
                                : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                                <p className="text-white/40 text-[9px] mb-0.5 uppercase tracking-wide">Thực tế</p>
                                <p className={`font-mono text-sm font-bold tabular-nums ${isPaused ? 'text-yellow-300' : 'text-emerald-300'}`}>
                                    {fmtTime(activeSecs)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Participants ──────────────────────────────── */}
                    <div className="flex-1 p-3 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-indigo-300/70 text-[10px] uppercase font-bold tracking-widest">
                                Người tham gia
                            </p>
                            <span className="text-indigo-300/50 text-[10px] bg-white/5 rounded-full px-1.5 py-0.5">
                                {peerEntries.length + 1}
                            </span>
                        </div>
                        <p className="text-white/25 text-[10px] mb-2">Nhấn để đưa lên màn hình chính</p>

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
                                            <RemoteVideo stream={entry.peer.stream} trackCount={entry.peer._trackCount || 0} className="w-full h-full object-cover" />
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
                            <p className="text-white/20 text-[10px] text-center py-4">Chưa có ai tham gia</p>
                        )}
                    </div>
                </div>

                {/* ═══ MAIN AREA ═════════════════════════════════════ */}
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
                                <div className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                                    🖥️ Đang chia sẻ màn hình
                                </div>
                            )}
                            {pinnedSocketId === 'self' && (
                                <button onClick={() => setPinnedSocketId(null)}
                                    className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs
                                                px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 transition">
                                    📌 Bỏ ghim
                                </button>
                            )}
                        </div>
                    ) : mainEntry?.type === 'remote' ? (
                        <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl"
                            style={{ boxShadow: '0 0 60px rgba(99,102,241,0.15)' }}>
                            {mainEntry.peer?.stream ? (
                                <RemoteVideo stream={mainEntry.peer.stream} trackCount={mainEntry.peer._trackCount || 0} className="w-full h-full object-cover" />
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
                                    className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs
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
                                        ? <img src={creatorInfo.avatar} alt="" className="w-full h-full rounded-full object-cover opacity-40" />
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
                </div>
            </div>

            {/* ── Control Bar ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-4 py-3 flex-shrink-0"
                style={{ background: 'rgba(15,23,60,0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <CtrlBtn active={micOn} onIcon={<MdMic />} offIcon={<MdMicOff />}
                    label={micOn ? 'Tắt mic' : 'Bật mic'} onClick={toggleMic} />
                <CtrlBtn active={camOn} onIcon={<MdVideocam />} offIcon={<MdVideocamOff />}
                    label={camOn ? 'Tắt cam' : 'Bật cam'} onClick={toggleCam} />
                <CtrlBtn active={!isSharing} onIcon={<MdScreenShare />} offIcon={<MdStopScreenShare />}
                    label={isSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'} onClick={toggleScreenShare}
                    greenWhenActive={isSharing} />

                <div className="w-px h-8 bg-white/10 mx-1" />

                <button onClick={() => setShowEndConfirm(true)} disabled={isEnding}
                    className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500
                                    flex items-center justify-center text-white text-xl
                                    transition-all active:scale-95 shadow-lg shadow-red-700/40
                                    disabled:opacity-50">
                        {isEnding ? <AiOutlineLoading3Quarters className="animate-spin" /> : <MdCallEnd />}
                    </div>
                    <span className="text-white/40 text-[10px] group-hover:text-white/70 transition-colors">Kết thúc</span>
                </button>
            </div>

            {/* ── End Confirm ──────────────────────────────────────────────── */}
            {showEndConfirm && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
                        style={{ background: 'rgba(15,23,60,0.95)' }}>
                        <h3 className="text-white text-xl font-bold mb-4">Rời khỏi cuộc gọi?</h3>
                        <div className="grid grid-cols-2 gap-3 bg-white/5 rounded-xl p-4 mb-5 border border-white/5">
                            <div className="text-center">
                                <p className="font-mono text-2xl font-bold text-white">{fmtTime(totalSecs)}</p>
                                <p className="text-white/35 text-xs mt-1">Thời gian tham gia</p>
                            </div>
                            <div className="text-center border-l border-white/10">
                                <p className="font-mono text-2xl font-bold text-emerald-400">{fmtTime(activeSecs)}</p>
                                <p className="text-white/35 text-xs mt-1">Thời gian thực tế</p>
                            </div>
                        </div>
                        <p className="text-white/50 text-sm mb-6">Kết quả sẽ được ghi nhận vào tiến độ sự kiện.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowEndConfirm(false)}
                                className="flex-1 py-3 rounded-xl bg-white/8 hover:bg-white/15 text-white font-medium transition-colors border border-white/10">
                                Tiếp tục
                            </button>
                            <button onClick={handleEndCall} disabled={isEnding}
                                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors disabled:opacity-50">
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
                             text-white text-lg transition-all active:scale-95 shadow-md
                             ${!active ? 'bg-red-600/90 hover:bg-red-600'
                    : greenWhenActive
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : 'bg-white/15 hover:bg-white/25'}`}>
                {active ? onIcon : offIcon}
            </div>
            <span className="text-white/40 text-[10px] group-hover:text-white/70 transition-colors whitespace-nowrap">
                {label}
            </span>
        </button>
    )
}

