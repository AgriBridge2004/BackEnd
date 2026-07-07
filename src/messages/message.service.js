import { AppDataSource } from '../config/database.js';
import { MessageEntity } from './message.entity.js';

const messageRepo = () => AppDataSource.getRepository(MessageEntity);

export const createMessage = async (messageData) => {
  const message = messageRepo().create(messageData);
  return await messageRepo().save(message);
};

export const getMessagesByDeal = async (dealId) => {
  return await messageRepo().find({
    where: { dealId },
    order: { createdAt: 'ASC' },
  });
};