import { AnimatePresence, motion } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'

const SIZE_MAP = {
  sm: 'min-w-[360px] max-w-sm',
  md: 'min-w-[360px] md:min-w-[450px] max-w-md',
  lg: 'min-w-[360px] md:min-w-[600px] max-w-2xl',
  xl: 'min-w-[360px] md:min-w-[800px] lg:min-w-[900px] max-w-4xl'
}

export default function ModalLayout({
  children,
  closeModal,
  title,
  icon: Icon,
  size = 'md',
  className,
  showHeader = true
}) {
  const overlayVariants = {
    visible: {
      opacity: 1,
      transition: { when: 'beforeChildren', duration: 0.2 }
    },
    hidden: {
      opacity: 0,
      transition: { when: 'afterChildren', duration: 0.2 }
    }
  }

  const contentVariants = {
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
    },
    hidden: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  }

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md
  const defaultClass = `modal-content max-h-[90vh] ${sizeClass} bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl`

  return (
    <div className='fixed inset-0 z-[200] flex items-center justify-center p-4'>
      <AnimatePresence>
        <>
          {/* Backdrop */}
          <motion.div
            initial='hidden'
            animate='visible'
            exit='hidden'
            variants={overlayVariants}
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            onClick={closeModal}
          />

          {/* Content */}
          <motion.div
            initial='hidden'
            animate='visible'
            exit='hidden'
            variants={contentVariants}
            className={className || defaultClass}
          >
            {/* Standard Header */}
            {showHeader && title && (
              <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800'>
                <h3 className='font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2.5'>
                  {Icon && <Icon className='text-emerald-600 dark:text-emerald-400 text-xl' />}
                  {title}
                </h3>
                <button
                  onClick={closeModal}
                  className='p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                >
                  <FaTimes size={16} />
                </button>
              </div>
            )}

            {/* Body */}
            <div className={title ? 'overflow-y-auto max-h-[calc(90vh-4rem)]' : ''}>
              {children}
            </div>
          </motion.div>
        </>
      </AnimatePresence>
    </div>
  )
}
