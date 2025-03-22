import DarkMode from '../DarkMode'
import logo from '../../../assets/images/logo.png'
import { useNavigate } from 'react-router-dom'
import { FaLeaf } from 'react-icons/fa'

export default function Logo({
  className = 'flex items-center gap-2.5 font-medium pb-3.5 pt-3 mx-3',
  textClassName = 'text-2xl flex font-bold whitespace-pre',
  sizeLogo = 50
}) {
  const navigate = useNavigate()
  return (
    <div className={className}>
      <div className="flex items-center cursor-pointer" onClick={() => navigate('/home')}>
        <FaLeaf className="text-green-500" size={sizeLogo} />
      </div>
      <span className={textClassName}>
        <span className='text-green-500'>Nutri</span>
        Community
        <DarkMode />
      </span>
    </div>
  )
}
