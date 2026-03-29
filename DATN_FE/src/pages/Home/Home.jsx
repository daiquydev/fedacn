import { useSafeMutation } from '../../hooks/useSafeMutation'
import { BsFillImageFill, BsFillSunFill } from 'react-icons/bs'
import useravatar from '../../assets/images/useravatar.jpg'
import { getImageUrl } from '../../utils/imageUrl'
import { MdNightlight, MdCheckCircle } from 'react-icons/md'
import { FaCheckCircle, FaCloudSun, FaUsers, FaHeartbeat, FaUtensils, FaRunning, FaUserPlus, FaArrowRight, FaTrophy, FaDumbbell, FaFire, FaPlus } from 'react-icons/fa'
import { PiClockAfternoonFill } from 'react-icons/pi'
import PostCard from '../../components/CardComponents/PostCard'
import { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ModalUploadPost from './components/ModalUploadPost'
import { getNewsFeed } from '../../apis/postApi'
import { getChallenges, joinChallenge } from '../../apis/challengeApi'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import LoadingHome from './components/LoadingHome'
import { AppContext } from '../../contexts/app.context'
import Loading from '../../components/GlobalComponents/Loading'
import { followUser, recommendUser } from '../../apis/userApi'
import { queryClient } from '../../main'
import { useNavigate } from 'react-router-dom'
import { MdClose } from 'react-icons/md'
import CalendarNotifications from '../../components/Dashboard/CalendarNotifications'
import { toast } from 'react-hot-toast'

export default function Home() {
  const { profile } = useContext(AppContext)
  const [modalPost, setModalPost] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [initialPostContent, setInitialPostContent] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Auto-open post modal with pre-filled content when navigated from event/activity share
  useEffect(() => {
    if (location.state?.openPost) {
      setInitialPostContent(location.state.initialContent || '')
      setModalPost(true)
      // Clear state so back navigation doesn't re-open
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const openModalPost = () => {
    setInitialPostContent('')
    setModalPost(true)
  }

  const closeModalPost = () => {
    setModalPost(false)
    setInitialPostContent('')
  }
  const { ref, inView } = useInView()
  const fetchNewsFeed = async ({ pageParam }) => {
    return await getNewsFeed({ page: pageParam })
  }

  const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['newFeeds'],
    queryFn: fetchNewsFeed,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.data.result.newFeeds.length ? allPages.length + 1 : undefined
      return nextPage
    },
    placeholderData: keepPreviousData
  })

  const content = data?.pages.map((dataNewFeeds) =>
    dataNewFeeds.data.result.newFeeds.map((newFeed) => {
      return <PostCard key={newFeed._id} data={newFeed} />
    })
  )

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])


  const { data: userData } = useQuery({
    queryKey: ['recommed-list-user'],
    queryFn: () => {
      return recommendUser()
    },
    placeholderData: keepPreviousData
  })

  if (status === 'pending') {
    return <LoadingHome />
  }

  if (status === 'error') {
    return (
      <div className='w-full p-10 text-center font-bold text-red-600 dark:text-pink-700 h-[100rem]'>
        Có lỗi xảy ra vui lòng load lại trang
      </div>
    )
  }
  return (
    <div className='space-y-4 w-full'>
      {/* Thông báo lịch cá nhân - Đặt ở trên cùng, toàn màn hình */}
      <div className='w-full'>
        <CalendarNotifications />
      </div>

      {/* Main content grid */}
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2.4fr),minmax(280px,1fr)]'>
        {/* Main column */}
        <div className='space-y-5 order-2 lg:order-1'>
          {/* Create Post Card */}
          <div className="bg-white py-4 px-6 shadow-md rounded-xl dark:bg-color-primary mb-6">
            <div>{checkTime(profile)}</div>
            <div className='flex justify-between items-center gap-2 md:gap-4 w-full mt-4'>
              <div className='w-10 h-10 md:w-12 flex-shrink-0 overflow-hidden md:h-12 rounded-full cursor-pointer ring-2 ring-green-200 dark:ring-green-800'>
                <img
                  className='w-10 h-10 md:w-12 object-cover md:h-12 rounded-full'
                  src={profile?.avatar && profile.avatar !== '' ? getImageUrl(profile.avatar) : useravatar}
                  alt='user photo'
                  onError={(e) => { e.target.src = useravatar }}
                />
              </div>
              <div
                onClick={openModalPost}
                className='bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-800 flex-1 cursor-pointer hover:bg-slate-200 transition-all h-12 md:h-14 my-4 flex items-center rounded-full'
              >
                <span className='mx-4 text-gray-500 dark:text-gray-400 text-sm md:text-base'>Bạn đang nghĩ gì về sức khỏe và thể thao?</span>
              </div>
            </div>
            <div className='border-t pt-4 mt-2 dark:border-gray-700 border-gray-200'></div>
            <div className='flex items-center justify-between'>
              <div
                onClick={openModalPost}
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all'
              >
                <BsFillImageFill className='text-blue-500' size={14} />
                <span>Hình ảnh</span>
              </div>
              <button
                onClick={openModalPost}
                className='flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-red-500/20 transition-all'
              >
                Đăng bài viết
              </button>
            </div>
          </div>

          {/* List Post */}
          <div className="space-y-6">
            {content}
            <div ref={ref}>
              {isFetchingNextPage ? (
                <Loading />
              ) : (
                <div className='flex justify-center font-medium py-4 text-gray-500 dark:text-gray-400'>Không còn bài viết</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Content - Mobile: trên feed, Desktop: bên phải sticky */}
        <div className='space-y-4 order-1 lg:order-2 lg:sticky lg:top-20 self-start'>
          {/* 🏆 Popular Challenges Section */}
          <PopularChallenges />

          {/* People You May Know */}
          {userData?.data?.result.length === 0 ? null : (
            <div className="w-full shadow-lg bg-white rounded-xl dark:bg-color-primary dark:border-none overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-pink-500 dark:from-red-800 dark:to-pink-700 py-2.5 px-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center">
                  <FaUsers className="mr-2 text-base" /> Gợi ý kết nối
                </h3>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                  {userData?.data?.result.length}
                </span>
              </div>
              {/* User list — hidden on mobile */}
              <div className="hidden lg:block p-3">
                <div className="space-y-1">
                  {userData?.data?.result.slice(0, 6).map((user) => (
                    <ItemUser key={user._id} user={user} />
                  ))}
                </div>
              </div>
              {/* Footer — always visible */}
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2.5">
                <button
                  onClick={() => navigate('/friends')}
                  className="w-full text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1"
                >
                  Xem thêm gợi ý <FaArrowRight className="text-[10px]" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      {modalPost && <ModalUploadPost profile={profile} closeModalPost={closeModalPost} initialContent={initialPostContent} />}
    </div>
  )
}

const checkTime = (profile) => {
  var day = new Date()
  var hr = day.getHours()
  const firstName = profile?.name?.split(' ')?.slice(-1)?.join('') || 'bạn'
  if (hr >= 0 && hr < 12) {
    return (
      <>
        <h2 className='text-xl font-medium text-green-700 dark:text-green-400'>
          <div className='flex gap-2 items-center'>
            {`Chào buổi sáng, ${firstName}`}
            <FaCloudSun className="text-yellow-500" />
          </div>
        </h2>
      </>
    )
  } else if (hr == 12) {
    return (
      <>
        <h2 className='text-xl font-medium text-green-700 dark:text-green-400'>
          <div className='flex gap-2 items-center '>
            {`Chúc bạn ăn trưa ngon miệng, ${firstName}`}
            <BsFillSunFill className="text-yellow-500" />
          </div>
        </h2>
      </>
    )
  } else if (hr >= 12 && hr <= 17) {
    return (
      <>
        <h2 className='text-xl font-medium text-green-700 dark:text-green-400'>
          <div className='flex gap-2 items-center'>
            {`Chúc bạn buổi chiều vui vẻ, ${firstName}`}
            <PiClockAfternoonFill className="text-orange-400" />
          </div>
        </h2>
      </>
    )
  } else {
    return (
      <>
        <h2 className='text-xl font-medium text-green-700 dark:text-green-400'>
          <div className='flex gap-2 items-center'>
            {`Chúc bạn buổi tối an lành, ${firstName}`}
            <MdNightlight className="text-blue-400" />
          </div>
        </h2>
      </>
    )
  }
}

const ItemUser = ({ user }) => {
  const navigate = useNavigate()
  const followMutation = useSafeMutation({
    mutationFn: (body) => followUser(body)
  })
  const handleFollow = () => {
    followMutation.mutate(
      { follow_id: user._id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['recommed-list-user'] })
        }
      }
    )
  }
  return (
    <div className="grid grid-cols-[auto,1fr,auto] gap-3 items-center p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      {/* Avatar - Cột 1 */}
      <div className="flex-shrink-0">
        <div className="rounded-full w-11 h-11 overflow-hidden ring-2 ring-offset-1 ring-gray-200 dark:ring-gray-700">
          <img
            className="object-cover w-full h-full"
            src={user.avatar === '' ? useravatar : getImageUrl(user.avatar)}
            alt={`Avatar của ${user.name}`}
          />
        </div>
      </div>

      {/* Thông tin user - Cột 2 */}
      <div className="min-w-0 overflow-hidden">
        <div
          onClick={() => navigate(`/user/${user._id}`)}
          className="font-semibold flex items-center gap-1.5 cursor-pointer hover:text-green-600 transition-colors truncate"
        >
          <span className="truncate">{user.name}</span>
          {user.role === 1 && (
            <div className="text-blue-500 rounded-full flex-shrink-0">
              <FaCheckCircle size={13} />
            </div>
          )}
        </div>
        <div className="truncate text-sm text-gray-500 dark:text-gray-400">
          @{user.user_name}
        </div>
      </div>

      {/* Nút kết bạn - Cột 3 */}
      <button
        onClick={handleFollow}
        disabled={followMutation.isPending}
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-md shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        <FaUserPlus size={11} />
        {followMutation.isPending ? '...' : 'Kết bạn'}
      </button>
    </div>
  )
}

