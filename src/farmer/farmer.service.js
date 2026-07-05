import { AppDataSource } from '../config/database.js';
import { FarmerEntity } from './farmer.entity.js';

const farmerRepo = () => AppDataSource.getRepository(FarmerEntity);

export const createFarmer = async (farmerData) => {
  try {
    const existingFarmer = await farmerRepo().findOne({
      where: { user: { id: farmerData.user?.id } },
    });

    if (existingFarmer) {
      throw new Error('This user already has a farmer profile');
    }

    const farmer = farmerRepo().create(farmerData);
    return await farmerRepo().save(farmer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create farmer: ${message}`);
  }
};

export const getFarmerById = async (id) => {
  try {
    return await farmerRepo().findOne({ where: { id } });
  } catch (error) {
    throw new Error(`Failed to get farmer: ${error.message}`);
  }
};

export const getFarmerByUserId = async (userId) => {
  try {
    return await farmerRepo().findOne({ where: { user: { id: userId } } });
  } catch (error) {
    throw new Error(`Failed to get farmer by user ID: ${error.message}`);
  }
};

export const updateFarmer = async (id, updates) => {
  try {
    const repo = farmerRepo();
    await repo.update(id, updates);
    return await repo.findOne({ where: { id } });
  } catch (error) {
    throw new Error(`Failed to update farmer: ${error.message}`);
  }
};



export const getAllFarmers = async () => {
  try {
    return await farmerRepo().find();
  } catch (error) {
    throw new Error(`Failed to get farmers: ${error.message}`);
  }
};
