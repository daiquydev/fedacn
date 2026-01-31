import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
// * React icons
import { FaUtensils, FaCalendarAlt, FaUserFriends, FaChartPie, FaTrophy } from 'react-icons/fa'
import { BsPeopleFill } from 'react-icons/bs'
import { useMediaQuery } from 'react-responsive'
import { MdMenu, MdOutlineSpaceDashboard, MdSportsSoccer } from 'react-icons/md'
import { NavLink, useLocation } from 'react-router-dom'
import Submenu from './SubMenu'
import { FaPenToSquare } from 'react-icons/fa6'
import Logo from '../Logo'
// import { AppContext } from '../../../contexts/app.context'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { currentAccount, updateRequest } from '../../../apis/userApi'
import ModalRequest from '../../../pages/Me/components/ModalRequest'
import toast from 'react-hot-toast'

export default function SideBar() {
  let isTabletMid = useMediaQuery({ query: '(max-width: 767px)' })
  const [open, setOpen] = useState(isTabletMid ? false : true)
  const [openModalRequest, setOpenModalRequest] = useState(false)
  const sidebarRef = useRef()
  const { pathname } = useLocation()
  // const { profile } = useContext(AppContext)
  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => {
      return currentAccount()
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60
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

  useEffect(() => {
    if (isTabletMid) {
      setOpen(false)
    } else {
      setOpen(true)
    }
  }, [isTabletMid])

  useEffect(() => {
    isTabletMid && setOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const Nav_animation = {
    open: {
      x: 0,
      width: '16rem',
      transition: {
        damping: 40
      }
    },
    closed: {
      x: -250,
      width: 0,
      transition: {
        damping: 40,
        delay: 0.15
      }
    }
  }

  const menuGroups = [
    {
      name: 'Thực đơn',
      icon: FaUtensils,
      path: 'meal-plan',
      menus: [
        { subName: 'Tất cả thực đơn', subPath: '' },
        { subName: 'Thực đơn của tôi', subPath: 'my' },
        { subName: 'Thực đơn đang áp dụng', subPath: 'active' }
      ]
    }
  ]

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

  return (
    <>
      <div className='fixed z-[100]'>
        <div
          onClick={() => setOpen(false)}
          className={`md:hidden fixed inset-0 max-h-screen z-[80] bg-black/50 ${open ? 'block' : 'hidden'} `}
        ></div>
        <motion.div
          ref={sidebarRef}
          variants={Nav_animation}
          initial={{ x: isTabletMid ? -250 : 0 }}
          animate={open ? 'open' : 'closed'}
          className=' bg-white dark:bg-color-primary-dark dark:text-gray-300 text-gray shadow-md dark:shadow-green-800 max-w-[16rem] w-[16rem] overflow-hidden z-[999] h-screen relative'
        >
          <Logo />

          <div className='flex flex-col h-full'>
            <ul
              className={
                userData?.data.result[0]?.role === 1
                  ? 'whitespace-pre  px-2.5 pt-4 pb-4 flex flex-col gap-3 font-medium overflow-x-hidden scrollbar-thin scrollbar-track-white dark:scrollbar-track-[#010410] dark:scrollbar-thumb-[#171c3d] scrollbar-thumb-slate-100 md:h-[80%] h-[70%] '
                  : 'whitespace-pre  px-2.5 pt-4 pb-4 flex flex-col gap-3 font-medium overflow-x-hidden scrollbar-thin scrollbar-track-white dark:scrollbar-track-[#010410] dark:scrollbar-thumb-[#171c3d] scrollbar-thumb-slate-100 md:h-[72%] h-[70%]  '
              }
            >
              <li>
                <NavLink to={'/home'} className='link-custom '>
                  <BsPeopleFill size={25} className='min-w-max' />
                  Cộng đồng
                </NavLink>
              </li>
              <li>
                <NavLink to={'/personal-dashboard'} className='link-custom '>
                  <FaChartPie size={25} className='min-w-max' />
                  Trang Cá Nhân
                </NavLink>
              </li>
              <li>
                <NavLink to={'/friends'} className='link-custom '>
                  <FaUserFriends size={25} className='min-w-max' />
                  Bạn bè
                </NavLink>
              </li>
              {isAdmin && (
                <li>
                  <NavLink to={'/admin'} className='link-custom '>
                    <MdOutlineSpaceDashboard size={25} className='min-w-max' />
                    Trang quản trị
                  </NavLink>
                </li>
              )}
              {menuGroups.map((menu) => (
                <li key={menu.name}>
                  <Submenu data={menu} />
                </li>
              ))}
              <li>
                <NavLink to={'/user-calendar'} className='link-custom '>
                  <FaCalendarAlt size={25} className='min-w-max' />
                  Lịch Cá Nhân
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to={'/sport-event'} 
                  end
                  className='link-custom'
                >
                  <MdSportsSoccer size={25} className='min-w-max' />
                  Sự kiện thể thao
                </NavLink>
              </li>
              {(open || isTabletMid) && subMenusList.length > 0 && (
                <div className='border-y py-4 border-slate-300 dark:border-slate-700'>
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
           
          </div>
          {/* <motion.div
          onClick={() => {
            setOpen(!open)
          }}
          animate={
            open
              ? {
                  x: 0,
                  y: 0,
                  rotate: 0
                }
              : {
                  x: -10,
                  y: -200,
                  rotate: 180
                }
          }
          transition={{ duration: 0 }}
          className='absolute w-fit h-fit md:block border border-black rounded-full dark:border-gray-200 hover:bg-red-600 transition-all z-50 hidden right-2 bottom-3 cursor-pointer'
        >
          <IoIosArrowBack size={25} />
        </motion.div> */}
        </motion.div>
        <div
          className='my-3 cursor-pointer hover:text-red-600 transition-all ml-4 mr-3 md:hidden absolute top-2 z-50'
          onClick={() => setOpen(true)}
        >
          <MdMenu size={25} />
        </div>
      </div>
      {openModalRequest && (
        <ModalRequest handleCloseModalRequest={handleCloseModalRequest} updateRequest={updateRequestMutation} />
      )}
    </>
  )
}
