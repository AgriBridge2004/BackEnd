import {
  createBuyer,
  getBuyerById,
  getBuyerByUserId,
  updateBuyer,
  deleteBuyer,
  getAllBuyers,
} from './buyer.service.js';
import { processUploadedImages } from '../middleware/upload.middleware.js';

const validateProfileImage = (files) => {
  const profileImage = files?.profileImage?.[0];
  if (!profileImage) return null;

  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(profileImage.mimetype)) {
    throw new Error('Profile image must be JPG or PNG only');
  }

  if (profileImage.size > maxSize) {
    throw new Error('Profile image must be less than 5MB');
  }

  return profileImage;
};

export const createBuyerController = async (req, res) => {
  try {
    const { fullName, phone, companyName, businessType, address, bio } = req.body;
    const userId = req.user?.id;

    if (!fullName || !phone) {
      return res.status(400).json({ message: 'Full name and phone are required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const existingBuyer = await getBuyerByUserId(userId);
    if (existingBuyer) {
      return res.status(409).json({ message: 'This user already has a buyer profile' });
    }

    try {
      validateProfileImage(req.files);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    const uploadedImages = await processUploadedImages(req.files || {});

    const buyer = await createBuyer({
      fullName,
      phone,
      companyName: companyName || null,
      businessType: businessType || null,
      address: address || null,
      bio: bio || null,
      profileImage: uploadedImages.profileImage || null,
      user: { id: userId },
    });

    return res.status(201).json({
      message: 'Buyer profile created successfully',
      buyer,
    });

  } catch (error) {
    console.error('CREATE BUYER ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateBuyerController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const existingBuyer = await getBuyerByUserId(userId);
    if (!existingBuyer) {
      return res.status(404).json({ message: 'Buyer profile not found' });
    }

    const { fullName, phone, companyName, businessType, address, bio } = req.body;
    const updates = {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(companyName !== undefined && { companyName }),
      ...(businessType !== undefined && { businessType }),
      ...(address !== undefined && { address }),
      ...(bio !== undefined && { bio }),
    };

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
    }

    const buyer = await updateBuyer(existingBuyer.id, updates);

    return res.status(200).json({
      message: 'Buyer profile updated successfully',
      buyer,
    });

  } catch (error) {
    console.error('UPDATE BUYER ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const deleteBuyerController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBuyer = await getBuyerById(id);
    if (!existingBuyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    await deleteBuyer(id);
    return res.status(200).json({ message: 'Buyer deleted successfully' });

  } catch (error) {
    console.error('DELETE BUYER ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getBuyerController = async (req, res) => {
  try {
    const buyer = await getBuyerById(req.params.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    return res.status(200).json(buyer);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getBuyerByUserController = async (req, res) => {
  try {
    const buyer = await getBuyerByUserId(req.params.userId);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer profile not found' });
    }
    return res.status(200).json(buyer);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getAllBuyersController = async (req, res) => {
  try {
    const buyers = await getAllBuyers();
    return res.status(200).json({
      message: 'Buyers retrieved successfully',
      count: buyers.length,
      buyers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};