import { FaAppleAlt, FaUtensils, FaUsers, FaCalculator, FaLeaf, FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa'
import { Link } from 'react-router-dom'

export default function HomeLanding() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <FaLeaf className="h-8 w-8 text-green-500" />
                <span className="ml-2 text-xl font-bold text-green-600 dark:text-green-400">NutriCommunity</span>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link to="/" className="text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
                  Trang Chủ
                </Link>
                <Link to="/explore" className="text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
                  Khám Phá
                </Link>
                <Link to="/about" className="text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
                  Thông tin
                </Link>
                <Link to="/get-started" className="text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
                  Bắt đầu
                </Link>
                <Link to="/contact" className="text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
                  Liên hệ
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link to="/login" className="text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
                Đăng nhập
              </Link>
              <Link to="/register" className="ml-4 bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium">
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-16">
        <div className="relative bg-green-50 dark:bg-gray-800 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                    <span className="block">Khỏe Mạnh và</span>
                    <span className="block text-green-600 dark:text-green-400">Kết Nối</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 dark:text-gray-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Chào mừng đến với NutriCommunity - Nơi bạn có thể kết nối với cộng đồng yêu thích dinh dưỡng và sức khỏe một cách an toàn và tin cậy.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link to="/register" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10">
                        Đăng ký ngay!
                      </Link>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-green-600 dark:text-green-400 font-semibold tracking-wide uppercase">Tính năng</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Với NutriCommunity, bạn có thể làm gì?
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <FaUsers className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Tham gia diễn đàn</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Tham gia các cuộc thảo luận sôi nổi về dinh dưỡng, chia sẻ mẹo hay, và kết bạn với những người có cùng đam mê.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <FaUtensils className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Chia sẻ thực đơn</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Chia sẻ thực đơn ăn uống lành mạnh của bạn và khám phá những công thức mới từ các thành viên khác.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <FaCalculator className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Tính toán chỉ số sức khỏe</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Sử dụng các công cụ chuyên nghiệp để tính toán BMI, BMR, và các chỉ số sức khỏe khác.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <FaAppleAlt className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Tham gia sự kiện</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Tham gia các sự kiện thể dục, lớp học nấu ăn lành mạnh, và hội thảo sức khỏe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="bg-green-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            <span className="block">Bắt đầu hành trình của bạn ngay hôm nay!</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                Tham gia ngay
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Liên hệ</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                    Email: contact@nutricommunity.com
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                    SĐT: (123) 456-7890
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Liên kết nhanh</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link to="/about" className="text-base text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                    Về chúng tôi
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-base text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-base text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                    Liên hệ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Mạng xã hội</h3>
              <div className="mt-4 flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-green-500">
                  <FaFacebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-500">
                  <FaInstagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-500">
                  <FaTwitter className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Đăng ký nhận tin</h3>
              <form className="mt-4">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="submit"
                  className="mt-2 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Đăng ký
                </button>
              </form>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">
              © 2024 NutriCommunity. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
