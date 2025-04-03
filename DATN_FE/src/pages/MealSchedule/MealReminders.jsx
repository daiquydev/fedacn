import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBell, FaPlus, FaTrashAlt, FaEdit, FaClock, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export default function MealReminders() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    time: '',
    days: [],
    enabled: true
  });
  
  // Mô phỏng fetch dữ liệu
  useEffect(() => {
    setTimeout(() => {
      // Mock data
      const mockReminders = [
        {
          id: 1,
          title: 'Bữa sáng',
          time: '07:00',
          days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
          enabled: true
        },
        {
          id: 2,
          title: 'Bữa trưa',
          time: '12:00',
          days: ['T2', 'T3', 'T4', 'T5', 'T6'],
          enabled: true
        },
        {
          id: 3,
          title: 'Bữa tối',
          time: '19:00',
          days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
          enabled: true
        },
        {
          id: 4,
          title: 'Snack chiều',
          time: '15:30',
          days: ['T2', 'T3', 'T4', 'T5', 'T6'],
          enabled: false
        }
      ];
      
      setReminders(mockReminders);
      setLoading(false);
    }, 800);
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDayToggle = (day) => {
    setFormData(prev => {
      const newDays = [...prev.days];
      
      if (newDays.includes(day)) {
        return { ...prev, days: newDays.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...newDays, day] };
      }
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingReminder) {
      // Update existing reminder
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === editingReminder.id ? { ...formData, id: reminder.id } : reminder
        )
      );
    } else {
      // Add new reminder
      const newReminder = {
        ...formData,
        id: Date.now()
      };
      
      setReminders(prev => [...prev, newReminder]);
    }
    
    // Reset and close modal
    setFormData({
      title: '',
      time: '',
      days: [],
      enabled: true
    });
    setEditingReminder(null);
    setShowAddModal(false);
  };
  
  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      time: reminder.time,
      days: [...reminder.days],
      enabled: reminder.enabled
    });
    setShowAddModal(true);
  };
  
  const handleDelete = (id) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
  };
  
  const handleToggle = (id) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder
      )
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/schedule/my-eat-schedule')}
        className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400"
      >
        <FaArrowLeft className="mr-2" /> Quay lại lịch ăn uống
      </button>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaBell className="mr-2 text-yellow-600" /> Nhắc nhở bữa ăn
          </h1>
          
          <button
            onClick={() => {
              setEditingReminder(null);
              setFormData({
                title: '',
                time: '',
                days: [],
                enabled: true
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center transition-colors"
          >
            <FaPlus className="mr-2" /> Thêm nhắc nhở
          </button>
        </div>
        
        {reminders.length > 0 ? (
          <div className="space-y-4">
            {reminders.map(reminder => (
              <div 
                key={reminder.id}
                className={`p-4 rounded-lg border ${
                  reminder.enabled
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      reminder.enabled
                        ? 'bg-yellow-200 dark:bg-yellow-800/40 text-yellow-700 dark:text-yellow-300'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                      <FaBell />
                    </div>
                    <div className="ml-3">
                      <h3 className={`font-medium ${
                        reminder.enabled
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {reminder.title}
                      </h3>
                      <div className="flex items-center text-sm space-x-4">
                        <span className={`flex items-center ${
                          reminder.enabled
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <FaClock className="mr-1" /> {reminder.time}
                        </span>
                        <span className={reminder.enabled
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-500 dark:text-gray-400'
                        }>
                          {reminder.days.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(reminder)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full text-red-500"
                    >
                      <FaTrashAlt />
                    </button>
                    <button
                      onClick={() => handleToggle(reminder.id)}
                      className={`text-2xl ${
                        reminder.enabled
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {reminder.enabled ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-4">
              <FaBell className="text-xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có nhắc nhở nào</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Thêm nhắc nhở để không bỏ lỡ bữa ăn theo kế hoạch của bạn.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg inline-flex items-center transition-colors"
            >
              <FaPlus className="mr-2" /> Thêm nhắc nhở đầu tiên
            </button>
          </div>
        )}
      </div>
      
      {/* Add/Edit Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingReminder ? 'Chỉnh sửa nhắc nhở' : 'Thêm nhắc nhở mới'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ví dụ: Bữa sáng, Bữa trưa..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thời gian
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Các ngày
                </label>
                <div className="flex flex-wrap gap-2">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                        formData.days.includes(day)
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trạng thái
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`text-2xl ${
                    formData.enabled
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {formData.enabled ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingReminder ? 'Cập nhật' : 'Thêm nhắc nhở'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 