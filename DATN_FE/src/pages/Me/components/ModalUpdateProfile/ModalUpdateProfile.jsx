import ModalLayout from '../../../../layouts/ModalLayout'
import { useContext } from 'react'
import { queryClient } from '../../../../main'
import { AppContext } from '../../../../contexts/app.context'
import { setProfileToLS } from '../../../../utils/auth'
import EditProfile from '../../../../components/EditProfile/EditProfile'
import { FaUserEdit } from 'react-icons/fa'

export default function ModalUpdateProfile({ handleCloseModalUpdateProfile, user }) {
  const { setProfile } = useContext(AppContext)

  const handleProfileUpdated = (payload) => {
    queryClient.invalidateQueries({ queryKey: ['me'] })
    const userDoc = payload && typeof payload === 'object' && 'result' in payload ? payload.result : payload
    if (userDoc && (userDoc._id || userDoc.email)) {
      setProfile(userDoc)
      setProfileToLS(userDoc)
    }
    handleCloseModalUpdateProfile()
  }

  return (
    <ModalLayout closeModal={handleCloseModalUpdateProfile} title='Chỉnh sửa thông tin cá nhân' icon={FaUserEdit} size='xl'>
      <div className='p-5'>
        <EditProfile
          user={user}
          onClose={handleCloseModalUpdateProfile}
          onProfileUpdated={handleProfileUpdated}
        />
      </div>
    </ModalLayout>
  )
}
