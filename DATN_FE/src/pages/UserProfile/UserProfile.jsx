import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useContext, useMemo, useState, useEffect, lazy, Suspense } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCheckCircle, FaUserPlus, FaUserCheck } from 'react-icons/fa'
import { MdArticle, MdSportsSoccer, MdFitnessCenter } from 'react-icons/md'
import { HiClock } from 'react-icons/hi'
import toast from 'react-hot-toast'

import useravatar from '../../assets/images/useravatar.jpg'
import avatarbg from '../../assets/images/avatarbg.jpg'
import { getImageUrl } from '../../utils/imageUrl'
import { followUser, getProfile, unfollowUser } from '../../apis/userApi'
import { queryClient } from '../../main'
import { AppContext } from '../../contexts/app.context'
import { SocketContext } from '../../contexts/socket.context'
import Loading from '../../components/GlobalComponents/Loading'

// Lazy load tab components
const UserPost = lazy(() => import('./components/UserPost/UserPost'))
const MeSportEvents = lazy(() => import('../Me/components/MeSportEvents/MeSportEvents'))
const MeWorkouts = lazy(() => import('../Me/components/MeWorkouts/MeWorkouts'))


const TABS = [
  { key: 'posts', label: 'Bài viết', icon: MdArticle },
  { key: 'sports', label: 'Thể thao', icon: MdSportsSoccer },
  { key: 'workouts', label: 'Bài tập', icon: MdFitnessCenter }
]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

export default function UserProfile() {
  const { id } = useParams()
  const { profile } = useContext(AppContext)
  const { newSocket } = useContext(SocketContext)
  const [activeTab, setActiveTab] = useState('posts')
  const [scrollPosition, setScrollPosition] = useState(0)

  const handleScroll = () => {
    const position = window.scrollY
    setScrollPosition(position)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const { data: userData } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => getProfile(id),
    placeholderData: keepPreviousData
  })

  const profileOwner = useMemo(() => userData?.data?.result?.[0], [userData])
  const isFollowing = Boolean(profileOwner?.is_following)
  const isSelf = profile?.user_id === id

  const isMutual = useMemo(() => {
    if (!profileOwner || !profile) return false
    const theirFollowers = profileOwner?.followers || []
    return theirFollowers.some((f) => String(f._id) === String(profile?.user_id))
  }, [profileOwner, profile])

  const followMutation = useSafeMutation({
    mutationFn: (body) => followUser(body)
  })

  const unfollowMutation = useSafeMutation({
    mutationFn: (body) => unfollowUser(body)
  })

  const handleFollow = () => {
    if (profileOwner?.is_following) {
      unfollowMutation.mutate(
        { follow_id: id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] })
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
            queryClient.invalidateQueries({ queryKey: ['user-profile'] })
            toast.success(isMutual ? 'Đã trở thành bạn bè!' : 'Đã gửi lời mời kết bạn')
          }
        }
      )
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return <UserPost user_id={id} user={profileOwner} isFollowing={isSelf || isFollowing} />
      case 'sports':
        return <MeSportEvents />
      case 'workouts':
        return <MeWorkouts isOwner={false} />
      default:
        return <UserPost user_id={id} user={profileOwner} isFollowing={isSelf || isFollowing} />
    }
  }

  const renderFollowButton = () => {
    if (isSelf) return null

    if (!isFollowing) {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFollow}
          className='flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full font-semibold text-sm transition-all duration-300 shadow-lg border border-white/20'
        >
          <FaUserPlus className='text-sm' />
          <span>Kết bạn</span>
        </motion.button>
      )
    }

    if (isMutual) {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFollow}
          className='flex items-center gap-1.5 px-4 py-2 bg-emerald-500/80 hover:bg-emerald-600/80 backdrop-blur-md text-white rounded-full font-semibold text-sm transition-all duration-300 shadow-lg border border-emerald-400/30'
        >
          <FaUserCheck className='text-sm' />
          <span>Bạn bè</span>
        </motion.button>
      )
    }

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleFollow}
        className='flex items-center gap-1.5 px-4 py-2 bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-md text-white rounded-full font-semibold text-sm transition-all duration-300 shadow-lg border border-blue-400/30'
      >
        <HiClock className='text-sm' />
        <span>Đã gửi lời mời</span>
      </motion.button>
    )
  }

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={staggerContainer}
      className='min-h-screen bg-gray-50 dark:bg-gray-900'
    >
      {/* Profile Header */}
      <div className='relative'>
        {/* Cover Image with Parallax Effect */}
        <div
          className='w-full h-[26rem] overflow-hidden relative'
          style={{ transform: `translateY(${scrollPosition * 0.15}px)` }}
        >
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            alt='cover background'
            src={profileOwner?.cover_avatar ? getImageUrl(profileOwner.cover_avatar) : avatarbg}
            className='w-full h-full object-cover filter brightness-[0.8]'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70' />
        </div>

        {/* Profile Info Section */}
        <motion.div
          variants={fadeInUp}
          className='absolute bottom-0 left-0 right-0 px-6 py-8 flex flex-col md:flex-row items-center md:items-end gap-5 text-white'
        >
          {/* Profile Image */}
          <div className='relative -mt-16'>
            <motion.div
              initial={{ scale: 0, borderRadius: '50%' }}
              animate={{ scale: 1, borderRadius: '50%' }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='h-36 w-36 rounded-full border-4 border-white/90 dark:border-gray-800 overflow-hidden shadow-2xl'
            >
              <img
                className='h-full w-full object-cover'
                src={profileOwner?.avatar ? getImageUrl(profileOwner.avatar) : useravatar}
                alt='avatar'
              />
            </motion.div>
          </div>

          {/* User Info */}
          <motion.div variants={fadeInUp} className='flex-1 text-center md:text-left'>
            <div className='flex items-center gap-2 justify-center md:justify-start'>
              <h1 className='text-2xl font-bold'>{profileOwner?.name}</h1>
              {profileOwner?.role === 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
                  className='text-blue-400'
                >
                  <FaCheckCircle size={18} />
                </motion.div>
              )}
            </div>
            <div className='text-sm text-gray-300 mt-0.5'>@{profileOwner?.user_name}</div>

            {/* User Stats */}
            <motion.div
              variants={fadeInUp}
              className='flex items-center gap-5 mt-3 text-gray-200'
            >
              <div className='flex items-center gap-1.5'>
                <span className='text-lg font-bold text-white'>{profileOwner?.followers_count || 0}</span>
                <span className='text-xs opacity-80'>Theo dõi</span>
              </div>
              <div className='w-px h-5 bg-white/30' />
              <div className='flex items-center gap-1.5'>
                <span className='text-lg font-bold text-white'>{profileOwner?.followings_count || 0}</span>
                <span className='text-xs opacity-80'>Đang theo dõi</span>
              </div>
              <div className='w-px h-5 bg-white/30' />
              <div className='flex items-center gap-1.5'>
                <span className='text-lg font-bold text-white'>{profileOwner?.posts_count || 0}</span>
                <span className='text-xs opacity-80'>Bài đăng</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Follow Button */}
          <motion.div variants={fadeInUp} className='flex-shrink-0'>
            {renderFollowButton()}
          </motion.div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className='sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm'>
        <div className='max-w-7xl mx-auto px-4'>
          <div className='flex items-center gap-1 overflow-x-auto scrollbar-none py-1'>
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 rounded-lg mx-0.5 ${isActive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <Icon className={`text-lg ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId='userActiveTab'
                      className='absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full'
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<Loading className='flex justify-center py-20' />}>
              {renderTabContent()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
