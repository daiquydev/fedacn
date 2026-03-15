import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// * React icons
import { FaUtensils, FaCalendarAlt, FaUserFriends, FaChartPie, FaTrophy, FaDumbbell, FaCalculator } from 'react-icons/fa'
import { BsPeopleFill } from 'react-icons/bs'
import { useMediaQuery } from 'react-responsive'
import { MdMenu, MdClose, MdOutlineSpaceDashboard, MdSportsSoccer } from 'react-icons/md'
import { NavLink, useLocation } from 'react-router-dom'
import Submenu from './SubMenu'
import { FaPenToSquare } from 'react-icons/fa6'
import Logo from '../Logo'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { currentAccount, updateRequest } from '../../../apis/userApi'
import ModalRequest from '../../../pages/Me/components/ModalRequest'
import toast from 'react-hot-toast'

export default function SideBar() {
  const isMobile = useMediaQuery({ query: '(max-width: 1023px)' })
  const [open, setOpen] = useState(false)
  const [openModalRequest, setOpenModalRequest] = useState(false)
  const sidebarRef = useRef()
  const { pathname } = useLocation()

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => {
      return currentAccount()
    },
    placeholderData: keepPreviousData,
    staleTime: 1000
  })

  const [openMenus, setOpenMenus] = useState({})

  const checkSubmenu = () => Number(userData?.data.result[0]?.role) === 1
  const isAdmin = Number(userData?.data.result[0]?.role) === 2
  const updateRequestMutation = useMutation({
    mutationFn: (body) => updateRequest(body)
  })

  const onSubmitRequest = () => {
    updateRequestMutation.mutate(
      {},
      {
        onSuccess: (data) => {
          console.log(data)
          toast.success('Yêu cầu nâng cấp lên đầu bếp thành công, hãy đợi email phản hồi từ chúng tôi')
        },
        onError: (error) => {
          console.log(error)
          toast.error('Yêu cầu nâng cấp tài khoản thất bại')
        }
      }
    )
  }

  const handleOpenModalRequest = () => {
    setOpenModalRequest(true)
  }

  const handleCloseModalRequest = () => {
    setOpenModalRequest(false)
  }

  // Close mobile drawer when navigating
  useEffect(() => {
    if (isMobile) {
      setOpen(false)
    }
  }, [pathname, isMobile])

  const subMenusList = checkSubmenu()
    ? [
      {
        name: 'Tạo nội dung',
        icon: FaPenToSquare,
        menus: [
          { subName: 'Tạo món ăn', subPath: 'create-recipe' },
          { subName: 'Quản lý món ăn', subPath: 'recipe-list' },
          { subName: 'Tạo album món ăn', subPath: 'album-list' },
          { subName: 'Tạo blog dinh dưỡng', subPath: 'blog-list' }
        ],
        path: 'chef'
      }
    ]
    : []

  const navItems = (
    <ul className='whitespace-pre px-2.5 pt-4 pb-4 flex flex-col gap-1.5 font-medium overflow-y-auto overflow-x-hidden scrollbar-thin flex-1'>
      <li>
        <NavLink to={'/home'} className='link-custom' onClick={() => isMobile && setOpen(false)}>
          <BsPeopleFill size={22} className='min-w-max' />
          Cộng đồng
        </NavLink>
      </li>
      <li>
        <NavLink to={'/friends'} className='link-custom' onClick={() => isMobile && setOpen(false)}>
          <FaUserFriends size={22} className='min-w-max' />
          Bạn bè
        </NavLink>
      </li>
      {isAdmin && (
        <li>
          <NavLink to={'/admin'} className='link-custom' onClick={() => isMobile && setOpen(false)}>
            <MdOutlineSpaceDashboard size={22} className='min-w-max' />
            Trang quản trị
          </NavLink>
        </li>
      )}
      <li>
        <NavLink to={'/user-calendar'} className='link-custom' onClick={() => isMobile && setOpen(false)}>
          <FaCalendarAlt size={22} className='min-w-max' />
          Lịch Cá Nhân
        </NavLink>
      </li>
      <li>
        <NavLink to={'/fitness/fitness-calculator'} className='link-custom' onClick={() => isMobile && setOpen(false)}>
          <FaCalculator size={22} className='min-w-max' />
          Công cụ tính toán
        </NavLink>
      </li>
      <li>
        <NavLink to={'/sport-event'} end className='link-custom' onClick={() => isMobile && setOpen(false)}>
          <MdSportsSoccer size={22} className='min-w-max' />
          Sự kiện thể thao
        </NavLink>
      </li>
      <li>
        <NavLink to={'/challenge'} end className='link-custom' onClick={() => isMobile && setOpen(false)}>
          <FaDumbbell size={22} className='min-w-max' />
          Tập luyện
        </NavLink>
      </li>
      <li>
        <NavLink to={'/habit-challenge'} end className='link-custom' onClick={() => isMobile && setOpen(false)}>
          <FaTrophy size={22} className='min-w-max' />
          Thử thách
        </NavLink>
      </li>
      {subMenusList.length > 0 && (
        <div className='border-y py-3 border-slate-300 dark:border-slate-700'>
          <small className='pl-3 text-slate-500 dark:text-slate-400 font-medium inline-block mb-2'>
            Người dùng
          </small>
          <div className='flex flex-col'>
            {subMenusList?.map((menu) => (
              <div key={menu.name} className='mb-1 last:mb-0'>
                <Submenu
                  data={menu}
                  isOpen={openMenus[menu.name]}
                  onToggle={() => {
                    setOpenMenus((prev) => ({
                      ...prev,
                      [menu.name]: !prev[menu.name]
                    }))
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </ul>
  )

  // ===================== DESKTOP SIDEBAR =====================
  if (!isMobile) {
    return (
      <>
        <aside className='fixed top-14 left-0 bottom-0 w-60 bg-white dark:bg-color-primary-dark dark:text-gray-300 
          shadow-sm dark:shadow-green-900/30 z-40 flex flex-col overflow-hidden'>
          <Logo />
          {navItems}
        </aside>
        {openModalRequest && (
          <ModalRequest handleCloseModalRequest={handleCloseModalRequest} updateRequest={updateRequestMutation} />
        )}
      </>
    )
  }

  // ===================== MOBILE SIDEBAR (Drawer) =====================
  return (
    <>
      {/* Hamburger button - fixed position on mobile */}
      <button
        className='fixed top-3.5 left-3 z-[60] p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-md 
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden'
        onClick={() => setOpen(true)}
        aria-label='Mở menu'
      >
        <MdMenu size={22} />
      </button>

      {/* Overlay + Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='fixed inset-0 bg-black/50 z-[70] lg:hidden'
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              ref={sidebarRef}
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className='fixed top-0 left-0 bottom-0 w-[17rem] bg-white dark:bg-color-primary-dark dark:text-gray-300 
                shadow-xl z-[80] flex flex-col overflow-hidden'
            >
              {/* Drawer header */}
              <div className='flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700'>
                <Logo />
                <button
                  onClick={() => setOpen(false)}
                  className='p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                  aria-label='Đóng menu'
                >
                  <MdClose size={20} />
                </button>
              </div>
              {navItems}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {openModalRequest && (
        <ModalRequest handleCloseModalRequest={handleCloseModalRequest} updateRequest={updateRequestMutation} />
      )}
    </>
  )
}
