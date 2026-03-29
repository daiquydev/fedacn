// Import icon cho Training
import { FaTrophy } from 'react-icons/fa'

// Trong mảng menu items hoặc cấu trúc danh sách menu, thêm mục Training
// (Thêm ở vị trí tương tự với SportEvent)
{
  title: 'Thử thách',
  path: '/training',
  icon: <FaTrophy className="w-6 h-6" />,
  activeIcon: <FaTrophy className="w-6 h-6 text-green-500" />,
  submenu: [
    {
      title: 'Thử thách cộng đồng',
      path: '/training'
    },
    {
      title: 'Thử thách của tôi',
      path: '/training/my-Trainings'
    },
    {
      title: 'Tạo thử thách',
      path: '/training/create'
    }
  ]
} 