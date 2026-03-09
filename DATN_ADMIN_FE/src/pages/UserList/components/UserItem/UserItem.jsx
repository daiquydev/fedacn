import useravatar from '../../../../assets/images/useravatar.jpg'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { banUserAdmin, deleteUserAdmin, unbanUserAdmin } from '../../../../apis/adminApi'
import { useState } from 'react'
import { FaBan, FaLockOpen, FaTrash } from 'react-icons/fa'
import { queryClient } from '../../../../main'
import ConfirmBox from '../../../../components/GlobalComponents/ConfirmBox'

export default function UserItem({ user }) {
  const [openDelete, setOpenDelete] = useState(false)
  const [openBan, setOpenBan] = useState(false)

  const deleteUserMutation = useMutation({
    mutationFn: () => deleteUserAdmin(user._id),
    onSuccess: () => {
      toast.success('Xóa người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['user-list'] })
      setOpenDelete(false)
    }
  })

  const banMutation = useMutation({ mutationFn: (body) => banUserAdmin(body) })
  const unbanMutation = useMutation({ mutationFn: (body) => unbanUserAdmin(body) })

  const handleBan = () => {
    if (user?.status === 0) {
      unbanMutation.mutate({ user_id: user._id }, {
        onSuccess: () => {
          queryClient.invalidateQueries(['user-list'])
          toast.success('Mở khóa thành công')
          setOpenBan(false)
        }
      })
    } else {
      banMutation.mutate({ user_id: user._id }, {
        onSuccess: () => {
          queryClient.invalidateQueries(['user-list'])
          toast.success('Khóa tài khoản thành công')
          setOpenBan(false)
        }
      })
    }
  }

  const isBanned = user?.status === 0
  const isHighRisk = (user?.banned_count ?? 0) >= 3

  return (
    <>
      <tr className='hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'>
        {/* User info */}
        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex gap-3 items-center'>
            <img
              className='rounded-full object-cover w-9 h-9 ring-2 ring-gray-100 dark:ring-slate-600'
              src={user.avatar === '' ? useravatar : user.avatar}
              alt={user.name}
            />
            <div>
              <div className='text-sm font-semibold text-gray-800 dark:text-white'>{user.name}</div>
              <div className='text-xs text-gray-400'>@{user.user_name}</div>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className='px-6 py-4 whitespace-nowrap'>
          {isBanned ? (
            <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'>
              🔒 Bị khóa
            </span>
          ) : (
            <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'>
              ✅ Hoạt động
            </span>
          )}
        </td>

        {/* Email */}
        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
          {user.email}
        </td>

        {/* Violation count */}
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

        {/* Role */}
        <td className='px-6 py-4 whitespace-nowrap'>
          {user.role === 1 ? (
            <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'>
              👨‍🍳 Đầu bếp
            </span>
          ) : (
            <span className='px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>
              👤 Người dùng
            </span>
          )}
        </td>

        {/* Actions */}
        <td className='px-6 py-4 whitespace-nowrap'>
          <div className='flex items-center gap-2'>
            {/* Ban / Unban */}
            <button
              onClick={() => setOpenBan(true)}
              title={isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              className={`p-1.5 rounded-lg transition-colors ${isBanned
                  ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
                  : 'text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30'
                }`}
            >
              {isBanned ? <FaLockOpen size={14} /> : <FaBan size={14} />}
            </button>

            {/* Delete */}
            <button
              onClick={() => setOpenDelete(true)}
              title='Xóa người dùng'
              className='p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors'
            >
              <FaTrash size={14} />
            </button>
          </div>

          {openDelete && (
            <ConfirmBox
              closeModal={() => setOpenDelete(false)}
              handleDelete={() => deleteUserMutation.mutate()}
              isPending={deleteUserMutation.isPending}
              title={'Xác nhận xóa'}
              subtitle={'Bạn có chắc chắn muốn xóa người dùng này không?'}
            />
          )}
          {openBan && (
            <ConfirmBox
              closeModal={() => setOpenBan(false)}
              handleDelete={handleBan}
              isPending={isBanned ? unbanMutation.isPending : banMutation.isPending}
              title={isBanned ? 'Xác nhận mở khóa' : 'Xác nhận khóa'}
              subtitle={isBanned ? 'Bạn có chắc chắn muốn mở khóa tài khoản này không?' : 'Bạn có chắc chắn muốn khóa tài khoản này không?'}
              tilteButton={isBanned ? 'Mở khóa' : 'Khóa'}
            />
          )}
        </td>
      </tr>
    </>
  )
}
