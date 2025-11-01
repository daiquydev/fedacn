const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

// Tạo thư mục data nếu chưa có
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Tạo file database
const adapter = new FileSync(path.join(dataDir, 'fileStorage.json'));
const db = low(adapter);

// Khởi tạo cấu trúc database
db.defaults({
  files: [],
  recipes: [],
  ingredients: []
}).write();

module.exports = db;
