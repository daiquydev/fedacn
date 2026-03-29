import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useState, useContext, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import toast from 'react-hot-toast'
import {
    FaTimes, FaShare, FaTrophy,
    FaUtensils, FaRunning, FaDumbbell,
    FaCalendarAlt, FaFire, FaUsers,
    FaGlobeAsia, FaClock
} from 'react-icons/fa'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { BsLockFill, BsPeopleFill } from 'react-icons/bs'
import { MdEmojiEmotions } from 'react-icons/md'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import useSound from 'use-sound'

import { AppContext } from '../../contexts/app.context'
import { createPost } from '../../apis/postApi'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import postSound from '../../assets/sounds/post.mp3'

const PRIVACY_OPTIONS = [
    { value: 0, label: 'Công khai', icon: <FaGlobeAsia className="text-green-500" /> },
    { value: 1, label: 'Người theo dõi', icon: <BsPeopleFill className="text-blue-500" /> },
    { value: 2, label: 'Chỉ mình tôi', icon: <BsLockFill className="text-gray-500" /> }
]

const TYPE_CONFIG = {
    nutrition: {
        icon: <FaUtensils />,
        label: 'Ăn uống',
        gradient: 'from-emerald-500 to-teal-600',
        headerBg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
        borderColor: 'border-emerald-200 dark:border-emerald-900',
        dashedBorder: 'border-emerald-200 dark:border-emerald-800'
    },
    outdoor_activity: {
        icon: <FaRunning />,
        label: 'Hoạt động ngoài trời',
        gradient: 'from-blue-500 to-cyan-600',
        headerBg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
        borderColor: 'border-blue-200 dark:border-blue-900',
        dashedBorder: 'border-blue-200 dark:border-blue-800'
    },
    fitness: {
        icon: <FaDumbbell />,
        label: 'Thể dục',
        gradient: 'from-orange-500 to-amber-600',
        headerBg: 'bg-gradient-to-r from-orange-500 to-amber-600',
        borderColor: 'border-orange-200 dark:border-orange-900',
        dashedBorder: 'border-orange-200 dark:border-orange-800'
    }
}

/**
 * Modal chia sẻ thử thách lên cộng đồng.
 * - Embed challenge_id vào content: [challenge:ID]
 * - Khi PostCard phát hiện marker → render ChallengePreviewCard
 */
