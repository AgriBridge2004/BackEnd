import { AppDataSource } from '../config/database.js';
import { UserEntity } from './user.entity.js';

const userRepo = () => AppDataSource.getRepository(UserEntity);

export const findUserByEmail = async (email) => {
  return await userRepo().findOne({ where: { email } });
};

export const createUser = async (userData) => {
  const user = userRepo().create(userData);
  return await userRepo().save(user);
};

export const updateUser = async (id, updates) => {
  const repo = userRepo();
  await repo.update(id, updates);
  return await repo.findOne({ where: { id } });
};