/**
 * Upload screenshot to Cloudinary and get URL
 */
const { v2: cloudinary } = require('cloudinary')
const fs = require('fs')
const path = require('path')

cloudinary.config({
  cloud_name: 'da9cghklv',
  api_key: '937666813182891',
  api_secret: '5BJZYsZXFd-I7K5isAUJIn5Qhm8'
})

const imagePath = 'C:\\Users\\Dai Quy\\.cursor\\projects\\c-DATN-fedacn\\assets\\c__Users_Dai_Quy_AppData_Roaming_Cursor_User_workspaceStorage_e5f7d93d1ed69a2741a0f7b0614816d6_images_image-925ac8ec-fd53-4ba1-b9e5-28d433504198.png'

async function upload() {
  try {
    console.log('Uploading image to Cloudinary...')
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: `screenshots/yoga_session_${Date.now()}`,
      resource_type: 'image',
      folder: 'screenshots'
    })
    console.log('URL:', result.secure_url)
    console.log('Done!')
  } catch (err) {
    console.error('Error:', err.message)
  }
}

upload()
