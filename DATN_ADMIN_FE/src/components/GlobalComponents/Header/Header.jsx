// import SearchInput from './SearchInput'
// import { IoMdNotifications } from 'react-icons/io'
import UserAvatar from './UserAvatar'
import { useLocation } from 'react-router-dom'
import Logo from '../Logo'

export default function Header() {
  const location = useLocation()

  return (
    <div className='fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-white py-3 pl-8 pr-4 shadow-sm transition-all duration-500 dark:bg-color-primary-dark dark:shadow-yellow-800 md:left-64'>
      {
        // tìm những url có chứa '/chef/edit-blog/'
        location.pathname.includes('/recipes-writter/create') || location.pathname.includes('/recipes-writter/edit') ? (
          <div className='hidden sm:block'>
            <Logo
              className='flex items-center gap-2.5 font-medium  mx-3'
              textClassName='text-xl flex font-bold whitespace-pre'
              sizeLogo={40}
            />
          </div>
        ) : (
          <div className=''></div>
        )
      }
      <div className=''></div>
      <div className='flex justify-between items-center'>
        {/* <div className=''>
          <SearchInput />
        </div> */}
        <div className='flex justify-center items-center'>
          {/* <div className='dark:bg-slate-600 dark:hover:bg-slate-500 dark:border-none text-2xl hover:bg-yellow-200 transition-all duration-300 cursor-pointer border text-red-600 dark:text-white shadow-md font-normal h-8 w-8 md:h-10 md:w-10 flex items-center justify-center align-center rounded-full outline-none focus:outline-none mr-1'>
            <IoMdNotifications />
          </div> */}
          <UserAvatar />
        </div>
      </div>
    </div>
  )
}
