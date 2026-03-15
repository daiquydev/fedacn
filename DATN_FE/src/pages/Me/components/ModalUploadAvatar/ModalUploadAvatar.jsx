import { useContext, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import ModalLayout from '../../../../layouts/ModalLayout'
import { updateAvatar } from '../../../../apis/userApi'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '../../../../main'
import { AppContext } from '../../../../contexts/app.context'
import { setProfileToLS } from '../../../../utils/auth'
import { FaCamera, FaCloudUploadAlt } from 'react-icons/fa'
import Loading from '../../../../components/GlobalComponents/Loading'

export default function ModalUploadAvatar({ closeModalAvatar }) {
  const { setProfile } = useContext(AppContext)
  const inputRef = useRef(null)
  const [image, setImage] = useState('')

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setImage(file)
  }

  const updateAvatarMutation = useMutation({
    mutationFn: (body) => updateAvatar(body)
  })

  const handleUpload = () => {
    if (!image) {
      toast.error('Vui lòng chọn ảnh trước')
      return
    }
    var formData = new FormData()
    formData.append('image', image)
    updateAvatarMutation.mutate(formData, {
      onSuccess: (data) => {
        toast.success('Cập nhật ảnh đại diện thành công')
        queryClient.invalidateQueries({ queryKey: ['me'] })
        setProfile(data?.data.result)
        setProfileToLS(data?.data.result)
        closeModalAvatar()
      },
      onError: () => {
        toast.error('Cập nhật ảnh đại diện thất bại')
      }
    })
  }

  return (
    <ModalLayout closeModal={closeModalAvatar} title='Chọn ảnh đại diện' icon={FaCamera} size='md'>
      <div className='p-5'>
        <div
          className='flex justify-center items-center cursor-pointer'
          onClick={() => inputRef.current.click()}
        >
          {image ? (
            <img
              className='h-48 w-48 border-2 border-emerald-500 rounded-full object-cover shadow-lg'
              src={URL.createObjectURL(image)}
              alt='avatar'
            />
          ) : (
            <div className='h-48 w-48 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full cursor-pointer hover:border-emerald-400 transition-colors'>
              <FaCloudUploadAlt className='text-3xl text-gray-400 dark:text-gray-500 mb-2' />
              <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>Chọn ảnh</span>
              <span className='text-xs text-gray-400 dark:text-gray-500 mt-1'>JPG, PNG</span>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          onChange={handleImageChange}
          type='file'
          className='hidden'
          accept='image/*'
        />

        <div className='flex gap-3 mt-6'>
          <button
            type='button'
            onClick={closeModalAvatar}
            className='flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
          >
            Đóng
          </button>
          <button
            onClick={handleUpload}
            disabled={updateAvatarMutation.isPending || !image}
            className='flex-1 py-2.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2'
          >
            {updateAvatarMutation.isPending ? (
              <Loading classNameSpin='inline w-5 h-5 text-gray-200 animate-spin fill-white' />
            ) : (
              'Tải lên'
            )}
          </button>
        </div>
      </div>
    </ModalLayout>
  )
}
