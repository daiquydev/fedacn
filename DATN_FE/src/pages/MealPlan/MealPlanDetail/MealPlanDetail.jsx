import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaRegHeart, FaHeart, FaRegComment, FaCheckCircle, FaRegClock, FaShare, FaStar, FaPrint, FaBookmark, FaRegBookmark, FaCalendarAlt, FaCheckSquare, FaBell, FaClipboardList, FaUtensils, FaFire, FaInfoCircle } from 'react-icons/fa'
import { MdFastfood, MdClose, MdSchedule, MdDateRange } from 'react-icons/md'
import { IoMdTime } from 'react-icons/io'
import NutritionChart from './components/NutritionChart'
import DayMealPlan from './components/DayMealPlan'

export default function MealPlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [mealPlan, setMealPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(1)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  
  // Thêm các state mới
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [startDate, setStartDate] = useState(getCurrentDate())
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // Thêm state để quản lý modal cách chế biến
  const [showCookingModal, setShowCookingModal] = useState(false)
  const [activeMeal, setActiveMeal] = useState(null)
  
  // Mock data - in a real app, this would be fetched from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      try {
        // This is sample data - would come from an API in production
        const mealPlanData = {
          id: parseInt(id),
          title: 'Thực đơn giảm cân 7 ngày',
          description: 'Thực đơn giảm cân lành mạnh với đầy đủ dinh dưỡng cho 7 ngày, giúp bạn đạt được mục tiêu giảm cân một cách khoa học và bền vững.',
          author: {
            id: 1,
            name: 'Nguyễn Văn A',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            isVerified: true
          },
          duration: 7,
          category: 'Giảm cân',
          likes: 120,
          comments: 24,
          rating: 4.7,
          ratingCount: 48,
          createdAt: '2024-12-15T09:00:00Z',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000',
          notes: '<p>Thực đơn này được thiết kế để cung cấp đủ dinh dưỡng trong khi giúp bạn tạo ra sự thiếu hụt calo để giảm cân. Uống ít nhất 2 lít nước mỗi ngày và kết hợp với tập thể dục 30 phút mỗi ngày để có kết quả tốt nhất.</p><p>Bạn có thể điều chỉnh khẩu phần ăn tùy theo nhu cầu calo cá nhân. Nếu bạn cảm thấy đói, hãy thêm protein và rau xanh thay vì carbs.</p>',
          averageNutrition: {
            calories: 1500,
            protein: 90,
            carbs: 150,
            fat: 50
          },
          days: [
            {
              id: 1,
              day: 1,
              meals: [
                { 
                  type: 'Sáng', 
                  content: 'Yến mạch sữa hạnh nhân với trái cây',
                  calories: 320,
                  protein: 12,
                  carbs: 45,
                  fat: 10,
                  image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu 50g yến mạch với 250ml sữa hạnh nhân trong 3-5 phút.</li><li>Thêm 1/2 thìa cafe mật ong (tùy chọn).</li><li>Thái chuối thành lát và rắc lên trên.</li><li>Đập nhỏ hạnh nhân và rắc lên trên cùng.</li></ol>'
                },
                { 
                  type: 'Trưa', 
                  content: 'Salad gà nướng với rau xanh',
                  calories: 450,
                  protein: 35,
                  carbs: 25,
                  fat: 20,
                  image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp ức gà với muối, tiêu, bột tỏi, và một ít dầu olive trong 15 phút.</li><li>Nướng gà ở 200°C trong 15-20 phút hoặc đến khi chín.</li><li>Để nguội và cắt thành lát nhỏ.</li><li>Trộn rau xanh, cà chua, dưa chuột trong tô lớn.</li><li>Thêm gà nướng đã cắt lát.</li><li>Rưới dầu olive và chanh, thêm muối và tiêu vừa đủ.</li></ol>'
                },
                { 
                  type: 'Tối', 
                  content: 'Cá hồi nướng với măng tây',
                  calories: 480,
                  protein: 30,
                  carbs: 40,
                  fat: 15,
                  image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp cá hồi với muối, tiêu, chanh trong 30 phút.</li><li>Nướng cá hồi ở 180°C trong 12-15 phút.</li><li>Cắt khoai lang thành miếng vừa, thấm khô, trộn với dầu olive, muối, tiêu.</li><li>Nướng khoai lang ở 200°C trong 25-30 phút, đảo một lần giữa chừng.</li><li>Luộc măng tây trong 3-4 phút, sau đó ngâm ngay vào nước đá.</li><li>Xào nhanh măng tây với một ít dầu olive và tỏi.</li></ol>'
                }
              ]
            },
            {
              id: 2,
              day: 2,
              meals: [
                { 
                  type: 'Sáng', 
                  content: 'Bánh mì nguyên cám với trứng',
                  calories: 350,
                  protein: 18,
                  carbs: 40,
                  fat: 12,
                  image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nướng bánh mì nguyên cám.</li><li>Chiên trứng với chút dầu olive.</li><li>Đặt trứng lên bánh mì, thêm rau xanh và gia vị.</li></ol>'
                },
                { 
                  type: 'Trưa', 
                  content: 'Cơm gạo lứt với đậu hũ',
                  calories: 420,
                  protein: 20,
                  carbs: 65,
                  fat: 8,
                  image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu gạo lứt với nước theo tỉ lệ 1:2.</li><li>Cắt đậu hũ thành khối vuông và ướp với xì dầu, tỏi.</li><li>Chiên hoặc nướng đậu hũ đến khi vàng.</li><li>Phục vụ với rau xanh và sốt.</li></ol>'
                },
                { 
                  type: 'Tối', 
                  content: 'Thịt gà nướng rau củ',
                  calories: 450,
                  protein: 40,
                  carbs: 30,
                  fat: 15,
                  image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp thịt gà với gia vị, dầu olive trong 30 phút.</li><li>Cắt rau củ thành miếng vừa.</li><li>Xếp thịt gà và rau củ vào khay nướng.</li><li>Nướng ở 200°C trong khoảng 25-30 phút.</li></ol>'
                }
              ]
            },
            {
              id: 3,
              day: 3,
              meals: [
                { 
                  type: 'Sáng', 
                  content: 'Sinh tố protein với trái cây',
                  calories: 280,
                  protein: 24,
                  carbs: 30,
                  fat: 8,
                  image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Cho vào máy xay: 1 chuối, 1 muỗng bột protein, 240ml sữa hạnh nhân, 1 muỗng bơ đậu phộng.</li><li>Xay đến khi mịn.</li></ol>'
                },
                { 
                  type: 'Trưa', 
                  content: 'Bún chả',
                  calories: 550,
                  protein: 30,
                  carbs: 70,
                  fat: 18,
                  image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp thịt với hành, tỏi, đường, nước mắm, tiêu.</li><li>Nướng thịt trên bếp than hoa.</li><li>Làm nước chấm với nước mắm, đường, tỏi, ớt, chanh.</li><li>Trụng bún.</li><li>Ăn kèm với rau sống, chả nướng và nước chấm.</li></ol>'
                },
                { 
                  type: 'Tối', 
                  content: 'Canh rau củ với một ít thịt heo nạc',
                  calories: 320,
                  protein: 25,
                  carbs: 30,
                  fat: 12,
                  image: 'https://cdn.tgdd.vn/Files/2020/05/05/1253676/cach-nau-2-mon-canh-thit-xay-vien-rau-ru-va-canh-cai-thao-thit-xay-de-lam-day-du-dinh-duong-12.jpg',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Đun sôi nước với xương hoặc nước dùng.</li><li>Thêm hành tím, tỏi băm nhỏ.</li><li>Thêm các loại rau củ (cà rốt, khoai tây, bắp cải).</li><li>Thêm thịt heo nạc thái mỏng.</li><li>Nêm với muối, tiêu và hạt nêm.</li><li>Nấu cho đến khi rau củ mềm.</li></ol>'
                }
              ]
            },
            {
              id: 4,
              day: 4,
              meals: [
                { 
                  type: 'Sáng', 
                  content: 'Phở gà',
                  calories: 420,
                  protein: 25,
                  carbs: 60,
                  fat: 10,
                  image: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ninh xương gà và các gia vị (hồi, quế, đinh hương) trong 4-6 giờ.</li><li>Luộc thịt gà và xé sợi.</li><li>Luộc bánh phở.</li><li>Xếp bánh phở vào tô, đặt thịt gà lên trên.</li><li>Chan nước dùng nóng vào.</li><li>Thêm hành, ngò, giá đỗ và ớt tươi.</li></ol>'
                },
                { 
                  type: 'Trưa', 
                  content: 'Gỏi cuốn tôm thịt',
                  calories: 220,
                  protein: 15,
                  carbs: 30,
                  fat: 5,
                  image: 'https://images.unsplash.com/photo-1562967914-01efa7e87832?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Luộc tôm và thịt heo.</li><li>Nhúng bánh tráng vào nước ấm.</li><li>Xếp rau xà lách, bún, rau thơm, thịt heo và tôm lên bánh tráng.</li><li>Cuộn chặt bánh tráng lại.</li><li>Làm nước sốt tương từ tương hột, đường, tỏi, ớt và nước cốt chanh.</li></ol>'
                },
                { 
                  type: 'Tối', 
                  content: 'Cơm chiên dương châu',
                  calories: 480,
                  protein: 20,
                  carbs: 65,
                  fat: 15,
                  image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu cơm trước và để nguội.</li><li>Cắt thịt xá xíu, lạp xưởng, thịt nguội thành hạt lựu.</li><li>Cắt nhỏ hành, tỏi, cà rốt, đậu Hà Lan.</li><li>Đánh trứng và làm trứng chén.</li><li>Xào tất cả nguyên liệu với cơm nguội.</li><li>Nêm gia vị vừa ăn.</li></ol>'
                }
              ]
            },
            {
              id: 5,
              day: 5,
              meals: [
                { 
                  type: 'Sáng', 
                  content: 'Cháo yến mạch bơ đậu phộng',
                  calories: 350,
                  protein: 14,
                  carbs: 42,
                  fat: 14,
                  image: 'https://preview.redd.it/i-made-peanut-butter-oatmeal-for-breakfast-this-morning-v0-o4g2gnencwvc1.jpg?width=640&crop=smart&auto=webp&s=e81787eb05fb12ab8da9da3d3f6c94e4c015f595',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu 50g yến mạch với 300ml nước hoặc sữa.</li><li>Thêm 1 muỗng canh bơ đậu phộng khi yến mạch đã mềm.</li><li>Thêm chút mật ong hoặc đường nâu và quế.</li><li>Trang trí với chuối thái lát và hạt chia.</li></ol>'
                },
                { 
                  type: 'Trưa', 
                  content: 'Cơm tấm sườn nướng',
                  calories: 650,
                  protein: 35,
                  carbs: 85,
                  fat: 20,
                  image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp sườn với sả, tỏi, đường, nước mắm, dầu hào.</li><li>Nướng sườn trên lửa than hoặc trong lò.</li><li>Nấu cơm tấm.</li><li>Làm nước mắm pha với đường, chanh, tỏi, ớt.</li><li>Phục vụ kèm đồ chua, dưa leo, cà chua.</li></ol>'
                },
                { 
                  type: 'Tối', 
                  content: 'Bánh xèo',
                  calories: 480,
                  protein: 18,
                  carbs: 50,
                  fat: 25,
                  image: 'https://bizweb.dktcdn.net/100/514/078/products/banh-xeo-3-mien-day-nghe-rosa-bien-hoa-dong-nai-2.jpg?v=1716438613080',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Trộn bột gạo với nghệ, muối và nước cốt dừa.</li><li>Làm nóng chảo, thêm dầu và đổ bột vào.</li><li>Thêm thịt heo, tôm và giá đỗ.</li><li>Đậy nắp để bánh chín giòn.</li><li>Gấp đôi bánh lại và dùng với rau sống và nước mắm pha.</li></ol>'
                }
              ]
            },
            {
              id: 6,
              day: 6,
              meals: [
                { 
                  type: 'Sáng', 
                  content: 'Bánh mì kẹp trứng cà chua',
                  calories: 380,
                  protein: 15,
                  carbs: 45,
                  fat: 18,
                  image: 'https://images.unsplash.com/photo-1613769049987-b31b641f25b1?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Chiên trứng với muối và tiêu.</li><li>Thái mỏng cà chua.</li><li>Cắt đôi bánh mì và phết mayonnaise.</li><li>Đặt trứng, cà chua và một ít rau vào giữa bánh mì.</li></ol>'
                },
                { 
                  type: 'Trưa', 
                  content: 'Bún bò Huế',
                  calories: 520,
                  protein: 30,
                  carbs: 65,
                  fat: 15,
                  image: 'https://tourhue.vn/wp-content/uploads/2024/08/quan-bun-bo-hue-1.png',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu nước dùng từ xương bò, sả, gừng và các gia vị.</li><li>Thái thịt bò và giò heo thành lát mỏng.</li><li>Trụng bún rồi cho vào tô.</li><li>Xếp thịt bò và giò heo lên trên.</li><li>Chan nước dùng nóng vào.</li><li>Thêm rau sống, chanh và ớt.</li></ol>'
                },
                { 
                  type: 'Tối', 
                  content: 'Salad cá ngừ với trứng luộc',
                  calories: 390,
                  protein: 35,
                  carbs: 20,
                  fat: 18,
                  image: 'https://monngonmoingay.com/wp-content/smush-webp/2017/08/salad-trung-ca-ngu-500.jpg.webp',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Luộc trứng trong 8 phút, sau đó bóc vỏ và cắt làm tư.</li><li>Chuẩn bị rau xanh như xà lách, cải mầm, cà chua bi.</li><li>Mở hộp cá ngừ, để ráo nước.</li><li>Trộn tất cả nguyên liệu với dầu olive, chanh và gia vị.</li></ol>'
                }
              ]
            },
            {
              id: 7,
              day: 7,
              meals: [
                { 
                  type: 'Sáng', 
                  content: 'Pancake bột yến mạch với mật ong',
                  calories: 400,
                  protein: 12,
                  carbs: 60,
                  fat: 10,
                  image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Trộn bột yến mạch, baking powder, một chút muối.</li><li>Thêm sữa, trứng và khuấy đều.</li><li>Đổ từng muỗng bột vào chảo nóng.</li><li>Chiên đến khi vàng hai mặt.</li><li>Phục vụ với mật ong và một ít quả mọng.</li></ol>'
                },
                { 
                  type: 'Trưa', 
                  content: 'Cơm gà Hải Nam',
                  calories: 580,
                  protein: 32,
                  carbs: 75,
                  fat: 15,
                  image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=1000',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Luộc gà nguyên con với gừng, hành lá.</li><li>Dùng nước luộc gà để nấu cơm.</li><li>Thái gà thành miếng vừa ăn.</li><li>Làm nước sốt từ gừng, tỏi, dầu mè.</li><li>Phục vụ cơm với gà và sốt, kèm dưa chuột.</li></ol>'
                },
                { 
                  type: 'Tối', 
                  content: 'Súp kem nấm với bánh mì nướng',
                  calories: 360,
                  protein: 10,
                  carbs: 45,
                  fat: 16,
                  image: 'https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2022/2/21/1016491/Sup-Nam-Banh-My.jpg',
                  cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Xào hành tây, tỏi với bơ.</li><li>Thêm nấm đã thái nhỏ và xào đến khi vàng.</li><li>Thêm bột mì, khuấy đều.</li><li>Từ từ thêm nước dùng gà và kem tươi.</li><li>Nấu nhỏ lửa đến khi súp sánh.</li><li>Nướng bánh mì với một ít bơ tỏi.</li><li>Phục vụ súp nóng với bánh mì.</li></ol>'
                }
              ]
            }
          ]
        };
        
        setMealPlan(mealPlanData);
        setLikesCount(mealPlanData.likes);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin thực đơn. Vui lòng thử lại sau.');
        setLoading(false);
      }
    }, 500);
  }, [id]);

  // Hàm lấy ngày hiện tại theo format YYYY-MM-DD
  function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  // Cập nhật hàm handleSave để mở modal
  const handleSave = () => {
    if (!saved) {
      setShowSaveModal(true);
    } else {
      setSaved(false);
      // Xử lý bỏ lưu thực đơn ở đây (gọi API)
    }
  };

  // Xác nhận lưu thực đơn
  const confirmSave = () => {
    setSaved(true);
    setShowSaveModal(false);
    // Gọi API lưu thực đơn ở đây
  };

  // Mở modal áp dụng thực đơn
  const openApplyModal = () => {
    setShowSaveModal(false);
    setShowApplyModal(true);
  };

  // Xác nhận áp dụng thực đơn
  const confirmApply = () => {
    setShowApplyModal(false);
    setShowSuccessModal(true);
    // Gọi API áp dụng thực đơn ở đây với ngày bắt đầu là startDate
  };

  // Chuyển hướng đến trang lịch thực đơn
  const goToMealSchedule = () => {
    setShowSuccessModal(false);
    navigate('/schedule/my-eat-schedule');
  };

  const handleShare = () => {
    // Implement share functionality here
    alert('Tính năng chia sẻ đang được phát triển');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  // Hàm mở modal cách chế biến
  const handleOpenCookingModal = (meal) => {
    setActiveMeal(meal);
    setShowCookingModal(true);
  };

  // Hàm đóng modal cách chế biến
  const handleCloseCookingModal = () => {
    setShowCookingModal(false);
    setActiveMeal(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/meal-plan')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
          >
            Quay lại danh sách thực đơn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 md:px-6 print:px-0">
      {/* Back button - hide when printing */}
      <button 
        onClick={() => navigate('/meal-plan')}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 print:hidden"
      >
        <FaArrowLeft className="mr-2" /> Quay lại danh sách thực đơn
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          {/* Header with image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="relative h-64 md:h-80">
              <img 
                src={mealPlan.image} 
                alt={mealPlan.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {mealPlan.title}
                </h1>
                <div className="flex items-center text-white mb-2">
                  <div className="flex mr-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar 
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(mealPlan.rating) ? 'text-yellow-400' : 'text-gray-400'}`}
                      />
                    ))}
                    <span className="ml-1 text-sm">{mealPlan.rating} ({mealPlan.ratingCount})</span>
                  </div>
                  <span className="flex items-center text-sm">
                    <IoMdTime className="mr-1" /> {mealPlan.duration} ngày
                  </span>
                </div>
                <div className="flex items-center">
                  <img 
                    src={mealPlan.author.avatar} 
                    alt={mealPlan.author.name} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div>
                    <div className="flex items-center">
                      <span className="text-white text-sm">{mealPlan.author.name}</span>
                      {mealPlan.author.isVerified && (
                        <FaCheckCircle className="ml-1 text-blue-500 w-3 h-3" />
                      )}
                    </div>
                    <span className="text-gray-300 text-xs">
                      {formatDate(mealPlan.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {mealPlan.description}
              </p>
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 print:hidden">
                <button 
                  onClick={handleLike}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {liked ? (
                    <FaHeart className="mr-1 text-red-500" />
                  ) : (
                    <FaRegHeart className="mr-1" />
                  )}
                  <span>{likesCount}</span>
                </button>
                
                <button className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <FaRegComment className="mr-1" />
                  <span>{mealPlan.comments}</span>
                </button>
                
                <button 
                  onClick={handleSave}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {saved ? (
                    <FaBookmark className="mr-1 text-green-500" />
                  ) : (
                    <FaRegBookmark className="mr-1" />
                  )}
                  <span>{saved ? "Đã lưu" : "Lưu"}</span>
                </button>
                
                <button 
                  onClick={handleShare}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaShare className="mr-1" />
                  <span>Chia sẻ</span>
                </button>
                
                <button 
                  onClick={handlePrint}
                  className="flex items-center px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FaPrint className="mr-1" />
                  <span>In</span>
                </button>
                
                {/* Nút áp dụng thực đơn - chỉ hiển thị khi đã lưu */}
                {saved && (
                  <button 
                    onClick={() => setShowApplyModal(true)}
                    className="flex items-center px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FaCalendarAlt className="mr-1" />
                    <span>Áp dụng thực đơn</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Notes section */}
          {mealPlan.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ghi chú</h2>
              <div 
                className="prose max-w-none dark:prose-invert" 
                dangerouslySetInnerHTML={{ __html: mealPlan.notes }}
              />
            </div>
          )}
          
          {/* Daily meal plans */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <MdFastfood className="mr-2 text-green-600" /> Kế hoạch bữa ăn theo ngày
            </h2>
            
            {/* Thay đổi từ nút ngày sang select dropdown */}
            <div className="mb-6">
              <div className="max-w-xs mx-auto">
                <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chọn ngày thực đơn (Tổng số ngày: {mealPlan.duration})
                </label>
                <div className="relative">
                  <select
                    id="day-select"
                    className="block w-full p-3 pl-4 pr-10 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-600 dark:focus:border-green-600 appearance-none transition-colors"
                    value={activeDay}
                    onChange={(e) => setActiveDay(Number(e.target.value))}
                  >
                    {mealPlan.days.map((day) => (
                      <option key={day.day} value={day.day}>
                        Ngày {day.day} - {day.day === 1 ? 'Bắt đầu' : day.day === mealPlan.duration ? 'Kết thúc' : `Ngày ${day.day}/${mealPlan.duration}`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                {/* <div className="mt-2 flex flex-wrap gap-2">
                  {mealPlan.days.map((day) => (
                    <button 
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        activeDay === day.day 
                          ? 'bg-green-600 text-white shadow-md' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {day.day}
                    </button>
                  ))}
                </div> */}
              </div>
            </div>
            
            {/* Active day meals */}
            {mealPlan.days.map((day) => (
              day.day === activeDay && (
                <DayMealPlan 
                  key={day.day} 
                  day={day} 
                  onViewCooking={handleOpenCookingModal} 
                />
              )
            ))}
          </div>
        </div>
        
        {/* Sidebar - 1/3 width on desktop */}
        <div className="lg:col-span-1 space-y-6">
          {/* Nutrition summary card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Thông tin dinh dưỡng</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Trung bình mỗi ngày
            </p>
            
            {/* Nutrition data */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.calories}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">kcal/ngày</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Protein</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.protein}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.protein * 4 / mealPlan.averageNutrition.calories * 100)}%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Carbs</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.carbs}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.carbs * 4 / mealPlan.averageNutrition.calories * 100)}%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Chất béo</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{mealPlan.averageNutrition.fat}g</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(mealPlan.averageNutrition.fat * 9 / mealPlan.averageNutrition.calories * 100)}%</p>
              </div>
            </div>
            
            {/* Macro distribution chart */}
            <div className="h-64">
              <NutritionChart 
                protein={mealPlan.averageNutrition.protein} 
                carbs={mealPlan.averageNutrition.carbs} 
                fat={mealPlan.averageNutrition.fat} 
              />
            </div>
          </div>
          
          {/* Tips card */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-3">
              Mẹo thực hiện thực đơn
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Chuẩn bị thực phẩm trước cho 2-3 ngày để tiết kiệm thời gian</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Uống ít nhất 2 lít nước mỗi ngày</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Kết hợp với 30 phút tập thể dục mỗi ngày để tăng hiệu quả</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Điều chỉnh khẩu phần theo nhu cầu calo cá nhân</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                <span className="text-green-800 dark:text-green-300 text-sm">Thay thế thực phẩm bằng các lựa chọn tương tự nếu cần</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Lưu thực đơn */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lưu thực đơn</h3>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="mb-6 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBookmark className="text-green-600 dark:text-green-400 text-3xl" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Bạn muốn lưu "{mealPlan.title}" vào danh sách thực đơn của mình?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Thực đơn sẽ được lưu vào trang "Thực đơn của tôi" để dễ dàng truy cập sau này.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={confirmSave}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Lưu thực đơn
              </button>
              <button 
                onClick={openApplyModal}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Lưu và áp dụng ngay
              </button>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Áp dụng thực đơn */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Áp dụng thực đơn</h3>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdSchedule className="text-blue-600 dark:text-blue-400 text-3xl" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
                Chọn ngày bắt đầu áp dụng "{mealPlan.title}"
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày bắt đầu:
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getCurrentDate()}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
                <div className="flex items-start">
                  <FaBell className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Bạn sẽ nhận được nhắc nhở hàng ngày về các bữa ăn theo thực đơn này. Bạn có thể điều chỉnh thiết lập nhắc nhở trong phần Cài đặt.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={confirmApply}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center"
              >
                <FaCalendarAlt className="mr-2" />
                Áp dụng thực đơn
              </button>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Áp dụng thành công */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckSquare className="text-green-600 dark:text-green-400 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Áp dụng thành công!
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Thực đơn "{mealPlan.title}" đã được áp dụng từ ngày {new Date(startDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                <FaClipboardList className="mr-2" /> Tiếp theo bạn có thể:
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Xem lịch thực đơn hàng ngày của bạn</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Đánh dấu các bữa ăn đã hoàn thành</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Ghi chú cảm nhận về mỗi món ăn</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <span className="text-blue-800 dark:text-blue-300">Theo dõi tiến trình áp dụng thực đơn</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button 
                onClick={goToMealSchedule}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center"
              >
                <MdDateRange className="mr-2" />
                Đi đến trang thực đơn của tôi
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                Ở lại trang này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị cách chế biến */}
      {showCookingModal && activeMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-2 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaUtensils className="text-green-600 mr-2" /> 
                Cách chế biến: {activeMeal.type}
              </h3>
              <button 
                onClick={handleCloseCookingModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Thành phần:</h4>
              <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg mb-4">
                <p className="text-gray-700 dark:text-gray-300">{activeMeal.content}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Thông tin dinh dưỡng:</h4>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.calories}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Protein</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.protein}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.carbs}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-750 p-2 rounded text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chất béo</p>
                  <p className="font-bold text-gray-800 dark:text-white">{activeMeal.fat}g</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Hướng dẫn chi tiết:</h4>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert bg-gray-50 dark:bg-gray-750 p-4 rounded-lg" 
                dangerouslySetInnerHTML={{ __html: activeMeal.cooking }}
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseCookingModal}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 