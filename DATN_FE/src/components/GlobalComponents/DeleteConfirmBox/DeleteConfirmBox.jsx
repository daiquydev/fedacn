import { IoIosWarning } from 'react-icons/io'
import Loading from '../Loading'
import ModalLayout from '../../../layouts/ModalLayout'

export default function DeleteConfirmBox({ title, subtitle, type = 'submit', handleDelete, closeModal, isPending }) {
  return (
    <ModalLayout closeModal={closeModal} title={title} icon={IoIosWarning} size='sm'>
      <div className='p-5'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>{subtitle}</p>

        <div className='flex gap-3 mt-6 justify-end'>
          <button
            onClick={closeModal}
            className='px-5 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
          >
            Hủy
          </button>
          {isPending ? (
            <button
              disabled
              className='px-5 py-2 rounded-xl font-bold text-white text-sm bg-gray-400 cursor-not-allowed flex items-center gap-2'
            >
              <Loading classNameSpin='inline w-4 h-4 text-gray-200 animate-spin fill-white' />
            </button>
          ) : (
            <button
              type={type}
              onClick={handleDelete}
              className='px-5 py-2 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition-all duration-300 shadow-lg shadow-red-500/20'
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    </ModalLayout>
  )
}
