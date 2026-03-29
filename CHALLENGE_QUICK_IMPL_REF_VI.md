# 🚀 QUICK IMPLEMENTATION REFERENCE

## Copy-Paste Ready Code Snippets

### 1. ChallengePreviewCard.jsx (IMPLEMENTATION)

```jsx
// File: DATN_FE/src/components/Post/ChallengePreviewCard.jsx

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
    FaTrophy,
    FaUsers,
    FaCalendarAlt,
    FaFire,
    FaArrowRight,
    FaUtensils,
    FaRunning,
    FaDumbbell
} from 'react-icons/fa'
import { getChallenge } from '../../apis/challengeApi'
import { getImageUrl } from '../../utils/imageUrl'
import moment from 'moment'

/**
 * Extracts challenge ID from marker [challenge:CHALLENGE_ID]
 */
export function extractChallengeId(content) {
    if (!content) return null
    const match = content.match(/\[challenge:([a-f0-9]{24})\]/i)
    return match ? match[1] : null
}

/**
 * Returns content without challenge marker
 */
export function cleanChallengeMarker(content) {
    if (!content) return content
    return content.replace(/\n?\[challenge:[a-f0-9]{24}\]/gi, '').trim()
}

const TYPE_ICON = {
    nutrition: <FaUtensils className="text-emerald-500" />,
    outdoor_activity: <FaRunning className="text-blue-500" />,
    fitness: <FaDumbbell className="text-purple-500" />
}

const TYPE_GRADIENT = {
    nutrition: 'from-emerald-500 to-teal-500',
    outdoor_activity: 'from-blue-500 to-cyan-500',
    fitness: 'from-purple-500 to-pink-500'
}

export default function ChallengePreviewCard({ challengeId }) {
    const navigate = useNavigate()

    const { data, isLoading, isError } = useQuery({
        queryKey: ['challenge-preview', challengeId],
        queryFn: () => getChallenge(challengeId),
        enabled: Boolean(challengeId),
        retry: 1
    })

    if (!challengeId) return null

    if (isLoading) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-4 rounded-xl border border-dashed border-purple-200 dark:border-purple-900 animate-pulse">
                <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    </div>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="mt-3 mx-4 md:mx-0 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-xs text-center">
                Không thể tải thông tin thử thách
            </div>
        )
    }

    const challenge = data?.data?.result
    if (!challenge) return null

    const typeIcon = TYPE_ICON[challenge.challenge_type]
    const typeGradient = TYPE_GRADIENT[challenge.challenge_type]
    const daysLeft = Math.max(0, moment(challenge.end_date).diff(moment(), 'days'))
    const isExpired = daysLeft === 0

    return (
        <div
            onClick={() => navigate(`/challenge/${challenge._id}`)}
            className="mt-3 mx-4 md:mx-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700
            hover:border-purple-400 dark:hover:border-purple-600 cursor-pointer transition-all duration-200
            hover:shadow-lg hover:shadow-purple-100 dark:hover:shadow-purple-900/20
            bg-white dark:bg-gray-800 group"
            title="Nhấn để xem chi tiết thử thách"
        >
            {/* Header */}
            <div className={`bg-gradient-to-r ${typeGradient} px-4 py-2.5 flex items-center gap-2`}>
                {typeIcon}
                <span className="text-white text-xs font-bold uppercase tracking-wide flex-1">
                    {challenge.category || (
                        challenge.challenge_type === 'nutrition'
                            ? 'Ăn uống'
                            : challenge.challenge_type === 'outdoor_activity'
                                ? 'Ngoài trời'
                                : 'Thể dục'
                    )}
                </span>
                <span className="text-white text-xs font-semibold">
                    {isExpired ? '✓ Đã kết thúc' : `${daysLeft} ngày`}
                </span>
            </div>

            {/* Content */}
            <div className="p-4 flex gap-3">
                {/* Image or Badge */}
                <div className="shrink-0">
                    {challenge.image ? (
                        <img
                            src={getImageUrl(challenge.image)}
                            alt={challenge.title}
                            className="w-16 h-16 rounded-lg object-cover"
                        />
                    ) : (
                        <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${typeGradient} flex items-center justify-center`}>
                            <span className="text-2xl">{challenge.badge_emoji || '🏆'}</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                        {challenge.title}
                    </h4>
                    
                    {challenge.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                            {challenge.description}
                        </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <FaUsers size={12} />
                            {challenge.participants_count} người
                        </span>
                        <span className="flex items-center gap-1">
                            <FaFire size={12} />
                            {challenge.goal_value}{challenge.goal_unit}
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 flex items-center">
                    <FaArrowRight className="text-purple-400 group-hover:text-purple-600 transition-colors" />
                </div>
            </div>
        </div>
    )
}
```

---

### 2. ChallengeShareModal.jsx (SKELETON)

```jsx
// File: DATN_FE/src/components/Challenge/ChallengeShareModal.jsx

