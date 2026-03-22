import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { BsFillImageFill, BsLockFill, BsPeopleFill } from 'react-icons/bs'
import { MdEmojiEmotions } from 'react-icons/md'
import { FaTimes, FaGlobeAsia, FaPen, FaUserFriends } from 'react-icons/fa'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useQueryClient } from '@tanstack/react-query'
import { createPost } from '../../../../apis/postApi'
import useSound from 'use-sound'
import postSfx from '../../../../assets/sounds/post.mp3'

import * as nsfwjs from 'nsfwjs'

const PRIVACY_OPTIONS = [
  { value: 0, label: 'Công khai', icon: <FaGlobeAsia className="text-green-500" /> },
  { value: 3, label: 'Bạn bè', icon: <FaUserFriends className="text-blue-500" /> },
  { value: 1, label: 'Người theo dõi', icon: <BsPeopleFill className="text-purple-500" /> },
  { value: 2, label: 'Chỉ mình tôi', icon: <BsLockFill className="text-gray-500" /> }
]

export default function ModalUploadPost({ closeModalPost, profile, initialContent = '' }) {
  const queryClient = useQueryClient()
  const theme = localStorage.getItem('theme')
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const isSubmittingRef = useRef(false)
  const [play] = useSound(postSfx)
  const [image, setImage] = useState([])
  const [privacy, setPrivacy] = useState(0)
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false)
  const [showImagePopup, setShowImagePopup] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleImageClick = () => inputRef.current.click()
  const handleImageChange = (e) => setImage((prev) => [...prev, ...e.target.files])
  const handleDeleteImage = (index) => setImage((prev) => prev.filter((_, i) => i !== index))

  const uploadMutation = useSafeMutation({
    mutationFn: (body) => createPost(body)
  })

  const addEmoji = (e) => {
    const sym = e.unified.split('-')
    const codeArray = sym.map((el) => '0x' + el)
    const emoji = String.fromCodePoint(...codeArray)
    setContent((prev) => prev + emoji)
    setShowEmoji(false)
  }

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

  useEffect(() => {
    if (image.length > 5) setImage((prev) => prev.slice(0, 5))
  }, [image])

  // ---- NSFW check ----
  const processImage = async (imgFile) => {
    const reader = new FileReader()
    const img = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(imgFile)
    })
    const imageElement = new Image()
    imageElement.src = img
    return new Promise((resolve, reject) => {
      imageElement.onload = async () => {
        try {
          const model = await nsfwjs.load('/model/')
          const predictions = await model.classify(imageElement)
          resolve(predictions)
        } catch (error) {
          reject(error)
        }
      }
      imageElement.onerror = reject
    })
  }

  const classifyImages = async (images) => {
    try {
      toast.loading('Đang xử lý ảnh...')
      const results = await Promise.all(images.map((img) => processImage(img)))
      toast.dismiss()
      return results
    } catch (error) {
      console.error('Error processing images:', error)
    }
  }

  const handleUpload = async () => {
    // Prevent duplicate submissions
    if (isSubmittingRef.current || uploadMutation.isPending || isSuccess) return
    isSubmittingRef.current = true

    if (image.length > 0) {
      const result = await classifyImages(image)
      const flagged = result
        ?.map((predictions) =>
          predictions.some(
            (p) =>
              (p.className === 'Sexy' || p.className === 'Porn' || p.className === 'Hentai') &&
              p.probability > 0.6
          )
        )
        .some((f) => f)

      if (flagged) {
        isSubmittingRef.current = false
        return toast.error('Ảnh của bạn có chứa nội dung nhạy cảm')
      }
    }

    if (content === '' && image.length === 0) {
      isSubmittingRef.current = false
      return toast.error('Nội dung hoặc ảnh không được để trống')
    }

    var formData = new FormData()
    for (let i = 0; i < image.length; i++) formData.append('image', image[i])
    formData.append('content', content)
    formData.append('privacy', privacy)

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        setIsSuccess(true)
        queryClient.invalidateQueries({ queryKey: ['newFeeds'] })
        toast.success('Đăng bài viết thành công')
        setContent('')
        setImage([])
        play()
        closeModalPost()
        isSubmittingRef.current = false
      },
      onError: (error) => {
        console.log(error)
        isSubmittingRef.current = false
      }
    })
  }

  const selectedPrivacy = PRIVACY_OPTIONS.find((o) => o.value === privacy)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={closeModalPost}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaPen className="text-red-500" />
            Tạo bài viết
          </h2>
          <button
            onClick={closeModalPost}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 dark:text-gray-400"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Author row ── */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-2">
            <img
              src={profile?.avatar === '' ? useravatar : profile?.avatar}
              alt={profile?.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-red-400"
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
              rows={4}
              className="w-full resize-none outline-none text-sm text-gray-800 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
            />
          </div>

          {/* ── Image upload area ── */}
          {showImagePopup && (
            <div className="px-5 pb-3">
              {image.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {image.map((img, index) => (
                    <div className="relative group" key={index}>
                      <img
                        className="h-24 w-full rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        src={URL.createObjectURL(img)}
                        alt="upload"
                      />
                      <button
                        onClick={() => handleDeleteImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-500"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                  {image.length < 5 && (
                    <div
                      onClick={handleImageClick}
                      className="h-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-red-400 transition"
                    >
                      <BsFillImageFill className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">Thêm ảnh</span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={handleImageClick}
                  className="h-32 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-red-400 transition"
                >
                  <BsFillImageFill className="text-2xl text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Chọn ảnh để tải lên
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    Tối đa 5 ảnh (JPG, PNG)
                  </span>
                </div>
              )}
              <input
                ref={inputRef}
                onChange={handleImageChange}
                type="file"
                className="hidden"
                multiple
                accept="image/jpeg, image/png"
              />
            </div>
          )}

          {/* ── Toolbar (image + emoji) ── */}
          <div className="flex items-center justify-between px-5 py-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImagePopup(!showImagePopup)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
                  ${showImagePopup
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <BsFillImageFill size={14} />
                <span className="hidden md:inline">Ảnh</span>
              </button>
            </div>

            <div className="relative">
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
        </div>

        {/* ── Footer / Submit ── */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          {uploadMutation.isPending || isSuccess ? (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-gray-400 cursor-not-allowed"
            >
              <AiOutlineLoading3Quarters className="animate-spin" size={16} />
              Đang tải lên...
            </button>
          ) : (
            <button
              onClick={handleUpload}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm
                bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600
                transition shadow-lg shadow-red-500/20"
            >
              <FaPen size={12} />
              Đăng bài viết
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
