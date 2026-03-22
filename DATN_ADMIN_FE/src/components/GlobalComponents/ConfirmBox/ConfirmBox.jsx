import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaExclamationTriangle } from 'react-icons/fa'

export default function ConfirmBox({
  title,
  subtitle,
  type = 'submit',
  handleDelete,
  closeModal,
  isPending,
  tilteButton = 'Xóa',
  danger = true
}) {
  // Lock body scroll + Escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closeModal])

  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[fadeIn_0.2s_ease-out]'>
        {/* Header with icon */}
        <div className='px-6 pt-6 pb-4'>
          <div className='flex items-start gap-4'>
            <div className={`p-3 rounded-xl shrink-0 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
              <FaExclamationTriangle className={`text-lg ${danger ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
            <div className='min-w-0'>
              <h3 className='text-base font-bold text-gray-800 dark:text-white'>{title}</h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed break-words'>{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-3 px-6 pb-5 pt-2'>
          <button
            onClick={closeModal}
            className='px-4 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors'
          >
            Hủy
          </button>
          {isPending ? (
            <button
              disabled
              className={`min-w-[120px] px-4 py-2 text-sm text-white rounded-xl font-semibold flex items-center justify-center gap-2 ${danger ? 'bg-red-600' : 'bg-emerald-600'} opacity-70 cursor-not-allowed`}
            >
              <svg className='w-4 h-4 animate-spin shrink-0' viewBox='0 0 100 101' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z' fill='currentColor' opacity='0.3' />
                <path d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z' fill='currentColor' />
              </svg>
              Đang xử lý...
            </button>
          ) : (
            <button
              type={type}
              onClick={handleDelete}
              className={`min-w-[120px] px-4 py-2 text-sm text-white rounded-xl font-semibold flex items-center justify-center transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
            >
              {tilteButton}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
