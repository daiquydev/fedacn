import { useState, useRef, useEffect } from 'react'
import { FaTimes, FaUpload, FaUtensils, FaCalendarAlt, FaTag, FaPlus, FaTrash, FaArrowLeft, FaArrowRight, FaGripLines, FaSearch, FaFilter, FaExclamationTriangle } from 'react-icons/fa'
import { IoMdTime } from 'react-icons/io'
import { MdClose, MdFastfood, MdError } from 'react-icons/md'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// Toast Component
const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
      <div className={`${
        type === 'error' ? 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100' : 
        type === 'success' ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100' :
        'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
      } px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2`}>
        {type === 'error' && <MdError className="w-5 h-5" />}
        <p>{message}</p>
        <button 
          onClick={onClose}
          className="ml-auto p-1 hover:bg-black hover:bg-opacity-10 rounded-full"
        >
          <MdClose className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Confirm Dialog Component
const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center mb-4 text-amber-500">
          <FaExclamationTriangle className="w-6 h-6 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Xác nhận</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CreateMealPlanModal({ onClose }) {
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Giảm cân',
    image: null,
  })
  const [mealDays, setMealDays] = useState([
    {
      id: '1',
      day: 1,
      meals: [
        { 
          type: 'Sáng', 
          foods: [],
          description: ''
        },
        { 
          type: 'Trưa', 
          foods: [],
          description: ''
        },
        { 
          type: 'Tối', 
          foods: [],
          description: ''
        },
      ]
    }
  ])
  const [activeDay, setActiveDay] = useState(1)
  const [imagePreview, setImagePreview] = useState(null)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({
    title: false,
    description: false,
    image: false,
    meals: {}
  })

  // Thêm các state để quản lý việc chọn món ăn
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availableFoods, setAvailableFoods] = useState([]);
  
  // Thêm state cho dialog và toast
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: '',
    action: null
  });
  
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'error'
  });

  const categories = [
    'Giảm cân', 'Tăng cơ', 'Ăn sạch', 'Thuần chay', 
    'Gia đình', 'Keto', 'Dinh dưỡng thể thao'
  ]

  // Khởi tạo mock data cho các món ăn
  useEffect(() => {
    const foodsData = [
      {
        id: 'f1',
        name: 'Yến mạch sữa hạnh nhân',
        category: 'Sáng',
        calories: 320,
        protein: 12,
        carbs: 45,
        fat: 10,
        image: 'https://cdn.tgdd.vn//News/1507981//cach-lam-sua-hanh-nhan-yen-mach-845x564.jpg',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu 50g yến mạch với 250ml sữa hạnh nhân trong 3-5 phút.</li><li>Thêm 1/2 thìa cafe mật ong (tùy chọn).</li><li>Thái chuối thành lát và rắc lên trên.</li><li>Đập nhỏ hạnh nhân và rắc lên trên cùng.</li></ol>'
      },
      {
        id: 'f2',
        name: 'Salad gà nướng',
        category: 'Trưa',
        calories: 450,
        protein: 35,
        carbs: 25,
        fat: 20,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp ức gà với muối, tiêu, bột tỏi, và một ít dầu olive trong 15 phút.</li><li>Nướng gà ở 200°C trong 15-20 phút hoặc đến khi chín.</li><li>Để nguội và cắt thành lát nhỏ.</li><li>Trộn rau xanh, cà chua, dưa chuột trong tô lớn.</li><li>Thêm gà nướng đã cắt lát.</li><li>Rưới dầu olive và chanh, thêm muối và tiêu vừa đủ.</li></ol>'
      },
      {
        id: 'f3',
        name: 'Cá hồi nướng với măng tây',
        category: 'Tối',
        calories: 480,
        protein: 30,
        carbs: 40,
        fat: 15,
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp cá hồi với muối, tiêu, chanh trong 30 phút.</li><li>Nướng cá hồi ở 180°C trong 12-15 phút.</li><li>Cắt khoai lang thành miếng vừa, thấm khô, trộn với dầu olive, muối, tiêu.</li><li>Nướng khoai lang ở 200°C trong 25-30 phút, đảo một lần giữa chừng.</li><li>Luộc măng tây trong 3-4 phút, sau đó ngâm ngay vào nước đá.</li><li>Xào nhanh măng tây với một ít dầu olive và tỏi.</li></ol>'
      },
      {
        id: 'f4',
        name: 'Sữa chua Hy Lạp với quả mọng',
        category: 'Snack',
        calories: 180,
        protein: 15,
        carbs: 15,
        fat: 5,
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Cho 150g sữa chua Hy Lạp vào bát.</li><li>Thêm hỗn hợp các loại quả mọng (dâu tây, việt quất, mâm xôi).</li><li>Có thể thêm một ít hạt chia và mật ong (tùy chọn).</li></ol>'
      },
      {
        id: 'f5',
        name: 'Bánh mì nguyên cám với trứng',
        category: 'Sáng',
        calories: 350,
        protein: 18,
        carbs: 40,
        fat: 12,
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nướng bánh mì nguyên cám.</li><li>Chiên trứng với chút dầu olive.</li><li>Đặt trứng lên bánh mì, thêm rau xanh và gia vị.</li></ol>'
      },
      {
        id: 'f6',
        name: 'Cơm gạo lứt với đậu hũ',
        category: 'Trưa',
        calories: 420,
        protein: 20,
        carbs: 65,
        fat: 8,
        image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu gạo lứt với nước theo tỉ lệ 1:2.</li><li>Cắt đậu hũ thành khối vuông và ướp với xì dầu, tỏi.</li><li>Chiên hoặc nướng đậu hũ đến khi vàng.</li><li>Phục vụ với rau xanh và sốt.</li></ol>'
      },
      {
        id: 'f7',
        name: 'Sinh tố protein',
        category: 'Snack',
        calories: 280,
        protein: 24,
        carbs: 30,
        fat: 8,
        image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Cho vào máy xay: 1 chuối, 1 muỗng bột protein, 240ml sữa hạnh nhân, 1 muỗng bơ đậu phộng.</li><li>Xay đến khi mịn.</li></ol>'
      },
      {
        id: 'f8',
        name: 'Thịt gà nướng rau củ',
        category: 'Tối',
        calories: 450,
        protein: 40,
        carbs: 30,
        fat: 15,
        image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp thịt gà với gia vị, dầu olive trong 30 phút.</li><li>Cắt rau củ thành miếng vừa.</li><li>Xếp thịt gà và rau củ vào khay nướng.</li><li>Nướng ở 200°C trong khoảng 25-30 phút.</li></ol>'
      },
      {
        id: 'f9',
        name: 'Phở bò',
        category: 'Sáng',
        calories: 420,
        protein: 25,
        carbs: 60,
        fat: 10,
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ninh xương bò và các gia vị (hồi, quế, đinh hương, thảo quả) trong 6-8 giờ.</li><li>Thái mỏng thịt bò tươi.</li><li>Luộc bánh phở.</li><li>Xếp bánh phở vào tô, đặt thịt bò lên trên.</li><li>Chan nước dùng nóng vào.</li><li>Thêm hành, ngò, giá đỗ và ớt tươi.</li></ol>'
      },
      {
        id: 'f10',
        name: 'Bún chả',
        category: 'Trưa',
        calories: 550,
        protein: 30,
        carbs: 70,
        fat: 18,
        image: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp thịt với hành, tỏi, đường, nước mắm, tiêu.</li><li>Nướng thịt trên bếp than hoa.</li><li>Làm nước chấm với nước mắm, đường, tỏi, ớt, chanh.</li><li>Trụng bún.</li><li>Ăn kèm với rau sống, chả nướng và nước chấm.</li></ol>'
      },
      {
        id: 'f11',
        name: 'Cháo yến mạch bơ đậu phộng',
        category: 'Sáng',
        calories: 350,
        protein: 14,
        carbs: 42,
        fat: 14,
        image: 'https://cdn.tgdd.vn/2020/12/CookProductThumb/maxresdefault(6)-620x620-1.jpg',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Nấu 50g yến mạch với 300ml nước hoặc sữa.</li><li>Thêm 1 muỗng canh bơ đậu phộng khi yến mạch đã mềm.</li><li>Thêm chút mật ong hoặc đường nâu và quế.</li><li>Trang trí với chuối thái lát và hạt chia.</li></ol>'
      },
      {
        id: 'f12',
        name: 'Bánh xèo',
        category: 'Tối',
        calories: 480,
        protein: 18,
        carbs: 50,
        fat: 25,
        image: 'https://daylambanh.edu.vn/wp-content/uploads/2019/03/banh-xeo-bang-bot-pha-san-600x400.jpg',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Trộn bột gạo với nghệ, muối và nước cốt dừa.</li><li>Làm nóng chảo, thêm dầu và đổ bột vào.</li><li>Thêm thịt heo, tôm và giá đỗ.</li><li>Đậy nắp để bánh chín giòn.</li><li>Gấp đôi bánh lại và dùng với rau sống và nước mắm pha.</li></ol>'
      },
      {
        id: 'f13',
        name: 'Cơm tấm sườn nướng',
        category: 'Trưa',
        calories: 650,
        protein: 35,
        carbs: 85,
        fat: 20,
        image: 'https://images.unsplash.com/photo-1562967915-92ae0c320a01?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Ướp sườn với sả, tỏi, đường, nước mắm, dầu hào.</li><li>Nướng sườn trên lửa than hoặc trong lò.</li><li>Nấu cơm tấm.</li><li>Làm nước mắm pha với đường, chanh, tỏi, ớt.</li><li>Phục vụ kèm đồ chua, dưa leo, cà chua.</li></ol>'
      },
      {
        id: 'f14',
        name: 'Khoai lang nướng',
        category: 'Snack',
        calories: 150,
        protein: 2,
        carbs: 35,
        fat: 0,
        image: 'https://afamilycdn.com/150157425591193600/2024/9/19/untitled-1-09020008-1726738169086-17267381692741128852785.jpg',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Rửa sạch khoai lang.</li><li>Dùng nĩa đâm vài lỗ trên khoai.</li><li>Nướng ở 200°C trong 45-60 phút hoặc đến khi mềm.</li><li>Có thể thêm chút bơ hoặc quế (tùy chọn).</li></ol>'
      },
      {
        id: 'f15',
        name: 'Canh rau củ',
        category: 'Tối',
        calories: 120,
        protein: 5,
        carbs: 20,
        fat: 2,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Đun sôi nước với xương hoặc nước dùng.</li><li>Thêm hành tím, tỏi băm nhỏ.</li><li>Thêm các loại rau củ (cà rốt, khoai tây, bắp cải).</li><li>Nêm với muối, tiêu và hạt nêm.</li><li>Nấu cho đến khi rau củ mềm.</li></ol>'
      },
      {
        id: 'f16',
        name: 'Gỏi cuốn',
        category: 'Trưa',
        calories: 220,
        protein: 15,
        carbs: 30,
        fat: 5,
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCsjxYbiyrPJtHVT-UR8G1C1DKaDwT3ssTtw&s',
        cooking: '<p><strong>Cách chế biến:</strong></p><ol><li>Luộc tôm và thịt heo.</li><li>Nhúng bánh tráng vào nước ấm.</li><li>Xếp rau xà lách, bún, rau thơm, thịt heo và tôm lên bánh tráng.</li><li>Cuộn chặt bánh tráng lại.</li><li>Làm nước sốt tương từ tương hột, đường, tỏi, ớt và nước cốt chanh.</li></ol>'
      }
    ];
    
    setAvailableFoods(foodsData);
  }, []);

  // Kiểm tra xem một ngày có đầy đủ thông tin hay không
  const isDayComplete = (dayIndex) => {
    const day = mealDays[dayIndex];
    return day.meals.every(meal => 
      meal.type.trim() !== '' && meal.foods.length > 0
    );
  };

  // Kiểm tra và cảnh báo trước khi chuyển ngày
  const validateBeforeDayChange = (targetDayIndex) => {
    const currentDayIndex = mealDays.findIndex(day => day.day === activeDay);
    
    if (!isDayComplete(currentDayIndex)) {
      setToast({
        show: true,
        message: 'Vui lòng hoàn thành tất cả các bữa ăn trong ngày hiện tại trước khi chuyển sang ngày khác.',
        type: 'error'
      });
      return false;
    }
    return true;
  };

  // Handle day change with validation
  const handleDayChange = (newDay) => {
    if (validateBeforeDayChange()) {
      setActiveDay(newDay);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }))
      
      // Create a preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Hàm tính tổng dinh dưỡng cho một bữa ăn
  const calculateMealNutrition = (foods) => {
    return foods.reduce((total, food) => {
      return {
        calories: total.calories + (food.calories || 0),
        protein: total.protein + (food.protein || 0),
        carbs: total.carbs + (food.carbs || 0),
        fat: total.fat + (food.fat || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  // Mở modal chọn món ăn
  const openFoodSelector = (dayIndex, mealIndex) => {
    setSelectedDayIndex(dayIndex);
    setSelectedMealIndex(mealIndex);
    setSearchQuery('');
    setCategoryFilter('all');
    setShowFoodModal(true);
  };

  // Thêm món ăn vào bữa ăn
  const addFoodToMeal = (food) => {
    const updatedMealDays = [...mealDays];
    const uniqueId = `${food.id}-${Date.now()}`;
    
    // Thêm món ăn với ID duy nhất để tránh trùng lặp
    updatedMealDays[selectedDayIndex].meals[selectedMealIndex].foods.push({
      ...food,
      uniqueId
    });
    
    setMealDays(updatedMealDays);
  };

  // Xóa món ăn khỏi bữa ăn
  const removeFoodFromMeal = (dayIndex, mealIndex, foodUniqueId) => {
    const updatedMealDays = [...mealDays];
    updatedMealDays[dayIndex].meals[mealIndex].foods = 
      updatedMealDays[dayIndex].meals[mealIndex].foods.filter(
        food => food.uniqueId !== foodUniqueId
      );
    
    setMealDays(updatedMealDays);
  };

  // Lọc danh sách món ăn theo từ khóa và danh mục
  const getFilteredFoods = () => {
    return availableFoods.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || food.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  const handleAddMeal = (dayIndex) => {
    const updatedMealDays = [...mealDays]
    updatedMealDays[dayIndex].meals.push({ 
      type: 'Snack', 
      foods: [],
      description: ''
    })
    setMealDays(updatedMealDays)
  }

  // Cập nhật hàm xóa bữa ăn với xác nhận
  const handleRemoveMeal = (dayIndex, mealIndex) => {
    if (mealDays[dayIndex].meals.length <= 1) return // Keep at least one meal
    
    setConfirmDialog({
      show: true,
      message: `Bạn có chắc chắn muốn xóa bữa ${mealDays[dayIndex].meals[mealIndex].type} không?`,
      action: () => {
        const updatedMealDays = [...mealDays]
        updatedMealDays[dayIndex].meals.splice(mealIndex, 1)
        setMealDays(updatedMealDays)
        
        setConfirmDialog({ show: false, message: '', action: null })
        setToast({
          show: true,
          message: 'Đã xóa bữa ăn thành công.',
          type: 'success'
        })
      }
    });
  }

  // Hàm cập nhật tên bữa ăn
  const handleMealTypeChange = (dayIndex, mealIndex, value) => {
    const updatedMealDays = [...mealDays];
    updatedMealDays[dayIndex].meals[mealIndex].type = value;
    setMealDays(updatedMealDays);
  };

  // Cập nhật hàm thêm ngày mới để thêm vào sau ngày hiện tại
  const handleAddDay = () => {
    const currentDayIndex = mealDays.findIndex(day => day.day === activeDay);
    const newDayIndex = currentDayIndex + 1;
    
    const newDay = {
      id: `day-${Date.now()}`, // tạo id duy nhất
      day: newDayIndex + 1, // Số thứ tự tạm thời
      meals: [
        { type: 'Sáng', foods: [], description: '' },
        { type: 'Trưa', foods: [], description: '' },
        { type: 'Tối', foods: [], description: '' },
      ]
    }
    
    // Tạo bản sao của mảng ngày
    const updatedMealDays = [...mealDays];
    
    // Chèn ngày mới vào sau ngày hiện tại
    updatedMealDays.splice(newDayIndex, 0, newDay);
    
    // Cập nhật lại số thứ tự ngày
    const reindexedDays = updatedMealDays.map((day, index) => ({
      ...day,
      day: index + 1
    }));
    
    setMealDays(reindexedDays);
    setActiveDay(newDayIndex + 1); // Đặt active day là ngày mới
    
    setToast({
      show: true,
      message: 'Đã thêm ngày mới thành công.',
      type: 'success'
    });
  }

  // Cập nhật hàm xóa ngày với xác nhận
  const handleRemoveDay = (dayIndex) => {
    if (mealDays.length <= 1) return // Giữ ít nhất 1 ngày
    
    setConfirmDialog({
      show: true,
      message: `Bạn có chắc chắn muốn xóa Ngày ${mealDays[dayIndex].day} không?`,
      action: () => {
        const updatedMealDays = [...mealDays]
        updatedMealDays.splice(dayIndex, 1)
        
        // Cập nhật lại số thứ tự ngày
        const reindexedDays = updatedMealDays.map((day, index) => ({
          ...day,
          day: index + 1
        }))
        
        setMealDays(reindexedDays)
        
        // Điều chỉnh active day nếu cần
        if (activeDay > reindexedDays.length) {
          setActiveDay(reindexedDays.length)
        }
        
        setConfirmDialog({ show: false, message: '', action: null })
        setToast({
          show: true,
          message: 'Đã xóa ngày thành công.',
          type: 'success'
        })
      }
    });
  }

  const validateForm = () => {
    const newErrors = {
      title: formData.title.trim() === '',
      description: formData.description.trim() === '',
      image: !formData.image,
      meals: {}
    }
    
    let isValid = !newErrors.title && !newErrors.description && !newErrors.image
    
    // Kiểm tra tất cả các bữa ăn trong tất cả các ngày
    mealDays.forEach((day, dayIndex) => {
      if (!newErrors.meals[dayIndex]) newErrors.meals[dayIndex] = {}
      
      day.meals.forEach((meal, mealIndex) => {
        if (!newErrors.meals[dayIndex][mealIndex]) newErrors.meals[dayIndex][mealIndex] = {}
        
        // Kiểm tra loại bữa ăn
        const typeEmpty = meal.type.trim() === ''
        newErrors.meals[dayIndex][mealIndex].type = typeEmpty
        
        // Kiểm tra xem có món ăn nào không
        const noFoods = meal.foods.length === 0
        newErrors.meals[dayIndex][mealIndex].foods = noFoods
        
        if (typeEmpty || noFoods) {
          isValid = false
        }
      })
    })
    
    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      // Form hợp lệ, tiến hành submit
      console.log({ ...formData, mealDays, notes })
      onClose()
    } else {
      // Hiển thị thông báo lỗi
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Hàm cập nhật mô tả bữa ăn
  const handleMealDescriptionChange = (dayIndex, mealIndex, value) => {
    const updatedMealDays = [...mealDays];
    updatedMealDays[dayIndex].meals[mealIndex].description = value;
    setMealDays(updatedMealDays);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex justify-center items-start pt-10 pb-20">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-auto border dark:border-gray-700">
        {/* Header với gradient */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-5 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <FaUtensils className="mr-3 text-white/90" /> Tạo Thực Đơn Mới
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Thêm thông báo lỗi ở đầu form nếu có */}
          {(errors.title || errors.description || errors.image) && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <p className="font-medium">Vui lòng điền đầy đủ thông tin:</p>
              <ul className="mt-2 pl-5 list-disc">
                {errors.title && <li>Tên thực đơn không được để trống</li>}
                {errors.description && <li>Mô tả không được để trống</li>}
                {errors.image && <li>Vui lòng tải lên ảnh đại diện</li>}
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column - Basic info */}
            <div className="md:col-span-1 space-y-5">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Ảnh đại diện <span className="text-red-500">*</span>
                </label>
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-750
                    ${imagePreview ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="mx-auto max-h-44 rounded-lg shadow-sm object-cover"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImagePreview(null)
                          setFormData(prev => ({ ...prev, image: null }))
                        }}
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        <FaUpload className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click để tải ảnh lên
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Định dạng JPG, PNG hoặc WEBP
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    <FaUtensils className="inline mr-2 text-green-600 dark:text-green-500" /> Tên thực đơn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Ví dụ: Thực đơn giảm cân 7 ngày"
                  className={`w-full px-4 py-3 border ${errors.title ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Vui lòng nhập tên thực đơn</p>}
              </div>
              
                <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Mô tả ngắn <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Mô tả ngắn gọn về thực đơn của bạn"
                  rows="3"
                  className={`w-full px-4 py-3 border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm`}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Vui lòng nhập mô tả thực đơn</p>}
              </div>
              
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    <FaTag className="inline mr-2 text-green-600 dark:text-green-500" /> Phân loại <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm appearance-none bg-no-repeat"
                    style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.75rem center", backgroundSize: "1.5em 1.5em"}}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                </div>
                
                <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Ghi chú chung
                </label>
                <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
                <ReactQuill 
                  value={notes} 
                  onChange={setNotes}
                  placeholder="Thêm ghi chú, lời khuyên, hoặc hướng dẫn chung cho thực đơn..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  theme="snow"
                />
                </div>
              </div>
            </div>
            
            {/* Right column - Meal planning */}
            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-750 rounded-xl p-5">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                    <IoMdTime className="mr-2 text-green-600 dark:text-green-500" /> Lập thực đơn theo ngày
                  </h3>
                </div>
                
                {/* Day tabs - Cải tiến giao diện */}
                <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Chọn ngày:</div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currentDayIndex = mealDays.findIndex(day => day.day === activeDay);
                          if (currentDayIndex > 0 && validateBeforeDayChange()) {
                            setActiveDay(mealDays[currentDayIndex - 1].day);
                          }
                        }}
                        disabled={activeDay === 1}
                        className={`p-2 rounded-lg border border-gray-300 dark:border-gray-600 ${
                          activeDay === 1 
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FaArrowLeft className="w-4 h-4" />
                      </button>
                      
                      <select
                        value={activeDay}
                        onChange={(e) => {
                          const newDay = parseInt(e.target.value);
                          if (validateBeforeDayChange()) {
                            setActiveDay(newDay);
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white appearance-none min-w-[120px]"
                        style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em", backgroundRepeat: "no-repeat"}}
                      >
                        {mealDays.map((day) => (
                          <option key={day.id || day.day} value={day.day}>
                            Ngày {day.day}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const currentDayIndex = mealDays.findIndex(day => day.day === activeDay);
                          if (currentDayIndex < mealDays.length - 1 && validateBeforeDayChange()) {
                            setActiveDay(mealDays[currentDayIndex + 1].day);
                          }
                        }}
                        disabled={activeDay === mealDays.length}
                        className={`p-2 rounded-lg border border-gray-300 dark:border-gray-600 ${
                          activeDay === mealDays.length 
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FaArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Active day meal plan */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                  {mealDays.map((day, dayIndex) => {
                    if (day.day !== activeDay) return null;
                    
                    return (
                      <div key={dayIndex}>
                        <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">
                          Chi tiết Ngày {day.day}
                        </h4>
                        
                        {day.meals.map((meal, mealIndex) => {
                          // Tính tổng dinh dưỡng cho bữa ăn
                          const mealNutrition = calculateMealNutrition(meal.foods);
                          
                          return (
                            <div key={mealIndex} className="mb-6 bg-gray-50 dark:bg-gray-750 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center">
                                  <div className="relative flex items-center">
                                    <input
                                      type="text"
                                      value={meal.type}
                                      onChange={(e) => handleMealTypeChange(dayIndex, mealIndex, e.target.value)}
                                      className={`font-medium text-green-600 dark:text-green-400 border-none py-1 px-2 rounded focus:ring-2 focus:ring-green-500 bg-transparent text-lg ${errors.meals[dayIndex]?.[mealIndex]?.type ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                                      placeholder="Loại bữa ăn"
                                    />
                                    <span className="text-red-500 ml-1">*</span>
                                  </div>
                                  {errors.meals[dayIndex]?.[mealIndex]?.type && (
                                    <span className="text-red-500 ml-2 text-sm">Bắt buộc</span>
                                  )}
                                </div>
                                
                                {day.meals.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMeal(dayIndex, mealIndex)}
                                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <FaTimes className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              
                              {/* Hiển thị thông tin dinh dưỡng tổng hợp */}
                              <div className="grid grid-cols-4 gap-3 mb-4">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Calo</label>
                                  <div className="font-medium text-gray-800 dark:text-gray-200">
                                    {mealNutrition.calories || 0} <span className="text-xs text-gray-500">Kcal</span>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Protein</label>
                                  <div className="font-medium text-gray-800 dark:text-gray-200">
                                    {mealNutrition.protein || 0} <span className="text-xs text-gray-500">g</span>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Carbs</label>
                                  <div className="font-medium text-gray-800 dark:text-gray-200">
                                    {mealNutrition.carbs || 0} <span className="text-xs text-gray-500">g</span>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Chất béo</label>
                                  <div className="font-medium text-gray-800 dark:text-gray-200">
                                    {mealNutrition.fat || 0} <span className="text-xs text-gray-500">g</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Thêm phần mô tả bữa ăn */}
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả bữa ăn:</h5>
                                </div>
                                <textarea
                                  value={meal.description || ''}
                                  onChange={(e) => handleMealDescriptionChange(dayIndex, mealIndex, e.target.value)}
                                  placeholder="Thêm mô tả, lưu ý hoặc ghi chú về bữa ăn này (tùy chọn)"
                                  rows="2"
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                              
                              {/* Hiển thị danh sách món ăn đã chọn */}
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Danh sách món ăn: <span className="text-red-500">*</span></h5>
                                  <button
                                    type="button"
                                    onClick={() => openFoodSelector(dayIndex, mealIndex)}
                                    className="text-sm flex items-center text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400"
                                  >
                                    <FaPlus className="mr-1" /> Thêm món ăn
                                  </button>
                                </div>
                                
                                {meal.foods.length === 0 ? (
                                  <div className="py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-750 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                    <MdFastfood className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                                    <p className="text-sm">Chưa có món ăn nào được chọn</p>
                                    <button
                                      type="button"
                                      onClick={() => openFoodSelector(dayIndex, mealIndex)}
                                      className="mt-3 inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700"
                                    >
                                      <FaPlus className="mr-1.5 h-3 w-3" /> Chọn món ăn
                                    </button>
                                    {errors.meals[dayIndex]?.[mealIndex]?.foods && (
                                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">Vui lòng thêm ít nhất một món ăn</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {meal.foods.map((food, foodIndex) => (
                                      <div key={food.uniqueId} className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        {food.image && (
                                          <div className="flex-shrink-0 mr-3">
                                            <img src={food.image} alt={food.name} className="h-16 w-16 object-cover rounded-md" />
                                          </div>
                                        )}
                                        <div className="flex-grow min-w-0">
                                          <div className="flex justify-between items-start">
                                            <h6 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{food.name}</h6>
                                            <button
                                              type="button"
                                              onClick={() => removeFoodFromMeal(dayIndex, mealIndex, food.uniqueId)}
                                              className="ml-2 text-gray-400 hover:text-red-500"
                                            >
                                              <FaTimes />
                                            </button>
                                          </div>
                                          <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                            <span>{food.calories} kcal</span>
                                            <span>•</span>
                                            <span>P: {food.protein}g</span>
                                            <span>•</span> 
                                            <span>C: {food.carbs}g</span>
                                            <span>•</span>
                                            <span>F: {food.fat}g</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="flex justify-between mt-6 space-x-3">
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                // Kiểm tra nếu có nhiều hơn 1 ngày
                                if (mealDays.length > 1) {
                                  const dayIndex = mealDays.findIndex(day => day.day === activeDay);
                                  handleRemoveDay(dayIndex);
                                }
                              }}
                              className="px-3 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center"
                              disabled={mealDays.length <= 1}
                            >
                              <FaTrash className="mr-1.5" />
                              Xóa ngày
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              // Kiểm tra dữ liệu của ngày hiện tại
                              const dayIndex = mealDays.findIndex(day => day.day === activeDay);
                              let hasErrors = false;
                              
                              // Kiểm tra từng bữa ăn trong ngày
                              mealDays[dayIndex].meals.forEach((meal, mealIndex) => {
                                if (!meal.type.trim() || meal.foods.length === 0) {
                                  hasErrors = true;
                                  // Cập nhật lỗi
                                  const newErrors = {...errors};
                                  if (!newErrors.meals[dayIndex]) newErrors.meals[dayIndex] = {};
                                  if (!newErrors.meals[dayIndex][mealIndex]) newErrors.meals[dayIndex][mealIndex] = {};
                                  
                                  if (!meal.type.trim()) newErrors.meals[dayIndex][mealIndex].type = true;
                                  if (meal.foods.length === 0) newErrors.meals[dayIndex][mealIndex].foods = true;
                                  
                                  setErrors(newErrors);
                                }
                              });
                              
                              if (!hasErrors) {
                                // Nếu không có lỗi, thêm ngày mới và chuyển đến ngày đó
                                handleAddDay();
                              } else {
                                // Hiển thị thông báo popup thay vì alert
                                setToast({
                                  show: true,
                                  message: 'Vui lòng hoàn thành tất cả các bữa ăn trong ngày hiện tại trước khi thêm ngày mới.',
                                  type: 'error'
                                });
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center ml-auto"
                          >
                            Thêm ngày tiếp theo
                            <FaArrowRight className="ml-1.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Form actions */}
          <div className="mt-8 flex justify-end space-x-3 border-t dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 font-medium bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg shadow transition-colors"
            >
              Lưu Thực Đơn
            </button>
          </div>
        </form>
      </div>

      {/* Modal chọn món ăn */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto border dark:border-gray-700 flex flex-col">
            {/* Header modal */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-lg font-bold flex items-center">
                <MdFastfood className="mr-2" /> Chọn món ăn
              </h2>
              <button 
                onClick={() => setShowFoodModal(false)}
                className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            {/* Phần tìm kiếm và lọc - tối ưu layout và bỏ bớt icon */}
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-750 sticky top-[60px] z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm món ăn..."
                    className="pl-10 w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="w-full">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none"
                    // style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.75rem center", backgroundSize: "1.5em 1.5em"}}
                  >
                    <option value="all">Tất cả loại món ăn</option>
                    <option value="Sáng">Bữa sáng</option>
                    <option value="Trưa">Bữa trưa</option>
                    <option value="Tối">Bữa tối</option>
                    <option value="Snack">Ăn nhẹ</option>
                  </select>
                </div>
              </div>
              {/* Hiển thị số món đã chọn */}
              {selectedDayIndex !== null && selectedMealIndex !== null && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 flex justify-between items-center">
                  <div>
                    Đã chọn: <span className="font-medium text-green-600 dark:text-green-500">
                      {mealDays[selectedDayIndex].meals[selectedMealIndex].foods.length}
                    </span> món ăn
                  </div>
                  {mealDays[selectedDayIndex].meals[selectedMealIndex].foods.length > 0 && (
                    <button 
                      className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      onClick={() => {
                        const updatedMealDays = [...mealDays];
                        updatedMealDays[selectedDayIndex].meals[selectedMealIndex].foods = [];
                        setMealDays(updatedMealDays);
                      }}
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Danh sách món ăn */}
            <div className="flex-grow overflow-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredFoods().length === 0 ? (
                  <div className="col-span-full py-10 text-center text-gray-500 dark:text-gray-400">
                    <MdFastfood className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                    <p>Không tìm thấy món ăn phù hợp</p>
                  </div>
                ) : (
                  getFilteredFoods().map(food => {
                    // Kiểm tra xem món ăn đã được chọn chưa
                    const isSelected = selectedDayIndex !== null && 
                      selectedMealIndex !== null && 
                      mealDays[selectedDayIndex].meals[selectedMealIndex].foods.some(
                        f => f.id === food.id
                      );
                      
                    return (
                      <div 
                        key={food.id} 
                        className={`flex bg-white dark:bg-gray-750 rounded-lg border ${isSelected 
                          ? 'border-green-500 dark:border-green-500 shadow-md ring-2 ring-green-500 ring-opacity-50' 
                          : 'border-gray-200 dark:border-gray-700'
                        } overflow-hidden hover:shadow-md transition-all cursor-pointer relative`}
                        onClick={() => addFoodToMeal(food)}
                      >
                        {/* Chỉ báo đã chọn */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 z-10 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {food.image && (
                          <div className="w-24 h-24 flex-shrink-0">
                            <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-3 flex-grow min-w-0">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                            {food.name}
                          </h5>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                              {food.category}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-1.5">
                            <span>{food.calories} kcal</span>
                            <span>•</span>
                            <span>P: {food.protein}g</span>
                            <span>•</span> 
                            <span>C: {food.carbs}g</span>
                            <span>•</span>
                            <span>F: {food.fat}g</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer modal */}
            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-750 sticky bottom-0">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDayIndex !== null && selectedMealIndex !== null && (
                    <>Đã chọn {mealDays[selectedDayIndex].meals[selectedMealIndex].foods.length} món ăn</>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowFoodModal(false)}
                  className="px-4 py-2 font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Render toast message */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({...toast, show: false})} 
        />
      )}
      
      {/* Render confirm dialog */}
      {confirmDialog.show && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.action}
          onCancel={() => setConfirmDialog({show: false, message: '', action: null})}
        />
      )}
    </div>
  )
} 