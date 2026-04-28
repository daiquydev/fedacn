import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { getMePosts } from '../../../../apis/postApi'
import PostCard from '../../../../components/CardComponents/PostCard'
import Loading from '../../../../components/GlobalComponents/Loading'
import moment from 'moment'
import { FiSearch } from 'react-icons/fi'

export default function MePost({ user }) {
  const { ref, inView } = useInView()
  const [keyword, setKeyword] = useState('')
  const fetchMePost = async ({ pageParam }) => {
    return await getMePosts({ page: pageParam })
  }

  const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['mePost'],
    queryFn: fetchMePost,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.data.result.posts.length ? allPages.length + 1 : undefined
      return nextPage
    },
    placeholderData: keepPreviousData
  })

  const allPosts = useMemo(
    () => data?.pages.flatMap((dataMePost) => dataMePost?.data?.result?.posts || []) || [],
    [data]
  )
  const filteredPosts = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return allPosts
    return allPosts.filter((post) => {
      const searchable = [post?.title, post?.description, post?.content, post?.caption]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return searchable.includes(normalized)
    })
  }, [allPosts, keyword])

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  if (status === 'pending') {
    return <Loading className='w-full flex justify-center mt-4' />
  }

  if (status === 'error') {
    return (
      <div className='w-full p-10 text-center font-bold text-red-600 dark:text-pink-700 h-[100rem]'>
        Có lỗi xảy ra vui lòng load lại trang
      </div>
    )
  }
  return (
    <>
      <div className=' grid xl:mx-8 pt-2 xl:gap-6 xl:grid-cols-5'>
        <div className='xl:col-span-3'>
          <div className='my-3'>
            <label className='relative block mb-4'>
              <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder='Tìm bài viết theo nội dung...'
                className='w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-700 dark:text-gray-100 outline-none focus:border-emerald-500'
              />
            </label>

            {filteredPosts.map((post) => (
              <PostCard key={post._id} data={post} />
            ))}

            {filteredPosts.length === 0 && (
              <div className='text-center py-10 text-sm text-gray-500 dark:text-gray-400'>
                Không tìm thấy bài viết phù hợp với từ khóa "{keyword}".
              </div>
            )}

            {/* <div ref={ref}>{isFetchingNextPage && <Loading />}</div> */}
            {!keyword.trim() && (
              <div ref={ref}>
                {isFetchingNextPage ? (
                  <Loading />
                ) : (
                  <div className='flex justify-center font-medium'>Không còn bài viết</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className=' order-first xl:order-last xl:col-span-2'>
          <div className='bg-white dark:bg-color-primary  w-full my-3 shadow flex flex-col justify-center sm:rounded-lg'>
            <div className='px-4 py-5'>
              <h3 className='text-lg leading-6 font-medium dark:text-gray-300 text-gray-900'>Thông tin cá nhân</h3>
            </div>
            <div className='border-t border-gray-200'>
              <dl>
                <div className='bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>Họ và tên</dt>
                  <dd className='mt-1 text-sm text-gray-900 dark:text-gray-300 sm:mt-0 sm:col-span-2'>{user?.name}</dd>
                </div>
                <div className='bg-white dark:bg-color-primary px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium  text-gray-500'> Ngày sinh </dt>
                  <dd className='mt-1 text-sm text-gray-900 dark:text-gray-300 sm:mt-0 sm:col-span-2'>
                    {user?.birthday ? moment(user?.birthday).format('MMM Do YY') : 'Chưa cập nhật'}
                  </dd>
                </div>
                <div className='bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>Giới tính</dt>
                  <dd className='mt-1 text-sm text-gray-900 dark:text-gray-300 sm:mt-0 sm:col-span-2'>
                    {user?.gender}
                  </dd>
                </div>
                <div className='bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>Địa chỉ email</dt>
                  <dd className='mt-1 text-sm text-gray-900 dark:text-gray-300 sm:mt-0 sm:col-span-2'>
                    {user?.email ? user?.email : 'Chưa cập nhật'}
                  </dd>
                </div>
                <div className='bg-white dark:bg-color-primary px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>Địa chỉ</dt>
                  <dd className='mt-1 text-sm text-gray-900 dark:text-gray-300 sm:mt-0 sm:col-span-2'>
                    {user?.address ? user?.address : 'Chưa cập nhật'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
