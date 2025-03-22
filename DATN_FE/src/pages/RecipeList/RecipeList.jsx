import { AiOutlineSearch } from 'react-icons/ai'
import Pagination from '../../components/GlobalComponents/Pagination'
import { FaPlus, FaUtensils } from 'react-icons/fa6'
import { useNavigate, createSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Loading from '../../components/GlobalComponents/Loading'
import useQueryConfig from '../../hooks/useQueryConfig'
import { omit } from 'lodash'
import { useForm } from 'react-hook-form'
import { getCategoryRecipes, getRecipesForChef } from '../../apis/recipeApi'
import RecipeItem from './components/RecipeItem'

export default function RecipeList() {
  const navigate = useNavigate()
  const queryConfig = useQueryConfig()

  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category-recipe'],
    queryFn: () => {
      return getCategoryRecipes()
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10
  })

  const { data, isLoading } = useQuery({
    queryKey: ['recipes-list-chef', queryConfig],
    queryFn: () => {
      return getRecipesForChef(queryConfig)
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10
  })

  const handleChangeSort = (e) => {
    navigate({
      pathname: '/chef/recipe-list',
      search: createSearchParams({
        ...queryConfig,
        sort: e.target.value
      }).toString()
    })
  }
  const handleChangeStatus = (e) => {
    console.log(e.target.value)
    if (e.target.value === 'all') {
      console.log('all')
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...omit(queryConfig, ['status'])
        }).toString()
      })
    } else {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...queryConfig,
          status: e.target.value
        }).toString()
      })
    }
  }

  const handleChangeDifficultLevel = (e) => {
    if (e.target.value === 'all') {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...omit(queryConfig, ['difficult_level'])
        }).toString()
      })
    } else {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...queryConfig,
          difficult_level: e.target.value
        }).toString()
      })
    }
  }

  const handleChangeProcessingFood = (e) => {
    if (e.target.value === 'all') {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...omit(queryConfig, ['processing_food'])
        }).toString()
      })
    } else {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...queryConfig,
          processing_food: e.target.value
        }).toString()
      })
    }
  }

  const handleChangeRegion = (e) => {
    if (e.target.value === 'all') {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...omit(queryConfig, ['region'])
        }).toString()
      })
    } else {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...queryConfig,
          region: e.target.value
        }).toString()
      })
    }
  }

  const handleChangeIntervalTime = (e) => {
    if (e.target.value === 'all') {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...omit(queryConfig, ['interval_time'])
        }).toString()
      })
    } else {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...queryConfig,
          interval_time: e.target.value
        }).toString()
      })
    }
  }

  const handleChangeCategory = (e) => {
    if (e.target.value === 'all-category') {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...omit(queryConfig, ['category_recipe_id'])
        }).toString()
      })
    } else {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams({
          ...queryConfig,
          category_recipe_id: e.target.value
        }).toString()
      })
    }
  }

  const { register, handleSubmit } = useForm({
    defaultValues: {
      searchRecipes: queryConfig.search || ''
    }
  })
  const onSubmitSearch = handleSubmit((data) => {
    if (data.searchRecipes === '') {
      navigate({
        pathname: '/chef/recipe-list',
        search: createSearchParams(
          omit({ ...queryConfig }, [
            'status',
            'category_recipe_id',
            'page',
            'difficult_level',
            'region',
            'processing_food',
            'interval_time',
            'search'
          ])
        ).toString()
      })
      return
    }
    navigate({
      pathname: '/chef/recipe-list',
      search: createSearchParams(
        omit({ ...queryConfig, search: data.searchRecipes }, [
          'status',
          'category_recipe_id',
          'page',
          'difficult_level',
          'region',
          'processing_food',
          'interval_time'
        ])
      ).toString()
    })
  })

  return (
    <div className='h-screen mb-[30rem] text-gray-900 dark:text-white py-4 mx-3'>
      <div className='mx-2'>
        <div className=''>
          <div className='grid xl:grid-cols-6 '>
            <div className='col-span-2 lg:col-span-1 mb-2'>
              <div className='text-xl font-medium mb-2'>
                <span>Thực đơn đã tạo</span>
              </div>
              <div className='border-b-[3px] mb-2 w-[30%] border-green-500 '></div>
            </div>
            <div className='col-span-4 lg:col-span-5 mb-2  '>
              <div className='flex flex-wrap gap-3 xl:justify-end items-center'>
                <button
                  onClick={() => navigate('/chef/create-recipe')}
                  className='block btn btn-sm  md:inline-block md:w-auto  bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm md:ml-2 md:order-2'
                >
                  <div className='flex justify-center gap-2 items-center'>
                    <FaPlus /> <div>Tạo thực đơn</div>
                  </div>
                </button>
                <select
                  onChange={handleChangeSort}
                  defaultValue={queryConfig.sort}
                  id='sort'
                  className='select select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='desc'>Mới nhất</option>
                  <option value='asc'>Lâu nhất</option>
                </select>
                <select
                  defaultValue={queryConfig.status || 'all'}
                  onChange={handleChangeStatus}
                  id='status'
                  className='select select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='all'>Tất cả</option>
                  <option value='1'>Đã duyệt</option>
                  <option value='0'>Chưa duyệt</option>
                  <option value='3'>Bị từ chối</option>
                </select>
                <select
                  defaultValue={queryConfig.processing_food || 'all'}
                  onChange={handleChangeProcessingFood}
                  id='status'
                  className='select select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='all'>Loại thực đơn</option>
                  <option value='Sáng'>Bữa sáng</option>
                  <option value='Trưa'>Bữa trưa</option>
                  <option value='Tối'>Bữa tối</option>
                  <option value='Xế'>Bữa phụ</option>
                </select>
                <select
                  defaultValue={queryConfig.difficult_level || 'all'}
                  onChange={handleChangeDifficultLevel}
                  id='status'
                  className='select select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='all'>Độ khó</option>
                  <option value='0'>Dễ</option>
                  <option value='1'>Trung bình</option>
                  <option value='2'>Khó</option>
                </select>
                <select
                  defaultValue={queryConfig.region || 'all'}
                  onChange={handleChangeRegion}
                  id='status'
                  className='select select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='all'>Vùng miền</option>
                  <option value='Miền bắc'>Miền Bắc</option>
                  <option value='Miền trung'>Miền Trung</option>
                  <option value='Miền nam'>Miền Nam</option>
                  <option value='Món âu'>Món Âu</option>
                  <option value='Món á'>Món Á</option>
                </select>
                <select
                  defaultValue={queryConfig.interval_time || 'all'}
                  onChange={handleChangeIntervalTime}
                  id='status'
                  className='select select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='all'>Thời gian</option>
                  <option value='0-15'>Dưới 15 phút</option>
                  <option value='15-30'>15 - 30 phút</option>
                  <option value='30-45'>30 - 45 phút</option>
                  <option value='45-60'>45 - 60 phút</option>
                  <option value='60-'>Trên 60 phút</option>
                </select>
                <select
                  defaultValue={queryConfig.category_recipe_id || 'all-category'}
                  onChange={handleChangeCategory}
                  id='status'
                  className='select select-sm border bg-white dark:bg-slate-800 dark:border-none'
                >
                  <option value='all-category'>Loại thực phẩm</option>
                  {isLoadingCategory ? (
                    <option value='all-category'>Đang tải...</option>
                  ) : (
                    category?.data?.result.map((cate) => (
                      <option key={cate._id} value={cate._id}>
                        {cate.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
          <div className='sm:flex sm:justify-between items-center mb-3'>
            <form onSubmit={onSubmitSearch} className='flex-1 mb-3 sm:mb-0 sm:mr-1 '>
              <div className='join w-full'>
                <input
                  {...register('searchRecipes')}
                  className='input input-sm  join-item w-full border-2 bg-white dark:bg-slate-800 dark:border-none'
                  placeholder='Tìm kiếm thực đơn...'
                />
                <button className='btn btn-sm join-item bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700'>
                  <AiOutlineSearch size={20} className='text-white' />
                </button>
              </div>
            </form>
          </div>
          <div className='flex flex-col rounded-xl overflow-x-auto'>
            <div className='min-w-full'>
              <div className='shadow overflow-hidden border-b border-gray-200 sm:rounded-lg'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50 dark:bg-gray-700'>
                    <tr>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
                      >
                        Tên thực đơn
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
                      >
                        Trạng thái
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
                      >
                        Loại thực phẩm
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
                      >
                        Ngày tạo
                      </th>
                      <th
                        scope='col'
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
                      >
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200'>
                    {data?.data?.result.recipes.map((recipe) => (
                      <RecipeItem key={recipe._id} recipe={recipe} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {isLoading ? (
              <Loading />
            ) : (
              <div className='flex justify-center mt-4'>
                <Pagination
                  queryConfig={queryConfig}
                  pageSize={data?.data?.result.page_size}
                  url={'/chef/recipe-list'}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
