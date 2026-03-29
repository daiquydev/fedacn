import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPost } from '../../apis/postApi'
import LoadingHome from '../Home/components/LoadingHome'
import PostCardInfo from '../../components/CardComponents/PostCardInfo'

export default function PostInfo() {
  const { id } = useParams()
  const { data, status } = useQuery({
    queryKey: ['post-info', id],
    queryFn: () => {
      return getPost(id)
    }
  })
  const post = data?.data.result[0]

  if (status === 'pending') {
    return <LoadingHome />
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
      <div className='max-w-4xl mx-auto mb-[30rem] pt-2 px-4 xl:px-8'>
        <PostCardInfo data={post} />
      </div>
    </>
  )
}
