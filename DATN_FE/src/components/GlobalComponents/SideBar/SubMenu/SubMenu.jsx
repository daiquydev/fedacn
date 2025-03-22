import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IoIosArrowDown } from 'react-icons/io'
import { NavLink, useLocation } from 'react-router-dom'

export default function Submenu({ data }) {
  const { pathname } = useLocation()
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  
  // Check if any submenu is active - for sport-event, be extra careful to check exact paths
  const isSubMenuActive = data.menus?.some(menu => {
    const fullPath = `/${data.path}/${menu.subPath}`;
    
    // For sport-event paths, we need to be extra careful
    if (data.path === 'sport-event') {
      // Only highlight submenu when on my-events or history pages, not the main sport-event page or detail pages
      return pathname === fullPath;
    }
    
    // For other paths, allow starting with the path (for nested routes)
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  });
  
  // Open submenu automatically if one of its items is active
  useEffect(() => {
    if (isSubMenuActive) {
      setSubMenuOpen(true)
    }
  }, [isSubMenuActive])

  return (
    <>
      <div
        className={`link-custom ${isSubMenuActive ? 'text-red-600 dark:text-yellow-500' : ''}`}
        onClick={() => setSubMenuOpen(!subMenuOpen)}
      >
        <data.icon size={23} className='min-w-max' />
        <p className='flex-1'>{data.name}</p>
        <IoIosArrowDown className={` ${subMenuOpen && 'rotate-180'} duration-200 `} />
      </div>
      <motion.div
        animate={
          subMenuOpen
            ? {
                height: 'fit-content'
              }
            : {
                height: 0
              }
        }
        className='flex h-0 flex-col pl-14 text-[0.8rem] font-normal overflow-hidden'
      >
        {data.menus?.map((menu) => (
          <div key={menu.subName}>
            <NavLink 
              to={`/${data.path}/${menu.subPath}`} 
              className='link-custom bg-transparent'
              end
            >
              {menu.subName}
            </NavLink>
          </div>
        ))}
      </motion.div>
    </>
  )
}
