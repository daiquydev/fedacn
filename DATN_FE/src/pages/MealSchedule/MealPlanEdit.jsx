import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUtensils, FaArrowLeft, FaPlus, FaTrash, FaSave, FaTimes, FaCheck, FaExchangeAlt, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function MealPlanEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Giả lập API lấy dữ liệu thực đơn
  useEffect(() => {
    setLoading(true);
    // Trong dự án thực, thay thế bằng API call: fetchMealPlanById(id)
    setTimeout(() => {
      setMealPlan({
        id: id,
        title: "Thực đơn giảm cân 7 ngày",
        description: "Thực đơn giảm cân lành mạnh với đầy đủ dinh dưỡng",
        category: "Giảm cân",
        author: {
          name: "Nguyễn Văn A",
          avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        },
        days: [
          {
            day: 1,
            meals: {
              breakfast: {
                name: "Yến mạch với trái cây",
                calories: 320,
                time: "7:00",
                ingredients: ["Yến mạch", "Sữa ít béo", "Chuối", "Việt quất"]
              },
              lunch: {
                name: "Salad gà nướng",
                calories: 420,
                time: "12:00",
                ingredients: ["Gà nướng", "Rau xà lách", "Cà chua", "Dầu olive"]
              },
              dinner: {
                name: "Cá hồi nướng với súp lơ",
                calories: 380,
                time: "18:30",
                ingredients: ["Cá hồi", "Súp lơ xanh", "Khoai lang", "Chanh"]
              },
              snack: {
                name: "Hạnh nhân và táo",
                calories: 150,
                time: "15:00",
                ingredients: ["Hạnh nhân", "Táo"]
              }
            }
          },
          {
            day: 2,
            meals: {
              breakfast: {
                name: "Sinh tố protein",
                calories: 300,
                time: "7:00",
                ingredients: ["Chuối", "Sữa hạnh nhân", "Bột protein", "Hạt chia"]
              },
              lunch: {
                name: "Bowl gạo lứt và đậu",
                calories: 450,
                time: "12:00",
                ingredients: ["Gạo lứt", "Đậu đen", "Bơ", "Rau chân vịt"]
              },
              dinner: {
                name: "Thịt gà và rau củ hấp",
                calories: 400,
                time: "18:30",
                ingredients: ["Thịt gà", "Cà rốt", "Bông cải", "Đậu Hà Lan"]
              },
              snack: {
                name: "Sữa chua Hy Lạp với berries",
                calories: 180,
                time: "15:30",
                ingredients: ["Sữa chua Hy Lạp", "Dâu tây", "Mật ong"]
              }
            }
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleUpdateMeal = (dayIndex, mealType, field, value) => {
    const updatedMealPlan = {...mealPlan};
    updatedMealPlan.days[dayIndex].meals[mealType][field] = value;
    setMealPlan(updatedMealPlan);
    setHasChanges(true);
  };

  const handleAddIngredient = (dayIndex, mealType, ingredient) => {
    if (!ingredient.trim()) return;
    
    const updatedMealPlan = {...mealPlan};
    updatedMealPlan.days[dayIndex].meals[mealType].ingredients.push(ingredient);
    setMealPlan(updatedMealPlan);
    setHasChanges(true);
  };

  const handleRemoveIngredient = (dayIndex, mealType, index) => {
    const updatedMealPlan = {...mealPlan};
    updatedMealPlan.days[dayIndex].meals[mealType].ingredients.splice(index, 1);
    setMealPlan(updatedMealPlan);
    setHasChanges(true);
  };

  const handleAddDay = () => {
    // Tạo bản sao để tránh mutation trực tiếp
    const updatedMealPlan = {...mealPlan};
    
    // Xác định số thứ tự ngày mới an toàn
    let newDayNumber = 1;
    if (updatedMealPlan.days && updatedMealPlan.days.length > 0) {
      const lastDay = updatedMealPlan.days[updatedMealPlan.days.length - 1];
      newDayNumber = lastDay.day + 1;
    }
    
    // Tạo ngày mới
    const newDay = {
      day: newDayNumber,
      meals: {
        breakfast: { name: "", calories: 0, time: "07:00", ingredients: [] },
        lunch: { name: "", calories: 0, time: "12:00", ingredients: [] },
        dinner: { name: "", calories: 0, time: "18:00", ingredients: [] },
        snack: { name: "", calories: 0, time: "15:00", ingredients: [] }
      }
    };
    
    // Khởi tạo array nếu cần
    if (!updatedMealPlan.days) {
      updatedMealPlan.days = [];
    }
    
    // Thêm ngày mới
    updatedMealPlan.days.push(newDay);
    
    // Lưu trữ chỉ số mới để cập nhật currentDay sau
    const newIndex = updatedMealPlan.days.length - 1;
    
    // Cập nhật state
    setMealPlan(updatedMealPlan);
    setCurrentDay(newIndex);
    setHasChanges(true);
    
    // Thông báo thành công (tùy chọn)
    toast.success(`Đã thêm ngày ${newDayNumber}`);
  };

  const handleRemoveDay = (index) => {
    if (mealPlan.days.length <= 1) {
      toast.error("Thực đơn phải có ít nhất 1 ngày");
      return;
    }
    
    const updatedMealPlan = {...mealPlan};
    updatedMealPlan.days.splice(index, 1);
    
    // Cập nhật số thứ tự ngày
    updatedMealPlan.days.forEach((day, idx) => {
      day.day = idx + 1;
    });
    
    setMealPlan(updatedMealPlan);
    if (currentDay >= updatedMealPlan.days.length) {
      setCurrentDay(updatedMealPlan.days.length - 1);
    }
    setHasChanges(true);
  };

  const handleMoveDay = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === mealPlan.days.length - 1)
    ) {
      return;
    }
    
    const updatedMealPlan = {...mealPlan};
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap days
    [updatedMealPlan.days[index], updatedMealPlan.days[targetIndex]] = 
    [updatedMealPlan.days[targetIndex], updatedMealPlan.days[index]];
    
    // Update day numbers
    updatedMealPlan.days.forEach((day, idx) => {
      day.day = idx + 1;
    });
    
    setMealPlan(updatedMealPlan);
    setCurrentDay(targetIndex);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Trong dự án thực, thay thế bằng API call: updateMealPlan(mealPlan)
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setHasChanges(false);
      toast.success("Thực đơn đã được cập nhật");
    }, 1000);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm("Bạn có chắc muốn hủy các thay đổi?")) {
        navigate(`/schedule/eat-plan`);
      }
    } else {
      navigate(`/schedule/eat-plan`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Không tìm thấy thực đơn</h2>
          <button 
            onClick={() => navigate('/schedule/eat-plan')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const currentDayData = mealPlan.days[currentDay];
  const mealTypes = [
    { id: 'breakfast', name: 'Bữa sáng', icon: '🍳' },
    { id: 'lunch', name: 'Bữa trưa', icon: '🍲' },
    { id: 'snack', name: 'Ăn nhẹ', icon: '🍌' },
    { id: 'dinner', name: 'Bữa tối', icon: '🍽️' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaUtensils className="mr-3 text-green-600 dark:text-green-400" />
              Chỉnh sửa thực đơn
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {mealPlan.title}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg flex items-center ${
              hasChanges 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-300 text-gray-700 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
            }`}
          >
            <FaSave className="mr-2" /> Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Plan Info & Day Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Plan Details */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Thông tin thực đơn</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên thực đơn
                  </label>
                  <input
                    type="text"
                    value={mealPlan.title}
                    onChange={(e) => {
                      setMealPlan({...mealPlan, title: e.target.value});
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={mealPlan.description}
                    onChange={(e) => {
                      setMealPlan({...mealPlan, description: e.target.value});
                      setHasChanges(true);
                    }}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loại thực đơn
                  </label>
                  <select
                    value={mealPlan.category}
                    onChange={(e) => {
                      setMealPlan({...mealPlan, category: e.target.value});
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                  >
                    <option value="Giảm cân">Giảm cân</option>
                    <option value="Ăn sạch">Ăn sạch</option>
                    <option value="Thuần chay">Thuần chay</option>
                    <option value="Tăng cơ">Tăng cơ</option>
                    <option value="Gia đình">Gia đình</option>
                    <option value="Keto">Keto</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Day Navigation */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Các ngày</h3>
                <button
                  onClick={handleAddDay}
                  className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                  title="Thêm ngày mới"
                >
                  <FaPlus />
                </button>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {mealPlan.days.map((day, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      index === currentDay
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <button
                      className="text-left flex-1 font-medium"
                      onClick={() => setCurrentDay(index)}
                    >
                      Ngày {day.day}
                    </button>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleMoveDay(index, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          index === 0 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400'
                        }`}
                        title="Di chuyển lên"
                      >
                        <FaArrowUp size={12} />
                      </button>
                      
                      <button
                        onClick={() => handleMoveDay(index, 'down')}
                        disabled={index === mealPlan.days.length - 1}
                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          index === mealPlan.days.length - 1 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400'
                        }`}
                        title="Di chuyển xuống"
                      >
                        <FaArrowDown size={12} />
                      </button>
                      
                      <button
                        onClick={() => handleRemoveDay(index)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Xóa ngày"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Day Meal Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
              <span>Ngày {currentDayData.day}</span>
              <div className="flex items-center text-sm">
                <span className="mr-3 font-normal text-gray-600 dark:text-gray-400">
                  Chỉnh sửa trực tiếp
                </span>
                <button
                  className={`relative w-10 h-5 transition-colors duration-200 ease-linear rounded-full ${
                    isEditing ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-linear transform ${
                      isEditing ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </h2>
            
            <div className="space-y-6">
              {mealTypes.map(mealType => {
                const meal = currentDayData.meals[mealType.id];
                return (
                  <div key={mealType.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-2">{mealType.icon}</span>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white">{mealType.name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tên món
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={meal.name}
                            onChange={(e) => handleUpdateMeal(currentDay, mealType.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            {meal.name || <span className="text-gray-400">Chưa có thông tin</span>}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Calories
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={meal.calories}
                            onChange={(e) => handleUpdateMeal(currentDay, mealType.id, 'calories', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            {meal.calories} kcal
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Thời gian
                        </label>
                        {isEditing ? (
                          <input
                            type="time"
                            value={meal.time}
                            onChange={(e) => handleUpdateMeal(currentDay, mealType.id, 'time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            {meal.time}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nguyên liệu
                        </label>
                        {isEditing && (
                          <button 
                            className="text-green-600 dark:text-green-400 text-sm hover:underline"
                            onClick={() => {
                              const newIngredient = window.prompt('Nhập nguyên liệu mới:');
                              if (newIngredient) {
                                handleAddIngredient(currentDay, mealType.id, newIngredient);
                              }
                            }}
                          >
                            <FaPlus className="inline mr-1" size={10} />
                            Thêm
                          </button>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          {meal.ingredients.map((ingredient, idx) => (
                            <div key={idx} className="flex items-center">
                              <input
                                type="text"
                                value={ingredient}
                                onChange={(e) => {
                                  const updatedMealPlan = {...mealPlan};
                                  updatedMealPlan.days[currentDay].meals[mealType.id].ingredients[idx] = e.target.value;
                                  setMealPlan(updatedMealPlan);
                                  setHasChanges(true);
                                }}
                                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                              />
                              <button
                                onClick={() => handleRemoveIngredient(currentDay, mealType.id, idx)}
                                className="ml-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <FaTimes size={12} />
                              </button>
                            </div>
                          ))}
                          {meal.ingredients.length === 0 && (
                            <p className="text-gray-500 italic text-sm">Chưa có nguyên liệu nào. Nhấn "Thêm" để bổ sung.</p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          {meal.ingredients.length > 0 ? (
                            <ul className="space-y-1 list-disc list-inside">
                              {meal.ingredients.map((ingredient, idx) => (
                                <li key={idx} className="text-gray-700 dark:text-gray-300">
                                  {ingredient}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 italic">Chưa có nguyên liệu nào</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {isEditing && (
                      <div className="mt-4 flex justify-end">
                        <button 
                          className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                          onClick={() => {
                            // Giả lập chức năng thay thế món ăn
                            toast.success("Chức năng thay thế món ăn sẽ được triển khai sau");
                          }}
                        >
                          <FaExchangeAlt className="mr-1" size={12} />
                          Thay thế món ăn
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}