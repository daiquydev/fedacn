import { BiSolidPencil } from 'react-icons/bi'
import { BsFillCameraFill } from 'react-icons/bs'
import { FaHeartbeat, FaCheckCircle, FaRegEdit } from 'react-icons/fa'
import { motion } from 'framer-motion'
import useravatar from '../../assets/images/useravatar.jpg'
import avatarbg from '../../assets/images/avatarbg.jpg'
import { useState, useEffect } from 'react'
import { currentAccount } from '../../apis/userApi'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import ThreeDots from './components/ThreeDots'
import ModalUpdateProfile from './components/ModalUpdateProfile'
import ModalUploadAvatar from './components/ModalUploadAvatar'
import ModalUploadCoverAvatar from './components/ModalUploadCoverAvatar'
import HealthProfile from './components/HealthProfile/HealthProfile'

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
    transition: {
      staggerChildren: 0.2
    }
  }
}

export default function Me() {
  const [modalAvatar, setModalAvatar] = useState(false)
  const [modalCoverAvatar, setModalCoverAvatar] = useState(false)
  const [modalUpdateProfile, setModalUpdateProfile] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  
  const handleScroll = () => {
    const position = window.scrollY
    setScrollPosition(position)
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const openModalAvatar = () => {
    setModalAvatar(true)
  }

  const closeModalAvatar = () => {
    setModalAvatar(false)
  }

  const openModalCoverAvatar = () => {
    setModalCoverAvatar(true)
  }

  const closeModalCoverAvatar = () => {
    setModalCoverAvatar(false)
  }

  const openModalUpdateProfile = () => {
    setModalUpdateProfile(true)
  }

  const closeModalUpdateProfile = () => {
    setModalUpdateProfile(false)
  }
  
  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => {
      return currentAccount()
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5
  })
  
  const user = userData?.data?.result?.[0]

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={staggerContainer}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Profile Header */}
      <div className='relative'>
        {/* Cover Image with Parallax Effect */}
        <div 
          className='w-full h-[28rem] overflow-hidden relative'
          style={{ 
            transform: `translateY(${scrollPosition * 0.2}px)` 
          }}
        >
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            alt='cover background'
            src={user?.cover_avatar ? user.cover_avatar : avatarbg}
            className='w-full h-full object-cover filter brightness-[0.85]'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-transparent to-black/70'></div>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className='absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full text-white transition-all duration-300'
            onClick={openModalCoverAvatar}
          >
            <BsFillCameraFill className="text-xl" />
          </motion.button>
        </div>
        
        {/* Profile Info Section */}
        <motion.div 
          variants={fadeInUp}
          className='absolute bottom-0 left-0 right-0 px-6 py-8 flex flex-col md:flex-row items-center md:items-end gap-6 text-white'
        >
          {/* Profile Image */}
          <div className='relative -mt-20'>
            <motion.div
              initial={{ scale: 0, borderRadius: "50%" }}
              animate={{ scale: 1, borderRadius: "50%" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='h-40 w-40 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden shadow-xl'
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
              className='absolute bottom-2 right-2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-full text-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-md'
              onClick={openModalAvatar}
            >
              <BsFillCameraFill />
            </motion.button>
          </div>
          
          {/* User Info */}
          <motion.div 
            variants={fadeInUp} 
            className='flex-1 text-center md:text-left'
          >
            <div className='flex items-center gap-2 justify-center md:justify-start'>
              <h1 className='text-3xl font-bold'>{user?.name}</h1>
              {user?.role === 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
                  className='text-blue-400'
                >
                  <FaCheckCircle size={22} />
                </motion.div>
              )}
            </div>
            <div className='text-lg text-gray-300 mt-1'>@{user?.user_name}</div>
            
            {/* User Stats */}
            <motion.div 
              variants={fadeInUp}
              className='flex items-center gap-6 mt-4 text-gray-200'
            >
              <div className='flex flex-col items-center md:items-start'>
                <span className='text-2xl font-bold text-white'>{user?.followers_count || 0}</span>
                <span className='text-sm'>Người theo dõi</span>
              </div>
              <div className='w-px h-10 bg-gray-400/50'></div>
              <div className='flex flex-col items-center md:items-start'>
                <span className='text-2xl font-bold text-white'>{user?.posts_count || 0}</span>
                <span className='text-sm'>Bài đăng</span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Action Buttons */}
          <motion.div 
            variants={fadeInUp}
            className='flex items-center gap-3'
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openModalUpdateProfile}
              className='px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 text-white font-medium transition-all duration-300'
            >
              <BiSolidPencil />
              <span>Chỉnh sửa</span>
            </motion.button>
            
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className='p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm cursor-pointer'
            >
              <ThreeDots user={user} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className='bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8'
        >
          <div className='p-6 flex items-center gap-4 border-b border-gray-200 dark:border-gray-700'>
            <div className='p-3 bg-red-50 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400'>
              <FaHeartbeat className='text-xl' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>Hồ sơ Sức khỏe Của Tôi</h2>
              <p className='text-gray-600 dark:text-gray-400'>
                Quản lý thông tin sức khỏe và nhận đề xuất phù hợp
              </p>
            </div>
          </div>
          
          <HealthProfile />
        </motion.div>
      </div>
      
      {/* Modals */}
      {modalAvatar && <ModalUploadAvatar closeModalAvatar={closeModalAvatar} />}
      {modalCoverAvatar && <ModalUploadCoverAvatar closeModalCoverAvatar={closeModalCoverAvatar} />}
      {modalUpdateProfile && (
        <ModalUpdateProfile handleCloseModalUpdateProfile={closeModalUpdateProfile} user={user} />
      )}
    </motion.div>
  )
}
