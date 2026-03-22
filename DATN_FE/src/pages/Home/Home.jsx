import { useSafeMutation } from '../../hooks/useSafeMutation'
import { BsFillImageFill, BsFillSunFill } from 'react-icons/bs'
import useravatar from '../../assets/images/useravatar.jpg'
import { MdNightlight } from 'react-icons/md'
import { FaCheckCircle, FaCloudSun, FaUsers, FaHeartbeat, FaUtensils, FaRunning, FaUserPlus, FaArrowRight } from 'react-icons/fa'
import { PiClockAfternoonFill } from 'react-icons/pi'
import PostCard from '../../components/CardComponents/PostCard'
import { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ModalUploadPost from './components/ModalUploadPost'
import { getNewsFeed } from '../../apis/postApi'
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
                  src={profile?.avatar && profile.avatar !== '' ? profile.avatar : useravatar}
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
          queryClient.invalidateQueries('recommed-list-user')
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
            src={user.avatar === '' ? useravatar : user.avatar}
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
