import { IoTimeOutline } from 'react-icons/io5'
import { FaArrowCircleRight } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import Input from '../../components/InputComponents/Input'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { schemaBMR } from '../../utils/rules'
import { useContext, useState } from 'react'
import { calculateBMR, saveBMRData } from '../../apis/calculatorApi'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import CalculatorModal from '../../components/GlobalComponents/CalculatorModal'
import Loading from '../../components/GlobalComponents/Loading'
import { AppContext } from '../../contexts/app.context'
import { setProfileToLS } from '../../utils/auth'
import AIAnalysisModal from '../../components/GlobalComponents/AIAnalysisModal/AIAnalysisModal'
import CalculatorSidebar from '../../components/GlobalComponents/CalculatorSidebar/CalculatorSidebar'

export default function BMR() {
  const [dataBMR, setDataBMR] = useState({})
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const { setProfile, profile } = useContext(AppContext)
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schemaBMR),
    defaultValues: {
      weight: profile?.weight || '',
      height: profile?.height || '',
      age: profile?.age || '',
      gender: profile?.gender || 'male'
    }
  })

  const calculateBMRMutation = useMutation({
    mutationFn: (body) => calculateBMR(body)
  })

  const saveBMRMutation = useMutation({
    mutationFn: (body) => saveBMRData(body)
  })

  const onSubmit = handleSubmit((data) => {
    setDataBMR(data)
    calculateBMRMutation.mutate(data, {
      onSuccess: (res) => {
        const bmrValue = res.data.result
        setDataBMR((prev) => ({ ...prev, BMR: bmrValue }))
        // Auto-save
        saveBMRMutation.mutate({ ...data, BMR: bmrValue }, {
          onSuccess: (saved) => {
            toast.success('Đã tính và lưu chỉ số BMR')
            setProfile(saved?.data.result)
            setProfileToLS(saved?.data.result)
          }
        })
      },
      onError: () => { console.log('error') }
    })
  })

  return (
    <>
      <div className='grid xl:mx-4  pt-2 xl:gap-3 xl:grid-cols-6'>
        <div className='col-span-4'>
          <main className='pt-8 pb-16 rounded-lg dark:text-gray-400 shadow-md font-Roboto lg:pb-24 bg-white dark:bg-color-primary '>
            <div className='flex justify-between items-center px-3 xl:px-5 max-w-screen-xl '>
              <article className='mx-auto w-full '>
                <header className='mb-3 not-format'>
                  <h1 className='mb-1 text-3xl font-extrabold dark:text-gray-300 leading-tight text-red-700 '>
                    Chỉ số BMR là gì? Công thức tính và yếu tố tác động đến chỉ số đo BMR
                  </h1>
                  <div className='flex items-center'>
                    Thu thập bởi: <span className='font-semibold text-red-600 dark:text-pink-400 ml-1'>Nutri</span>
                    <span className='font-semibold'>Community</span>
                    <IoTimeOutline className='mr-1 ml-2' /> 02/04/2024
                  </div>
                </header>
                <p className='lead mb-4 font-medium'>
                  Việc đo BMR sẽ cho chúng ta biết mức năng lượng tối thiểu mà cơ thể cần. Qua đó để cơ thể thực hiện
                  các chức năng năng hoạt động cơ bản nhằm duy trì sự sống khi chúng ta trong trạng thái nghỉ ngơi.
                </p>
                <div className='font-medium'>Xem thêm các công thức tính khác:</div>
                <ul>
                  <li className='flex text-blue-600 dark:text-sky-200 gap-3 m-2 items-center'>
                    <FaArrowCircleRight className='text-xl' />
                    <Link to='/fitness/fitness-calculator/IBW' className=' hover:underline'>
                      Tính toán chỉ số IBW
                    </Link>
                  </li>
                  <li className='flex text-blue-600 dark:text-sky-200 gap-3 m-2 items-center'>
                    <FaArrowCircleRight className='text-xl' />
                    <Link to='/fitness/fitness-calculator/LBM' className=' hover:underline'>
                      Tính toán chỉ số LBM
                    </Link>
                  </li>
                  <li className='flex text-blue-600 dark:text-sky-200 gap-3 m-2 items-center'>
                    <FaArrowCircleRight className='text-xl' />
                    <Link to='/fitness/fitness-calculator/body-fat' className=' hover:underline'>
                      Tính toán lượng chất béo trong cơ thể
                    </Link>
                  </li>
                </ul>

                <div className='flex  flex-col items-center my-2 justify-center w-[100%]'>
                  <img
                    className='object-cover rounded-md w-[100%]'
                    src='https://sasukegym.vn/wp-content/uploads/2019/11/bmr.jpg'
                    alt=''
                  />
                </div>
                <p className='lead mb-3 font-medium'>
                  Để có một vóc dáng đẹp hoặc có cân nặng phù hợp thì cần có một chế độ ăn uống và luyện tập hợp lý. Mà
                  hai yếu tố này thì cần lưu ý đến chỉ số BMR để có thể điều chỉnh lượng Calo phù hợp cho bản thân. Vậy
                  BMR là gì? Cách đo BMR như thế nào? Hãy tìm hiểu thông qua bài viết dưới đây nhé.
                </p>
                <h2 className='font-bold text-xl my-3 dark:text-gray-300'>1. Chỉ số BMR là gì?</h2>
                <p className='mb-1'>
                  - Chỉ số BMR (Basal Metabolic Rate) là chỉ số cho chúng ta biết tỷ lệ trao đổi chất cơ bản trong cơ
                  thể con người. Đây là chỉ số cung cấp cho bạn biết mức năng lượng tối thiểu mà cơ thể người cần có, từ
                  đó giúp bạn duy trì được sự ổn định của các chức năng sống của cơ thể như hệ tuần hoàn, hệ tiêu hoá,
                  hệ hô hấp… Việc tính BMR phụ thuộc vào nhiều yếu tố, chỉ số BMR sẽ chiếm khoảng 70% tổng số lượng Calo
                  tiêu hao mỗi ngày.
                </p>
                <p className='mb-1'>
                  - Quá trình cơ thể mỗi người đốt cháy Calo không phải hầu như xuất phát từ các yếu tố bên ngoài như
                  vận động, di chuyển đi lại… mà là các hoạt động của các bộ phận như não, tim, gan, phổi, hô hấp… cũng
                  đều tiêu hao năng lượng, ngay cả khi bạn đang trong trạng thái nghỉ ngơi cũng {''}
                  <span className='font-medium'>tiêu tốn Calo.</span>
                </p>
                <div className='flex overflow-hidden gap-3 w-full items-center my-2 justify-center'>
                  <img
                    className='object-cover rounded-md '
                    src='https://mrsun.vn/wp-content/uploads/2022/11/brm-la-gi-2.png'
                    alt=''
                  />
                </div>
                <p className='mb-1'>
                  - Vì vậy, việc đo BMR có thể giúp mọi người theo dõi trọng lượng của cơ thể mình. Tổng lượng Calo cũng
                  như mức độ hoạt động của cơ thể mỗi ngày đều phụ thuộc vào chỉ số BMR. Tức là, nếu muốn tăng cân thì
                  BMR cho biết bạn phải hấp thụ lượng ăn lớn hơn tổng lượng Calo cần có. Còn nếu muốn giảm cân thì bạn
                  cần phải có chế độ tập luyện và có chế độ ăn phù hợp.
                </p>
                <h2 className='font-bold text-xl my-3 dark:text-gray-300'>2. Công thức tính chỉ số đo BMR</h2>

                <p className='mt-2'>
                  BMR tượng trưng cho mức tiêu thụ năng lượng ở điều kiện không hoạt động. Công thức được tính dựa trên
                  chỉ số chiều cao, cân nặng và độ tuổi của một người. Theo phương trình Mifflin-St Jeor ta có:
                </p>
                <ul className='list-disc mt-3 mb-4'>
                  <li className='ml-6 font-medium text-red-700 dark:text-sky-300'>
                    Nam giới: (9.99 x Weight [kg]) + (6.25 x Height [cm]) - (4.92 x Age) + 5
                  </li>
                  <li className='ml-6 font-medium text-red-700 dark:text-sky-300'>
                    Nữ giới: (9.99 x Weight [kg]) + (6.25 x Height [cm]) - (4.92 x Age) - 161
                  </li>
                </ul>
                <div className='flex  flex-col items-center my-2 justify-center w-[100%]'>
                  <img
                    className='object-cover rounded-md w-[100%]'
                    src='https://www.inchcalculator.com/wp-content/uploads/2021/04/bmr-formulas.png'
                    alt=''
                  />
                </div>
                <p className='mt-3'>
                  Theo Hiệp hội Dinh dưỡng Hoa Kỳ, công thức Mifflin St Jeor tính chỉ số BMR chuẩn được đánh giá là công
                  thức có độ chính xác cao nhất. Hiện nay, công thức này trở thành tiêu chuẩn để đo BMR và được ứng dụng
                  khá phổ biến.
                </p>

                <h2 className='font-bold text-xl mt-5 mb-3 dark:text-gray-300'>
                  2. Các yếu tố tác động đến chỉ số BMR
                </h2>
                <p className='mb-2'>Chỉ số BMR của một người được xác định bởi các yếu tố như sau:</p>
                <ul className='list-disc mt-3 mb-4'>
                  <li className='ml-6 mb-1'>
                    Khối lượng của cơ: Cơ bắp là số lượng mô có trên cơ thể của mỗi người và chúng cần nhiều năng lượng
                    để hoạt động hơn các mô mỡ. Điều này sẽ tác động trực tiếp tới chỉ số đo BMR.
                  </li>
                  <li className='ml-6 mb-1'>
                    Trọng lượng của cơ thể: Theo các nhà nghiên cứu, người có kích thước trọng lượng cơ thể lớn hơn so
                    với người bình thường, đồng nghĩa với việc có chỉ số BMR cao hơn. Bởi vậy cơ thể cần tiêu hao một
                    lượng Calo nhiều hơn để duy trì sức khỏe ổn định.
                  </li>
                  <li className='ml-6 mb-1'>
                    Độ tuổi: Tuổi tác tỉ lệ thuận với độ lớn chỉ số BMR. Có nghĩa là tuổi của bạn càng cao, thì mức tiêu
                    hao năng lượng của bạn càng chậm. Điều này đã khiến chỉ số BMR chuẩn cũng giảm đi.
                  </li>
                  <li className='ml-6 mb-1'>
                    Giới tính: Theo nghiên cứu, nam giới có chỉ số BMR cao hơn nữ giới, do khối lượng cơ bắp của nam
                    giới nhiều hơn, hơn nữa tỷ lệ mỡ của cơ thể nam giới cũng ít hơn..
                  </li>
                  <li className='ml-6 mb-1'>
                    Yếu tố di truyền: Khả năng trao đổi chất của một người có thể được quyết định bởi một phần gen di
                    truyền. Đây cũng là yếu tố rất quan trọng, tác động lớn đến chỉ số BMR.
                  </li>
                  <li className='ml-6 mb-1'>
                    Tập thể dục thể thao: Việc tập luyện thể thao thường xuyên vừa giúp rèn luyện sức khỏe, vừa giúp cho
                    chỉ số BMR tăng lên.
                  </li>
                </ul>
                <p>
                  Ngoài ra còn một số nhân tố tác động đến việc đo BMR như yếu tố nội tiết tố nhất là ở nữ giới, thuốc,
                  chế độ ăn uống cũng như chế độ sinh hoạt.
                </p>
                <div className='flex  flex-col items-center my-2 justify-center w-[100%]'>
                  <img
                    className='object-cover rounded-md w-[100%]'
                    src='https://drinkocany.com/wp-content/uploads/2022/12/tinh-bmr-4-1.jpg'
                    alt=''
                  />
                </div>
                <h2 className='font-bold text-xl mt-5 mb-3 dark:text-gray-300'>3. Cách điều chỉnh chỉ số BMR</h2>
                <p className='mb-2'>
                  Chỉ số BMR sẽ cho bạn biết mức năng lượng cần cho cơ thể để cơ thể hoạt động, giúp duy trì sự sống.
                  Dưới đây là một số cách điều chỉnh về chỉ số BMR, cụ thể:
                </p>
                <ul className='list-disc mt-3 mb-4'>
                  <li className='ml-6 mb-1'>
                    Luyện tập để tăng cơ: Khi bạn càng có nhiều cơ thì lúc nghỉ ngơi cơ thể bạn càng đốt cháy nhiều năng
                    lượng. Do vậy, việc tập luyện thể thao thường xuyên sẽ giúp bạn tăng cơ đồng nghĩa với việc chỉ số
                    đo BMR của bạn cũng tăng.
                  </li>
                  <li className='ml-6 mb-1'>
                    Xây dựng chế độ ăn khoa học, đủ chất: Một cách làm tăng chỉ số BMR đó là ăn uống đủ chất, đủ lượng
                    Calo. Nếu bạn muốn giảm cân, không nên giảm chế độ ăn uống một cách đột ngột, mà hãy giảm từ từ
                    xuống đến mức phù hợp với bản thân.
                  </li>
                  <li className='ml-6 mb-1'>
                    Tuyệt đối không nên bỏ đói hoặc ăn kiêng quá mức: Thực tế, khi bạn không ăn thì có thể giảm được vài
                    cân, tuy nhiên phần giảm này đa số là nước. Điều này sẽ làm chậm quá trình trao đổi chất bên trong
                    cơ thể của bạn.
                  </li>
                </ul>
                <div className='flex  flex-col items-center my-2 justify-center w-[100%]'>
                  <img
                    className='object-cover rounded-md w-[100%]'
                    src='https://i1-suckhoe.vnecdn.net/2023/09/29/telemmglpict000349937914-16951-9330-5519-1695986615.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=ewIg1ulcImuxykA29O8zaQ'
                    alt=''
                  />
                </div>
                <p>
                  Trên đây là những thông tin về chỉ số đo BMR. Hy vọng bài viết trên sẽ mang lại cho người đọc các
                  thông tin hữu ích về cách tính chỉ số BMR trong việc điều chỉnh chỉ số BMR cũng như lượng Calo tiêu
                  thụ mỗi ngày.
                </p>
              </article>
            </div>
          </main>
        </div>
        <div className='col-span-6 order-first xl:order-last my-3 xl:my-0 xl:col-span-2'>
          <CalculatorSidebar
            title='Tính toán BMR'
            subtitle='(Phương trình Mifflin-St Jeor)'
            gradient='from-teal-500 to-cyan-400'
            result={(profile?.BMR || dataBMR.BMR) ? {
              value: profile?.BMR || dataBMR.BMR,
              unit: 'kcal/ngày',
              label: 'Năng lượng cơ bản cƧa cơ thể bạn'
            } : null}
            onAIClick={(profile?.BMR || dataBMR.BMR) ? () => setIsAIModalOpen(true) : null}
          >
            <form noValidate onSubmit={onSubmit} className='space-y-3'>
              <Input title='Cân nặng (kg)' type='number' name='weight' register={register} errors={errors.weight} id='weight' placeholder='Nhập cân nặng' />
              <Input title='Chiều cao (cm)' type='number' name='height' register={register} errors={errors.height} id='height' placeholder='Nhập chiều cao' />
              <Input title='Tuổi' type='number' register={register} errors={errors.age} name='age' id='age' placeholder='Nhập tuổi của bạn' />
              <div className='mb-3'>
                <div className='text-gray-600 dark:text-gray-400 text-sm font-medium mb-2'>Giới tính:</div>
                <div className='flex gap-4'>
                  <div className='flex items-center'>
                    <input type='radio' name='default-radio' value='male' {...register('gender')} id='male' className='radio radio-success' />
                    <label htmlFor='male' className='ms-2 text-sm font-medium text-gray-900 dark:text-gray-300'>Nam</label>
                  </div>
                  <div className='flex items-center'>
                    <input type='radio' name='default-radio' value='female' {...register('gender')} id='female' className='radio radio-success' />
                    <label htmlFor='female' className='ms-2 text-sm font-medium text-gray-900 dark:text-gray-300'>Nữ</label>
                  </div>
                </div>
              </div>
              <div className='pt-1'>
                {calculateBMRMutation.isPending ? (
                  <button disabled className='w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 text-white font-semibold flex items-center justify-center gap-2 opacity-70'>
                    <Loading classNameSpin='inline w-5 h-5 text-white/60 animate-spin fill-white' /> Đang tính...
                  </button>
                ) : (
                  <button className='w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-600 hover:to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200'>
                    Tính toán
                  </button>
                )}
              </div>
            </form>
          </CalculatorSidebar>
          <AIAnalysisModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            calculationType='BMR'
            inputData={{ weight: dataBMR.weight, height: dataBMR.height, age: dataBMR.age, gender: dataBMR.gender }}
            calculatedResult={{ BMR: profile?.BMR || dataBMR.BMR }}
          />
        </div>
      </div>
    </>
  )
}
