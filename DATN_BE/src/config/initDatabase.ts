export const initializeDatabase = async () => {
  console.log('Initializing database...')

  // NOTE: Sport events KHÔNG được seed tự động khi khởi động server
  // để tránh xóa mất data do người dùng tạo.
  // Chạy thủ công: npx ts-node src/scripts/reseedSportEvents.ts

  console.log('Database initialization completed!')
}

export default initializeDatabase
