import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { currentAccount } from '../../apis/userApi'
import mealPlanApi from '../../apis/mealPlanApi'
import { deleteRecipeForChef } from '../../apis/recipeApi'
import { deletePostForEachUser, getPublicPosts } from '../../apis/postApi'
import { acceptPostReport, getInspectorRecipes, getPostReports, rejectPostReport, getMealPlanReports } from '../../apis/adminInspectorApi'
import { getUsersAdmin, banUserAdmin, unbanUserAdmin, deleteUserAdmin } from '../../apis/adminUserApi'
import { Link } from 'react-router-dom'
import { HiShieldCheck, HiSparkles, HiUsers } from 'react-icons/hi'
import { MdOutlineSpaceDashboard } from 'react-icons/md'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const quickActions = [
  {
    title: 'Tổng quan hệ thống',
    description: 'Xem nhanh trạng thái đăng nhập, quyền hạn và lối tắt cần thiết.',
    icon: MdOutlineSpaceDashboard,
    to: '/home',
    ready: true
  },
  {
    title: 'Quản lý người dùng',
    description: 'Khóa/mở tài khoản, xem báo cáo người dùng. (Sẽ bật khi API hoàn tất)',
    icon: HiUsers,
    ready: false
  },
  {
    title: 'Duyệt nội dung',
    description: 'Kiểm duyệt công thức, blog, album bị báo cáo. (Sẽ bật khi API hoàn tất)',
    icon: HiShieldCheck,
    ready: false
  }
]

