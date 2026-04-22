import useravatar from '../../../../assets/images/useravatar.jpg'
import { toast } from 'react-hot-toast'
import { deleteUserAdmin, restoreUserAdmin } from '../../../../apis/adminApi'
import { useState } from 'react'
import { queryClient } from '../../../../main'
import ConfirmBox from '../../../../components/GlobalComponents/ConfirmBox'
import { useSafeMutation } from '../../../../hooks/useSafeMutation'

export default function UserItem({ user, listDeleted }) {
  const [openDelete, setOpenDelete] = useState(false)
  const [openRestore, setOpenRestore] = useState(false)

  const deleteUserMutation = useSafeMutation({
    mutationFn: () => deleteUserAdmin(user._id),
    onSuccess: () => {
      toast.success('Xóa mềm thành công')
      queryClient.invalidateQueries({ queryKey: ['inspector-list'] })
      setOpenDelete(false)
    }
  })

  const restoreMutation = useSafeMutation({
    mutationFn: () => restoreUserAdmin({ user_id: user._id }),
    onSuccess: () => {
      toast.success('Khôi phục thành công')
      queryClient.invalidateQueries({ queryKey: ['inspector-list'] })
      setOpenRestore(false)
    }
  })

  const isUserDeleted = !!user?.isDeleted

  return (
    <>
      <tr>
        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex gap-2 items-center'>
            <div className='inline-block'>
              <img
                className='rounded-full object-cover max-w-none w-8 h-8'
                src={user.avatar === '' ? useravatar : user.avatar}
                alt=''
              />
            </div>
            <div>
              <div className='text-sm text-gray-700 dark:text-gray-300'>{user.name}</div>
              <div className='text-xs text-gray-500'>@{user.user_name}</div>
            </div>
          </div>
        </td>
        <td className='px-6 py-4 whitespace-nowrap'>
          {isUserDeleted ? (
            <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100'>
              Đã xóa
            </span>
          ) : (
            <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:text-black dark:bg-sky-400'>
              Hoạt động
            </span>
          )}
        </td>
        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{user.email}</td>
        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
          <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-green-800 dark:text-black '>
            Người kiểm duyệt
          </span>
        </td>
        <td className='px-6 py-4 mt-2 flex item-center whitespace-nowrap  text-sm font-medium'>
          {listDeleted || isUserDeleted ? (
            <button
              type='button'
              onClick={() => setOpenRestore(true)}
              className='text-emerald-600 cursor-pointer hover:text-emerald-900'
            >
              Khôi phục
            </button>
          ) : (
            <button type='button' onClick={() => setOpenDelete(true)} className='text-red-600 cursor-pointer hover:text-red-900'>
              Xóa mềm
            </button>
          )}
          <span>
            {openDelete && (
              <ConfirmBox
                closeModal={() => setOpenDelete(false)}
                handleDelete={() => deleteUserMutation.mutate()}
                isPending={deleteUserMutation.isPending}
                title='Xác nhận xóa mềm'
                subtitle='Bạn có chắc chắn muốn xóa mềm tài khoản này? (có thể khôi phục)'
              />
            )}
            {openRestore && (
              <ConfirmBox
                closeModal={() => setOpenRestore(false)}
                handleDelete={() => restoreMutation.mutate()}
                isPending={restoreMutation.isPending}
                title='Xác nhận khôi phục'
                subtitle='Khôi phục tài khoản này?'
                tilteButton='Khôi phục'
              />
            )}
          </span>
        </td>
      </tr>
    </>
  )
}
