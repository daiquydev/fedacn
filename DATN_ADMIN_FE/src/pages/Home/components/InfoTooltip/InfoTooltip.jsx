import { useState, useRef, useEffect } from 'react'

export default function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState('right')
  const ref = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceRight = window.innerWidth - rect.right
      const spaceLeft = rect.left
      setPosition(spaceRight < 300 && spaceLeft > 300 ? 'left' : 'right')
    }
    setOpen(!open)
  }

  const posClass = position === 'left' ? 'right-0' : 'left-0'
  const arrowClass = position === 'left' ? 'right-2' : 'left-2'

  return (
    <div className='relative inline-block' ref={ref}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className='w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all cursor-pointer flex-shrink-0'
        title='Xem chú thích'
      >
        i
      </button>
      {open && (
        <div className={`absolute z-[100] top-7 ${posClass} w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed`}
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          <div className={`absolute -top-1.5 ${arrowClass} w-3 h-3 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 rotate-45`} />
          <div className='flex items-start gap-2'>
            <span className='text-blue-400 mt-0.5 flex-shrink-0'>💡</span>
            <span>{text}</span>
          </div>
        </div>
      )}
    </div>
  )
}
