import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FaPlus, FaTrash, FaUtensils, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { createRecipe, getCategoryRecipes } from '../../../../apis/recipeApi'
import { schemaCreateRecipe } from '../../../../utils/rules'
import Input from '../../../../components/InputComponents/Input'
import TextArea from '../../../../components/InputComponents/TextArea'

export default function CreateRecipeModal({ onClose, onRecipeCreated }) {
  const [ingredients, setIngredients] = useState([{ name: '', amount: '', unit: '' }])
  const [instructions, setInstructions] = useState([''])
  const [tags, setTags] = useState([''])
  const [imageSource, setImageSource] = useState('file')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showNutrition, setShowNutrition] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaCreateRecipe),
    defaultValues: {
      title: '',
      image: '',
      imageUrl: '',
      description: '',
      category_recipe_id: 'DEFAULT',
      content: '',
      video: '',
  time: '15',
  difficult_level: '0',
  region: '0',
  processing_food: 'Khác',
      energy: '',
      protein: '',
      fat: '',
      carbohydrate: ''
    }
  })

  // Ingredient management
  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }])
  }

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients]
    newIngredients[index][field] = value
    setIngredients(newIngredients)
  }

  // Instruction management
  const addInstruction = () => {
    setInstructions([...instructions, ''])
  }

  const removeInstruction = (index) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index))
    }
  }

  const updateInstruction = (index, value) => {
    const newInstructions = [...instructions]
    newInstructions[index] = value
    setInstructions(newInstructions)
  }

  // Tag management
  const addTag = () => {
    setTags([...tags, ''])
  }

  const removeTag = (index) => {
    if (tags.length > 1) {
      setTags(tags.filter((_, i) => i !== index))
    }
  }

  const updateTag = (index, value) => {
    const newTags = [...tags]
    newTags[index] = value
    setTags(newTags)
  }

  // Default categories fallback
  const defaultCategories = [
    { _id: 'mon-chinh', name: 'Món chính' },
    { _id: 'mon-phu', name: 'Món phụ' },
    { _id: 'mon-chay', name: 'Món chay' },
    { _id: 'mon-an-vat', name: 'Món ăn vặt' },
    { _id: 'mon-nuong', name: 'Món nướng' },
    { _id: 'mon-xao', name: 'Món xào' },
    { _id: 'mon-luoc', name: 'Món luộc/hấp' },
    { _id: 'mon-canh', name: 'Canh/Súp' },
    { _id: 'mon-trang-mieng', name: 'Món tráng miệng' },
    { _id: 'do-uong', name: 'Đồ uống' },
    { _id: 'banh-keo', name: 'Bánh kẹo' },
    { _id: 'mon-an-sang', name: 'Món ăn sáng' },
    { _id: 'mon-an-nhanh', name: 'Món ăn nhanh' },
    { _id: 'mon-truyen-thong', name: 'Món truyền thống' },
    { _id: 'mon-hien-dai', name: 'Món hiện đại' }
  ]

  // Get categories
  const { data: category, isFetching } = useQuery({
    queryKey: ['category-recipe'],
    queryFn: () => getCategoryRecipes()
  })

  const categoriesFromApi = useMemo(() => category?.data?.result ?? [], [category?.data])

  // Use backend categories if available, fallback to default
  const availableCategories = categoriesFromApi.length > 0 ? categoriesFromApi : defaultCategories

  const difficultyOptions = [
    { value: '0', label: 'Dễ' },
    { value: '1', label: 'Trung bình' },
    { value: '2', label: 'Khó' }
  ]

  const regionOptions = [
    { value: '0', label: 'Miền Bắc' },
    { value: '1', label: 'Miền Trung' },
    { value: '2', label: 'Miền Nam' },
    { value: '3', label: 'Món Á' },
    { value: '4', label: 'Món Âu' }
  ]

  const processingOptions = [
    { value: 'Nướng', label: 'Nướng' },
    { value: 'Xào', label: 'Xào' },
    { value: 'Luộc', label: 'Luộc' },
    { value: 'Hấp', label: 'Hấp' },
    { value: 'Chiên', label: 'Chiên' },
    { value: 'Rim', label: 'Rim' },
    { value: 'Nấu', label: 'Nấu' },
    { value: 'Ướp', label: 'Ướp' },
    { value: 'Trộn', label: 'Trộn' },
    { value: 'Sống', label: 'Sống (salad, gỏi)' },
    { value: 'Hầm', label: 'Hầm' },
    { value: 'Nướng lò', label: 'Nướng lò' },
    { value: 'Khác', label: 'Khác' }
  ]

  const watchedTime = watch('time')
  const watchedDifficulty = watch('difficult_level')
  const watchedRegion = watch('region')
  const watchedProcessing = watch('processing_food')
  const watchedCategory = watch('category_recipe_id')

  useEffect(() => {
    if (categoriesFromApi.length > 0 && watchedCategory === 'DEFAULT') {
      setValue('category_recipe_id', categoriesFromApi[0]._id, { shouldValidate: true })
    }
  }, [categoriesFromApi, watchedCategory, setValue])

  const getOptionLabel = (options, value) => options.find((option) => option.value === value)?.label

  const advancedSummary = [
    watchedTime ? `${watchedTime} phút` : null,
    getOptionLabel(difficultyOptions, watchedDifficulty),
    getOptionLabel(regionOptions, watchedRegion),
    getOptionLabel(processingOptions, watchedProcessing)
  ]
    .filter(Boolean)
    .join(' • ')

  // Ensure the correct field resets when switching source
  useEffect(() => {
    if (imageSource === 'file') {
      setValue('imageUrl', '', { shouldValidate: true })
    } else {
      setValue('image', null, { shouldValidate: true })
    }
  }, [imageSource, setValue])

  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: (body) => createRecipe(body)
  })

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData()
    
    // Filter out empty ingredients, instructions, and tags
    const validIngredients = ingredients.filter(ing => ing.name.trim() !== '')
    const validInstructions = instructions.filter(inst => inst.trim() !== '')
    const validTags = tags.filter(tag => tag.trim() !== '')

    // Validate required fields
    if (validIngredients.length === 0) {
      toast.error('Vui lòng thêm ít nhất một nguyên liệu')
      return
    }
    
    if (validInstructions.length === 0) {
      toast.error('Vui lòng thêm ít nhất một bước hướng dẫn')
      return
    }

    // Basic recipe data
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('category_recipe_id', data.category_recipe_id)
    formData.append('content', data.content || data.description) // Use description as content if no separate content
    formData.append('video', data.video || '')
  formData.append('time', Number(data.time) || 15)
  formData.append('difficult_level', Number(data.difficult_level) || 0)
  formData.append('region', Number(data.region) || 0)
  formData.append('processing_food', data.processing_food || 'Khác')

    // Nutrition data
    formData.append('energy', Number(data.energy) || 0)
    formData.append('protein', Number(data.protein) || 0)
    formData.append('fat', Number(data.fat) || 0)
    formData.append('carbohydrate', Number(data.carbohydrate) || 0)

    // Complex data as JSON strings
    formData.append('ingredients', JSON.stringify(validIngredients))
    formData.append('instructions', JSON.stringify(validInstructions))
    formData.append('tags', JSON.stringify(validTags))

    // Image handling (file upload or URL)
    if (imageSource === 'file') {
      if (data.image && data.image[0]) {
        formData.append('image', data.image[0])
      }
    } else if (data.imageUrl) {
      formData.append('imageUrl', data.imageUrl)
    }

    createRecipeMutation.mutate(formData, {
      onSuccess: (response) => {
        const successMessage = response?.data?.message || 'Tạo công thức thành công!'
        reset()
        setIngredients([{ name: '', amount: '', unit: '' }])
        setInstructions([''])
        setTags([''])
        setImageSource('file')
  setShowAdvanced(false)
  setShowNutrition(false)
        toast.success(successMessage)
        if (onRecipeCreated) onRecipeCreated(response)
        onClose()
      },
      onError: (error) => {
        console.error(error)
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo công thức'
        toast.error(errorMessage)
      }
    })
  })

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FaUtensils className="mr-2 text-green-500" />
            Thông tin cơ bản
          </h3>

          {/* Title */}
          <Input
            title='Tên món ăn'
            type='text'
            name='title'
            id='title'
            placeholder='Nhập tên món ăn'
            register={register}
            errors={errors.title}
            isRequired
          />

          {/* Description */}
          <TextArea
            title='Mô tả món ăn'
            name='description'
            id='description'
            placeholder='Mô tả ngắn về món ăn'
            register={register}
            errors={errors.description}
            rows={3}
            isRequired
          />

          {/* Image */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Hình ảnh món ăn <span className='text-red-500'>*</span>
            </label>

            <div className='flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='radio'
                  name='imageSource'
                  value='file'
                  checked={imageSource === 'file'}
                  onChange={() => setImageSource('file')}
                />
                <span>Tải ảnh lên</span>
              </label>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='radio'
                  name='imageSource'
                  value='url'
                  checked={imageSource === 'url'}
                  onChange={() => setImageSource('url')}
                />
                <span>Dùng link ảnh</span>
              </label>
            </div>

            {imageSource === 'file' ? (
              <>
                <input
                  className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100'
                  type='file'
                  accept='image/*'
                  {...register('image')}
                />
                {errors.image && <p className='text-red-500 text-xs mt-1'>{errors.image.message}</p>}
              </>
            ) : (
              <>
                <Input
                  title='Đường dẫn ảnh'
                  type='url'
                  name='imageUrl'
                  id='imageUrl'
                  placeholder='https://example.com/your-image.jpg'
                  register={register}
                  errors={errors.imageUrl}
                />
              </>
            )}

            {errors?.image_combined && (
              <p className='text-red-500 text-xs mt-1'>{errors.image_combined.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Thể loại món ăn <span className='text-red-500'>*</span>
            </label>
            <select
              {...register('category_recipe_id')}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              disabled={categoriesFromApi.length === 0}
            >
              <option value='DEFAULT' disabled>
                {isFetching ? 'Đang tải...' : 'Chọn thể loại'}
              </option>
              {availableCategories?.map((cat) => {
                const categoryLabel = cat.category_recipe_name || cat.name || 'Không xác định'
                const optionValue = categoriesFromApi.length > 0 ? cat._id : 'DEFAULT'
                const optionKey = cat._id || cat.name || categoryLabel
                return (
                <option
                    key={optionKey}
                    value={optionValue}
                  >
                    {categoryLabel}
                  </option>
                )
              })}
            </select>
            {errors.category_recipe_id && (
              <p className='text-red-500 text-xs mt-1'>{errors.category_recipe_id.message}</p>
            )}
            {categoriesFromApi.length === 0 && (
              <p className='text-xs text-gray-500 mt-1'>
                Không lấy được danh sách thể loại từ hệ thống, vui lòng thử lại sau.
              </p>
            )}
          </div>

          {/* Advanced settings card */}
          <div className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
            <button
              type='button'
              onClick={() => setShowAdvanced((prev) => !prev)}
              className='w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200'
            >
              <span>Tuỳ chọn nâng cao</span>
              <div className='flex items-center gap-3 text-xs md:text-sm text-gray-500 dark:text-gray-400'>
                <span>{advancedSummary || 'Đang dùng thiết lập mặc định'}</span>
                {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
              </div>
            </button>
            <div
              className={`px-4 py-4 space-y-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${showAdvanced ? 'block' : 'hidden'}`}
            >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Input
                    title='Thời gian nấu (phút)'
                    type='number'
                    name='time'
                    id='time'
                    placeholder='15'
                    register={register}
                    errors={errors.time}
                    isRequired
                  />
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      Mức độ khó <span className='text-red-500'>*</span>
                    </label>
                    <select
                      {...register('difficult_level')}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    >
                      {difficultyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.difficult_level && (
                      <p className='text-red-500 text-xs mt-1'>{errors.difficult_level.message}</p>
                    )}
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      Vùng miền <span className='text-red-500'>*</span>
                    </label>
                    <select
                      {...register('region')}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    >
                      {regionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.region && (
                      <p className='text-red-500 text-xs mt-1'>{errors.region.message}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      Phương thức chế biến <span className='text-red-500'>*</span>
                    </label>
                    <select
                      {...register('processing_food')}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    >
                      {processingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.processing_food && (
                      <p className='text-red-500 text-xs mt-1'>{errors.processing_food.message}</p>
                    )}
                  </div>
                </div>

                <Input
                  title='Link video hướng dẫn (YouTube)'
                  type='url'
                  name='video'
                  id='video'
                  placeholder='https://www.youtube.com/watch?v=...'
                  register={register}
                  errors={errors.video}
                />

                {/* Tags Section */}
                <div className='space-y-3'>
                  <h4 className='text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide'>Từ khóa</h4>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>Sử dụng để gợi ý tìm kiếm (không bắt buộc).</p>
                  {tags.map((tag, index) => (
                    <div key={index} className='flex gap-2 items-center'>
                      <input
                        type='text'
                        placeholder='Nhập từ khóa'
                        value={tag}
                        onChange={(e) => updateTag(index, e.target.value)}
                        className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm'
                      />
                      <button
                        type='button'
                        onClick={() => removeTag(index)}
                        className='p-2 text-red-500 hover:text-red-700 disabled:opacity-50'
                        disabled={tags.length === 1}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <button
                    type='button'
                    onClick={addTag}
                    className='flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 text-sm'
                  >
                    <FaPlus /> Thêm từ khóa
                  </button>
                </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">Nguyên liệu <span className='text-red-500'>*</span></h4>
          {ingredients.map((ingredient, index) => (
            <div key={index} className='flex gap-2 items-center'>
              <input
                type='text'
                placeholder='Tên nguyên liệu'
                value={ingredient.name}
                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm'
              />
              <input
                type='text'
                placeholder='Số lượng'
                value={ingredient.amount}
                onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                className='w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm'
              />
              <input
                type='text'
                placeholder='Đơn vị'
                value={ingredient.unit}
                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                className='w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm'
              />
              <button
                type='button'
                onClick={() => removeIngredient(index)}
                className='p-2 text-red-500 hover:text-red-700 disabled:opacity-50'
                disabled={ingredients.length === 1}
              >
                <FaTrash />
              </button>
            </div>
          ))}
          <button
            type='button'
            onClick={addIngredient}
            className='flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 text-sm'
          >
            <FaPlus /> Thêm nguyên liệu
          </button>
        </div>

        {/* Instructions Section */}
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">Cách thực hiện <span className='text-red-500'>*</span></h4>
          {instructions.map((instruction, index) => (
            <div key={index} className='flex gap-2 items-start'>
              <span className='text-sm font-medium w-8 mt-2'>{index + 1}.</span>
              <textarea
                placeholder='Mô tả bước thực hiện'
                value={instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm'
                rows='2'
              />
              <button
                type='button'
                onClick={() => removeInstruction(index)}
                className='p-2 text-red-500 hover:text-red-700 disabled:opacity-50 mt-1'
                disabled={instructions.length === 1}
              >
                <FaTrash />
              </button>
            </div>
          ))}
          <button
            type='button'
            onClick={addInstruction}
            className='flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 text-sm'
          >
            <FaPlus /> Thêm bước
          </button>
        </div>

        {/* Nutrition Section */}
        <div className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <button
            type='button'
            onClick={() => setShowNutrition((prev) => !prev)}
            className='w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200'
          >
            <span>Thông tin dinh dưỡng (trên 100g)</span>
            {showNutrition ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showNutrition && (
            <div className='px-4 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700'>
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-4'>Bỏ trống nếu chưa có thông tin chính xác.</p>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                <Input
                  title='Calo (kcal)'
                  type='number'
                  name='energy'
                  id='energy'
                  placeholder='0'
                  register={register}
                  errors={errors.energy}
                />
                <Input
                  title='Protein (g)'
                  type='number'
                  name='protein'
                  id='protein'
                  placeholder='0'
                  register={register}
                  errors={errors.protein}
                />
                <Input
                  title='Chất béo (g)'
                  type='number'
                  name='fat'
                  id='fat'
                  placeholder='0'
                  register={register}
                  errors={errors.fat}
                />
                <Input
                  title='Carbs (g)'
                  type='number'
                  name='carbohydrate'
                  id='carbohydrate'
                  placeholder='0'
                  register={register}
                  errors={errors.carbohydrate}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createRecipeMutation.isPending}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createRecipeMutation.isPending ? 'Đang tạo...' : 'Tạo món ăn'}
          </button>
        </div>
      </form>
    </div>
  )
}
