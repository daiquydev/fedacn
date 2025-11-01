import { AiOutlineSearch } from 'react-icons/ai'
import Pagination from '../../components/GlobalComponents/Pagination'
import { FaPlus, FaUtensils } from 'react-icons/fa6'
import { useNavigate, createSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Loading from '../../components/GlobalComponents/Loading'
import useQueryConfig from '../../hooks/useQueryConfig'
import { omit } from 'lodash'
import { useForm } from 'react-hook-form'
import { getRecipesForChef, deleteRecipeForChef } from '../../apis/recipeApi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function RecipeListLowdb() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const queryConfig = useQueryConfig()
  const [searchTerm, setSearchTerm] = useState('')

  const { register, handleSubmit } = useForm({
    defaultValues: {
      search: queryConfig.search || ''
    }
  })

  const { data, isLoading } = useQuery({
    queryKey: ['lowdb-recipes-list', queryConfig],
    queryFn: () => {
      return getRecipesForChef(queryConfig)
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10
  })

  const deleteRecipeMutation = useMutation({
    mutationFn: (id) => deleteRecipeForChef(id),
    onSuccess: () => {
      toast.success('Xóa công thức thành công!')
      queryClient.invalidateQueries(['lowdb-recipes-list'])
    },
    onError: (error) => {
      toast.error('Có lỗi xảy ra khi xóa công thức')
      console.error('Delete error:', error)
    }
  })

  const handleDeleteRecipe = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công thức này?')) {
      deleteRecipeMutation.mutate(id)
    }
  }

  const handleSearch = handleSubmit((data) => {
    navigate({
      pathname: '/chef/recipe-list-lowdb',
      search: createSearchParams({
        ...queryConfig,
        search: data.search,
        page: '1'
      }).toString()
    })
  })

  const handleChangeDifficulty = (e) => {
    if (e.target.value === 'all') {
      navigate({
        pathname: '/chef/recipe-list-lowdb',
        search: createSearchParams({
          ...omit(queryConfig, ['difficulty'])
        }).toString()
      })
    } else {
      navigate({
        pathname: '/chef/recipe-list-lowdb',
        search: createSearchParams({
          ...queryConfig,
          difficulty: e.target.value,
          page: '1'
        }).toString()
      })
    }
  }

  const handleChangeCuisine = (e) => {
    if (e.target.value === 'all') {
      navigate({
        pathname: '/chef/recipe-list-lowdb',
        search: createSearchParams({
          ...omit(queryConfig, ['cuisine'])
        }).toString()
      })
    } else {
      navigate({
        pathname: '/chef/recipe-list-lowdb',
        search: createSearchParams({
          ...queryConfig,
          cuisine: e.target.value,
          page: '1'
        }).toString()
      })
    }
  }

  const handleChangeCategory = (e) => {
    if (e.target.value === 'all') {
      navigate({
        pathname: '/chef/recipe-list-lowdb',
        search: createSearchParams({
          ...omit(queryConfig, ['category'])
        }).toString()
      })
    } else {
      navigate({
        pathname: '/chef/recipe-list-lowdb',
        search: createSearchParams({
          ...queryConfig,
          category: e.target.value,
          page: '1'
        }).toString()
      })
    }
  }

  const recipes = data?.data?.result?.data || []
  const totalPages = data?.data?.result?.totalPages || 1

  if (isLoading) return <Loading />

  return (
    <div className='w-full p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <FaUtensils className='text-2xl text-blue-600' />
          <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>
            Quản lý công thức
          </h1>
        </div>
        <button
          onClick={() => navigate('/chef/create-recipe-lowdb')}
          className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          <FaPlus />
          Tạo công thức mới
        </button>
      </div>

      {/* Search and Filters */}
      <div className='mb-6 space-y-4'>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className='flex gap-2'>
          <div className='relative flex-1'>
            <AiOutlineSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <input
              {...register('search')}
              type='text'
              placeholder='Tìm kiếm công thức...'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <button
            type='submit'
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Tìm kiếm
          </button>
        </form>

        {/* Filters */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Độ khó
            </label>
            <select
              value={queryConfig.difficulty || 'all'}
              onChange={handleChangeDifficulty}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>Tất cả</option>
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
              value={queryConfig.cuisine || 'all'}
              onChange={handleChangeCuisine}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>Tất cả</option>
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
              value={queryConfig.category || 'all'}
              onChange={handleChangeCategory}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>Tất cả</option>
              <option value='Món chính'>Món chính</option>
              <option value='Món khai vị'>Món khai vị</option>
              <option value='Tráng miệng'>Tráng miệng</option>
              <option value='Canh'>Canh</option>
              <option value='Đồ uống'>Đồ uống</option>
              <option value='Bánh kẹo'>Bánh kẹo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
        {recipes.length === 0 ? (
          <div className='col-span-full text-center py-12'>
            <FaUtensils className='text-6xl text-gray-300 mx-auto mb-4' />
            <p className='text-gray-500 text-lg mb-4'>Chưa có công thức nào</p>
            <button
              onClick={() => navigate('/chef/create-recipe-lowdb')}
              className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              Tạo công thức đầu tiên
            </button>
          </div>
        ) : (
          recipes.map((recipe) => (
            <RecipeCardLowdb
              key={recipe.id}
              recipe={recipe}
              onDelete={handleDeleteRecipe}
              onEdit={(id) => navigate(`/chef/edit-recipe-lowdb/${id}`)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={Number(queryConfig.page) || 1}
          totalPages={totalPages}
          onPageChange={(page) => {
            navigate({
              pathname: '/chef/recipe-list-lowdb',
              search: createSearchParams({
                ...queryConfig,
                page: page.toString()
              }).toString()
            })
          }}
        />
      )}
    </div>
  )
}

// Recipe Card Component
function RecipeCardLowdb({ recipe, onDelete, onEdit }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Dễ'
      case 'medium': return 'Trung bình'
      case 'hard': return 'Khó'
      default: return difficulty
    }
  }

  return (
    <div className='bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow'>
      {/* Recipe Image */}
      <div className='relative h-48 bg-gray-200 rounded-t-lg overflow-hidden'>
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className='w-full h-full object-cover'
            onError={(e) => {
              e.target.src = '/images/recipes/default.jpg'
            }}
          />
        ) : (
          <div className='flex items-center justify-center h-full'>
            <FaUtensils className='text-4xl text-gray-400' />
          </div>
        )}
        
        {/* Difficulty Badge */}
        <div className='absolute top-2 right-2'>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
            {getDifficultyText(recipe.difficulty)}
          </span>
        </div>
      </div>

      {/* Recipe Info */}
      <div className='p-4'>
        <h3 className='text-lg font-semibold text-gray-800 mb-2 line-clamp-2'>
          {recipe.name}
        </h3>
        
        <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
          {recipe.description}
        </p>

        {/* Recipe Meta */}
        <div className='flex items-center justify-between text-sm text-gray-500 mb-3'>
          <span className='flex items-center gap-1'>
            🍽️ {recipe.servings} phần
          </span>
          <span className='flex items-center gap-1'>
            ⏱️ {(recipe.prepTime || 0) + (recipe.cookTime || 0)} phút
          </span>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className='flex flex-wrap gap-1 mb-3'>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className='px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs'
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className='px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs'>
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Category and Cuisine */}
        <div className='flex items-center justify-between text-xs text-gray-500 mb-4'>
          <span className='bg-gray-100 px-2 py-1 rounded'>
            {recipe.category}
          </span>
          <span className='bg-gray-100 px-2 py-1 rounded'>
            {recipe.cuisine === 'vietnamese' ? 'Việt Nam' : recipe.cuisine}
          </span>
        </div>

        {/* Actions */}
        <div className='flex gap-2'>
          <button
            onClick={() => onEdit(recipe.id)}
            className='flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm'
          >
            Chỉnh sửa
          </button>
          <button
            onClick={() => onDelete(recipe.id)}
            className='flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm'
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}
