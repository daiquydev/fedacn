import ModalLayout from '../../../../layouts/ModalLayout'
import { useContext } from 'react'
import { queryClient } from '../../../../main'
import toast from 'react-hot-toast'
import { AppContext } from '../../../../contexts/app.context'
import { setProfileToLS } from '../../../../utils/auth'
import EditProfile from '../../../../components/EditProfile/EditProfile'

export default function ModalUpdateProfile({ handleCloseModalUpdateProfile, user }) {
  const { setProfile } = useContext(AppContext)

  const handleProfileUpdated = (updatedUser) => {
    queryClient.invalidateQueries({
      queryKey: ['me']
    })
    setProfile(updatedUser)
    setProfileToLS(updatedUser)
    handleCloseModalUpdateProfile()
  }

  return (
    <ModalLayout
      closeModal={handleCloseModalUpdateProfile}
      className='modal-content max-h-[95vh] min-w-[360px] md:min-w-[800px] lg:min-w-[900px] dark:bg-gray-900 bg-white overflow-hidden'
    >
      <div className='relative w-full max-h-full'>
        <div className='flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700'>
          <h3 className='font-medium text-lg md:text-xl text-black dark:text-gray-200'>
            Chỉnh sửa thông tin cá nhân
          </h3>
          <div className='text-2xl font-semibold'>
            <span
              onClick={handleCloseModalUpdateProfile}
              className='hover:bg-slate-100 transition-all dark:hover:bg-slate-700 cursor-pointer rounded-full px-3 py-1'
            >
              &times;
            </span>
          </div>
        </div>

        <div className='p-4'>
          <EditProfile 
            user={user} 
            onClose={handleCloseModalUpdateProfile}
            onProfileUpdated={handleProfileUpdated}
          />
        </div>
      </div>
    </ModalLayout>
  )
}
