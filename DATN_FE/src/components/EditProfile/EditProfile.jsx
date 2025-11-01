import { useState, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { FaUser, FaCamera, FaSave, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { updateProfile, updateAvatar, updateCoverAvatar, changePassword, updateHealthProfile } from '../../apis/userApi'
import { AppContext } from '../../contexts/app.context'
import Input from '../../components/InputComponents/Input'

export default function EditProfile({ user, onClose, onProfileUpdated }) {
  const { setProfile } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('basic')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Basic profile form
  const {
    register: registerBasic,
    handleSubmit: handleSubmitBasic,
    formState: { errors: errorsBasic }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      user_name: user?.user_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      address: user?.address || '',
      date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
      bio: user?.bio || ''
    }
  })

  // Health profile form
  const {
    register: registerHealth,
    handleSubmit: handleSubmitHealth,
    formState: { errors: errorsHealth }
  } = useForm({
    defaultValues: {
      height: user?.height || '',
      weight: user?.weight || '',
      activity_level: user?.activity_level || '',
      health_goals: user?.health_goals || '',
      dietary_restrictions: user?.dietary_restrictions || '',
      allergies: user?.allergies || ''
    }
  })

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword }
  } = useForm()

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data) => updateProfile(data)
  })

  const updateHealthMutation = useMutation({
    mutationFn: (data) => updateHealthProfile(data)
  })

  const updateAvatarMutation = useMutation({
    mutationFn: (data) => updateAvatar(data)
  })

  const updateCoverMutation = useMutation({
    mutationFn: (data) => updateCoverAvatar(data)
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data) => changePassword(data)
  })

  // Handlers
  const handleBasicSubmit = handleSubmitBasic((data) => {
    updateProfileMutation.mutate(data, {
      onSuccess: (response) => {
        toast.success('Cập nhật thông tin thành công!')
        setProfile(prevProfile => ({ ...prevProfile, ...data }))
        if (onProfileUpdated) onProfileUpdated(response.data)
      },
      onError: (error) => {
        toast.error('Có lỗi xảy ra khi cập nhật thông tin')
        console.error(error)
      }
    })
  })

  const handleHealthSubmit = handleSubmitHealth((data) => {
    updateHealthMutation.mutate(data, {
      onSuccess: (response) => {
        toast.success('Cập nhật thông tin sức khỏe thành công!')
        if (onProfileUpdated) onProfileUpdated(response.data)
      },
      onError: (error) => {
        toast.error('Có lỗi xảy ra khi cập nhật thông tin sức khỏe')
        console.error(error)
      }
    })
  })

  const handlePasswordSubmit = handleSubmitPassword((data) => {
    changePasswordMutation.mutate({
      old_password: data.old_password,
      new_password: data.new_password
    }, {
      onSuccess: () => {
        toast.success('Đổi mật khẩu thành công!')
        resetPassword()
      },
      onError: (error) => {
        toast.error('Có lỗi xảy ra khi đổi mật khẩu')
        console.error(error)
      }
    })
  })

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const formData = new FormData()
      formData.append('avatar', file)
      
      updateAvatarMutation.mutate(formData, {
        onSuccess: (response) => {
          toast.success('Cập nhật ảnh đại diện thành công!')
          setProfile(prevProfile => ({ ...prevProfile, avatar: response.data.avatar }))
          if (onProfileUpdated) onProfileUpdated(response.data)
        },
        onError: (error) => {
          toast.error('Có lỗi xảy ra khi cập nhật ảnh đại diện')
          console.error(error)
        }
      })
    }
  }

  const handleCoverChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const formData = new FormData()
      formData.append('cover_avatar', file)
      
      updateCoverMutation.mutate(formData, {
        onSuccess: (response) => {
          toast.success('Cập nhật ảnh bìa thành công!')
          if (onProfileUpdated) onProfileUpdated(response.data)
        },
        onError: (error) => {
          toast.error('Có lỗi xảy ra khi cập nhật ảnh bìa')
          console.error(error)
        }
      })
    }
  }

  const newPassword = watchPassword('new_password')

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === 'basic'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Thông tin cơ bản
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === 'health'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Thông tin sức khỏe
        </button>
        <button
          onClick={() => setActiveTab('avatar')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === 'avatar'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Ảnh đại diện
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === 'password'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Đổi mật khẩu
        </button>
      </div>

      {/* Basic Information Tab */}
      {activeTab === 'basic' && (
        <form onSubmit={handleBasicSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <FaUser className="mr-2 text-green-500" />
            Thông tin cơ bản
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              title="Họ và tên"
              type="text"
              name="name"
              id="name"
              placeholder="Nhập họ và tên"
              register={registerBasic}
              errors={errorsBasic.name}
            />

            <Input
              title="Tên người dùng"
              type="text"
              name="user_name"
              id="user_name"
              placeholder="Nhập tên người dùng"
              register={registerBasic}
              errors={errorsBasic.user_name}
            />

            <Input
              title="Email"
              type="email"
              name="email"
              id="email"
              placeholder="Nhập email"
              register={registerBasic}
              errors={errorsBasic.email}
            />

            <Input
              title="Số điện thoại"
              type="text"
              name="phone_number"
              id="phone_number"
              placeholder="Nhập số điện thoại"
              register={registerBasic}
              errors={errorsBasic.phone_number}
            />

            <Input
              title="Ngày sinh"
              type="date"
              name="date_of_birth"
              id="date_of_birth"
              register={registerBasic}
              errors={errorsBasic.date_of_birth}
            />

            <Input
              title="Địa chỉ"
              type="text"
              name="address"
              id="address"
              placeholder="Nhập địa chỉ"
              register={registerBasic}
              errors={errorsBasic.address}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Giới thiệu bản thân
            </label>
            <textarea
              {...registerBasic('bio')}
              placeholder="Viết vài dòng giới thiệu về bản thân"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="4"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <FaSave />
              {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}

      {/* Health Information Tab */}
      {activeTab === 'health' && (
        <form onSubmit={handleHealthSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Thông tin sức khỏe
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              title="Chiều cao (cm)"
              type="number"
              name="height"
              id="height"
              placeholder="165"
              register={registerHealth}
              errors={errorsHealth.height}
            />

            <Input
              title="Cân nặng (kg)"
              type="number"
              name="weight"
              id="weight"
              placeholder="60"
              register={registerHealth}
              errors={errorsHealth.weight}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mức độ hoạt động
              </label>
              <select
                {...registerHealth('activity_level')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Chọn mức độ hoạt động</option>
                <option value="sedentary">Ít vận động</option>
                <option value="light">Vận động nhẹ</option>
                <option value="moderate">Vận động vừa phải</option>
                <option value="active">Vận động nhiều</option>
                <option value="very_active">Vận động rất nhiều</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mục tiêu sức khỏe
              </label>
              <select
                {...registerHealth('health_goals')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Chọn mục tiêu</option>
                <option value="lose_weight">Giảm cân</option>
                <option value="gain_weight">Tăng cân</option>
                <option value="maintain_weight">Duy trì cân nặng</option>
                <option value="build_muscle">Tăng cơ bắp</option>
                <option value="improve_health">Cải thiện sức khỏe</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hạn chế chế độ ăn
            </label>
            <textarea
              {...registerHealth('dietary_restrictions')}
              placeholder="Ví dụ: Ăn chay, không gluten, ít muối..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dị ứng thực phẩm
            </label>
            <textarea
              {...registerHealth('allergies')}
              placeholder="Ví dụ: Dị ứng tôm cua, sữa, đậu phộng..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateHealthMutation.isPending}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <FaSave />
              {updateHealthMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}

      {/* Avatar Tab */}
      {activeTab === 'avatar' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cập nhật ảnh đại diện
          </h3>

          {/* Avatar Section */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Ảnh đại diện</h4>
            <div className="flex items-center gap-4">
              <img
                src={user?.avatar || '/default-avatar.png'}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
              />
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">
                  <FaCamera />
                  Chọn ảnh mới
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG tối đa 5MB</p>
              </div>
            </div>
          </div>

          {/* Cover Photo Section */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Ảnh bìa</h4>
            <div className="space-y-3">
              <img
                src={user?.cover_avatar || '/default-cover.jpg'}
                alt="Cover"
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
              />
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">
                  <FaCamera />
                  Chọn ảnh bìa mới
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG tối đa 5MB</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Đổi mật khẩu
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...registerPassword('old_password', { required: 'Vui lòng nhập mật khẩu hiện tại' })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errorsPassword.old_password && (
                <p className="text-red-500 text-xs mt-1">{errorsPassword.old_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  {...registerPassword('new_password', { 
                    required: 'Vui lòng nhập mật khẩu mới',
                    minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                  })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errorsPassword.new_password && (
                <p className="text-red-500 text-xs mt-1">{errorsPassword.new_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...registerPassword('confirm_password', { 
                    required: 'Vui lòng xác nhận mật khẩu mới',
                    validate: value => value === newPassword || 'Mật khẩu xác nhận không khớp'
                  })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Xác nhận mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errorsPassword.confirm_password && (
                <p className="text-red-500 text-xs mt-1">{errorsPassword.confirm_password.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <FaSave />
              {changePasswordMutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
