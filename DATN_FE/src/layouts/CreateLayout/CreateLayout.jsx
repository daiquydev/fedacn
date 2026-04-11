import Header from '../../components/GlobalComponents/Header'
import Footer from '../../components/GlobalComponents/Footer'
import { AiOutlineArrowUp } from 'react-icons/ai'
import SideBar from '../../components/GlobalComponents/SideBar'
import { memo, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

function CreateLayoutInner({ children }) {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className='flex justify-between text-gray-800 w-full bg-gray-100 h-full dark:text-gray-300 dark:bg-color-primary-dark'>
      <div className='block sm:hidden'>
        <SideBar />
      </div>

      <Header />
      <div className='h-screen bg-gray-100 dark:bg-color-primary-dark w-[100%]'>
        <div className='mt-20 bg-gray-100 dark:bg-color-primary-dark'>
          {children}
          <div
            onClick={() => {
              window.scroll({
                top: 0,
                behavior: 'smooth'
              })
            }}
          >
            <AiOutlineArrowUp className='hidden sm:block fixed bottom-10 cursor-pointer transition-all right-0 bg-blue-300 text-slate-50 text-5xl p-3 rounded-full mb-2 mr-20 hover:bg-blue-500' />
          </div>
          <div className='mt-8'>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}

const CreateLayout = memo(CreateLayoutInner)

export default CreateLayout
