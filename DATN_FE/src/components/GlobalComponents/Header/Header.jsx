import SearchInput from './SearchInput'
import UserAvatar from './UserAvatar'
import { useLocation } from 'react-router-dom'
import Logo from '../Logo'
import NotificationPopUp from './NotificationPopUp'

export default function Header() {
  const location = useLocation()

  return (
    <header className='fixed top-0 left-0 right-0 h-14 flex px-4 md:px-6 py-2 w-full justify-between items-center 
      transition-all duration-300 z-50 bg-white dark:bg-color-primary-dark shadow-sm dark:shadow-yellow-800'>
      {/* Left: Logo / Brand on create pages */}
      <div className='flex items-center'>
        {location.pathname === '/chef/create-blog' ||
          location.pathname === '/chef/create-recipe' ||
          location.pathname === '/chef/create-album' ||
          location.pathname.includes('/chef/edit-blog/') ||
          location.pathname.includes('/chef/edit-recipe/') ||
          location.pathname.includes('/chef/edit-album/') ? (
          <div className='hidden sm:block'>
            <Logo
              className='flex items-center gap-2.5 font-medium mx-3'
              textClassName='text-xl flex font-bold whitespace-pre'
              sizeLogo={36}
            />
          </div>
        ) : (
          /* Spacer for hamburger on mobile */
          <div className='w-10 md:hidden'></div>
        )}
      </div>

      {/* Center: Spacer */}
      <div className='flex-1'></div>

      {/* Right: Notification + Avatar */}
      <div className='flex items-center gap-1'>
        <NotificationPopUp />
        <UserAvatar />
      </div>
    </header>
  )
}
