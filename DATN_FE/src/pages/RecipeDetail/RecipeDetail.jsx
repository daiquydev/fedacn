import { Link, useParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import Loading from '../../components/GlobalComponents/Loading'
import { FaArrowCircleRight, FaComment, FaEye } from 'react-icons/fa'
import moment from 'moment'
import { bookmarkRecipe, getRecipeForUser, likeRecipe, unbookmarkRecipe, unlikeRecipe } from '../../apis/recipeApi'
import { MdPerson } from 'react-icons/md'
import { AiFillHeart, AiOutlineClockCircle } from 'react-icons/ai'
import { BsFillBookmarkFill, BsFillLightningChargeFill } from 'react-icons/bs'
import { FaCheckCircle } from 'react-icons/fa'
import Comments from './components/Comments/Comments'
import { queryClient } from '../../main'
import toast from 'react-hot-toast'
import useSound from 'use-sound'
import like from '../../assets/sounds/like.mp3'
import ParticipantsList from '../../components/ParticipantsList'
import EnhancedIngredientList from '../../components/EnhancedIngredientList/EnhancedIngredientList'
import EnhancedRecipeImageGallery from '../../components/EnhancedRecipeImageGallery/EnhancedRecipeImageGallery'
import ModernCookingInstructions from '../../components/ModernCookingInstructions/ModernCookingInstructions'

// Sample dummy participants data with follow status
const getDummyParticipants = (recipe) => {
  if (!recipe) return [];
  
  // Generate random participant data based on recipe ID for demo
  const seed = parseInt(recipe._id?.slice(-4), 16) || 0;
  const count = (seed % 5) + 5; // 5-10 participants for detail page
  
  // Hardcoded followed users (in a real app, this would come from user's follow list)
  const followedIds = [1, 3, 5, 7];
  
  const participants = [];
  for (let i = 0; i < count; i++) {
    const id = ((seed + i) % 15) + 1;
    participants.push({
      id,
      name: `Người dùng ${id}`,
      avatar: "", // Empty for default avatar
      isFollowed: followedIds.includes(id)
    });
  }
  
  return participants;
};

export default function RecipeDetail() {
  const { id } = useParams()
  const [play] = useSound(like)
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['recipe-info-user', id],
    queryFn: () => {
      return getRecipeForUser(id)
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 20
  })
  const likeMutation = useMutation({
    mutationFn: (body) => likeRecipe(body)
  })

  const unlikeMutation = useMutation({
    mutationFn: (body) => unlikeRecipe(body)
  })

  const bookmarkMutation = useMutation({
    mutationFn: (body) => bookmarkRecipe(body)
  })

  const unbookmarkMutation = useMutation({
    mutationFn: (body) => unbookmarkRecipe(body)
  })

  const recipeSource = data?.data?.result?.recipe
  const recipe = Array.isArray(recipeSource) ? recipeSource[0] : recipeSource
  const relatedRecipes = data?.data?.result?.arrayRecipes || []
  const ingredients = recipe?.ingredients || []
  const hasIngredients = ingredients.length > 0
  const isRecipeLoading = isLoading || (isFetching && !recipe)
  const errorMessage = error?.response?.data?.message || error?.message

  const handleLike = () => {
    if (!recipe?._id) return

    if (recipe.is_liked) {
      unlikeMutation.mutate(
        { recipe_id: recipe._id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['recipe-info-user', id]
            })
          }
        }
      )
    } else {
      likeMutation.mutate(
        { recipe_id: recipe._id },
        {
          onSuccess: () => {
            play()
            queryClient.invalidateQueries({
              queryKey: ['recipe-info-user', id]
            })
          }
        }
      )
    }
  }

  const handleBookmark = () => {
    if (!recipe?._id) return

    if (recipe.is_bookmarked) {
      unbookmarkMutation.mutate(
        { recipe_id: recipe._id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['recipe-info-user', id]
            })
            toast.success('Bỏ lưu thành công')
          }
        }
      )
    } else {
      bookmarkMutation.mutate(
        { recipe_id: recipe._id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['recipe-info-user', id]
            })
            toast.success('Lưu vào mục yêu thích thành công')
          }
        }
      )
    }
  }

  return (
    <div className=''>
      <div className=''>
        {isRecipeLoading ? (
          <div className='mt-24'>
            <Loading />
          </div>
        ) : isError ? (
          <div className='mt-24 text-center text-red-500'>{errorMessage || 'Không thể tải công thức.'}</div>
        ) : !recipe ? (
          <div className='mt-24 text-center text-gray-500'>Không tìm thấy công thức.</div>
        ) : (
          <div className='relative'>
            {/* Enhanced Recipe Image Gallery */}
            <div className='mb-8'>
              <EnhancedRecipeImageGallery
                mainImage={recipe?.image}
                images={recipe?.images || []}
                recipeName={recipe?.title}
                className="w-full max-w-4xl mx-auto"
              />
            </div>
            <div className='max-w-6xl mx-auto'>
              <div className=' bg-white dark:bg-color-primary rounded-b lg:rounded-b-none lg:rounded-r flex flex-col justify-between leading-normal'>
                <div className='bg-white dark:bg-color-primary relative top-0 lg:-mt-32 py-5 px-3 md:p-5 sm:px-10'>
                  <span onClick={handleBookmark} className='absolute top-[-6px] right-0'>
                    {recipe?.is_bookmarked ? (
                      <div className='hover:text-yellow-600 cursor-pointer transition-all text-yellow-500'>
                        <BsFillBookmarkFill className='' size={40} />
                      </div>
                    ) : (
                      <div className='text-gray-300 hover:text-yellow-500 cursor-pointer transition-all'>
                        <BsFillBookmarkFill className='' size={40} />
                      </div>
                    )}
                  </span>
                  <header className='not-format'>
                    <div>
                      <span className='font-medium flex items-center flex-wrap mb-3 md:gap-2 md:mb-0 text-gray-500'>
                        <span className='mr-2'>{recipe?.createdAt ? moment(recipe.createdAt).format('LLLL') : ''}</span>

                        <div className='flex text-sm text-blue-400 gap-2'>
                          <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:text-black dark:bg-sky-400'>
                            {recipe?.category_recipe?.name}
                          </span>{' '}
                          <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:text-black dark:bg-sky-400'>
                            {recipe?.processing_food}
                          </span>{' '}
                          {recipe?.region === 0 ? (
                            <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:text-black dark:bg-sky-400'>
                              Miền bắc
                            </span>
                          ) : recipe?.region === 1 ? (
                            <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:text-black dark:bg-sky-400'>
                              Miền trung
                            </span>
                          ) : recipe?.region === 2 ? (
                            <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:text-black dark:bg-sky-400'>
                              Miền nam
                            </span>
                          ) : recipe?.region === 3 ? (
                            <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:text-black dark:bg-sky-400'>
                              Món Á
                            </span>
                          ) : (
                            <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:text-black dark:bg-sky-400'>
                              Món Âu
                            </span>
                          )}
                        </div>
                      </span>

                      <h1 className='mb-1 text-2xl xl:text-3xl font-extrabold dark:text-gray-300 leading-tight text-red-700 '>
                        {recipe?.title}
                      </h1>
                      <div className='flex flex-wrap items-center pb-5  gap-2 justify-between'>
                        <div className='pt-3 text-sm flex gap-2 flex-wrap'>
                          <div className='flex font-medium pr-3 text-gray-500  border-r-2 flex-row items-center'>
                            <MdPerson className='text-lg text-green-500 mr-1' />
                            {recipe?.type === 0 ? (
                              <span className=''>{recipe?.user?.name}</span>
                            ) : (
                              <span className=' block text-gray-500'>
                                <span className='text-red-500'>Cook</span>Healthy
                              </span>
                            )}
                          </div>
                          <div className='flex flex-row items-center text-gray-500 font-medium pr-3 border-r-2  '>
                            <BsFillLightningChargeFill className=' text-yellow-500 mr-1' />
                            {recipe?.difficult_level === 0 ? (
                              <span className=''>Dễ</span>
                            ) : recipe?.difficult_level === 1 ? (
                              <span className=''>Trung bình</span>
                            ) : (
                              <span className=''>Khó</span>
                            )}
                          </div>
                          <div className='flex flex-row items-center text-gray-500 font-medium pr-3 border-r-2  '>
                            <FaEye className='text-blue-400 mr-1' />
                            <span className=''> {recipe?.user_view || 0} lượt xem</span>
                          </div>
                          <div className='flex flex-row items-center text-gray-500 font-medium pr-3 border-r-2 '>
                            <BsFillBookmarkFill className='text-yellow-500 mr-1' />
                            <span className=''> {recipe?.total_bookmarks || 0} lượt lưu</span>
                          </div>
                          <div className='flex flex-row items-center text-gray-500 font-medium pr-3 border-r-2 '>
                            <FaComment className='mr-1 text-yellow-500' />
                            <span className=''>{recipe?.total_comments || 0} bình luận</span>
                          </div>
                          <div onClick={handleLike} className='flex flex-row items-center text-gray-500 cursor-pointer font-medium  '>
                            <AiFillHeart className={` text-lg ${recipe?.is_liked ? 'text-red-500' : 'text-green-400'}`} />
                            <span className='ml-1'>
                              {recipe?.total_likes || 0} {''} lượt thích
                            </span>
                          </div>
                        </div>
                        <span onClick={handleLike}>
                          {!recipe?.is_liked ? (
                            <button className='block btn btn-xs  md:inline-block md:w-auto  bg-red-800 hover:bg-red-700 text-white rounded-lg font-semibold text-sm  md:order-2'>
                              <div className='flex text-xs justify-center gap-1 items-center'>
                                <AiFillHeart /> <div>Thích</div>
                              </div>
                            </button>
                          ) : (
                            <button className='block btn btn-xs  md:inline-block md:w-auto  bg-blue-400 hover:bg-blue-500 border-none text-white rounded-lg font-semibold text-sm  md:order-2'>
                              <div className='flex text-xs justify-center gap-1 items-center'>
                                <FaCheckCircle /> <div>Bỏ thích</div>
                              </div>
                            </button>
                          )}
                        </span>
                      </div>
                    </div>
                  </header>
                  
                  {/* Users who have tried this recipe */}
                  <div className="mt-4 mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    <ParticipantsList
                      participants={getDummyParticipants(recipe)}
                      initialLimit={5}
                      size="md"
                      title="Người đã thử công thức này"
                      showCount={true}
                    />
                  </div>

                  <div className='border-b-2 mb-6 dark:border-gray-700'>
                  </div>

                  {recipe?.unit === '' ? null : (
                    <div className='flex gap-2 flex-wrap mb-10 items-center'>
                      <div className='bg-yellow-50 flex font-medium justify-center items-center text-gray-600  p-1.5 text-sm rounded-full'>
                        <span className='ml-1'>
                          {recipe?.energy} calories trên {recipe?.quantity}{' '}
                          {recipe?.unit}
                        </span>
                      </div>
                      <div className='bg-yellow-50 flex font-medium justify-center items-center text-gray-600  p-1.5 text-sm rounded-full'>
                        <span className='ml-1'>{recipe?.protein} gram protein</span>
                      </div>
                      <div className='bg-yellow-50 flex font-medium justify-center items-center text-gray-600  p-1.5 text-sm rounded-full'>
                        <span className='ml-1'>{recipe?.fat} gram chất béo</span>
                      </div>
                      <div className='bg-yellow-50 flex font-medium justify-center items-center text-gray-600  p-1.5 text-sm rounded-full'>
                        <span className='ml-1'>{recipe?.carbohydrate} gram carbohydrate</span>
                      </div>
                    </div>
                  )}

                  <p className='lead mb-3 whitespace-pre-line font-medium'>{recipe?.description}</p>
                  <div className='border rounded-md w-full shadow-md mb-4 bg-[#fef8f8] dark:bg-gray-900 dark:border-none to-gray-300 p-3'>
                    <div className='font-medium'>Gợi ý dành cho bạn:</div>
                    <ul>
                      {relatedRecipes.map((related) => {
                        return (
                          <li key={related._id} className='flex text-blue-600 dark:text-sky-200 gap-3 m-2 items-center'>
                            <div>
                              <FaArrowCircleRight size={18} className='text-xl' />
                            </div>

                            <Link to={`/cooking/recipe/${related._id}`} className=' hover:underline'>
                              {related.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  {recipe?.video === '' ? null : (
                    <div className=''>
                      <div className='w-full mb-4 lg:h-[30rem]'>
                        <iframe
                          className='w-full h-[20rem]  rounded-md lg:h-[30rem] shadow-md border '
                          src={
                            recipe?.video?.includes('watch?v=')
                              ? recipe.video.replace('watch?v=', 'embed/')
                              : recipe?.video
                          }
                          title='YouTube video player'
                          frameBorder='0'
                          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}
                  {/* nếu có mảng ingredients thì hiển thị nếu ko có mảng hoặc mảng rỗng thì ẩn */}
                  {!hasIngredients ? null : (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                        Nguyên liệu cần thiết
                      </h3>
                      <EnhancedIngredientList
                        ingredients={ingredients.map((ingredient) => ({
                          name: ingredient.name,
                          amount: ingredient.quantity,
                          unit: ingredient.unit || 'g',
                          image: ingredient.image,
                          category: ingredient.category,
                          nutrition: {
                            calories: ingredient.energy,
                            protein: ingredient.protein,
                            fat: ingredient.fat,
                            carbohydrate: ingredient.carbohydrate
                          }
                        }))}
                        servings={1}
                        onServingsChange={(newServings) => {
                          // Handle servings change if needed
                          console.log('New servings:', newServings);
                        }}
                      />
                    </div>
                  )}
                  <div className='custorm-blog'>
                    {/* Modern Cooking Instructions */}
                    {recipe?.content ? (
                      <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                          Hướng dẫn nấu ăn
                        </h3>
                        <ModernCookingInstructions
                          instructions={recipe?.content?.split('\n').filter((line) => line.trim()) || []}
                          cookingTime={recipe?.time || 0}
                          prepTime={5} // Default prep time
                          onStepComplete={(stepIndex, isCompleted) => {
                            console.log(`Step ${stepIndex + 1} ${isCompleted ? 'completed' : 'uncompleted'}`)
                          }}
                          autoTimer={true}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Chưa có hướng dẫn nấu ăn
                      </div>
                    )}
                  </div>
                </div>
                <Comments recipe={recipe} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
