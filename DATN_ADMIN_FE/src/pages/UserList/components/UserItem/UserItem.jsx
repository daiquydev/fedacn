import useravatar from '../../../../assets/images/useravatar.jpg'
import { toast } from 'react-hot-toast'
import { deleteUserAdmin, restoreUserAdmin } from '../../../../apis/adminApi'
import { useState } from 'react'
import { FaEye, FaTrash, FaUndo } from 'react-icons/fa'
import ConfirmBox from '../../../../components/GlobalComponents/ConfirmBox'
import { useSafeMutation } from '../../../../hooks/useSafeMutation'

export default function UserItem({ user, tab, onViewDetail, onMutationSuccess }) {
  const [openDelete, setOpenDelete] = useState(false)
  const [openRestore, setOpenRestore] = useState(false)

  const deleteUserMutation = useSafeMutation({
    mutationFn: () => deleteUserAdmin(user._id),
    onSuccess: () => {
      toast.success('Xóa người dùng thành công')
      onMutationSuccess?.()
      setOpenDelete(false)
    }
  })

  const restoreMutation = useSafeMutation({
    mutationFn: () => restoreUserAdmin({ user_id: user._id }),
    onSuccess: () => {
      toast.success('Khôi phục người dùng thành công')
      onMutationSuccess?.()
      setOpenRestore(false)
    }
  })

  const isUserDeleted = !!user?.isDeleted
  const isHighRisk = (user?.banned_count ?? 0) >= 3

  return (
    <>
      <tr className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${isUserDeleted ? 'opacity-60' : ''}`}>
        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex gap-3 items-center'>
            <img
              className='rounded-full object-cover w-9 h-9 ring-2 ring-gray-100 dark:ring-slate-600'
              src={user.avatar === '' ? useravatar : user.avatar}
              alt={user.name}
            />
            <div>
              <div className={`text-sm font-semibold ${isUserDeleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>{user.name}</div>
              <div className='text-xs text-gray-400'>@{user.user_name}</div>
              {tab === 'deleted' && isUserDeleted && (
                <div className='mt-1'>
                  <span className='inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'>Đã xóa</span>
                </div>
              )}
            </div>
          </div>
        </td>

        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
          {user.email}
        </td>

        <td className='px-6 py-4 whitespace-nowrap'>
          {isHighRisk ? (
            <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'>
              ⚠️ {user?.banned_count ?? 0} lần
            </span>
          ) : (
            <span className='text-sm text-gray-500 dark:text-gray-400'>
              {user?.banned_count ?? 0} lần
            </span>
          )}
        </td>

        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex items-center gap-2 flex-wrap'>
            {isUserDeleted ? (
              <>
                <button
                  onClick={() => onViewDetail(user._id)}
                  title='Xem chi tiết'
                  className='p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
                >
                  <FaEye size={14} />
                </button>
                <button
                  onClick={() => setOpenRestore(true)}
                  title='Khôi phục'
                  className='p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors flex items-center gap-1.5'
                >
                  <FaUndo size={14} />
                  <span className='text-xs font-semibold'>Khôi phục</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onViewDetail(user._id)}
                  title='Xem chi tiết'
                  className='p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
                >
                  <FaEye size={14} />
                </button>
                <button
                  onClick={() => setOpenDelete(true)}
                  title='Xóa mềm người dùng'
                  className='p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors'
                >
                  <FaTrash size={14} />
                </button>
              </>
            )}
          </div>

          {openDelete && (
            <ConfirmBox
              closeModal={() => setOpenDelete(false)}
              handleDelete={() => deleteUserMutation.mutate()}
              isPending={deleteUserMutation.isPending}
              title={'Xác nhận xóa mềm'}
              subtitle={'Bạn có chắc chắn muốn xóa mềm người dùng này không? (có thể khôi phục sau)'}
            />
          )}
          {openRestore && (
            <ConfirmBox
              closeModal={() => setOpenRestore(false)}
              handleDelete={() => restoreMutation.mutate()}
              isPending={restoreMutation.isPending}
              title={'Xác nhận khôi phục'}
              subtitle={'Bạn có chắc chắn muốn khôi phục người dùng này không?'}
              tilteButton='Khôi phục'
            />
          )}
        </td>
      </tr>
    </>
  )
}
