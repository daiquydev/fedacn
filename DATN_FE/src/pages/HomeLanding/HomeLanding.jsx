import { useEffect, useRef, useState } from 'react'
import {
  FaLeaf,
  FaUsers,
  FaCalculator,
  FaRunning,
  FaDumbbell,
  FaChartLine,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaBars,
  FaTimes,
  FaRobot,
  FaCamera
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import heroImg from '../../assets/images/hero_fitness.png'

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          let start = 0
          const duration = 2000
          const step = target / (duration / 16)
          const timer = setInterval(() => {
            start += step
            if (start >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

const features = [
  {
    icon: FaRobot,
    title: 'AI Gợi ý bài tập',
    desc: 'Trí tuệ nhân tạo phân tích thể trạng và đề xuất bài tập phù hợp nhất cho bạn.',
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    icon: FaRobot,
    title: 'AI Lập kế hoạch dinh dưỡng',
    desc: 'AI tự động tạo thực đơn ăn uống cá nhân hóa dựa trên mục tiêu sức khỏe.',
    color: 'bg-amber-100 text-amber-600'
  },
  {
    icon: FaCamera,
    title: 'AI Nhận diện thực phẩm',
    desc: 'Chụp ảnh món ăn, AI phân tích thành phần dinh dưỡng và calo ngay lập tức.',
    color: 'bg-teal-100 text-teal-600'
  },
  {
    icon: FaRunning,
    title: 'Sự kiện thể thao',
    desc: 'Tham gia sự kiện thể dục, theo dõi tiến trình cùng nhóm.',
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    icon: FaDumbbell,
    title: 'Lịch tập luyện thông minh',
    desc: 'Tạo và quản lý lịch tập luyện cá nhân với AI hỗ trợ tối ưu.',
    color: 'bg-amber-100 text-amber-600'
  },
  {
    icon: FaChartLine,
    title: 'Thống kê & Phân tích AI',
    desc: 'Dashboard thông minh phân tích dữ liệu sức khỏe và đưa ra khuyến nghị.',
    color: 'bg-teal-100 text-teal-600'
  }
]

const stats = [
  { value: 10000, suffix: '+', label: 'Thành viên' },
  { value: 500, suffix: '+', label: 'Sự kiện' },
  { value: 1000, suffix: '+', label: 'Bài tập AI' },
  { value: 50, suffix: '+', label: 'Chuyên gia' }
]

export default function HomeLanding() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className='min-h-screen bg-white font-Inter'>
      {/* ─── Navbar ─── */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-white'
        }`}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16 items-center'>
            {/* Logo */}
            <Link to='/' className='flex items-center gap-2'>
              <div className='w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center'>
                <FaLeaf className='text-white text-sm' />
              </div>
              <span className='text-xl font-bold text-gray-900'>
                Fit<span className='text-emerald-600'>Connect</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className='hidden md:flex items-center gap-1'>
              <Link
                to='/'
                className='text-gray-600 hover:text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              >
                Trang Chủ
              </Link>
            </div>

            {/* Auth buttons */}
            <div className='hidden md:flex items-center gap-3'>
              <Link
                to='/login'
                className='text-gray-700 hover:text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
              >
                Đăng nhập
              </Link>
              <Link
                to='/register'
                className='bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-amber-200 hover:shadow-lg hover:shadow-amber-300'
              >
                Đăng ký
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className='md:hidden text-gray-600 p-2'
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <FaTimes className='text-xl' /> : <FaBars className='text-xl' />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className='md:hidden bg-white border-t px-4 py-4 space-y-2'>
            <Link
              to='/'
              className='block text-gray-600 hover:text-emerald-600 px-4 py-2 rounded-lg text-sm'
            >
              Trang Chủ
            </Link>
            <div className='flex gap-2 pt-2'>
              <Link to='/login' className='flex-1 text-center text-emerald-600 border border-emerald-600 py-2 rounded-lg text-sm font-medium'>
                Đăng nhập
              </Link>
              <Link to='/register' className='flex-1 text-center bg-amber-500 text-white py-2 rounded-lg text-sm font-medium'>
                Đăng ký
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ─── */}
      <section className='pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            {/* Text */}
            <div>
              <div className='inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6'>
                <span className='w-2 h-2 bg-emerald-500 rounded-full animate-pulse' />
                Nền tảng sức khỏe cộng đồng #1
              </div>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight'>
                Khỏe Mạnh và{' '}
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500'>
                  Kết Nối
                </span>
              </h1>
              <p className='mt-6 text-lg text-gray-500 leading-relaxed max-w-lg'>
                Chào mừng đến với FitConnect — Nơi bạn kết nối với cộng đồng yêu thích thể dục thể thao
                và rèn luyện sức khỏe một cách an toàn và tin cậy.
              </p>
              <div className='mt-8 flex flex-wrap gap-4'>
                <Link
                  to='/register'
                  className='bg-amber-500 hover:bg-amber-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 hover:-translate-y-0.5'
                >
                  Bắt đầu miễn phí
                </Link>
                <Link
                  to='/login'
                  className='border-2 border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-600 px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5'
                >
                  Đăng nhập
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className='relative'>
              <div className='absolute -top-10 -right-10 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl' />
              <div className='absolute -bottom-10 -left-10 w-60 h-60 bg-amber-200/30 rounded-full blur-3xl' />
              <img
                src={heroImg}
                alt='FitConnect - Cộng đồng sức khỏe'
                className='relative z-10 w-full max-w-lg mx-auto drop-shadow-2xl'
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className='py-20 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-2xl mx-auto mb-16'>
            <span className='text-emerald-600 font-semibold text-sm uppercase tracking-wider'>Tính năng</span>
            <h2 className='mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight'>
              Với FitConnect, bạn có thể làm gì?
            </h2>
            <p className='mt-4 text-gray-500 text-lg'>
              Mọi công cụ bạn cần cho hành trình sức khỏe, tất cả trong một nền tảng.
            </p>
          </div>

          <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((f, i) => (
              <div
                key={i}
                className='group bg-white rounded-2xl p-7 border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300 hover:-translate-y-1 cursor-default'
              >
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className='text-xl' />
                </div>
                <h3 className='text-lg font-bold text-gray-900 mb-2'>{f.title}</h3>
                <p className='text-gray-500 text-sm leading-relaxed'>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Section ─── */}
      <section className='py-16 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-8'>
            {stats.map((s, i) => (
              <div key={i} className='text-center'>
                <div className='text-4xl lg:text-5xl font-extrabold text-white mb-2'>
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className='text-emerald-200 font-medium'>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className='py-20'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight'>
            Bắt đầu hành trình của bạn ngay hôm nay!
          </h2>
          <p className='mt-4 text-gray-500 text-lg max-w-2xl mx-auto'>
            Gia nhập cộng đồng FitConnect để cùng nhau tập luyện, chia sẻ kinh nghiệm và đạt được mục tiêu sức khỏe.
          </p>
          <div className='mt-8'>
            <Link
              to='/register'
              className='inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 hover:-translate-y-0.5'
            >
              Tham gia ngay
              <svg className='ml-2 w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 8l4 4m0 0l-4 4m4-4H3' />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className='bg-gray-900 text-gray-400 pt-16 pb-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-gray-800'>
            {/* Brand */}
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <div className='w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center'>
                  <FaLeaf className='text-white text-xs' />
                </div>
                <span className='text-white text-lg font-bold'>FitConnect</span>
              </div>
              <p className='text-sm leading-relaxed'>
                Nền tảng kết nối cộng đồng sức khỏe và thể thao hàng đầu Việt Nam.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className='text-white text-sm font-semibold uppercase tracking-wider mb-4'>Liên kết</h4>
              <ul className='space-y-3'>
                <li><Link to='/' className='hover:text-emerald-400 transition-colors text-sm'>Trang chủ</Link></li>
                <li><Link to='/blog' className='hover:text-emerald-400 transition-colors text-sm'>Blog</Link></li>
                <li><Link to='/contact' className='hover:text-emerald-400 transition-colors text-sm'>Liên hệ</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className='text-white text-sm font-semibold uppercase tracking-wider mb-4'>Liên hệ</h4>
              <ul className='space-y-3 text-sm'>
                <li>Email: contact@fitconnect.com</li>
                <li>SĐT: (123) 456-7890</li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className='text-white text-sm font-semibold uppercase tracking-wider mb-4'>Mạng xã hội</h4>
              <div className='flex gap-4'>
                <a href='#' className='w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors'>
                  <FaFacebook />
                </a>
                <a href='#' className='w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors'>
                  <FaInstagram />
                </a>
                <a href='#' className='w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors'>
                  <FaTwitter />
                </a>
              </div>
            </div>
          </div>

          <div className='pt-8 text-center text-sm text-gray-500'>
            © {new Date().getFullYear()} FitConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