import { useState, useRef, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSafeMutation } from '../../hooks/useSafeMutation'
import toast from 'react-hot-toast'
import {
    FaTimes,
    FaShare,
    FaGlobeAsia,
    FaBolt
} from 'react-icons/fa'
import { BsLockFill, BsPeopleFill } from 'react-icons/bs'
import { MdEmojiEmotions } from 'react-icons/md'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

import { AppContext } from '../../contexts/app.context'
import { createPost } from '../../apis/postApi'
import { getImageUrl } from '../../utils/imageUrl'
import useravatar from '../../assets/images/useravatar.jpg'

const PRIVACY_OPTIONS = [
    { value: 0, label: 'Công khai', icon: <FaGlobeAsia className="text-green-500" /> },
    { value: 1, label: 'Người theo dõi', icon: <BsPeopleFill className="text-blue-500" /> },
    { value: 2, label: 'Chỉ mình tôi', icon: <BsLockFill className="text-gray-500" /> }
]

// Map challenge visibility to privacy value
const visibilityToPrivacy = {
    'public': 0,
    'friends': 1,
    'private': 2
}

export default function ChallengeShareModal({
    challenge,
    challengeId,
    challengeVisibility,
    onClose
}) {
    const { profile } = useContext(AppContext)
    const navigate = useNavigate()
    const [content, setContent] = useState('')
    const [privacy, setPrivacy] = useState(
        visibilityToPrivacy[challengeVisibility] ?? 0
    )
    const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false)
    const [showEmoji, setShowEmoji] = useState(false)
    const textareaRef = useRef(null)
    const dropdownRef = useRef(null)

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus()
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setShowPrivacyDropdown(false)
        }
    }

    const mutation = useSafeMutation({
        mutationFn: async () => {
            const marker = `[challenge:${challengeId}]`
            const postContent = content.trim() ? `${content}\n\n${marker}` : marker

            return createPost({
                content: postContent,
                images: [],
                privacy
            })
        },
        onSuccess: () => {
            toast.success('Chia sẻ thử thách thành công! 🎉')
            onClose()
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || 'Lỗi khi chia sẻ')
        }
    })

    const selectedPrivacy = PRIVACY_OPTIONS.find(p => p.value === privacy)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 transform animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Chia sẻ thử thách
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {challenge?.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                    >
                        <FaTimes className="text-gray-500" />
                    </button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                    <img
                        src={getImageUrl(profile?.avatar) || useravatar}
                        alt={profile?.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                            {profile?.name}
                        </p>
                        <div ref={dropdownRef} className="relative">
                            <button
                                onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                            >
                                {selectedPrivacy?.icon}
                                {selectedPrivacy?.label}
                            </button>
                            
                            {showPrivacyDropdown && (
                                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                    {PRIVACY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                setPrivacy(opt.value)
                                                setShowPrivacyDropdown(false)
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
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

                {/* Content Textarea */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Hãy chia sẻ cảm xúc của bạn về thử thách này...`}
                    className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 mb-4"
                    rows="4"
                />

                {/* Challenge Preview */}
                <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-purple-200 dark:border-purple-900">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        🏆 Thử thách sẽ được share
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {challenge?.title}
                    </p>
                </div>

                {/* Emoji Picker */}
                {showEmoji && (
                    <div className="mb-4">
                        <Picker data={data} onEmojiSelect={(e) => {
                            setContent(content + e.native)
                        }} />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setShowEmoji(!showEmoji)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        title="Emoji picker"
                    >
                        <MdEmojiEmotions className="text-gray-500 text-lg" />
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending || !content.trim()}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center gap-2"
                        >
                            <FaShare size={14} />
                            {mutation.isPending ? 'Đang chia sẻ...' : 'Chia sẻ'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
```

---

### 3. Updates to PostCard.jsx

```jsx
// File: DATN_FE/src/components/CardComponents/PostCard/PostCard.jsx

// ADD at top with other imports:
import ChallengePreviewCard, { 
    extractChallengeId, 
    cleanChallengeMarker 
} from '../../Post/ChallengePreviewCard'

// Inside component, replace the content rendering section:
const challengeId = extractChallengeId(data.content)
const cleanedContent = cleanChallengeMarker(
    cleanActivityMarker(
        cleanSportEventMarker(data.content)
    )
)

// In JSX render (around where SportEventPreviewCard is rendered):
<p className=''>{cleanedContent}</p>

{/* Add after other preview cards */}
{challengeId && <ChallengePreviewCard challengeId={challengeId} />}
```

---

### 4. Updates to ChallengeDetail.jsx

```jsx
// File: DATN_FE/src/pages/Challenge/ChallengeDetail.jsx

// ADD at top with other imports:
import ChallengeShareModal from '../../components/Challenge/ChallengeShareModal'

// Inside component state:
const [showShareModal, setShowShareModal] = useState(false)

// Add button in JSX (near other action buttons):
<button
    onClick={() => setShowShareModal(true)}
    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
    title="Chia sẻ thử thách lên cộng đồng"
>
    <FaShare /> Chia sẻ
</button>

// Add modal at bottom of JSX:
{showShareModal && (
    <ChallengeShareModal
        challenge={challenge}
        challengeId={id}
        challengeVisibility={challenge?.visibility}
        onClose={() => setShowShareModal(false)}
    />
)}
```

---

### 5. Updates to Challenge.jsx Card

```jsx
// File: DATN_FE/src/pages/Challenge/Challenge.jsx

// Add share icon to ChallengeCard component:
// In the card header, add:
<button
    onClick={(e) => {
        e.stopPropagation()
        // TODO: Handle share
        console.log('Share challenge:', challenge._id)
    }}
    className="absolute top-3 right-3 bg-white/80 dark:bg-gray-900/80 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition"
    title="Chia sẻ"
>
    <FaShare className="text-purple-600" />
</button>
```

---

## Testing Checklist

```
✅ Run Tests

1. Backend:
   - No new changes needed (API already supports posts with markers)
   - Existing POST /api/posts endpoint handles [challenge:ID] markers

2. Frontend Functions:
   - Test extractChallengeId(content)
     ✓ Match valid marker
     ✓ Return null for missing marker
     ✓ Handle malformed input
   
   - Test cleanChallengeMarker(content)
     ✓ Remove marker
     ✓ Preserve other content
     ✓ Handle edge cases

3. Components:
   ✓ ChallengePreviewCard loads and displays
   ✓ ChallengeShareModal opens/closes
   ✓ PostCard renders challenge preview
   ✓ Share button works

4. Integration:
   ✓ Create challenge
   ✓ Click share button
   ✓ Write content
   ✓ Select privacy
   ✓ Post appears in feed
   ✓ Preview card displays
   ✓ Click card navigates to challenge
   ✓ Join button works
```

---

## Dependencies Check

Make sure these imports are available:

```javascript
// Components you're using are already imported in PostCard:
✓ useQuery (@tanstack/react-query)
✓ useNavigate (react-router-dom)
✓ toast (react-hot-toast)
✓ Icons (react-icons)

// APIs needed (already in challengeApi.js):
✓ getChallenge(id) - already implemented
✓ joinChallenge(id) - already implemented

// Utilities needed:
✓ getImageUrl - already exists
✓ moment - already available
```

---

## Migration Notes

- **No database changes needed** - existing Post schema supports marker format
- **No authentication changes** - uses existing verifyToken middleware
- **No breaking changes** - backward compatible with existing posts
- **No dependency changes** - uses existing packages

---

## Time Estimate

- ChallengePreviewCard: **1 hour** (copy pattern from SportEventPreviewCard)
- ChallengeShareModal: **1.5 hours** (copy pattern from SportEventShareModal)  
- PostCard updates: **30 minutes** (add imports and rendering logic)
- Challenge pages updates: **30 minutes** (add button/icon)
- Testing: **1 hour**

**Total: ~4-5 hours for one developer**

---

Date: 2024-03-29
