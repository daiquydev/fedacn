import { IoIosWarning } from 'react-icons/io'
import { FaExclamationTriangle } from 'react-icons/fa'
import Loading from '../Loading'

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
  return (
    <div className='fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4' onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-[fadeIn_0.2s_ease-out]'>
        {/* Header with icon */}
        <div className='px-6 pt-6 pb-4'>
          <div className='flex items-start gap-4'>
            <div className={`p-3 rounded-xl shrink-0 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
              <FaExclamationTriangle className={`text-lg ${danger ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
            <div>
              <h3 className='text-base font-bold text-gray-800 dark:text-white'>{title}</h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed'>{subtitle}</p>
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
              className={`px-4 py-2 text-sm text-white rounded-xl font-semibold flex items-center gap-2 ${danger ? 'bg-red-600' : 'bg-emerald-600'} opacity-70 cursor-not-allowed`}
            >
              <Loading classNameSpin='inline w-4 h-4 text-gray-200 animate-spin fill-white' />
              Đang xử lý...
            </button>
          ) : (
            <button
              type={type}
              onClick={handleDelete}
              className={`px-4 py-2 text-sm text-white rounded-xl font-semibold transition-colors ${
                danger
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {tilteButton}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
