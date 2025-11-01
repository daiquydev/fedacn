import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import * as yup from 'yup'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { IoMdHome, IoMdAdd, IoMdRemove } from 'react-icons/io'
import Input from '../../components/InputComponents/Input'
import TextArea from '../../components/InputComponents/TextArea'
import { createRecipe, calculateNutrition } from '../../apis/recipeApi'
import CreateConfirmBox from '../../components/GlobalComponents/CreateConfirmBox'

// Validation schema cho lowdb recipe
const schemaCreateRecipeLowdb = yup.object({
  name: yup.string().required('Tên công thức là bắt buộc').min(3, 'Tên phải có ít nhất 3 ký tự'),
  description: yup.string().required('Mô tả là bắt buộc').min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  servings: yup.number().required('Số phần ăn là bắt buộc').min(1, 'Số phần ăn phải lớn hơn 0'),
  prepTime: yup.number().required('Thời gian chuẩn bị là bắt buộc').min(1, 'Thời gian phải lớn hơn 0'),
  cookTime: yup.number().required('Thời gian nấu là bắt buộc').min(1, 'Thời gian phải lớn hơn 0'),
  difficulty: yup.string().required('Độ khó là bắt buộc'),
  cuisine: yup.string().required('Ẩm thực là bắt buộc'),
  category: yup.string().required('Danh mục là bắt buộc'),
  tags: yup.array().min(1, 'Phải có ít nhất 1 thẻ tag'),
  ingredients: yup.array().min(1, 'Phải có ít nhất 1 nguyên liệu'),
  instructions: yup.array().min(1, 'Phải có ít nhất 1 bước hướng dẫn')
})

