import useravatar from '../../assets/images/useravatar.jpg'
import avatarbg from '../../assets/images/avatarbg.jpg'
import { useContext, useMemo, useState } from 'react'
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import TabsProfile from '../../components/GlobalComponents/TabsProfile'
import UserPost from './components/UserPost'
import { useParams } from 'react-router-dom'
import { followUser, getProfile, unfollowUser } from '../../apis/userApi'
import { queryClient } from '../../main'
import { FaCheckCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { navBarsProfileChef, navBarsProfileUser } from '../../constants/objectUi'
import UserBlog from './components/UserBlog'
import UserAlbum from './components/UserAlbum'
import UserRecipe from './components/UserRecipe'
import { AppContext } from '../../contexts/app.context'
import { SocketContext } from '../../contexts/socket.context'

export default function UserProfile() {
  const { id } = useParams()
  const { profile } = useContext(AppContext)
  const { newSocket } = useContext(SocketContext)
  const [toggleState, setToggleState] = useState(0)
  const toggleTab = (index) => {
    setToggleState(index)
  }

  const getActiveClass = (index, className) => (toggleState === index ? className : '')

  const { data: userData } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => {
      return getProfile(id)
    },
    placeholderData: keepPreviousData,
    staleTime: 1000
  })
  const profileOwner = useMemo(() => userData?.data?.result?.[0], [userData])
  const isFollowing = Boolean(profileOwner?.is_following)
  const isSelf = profile?.user_id === id

  // Kiểm tra người kia có follow lại mình không (để biết là "bạn bè" hay "đã gửi lời mời")
  const isMutual = useMemo(() => {
    if (!profileOwner || !profile) return false
    // profileOwner.followers là danh sách người follow họ, check xem mình có trong đó không
    const theirFollowers = profileOwner?.followers || []
    return theirFollowers.some((f) => String(f._id) === String(profile?.user_id))
  }, [profileOwner, profile])

  const followMutation = useMutation({
    mutationFn: (body) => followUser(body)
  })

  const unfollowMutation = useMutation({
    mutationFn: (body) => unfollowUser(body)
  })
  const handleFollow = () => {
    if (profileOwner?.is_following) {
      unfollowMutation.mutate(
        { follow_id: id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['user-profile']
            })
            toast.success('Đã hủy kết bạn')
          }
        }
      )
    } else {
      followMutation.mutate(
        { follow_id: id },
        {
          onSuccess: () => {
            newSocket.emit('follow', {
              content: isMutual ? 'Đã chấp nhận lời mời kết bạn' : 'Đã gửi lời mời kết bạn với bạn',
              to: id,
              name: profile.name,
              avatar: profile.avatar
            })
            queryClient.invalidateQueries({
              queryKey: ['user-profile']
            })
            toast.success(isMutual ? 'Đã trở thành bạn bè!' : 'Đã gửi lời mời kết bạn')
          }
        }
      )
    }
  }
  return (
    <div>
      <div className='h-full rounded-lg text-gray-900 dark:text-white'>
        <div className='w-full'>
          <div className='w-full h-[18rem]'>
            <div className='relative'>
              <img
                alt='avatar bg'
                src={userData?.data.result[0].cover_avatar ? userData?.data.result[0].cover_avatar : avatarbg}
                className='w-full shadow-md rounded-lg h-[18rem] relative object-cover'
              />
              <div className='px-2 w-full md:flex md:flex-row gap-2 top-60 pb-5 absolute'>
                <img
                  className='h-40 w-40 ml-2 border border-red-200 rounded-full  object-cover relative'
                  src={userData?.data.result[0].avatar ? userData?.data.result[0].avatar : useravatar}
                  alt='avatar'
                />

                <div className='w-full lg:flex mr-10 mb-8 items-end justify-between '>
                  <div className='md:mt-16 flex-col flex justify-end'>
                    <div className='px-2'>
                      <div className='text-3xl flex items-center gap-2 whitespace-nowrap text-gray-800 dark:text-white font-semibold'>
                        {profileOwner?.name}
                        {profileOwner?.role === 1 && (
                          <div className='text-blue-400 rounded-full flex justify-center items-center '>
                            <FaCheckCircle size={20} />
                          </div>
                        )}
                      </div>
                      <div className='text-lg whitespace-nowrap text-gray-600 dark:text-gray-400'>
                        @{profileOwner?.user_name}
                      </div>
                    </div>

                    <div className='py-4 flex divide-x divide-gray-400 divide-solid'>
                      <span className='text-center px-2'>
                        <span className='font-bold text-red-700'>{profileOwner?.followers_count}</span>
                        <span className='text-gray-600 dark:text-white'> Người theo dõi</span>
                      </span>
                      <span className='text-center px-2'>
                        <span className='font-bold text-red-700'>{profileOwner?.posts_count}</span>
                        <span className='text-gray-600 dark:text-white'> Bài đăng</span>
                      </span>
                    </div>
                  </div>
                  <div className='flex justify-between items-center'>
                    {!isSelf && (
                      <div onClick={handleFollow}>
                        {!isFollowing ? (
                          <button className='block btn btn-xs  md:inline-block md:w-auto  bg-red-800 hover:bg-red-700 text-white rounded-lg font-semibold text-sm  md:order-2'>
                            <div className='flex text-xs justify-center gap-1 items-center'>+ Kết bạn</div>
                          </button>
                        ) : isMutual ? (
                          <button className='block btn btn-xs  md:inline-block md:w-auto  bg-emerald-600 hover:bg-emerald-700 border-none text-white rounded-lg font-semibold text-sm  md:order-2'>
                            <div className='flex text-xs justify-center gap-1 items-center'>
                              <FaCheckCircle /> <div>Bạn bè</div>
                            </div>
                          </button>
                        ) : (
                          <button className='block btn btn-xs  md:inline-block md:w-auto  bg-blue-400 hover:bg-blue-500 border-none text-white rounded-lg font-semibold text-sm  md:order-2'>
                            <div className='flex text-xs justify-center gap-1 items-center'>
                              <FaCheckCircle /> <div>Đã gửi lời mời</div>
                            </div>
                          </button>
                        )}
                      </div>
                    )}

                    {/* <div className='px-3 text-2xl hover:text-red-600 cursor-pointer transition-all duration-300'>
                      <ThreeDots />
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='mt-[20rem] md:mt-64 lg:mt-48 dark:shadow-sm shadow-md dark:shadow-red-600 py-3 px-4'>
          {/* <NavBarProfile /> */}
          <TabsProfile
            toggleTab={toggleTab}
            getActiveClass={getActiveClass}
            navBarsProfile={userData?.data.result[0].role === 0 ? navBarsProfileUser : navBarsProfileChef}
          />
        </div>
        {/* {toggleState === 0 && <UserPost user_id={id} user={userData?.data.result[0]} />}
        {toggleState === 1 && <div>Tab 2</div>}
        {toggleState === 2 && <div>Tab 3</div>} */}
        {profileOwner?.role === 0 ? (
          <>{toggleState === 0 && <UserPost user_id={id} user={profileOwner} isFollowing={isSelf || isFollowing} />}</>
        ) : (
          <>
            {toggleState === 0 && <UserPost user_id={id} user={profileOwner} isFollowing={isSelf || isFollowing} />}
            {toggleState === 1 && <UserRecipe user_id={id} />}
            {toggleState === 2 && <UserAlbum user_id={id} />}
            {toggleState === 3 && <UserBlog user_id={id} />}
          </>
        )}
      </div>
    </div>
  )
}
