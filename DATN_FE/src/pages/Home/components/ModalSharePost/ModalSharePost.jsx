import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { getAvatarSrc, getImageUrl } from '../../../../utils/imageUrl'
import { MdEmojiEmotions } from 'react-icons/md'
import { useContext, useEffect, useRef, useState } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import moment from 'moment'
import { useQueryClient } from '@tanstack/react-query'
import { sharePost } from '../../../../apis/postApi'
import toast from 'react-hot-toast'
import postSound from '../../../../assets/sounds/post.mp3'
import { AppContext } from '../../../../contexts/app.context'
import { SocketContext } from '../../../../contexts/socket.context'
import useSound from 'use-sound'
import { FaTimes, FaShare, FaGlobeAsia, FaUserFriends } from 'react-icons/fa'
import { BsLockFill, BsPeopleFill } from 'react-icons/bs'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const PRIVACY_OPTIONS = [
  { value: 0, label: 'Công khai', icon: <FaGlobeAsia className="text-green-500" /> },
  { value: 3, label: 'Bạn bè', icon: <FaUserFriends className="text-blue-500" /> },
  { value: 1, label: 'Người theo dõi', icon: <BsPeopleFill className="text-purple-500" /> },
  { value: 2, label: 'Chỉ mình tôi', icon: <BsLockFill className="text-gray-500" /> }
]

export default function ModalSharePost({ handleCloseSharePost, post }) {
  const { profile } = useContext(AppContext)
  const { newSocket } = useContext(SocketContext)
  const queryClient = useQueryClient()
  const [play] = useSound(postSound)
  const theme = localStorage.getItem('theme')

  const [showEmoji, setShowEmoji] = useState(false)
  const [privacy, setPrivacy] = useState(0)
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false)
  const [content, setContent] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const dropdownRef = useRef(null)

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
    const emoji = String.fromCodePoint(...codeArray)
    setContent((prev) => prev + emoji)
    setShowEmoji(false)
  }

  const uploadMutation = useSafeMutation({
    mutationFn: (body) => sharePost(body)
  })

  const handleSharePost = () => {
    if (uploadMutation.isPending || isSuccess) return

    const body = {
      content: content,
      privacy: privacy,
      parent_id: post.type === 0 ? post._id : post.parent_post._id
    }

    uploadMutation.mutate(body, {
      onSuccess: () => {
        setIsSuccess(true)
        toast.success('Chia sẻ bài viết thành công')
        queryClient.invalidateQueries({ queryKey: ['newFeeds'] })
        newSocket.emit('share post', {
          content: 'Đã chia sẻ bài viết của bạn',
          to: post.user._id,
          name: profile.name,
          avatar: profile.avatar
        })
        play()
        setContent('')
        handleCloseSharePost()
      },
      onError: () => {
        toast.error('Có lỗi xảy ra khi chia sẻ bài viết')
      }
    })
  }

  const selectedPrivacy = PRIVACY_OPTIONS.find((o) => o.value === privacy)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleCloseSharePost}
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
            Chia sẻ bài viết
          </h2>
          <button
            onClick={handleCloseSharePost}
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
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = useravatar
              }}
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {profile?.name}
              </span>

              {/* Privacy dropdown */}
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
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${profile?.name?.split(' ').slice(-1).join('') || 'Bạn'} ơi, bạn đang nghĩ gì thế?`}
              rows={3}
              className="w-full resize-none outline-none text-sm text-gray-800 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
            />

            {/* Emoji toggle */}
            <div className="flex justify-end mt-1 relative">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
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

          {/* ── Post preview (shared post) ── */}
          <div className="mx-5 mb-4">
            <CheckTypeOfPost post={post} />
          </div>
        </div>

        {/* ── Footer / Submit ── */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          {uploadMutation.isPending || isSuccess ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-gray-400 cursor-not-allowed"
            >
              <AiOutlineLoading3Quarters className="animate-spin" size={16} />
              Đang chia sẻ...
            </button>
          ) : (
            <button
              onClick={handleSharePost}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm
                bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600
                transition shadow-lg shadow-red-500/20"
            >
              <FaShare size={14} />
              Chia sẻ bài viết
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CheckTypeOfPost({ post }) {
  if (post.type === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
        <div className='flex items-center gap-2 px-3 py-2'>
          <img
            className='rounded-full w-7 h-7 object-cover'
            src={post.user.avatar === '' ? useravatar : getImageUrl(post.user.avatar)}
          />
          <div>
            <span className='text-xs font-bold text-gray-800 dark:text-white'>{post.user.name}</span>
            <div className='text-slate-400 text-[10px]'>{moment(post.createdAt).format('L')}</div>
          </div>
        </div>
        <p className='px-3 pb-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2 whitespace-pre-line'>{post.content}</p>
        <CheckLengthOfImages images={post.images} />
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
      <div className='flex items-center gap-2 px-3 py-2'>
        <img
          className='rounded-full w-7 h-7 object-cover'
          src={post.parent_user.avatar === '' ? useravatar : getImageUrl(post.parent_user.avatar)}
        />
        <div>
          <span className='text-xs font-bold text-gray-800 dark:text-white'>{post.parent_user.name}</span>
          <div className='text-slate-400 text-[10px]'>{moment(post.parent_post.createdAt).format('L')}</div>
        </div>
      </div>
      <p className='px-3 pb-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-3 whitespace-pre-line'>{post.parent_post.content}</p>
      <CheckLengthOfImages images={post.parent_images} />
    </div>
  )
}

function CheckLengthOfImages({ images }) {
  if (!images || images.length === 0) return null
  return (
    <div className='h-32 overflow-hidden'>
      <img className='w-full h-full object-cover' src={getImageUrl(images[0])} />
    </div>
  )
}
