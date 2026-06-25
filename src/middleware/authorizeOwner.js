import { AppDataSource } from '../config/database.js';
import { FarmerEntity } from '../farmer/farmer.entity.js';

export const authorizeOwner = async (req, res, next) => {
  try {
    const farmerId = req.params.id;
    const tokenUserId = req.user.id;

    console.log('Farmer ID from URL:', farmerId);
    console.log('User ID from Token:', tokenUserId);

    const farmerRepo = AppDataSource.getRepository(FarmerEntity);
    const farmer = await farmerRepo.findOne({ where: { id: farmerId } });

    console.log('Farmer found:', farmer);
    console.log('Farmer userId:', farmer?.userId);

    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    if (farmer.userId !== tokenUserId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only edit your own profile.' 
      });
    }
    // بعد ما تتأكد الفلاح موجود
// ✅ الـ admin يعدي مباشرة
if (req.user.role === 'admin') {
  return next();
}

if (farmer.userId !== tokenUserId) {
  return res.status(403).json({ 
    message: 'Access denied. You can only edit your own profile.' 
  });
}

    next();
  } catch (error) {
    console.log('ERROR:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};