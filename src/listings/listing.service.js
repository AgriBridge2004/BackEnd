import { AppDataSource } from '../config/database.js';
import { ListingEntity } from './listing.entity.js';

const listingRepo = () => AppDataSource.getRepository(ListingEntity);

export const createListing = async (listingData) => {
  const listing = listingRepo().create(listingData);
  return await listingRepo().save(listing);
};

export const getListingById = async (id) => {
  return await listingRepo().findOne({ where: { id } });
};

export const getListingsByFarmer = async (farmerId) => {
  return await listingRepo().find({ where: { farmerId } });
};

export const updateListing = async (id, updates, farmerId) => {
  const repo = listingRepo();
  const listing = await repo.findOne({ where: { id } });
  if (!listing) throw new Error('Listing not found');
  if (listing.farmerId !== farmerId) throw new Error('Unauthorized');
  await repo.update(id, updates);
  return await repo.findOne({ where: { id } });
};

export const deleteListing = async (id, farmerId) => {
  const listing = await listingRepo().findOne({ where: { id } });
  if (!listing) throw new Error('Listing not found');
  if (listing.farmerId !== farmerId) throw new Error('Unauthorized');
  return await listingRepo().remove(listing);
};