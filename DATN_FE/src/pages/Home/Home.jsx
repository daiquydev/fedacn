import { BsFillImageFill, BsFillSunFill } from 'react-icons/bs'
import useravatar from '../../assets/images/useravatar.jpg'
import { MdNightlight } from 'react-icons/md'
import { FaCheckCircle, FaCloudSun, FaUsers, FaHeartbeat, FaUtensils, FaRunning, FaArrowRight } from 'react-icons/fa'
import { PiClockAfternoonFill } from 'react-icons/pi'
import PostCard from '../../components/CardComponents/PostCard'
import BlogCard from '../../components/CardComponents/BlogCard'
import { useContext, useEffect, useState } from 'react'
import ModalUploadPost from './components/ModalUploadPost'
import { getNewsFeed } from '../../apis/postApi'
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import LoadingHome from './components/LoadingHome'
import { AppContext } from '../../contexts/app.context'
import Loading from '../../components/GlobalComponents/Loading'
import { getBlogsForUser } from '../../apis/blogApi'
import { followUser, recommendUser } from '../../apis/userApi'
import { queryClient } from '../../main'
import { useNavigate, Link } from 'react-router-dom'
import { MdBook, MdClose } from 'react-icons/md'
import { UserDashboard } from '../../components/Dashboard'

export default function Home() {
  const { profile } = useContext(AppContext)
  const [modalPost, setModalPost] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const navigate = useNavigate()

  const openModalPost = () => {
    setModalPost(true)
  }

  const closeModalPost = () => {
    setModalPost(false)
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
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10
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

  const { data: blogData } = useQuery({
    queryKey: ['blogs-list-user', { limit: 4 }],
    queryFn: () => {
      return getBlogsForUser({ limit: 4 })
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10
  })

  const { data: userData } = useQuery({
    queryKey: ['recommed-list-user'],
    queryFn: () => {
      return recommendUser()
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10
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
    <div className='space-y-8 w-full'>
      {/* Dashboard section - Đặt ở trên cùng, toàn màn hình */}
      <div className='w-full'>
        <UserDashboard />
      </div>

      {/* Main content grid */}
      <div className='grid gap-6 lg:grid-cols-[minmax(0,2.4fr),minmax(280px,1fr)]'>
        {/* Main column - tăng kích thước lên */}
        <div className='space-y-5'>
          {/* Create Post Card */}
          <div className="bg-white py-4 px-6 shadow-md rounded-xl dark:bg-color-primary mb-6">
            <div>{checkTime(profile)}</div>
            <div className='flex justify-between items-center gap-2 md:gap-4 w-full mt-4'>
              <div className='w-10 h-10 md:w-12 overflow-hidden md:h-12 rounded-full cursor-pointer'>
                <img
                  className='w-10 h-10 md:w-12 object-cover md:h-12 rounded-full'
                  src={profile.avatar === '' ? useravatar : profile.avatar}
                  alt='user photo'
                />
              </div>
              <div
                onClick={openModalPost}
                className='bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-800 w-[90%] md:w-[92%] cursor-pointer hover:bg-slate-200 transition-all h-12 md:h-14 my-4 flex items-center rounded-full'
              >
                <span className='mx-4 text-gray-500 dark:text-gray-400'>Bạn đang nghĩ gì về sức khỏe và dinh dưỡng?</span>
              </div>
            </div>
            <div className='border-t pt-4 mt-2 dark:border-gray-700 border-gray-200'></div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div onClick={openModalPost} className='flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 py-2 px-3 rounded-lg transition-all'>
                  <BsFillImageFill className='text-2xl text-blue-600 dark:text-blue-400' />
                  <span className='font-medium text-gray-700 dark:text-gray-300'>Hình ảnh</span>
                </div>
              </div>
              <button
                onClick={openModalPost}
                className='px-4 py-2 bg-red-700 hover:bg-red-800 text-sm text-white rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out'
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

        {/* Sidebar Content - không bao gồm Dashboard nữa */}
        <div className='space-y-6'>
          {/* People You May Know - TỐI ƯU */}
          {userData?.data?.result.length === 0 ? null : (
            <div className="w-full shadow-lg bg-white rounded-xl dark:bg-color-primary dark:border-none overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-pink-500 dark:from-red-800 dark:to-pink-700 py-3.5 px-5">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <FaUsers className="mr-2 text-xl" /> Gợi ý kết nối
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {userData?.data?.result.map((user) => (
                    <ItemUser key={user._id} user={user} />
                  ))}
                </div>
                {userData?.data?.result.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                    <Link 
                      to="/search?tab=people"
                      className="flex justify-center items-center text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      Xem thêm gợi ý <FaArrowRight className="ml-1 w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Latest Blogs */}
          <div className="w-full shadow-md bg-white rounded-xl dark:bg-color-primary dark:border-none overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-green-600 dark:from-green-800 dark:to-green-700 py-3 px-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <MdBook className="mr-2" /> Blog mới nhất
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {blogData?.data?.result.blogs.map((blog) => {
                return (
                  <BlogCard
                    key={blog._id}
                    blogItem={blog}
                    imgClass='w-full max-h-[20rem] object-cover rounded-t-xl scale-100 overflow-hidden'
                    dateClass='flex text-xs items-center gap-4 pt-2 pb-1'
                    titleClass='font-bold transition-all cursor-pointer line-clamp-2 hover:text-green-600'
                    descriptionClass='leading-relaxed text-sm line-clamp-2 mt-2 mb-3'
                    linkClass='inline-block font-bold hover:text-green-600 transition-all duration-300 ease-in-out'
                  />
                )
              })}
              <Link
                to={`/blog`}
                className='w-full flex justify-center text-center py-2 font-medium dark:text-gray-300 text-gray-600 hover:text-green-600 cursor-pointer transition-all duration-300'
              >
                Xem thêm bài viết...
              </Link>
            </div>
          </div>
        </div>
      </div>
      {modalPost && <ModalUploadPost profile={profile} closeModalPost={closeModalPost} />}
    </div>
  )
}

const checkTime = (profile) => {
  var day = new Date()
  var hr = day.getHours()
  if (hr >= 0 && hr < 12) {
    return (
      <>
        <h2 className='text-xl font-medium text-green-700 dark:text-green-400'>
          <div className='flex gap-2 items-center'>
            {`Chào buổi sáng, ${profile.name.split(' ').slice(-1).join('')}`}
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
            {`Chúc bạn ăn trưa ngon miệng, ${profile.name.split(' ').slice(-1).join('')}`}
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
            {`Chúc bạn buổi chiều vui vẻ, ${profile.name.split(' ').slice(-1).join('')}`}
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
            {`Chúc bạn buổi tối an lành, ${profile.name.split(' ').slice(-1).join('')}`}
            <MdNightlight className="text-blue-400" />
          </div>
        </h2>
      </>
    )
  }
}

const ItemUser = ({ user }) => {
  const navigate = useNavigate()
  const followMutation = useMutation({
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
      
      {/* Nút theo dõi - Cột 3 */}
      <button 
        onClick={handleFollow} 
        className="w-20 h-8 flex-shrink-0 flex items-center justify-center text-xs font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-md shadow-sm hover:shadow transition-all"
      >
        Theo dõi
      </button>
    </div>
  )
}
