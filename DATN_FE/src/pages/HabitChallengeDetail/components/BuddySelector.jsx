import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FaSearch, FaUserFriends, FaTimes, FaCheck } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { currentAccount } from '../../../apis/userApi'
import { setBuddy } from '../../../apis/habitChallengeApi'
import defaultAvatar from '../../../assets/images/useravatar.jpg'

export default function BuddySelector({ challengeId, currentBuddyId, onClose }) {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount,
    staleTime: 1000
  })

  const me = meData?.data?.result?.[0]
  const followers = useMemo(() => me?.followers || [], [me])
  const followings = useMemo(() => me?.followings || [], [me])
  const followingIds = useMemo(() => new Set(followings.map(p => String(p._id))), [followings])

  // Friends = mutual follow
  const friends = useMemo(
    () => followers.filter(p => followingIds.has(String(p._id))),
    [followers, followingIds]
  )

  const filteredFriends = useMemo(() => {
    if (!search.trim()) return friends
    const kw = search.toLowerCase().trim()
    return friends.filter(p => {
      const name = (p.name || '').toLowerCase()
      const email = (p.email || '').toLowerCase()
      return name.includes(kw) || email.includes(kw)
    })
  }, [friends, search])

  const buddyMutation = useMutation({
    mutationFn: (buddyId) => setBuddy(challengeId, buddyId),
    onSuccess: () => {
      toast.success('Đã chọn buddy thành công! 🎉')
      queryClient.invalidateQueries({ queryKey: ['habit-challenge', challengeId] })
      queryClient.invalidateQueries({ queryKey: ['habit-participants', challengeId] })
      onClose()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể chọn buddy')
  })

  return (
    <div className='fixed inset-0 z-[1000] flex items-center justify-center px-4'>
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />
      <div className='relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700'>
          <div className='flex items-center gap-2'>
            <FaUserFriends className='text-orange-500' />
            <h3 className='font-bold text-gray-800 dark:text-white'>Chọn Accountability Buddy</h3>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400'
          >
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className='px-5 py-3'>
          <div className='relative'>
            <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Tìm bạn bè...'
              className='w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-white'
            />
          </div>
          <p className='text-xs text-gray-400 mt-2'>
            Buddy sẽ nhận thông báo khi bạn check-in và nhắc nhở bạn nếu bạn quên!
          </p>
        </div>

        {/* Friends list */}
        <div className='px-5 pb-5 max-h-80 overflow-y-auto scrollbar-thin'>
          {isLoading ? (
            <div className='py-8 text-center text-gray-400 text-sm'>Đang tải danh sách bạn bè...</div>
          ) : filteredFriends.length === 0 ? (
            <div className='py-8 text-center'>
              <span className='text-3xl block mb-2'>👥</span>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {friends.length === 0 ? 'Bạn chưa có bạn bè nào' : 'Không tìm thấy kết quả'}
              </p>
            </div>
          ) : (
            <div className='space-y-1.5'>
              {filteredFriends.map(friend => {
                const isCurrentBuddy = String(friend._id) === String(currentBuddyId)
                return (
                  <div
                    key={friend._id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${isCurrentBuddy
                      ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-300 dark:ring-orange-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    onClick={() => !isCurrentBuddy && buddyMutation.mutate(friend._id)}
                  >
                    <img
                      src={friend.avatar || defaultAvatar}
                      alt={friend.name}
                      className='w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600'
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 truncate'>
                        {friend.name || 'Người dùng'}
                      </p>
                      <p className='text-xs text-gray-400 truncate'>{friend.email || ''}</p>
                    </div>
                    {isCurrentBuddy ? (
                      <span className='flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium'>
                        <FaCheck size={10} /> Buddy
                      </span>
                    ) : (
                      <span className='text-xs text-orange-500 font-medium hover:underline'>
                        Chọn
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
