import DarkMode from '../DarkMode'
import logo from '../../../assets/images/logo.png'

export default function Logo({
  className = 'flex items-center gap-2.5 font-medium pb-3.5 pt-3 mx-3',
  textClassName = 'text-2xl flex font-bold whitespace-pre',
  sizeLogo = 50
}) {
  return (
    <div className={className}>
      <img src={logo} width={sizeLogo} alt='icon-app' />
      <div>
        <span className={textClassName}>
          <span className='text-red-500'>Nutri</span>Community
          <DarkMode />
        </span>
        <div className='text-sm flex text-gray-500 items-center font-semibold'>Admin</div>
      </div>
    </div>
  )
}
