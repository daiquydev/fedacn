import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { motion } from 'framer-motion'
// * React icons
import {
  FaCookieBite,
  FaShareAlt,
  FaRunning,
  FaTrophy,
  FaChartLine,
  FaUtensils,
  FaCalendarAlt,
  FaClipboardList,
  FaPlayCircle
} from 'react-icons/fa'
import { BsFillCalendarHeartFill, BsFillHeartFill, BsPeopleFill } from 'react-icons/bs'
import { useMediaQuery } from 'react-responsive'
import { MdMenu, MdSportsSoccer } from 'react-icons/md'
import { NavLink, useLocation } from 'react-router-dom'
import Submenu from './SubMenu'
import { FaPenToSquare } from 'react-icons/fa6'
import { IoMdAlbums } from 'react-icons/io'
import { MdBook } from 'react-icons/md'
import Logo from '../Logo'
// import { AppContext } from '../../../contexts/app.context'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { currentAccount, updateRequest } from '../../../apis/userApi'
import ModalRequest from '../../../pages/Me/components/ModalRequest'
import toast from 'react-hot-toast'
import { IoIosArrowForward } from 'react-icons/io'

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

  const checkSubmenu = () => {
    if (userData?.data.result[0]?.role === 1) {
      return true
    }
    return false
  }
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
        },
        {
          name: 'Sự kiện của tôi',
          icon: FaRunning,
          menus: [
            { subName: 'Sự kiện Đang Tham gia', subPath: 'da-tham-gia' },
            { subName: 'Lịch sử sự kiện', subPath: 'lich-su' }
          ],
          path: 'sport-event'
        },
        {
          name: 'Thử thách của tôi',
          icon: FaTrophy,
          menus: [
            { subName: 'Thử thách đã tham gia', subPath: 'my-challenges' },
            { subName: 'Tạo thử thách mới', subPath: 'create' }
          ],
          path: 'challenge'
        },
        {
          name: 'Thực đơn & Dinh dưỡng',
          icon: FaUtensils,
          menus: [
            { subName: 'Lịch ăn uống của tôi', subPath: 'my-eat-schedule' },
            { subName: 'Quản lý thực đơn', subPath: 'eat-plan' }
          ],
          path: 'schedule'
        }
      ]
    : [
        // {
        //   name: 'Sức khoẻ',
        //   icon: BsFillHeartFill,
        //   menus: [
        //     { subName: 'Công cụ tính toán', subPath: 'fitness-calculator' },
        //     { subName: 'Lịch sử tính toán', subPath: 'fitness-history' }
        //   ],
        //   path: 'fitness'
        // },
        // {
        //   name: 'Lịch trình',
        //   icon: BsFillCalendarHeartFill,
        //   menus: [
        //     { subName: 'Lịch trình ăn uống', subPath: 'eat-schedule' },
        //     { subName: 'Lịch trình tập luyện', subPath: 'ex-schedule' }
        //   ],
        //   path: 'schedule'
        // },
        {
          name: 'Sự kiện của tôi',
          icon: FaRunning,
          menus: [
            { subName: 'Sự kiện Đang Tham gia', subPath: 'da-tham-gia' },
            { subName: 'Lịch sử sự kiện', subPath: 'lich-su' }
          ],
          path: 'sport-event'
        },
        {
          name: 'Thử thách của tôi',
          icon: FaTrophy,
          menus: [
            { subName: 'Thử thách đã tham gia', subPath: 'my-challenges' }
          ],
          path: 'challenge'
        },
        {
          name: 'Thực đơn & Dinh dưỡng',
          icon: FaUtensils,
          menus: [
            { subName: 'Lịch ăn uống của tôi', subPath: 'my-eat-schedule' },
            { subName: 'Quản lý thực đơn', subPath: 'eat-plan' }
          ],
          path: 'schedule'
        }
      ]

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
                <NavLink to={'/meal-plan'} className='link-custom '>
                  <FaUtensils size={25} className='min-w-max' />
                  Thực đơn
                </NavLink>
              </li>
              <li>
                <NavLink to={'/meal-plan/my'} className='link-custom '>
                  <FaClipboardList size={25} className='min-w-max' />
                  Thực đơn của tôi
                </NavLink>
              </li>
              <li>
                <NavLink to={'/meal-plan/my-saved'} className='link-custom '>
                  <BsFillHeartFill size={25} className='min-w-max' />
                  Thực đơn đã lưu
                </NavLink>
              </li>
              <li>
                <NavLink to={'/meal-plan/active'} className='link-custom '>
                  <FaPlayCircle size={25} className='min-w-max' />
                  Thực đơn đang áp dụng
                </NavLink>
              </li>
              <li>
                <NavLink to={'/schedule/my-eat-schedule'} className='link-custom '>
                  <BsFillCalendarHeartFill size={25} className='min-w-max' />
                  Lịch ăn uống
                </NavLink>
              </li>
              <li>
                <NavLink to={'/user-calendar'} className='link-custom '>
                  <FaCalendarAlt size={25} className='min-w-max' />
                  Lịch Cá Nhân
                </NavLink>
              </li>
              {/* <li>
                <NavLink to={'/album'} className='link-custom '>
                  <IoMdAlbums size={25} className='min-w-max' />
                  Album
                </NavLink>
              </li> */}
              {/* <li>
                <NavLink to={'/blog'} className='link-custom '>
                  <FaShareAlt size={25} className='min-w-max' />
                  Góc chia sẻ
                </NavLink>
              </li> */}
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
              <li>
                <NavLink 
                  to={'/challenge'} 
                  end
                  className='link-custom'
                >
                  <FaTrophy size={25} className='min-w-max' />
                  Thử thách cộng đồng
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to={'/user-stats'} 
                  className='link-custom'
                >
                  <FaChartLine size={25} className='min-w-max' />
                  Thống kê tiến trình
                </NavLink>
              </li>

              {(open || isTabletMid) && (
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
                            setOpenMenus(prev => ({
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
              <li>
                <NavLink to={'/bookmark'} className='link-custom'>
                  <MdBook size={25} className='min-w-max' />
                  <span className='font-medium'>Mục đã lưu</span>
                </NavLink>
              </li>
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
