import {
  createListing,
  getListingById,
  getListingsByFarmer,
  updateListing,
  deleteListing,
  getAllListings,
  saveListing,
  unsaveListing,
  getSavedListings,
  getSimilarListings,
} from './listing.service.js';
import { getFarmerByUserId } from '../farmer/farmer.service.js';
import { uploadToCloudinary } from '../middleware/upload.middleware.js';

// POST /listings
export const createListingController = async (req, res) => {
  try {
    const {
      name, productType, category, description, qty, unit, price, location, expiry,
      harvestDate, grade, variety, farmingMethod, packaging, shelfLife, storage,
      certifications, listingType,
    } = req.body;

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
      name, productType, category, description, qty, unit, price, location,
      expiry: expiry || null,
      harvestDate: harvestDate || null,
      grade: grade || null,
      variety: variety || null,
      farmingMethod: farmingMethod || null,
      packaging: packaging || null,
      shelfLife: shelfLife || null,
      storage: storage || null,
      certifications: certifications || null,
      listingType: listingType || 'Spot',
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
    const start = Date.now();

    const {
      category, productType, location, price_min, price_max,
      qty_min, qty_max, search, sort, page, limit, listingType, grade,
    } = req.query;

    const filters = {
      category, productType, location, price_min, price_max,
      qty_min, qty_max, search, sort, page, limit, listingType, grade,
    };

    const result = await getAllListings(filters);

    const responseTime = Date.now() - start;
    console.log(`Search response time: ${responseTime}ms`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('GET ALL LISTINGS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /listings/saved
export const getSavedListingsController = async (req, res) => {
  try {
    const saved = await getSavedListings(req.user.id);
    return res.status(200).json({ count: saved.length, saved });
  } catch (error) {
    console.error('GET SAVED LISTINGS ERROR:', error);
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

// GET /listings/:id/similar
export const getSimilarListingsController = async (req, res) => {
  try {
    const listings = await getSimilarListings(req.params.id);
    return res.status(200).json({ listings });
  } catch (error) {
    console.error('GET SIMILAR LISTINGS ERROR:', error);
    if (error.message === 'Listing not found') {
      return res.status(404).json({ message: error.message });
    }
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

// DELETE /listings/:id/images
export const deleteListingImageController = async (req, res) => {
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
      return res.status(403).json({ message: 'You can only delete images from your own listings' });
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl is required' });
    }

    const existingImages = listing.images || [];
    if (!existingImages.includes(imageUrl)) {
      return res.status(404).json({ message: 'Image not found in this listing' });
    }

    const updatedImages = existingImages.filter(img => img !== imageUrl);
    const updated = await updateListing(req.params.id, { images: updatedImages }, farmer.id);

    return res.status(200).json({
      message: 'Image deleted successfully',
      images: updated.images,
    });

  } catch (error) {
    console.error('DELETE LISTING IMAGE ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /listings/:id/save
export const saveListingController = async (req, res) => {
  try {
    const saved = await saveListing(req.user.id, req.params.id);
    return res.status(201).json({ message: 'Listing saved successfully', saved });
  } catch (error) {
    console.error('SAVE LISTING ERROR:', error);
    if (error.message === 'Listing not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Listing already saved') {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /listings/:id/save
export const unsaveListingController = async (req, res) => {
  try {
    await unsaveListing(req.user.id, req.params.id);
    return res.status(200).json({ message: 'Listing removed from saved' });
  } catch (error) {
    console.error('UNSAVE LISTING ERROR:', error);
    if (error.message === 'Listing not saved') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};