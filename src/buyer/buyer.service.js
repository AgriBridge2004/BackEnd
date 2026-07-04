import { AppDataSource } from '../config/database.js';
import { BuyerEntity } from './buyer.entity.js';

const buyerRepo = () => AppDataSource.getRepository(BuyerEntity);

export const createBuyer = async (buyerData) => {
  const existingBuyer = await buyerRepo().findOne({
    where: { user: { id: buyerData.user?.id } },
  });

  if (existingBuyer) {
    throw new Error('This user already has a buyer profile');
  }

  const buyer = buyerRepo().create(buyerData);
  return await buyerRepo().save(buyer);
};

export const getBuyerById = async (id) => {
  return await buyerRepo().findOne({ where: { id } });
};

export const getBuyerByUserId = async (userId) => {
  return await buyerRepo().findOne({ where: { user: { id: userId } } });
};

export const updateBuyer = async (id, updates) => {
  const repo = buyerRepo();
  await repo.update(id, updates);
  return await repo.findOne({ where: { id } });
};

export const deleteBuyer = async (id) => {
  const buyer = await buyerRepo().findOne({ where: { id } });
  if (!buyer) {
    throw new Error('Buyer not found');
  }
  return await buyerRepo().remove(buyer);
};

export const getAllBuyers = async () => {
  return await buyerRepo().find();
};