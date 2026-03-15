import { BiSolidPencil } from 'react-icons/bi'
import { BsFillCameraFill } from 'react-icons/bs'
import { FaCheckCircle } from 'react-icons/fa'
import { MdDashboard, MdArticle, MdSportsSoccer, MdFitnessCenter, MdFlag } from 'react-icons/md'
import { motion, AnimatePresence } from 'framer-motion'
import useravatar from '../../assets/images/useravatar.jpg'
import avatarbg from '../../assets/images/avatarbg.jpg'
import { useState, useEffect, lazy, Suspense } from 'react'
import { currentAccount } from '../../apis/userApi'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import ModalUpdateProfile from './components/ModalUpdateProfile'
import ModalUploadAvatar from './components/ModalUploadAvatar'
import ModalUploadCoverAvatar from './components/ModalUploadCoverAvatar'
import Loading from '../../components/GlobalComponents/Loading'

// Lazy load tab components
const MeOverview = lazy(() => import('./components/MeOverview/MeOverview'))
const MePost = lazy(() => import('./components/MePost/MePost'))
const MeSportEvents = lazy(() => import('./components/MeSportEvents/MeSportEvents'))
const MeWorkouts = lazy(() => import('./components/MeWorkouts/MeWorkouts'))
const MeChallenges = lazy(() => import('./components/MeChallenges/MeChallenges'))


const TABS = [
  { key: 'overview', label: 'Tổng quan', icon: MdDashboard },
  { key: 'posts', label: 'Bài viết', icon: MdArticle },
  { key: 'sports', label: 'Thể thao', icon: MdSportsSoccer },
  { key: 'workouts', label: 'Bài tập', icon: MdFitnessCenter },
  { key: 'challenges', label: 'Thử thách', icon: MdFlag }
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

export default function Me() {
  const [modalAvatar, setModalAvatar] = useState(false)
  const [modalCoverAvatar, setModalCoverAvatar] = useState(false)
  const [modalUpdateProfile, setModalUpdateProfile] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
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
    queryKey: ['me'],
    queryFn: () => currentAccount(),
    placeholderData: keepPreviousData,
    staleTime: 1000
  })

  const user = userData?.data?.result?.[0]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <MeOverview />
      case 'posts':
        return <MePost user={user} />
      case 'sports':
        return <MeSportEvents />
      case 'workouts':
        return <MeWorkouts />
      case 'challenges':
        return <MeChallenges />
      default:
        return <MeOverview />
    }
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
            src={user?.cover_avatar ? user.cover_avatar : avatarbg}
            className='w-full h-full object-cover filter brightness-[0.8]'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70' />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className='absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md p-2.5 rounded-full text-white transition-all duration-300 shadow-lg'
            onClick={() => setModalCoverAvatar(true)}
          >
            <BsFillCameraFill className='text-lg' />
          </motion.button>
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
                src={user?.avatar ? user.avatar : useravatar}
                alt='avatar'
              />
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className='absolute bottom-1 right-1 bg-white dark:bg-gray-800 p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg'
              onClick={() => setModalAvatar(true)}
            >
              <BsFillCameraFill className='text-sm' />
            </motion.button>
          </div>

          {/* User Info */}
          <motion.div variants={fadeInUp} className='flex-1 text-center md:text-left'>
            <div className='flex items-center gap-2 justify-center md:justify-start'>
              <h1 className='text-2xl font-bold'>{user?.name}</h1>
              {user?.role === 1 && (
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
            <div className='text-sm text-gray-300 mt-0.5'>@{user?.user_name}</div>

            {/* User Stats */}
            <motion.div
              variants={fadeInUp}
              className='flex items-center gap-5 mt-3 text-gray-200'
            >
              <div className='flex items-center gap-1.5'>
                <span className='text-lg font-bold text-white'>{user?.followers_count || 0}</span>
                <span className='text-xs opacity-80'>Theo dõi</span>
              </div>
              <div className='w-px h-5 bg-white/30' />
              <div className='flex items-center gap-1.5'>
                <span className='text-lg font-bold text-white'>{user?.followings_count || 0}</span>
                <span className='text-xs opacity-80'>Đang theo dõi</span>
              </div>
              <div className='w-px h-5 bg-white/30' />
              <div className='flex items-center gap-1.5'>
                <span className='text-lg font-bold text-white'>{user?.posts_count || 0}</span>
                <span className='text-xs opacity-80'>Bài đăng</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Nút chỉnh sửa đã ẩn */}
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
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 rounded-lg mx-0.5 ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className={`text-lg ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId='activeTab'
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

      {/* Modals */}
      {modalAvatar && <ModalUploadAvatar closeModalAvatar={() => setModalAvatar(false)} />}
      {modalCoverAvatar && <ModalUploadCoverAvatar closeModalCoverAvatar={() => setModalCoverAvatar(false)} />}
      {modalUpdateProfile && (
        <ModalUpdateProfile handleCloseModalUpdateProfile={() => setModalUpdateProfile(false)} user={user} />
      )}
    </motion.div>
  )
}
