import { createFarmer, getFarmerById, updateFarmer, getAllFarmers, getFarmerByUserId } from './farmer.service.js';
import { processUploadedImages } from '../middleware/upload.middleware.js';

// ✅ Helper: التحقق من الصورة قبل الرفع
const validateProfileImage = (files) => {
  const profileImage = files?.profileImage?.[0];
  if (!profileImage) return null;

  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(profileImage.mimetype)) {
    throw new Error('Profile image must be JPG or PNG only');
  }

  if (profileImage.size > maxSize) {
    throw new Error('Profile image must be less than 5MB');
  }

  return profileImage;
};

export const createFarmerController = async (req, res) => {
  try {
    // ✅ أضفنا الحقول الزراعية الجديدة
    const { fullName, phone, farmName, bio, cropTypes, region, farmSize } = req.body;
    const userId = req.user?.id;

    if (!fullName || !phone) {
      return res.status(400).json({ message: 'Full name and phone are required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const existingFarmer = await getFarmerByUserId(userId);
    if (existingFarmer) {
      return res.status(409).json({ message: 'This user already has a farmer profile' });
    }

    // ✅ التحقق من الصورة قبل الرفع
    try {
      validateProfileImage(req.files);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    const uploadedImages = await processUploadedImages(req.files || {});

    const farmerData = {
      fullName,
      phone,
      farmName: farmName || null,
      bio: bio || null,
      // ✅ الحقول الزراعية الجديدة
      cropTypes: cropTypes || null,
      region: region || null,
      farmSize: farmSize ? parseFloat(farmSize) : null,
      profileImage: uploadedImages.profileImage || null,
      coverImage: uploadedImages.coverImage || null,
      user: { id: userId },
    };

    const farmer = await createFarmer(farmerData);

    return res.status(201).json({
      message: 'Farmer created successfully',
      farmer,
    });

  } catch (error) {
    console.error('CREATE FARMER ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ✅ updateFarmerController — هلق بياخد الـ id من الـ token مش من الـ params
export const updateFarmerController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    // ✅ بنجيب الفلاح عن طريق الـ userId مش الـ farmerId
    const existingFarmer = await getFarmerByUserId(userId);
    if (!existingFarmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // ✅ أضفنا الحقول الزراعية
    const { fullName, phone, farmName, bio, cropTypes, region, farmSize } = req.body;
    const updates = {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(farmName !== undefined && { farmName }),
      ...(bio !== undefined && { bio }),
      ...(cropTypes !== undefined && { cropTypes }),
      ...(region !== undefined && { region }),
      ...(farmSize !== undefined && { farmSize: parseFloat(farmSize) }),
    };

    // ✅ التحقق من الصورة لو انبعتت
    if (req.files && Object.keys(req.files).length > 0) {
      try {
        validateProfileImage(req.files);
      } catch (validationError) {
        return res.status(400).json({ message: validationError.message });
      }

      const uploadedImages = await processUploadedImages(req.files);

      if (uploadedImages.profileImage) {
        updates.profileImage = uploadedImages.profileImage;
      }
      if (uploadedImages.coverImage) {
        updates.coverImage = uploadedImages.coverImage;
      }
    }

    const farmer = await updateFarmer(existingFarmer.id, updates);

    return res.status(200).json({
      message: 'Profile updated successfully', // ✅ رسالة واضحة للـ Frontend يعملها Toast
      farmer,
    });

  } catch (error) {
    console.error('UPDATE FARMER ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};



export const getFarmerController = async (req, res) => {
  try {
    const farmer = await getFarmerById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    return res.status(200).json(farmer);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getFarmerByUserController = async (req, res) => {
  try {
    const farmer = await getFarmerByUserId(req.params.userId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }
    return res.status(200).json(farmer);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getMyFarmerController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const farmer = await getFarmerByUserId(userId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }
    return res.status(200).json(farmer);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getAllFarmersController = async (req, res) => {
  try {
    const farmers = await getAllFarmers();
    return res.status(200).json({
      message: 'Farmers retrieved successfully',
      count: farmers.length,
      farmers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};