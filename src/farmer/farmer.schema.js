import Joi from 'joi';

export const createFarmerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(7).max(20).required(),
  farmName: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional(),
  cropTypes: Joi.string().max(200).optional(),
  region: Joi.string().max(100).optional(),
  farmSize: Joi.number().positive().optional(),
});

export const updateFarmerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().min(7).max(20).optional(),
  farmName: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional(),
  cropTypes: Joi.string().max(200).optional(),
  region: Joi.string().max(100).optional(),
  farmSize: Joi.number().positive().optional(),
});