export default function AdminPanel() {
  const queryClient = useQueryClient()
  const [mealPlanId, setMealPlanId] = useState('')
  const [recipeId, setRecipeId] = useState('')
  const [postId, setPostId] = useState('')
  const [userId, setUserId] = useState('')
  const [postPage, setPostPage] = useState(1)
  const [recipePage, setRecipePage] = useState(1)
  const [mealPage, setMealPage] = useState(1)
  const [postSearch, setPostSearch] = useState('')
  const [recipeSearch, setRecipeSearch] = useState('')
  const [mealSearch, setMealSearch] = useState('')
  const [postList, setPostList] = useState([])
  const [recipeList, setRecipeList] = useState([])
  const [mealList, setMealList] = useState([])

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60
  })

  const { data: reportData, isLoading: isLoadingReports } = useQuery({
    queryKey: ['admin-post-reports'],
    queryFn: () => getPostReports({ page: 1, limit: 10 }),
    staleTime: 60 * 1000
  })

  const { data: mealPlanReportData, isLoading: isLoadingMealPlanReports } = useQuery({
    queryKey: ['admin-meal-plan-reports'],
    queryFn: () => getMealPlanReports({ page: 1, limit: 10 }),
    staleTime: 60 * 1000
  })

  const { data: publicPostsData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['admin-public-posts', postPage, postSearch],
    queryFn: () => getPublicPosts({ page: postPage, limit: 20, search: postSearch || undefined }),
    staleTime: 60 * 1000
  })

  const { data: mealPlansData, isLoading: isLoadingMealPlans } = useQuery({
    queryKey: ['admin-meal-plans', mealPage, mealSearch],
    queryFn: () => mealPlanApi.getMealPlans({ limit: 20, page: mealPage, search: mealSearch || undefined }),
    staleTime: 60 * 1000
  })

  const { data: recipesData, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['admin-recipes', recipePage, recipeSearch],
    queryFn: () => getInspectorRecipes({ page: recipePage, limit: 20, search: recipeSearch || undefined }),
    staleTime: 60 * 1000
  })

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getUsersAdmin({ page: 1, limit: 20, role: undefined, status: undefined }),
    staleTime: 60 * 1000
  })

  const deleteMealPlanMutation = useMutation({
    mutationFn: (id) => mealPlanApi.deleteMealPlan(id),
    onSuccess: () => {
      toast.success('Đã xóa meal plan')
      setMealPlanId('')
    },
    onError: () => toast.error('Xóa meal plan thất bại (kiểm tra quyền hoặc ID)')
  })

  const deleteRecipeMutation = useMutation({
    mutationFn: (id) => deleteRecipeForChef(id),
    onSuccess: () => {
      toast.success('Đã xóa công thức')
      setRecipeId('')
    },
    onError: () => toast.error('Xóa công thức thất bại (kiểm tra quyền hoặc ID)')
  })

  const deletePostMutation = useMutation({
    mutationFn: (id) => deletePostForEachUser({ post_id: id }),
    onSuccess: () => {
      toast.success('Đã xóa bài viết')
      setPostId('')
    },
    onError: () => toast.error('Xóa bài viết thất bại (kiểm tra quyền hoặc ID)')
  })

  const acceptReportMutation = useMutation({
    mutationFn: (id) => acceptPostReport(id),
    onSuccess: () => {
      toast.success('Đã duyệt báo cáo')
      queryClient.invalidateQueries({ queryKey: ['admin-post-reports'] })
    },
    onError: () => toast.error('Duyệt báo cáo thất bại')
  })

  const rejectReportMutation = useMutation({
    mutationFn: (id) => rejectPostReport(id),
    onSuccess: () => {
      toast.success('Đã xóa báo cáo')
      queryClient.invalidateQueries({ queryKey: ['admin-post-reports'] })
    },
    onError: () => toast.error('Xóa báo cáo thất bại')
  })

  const banUserMutation = useMutation({
    mutationFn: (id) => banUserAdmin(id),
    onSuccess: () => {
      toast.success('Đã khóa user')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Khóa user thất bại')
  })

  const unbanUserMutation = useMutation({
    mutationFn: (id) => unbanUserAdmin(id),
    onSuccess: () => {
      toast.success('Đã mở khóa user')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Mở khóa user thất bại')
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id) => deleteUserAdmin(id),
    onSuccess: () => {
      toast.success('Đã xóa user')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setUserId('')
    },
    onError: () => toast.error('Xóa user thất bại')
  })

  const profile = userData?.data?.result?.[0]
  const reports = reportData?.data?.result?.posts || []
  const mealPlanReports = mealPlanReportData?.data?.result?.meal_plans || []
  const mealPlans = mealPlansData?.data?.meal_plans || mealPlansData?.data?.data || mealPlansData?.data?.result?.meal_plans || []
  const recipes = recipesData?.data?.result?.recipes || recipesData?.data?.recipes || recipesData?.data?.data || []
  const posts = publicPostsData?.data?.result?.posts || publicPostsData?.data?.posts || publicPostsData?.data?.data || []
  const users = usersData?.data?.result?.users || usersData?.data?.users || usersData?.data?.data || []

  // accumulate pagination results
  useEffect(() => {
    setPostList((prev) => (postPage === 1 ? posts : [...prev, ...posts.filter((p) => !prev.find((x) => x._id === p._id))]))
  }, [posts, postPage])

  useEffect(() => {
    setRecipeList((prev) =>
      recipePage === 1 ? recipes : [...prev, ...recipes.filter((r) => !prev.find((x) => x._id === r._id))]
    )
  }, [recipes, recipePage])

  useEffect(() => {
    setMealList((prev) =>
      mealPage === 1 ? mealPlans : [...prev, ...mealPlans.filter((m) => !prev.find((x) => x._id === m._id))]
    )
  }, [mealPlans, mealPage])

  // reset on search change
  useEffect(() => {
    setPostPage(1)
    setPostList([])
  }, [postSearch])

  useEffect(() => {
    setRecipePage(1)
    setRecipeList([])
  }, [recipeSearch])

  useEffect(() => {
    setMealPage(1)
    setMealList([])
  }, [mealSearch])

  return (
    <div className='px-4 sm:px-6 lg:px-10 py-8 text-gray-800 dark:text-gray-100'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='p-3 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'>
          <HiSparkles size={28} />
        </div>
        <div>
          <h1 className='text-2xl font-semibold'>Bảng điều khiển Admin</h1>
          <p className='text-sm text-slate-500 dark:text-slate-400'>Trang chỉ hiển thị khi tài khoản có quyền admin (role = 2).</p>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8'>
        <div className='rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm'>
          <p className='text-sm text-slate-500'>Email</p>
          <p className='text-lg font-semibold truncate'>{profile?.email || 'Đang tải...'}</p>
        </div>
        <div className='rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm'>
          <p className='text-sm text-slate-500'>Quyền</p>
          <p className='text-lg font-semibold'>Admin</p>
          <p className='text-xs text-green-600 dark:text-green-400 mt-1'>Truy cập mở rộng</p>
        </div>
        <div className='rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm'>
          <p className='text-sm text-slate-500'>Trạng thái</p>
          <p className='text-lg font-semibold'>Đang đăng nhập</p>
          <p className='text-xs text-slate-500 dark:text-slate-400'>Bạn có thể thao tác ngay trên FE hiện tại.</p>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm'>
        <div className='flex items-center justify-between gap-3 mb-4'>
          <h2 className='text-xl font-semibold'>Lối tắt quản trị</h2>
          <span className='text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'>Beta</span>
        </div>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {quickActions.map((action) => (
            <div
              key={action.title}
              className='border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3'
            >
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'>
                  <action.icon size={22} />
                </div>
                <div className='flex-1'>
                  <p className='font-semibold'>{action.title}</p>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>{action.description}</p>
                </div>
              </div>
              {action.ready ? (
                <Link
                  to={action.to}
                  className='inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Mở trang
                </Link>
              ) : (
                <span className='inline-flex items-center px-3 py-2 text-sm font-medium text-slate-500 bg-slate-200/70 dark:bg-slate-700 rounded-lg cursor-not-allowed'>
                  Sắp ra mắt
                </span>
              )}
            </div>
          ))}
        </div>
        <p className='text-sm text-slate-500 dark:text-slate-400 mt-5'>
          Các tính năng quản trị (khóa tài khoản, duyệt nội dung, xử lý báo cáo) sẽ được bật dần khi API kết nối. Bạn vẫn có thể tiếp tục dùng FE hiện tại; khi có quyền admin, lối tắt này luôn hiển thị trong thanh điều hướng.
        </p>
      </div>

      <div className='mt-8 grid gap-6 lg:grid-cols-3'>
        <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm'>
          <h3 className='text-lg font-semibold mb-3'>Xóa Meal Plan</h3>
          <p className='text-sm text-slate-500 dark:text-slate-400 mb-3'>Nhập ID meal plan cần xóa.</p>
          <input
            value={mealPlanId}
            onChange={(e) => setMealPlanId(e.target.value)}
            className='w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 mb-3'
            placeholder='Meal plan ID'
          />
          <button
            onClick={() => mealPlanId && deleteMealPlanMutation.mutate(mealPlanId)}
            disabled={!mealPlanId || deleteMealPlanMutation.isPending}
            className='w-full rounded-lg bg-red-600 text-white py-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {deleteMealPlanMutation.isPending ? 'Đang xóa...' : 'Xóa meal plan'}
          </button>
        </div>

        <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm'>
          <h3 className='text-lg font-semibold mb-3'>Xóa Recipe</h3>
          <p className='text-sm text-slate-500 dark:text-slate-400 mb-3'>Nhập ID công thức cần xóa.</p>
          <input
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className='w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 mb-3'
            placeholder='Recipe ID'
          />
          <button
            onClick={() => recipeId && deleteRecipeMutation.mutate(recipeId)}
            disabled={!recipeId || deleteRecipeMutation.isPending}
            className='w-full rounded-lg bg-red-600 text-white py-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {deleteRecipeMutation.isPending ? 'Đang xóa...' : 'Xóa recipe'}
          </button>
        </div>

        <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm'>
          <h3 className='text-lg font-semibold mb-3'>Xóa Bài Viết</h3>
          <p className='text-sm text-slate-500 dark:text-slate-400 mb-3'>Nhập ID bài viết cần xóa.</p>
          <input
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            className='w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 mb-3'
            placeholder='Post ID'
          />
          <button
            onClick={() => postId && deletePostMutation.mutate(postId)}
            disabled={!postId || deletePostMutation.isPending}
            className='w-full rounded-lg bg-red-600 text-white py-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {deletePostMutation.isPending ? 'Đang xóa...' : 'Xóa bài viết'}
          </button>
        </div>
      </div>

      <div className='mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-lg font-semibold'>Danh sách Người dùng (20 đầu tiên)</h3>
          {isLoadingUsers && <span className='text-xs text-slate-500'>Đang tải...</span>}
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead className='text-left text-slate-500'>
              <tr>
                <th className='py-2 pr-3'>ID</th>
                <th className='py-2 pr-3'>Tên</th>
                <th className='py-2 pr-3'>Email</th>
                <th className='py-2 pr-3'>Role</th>
                <th className='py-2 pr-3'>Trạng thái</th>
                <th className='py-2 pr-3'>Hành động</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className='py-2 pr-3 font-mono text-xs'>{u._id}</td>
                  <td className='py-2 pr-3 truncate max-w-xs'>{u.name || u.user_name || 'Không tên'}</td>
                  <td className='py-2 pr-3 truncate max-w-xs'>{u.email}</td>
                  <td className='py-2 pr-3'>{u.role}</td>
                  <td className='py-2 pr-3'>{u.status === 0 ? 'Bị khóa' : 'Hoạt động'}</td>
                  <td className='py-2 pr-3 space-x-2'>
                    <button
                      onClick={() => banUserMutation.mutate(u._id)}
                      className='px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-semibold'
                    >
                      Khóa
                    </button>
                    <button
                      onClick={() => unbanUserMutation.mutate(u._id)}
                      className='px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold'
                    >
                      Mở khóa
                    </button>
                    <button
                      onClick={() => deleteUserMutation.mutate(u._id)}
                      className='px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold'
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <p className='text-sm text-slate-500 mt-2'>Không có dữ liệu.</p>}
      </div>

      <div className='mt-8 grid gap-6 lg:grid-cols-2'>
        <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-lg font-semibold'>Danh sách Meal Plan (20 mới nhất)</h3>
            <div className='flex items-center gap-2'>
              <input
                value={mealSearch}
                onChange={(e) => setMealSearch(e.target.value)}
                placeholder='Tìm kiếm tên/miêu tả'
                className='text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1'
              />
              {isLoadingMealPlans && <span className='text-xs text-slate-500'>Đang tải...</span>}
            </div>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm'>
              <thead className='text-left text-slate-500'>
                <tr>
                  <th className='py-2 pr-3'>ID</th>
                  <th className='py-2 pr-3'>Tên</th>
                  <th className='py-2 pr-3'>Hành động</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
                {mealList.map((mp) => (
                  <tr key={mp._id}>
                    <td className='py-2 pr-3 font-mono text-xs'>{mp._id}</td>
                    <td className='py-2 pr-3 truncate max-w-xs'>{mp.name || mp.title || mp.description}</td>
                    <td className='py-2 pr-3 space-x-2'>
                      <Link
                        to={`/meal-plan/${mp._id}`}
                        className='px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold'
                      >
                        Xem
                      </Link>
                      <button
                        onClick={() => deleteMealPlanMutation.mutate(mp._id)}
                        className='px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold'
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mealList.length === 0 && <p className='text-sm text-slate-500 mt-2'>Không có dữ liệu.</p>}
          <div className='mt-3 flex justify-end'>
            <button
              onClick={() => setMealPage((p) => p + 1)}
              className='px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold'
            >
              Xem thêm 20
            </button>
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-lg font-semibold'>Danh sách Recipe (20 mới nhất)</h3>
            <div className='flex items-center gap-2'>
              <input
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder='Tìm kiếm tên/miêu tả'
                className='text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1'
              />
              {isLoadingRecipes && <span className='text-xs text-slate-500'>Đang tải...</span>}
            </div>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm'>
              <thead className='text-left text-slate-500'>
                <tr>
                  <th className='py-2 pr-3'>ID</th>
                  <th className='py-2 pr-3'>Tên</th>
                  <th className='py-2 pr-3'>Hành động</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
                {recipeList.map((rcp) => (
                  <tr key={rcp._id}>
                    <td className='py-2 pr-3 font-mono text-xs'>{rcp._id}</td>
                    <td className='py-2 pr-3 truncate max-w-xs'>{rcp.name || rcp.title || rcp.description}</td>
                    <td className='py-2 pr-3 space-x-2'>
                      <Link
                        to={`/cooking/recipe/${rcp._id}`}
                        className='px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold'
                      >
                        Xem
                      </Link>
                      <button
                        onClick={() => deleteRecipeMutation.mutate(rcp._id)}
                        className='px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold'
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recipeList.length === 0 && <p className='text-sm text-slate-500 mt-2'>Không có dữ liệu.</p>}
          <div className='mt-3 flex justify-end'>
            <button
              onClick={() => setRecipePage((p) => p + 1)}
              className='px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold'
            >
              Xem thêm 20
            </button>
          </div>
        </div>
      </div>

      <div className='mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-lg font-semibold'>Danh sách Bài viết (20 mới nhất)</h3>
          <div className='flex items-center gap-2'>
            <input
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
              placeholder='Tìm kiếm nội dung'
              className='text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1'
            />
            {isLoadingPosts && <span className='text-xs text-slate-500'>Đang tải...</span>}
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead className='text-left text-slate-500'>
              <tr>
                <th className='py-2 pr-3'>ID</th>
                <th className='py-2 pr-3'>Tiêu đề</th>
                <th className='py-2 pr-3'>Hành động</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
              {postList.map((post) => (
                <tr key={post._id}>
                  <td className='py-2 pr-3 font-mono text-xs'>{post._id}</td>
                  <td className='py-2 pr-3 truncate max-w-sm'>{post.content || post.title || 'Không tiêu đề'}</td>
                  <td className='py-2 pr-3 space-x-2'>
                    <Link
                      to={`/post/${post._id}`}
                      className='px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold'
                    >
                      Xem
                    </Link>
                    <button
                      onClick={() => deletePostMutation.mutate(post._id)}
                      className='px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold'
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {postList.length === 0 && <p className='text-sm text-slate-500 mt-2'>Không có dữ liệu.</p>}
        <div className='mt-3 flex justify-end'>
          <button
            onClick={() => setPostPage((p) => p + 1)}
            className='px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold'
          >
            Xem thêm 20
          </button>
        </div>
      </div>

      <div className='mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>Báo cáo bài viết</h3>
          <span className='text-xs text-slate-500'>Hiển thị tối đa 10 mục mới nhất</span>
        </div>
        {isLoadingReports ? (
          <p className='text-sm text-slate-500'>Đang tải...</p>
        ) : reports.length === 0 ? (
          <p className='text-sm text-slate-500'>Chưa có báo cáo.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm'>
              <thead className='text-left text-slate-500'>
                <tr>
                  <th className='py-2 pr-3'>Post ID</th>
                  <th className='py-2 pr-3'>Số báo cáo</th>
                  <th className='py-2 pr-3'>Lý do gần nhất</th>
                  <th className='py-2 pr-3'>Hành động</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
                {reports.map((item) => (
                  <tr key={item._id}>
                    <td className='py-2 pr-3 font-mono text-xs'>{item._id}</td>
                    <td className='py-2 pr-3'>{item.report_count}</td>
                    <td className='py-2 pr-3 max-w-xs truncate'>{item.last_reason || 'N/A'}</td>
                    <td className='py-2 pr-3 space-x-2'>
                      <Link
                        to={`/post/${item._id}`}
                        className='px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold'
                      >
                        Xem bài
                      </Link>
                      <button
                        onClick={() => acceptReportMutation.mutate(item._id)}
                        disabled={acceptReportMutation.isPending}
                        className='px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold disabled:opacity-60'
                      >
                        Duyệt
                      </button>
                      <button
                        onClick={() => rejectReportMutation.mutate(item._id)}
                        disabled={rejectReportMutation.isPending}
                        className='px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-60'
                      >
                        Xóa báo cáo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className='text-xs text-slate-500 mt-3'>API: /inspectors/post-reports (chỉ admin/inspector). Nút “Duyệt” sẽ giữ bài viết và đánh dấu đã xử lý; “Xóa báo cáo” gỡ báo cáo khỏi bài.</p>
      </div>

      <div className='mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>Báo cáo thực đơn</h3>
          <span className='text-xs text-slate-500'>Hiển thị tối đa 10 mục mới nhất</span>
        </div>
        {isLoadingMealPlanReports ? (
          <p className='text-sm text-slate-500'>Đang tải...</p>
        ) : mealPlanReports.length === 0 ? (
          <p className='text-sm text-slate-500'>Chưa có báo cáo thực đơn.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm'>
              <thead className='text-left text-slate-500'>
                <tr>
                  <th className='py-2 pr-3'>Meal Plan</th>
                  <th className='py-2 pr-3'>Tác giả</th>
                  <th className='py-2 pr-3'>Số báo cáo</th>
                  <th className='py-2 pr-3'>Lý do gần nhất</th>
                  <th className='py-2 pr-3'>Hành động</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200 dark:divide-slate-800'>
                {mealPlanReports.map((item) => (
                  <tr key={item._id}>
                    <td className='py-2 pr-3 max-w-xs truncate'>{item.title}</td>
                    <td className='py-2 pr-3 max-w-xs truncate'>{item.author?.name || 'N/A'}</td>
                    <td className='py-2 pr-3'>{item.report_count || 0}</td>
                    <td className='py-2 pr-3 max-w-sm truncate'>{item.latest_reports?.[0]?.reason || 'N/A'}</td>
                    <td className='py-2 pr-3 space-x-2'>
                      <Link
                        to={`/meal-plan/${item._id}`}
                        className='px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold'
                      >
                        Xem thực đơn
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className='text-xs text-slate-500 mt-3'>API: /inspectors/meal-plan-reports (chỉ admin/inspector). Hiện chỉ hiển thị danh sách báo cáo, chưa có hành động xử lý.</p>
      </div>
    </div>
  )
}
