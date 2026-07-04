import Joi from 'joi';

export const createRFQSchema = Joi.object({
  productType: Joi.string().min(2).max(100).required(),
  quantity: Joi.number().positive().required(),
  location: Joi.string().min(2).max(100).required(),
  deliveryDate: Joi.date().optional(),
  budget: Joi.number().positive().optional(),
  notes: Joi.string().max(500).optional(),
});

export const createQuoteSchema = Joi.object({
  price: Joi.number().positive().required(),
  message: Joi.string().max(500).optional(),
});

export const updateQuoteSchema = Joi.object({
  action: Joi.string().valid('accept', 'reject', 'counter').required(),
  counterPrice: Joi.number().positive().when('action', {
    is: 'counter',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});