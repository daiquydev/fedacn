import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useState, useContext, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import toast from 'react-hot-toast'
import {
    FaTimes,
    FaShare,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaUsers,
    FaTrophy,
    FaRunning,
    FaGlobeAsia
} from 'react-icons/fa'
import { MdVideocam } from 'react-icons/md'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { BsLockFill, BsPeopleFill } from 'react-icons/bs'
import { MdEmojiEmotions } from 'react-icons/md'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import useSound from 'use-sound'

import { AppContext } from '../../contexts/app.context'
import { createPost } from '../../apis/postApi'
import { getAvatarSrc, getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'
import postSound from '../../assets/sounds/post.mp3'

const PRIVACY_OPTIONS = [
    { value: 0, label: 'Công khai', icon: <FaGlobeAsia className="text-green-500" /> },
    { value: 1, label: 'Người theo dõi', icon: <BsPeopleFill className="text-blue-500" /> },
    { value: 2, label: 'Chỉ mình tôi', icon: <BsLockFill className="text-gray-500" /> }
]

/**
 * Modal chia sẻ sự kiện thể thao lên cộng đồng.
 * - Hiện modal ngay trong trang, không navigate
 * - Preview thông tin sự kiện phía dưới (giống Facebook share)
 * - Embed sport_event_id vào content: [sport-event:ID]
 * - Nhấn vào preview trong PostCard → navigate đến trang sự kiện
 */
export default function SportEventShareModal({ event, onClose, eventId }) {
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
        if (textareaRef.current) {
            textareaRef.current.focus()
        }
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

    const addEmoji = (e) => {
        const sym = e.unified.split('-')
        const codeArray = sym.map((el) => '0x' + el)
        let emoji = String.fromCodePoint(...codeArray)
        setContent((prev) => prev + emoji)
        setShowEmoji(false)
    }

    const createPostMutation = useSafeMutation({
        mutationFn: (body) => createPost(body)
    })

    const handleShare = async () => {
        // Embed the sport event ID marker at the end of content
        const marker = `[sport-event:${eventId}]`
        const fullContent = content.trim()
            ? `${content.trim()}\n${marker}`
            : marker

        const formData = new FormData()
        formData.append('content', fullContent)
        formData.append('privacy', String(privacy))

        createPostMutation.mutate(formData, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['newFeeds'] })
                toast.success('🏆 Đã chia sẻ sự kiện lên cộng đồng!')
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
    const isOnline = event?.eventType === 'Trong nhà'

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
                        <FaShare className="text-red-500" />
                        Chia sẻ sự kiện
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
                            src={getAvatarSrc(profile?.avatar, useravatar)}
                            alt={profile?.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-red-400"
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
                          ${privacy === opt.value ? 'text-red-500 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
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
                            placeholder={`${profile?.name?.split(' ').slice(-1)[0] || 'Bạn'} ơi, bạn nghĩ gì về sự kiện này?`}
                            rows={3}
                            className="w-full resize-none outline-none text-sm text-gray-800 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
                        />

                        {/* Emoji picker toggle */}
                        <div className="flex justify-end mt-1 relative">
                            <button
                                onClick={() => setShowEmoji((v) => !v)}
                                className="text-gray-400 hover:text-yellow-400 transition p-1 rounded-full"
                                title="Thêm emoji"
                            >
                                <MdEmojiEmotions size={22} />
                            </button>
                            {showEmoji && (
                                <div className="absolute right-0 bottom-8 z-50">
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

                    {/* ── Sport Event Preview Card ── */}
                    <div className="mx-5 mb-4">
                        <SportEventPreviewCardInModal event={event} isOnline={isOnline} />
                    </div>
                </div>

                {/* ── Footer / Submit ── */}
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <button
                        onClick={handleShare}
                        disabled={createPostMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm
              bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600
              disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-red-500/20"
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
 * Preview card hiển thị trong modal (không clickable, chỉ để xem trước)
 */
function SportEventPreviewCardInModal({ event, isOnline }) {
    if (!event) return null

    const startDate = moment(event.startDate)
    const endDate = moment(event.endDate)

    return (
        <div className="rounded-xl overflow-hidden border-2 border-dashed border-red-200 dark:border-red-900 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            {/* Top label */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500">
                <FaRunning className="text-white text-xs" />
                <span className="text-white text-xs font-semibold tracking-wide uppercase">Sự kiện thể thao được chia sẻ</span>
            </div>

            {/* Ảnh bìa full width — cùng tỷ lệ với bài đăng / thẻ sự kiện */}
            <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                    src={getImageUrl(event.image)}
                    alt={event.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=Event' }}
                />
            </div>

            <div className="p-3">
                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOnline
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        }`}>
                        {isOnline ? '🏠 Trong nhà' : '🌿 Ngoài trời'}
                    </span>
                    {event.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium">
                            {event.category}
                        </span>
                    )}
                </div>

                {/* Name */}
                <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1.5">
                    {event.name}
                </h4>

                {/* Details */}
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <FaCalendarAlt size={10} className="text-red-400 shrink-0" />
                        <span>{startDate.format('DD/MM/YYYY')} – {endDate.format('DD/MM/YYYY')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {isOnline ? <MdVideocam size={11} className="text-blue-400 shrink-0" /> : <FaMapMarkerAlt size={10} className="text-green-400 shrink-0" />}
                        <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <FaUsers size={10} className="text-purple-400 shrink-0" />
                        <span>{event.participants}/{event.maxParticipants} người tham gia</span>
                    </div>
                </div>
            </div>

            {/* Target & Progress */}
            {event.targetValue && (
                <div className="px-3 pb-3">
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg px-3 py-2 flex items-center gap-3 border border-yellow-200 dark:border-yellow-800">
                        <FaTrophy className="text-yellow-500 shrink-0" size={16} />
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Mục tiêu</div>
                            <div className="text-sm font-bold text-gray-800 dark:text-white">
                                {event.targetValue} <span className="font-normal text-gray-500">{event.targetUnit}</span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Tham gia</div>
                            <div className="text-sm font-bold text-red-500">{event.participants}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* CTA hint */}
            <div className="px-3 pb-3">
                <div className="text-xs text-center text-gray-400 dark:text-gray-500 italic">
                    💡 Người xem có thể nhấn vào bài viết để xem chi tiết sự kiện
                </div>
            </div>
        </div>
    )
}
