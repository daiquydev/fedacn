import { roundKcal } from '../../../utils/mathUtils'
import { useSafeMutation } from '../../../hooks/useSafeMutation'
import { useState, useContext, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import toast from 'react-hot-toast'
import {
  FaTimes, FaShare, FaTrophy,
  FaUtensils, FaRunning, FaDumbbell,
  FaFire, FaClock, FaGlobeAsia,
  FaLeaf, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { BsLockFill, BsPeopleFill } from 'react-icons/bs'
import { MdEmojiEmotions, MdFitnessCenter } from 'react-icons/md'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import useSound from 'use-sound'

import { AppContext } from '../../../contexts/app.context'
import { createPost } from '../../../apis/postApi'
import { getAvatarSrc, getImageUrl } from '../../../utils/imageUrl'
import useravatar from '../../../assets/images/useravatar.jpg'
import postSound from '../../../assets/sounds/post.mp3'

const PRIVACY_OPTIONS = [
  { value: 0, label: 'Công khai', icon: <FaGlobeAsia className="text-green-500" /> },
  { value: 1, label: 'Người theo dõi', icon: <BsPeopleFill className="text-blue-500" /> },
  { value: 2, label: 'Chỉ mình tôi', icon: <BsLockFill className="text-gray-500" /> }
]

const TYPE_CONFIG = {
  nutrition: {
    icon: <FaUtensils />,
    label: 'Ăn uống',
    headerBg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    accentColor: 'text-emerald-500',
    accentBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    accentBorder: 'border-emerald-200 dark:border-emerald-800',
    dashedBorder: 'border-emerald-200 dark:border-emerald-800',
    pillBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    pillText: 'text-emerald-700 dark:text-emerald-300'
  },
  fitness: {
    icon: <FaDumbbell />,
    label: 'Thể dục',
    headerBg: 'bg-gradient-to-r from-orange-500 to-amber-600',
    accentColor: 'text-orange-500',
    accentBg: 'bg-orange-50 dark:bg-orange-900/20',
    accentBorder: 'border-orange-200 dark:border-orange-800',
    dashedBorder: 'border-orange-200 dark:border-orange-800',
    pillBg: 'bg-orange-100 dark:bg-orange-900/30',
    pillText: 'text-orange-700 dark:text-orange-300'
  }
}

function formatDuration(minutes) {
  if (!minutes) return '0 phút'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}g ${m}p`
  return `${m} phút`
}

/**
 * Chia sẻ tiến độ thử thách (fitness / nutrition) lên cộng đồng.
 * Tạo post với marker [challenge-activity:ENTRY_ID:CHALLENGE_ID]
 * → PostCard detect marker → render ChallengeActivityPreviewCard (đã hỗ trợ cả 3 loại)
 */
export default function ChallengeProgressShareModal({ entry, challenge, onClose }) {
  const { profile } = useContext(AppContext)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [play] = useSound(postSound)
  const theme = localStorage.getItem('theme')

  const visibilityToPrivacy = { public: 0, friends: 1, private: 2 }
  const defaultPrivacy = challenge?.visibility != null
    ? (visibilityToPrivacy[challenge.visibility] ?? 0)
    : 0

  const [content, setContent] = useState('')
  const [privacy, setPrivacy] = useState(defaultPrivacy)
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const textareaRef = useRef(null)
  const dropdownRef = useRef(null)

  const challengeType = challenge?.challenge_type || 'fitness'
  const config = TYPE_CONFIG[challengeType] || TYPE_CONFIG.fitness

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowPrivacyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const handleShare = () => {
    const marker = `[challenge-progress:${entry._id}:${challenge._id}]`
    const fullContent = content.trim()
      ? `${content.trim()}\n${marker}`
      : marker

    const formData = new FormData()
    formData.append('content', fullContent)
    formData.append('privacy', String(privacy))

    createPostMutation.mutate(formData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newFeeds'] })
        toast.success('🏆 Đã chia sẻ tiến độ lên cộng đồng!')
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
  const actDate = moment(entry.createdAt || entry.date).format('HH:mm - DD/MM/YYYY')

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
            <FaRunning className="text-orange-500" />
            Chia sẻ tiến độ
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
              className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-400"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {profile?.name}
              </span>
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
              placeholder={`${profile?.name?.split(' ').slice(-1)[0] || 'Bạn'} ơi, bạn cảm thấy thế nào sau buổi tập?`}
              rows={3}
              className="w-full resize-none outline-none text-sm text-gray-800 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
            />
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

          {/* ── Preview Card ── */}
          <div className="mx-5 mb-4">
            <div className={`rounded-xl overflow-hidden border-2 border-dashed ${config.dashedBorder} bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900`}>
              {/* Type banner */}
              <div className={`${config.headerBg} px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">{config.icon}</span>
                  <span className="text-white text-xs font-semibold uppercase tracking-wide">
                    {config.label}
                  </span>
                  <span className="text-white/60 text-[10px]">• Hoạt động thử thách</span>
                </div>
                <span className="text-white/80 text-xs">{actDate}</span>
              </div>

              {/* Type-specific content */}
              {challengeType === 'nutrition' ? (
                <NutritionPreview entry={entry} challenge={challenge} config={config} />
              ) : (
                <FitnessPreview entry={entry} challenge={challenge} config={config} />
              )}

              {/* Challenge footer */}
              {challenge && (
                <div className={`mx-3 mb-3 ${config.accentBg} rounded-lg px-3 py-2 border ${config.accentBorder}`}>
                  <div className="flex items-center gap-2">
                    <FaTrophy className="text-amber-500 shrink-0" size={11} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {challenge.title}
                    </span>
                  </div>
                </div>
              )}

              <div className="px-3 pb-3 text-xs text-center text-gray-400 dark:text-gray-500 italic">
                💡 Người xem nhấn vào bài viết để xem chi tiết sự kiện
              </div>
            </div>
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

/* ── Nutrition Preview ── */
function NutritionPreview({ entry, challenge, config }) {
  const goalUnit = challenge?.goal_unit || 'kcal'
  const isValid = entry.ai_review_valid === true
  const isPending = entry.ai_review_valid === null || entry.ai_review_valid === undefined
  const isInvalid = entry.ai_review_valid === false

  return (
    <div className="p-3">
      <div className="flex gap-3">
        {entry.proof_image ? (
          <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 shadow-sm">
            <img
              src={getImageUrl(entry.proof_image)}
              alt="Ảnh bữa ăn"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg shrink-0 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <FaLeaf className="text-emerald-400 text-3xl opacity-50" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {entry.food_name && (
            <p className="text-sm font-bold text-gray-800 dark:text-white mb-1.5 line-clamp-2">
              {entry.food_name}
            </p>
          )}

          <div className="flex items-center gap-2 mb-2">
            <div className={`${config.pillBg} rounded-full px-3 py-1`}>
              <span className={`${config.pillText} font-bold text-sm`}>
                {entry.value} {entry.unit || goalUnit}
              </span>
            </div>
          </div>

          {!isPending && (
            <div className={`flex items-center gap-1.5 text-xs rounded-full px-2 py-0.5 w-fit
              ${isValid
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}
            >
              {isValid
                ? <><FaCheckCircle size={9} /> AI xác nhận hợp lệ</>
                : <><FaTimesCircle size={9} /> AI đánh giá không hợp lệ</>
              }
            </div>
          )}
        </div>
      </div>

      {entry.notes && (
        <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
          "{entry.notes}"
        </p>
      )}
    </div>
  )
}

/* ── Fitness Preview ── */
function FitnessPreview({ entry, challenge, config }) {
  const goalUnit = challenge?.goal_unit || 'phút'

  const stats = []

  stats.push({
    icon: <FaDumbbell className="text-orange-500" />,
    label: challenge?.goal_unit || 'Thực hiện',
    value: `${entry.value} ${entry.unit || goalUnit}`
  })

  if (entry.duration_minutes) {
    const h = Math.floor(entry.duration_minutes / 60)
    const m = entry.duration_minutes % 60
    const dur = h > 0 ? `${h}g ${m}p` : `${m} phút`
    stats.push({ icon: <FaClock className="text-amber-500" />, label: 'Thời gian', value: dur })
  }
  if (entry.exercises_count) {
    stats.push({ icon: <MdFitnessCenter className="text-orange-500" />, label: 'Bài tập', value: `${entry.exercises_count} bài` })
  }
  if (entry.calories) {
    stats.push({ icon: <FaFire className="text-red-500" />, label: 'Calo', value: `${roundKcal(entry.calories)} kcal` })
  }

  const displayStats = stats.slice(0, 4)

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 gap-2">
        {displayStats.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-orange-50/60 dark:bg-orange-900/10 rounded-lg px-3 py-2 border border-orange-100 dark:border-orange-900/30">
            <div className="text-base shrink-0">{s.icon}</div>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium">{s.label}</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {entry.notes && (
        <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
          "{entry.notes}"
        </p>
      )}
    </div>
  )
}
