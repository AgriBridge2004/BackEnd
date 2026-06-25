import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer بيحفظ في الذاكرة مؤقتاً بدل السيرفر
const storage = multer.memoryStorage();

export const uploadFarmerImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only jpg/png images are allowed'), false);
    }
    cb(null, true);
  },
});

// رفع صورة واحدة على Cloudinary
export const uploadToCloudinary = (buffer, folder = 'farmers') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // يرجع الـ URL
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// رفع كل الصور المرفوعة على Cloudinary ويرجع URLs
export const processUploadedImages = async (files = {}) => {
  const result = {};

  for (const [fieldName, fileArray] of Object.entries(files)) {
    const file = fileArray[0];
    if (file?.buffer) {
      try {
        const url = await uploadToCloudinary(file.buffer, 'agribridge/farmers');
        result[fieldName] = url; // URL من Cloudinary
      } catch (error) {
        throw new Error(`Failed to upload ${fieldName}: ${error.message}`);
      }
    }
  }

  return result;
};