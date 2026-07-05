import Joi from 'joi';

export const createQOSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(7).max(20).optional(),
  region: Joi.string().max(100).optional(),
});

export const updateQOSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().min(7).max(20).optional(),
  region: Joi.string().max(100).optional(),
});

export const updateQOStatusSchema = Joi.object({
  status: Joi.string().valid('available', 'busy', 'on_leave').required(),
});