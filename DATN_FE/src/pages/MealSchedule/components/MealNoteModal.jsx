import React, { useState, useEffect } from 'react';

export default function MealNoteModal({ isOpen, onClose, onSaveNote, initialNote = '' }) {
  const [note, setNote] = useState(initialNote);

  // Reset note khi modal mở với initialNote mới
  useEffect(() => {
    if (isOpen) {
      setNote(initialNote);
    }
  }, [isOpen, initialNote]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Kiểm tra note không được rỗng
    if (!note.trim()) {
      return;
    }

    // Gọi callback để lưu note
    onSaveNote(note.trim());
    
    // Reset form
    setNote('');
  };

  // Reset note khi đóng modal
  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ghi chú bữa ăn</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nội dung ghi chú
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú của bạn..."
              className="w-full p-3 min-h-[120px] border border-gray-300 dark:border-gray-600 
                rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none 
                focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600"
            />
            {!note.trim() && (
              <p className="mt-1 text-sm text-red-500">Vui lòng nhập nội dung ghi chú</p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={!note.trim()}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors
                ${note.trim() 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Lưu ghi chú
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 
                dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg 
                font-medium transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 