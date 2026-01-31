import React, { useState } from 'react';
import DatePicker from 'react-datepicker'; // Thêm thư viện DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS cho DatePicker

function EventForm() {
    const [eventDate, setEventDate] = useState(null); // State cho ngày giờ sự kiện
    const [currentTab, setCurrentTab] = useState('location'); // Tab hiện tại
    const [errors, setErrors] = useState({}); // State lưu lỗi
    const [formData, setFormData] = useState({
        images: '',
        description: '',
    });

    const handleTabChange = (tab) => {
        // Chỉ kiểm tra lỗi khi chuyển sang tab details
        if (tab === 'details') {
            const newErrors = {};
            if (!formData.images) newErrors.images = 'Hình ảnh không được để trống';
            if (!formData.description) newErrors.description = 'Mô tả không được để trống';
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return; // Dừng chuyển tab nếu có lỗi
            }
        }
        // Khi chuyển về tab location thì không validate hình ảnh/mô tả
        setErrors({});
        setCurrentTab(tab);
    };

    const handleSubmit = () => {
        // Kiểm tra lỗi khi gửi biểu mẫu
        const newErrors = {};
        if (!eventDate) newErrors.eventDate = 'Ngày giờ sự kiện không được để trống';
        if (!formData.images) newErrors.images = 'Hình ảnh không được để trống';
        if (!formData.description) newErrors.description = 'Mô tả không được để trống';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        // ...existing code...
        alert('Lưu thành công!');
    };

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="flex gap-2 mb-4">
                <button className={`px-4 py-2 rounded-t-lg ${currentTab==='location' ? 'bg-green-500 text-white' : 'bg-gray-200'}`} onClick={() => handleTabChange('location')}>Địa điểm & Sức chứa</button>
                <button className={`px-4 py-2 rounded-t-lg ${currentTab==='details' ? 'bg-green-500 text-white' : 'bg-gray-200'}`} onClick={() => handleTabChange('details')}>Hình ảnh & Mô tả</button>
            </div>
            {currentTab === 'location' && (
                <div>
                    <label className="block mb-2 font-medium">Ngày giờ sự kiện:</label>
                    <div className="flex items-center gap-2">
                        <DatePicker
                            selected={eventDate}
                            onChange={(date) => setEventDate(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="dd/MM/yyyy HH:mm"
                            placeholderText="Chọn ngày và giờ (VD: 31/01/2026 14:00)"
                            className="border px-3 py-2 rounded w-full"
                        />
                        <span role="img" aria-label="calendar">📅</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Chọn ngày và giờ bắt đầu sự kiện</p>
                    {errors.eventDate && <span className="text-red-500 text-sm">{errors.eventDate}</span>}
                </div>
            )}
            {currentTab === 'details' && (
                <div>
                    <label className="block mb-2 font-medium">Hình ảnh (URL):</label>
                    <input
                        type="text"
                        value={formData.images}
                        onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                        className="border px-3 py-2 rounded w-full"
                        placeholder="Nhập URL hình ảnh hoặc tải lên"
                    />
                    {errors.images && <span className="text-red-500 text-sm">{errors.images}</span>}
                    <label className="block mt-4 mb-2 font-medium">Mô tả:</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="border px-3 py-2 rounded w-full"
                        rows={3}
                        placeholder="Nhập mô tả chi tiết về sự kiện..."
                    />
                    {errors.description && <span className="text-red-500 text-sm">{errors.description}</span>}
                </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
                <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={() => handleTabChange('location')}>Địa điểm & Sức chứa</button>
                <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={() => handleTabChange('details')}>Hình ảnh & Mô tả</button>
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" onClick={handleSubmit}>Lưu</button>
            </div>
        </div>
    );
}

export default EventForm;