// ── Sidebar: Popular Challenges ────────────────────────────────────────────
const CHALLENGE_TYPE_CFG = {
  nutrition: { icon: <FaUtensils size={9} />, label: 'Ăn uống', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', gradientClass: 'from-emerald-400 to-teal-500' },
  outdoor_activity: { icon: <FaRunning size={9} />, label: 'Ngoài trời', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', gradientClass: 'from-blue-400 to-cyan-500' },
  fitness: { icon: <FaDumbbell size={9} />, label: 'Thể dục', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', gradientClass: 'from-orange-400 to-amber-500' }
}

function PopularChallenges() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['popular-challenges-home'],
    queryFn: () => getChallenges({ limit: 5, page: 1 }),
    staleTime: 60_000
  })

  const joinMutation = useSafeMutation({
    mutationFn: (id) => joinChallenge(id),
    onSuccess: () => {
      toast.success('Đã tham gia thử thách! 🏆')
      queryClient.invalidateQueries({ queryKey: ['popular-challenges-home'] })
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Lỗi khi tham gia')
  })

  const allChallenges = data?.data?.result?.challenges || []
  const sorted = [...allChallenges].sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0)).slice(0, 5)

  if (isLoading) {
    return (
      <div className="w-full shadow-lg bg-white rounded-xl dark:bg-color-primary overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 px-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FaTrophy className="text-base" /> Thử Thách Nổi Bật
          </h3>
        </div>
        <div className="p-3 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-2 p-2">
              <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (sorted.length === 0) return null

  return (
    <div className="w-full shadow-lg bg-white rounded-xl dark:bg-color-primary dark:border-none overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 px-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FaTrophy className="text-base" /> Thử Thách Nổi Bật
        </h3>
        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
          {sorted.length}
        </span>
      </div>

      {/* Challenge mini-items */}
      <div className="p-3 space-y-0.5">
        {sorted.map((challenge) => {
          const cfg = CHALLENGE_TYPE_CFG[challenge.challenge_type] || CHALLENGE_TYPE_CFG.fitness
          const isExpired = new Date() > new Date(challenge.end_date)
          const isJoined = challenge.isJoined

          return (
            <div
              key={challenge._id}
              className="flex gap-2.5 items-center p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer group border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              onClick={() => navigate(`/challenge/${challenge._id}`)}
            >
              {/* Thumbnail */}
              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-sm">
                {challenge.image ? (
                  <img
                    src={getImageUrl(challenge.image)}
                    alt={challenge.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${cfg.gradientClass}`}>
                    <span className="text-lg opacity-70">{challenge.badge_emoji || '🏆'}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate group-hover:text-orange-500 transition-colors leading-tight">
                  {challenge.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cfg.badgeClass}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <FaUsers size={8} /> {challenge.participants_count || 0}
                  </span>
                  {!isExpired && (
                    <span className="text-[10px] text-emerald-500 flex items-center gap-0.5 font-medium">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  )}
                </div>
                {challenge.goal_value && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-0.5">
                    <FaFire size={8} className="text-amber-400" />
                    {challenge.goal_value} {challenge.goal_unit}/ngày
                  </p>
                )}
              </div>

              {/* Join / Joined / Expired button */}
              <div onClick={(e) => e.stopPropagation()}>
                {isJoined ? (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 font-semibold cursor-default whitespace-nowrap">
                    <MdCheckCircle size={11} /> Đã tham gia
                  </span>
                ) : isExpired ? (
                  <span className="text-[10px] px-2 py-1 rounded-md bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-default whitespace-nowrap">
                    Đã kết thúc
                  </span>
                ) : (
                  <button
                    onClick={() => joinMutation.mutate(challenge._id)}
                    disabled={joinMutation.isPending}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold transition disabled:opacity-50 whitespace-nowrap"
                  >
                    <FaPlus size={8} /> Tham gia
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer: link to all challenges */}
      <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2.5">
        <button
          onClick={() => navigate('/challenge')}
          className="w-full text-center text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-1"
        >
          Xem tất cả thử thách <FaArrowRight className="text-[10px]" />
        </button>
      </div>
    </div>
  )
}