export default function CreateRecipeLowdb() {
  const navigate = useNavigate()
  const [openCreate, setOpenCreate] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [nutritionInfo, setNutritionInfo] = useState(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaCreateRecipeLowdb),
    defaultValues: {
      name: '',
      description: '',
      image: '/images/recipes/default.jpg',
      servings: 1,
      prepTime: 15,
      cookTime: 30,
      difficulty: 'easy',
      cuisine: 'vietnamese',
      category: 'Món chính',
      tags: [],
      ingredients: [{ ingredientId: '', quantity: 1, unit: 'g' }],
      instructions: [{ step: 1, instruction: '', time: 5 }]
    }
  })

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control,
    name: 'ingredients'
  })

  const { fields: instructionFields, append: appendInstruction, remove: removeInstruction } = useFieldArray({
    control,
    name: 'instructions'
  })

  const watchedTags = watch('tags')
  const watchedIngredients = watch('ingredients')

  const createRecipeMutation = useMutation({
    mutationFn: (body) => createRecipe(body)
  })

  const calculateNutritionMutation = useMutation({
    mutationFn: (ingredients) => calculateNutrition(ingredients)
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Tính toán nutrition nếu có ingredients
      if (data.ingredients && data.ingredients.length > 0) {
        const nutritionResult = await calculateNutritionMutation.mutateAsync(data.ingredients)
        data.nutrition = nutritionResult.data.result
      }

      createRecipeMutation.mutate(data, {
        onSuccess: (response) => {
          console.log('Recipe created:', response)
          reset()
          handleCloseCreate()
          toast.success('Tạo công thức thành công!')
          navigate('/chef/recipe-list')
        },
        onError: (error) => {
          console.error('Error creating recipe:', error)
          toast.error('Có lỗi xảy ra khi tạo công thức')
        }
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Có lỗi xảy ra')
    }
  })

  const handleOpenCreate = () => setOpenCreate(true)
  const handleCloseCreate = () => setOpenCreate(false)

  const handleAddTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      const newTags = [...watchedTags, tagInput.trim()]
      setValue('tags', newTags)
      setTagInput('')
    }
  }

  const handleRemoveTag = (index) => {
    const newTags = watchedTags.filter((_, i) => i !== index)
    setValue('tags', newTags)
  }

  const handleCalculateNutrition = async () => {
    if (watchedIngredients && watchedIngredients.length > 0) {
      try {
        const result = await calculateNutritionMutation.mutateAsync(watchedIngredients)
        setNutritionInfo(result.data.result)
        toast.success('Tính toán dinh dưỡng thành công!')
      } catch (error) {
        toast.error('Không thể tính toán dinh dưỡng')
      }
    }
  }

  return (
    <div className='w-full p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg'>
      <div className='flex items-center gap-2 mb-6'>
        <IoMdHome className='text-blue-600' />
        <span className='text-gray-600 dark:text-gray-300'>Tạo công thức mới</span>
      </div>

      <form onSubmit={onSubmit} className='space-y-6'>
        {/* Thông tin cơ bản */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='md:col-span-2'>
            <Input
              title='Tên công thức'
              type='text'
              name='name'
              placeholder='Nhập tên công thức'
              register={register}
              errors={errors.name}
            />
          </div>

          <div className='md:col-span-2'>
            <TextArea
              title='Mô tả'
              name='description'
              placeholder='Nhập mô tả ngắn về công thức'
              register={register}
              errors={errors.description}
              rows={3}
            />
          </div>

          <div>
            <Input
              title='Số phần ăn'
              type='number'
              name='servings'
              placeholder='4'
              register={register}
              errors={errors.servings}
            />
          </div>

          <div>
            <Input
              title='Thời gian chuẩn bị (phút)'
              type='number'
              name='prepTime'
              placeholder='15'
              register={register}
              errors={errors.prepTime}
            />
          </div>

          <div>
            <Input
              title='Thời gian nấu (phút)'
              type='number'
              name='cookTime'
              placeholder='30'
              register={register}
              errors={errors.cookTime}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Độ khó
            </label>
            <select
              {...register('difficulty')}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='easy'>Dễ</option>
              <option value='medium'>Trung bình</option>
              <option value='hard'>Khó</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Ẩm thực
            </label>
            <select
              {...register('cuisine')}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='vietnamese'>Việt Nam</option>
              <option value='chinese'>Trung Hoa</option>
              <option value='japanese'>Nhật Bản</option>
              <option value='korean'>Hàn Quốc</option>
              <option value='western'>Phương Tây</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Danh mục
            </label>
            <select
              {...register('category')}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='Món chính'>Món chính</option>
              <option value='Món khai vị'>Món khai vị</option>
              <option value='Tráng miệng'>Tráng miệng</option>
              <option value='Canh'>Canh</option>
              <option value='Đồ uống'>Đồ uống</option>
              <option value='Bánh kẹo'>Bánh kẹo</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Thẻ tag
          </label>
          <div className='flex gap-2 mb-2'>
            <input
              type='text'
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder='Nhập tag'
              className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <button
              type='button'
              onClick={handleAddTag}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <IoMdAdd />
            </button>
          </div>
          <div className='flex flex-wrap gap-2'>
            {watchedTags.map((tag, index) => (
              <span
                key={index}
                className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'
              >
                {tag}
                <button
                  type='button'
                  onClick={() => handleRemoveTag(index)}
                  className='text-blue-600 hover:text-blue-800'
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {errors.tags && <p className='text-red-500 text-sm mt-1'>{errors.tags.message}</p>}
        </div>

        {/* Nguyên liệu */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Nguyên liệu
            </label>
            <button
              type='button'
              onClick={() => appendIngredient({ ingredientId: '', quantity: 1, unit: 'g' })}
              className='px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm'
            >
              <IoMdAdd className='inline mr-1' /> Thêm
            </button>
          </div>
          
          {ingredientFields.map((field, index) => (
            <div key={field.id} className='grid grid-cols-12 gap-2 mb-2'>
              <div className='col-span-6'>
                <input
                  {...register(`ingredients.${index}.ingredientId`)}
                  placeholder='Tên nguyên liệu'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div className='col-span-2'>
                <input
                  type='number'
                  {...register(`ingredients.${index}.quantity`)}
                  placeholder='Số lượng'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div className='col-span-3'>
                <select
                  {...register(`ingredients.${index}.unit`)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='g'>g</option>
                  <option value='kg'>kg</option>
                  <option value='ml'>ml</option>
                  <option value='l'>l</option>
                  <option value='tbsp'>tbsp</option>
                  <option value='tsp'>tsp</option>
                  <option value='cup'>cup</option>
                  <option value='piece'>cái</option>
                  <option value='slice'>lát</option>
                </select>
              </div>
              <div className='col-span-1'>
                <button
                  type='button'
                  onClick={() => removeIngredient(index)}
                  className='w-full px-2 py-2 bg-red-600 text-white rounded-md hover:bg-red-700'
                  disabled={ingredientFields.length === 1}
                >
                  <IoMdRemove />
                </button>
              </div>
            </div>
          ))}
          
          <button
            type='button'
            onClick={handleCalculateNutrition}
            className='mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700'
            disabled={calculateNutritionMutation.isLoading}
          >
            {calculateNutritionMutation.isLoading ? 'Đang tính...' : 'Tính dinh dưỡng'}
          </button>

          {nutritionInfo && (
            <div className='mt-4 p-4 bg-gray-100 rounded-md'>
              <h4 className='font-medium mb-2'>Thông tin dinh dưỡng (dự kiến):</h4>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm'>
                <div>Calories: {nutritionInfo.calories || 0}</div>
                <div>Protein: {nutritionInfo.protein || 0}g</div>
                <div>Carbs: {nutritionInfo.carbs || 0}g</div>
                <div>Fat: {nutritionInfo.fat || 0}g</div>
              </div>
            </div>
          )}

          {errors.ingredients && <p className='text-red-500 text-sm mt-1'>{errors.ingredients.message}</p>}
        </div>

        {/* Hướng dẫn */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Hướng dẫn nấu
            </label>
            <button
              type='button'
              onClick={() => appendInstruction({ step: instructionFields.length + 1, instruction: '', time: 5 })}
              className='px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm'
            >
              <IoMdAdd className='inline mr-1' /> Thêm bước
            </button>
          </div>
          
          {instructionFields.map((field, index) => (
            <div key={field.id} className='grid grid-cols-12 gap-2 mb-2'>
              <div className='col-span-1 flex items-center justify-center'>
                <span className='font-medium text-gray-600'>{index + 1}</span>
              </div>
              <div className='col-span-8'>
                <textarea
                  {...register(`instructions.${index}.instruction`)}
                  placeholder='Mô tả bước thực hiện'
                  rows={2}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div className='col-span-2'>
                <input
                  type='number'
                  {...register(`instructions.${index}.time`)}
                  placeholder='Thời gian (phút)'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div className='col-span-1'>
                <button
                  type='button'
                  onClick={() => removeInstruction(index)}
                  className='w-full px-2 py-2 bg-red-600 text-white rounded-md hover:bg-red-700'
                  disabled={instructionFields.length === 1}
                >
                  <IoMdRemove />
                </button>
              </div>
            </div>
          ))}
          {errors.instructions && <p className='text-red-500 text-sm mt-1'>{errors.instructions.message}</p>}
        </div>

        <div className='flex gap-4 pt-4'>
          <button
            type='button'
            onClick={handleOpenCreate}
            className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium'
            disabled={createRecipeMutation.isLoading}
          >
            {createRecipeMutation.isLoading ? 'Đang tạo...' : 'Tạo công thức'}
          </button>
          
          <button
            type='button'
            onClick={() => navigate('/chef/recipe-list')}
            className='px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium'
          >
            Hủy
          </button>
        </div>
      </form>

      {/* Confirm Dialog */}
      <CreateConfirmBox
        open={openCreate}
        onClose={handleCloseCreate}
        onConfirm={onSubmit}
        title='Xác nhận tạo công thức'
        message='Bạn có chắc chắn muốn tạo công thức này?'
      />
    </div>
  )
}
