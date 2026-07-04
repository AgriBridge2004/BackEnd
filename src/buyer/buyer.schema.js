import Joi from 'joi';

export const createBuyerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(7).max(20).required(),
  companyName: Joi.string().max(100).optional(),
  businessType: Joi.string().valid('Restaurant', 'Factory', 'Wholesaler', 'Retailer', 'Other').optional(),
  address: Joi.string().max(200).optional(),
  bio: Joi.string().max(500).optional(),
});

export const updateBuyerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().min(7).max(20).optional(),
  companyName: Joi.string().max(100).optional(),
  businessType: Joi.string().valid('Restaurant', 'Factory', 'Wholesaler', 'Retailer', 'Other').optional(),
  address: Joi.string().max(200).optional(),
  bio: Joi.string().max(500).optional(),
});