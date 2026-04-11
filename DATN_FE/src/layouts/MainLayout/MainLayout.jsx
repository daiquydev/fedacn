import SideBar from '../../components/GlobalComponents/SideBar'
import Header from '../../components/GlobalComponents/Header'
import Footer from '../../components/GlobalComponents/Footer'
import { AiOutlineArrowUp } from 'react-icons/ai'
import { memo, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

function MainLayoutInner({ children }) {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className='flex flex-col min-h-screen w-full bg-gray-100 text-gray-800 dark:text-gray-300 dark:bg-color-primary-dark'>
      {/* Header - Fixed top, full width */}
      <Header />

      {/* Body - Sidebar + Content */}
      <div className='flex flex-1 pt-14'>
        {/* Sidebar - Desktop: fixed left, Mobile: drawer overlay */}
        <SideBar />

        {/* Main content area */}
        <main className='flex-1 min-w-0 lg:ml-60 bg-gray-100 dark:bg-color-primary-dark flex flex-col'>
          <div className='flex-1'>
            {children}
          </div>
          <div
            onClick={() => {
              window.scroll({
                top: 0,
                behavior: 'smooth'
              })
            }}
          >
            <AiOutlineArrowUp className='hidden sm:block fixed bottom-10 cursor-pointer transition-all right-0 bg-blue-300 text-slate-50 text-5xl p-3 rounded-full mb-2 mr-20 hover:bg-blue-500 z-40' />
          </div>
          <div className='mt-8'>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  )
}

const MainLayout = memo(MainLayoutInner)
export default MainLayout