export default function ChallengeShareModal({ challenge, challengeId, onClose }) {
    const { profile } = useContext(AppContext)
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [play] = useSound(postSound)
    const theme = localStorage.getItem('theme')

    const [content, setContent] = useState('')
    const [privacy, setPrivacy] = useState(0)
    const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false)
    const [showEmoji, setShowEmoji] = useState(false)
    const textareaRef = useRef(null)
    const dropdownRef = useRef(null)

    // Auto-focus textarea
    useEffect(() => {
        if (textareaRef.current) textareaRef.current.focus()
    }, [])

    // Close privacy dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowPrivacyDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Close emoji picker on outside click
    useEffect(() => {
        if (!showEmoji) return
        const handler = (e) => {
            if (!e.target.closest('[data-emoji-picker]') && !e.target.closest('em-emoji-picker')) {
                setShowEmoji(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showEmoji])

    const addEmoji = (e) => {
        const sym = e.unified.split('-')
        const codeArray = sym.map((el) => '0x' + el)
        const emoji = String.fromCodePoint(...codeArray)
        setContent((prev) => prev + emoji)
        setShowEmoji(false)
    }

    const createPostMutation = useSafeMutation({
        mutationFn: (body) => createPost(body)
    })

    const handleShare = async () => {
        const marker = `[challenge:${challengeId}]`
        const fullContent = content.trim()
            ? `${content.trim()}\n${marker}`
            : marker

        const formData = new FormData()
        formData.append('content', fullContent)
        formData.append('privacy', String(privacy))

        createPostMutation.mutate(formData, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['newFeeds'] })
                toast.success('🏆 Đã chia sẻ thử thách lên cộng đồng!')
                play()
                onClose()
                navigate('/home')
            },
            onError: (err) => {
                toast.error(err?.response?.data?.message || 'Không thể chia sẻ bài viết')
            }
        })
    }

    const selectedPrivacy = PRIVACY_OPTIONS.find((o) => o.value === privacy)
    const config = TYPE_CONFIG[challenge?.challenge_type] || TYPE_CONFIG.fitness

    const startDate = challenge?.start_date ? moment(challenge.start_date) : null
    const endDate = challenge?.end_date ? moment(challenge.end_date) : null

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden"
                style={{ maxHeight: '90vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaShare className="text-orange-500" />
                        Chia sẻ thử thách
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 dark:text-gray-400"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* ── Author row ── */}
                    <div className="flex items-center gap-3 px-5 pt-4 pb-2">
                        <img
                            src={profile?.avatar ? getImageUrl(profile.avatar) : useravatar}
                            alt={profile?.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-400"
                        />
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                {profile?.name}
                            </span>
                            {/* Privacy selector */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowPrivacyDropdown((v) => !v)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-0.5 rounded-full mt-0.5 transition"
                                >
                                    {selectedPrivacy?.icon}
                                    {selectedPrivacy?.label}
                                    <svg className="w-3 h-3 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {showPrivacyDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden min-w-[160px]">
                                        {PRIVACY_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setPrivacy(opt.value); setShowPrivacyDropdown(false) }}
                                                className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700
                          ${privacy === opt.value ? 'text-orange-500 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                                            >
                                                {opt.icon}
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Textarea ── */}
                    <div className="px-5 pb-2">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={`${profile?.name?.split(' ').slice(-1)[0] || 'Bạn'} ơi, hãy chia sẻ cảm nhận về thử thách này!`}
                            rows={3}
                            className="w-full resize-none outline-none text-sm text-gray-800 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
                        />
                        {/* Emoji picker toggle */}
                        <div className="flex justify-end mt-1 relative" data-emoji-picker>
                            <button
                                onClick={() => setShowEmoji((v) => !v)}
                                className="text-gray-400 hover:text-yellow-400 transition p-1 rounded-full"
                                title="Thêm emoji"
                            >
                                <MdEmojiEmotions size={22} />
                            </button>
                            {showEmoji && (
                                <div className="absolute right-0 bottom-8 z-50" data-emoji-picker>
                                    <Picker
                                        data={data}
                                        emojiSize={18}
                                        emojiButtonSize={25}
                                        onEmojiSelect={addEmoji}
                                        maxFrequentRows={0}
                                        previewPosition="none"
                                        locale="vi"
                                        theme={theme === 'dark' ? 'dark' : 'light'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Challenge Preview in Modal ── */}
                    <div className="mx-5 mb-4">
                        <ChallengePreviewCardInModal challenge={challenge} config={config} startDate={startDate} endDate={endDate} />
                    </div>
                </div>

                {/* ── Footer / Submit ── */}
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <button
                        onClick={handleShare}
                        disabled={createPostMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm
              bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600
              disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-orange-500/20"
                    >
                        {createPostMutation.isPending
                            ? <><AiOutlineLoading3Quarters className="animate-spin" size={16} /> Đang chia sẻ...</>
                            : <><FaShare size={14} /> Chia sẻ lên cộng đồng</>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}

/**
 * Preview card hiển thị bên trong modal — non-clickable, chỉ để user xem trước.
 */
function ChallengePreviewCardInModal({ challenge, config, startDate, endDate }) {
    if (!challenge) return null

    const isExpired = endDate && moment().isAfter(endDate.clone().endOf('day'))
    const isNotStarted = startDate && moment().isBefore(startDate.clone().startOf('day'))
    const daysLeft = endDate ? Math.max(0, endDate.diff(moment(), 'days')) : 0

    return (
        <div className={`rounded-xl overflow-hidden border-2 border-dashed ${config.dashedBorder} bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900`}>
            {/* Top label */}
            <div className={`flex items-center gap-2 px-3 py-1.5 ${config.headerBg}`}>
                <FaTrophy className="text-white text-xs" />
                <span className="text-white text-xs font-semibold tracking-wide uppercase">Thử thách được chia sẻ</span>
            </div>

            {/* Content */}
            <div className="flex gap-3 p-3">
                {/* Thumbnail or gradient */}
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 shadow-md">
                    {challenge.image ? (
                        <img
                            src={getImageUrl(challenge.image)}
                            alt={challenge.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                        />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                            <span className="text-3xl opacity-60">{challenge.badge_emoji || '🏆'}</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <div className="flex flex-wrap gap-1 mb-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-medium flex items-center gap-1">
                            {config.icon} {challenge.category && challenge.challenge_type === 'outdoor_activity' ? challenge.category : config.label}
                        </span>
                        {isExpired && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 font-medium">
                                Đã kết thúc
                            </span>
                        )}
                        {isNotStarted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 font-medium">
                                Sắp bắt đầu
                            </span>
                        )}
                        {!isExpired && !isNotStarted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Đang diễn ra
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1.5">
                        {challenge.title}
                    </h4>

                    {/* Details */}
                    <div className="space-y-0.5">
                        {startDate && endDate && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <FaCalendarAlt size={10} className="text-orange-400 shrink-0" />
                                <span>{startDate.format('DD/MM/YYYY')} – {endDate.format('DD/MM/YYYY')}</span>
                            </div>
                        )}
                        {challenge.goal_value && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <FaFire size={10} className="text-amber-400 shrink-0" />
                                <span>Mỗi ngày: {challenge.goal_value} {challenge.goal_unit}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <FaUsers size={10} className="text-blue-400 shrink-0" />
                            <span>{challenge.participants_count || 0} người tham gia</span>
                        </div>
                        {!isExpired && daysLeft > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <FaClock size={10} className="text-gray-400 shrink-0" />
                                <span>Còn {daysLeft} ngày</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CTA hint */}
            <div className="px-3 pb-3">
                <div className="text-xs text-center text-gray-400 dark:text-gray-500 italic">
                    💡 Người xem có thể nhấn vào bài viết để xem chi tiết và tham gia thử thách
                </div>
            </div>
        </div>
    )
}
