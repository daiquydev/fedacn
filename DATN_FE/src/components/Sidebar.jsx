// Import icon cho Challenge
import { FaTrophy } from 'react-icons/fa'

// Trong mảng menu items hoặc cấu trúc danh sách menu, thêm mục Challenge
// (Thêm ở vị trí tương tự với SportEvent)
{
  title: 'Thử thách',
  path: '/challenge',
  icon: <FaTrophy className="w-6 h-6" />,
  activeIcon: <FaTrophy className="w-6 h-6 text-green-500" />,
  submenu: [
    {
      title: 'Thử thách cộng đồng',
      path: '/challenge'
    },
    {
      title: 'Thử thách của tôi',
      path: '/challenge/my-challenges'
    },
    {
      title: 'Tạo thử thách',
      path: '/challenge/create'
    }
  ]
} 