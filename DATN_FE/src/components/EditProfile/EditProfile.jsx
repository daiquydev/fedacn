import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useState, useContext, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FaUser, FaSave, FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { updateProfile, changePassword } from '../../apis/userApi'
import { AppContext } from '../../contexts/app.context'
import Input from '../../components/InputComponents/Input'

const GENDER_OPTIONS = [
  { value: '', label: 'Chọn giới tính' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
]

// Password strength rules matching BE validation
const PASSWORD_RULES = [
  { id: 'length', label: 'Ít nhất 6 ký tự', test: (v) => v && v.length >= 6 },
  { id: 'lowercase', label: 'Có chữ thường (a-z)', test: (v) => /[a-z]/.test(v || '') },
  { id: 'uppercase', label: 'Có chữ hoa (A-Z)', test: (v) => /[A-Z]/.test(v || '') },
  { id: 'number', label: 'Có chữ số (0-9)', test: (v) => /[0-9]/.test(v || '') },
  { id: 'symbol', label: 'Có ký tự đặc biệt (!@#$...)', test: (v) => /[!@#$%^&*(),.?":{}|<>_\-+=\\[\]\/~`]/.test(v || '') }
]

function PasswordStrengthIndicator({ password }) {
  if (!password) return null
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length

  return (
    <div className='mt-3 space-y-1.5'>
      <div className='flex gap-1'>
        {PASSWORD_RULES.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < passed
                ? passed <= 2
                  ? 'bg-red-400'
                  : passed <= 3
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <div className='space-y-1'>
        {PASSWORD_RULES.map((rule) => (
          <div key={rule.id} className='flex items-center gap-1.5 text-xs'>
            {rule.test(password) ? (
              <FaCheckCircle className='text-emerald-500 flex-shrink-0' />
            ) : (
              <FaTimesCircle className='text-gray-300 dark:text-gray-600 flex-shrink-0' />
            )}
            <span className={rule.test(password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EditProfile({ user, onClose, onProfileUpdated }) {
  const { setProfile, profile } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('basic')
  const isGoogleOnlyAccount =
    user?.auth_provider === 'google' || profile?.auth_provider === 'google'
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Basic profile form
  const {
    register: registerBasic,
    handleSubmit: handleSubmitBasic,
    reset: resetBasic,
    formState: { errors: errorsBasic }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      user_name: user?.user_name || '',
      birthday: user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      address: user?.address || '',
      gender: user?.gender || ''
    }
  })

  useEffect(() => {
    if (!user) return
    resetBasic({
      name: user.name || '',
      user_name: user.user_name || '',
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      address: user.address || '',
      gender: user.gender && ['male', 'female', 'other'].includes(user.gender) ? user.gender : ''
    })
  }, [user, resetBasic])

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword }
  } = useForm()

  // Mutations
  const updateProfileMutation = useSafeMutation({
    mutationFn: (data) => updateProfile(data)
  })

  const changePasswordMutation = useSafeMutation({
    mutationFn: (data) => changePassword(data)
  })

  const buildUpdateProfileBody = (v) => {
    const body = {}
    if (v.name != null && String(v.name).trim() !== '') body.name = String(v.name).trim()
    if (v.user_name != null && String(v.user_name).trim() !== '') body.user_name = String(v.user_name).trim()
    if (v.birthday) body.birthday = v.birthday
    if (v.address != null && String(v.address).trim() !== '') body.address = String(v.address).trim()
    if (['male', 'female', 'other'].includes(v.gender)) body.gender = v.gender
    return body
  }

  // Handlers
  const handleBasicSubmit = handleSubmitBasic((formValues) => {
    const data = buildUpdateProfileBody(formValues)
    updateProfileMutation.mutate(data, {
      onSuccess: (response) => {
        toast.success('Cập nhật thông tin thành công!')
        const updatedUser = response.data?.result
        setProfile((prevProfile) => ({ ...prevProfile, ...(updatedUser || data) }))
        if (onProfileUpdated) onProfileUpdated(updatedUser)
      },
      onError: (error) => {
        const msg = error?.response?.data?.errors?.[0]?.msg || 'Có lỗi xảy ra khi cập nhật thông tin'
        toast.error(msg)
      }
    })
  })

  const handlePasswordSubmit = handleSubmitPassword((data) => {
    changePasswordMutation.mutate(
      {
        old_password: data.old_password,
        new_password: data.new_password
      },
      {
        onSuccess: () => {
          toast.success('Đổi mật khẩu thành công!')
          resetPassword()
        },
        onError: (error) => {
          const msg = error?.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu'
          toast.error(msg)
        }
      }
    )
  })

  const newPassword = watchPassword('new_password')

  return (
    <div className='max-h-[80vh] overflow-y-auto'>
      {/* Tabs */}
      <div className='flex border-b border-gray-200 dark:border-gray-700 mb-6'>
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
        <form onSubmit={handleBasicSubmit} className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4'>
            <FaUser className='mr-2 text-green-500' />
            Thông tin cơ bản
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Input
              title='Họ và tên'
              type='text'
              name='name'
              id='edit-name'
              placeholder='Nhập họ và tên'
              register={registerBasic}
              errors={errorsBasic.name}
            />

            <Input
              title='Tên người dùng'
              type='text'
              name='user_name'
              id='edit-user_name'
              placeholder='Nhập tên người dùng'
              register={registerBasic}
              errors={errorsBasic.user_name}
            />

            {/* Email - Read-only */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Email</label>
              <input
                type='email'
                value={user?.email || ''}
                readOnly
                disabled
                className='w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              />
              <p className='text-xs text-gray-400 mt-1'>Email không thể thay đổi</p>
            </div>

            {/* Gender dropdown */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Giới tính</label>
              <select
                {...registerBasic('gender')}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              title='Ngày sinh'
              type='date'
              name='birthday'
              id='edit-birthday'
              register={registerBasic}
              errors={errorsBasic.birthday}
            />

            <Input
              title='Địa chỉ'
              type='text'
              name='address'
              id='edit-address'
              placeholder='Nhập địa chỉ'
              register={registerBasic}
              errors={errorsBasic.address}
            />
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            >
              Hủy
            </button>
            <button
              type='submit'
              disabled={updateProfileMutation.isPending}
              className='px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2'
            >
              <FaSave />
              {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && isGoogleOnlyAccount && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2'>
            <FaLock className='text-green-500' />
            Đổi mật khẩu
          </h3>
          <div
            role='status'
            className='rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/35 px-4 py-4 text-sm text-amber-950 dark:text-amber-100'
          >
            <div className='flex gap-3'>
              <FaInfoCircle className='text-xl text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5' aria-hidden />
              <div className='space-y-2'>
                <p className='font-medium text-amber-900 dark:text-amber-50'>Tài khoản đăng nhập bằng Google</p>
                <p className='text-amber-900/90 dark:text-amber-100/90 leading-relaxed'>
                  Bạn đang dùng Google để đăng nhập. Mật khẩu tài khoản này do Google quản lý — bạn không thể đổi mật
                  khẩu tại đây. Để thay đổi mật khẩu đăng nhập, vui lòng dùng phần bảo mật trong tài khoản Google của
                  bạn.
                </p>
              </div>
            </div>
          </div>
          <div className='flex justify-end pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {activeTab === 'password' && !isGoogleOnlyAccount && (
        <form onSubmit={handlePasswordSubmit} className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4'>
            <FaLock className='mr-2 text-green-500' />
            Đổi mật khẩu
          </h3>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Mật khẩu hiện tại
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...registerPassword('old_password', { required: 'Vui lòng nhập mật khẩu hiện tại' })}
                  className='w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='Nhập mật khẩu hiện tại'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errorsPassword.old_password && (
                <p className='text-red-500 text-xs mt-1'>{errorsPassword.old_password.message}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Mật khẩu mới</label>
              <div className='relative'>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  {...registerPassword('new_password', {
                    required: 'Vui lòng nhập mật khẩu mới',
                    validate: (value) => {
                      if (!PASSWORD_RULES.every((rule) => rule.test(value))) {
                        return 'Mật khẩu chưa đủ mạnh, vui lòng kiểm tra các yêu cầu bên dưới'
                      }
                      return true
                    }
                  })}
                  className='w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='Nhập mật khẩu mới'
                />
                <button
                  type='button'
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errorsPassword.new_password && (
                <p className='text-red-500 text-xs mt-1'>{errorsPassword.new_password.message}</p>
              )}
              <PasswordStrengthIndicator password={newPassword} />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Xác nhận mật khẩu mới
              </label>
              <div className='relative'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...registerPassword('confirm_password', {
                    required: 'Vui lòng xác nhận mật khẩu mới',
                    validate: (value) => value === newPassword || 'Mật khẩu xác nhận không khớp'
                  })}
                  className='w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='Xác nhận mật khẩu mới'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errorsPassword.confirm_password && (
                <p className='text-red-500 text-xs mt-1'>{errorsPassword.confirm_password.message}</p>
              )}
            </div>
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            >
              Hủy
            </button>
            <button
              type='submit'
              disabled={changePasswordMutation.isPending}
              className='px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2'
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
