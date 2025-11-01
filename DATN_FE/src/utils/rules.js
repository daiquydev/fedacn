import * as yup from 'yup'

export const schemaLogin = yup.object({
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không đúng định dạng')
    .min(5, 'Độ dài từ 5 - 160 ký tự')
    .max(160, 'Độ dài từ 5 - 160 ký tự'),
  password: yup
    .string()
    .required('Password là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
    .max(160, 'Độ dài từ 6 - 160 ký tự')
})

export const schemaLoginAdmin = yup.object({
  user_name: yup
    .string()
    .required('Tên tài khoản là bắt buộc')
    .min(5, 'Độ dài từ 5 - 160 ký tự')
    .max(160, 'Độ dài từ 5 - 160 ký tự'),
  password: yup
    .string()
    .required('Password là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
    .max(160, 'Độ dài từ 6 - 160 ký tự')
})

export const schemaRegister = yup.object({
  name: yup.string().required('Tên là bắt buộc').min(3, 'Độ dài từ 5 - 160 ký tự').max(160, 'Độ dài từ 5 - 160 ký tự'),
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không đúng định dạng')
    .min(5, 'Độ dài từ 3 - 160 ký tự')
    .max(160, 'Độ dài từ 3 - 160 ký tự'),
  password: yup
    .string()
    .required('Password là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
    .max(160, 'Độ dài từ 6 - 160 ký tự'),
  confirm_password: yup
    .string()
    .required('Password là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
    .max(160, 'Độ dài từ 6 - 160 ký tự')
    .oneOf([yup.ref('password'), null], 'Mật khẩu không khớp')
})

export const schemaResetPassword = yup.object({
  new_password: yup
    .string()
    .required('Mật khẩu mới là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
    .max(160, 'Độ dài từ 6 - 160 ký tự'),
  confirm_password: yup
    .string()
    .required('Mật khẩu là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
    .max(160, 'Độ dài từ 6 - 160 ký tự')
    .oneOf([yup.ref('new_password'), null], 'Mật khẩu không khớp')
})

export const schemaCreateBlog = yup.object({
  title: yup.string().required('Tiêu đề là bắt buộc').min(10, 'Độ dài từ 10 ký tự').max(160, 'Độ dài tối đa 160 ký tự'),
  image: yup.string().required('Link ảnh là bắt buộc').url('Link ảnh không đúng định dạng'),
  description: yup.string().required('Mô tả là bắt buộc').min(10, 'Độ dài từ 10 ký tự'),
  // nếu category_blog_id = DEFAULT thì sẽ báo lỗi
  category_blog_id: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 thể loại blog'),
  content: yup.string().required('Nội dung là bắt buộc').min(10, 'Độ dài từ 100 ký tự')
})

export const schemaRequestUpgrade = yup.object({
  proof: yup.string().required('Link minh chứng là bắt buộc').url('Link minh chứng không đúng định dạng'),
  reason: yup.string().required('Lý do là bắt buộc').min(10, 'Độ dài từ 10 ký tự')
})

export const schemaCreateAlbum = yup.object({
  title: yup.string().required('Tiêu đề là bắt buộc').min(10, 'Độ dài từ 10 ký tự').max(160, 'Độ dài tối đa 160 ký tự'),
  image: yup.string().required('Link ảnh là bắt buộc').url('Link ảnh không đúng định dạng'),
  category_album: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 thể loại album'),
  description: yup.string().required('Mô tả là bắt buộc').min(10, 'Độ dài từ 10 ký tự')
})

export const schemaCreateRecipe = yup
  .object({
    title: yup
      .string()
      .trim()
      .required('Tiêu đề là bắt buộc')
      .max(160, 'Độ dài tối đa 160 ký tự'),
    image: yup
      .mixed()
      .test('fileType', 'Ảnh phải có định dạng jpg, jpeg, png, gif, webp', (value) => {
        if (!value || !value[0]) return true
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        return allowedTypes.includes(value[0]?.type)
      }),
    imageUrl: yup
      .string()
      .trim()
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .url('Link ảnh không đúng định dạng'),
    description: yup
      .string()
      .trim()
      .required('Mô tả là bắt buộc'),
    category_recipe_id: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 thể loại món ăn'),
    content: yup
      .string()
      .trim()
      .transform((value) => (value === '' ? null : value))
      .nullable(),
    time: yup.number().typeError('Thời gian là bắt buộc').required('Thời gian là bắt buộc').min(1, 'Thời gian phải lớn hơn 0'),
    difficult_level: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 mức độ khó'),
    region: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 khu vực'),
    processing_food: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 phương thức chế biến'),
    video: yup
      .string()
      .trim()
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .url('Link video không đúng định dạng')
  })
  .test('image-required', 'Hãy cung cấp hình ảnh món ăn', function (value) {
    const hasFile = value?.image && value.image[0]
    const hasUrl = Boolean(value?.imageUrl)
    if (hasFile || hasUrl) {
      return true
    }
    return this.createError({ path: 'image_combined', message: 'Hãy cung cấp hình ảnh món ăn' })
  })

export const schemaSearchImage = yup.object({
  image: yup
    .mixed()
    .required('Ảnh là bắt buộc')
    .test('fileType', 'Ảnh phải có định dạng jpg', (value) => {
      if (value) {
        return value && value[0]?.type === 'image/jpeg'
      }
      return false
    })
})

export const schemaUpdateRecipe = yup.object({
  title: yup.string().required('Tiêu đề là bắt buộc').min(10, 'Độ dài từ 10 ký tự').max(160, 'Độ dài tối đa 160 ký tự'),
  description: yup.string().required('Mô tả là bắt buộc').min(10, 'Độ dài từ 10 ký tự'),
  // nếu category_recipe_id = DEFAULT thì sẽ báo lỗi
  category_recipe_id: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 thể loại món ăn'),
  content: yup.string().required('Nội dung là bắt buộc').min(10, 'Độ dài từ 100 ký tự'),
  time: yup.number().required('Thời gian là bắt buộc').min(1, 'Thời gian phải lớn hơn 0'),
  difficult_level: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 mức độ khó'),
  region: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 khu vực'),
  processing_food: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn 1 loại thực phẩm'),
  // video là url không bắt buộc phải có định dạng
  video: yup.string().url('Link video không đúng định dạng')
})

export const schemaCreateReport = yup.object({
  reason: yup.string().required('Lý do là bắt buộc').min(10, 'Độ dài từ 10 ký tự').max(160, 'Độ dài tối đa 160 ký tự')
})

export const schemaBMI = yup.object({
  height: yup.number().required('Chiều cao là bắt buộc').min(1, 'Chiều cao phải lớn hơn 0'),
  weight: yup.number().required('Cân nặng là bắt buộc').min(1, 'Cân nặng phải lớn hơn 0')
})

export const schemaBMR = yup.object({
  age: yup.number().required('Tuổi là bắt buộc').min(1, 'Tuổi phải lớn hơn 0'),
  weight: yup.number().required('Cân nặng là bắt buộc').min(1, 'Cân nặng phải lớn hơn 0'),
  height: yup.number().required('Chiều cao là bắt buộc').min(1, 'Chiều cao phải lớn hơn 0')
})

export const schemaTDEE = yup.object({
  age: yup.number().required('Tuổi là bắt buộc').min(1, 'Tuổi phải lớn hơn 0'),
  weight: yup.number().required('Cân nặng là bắt buộc').min(1, 'Cân nặng phải lớn hơn 0'),
  height: yup.number().required('Chiều cao là bắt buộc').min(1, 'Chiều cao phải lớn hơn 0'),
  //nếu activity = DEFAULT thì sẽ báo lỗi
  activity: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn mức độ hoạt động')
})

export const schemaIBW = yup.object({
  height: yup.number().required('Chiều cao là bắt buộc').min(1, 'Chiều cao phải lớn hơn 0')
})

export const schemaLBM = yup.object({
  weight: yup.number().required('Cân nặng là bắt buộc').min(1, 'Cân nặng phải lớn hơn 0'),
  height: yup.number().required('Chiều cao là bắt buộc').min(1, 'Chiều cao phải lớn hơn 0')
})

export const schemaBodyFat = yup.object({
  height: yup.number().required('Chiều cao là bắt buộc').min(1, 'Chiều cao phải lớn hơn 0'),
  hip: yup.number().required('Vòng mông là bắt buộc').min(1, 'Vòng mông phải lớn hơn 0'),
  waist: yup.number().required('Vòng eo là bắt buộc').min(1, 'Vòng eo phải lớn hơn 0'),
  neck: yup.number().required('Vòng cổ là bắt buộc').min(1, 'Vòng cổ phải lớn hơn 0')
})

export const schemaWaterPerDay = yup.object({
  weight: yup.number().required('Cân nặng là bắt buộc').min(1, 'Cân nặng phải lớn hơn 0'),
  time: yup.number().required('Thời gian là bắt buộc').min(1, 'Thời gian phải lớn hơn 0')
})

export const schemaCaloriesBurned = yup.object({
  weight: yup.number().required('Cân nặng là bắt buộc').min(1, 'Cân nặng phải lớn hơn 0'),
  time: yup.number().required('Thời gian là bắt buộc').min(1, 'Thời gian phải lớn hơn 0'),
  met: yup.number().required('MET là bắt buộc').min(1, 'MET phải lớn hơn 0')
})

export const schemaCreateWorkout = yup.object({
  name: yup.string().required('Tên là bắt buộc').min(3, 'Độ dài từ 3 - 160 ký tự').max(160, 'Độ dài từ 3 - 160 ký tự'),
  weight: yup.number().required('Cân nặng là bắt buộc').min(1, 'Cân nặng phải lớn hơn 0'),
  calo_target: yup.number().required('Lượng calo là bắt buộc').min(1, 'Lượng calo phải lớn hơn 0'),
  // ngày bắt đầu phải nhỏ hơn ngày kết thúc
  start_date: yup
    .date()
    .required('Ngày bắt đầu là bắt buộc')
    .max(yup.ref('end_date'), 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'),
  end_date: yup.date().required('Ngày kết thúc là bắt buộc')
})

export const schemaCreateMeal = yup.object({
  name: yup.string().required('Tên là bắt buộc').min(3, 'Độ dài từ 3 - 160 ký tự').max(160, 'Độ dài từ 3 - 160 ký tự'),
  // nếu không nhập weight_target thì cho giá trị mặc định là 0
  // ngày bắt đầu phải nhỏ hơn ngày kết thúc
  start_date: yup
    .date()
    .required('Ngày bắt đầu là bắt buộc')
    .max(yup.ref('end_date'), 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'),
  end_date: yup.date().required('Ngày kết thúc là bắt buộc'),
  // purpose là giá trị của select nếu = DEFAULT thì sẽ báo lỗi
  purpose: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn mục đích')
})

export const schemaUpdateMeal = yup.object({
  name: yup.string().required('Tên là bắt buộc').min(3, 'Độ dài từ 3 - 160 ký tự').max(160, 'Độ dài từ 3 - 160 ký tự'),
  end_date: yup.date().required('Ngày kết thúc là bắt buộc'),
  // purpose là giá trị của select nếu = DEFAULT thì sẽ báo lỗi
  purpose: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn mục đích')
})

export const schemaUpdateWorkout = yup.object({
  name: yup.string().required('Tên là bắt buộc').min(3, 'Độ dài từ 3 - 160 ký tự').max(160, 'Độ dài từ 3 - 160 ký tự'),
  calo_target: yup.number().required('Lượng calo là bắt buộc').min(1, 'Lượng calo phải lớn hơn 0'),
  // ngày bắt đầu phải nhỏ hơn ngày kết thúc
  end_date: yup.date().required('Ngày kết thúc là bắt buộc')
})

export const schemaAddItemWorkout = yup.object({
  activity_name: yup
    .string()
    .required('Hoạt động là bắt buộc')
    .min(3, 'Độ dài từ 3 - 160 ký tự')
    .max(160, 'Độ dài từ 3 - 160 ký tự'),
  time: yup.number().required('Thời gian là bắt buộc').min(1, 'Thời gian phải lớn hơn 0'),
  met: yup.number().required('MET là bắt buộc').min(1, 'MET phải lớn hơn 0')
})

export const schemaAddItemMeal = yup.object({
  meal_name: yup
    .string()
    .required('Tên món ăn là bắt buộc')
    .min(3, 'Độ dài từ 3 - 160 ký tự')
    .max(160, 'Độ dài từ 3 - 160 ký tự'),
  quantity: yup.number().required('Số lượng là bắt buộc').min(1, 'Số lượng phải lớn hơn 0'),
  // unit là giá trị của select nếu = DEFAULT thì sẽ báo lỗi
  unit: yup.string().notOneOf(['DEFAULT'], 'Hãy chọn đơn vị'),
  energy: yup.number().required('Năng lượng là bắt buộc').min(1, 'Năng lượng phải lớn hơn 0'),
  protein: yup.number().required('Protein là bắt buộc').min(1, 'Protein phải lớn hơn 0'),
  fat: yup.number().required('Fat là bắt buộc').min(1, 'Fat phải lớn hơn 0'),
  carb: yup.number().required('Carb là bắt buộc').min(1, 'Carb phải lớn hơn 0')
})

export const schemaAddTimeWorkout = yup.object({
  time: yup.number().required('Thời gian là bắt buộc').min(1, 'Thời gian phải lớn hơn 0')
})

export const schemaAddQuantityMeal = yup.object({
  quantity: yup.number().required('Số lượng là bắt buộc').min(1, 'Số lượng phải lớn hơn 0')
})

export const schemaUpdateProfile = yup.object({
  name: yup.string().min(6, 'Độ dài từ 6 - 160 ký tự').max(160, 'Độ dài từ 3 - 160 ký tự'),
  birthday: yup.date().required('Ngày sinh là bắt buộc'),
  //user_name là chuỗi liền không có khoảng trắng
  user_name: yup
    .string()
    .min(5, 'Độ dài từ 5 - 160 ký tự')
    .max(160, 'Độ dài từ 5 - 160 ký tự')
    .matches(/^\S*$/, 'Tên tài khoản không được chứa khoảng trắng')
})

export const schemaChangePassword = yup.object({
  old_password: yup
    .string()
    .required('Mật khẩu cũ là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
    .max(160, 'Độ dài từ 6 - 160 ký tự'),
  new_password: yup
    .string()
    .required('Mật khẩu mới là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
    .max(160, 'Độ dài từ 6 - 160 ký tự'),
  confirm_password: yup
    .string()
    .required('Mật khẩu là bắt buộc')
    .min(6, 'Độ dài từ 6 - 160 ký tự')
    .max(160, 'Độ dài từ 6 - 160 ký tự')
    .oneOf([yup.ref('new_password'), null], 'Mật khẩu không khớp')
})

export const schemaSendOtp = yup.object({
  email: yup
    .string()
    .required('Email là bắt buộc')
    .email('Email không đúng định dạng')
    .min(5, 'Độ dài từ 5 - 160 ký tự')
    .max(160, 'Độ dài từ 5 - 160 ký tự')
})

export const schemaHealthProfile = yup.object().shape({
  gender: yup.string().required('Vui lòng chọn giới tính'),
  age: yup
    .number()
    .required('Vui lòng nhập tuổi')
    .positive('Tuổi phải là số dương')
    .integer('Tuổi phải là số nguyên')
    .max(120, 'Tuổi không hợp lệ'),
  height: yup
    .number()
    .required('Vui lòng nhập chiều cao')
    .positive('Chiều cao phải là số dương')
    .min(50, 'Chiều cao tối thiểu là 50cm')
    .max(250, 'Chiều cao tối đa là 250cm'),
  weight: yup
    .number()
    .required('Vui lòng nhập cân nặng')
    .positive('Cân nặng phải là số dương')
    .min(20, 'Cân nặng tối thiểu là 20kg')
    .max(300, 'Cân nặng tối đa là 300kg'),
  activity_level: yup.string().required('Vui lòng chọn mức độ hoạt động'),
  health_goal: yup.string().required('Vui lòng chọn mục tiêu sức khỏe'),
  target_weight: yup
    .number()
    .nullable()
    .transform((value) => (isNaN(value) ? null : value))
    .when('health_goal', {
      is: (val) => val === 'Giảm cân' || val === 'Tăng cân',
      then: (schema) =>
        schema
          .required('Vui lòng nhập cân nặng mục tiêu')
          .positive('Cân nặng mục tiêu phải là số dương')
          .min(20, 'Cân nặng mục tiêu tối thiểu là 20kg')
          .max(300, 'Cân nặng mục tiêu tối đa là 300kg')
    }),
  dietary_preferences: yup.string().nullable(),
  allergies: yup.string().nullable()
})
