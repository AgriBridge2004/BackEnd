import {
  createListing,
  getListingById,
  getListingsByFarmer,
  updateListing,
  deleteListing,
  getAllListings,
} from './listing.service.js';
import { getFarmerByUserId } from '../farmer/farmer.service.js';
import { uploadToCloudinary } from '../middleware/upload.middleware.js';

// POST /listings
export const createListingController = async (req, res) => {
  try {
    const { name, productType, category, description, qty, unit, price, location, expiry } = req.body;

    if (!name || !productType || !category || !description || !qty || !unit || !price || !location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (price <= 0 || qty <= 0) {
      return res.status(400).json({ message: 'Price and quantity must be greater than 0' });
    }

    const farmer = await getFarmerByUserId(req.user.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    const listing = await createListing({
      name, productType, category, description, qty, unit, price, location, expiry,
      farmerId: farmer.id,
    });

    return res.status(201).json({ message: 'Listing created successfully', listing });

  } catch (error) {
    console.error('CREATE LISTING ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /listings
export const getAllListingsController = async (req, res) => {
  try {
    const listings = await getAllListings();
    return res.status(200).json({ listings });
  } catch (error) {
    console.error('GET ALL LISTINGS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /listings/:id
export const getListingController = async (req, res) => {
  try {
    const listing = await getListingById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    return res.status(200).json({ listing });
  } catch (error) {
    console.error('GET LISTING ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /listings/my
export const getMyListingsController = async (req, res) => {
  try {
    const farmer = await getFarmerByUserId(req.user.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    const listings = await getListingsByFarmer(farmer.id);
    return res.status(200).json({ listings });
  } catch (error) {
    console.error('GET MY LISTINGS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /listings/:id
export const updateListingController = async (req, res) => {
  try {
    const farmer = await getFarmerByUserId(req.user.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    const updated = await updateListing(req.params.id, req.body, farmer.id);
    return res.status(200).json({ message: 'Listing updated successfully', listing: updated });

  } catch (error) {
    console.error('UPDATE LISTING ERROR:', error);
    if (error.message === 'Listing not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ message: 'You can only edit your own listings' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /listings/:id
export const deleteListingController = async (req, res) => {
  try {
    const farmer = await getFarmerByUserId(req.user.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    await deleteListing(req.params.id, farmer.id);
    return res.status(200).json({ message: 'Listing deleted successfully' });

  } catch (error) {
    console.error('DELETE LISTING ERROR:', error);
    if (error.message === 'Listing not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ message: 'You can only delete your own listings' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /listings/:id/images
export const uploadListingImagesController = async (req, res) => {
  try {
    const farmer = await getFarmerByUserId(req.user.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    const listing = await getListingById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.farmerId !== farmer.id) {
      return res.status(403).json({ message: 'You can only upload images to your own listings' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 images allowed' });
    }

    const imageUrls = await Promise.all(
      req.files.map(file => uploadToCloudinary(file.buffer, 'agribridge/listings'))
    );

    const existingImages = listing.images || [];
    const allImages = [...existingImages, ...imageUrls];

    if (allImages.length > 10) {
      return res.status(400).json({ message: 'Total images cannot exceed 10' });
    }

    const updated = await updateListing(req.params.id, { images: allImages }, farmer.id);

    return res.status(200).json({
      message: 'Images uploaded successfully',
      images: updated.images,
    });

  } catch (error) {
    console.error('UPLOAD IMAGES ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};