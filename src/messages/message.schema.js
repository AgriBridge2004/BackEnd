import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  text: Joi.string().min(1).max(1000).required(),
  type: Joi.string().valid('text', 'offer').default('text'),
  offerPrice: Joi.number().positive(),
  offerQuantity: Joi.number().positive(),
  offerTerms: Joi.string().max(500),
});