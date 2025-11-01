import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import parse from 'html-react-parser'
import { IoMdHome } from 'react-icons/io'
import { FaPlus, FaTrash } from 'react-icons/fa'
import Input from '../../components/InputComponents/Input'
import TextArea from '../../components/InputComponents/TextArea'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { schemaCreateRecipe } from '../../utils/rules'
import { useQuery } from '@tanstack/react-query'
import Loading from '../../components/GlobalComponents/Loading'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import CreateConfirmBox from '../../components/GlobalComponents/CreateConfirmBox'
import { createRecipe, getCategoryRecipes } from '../../apis/recipeApi'
import { formats, modules } from '../../constants/editorToolbar'
import { getImageUrl } from '../../utils/imageUrl'

export default function CreateRecipe() {
  const navigate = useNavigate()
  const [openCreate, setOpenCreate] = useState(false)
  const [ingredients, setIngredients] = useState([{ name: '', amount: '', unit: '' }])
  const [instructions, setInstructions] = useState([''])
  const [tags, setTags] = useState([''])

  const handleOpenCreate = () => {
    setOpenCreate(true)
  }
  const handleCloseCreate = () => {
    setOpenCreate(false)
  }
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
      description: '',
      category_recipe_id: 'DEFAULT',
      content: '',
      video: '',
      time: '',
      difficult_level: 'DEFAULT',
      region: 'DEFAULT',
      processing_food: 'DEFAULT',
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

  const createRecipeMutation = useMutation({
    mutationFn: (body) => createRecipe(body)
  })
  
  const onSubmit = handleSubmit((data) => {
    const formData = new FormData()
    
    // Filter out empty ingredients, instructions, and tags
    const validIngredients = ingredients.filter(ing => ing.name.trim() !== '')
    const validInstructions = instructions.filter(inst => inst.trim() !== '')
    const validTags = tags.filter(tag => tag.trim() !== '')

    // Basic recipe data
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('category_recipe_id', data.category_recipe_id)
    formData.append('content', data.content)
    formData.append('video', data.video)
    formData.append('time', Number(data.time))
    formData.append('difficult_level', Number(data.difficult_level))
    formData.append('region', Number(data.region))
    formData.append('processing_food', data.processing_food)

    // Nutrition data
    formData.append('energy', Number(data.energy) || 0)
    formData.append('protein', Number(data.protein) || 0)
    formData.append('fat', Number(data.fat) || 0)
    formData.append('carbohydrate', Number(data.carbohydrate) || 0)

    // Complex data as JSON strings
    formData.append('ingredients', JSON.stringify(validIngredients))
    formData.append('instructions', JSON.stringify(validInstructions))
    formData.append('tags', JSON.stringify(validTags))

    // Files
    if (data.image && data.image[0]) {
      formData.append('image', data.image[0])
    }
    
    if (data.video_file && data.video_file[0]) {
      formData.append('video', data.video_file[0])
    }

    createRecipeMutation.mutate(formData, {
      onSuccess: (data) => {
        console.log(data)
        reset()
        setIngredients([{ name: '', amount: '', unit: '' }])
        setInstructions([''])
        setTags([''])
        handleCloseCreate()
        toast.success('Tạo công thức thành công')
        navigate('/recipes/my-recipes')
      },
      onError: (error) => {
        console.log(error)
        toast.error('Có lỗi xảy ra khi tạo công thức')
      }
    })
  })
  const onEditorStateChange = (editorState) => {
    setValue('content', editorState)
  }

  const content = watch('content')
  const descriptionWatch = watch('description')
  const titleWatch = watch('title')
  const imageWatch = watch('image')

  console.log(imageWatch)

  const { data: category, isFetching } = useQuery({
    queryKey: ['category-recipe'],
    queryFn: () => {
      return getCategoryRecipes()
    }
  })

  return (
    <div>
      <div className='flex flex-wrap justify-between items-center pt-3 px-8'>
        <div className='mb-2'>
          <div className='text-xl md:text-2xl font-medium mb-2'>
            <span>Trang tạo bài viết nấu ăn</span>
          </div>
          <div className='border-b-[3px] mb-2 w-[50%] border-red-300 '></div>
        </div>
        <button
          onClick={() => navigate('/chef/recipe-list')}
          className='block btn btn-sm md:inline-block md:w-auto  bg-red-800 hover:bg-red-700 text-white rounded-lg font-semibold text-sm md:ml-2 md:order-2'
        >
          <div className='flex gap-1 items-center justify-center'>
            <IoMdHome />
            Trở về trang danh sách nấu ăn
          </div>
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 px-4 gap-4'>
        <div className='blog-view  max-w-3xl w-full pb-16 p-5 dark:text-gray-400  font-Roboto  bg-white dark:bg-color-primary my-6  border border-gray-200 rounded-lg shadow mx-auto'>
          <h2 className='text-xl font-bold border-b border-gray-400 pb-2 mb-5 '>Tạo bài viết nấu ăn</h2>
          <form onSubmit={onSubmit} noValidate>
            <div className='grid gap-4 sm:grid-cols-2 sm:gap-2'>
              <div className='sm:col-span-2'>
                <Input
                  title='Nhập tiêu đề'
                  type='text'
                  name='title'
                  id='title'
                  placeholder='Nhập tiêu đề bài viết'
                  register={register}
                  errors={errors.title}
                />
              </div>
            </div>
            <div className='sm:col-span-2 pb-2'>
              <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-1 dark:text-pink-300 text-left'>
                Chọn 1 ảnh bài viết (định dạng ảnh jpeg)
              </div>
              <input
                className='file-input file-input-sm file-input-bordered file-input-ghost w-full max-w-xs'
                type='file'
                accept='image/jpeg'
                {...register('image')}
              />

              <div className='flex min-h-[1rem] font-medium text-orange-300  text-xs lg:text-red-600'>
                {errors.image?.message}
              </div>
            </div>
            <div className='sm:col-span-2'>
              <Input
                title='Nhập link video (nếu có)'
                type='text'
                name='video'
                id='video'
                placeholder='Nhập link video bài viết'
                register={register}
                errors={errors.video}
              />
            </div>

            <div className='sm:col-span-2 pb-2'>
              <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-1 dark:text-pink-300 text-left'>
                Hoặc tải lên video (MP4, MOV, AVI)
              </div>
              <input
                className='file-input file-input-sm file-input-bordered file-input-ghost w-full max-w-xs'
                type='file'
                accept='video/*'
                {...register('video_file')}
              />
            </div>

            {/* Ingredients Section */}
            <div className='sm:col-span-2'>
              <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-2 dark:text-pink-300 text-left'>
                Nguyên liệu
              </div>
              {ingredients.map((ingredient, index) => (
                <div key={index} className='flex gap-2 mb-2 items-center'>
                  <input
                    type='text'
                    placeholder='Tên nguyên liệu'
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    className='input input-sm input-bordered flex-1'
                  />
                  <input
                    type='text'
                    placeholder='Số lượng'
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                    className='input input-sm input-bordered w-20'
                  />
                  <input
                    type='text'
                    placeholder='Đơn vị'
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    className='input input-sm input-bordered w-20'
                  />
                  <button
                    type='button'
                    onClick={() => removeIngredient(index)}
                    className='btn btn-sm btn-error'
                    disabled={ingredients.length === 1}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type='button'
                onClick={addIngredient}
                className='btn btn-sm btn-primary'
              >
                <FaPlus /> Thêm nguyên liệu
              </button>
            </div>

            {/* Instructions Section */}
            <div className='sm:col-span-2'>
              <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-2 dark:text-pink-300 text-left'>
                Các bước thực hiện
              </div>
              {instructions.map((instruction, index) => (
                <div key={index} className='flex gap-2 mb-2 items-center'>
                  <span className='text-sm font-medium w-8'>{index + 1}.</span>
                  <textarea
                    placeholder='Mô tả bước thực hiện'
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    className='textarea textarea-sm textarea-bordered flex-1'
                    rows='2'
                  />
                  <button
                    type='button'
                    onClick={() => removeInstruction(index)}
                    className='btn btn-sm btn-error'
                    disabled={instructions.length === 1}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type='button'
                onClick={addInstruction}
                className='btn btn-sm btn-primary'
              >
                <FaPlus /> Thêm bước
              </button>
            </div>

            {/* Tags Section */}
            <div className='sm:col-span-2'>
              <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-2 dark:text-pink-300 text-left'>
                Thẻ tag (từ khóa)
              </div>
              {tags.map((tag, index) => (
                <div key={index} className='flex gap-2 mb-2 items-center'>
                  <input
                    type='text'
                    placeholder='Nhập từ khóa'
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    className='input input-sm input-bordered flex-1'
                  />
                  <button
                    type='button'
                    onClick={() => removeTag(index)}
                    className='btn btn-sm btn-error'
                    disabled={tags.length === 1}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type='button'
                onClick={addTag}
                className='btn btn-sm btn-primary'
              >
                <FaPlus /> Thêm tag
              </button>
            </div>

            {/* Nutrition Section */}
            <div className='sm:col-span-2'>
              <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-2 dark:text-pink-300 text-left'>
                Thông tin dinh dưỡng (trên 100g)
              </div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                <Input
                  title='Năng lượng (kcal)'
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
                  title='Carbohydrate (g)'
                  type='number'
                  name='carbohydrate'
                  id='carbohydrate'
                  placeholder='0'
                  register={register}
                  errors={errors.carbohydrate}
                />
              </div>
            </div>
            <div className='sm:col-span-2'>
              <Input
                title='Thời gian nấu'
                type='number'
                name='time'
                id='time'
                placeholder='Nhập thời gian nấu'
                register={register}
                errors={errors.time}
              />
            </div>
            <div className='sm:col-span-2 flex flex-wrap items-center gap-2 md:gap-5 pb-2'>
              <div>
                <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-1 dark:text-pink-300 text-left'>
                  Chọn mức độ khó
                </div>

                <select
                  defaultValue='DEFAULT'
                  {...register('difficult_level')}
                  id='difficult_level'
                  className='select select-secondary select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='DEFAULT' disabled>
                    Chọn mức độ khó
                  </option>
                  <option value='0'>Dễ</option>
                  <option value='1'>Trung bình</option>
                  <option value='2'>Khó</option>
                </select>

                <div className='flex min-h-[1rem] font-medium text-orange-300  text-xs lg:text-red-600'>
                  {errors.difficult_level?.message}
                </div>
              </div>
              <div>
                <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-1 dark:text-pink-300 text-left'>
                  Chọn vùng miền
                </div>

                <select
                  defaultValue='DEFAULT'
                  {...register('region')}
                  id='region'
                  className='select select-secondary select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='DEFAULT' disabled>
                    Chọn vùng miền
                  </option>
                  <option value='0'>Miền Bắc</option>
                  <option value='1'>Miền Trung</option>
                  <option value='2'>Miền Nam</option>
                  <option value='3'>Món Á</option>
                  <option value='4'>Món Âu</option>
                </select>

                <div className='flex min-h-[1rem] font-medium text-orange-300  text-xs lg:text-red-600'>
                  {errors.region?.message}
                </div>
              </div>
            </div>
            <div className='sm:col-span-2 flex flex-wrap items-center gap-2 md:gap-5 pb-2'>
              <div>
                <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-1 dark:text-pink-300 text-left'>
                  Chọn 1 thể loại nấu ăn
                </div>

                {isFetching ? (
                  <Loading className='flex' />
                ) : (
                  <select
                    defaultValue='DEFAULT'
                    {...register('category_recipe_id')}
                    id='category'
                    className='select select-secondary select-sm border bg-white dark:bg-slate-800 dark:border-none'
                  >
                    <option value='DEFAULT' disabled>
                      Chọn 1 thể loại
                    </option>
                    {category?.data?.result.map((item) => {
                      return (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      )
                    })}
                  </select>
                )}

                <div className='flex min-h-[1rem] font-medium text-orange-300  text-xs lg:text-red-600'>
                  {errors.category_recipe_id?.message}
                </div>
              </div>
              <div>
                <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-1 dark:text-pink-300 text-left'>
                  Chọn cách chế biến
                </div>

                <select
                  defaultValue='DEFAULT'
                  {...register('processing_food')}
                  id='processing_food'
                  className='select select-secondary select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='DEFAULT' disabled>
                    Chọn cách chế biến
                  </option>
                  <option value='Lẩu'>Lẩu</option>
                  <option value='Xào'>Xào</option>
                  <option value='Nướng'>Nướng</option>
                  <option value='Hấp'>Hấp</option>
                  <option value='Chiên'>Chiên</option>
                  <option value='Kho'>Kho</option>
                  <option value='Hầm'>Hầm</option>
                  <option value='Gỏi/Trộn'>Gỏi/Trộn</option>
                  <option value='Canh/Súp'>Canh/Súp</option>
                  <option value='Quay'>Quay</option>
                  <option value='Om/Rim'>Om/Rim</option>
                  <option value='Rang'>Rang</option>
                  <option value='Đồ sống'>Đồ sống</option>
                  <option value='Khác'>Khác</option>
                </select>

                <div className='flex min-h-[1rem] font-medium text-orange-300  text-xs lg:text-red-600'>
                  {errors.processing_food?.message}
                </div>
              </div>
            </div>

            <div className='sm:col-span-2'>
              <TextArea
                title='Nhập mô tả'
                placeholder='Nhập mô tả bài viết'
                name='description'
                id='description'
                register={register}
                errors={errors.description}
              />
            </div>

            <div className='sm:col-span-2 pb-2'>
              <div className='text-gray-400 lg:text-red-900 text-sm font-medium mb-1 dark:text-pink-300 text-left'>
                Nhập nội dung bài viết
              </div>
              <ReactQuill
                className=''
                theme='snow'
                value={content}
                onChange={onEditorStateChange}
                modules={modules}
                formats={formats}
              />
              <div className='flex min-h-[1rem] font-medium text-orange-300  text-xs lg:text-red-600'>
                {errors.content?.message}
              </div>
            </div>

            {openCreate && (
              <CreateConfirmBox
                title='Xác nhận tạo bài viết'
                subtitle='Bạn có chắc chắn muốn tạo bài viết này không?'
                handleCreate={onSubmit}
                closeModal={handleCloseCreate}
                isPending={createRecipeMutation.isPending}
              />
            )}
          </form>
          <button
            onClick={handleOpenCreate}
            className='block btn btn-sm md:inline-block md:w-auto  bg-red-800 hover:bg-red-700 text-white rounded-lg font-semibold text-sm md:ml-2 md:order-2'
          >
            <div className='flex gap-1 items-center justify-center'>Tạo bài viết</div>
          </button>
        </div>

        <div className=' blog-view  max-w-3xl w-full pb-16  dark:text-gray-400  font-Roboto lg:pb-24 bg-white dark:bg-color-primary my-6  border border-gray-200 rounded-lg shadow mx-auto'>
          <h2 className='text-xl font-bold border-b m-5 border-gray-400 pb-2 mb-5 '>Xem trước</h2>

          <div className='relative'>
            <div className='w-full mx-auto'>
              <div className=' bg-white dark:bg-color-primary rounded-b lg:rounded-b-none lg:rounded-r flex flex-col justify-between leading-normal'>
                <div className='bg-white dark:bg-color-primary relative px-5'>
                  {!imageWatch || imageWatch.length === 0 ? (
                    <div className=''>Link ảnh bài viết</div>
                  ) : (
                    <div className='flex  flex-col items-center my-2 justify-center w-[100%]'>
                      <img
                        className='object-cover max-h-[15rem] md:max-h-[26rem] rounded-md w-[100%]'
                        src={URL.createObjectURL(imageWatch[0])}
                        alt=''
                      />
                    </div>
                  )}
                  <header className='not-format'>
                    <div>
                      <h1 className='mb-1 text-2xl xl:text-3xl font-extrabold dark:text-gray-300 leading-tight text-red-700 '>
                        {titleWatch === '' ? 'Tiêu đề bài viết' : titleWatch}
                      </h1>
                    </div>
                  </header>
                  <p className='lead mb-3 whitespace-pre-line font-medium'>
                    {descriptionWatch === '' ? 'Mô tả bài viết' : descriptionWatch}
                  </p>

                  <div className='custorm-blog '>
                    {content === '' ? <div>Nội dung bài viết</div> : <div>{parse(content)}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
