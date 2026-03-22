export default function LoadingHome() {
  return (
    <div className='w-full py-40 flex flex-col items-center justify-center gap-6'>
      <div className='relative w-16 h-16'>
        <div className='absolute inset-0 rounded-full border-4 border-brand-green/20 dark:border-brand-green/10'></div>
        <div className='absolute inset-0 rounded-full border-4 border-brand-green border-t-transparent animate-spin'></div>
      </div>
      <h1 className='text-lg font-medium text-color-gray dark:text-gray-300 animate-pulse'>Đang tải bài viết...</h1>
    </div>
  )
}
