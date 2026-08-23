import Joi from 'joi';

export const createListingSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  productType: Joi.string().valid('Plant', 'Animal').required(),
  category: Joi.string().valid(
    'Fruits', 'Vegetables', 'Nuts', 'Herbs',
    'Grains', 'Meat', 'Dairy', 'Eggs', 'Honey'
  ).required(),
  description: Joi.string().min(10).max(1000).required(),
  qty: Joi.number().positive().required(),
  unit: Joi.string().valid('kg', 'ton', 'piece', 'liter', 'box').required(),
  price: Joi.number().positive().required(),
  location: Joi.string().min(2).max(100).required(),
  expiry: Joi.date().optional(),
  // ─── Extra Fields ───────────────────────────────
  harvestDate: Joi.date().optional(),
  grade: Joi.string().valid('A', 'B', 'C').optional(),
  variety: Joi.string().max(100).optional(),
  farmingMethod: Joi.string().valid('Organic', 'Conventional', 'Hydroponic', 'Other').optional(),
  packaging: Joi.string().max(200).optional(),
  shelfLife: Joi.string().max(100).optional(),
  storage: Joi.string().max(200).optional(),
  certifications: Joi.array().items(Joi.string()).optional(),
  listingType: Joi.string().valid('Spot', 'Pre-Harvest').optional(),
});

export const updateListingSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  productType: Joi.string().valid('Plant', 'Animal').optional(),
  category: Joi.string().valid(
    'Fruits', 'Vegetables', 'Nuts', 'Herbs',
    'Grains', 'Meat', 'Dairy', 'Eggs', 'Honey'
  ).optional(),
  description: Joi.string().min(10).max(1000).optional(),
  qty: Joi.number().positive().optional(),
  unit: Joi.string().valid('kg', 'ton', 'piece', 'liter', 'box').optional(),
  price: Joi.number().positive().optional(),
  location: Joi.string().min(2).max(100).optional(),
  expiry: Joi.date().optional(),
  // ─── Extra Fields ───────────────────────────────
  harvestDate: Joi.date().optional(),
  grade: Joi.string().valid('A', 'B', 'C').optional(),
  variety: Joi.string().max(100).optional(),
  farmingMethod: Joi.string().valid('Organic', 'Conventional', 'Hydroponic', 'Other').optional(),
  packaging: Joi.string().max(200).optional(),
  shelfLife: Joi.string().max(100).optional(),
  storage: Joi.string().max(200).optional(),
  certifications: Joi.array().items(Joi.string()).optional(),
  listingType: Joi.string().valid('Spot', 'Pre-Harvest').optional(),
});