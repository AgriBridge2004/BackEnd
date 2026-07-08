import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// multer بيحفظ في الذاكرة مؤقتاً بدل السيرفر
const storage = multer.memoryStorage();

export const uploadFarmerImages = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
        else resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

export const uploadFields = (fields) => {
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
  }).fields(fields);
};

// رفع كل الصور المرفوعة على Cloudinary ويرجع URLs
export const processUploadedImages = async (files = {}) => {
  const result = {};

  for (const [fieldName, fileArray] of Object.entries(files)) {
    const file = fileArray[0];
    if (file?.buffer) {
      try {
        const url = await uploadToCloudinary(file.buffer, 'agribridge/farmers');
        result[fieldName] = url;
      } catch (error) {
        throw new Error(`Failed to upload ${fieldName}: ${error.message}`);
      }
    }
  }

  return result;
};

// رفع مصفوفة صور من نفس الحقل (لحالات الصور المتعددة زي تقرير التفتيش)
export const processMultipleUploadedImages = async (files = {}, fieldName, folder = 'agribridge') => {
  const fileArray = files[fieldName];

  if (!fileArray || fileArray.length === 0) {
    return [];
  }

  const urls = [];

  for (const file of fileArray) {
    if (file?.buffer) {
      try {
        const url = await uploadToCloudinary(file.buffer, folder);
        urls.push(url);
      } catch (error) {
        throw new Error(`Failed to upload ${fieldName}: ${error.message}`);
      }
    }
  }

  return urls;
};
