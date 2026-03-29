import { useEffect, useState, useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'

// ── Confetti presets per milestone tier ──
const CONFETTI_CONFIGS = {
    25: {
        particleCount: 50,
        spread: 60,
        colors: ['#CD7F32', '#B87333', '#DA9100'],
        gravity: 1.2,
        scalar: 0.8
    },
    50: {
        particleCount: 80,
        spread: 80,
        colors: ['#C0C0C0', '#A8A9AD', '#D7D7D7', '#71797E'],
        gravity: 1,
        scalar: 0.9
    },
    75: {
        particleCount: 120,
        spread: 100,
        colors: ['#FFD700', '#FFC107', '#FF9800', '#FFEB3B'],
        gravity: 0.8,
        scalar: 1
    },
    100: {
        particleCount: 200,
        spread: 160,
        colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF', '#FFD700'],
        gravity: 0.6,
        scalar: 1.2
    }
}

// ── Medal configs ──
const MILESTONE_DATA = {
    25: { medal: '🥉', title: 'Khởi động!', msg: 'Bạn đã hoàn thành 25% mục tiêu', gradient: 'from-amber-700 to-yellow-600', ring: 'ring-amber-400', glow: 'shadow-amber-400/50' },
    50: { medal: '🥈', title: 'Nửa chặng đường!', msg: '50% mục tiêu đã đạt!', gradient: 'from-gray-400 to-gray-300', ring: 'ring-gray-300', glow: 'shadow-gray-300/50' },
    75: { medal: '🥇', title: 'Gần đích!', msg: '75% — Cố lên nào!', gradient: 'from-yellow-500 to-amber-400', ring: 'ring-yellow-400', glow: 'shadow-yellow-400/50' },
    100: { medal: '🏆', title: 'HOÀN THÀNH!', msg: 'Bạn đã chinh phục mục tiêu!', gradient: 'from-yellow-400 via-red-500 to-pink-500', ring: 'ring-yellow-300', glow: 'shadow-yellow-300/60' }
}

const GROUP_MILESTONE_DATA = {
    25: { medal: '🎯', title: 'Khởi động nhóm!', msg: 'Sự kiện đã hoàn thành 25% mục tiêu chung', gradient: 'from-cyan-600 to-blue-500', ring: 'ring-cyan-400', glow: 'shadow-cyan-400/50' },
    50: { medal: '🔥', title: 'Nửa chặng đường!', msg: 'Cả nhóm đã đạt 50% mục tiêu!', gradient: 'from-blue-500 to-indigo-500', ring: 'ring-blue-400', glow: 'shadow-blue-400/50' },
    75: { medal: '⚡', title: 'Sắp về đích!', msg: '75% — Cả nhóm cùng cố lên!', gradient: 'from-indigo-500 to-violet-500', ring: 'ring-indigo-400', glow: 'shadow-indigo-400/50' },
    100: { medal: '🏅', title: 'SỰ KIỆN HOÀN THÀNH!', msg: 'Cả nhóm đã chinh phục mục tiêu!', gradient: 'from-emerald-400 via-cyan-500 to-blue-600', ring: 'ring-emerald-300', glow: 'shadow-emerald-300/60' }
}

// ── Fire confetti ──
function fireConfetti(pct) {
    const config = CONFETTI_CONFIGS[pct] || CONFETTI_CONFIGS[25]

    if (pct === 100) {
        // Epic 100% celebration — 3 bursts from different positions
        const fire = (opts) => confetti({ ...config, ...opts, ticks: 300, disableForReducedMotion: true })
        fire({ angle: 60, origin: { x: 0, y: 0.7 } })
        setTimeout(() => fire({ angle: 90, origin: { x: 0.5, y: 0.8 } }), 200)
        setTimeout(() => fire({ angle: 120, origin: { x: 1, y: 0.7 } }), 400)
        // Second wave
        setTimeout(() => {
            fire({ angle: 60, origin: { x: 0.2, y: 0.9 } })
            fire({ angle: 120, origin: { x: 0.8, y: 0.9 } })
        }, 800)
    } else if (pct === 75) {
        confetti({ ...config, angle: 60, origin: { x: 0, y: 0.7 }, ticks: 200, disableForReducedMotion: true })
        confetti({ ...config, angle: 120, origin: { x: 1, y: 0.7 }, ticks: 200, disableForReducedMotion: true })
    } else {
        confetti({ ...config, origin: { x: 0.5, y: 0.7 }, ticks: 150, disableForReducedMotion: true })
    }
}

// ── Modal component ──
function CelebrationModal({ milestone, isGroup, onClose }) {
    const data = isGroup ? GROUP_MILESTONE_DATA[milestone] : MILESTONE_DATA[milestone]
    const [animPhase, setAnimPhase] = useState(0) // 0=enter, 1=show, 2=exit

    useEffect(() => {
        // Phase in
        requestAnimationFrame(() => setAnimPhase(1))
        // Auto-close after 5s
        const timer = setTimeout(() => {
            setAnimPhase(2)
            setTimeout(onClose, 400)
        }, 5000)
        return () => clearTimeout(timer)
    }, [onClose])

    const handleClose = useCallback(() => {
        setAnimPhase(2)
        setTimeout(onClose, 400)
    }, [onClose])

    if (!data) return null

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-400
        ${animPhase === 1 ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'}`}
            onClick={handleClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className={`relative max-w-sm w-full transition-all duration-500 ease-out
          ${animPhase === 1
                        ? 'opacity-100 scale-100 translate-y-0'
                        : animPhase === 2
                            ? 'opacity-0 scale-90 translate-y-4'
                            : 'opacity-0 scale-75 -translate-y-8'
                    }`}
            >
                {/* Card */}
                <div className={`bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl ${data.glow} border border-white/20`}>
                    {/* Top gradient */}
                    <div className={`bg-gradient-to-br ${data.gradient} p-8 pb-12 text-center relative overflow-hidden`}>
                        {/* Decorative rings */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-4 border-white/10 animate-pulse" />
                        <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full border-4 border-white/10" />
                        <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-white/30 animate-ping" />
                        <div className="absolute top-8 right-6 w-2 h-2 rounded-full bg-white/20 animate-ping" style={{ animationDelay: '0.5s' }} />

                        {/* Medal */}
                        <div className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm ring-4 ${data.ring} mb-4`}
                            style={{ animation: 'celebMedalBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
                            <span className="text-5xl" style={{ animation: 'celebMedalSpin 0.8s ease-out forwards' }}>{data.medal}</span>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-black text-white mb-1 tracking-tight"
                            style={{ animation: 'celebSlideUp 0.5s 0.3s both' }}>
                            {data.title}
                        </h2>
                        <p className="text-white/80 text-sm font-medium"
                            style={{ animation: 'celebSlideUp 0.5s 0.45s both' }}>
                            {data.msg}
                        </p>
                    </div>

                    {/* Progress bar section */}
                    <div className="px-8 -mt-6 relative z-10">
                        <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    {isGroup ? 'Tiến độ sự kiện' : 'Tiến độ cá nhân'}
                                </span>
                                <span className="text-lg font-black bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                    {milestone}%
                                </span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${data.gradient} transition-all duration-1000 ease-out`}
                                    style={{ width: `${milestone}%`, animation: 'celebProgressFill 1s 0.5s both' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Close hint */}
                    <div className="p-4 pt-5 text-center">
                        <button
                            onClick={handleClose}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition font-medium"
                        >
                            Nhấn để đóng
                        </button>
                    </div>
                </div>
            </div>

            {/* Keyframe styles */}
            <style>{`
        @keyframes celebMedalBounce {
          0% { transform: scale(0) rotate(-30deg); }
          60% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes celebMedalSpin {
          0% { transform: rotateY(180deg) scale(0.5); opacity: 0; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes celebSlideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes celebProgressFill {
          0% { width: 0%; }
        }
      `}</style>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Main Hook: useMilestoneCelebration
// ═══════════════════════════════════════════════════════════════════════════════
export function useMilestoneCelebration(eventId, percent, storageKeySuffix = 'personal') {
    const [celebration, setCelebration] = useState(null)
    const hasHydrated = useRef(false)

    useEffect(() => {
        if (!eventId || percent <= 0) return

        const milestones = [25, 50, 75, 100]
        const key = `milestone_${storageKeySuffix}_${eventId}`
        const shown = JSON.parse(localStorage.getItem(key) || '[]')

        // First mount: silently mark all already-reached milestones
        if (!hasHydrated.current) {
            hasHydrated.current = true
            const alreadyReached = milestones.filter(pct => percent >= pct)
            const merged = [...new Set([...shown, ...alreadyReached])]

            // Only show celebration if there are milestones NOT previously stored
            const brandNew = alreadyReached.filter(pct => !shown.includes(pct))
            if (brandNew.length > 0) {
                // Show only the highest new milestone
                const highest = brandNew[brandNew.length - 1]
                setCelebration(highest)
                fireConfetti(highest)
            }

            localStorage.setItem(key, JSON.stringify(merged))
            return
        }

        // Subsequent updates: celebrate newly reached milestones
        const newMilestones = milestones.filter(pct => percent >= pct && !shown.includes(pct))
        if (newMilestones.length > 0) {
            const highest = newMilestones[newMilestones.length - 1]
            setCelebration(highest)
            fireConfetti(highest)
            newMilestones.forEach(pct => shown.push(pct))
            localStorage.setItem(key, JSON.stringify(shown))
        }
    }, [eventId, percent, storageKeySuffix])

    const closeCelebration = useCallback(() => setCelebration(null), [])

    return { celebration, closeCelebration }
}

// ── Render component ──
export default function MilestoneCelebration({ milestone, isGroup = false, onClose }) {
    if (!milestone) return null
    return <CelebrationModal milestone={milestone} isGroup={isGroup} onClose={onClose} />
}
