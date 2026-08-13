import Joi from 'joi';

export const updateUserStatusSchema = Joi.object({
  isSuspended: Joi.boolean().required(),
});