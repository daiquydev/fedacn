import multer from 'multer'

const upload = multer({
  storage: multer.memoryStorage(), // Enable memory storage
  limits: {
    fileSize: 1024 * 1024 * 50 // 50MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/webp') {
      cb(null, true)
    } else {
      cb(null, false)
    }
  }
})

export default upload
