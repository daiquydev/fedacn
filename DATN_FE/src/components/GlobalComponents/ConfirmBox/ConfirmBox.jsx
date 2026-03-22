import { IoIosWarning } from 'react-icons/io'
import Loading from '../Loading'
import ModalLayout from '../../../layouts/ModalLayout'

export default function ConfirmBox({ title, subtitle, confirmText = 'Xác nhận', cancelText = 'Hủy', type = 'button', handleConfirm, closeModal, isPending, confirmButtonClass = 'bg-blue-600 hover:bg-blue-700' }) {
  return (
    <ModalLayout
      closeModal={closeModal}
      className='modal-content min-w-[360px] md:min-w-[450px] md:max-w-[500px] dark:bg-gray-900 bg-white'
    >
      <div className='md:flex items-center p-3'>
        <div className='flex justify-center'>
          <div className='rounded-full border border-gray-300 flex items-center justify-center w-14 h-14 flex-shrink-0'>
            <div className='text-amber-500 text-3xl'>
              <IoIosWarning />
            </div>
          </div>
        </div>

        <div className='mt-4 md:mt-0 md:ml-2 text-center md:text-left'>
          <p className='font-bold text-gray-900 dark:text-white'>{title}</p>
          <p className='text-sm text-gray-800 dark:text-gray-400 mt-1'>{subtitle}</p>
        </div>
      </div>
      <div className='text-center md:text-right mt-4 md:flex md:justify-end gap-2'>
        <button
          onClick={closeModal}
          className='block btn btn-sm w-full text-gray-700 hover:bg-slate-300 dark:text-gray-700 md:inline-block md:w-auto bg-gray-200 rounded-lg font-semibold text-sm mt-4 md:mt-0'
        >
          {cancelText}
        </button>

        {isPending ? (
          <button
            disabled
            className={`block btn w-full btn-sm md:inline-block md:w-auto text-white rounded-lg font-semibold text-sm mt-2 md:mt-0 ${confirmButtonClass} opacity-70 cursor-not-allowed`}
          >
            <Loading classNameSpin='inline w-5 h-5 text-gray-200 animate-spin fill-white' />
          </button>
        ) : (
          <button
            type={type}
            onClick={handleConfirm}
            className={`block btn btn-sm w-full md:inline-block md:w-auto text-white rounded-lg font-semibold text-sm mt-2 md:mt-0 ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        )}
      </div>
    </ModalLayout>
  )
}
