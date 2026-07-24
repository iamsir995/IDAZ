const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Cấu hình Cloudinary từ biến môi trường
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

/**
 * Upload file lên Cloudinary (nếu có cấu hình) hoặc lưu đĩa cứng cục bộ (dự phòng)
 * @param {Object} file - File object từ Multer (có thể là buffer hoặc path)
 * @param {String} folder - Thư mục mục tiêu (e.g. 'avatars', 'projects', 'posts', 'assets')
 * @param {Object} req - Express request object để lấy host URL nếu lưu local
 */
exports.uploadToCloudOrLocal = async (file, folder = 'uploads', req = null) => {
  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET
  );

  if (isCloudinaryConfigured) {
    try {
      // Upload trực tiếp lên Cloudinary qua Stream/Buffer
      return new Promise((resolve, reject) => {
        const resourceType = file.mimetype?.startsWith('video/') ? 'video' 
                           : file.mimetype?.startsWith('image/') ? 'image' 
                           : 'raw';

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `idaz_agency/${folder}`,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              filePath: null, // Không lưu file vật lý local
              size: result.bytes,
              mimeType: file.mimetype,
              storageType: 'cloudinary'
            });
          }
        );

        if (file.buffer) {
          uploadStream.end(file.buffer);
        } else if (file.path && fs.existsSync(file.path)) {
          fs.createReadStream(file.path).pipe(uploadStream);
        } else {
          reject(new Error('Không tìm thấy dữ liệu file để upload.'));
        }
      });
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary Upload lỗi, chuyển sang lưu Local:', cloudErr.message);
    }
  }

  // Phương án dự phòng: Lưu local đĩa cứng
  let relativePath = `uploads/${folder}`;
  if (file.destination) {
    const split = file.destination.split('public/')[1];
    if (split) relativePath = split;
  }

  const filename = file.filename || `${Date.now()}-${file.originalname}`;
  const cleanRelative = relativePath.replace(/\/+/g, '/').replace(/\/$/, '');
  
  // Xây dựng URL tuyệt đối với domain Backend
  const host = req ? `${req.protocol}://${req.get('host')}` : (process.env.BACKEND_URL || 'https://api.idaz.com.vn');
  const url = `${host}/${cleanRelative}/${filename}`;
  const filePath = `public/${cleanRelative}/${filename}`;

  return {
    url,
    publicId: null,
    filePath,
    size: file.size,
    mimeType: file.mimetype,
    storageType: 'local'
  };
};
