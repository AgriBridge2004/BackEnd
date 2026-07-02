import { AppDataSource } from '../config/database.js';
import { ListingEntity } from './listing.entity.js';
import { v2 as cloudinary } from 'cloudinary';

const listingRepo = () => AppDataSource.getRepository(ListingEntity);

export const createListing = async (listingData) => {
  const listing = listingRepo().create(listingData);
  return await listingRepo().save(listing);
};

export const getListingById = async (id) => {
  const repo = listingRepo();
  return await repo
    .createQueryBuilder('listing')
    .leftJoinAndMapOne(
      'listing.farmer',
      'Farmer',
      'farmer',
      'farmer.id = listing.farmerId'
    )
    .select([
      'listing',
      'farmer.id',
      'farmer.fullName',
      'farmer.farmName',
      'farmer.region',
      'farmer.profileImage',
      'farmer.bio',
    ])
    .where('listing.id = :id', { id })
    .getOne();
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

export const deleteListingImage = async (id, imageUrl, farmerId) => {
  const repo = listingRepo();
  const listing = await repo.findOne({ where: { id } });

  if (!listing) throw new Error('Listing not found');
  if (listing.farmerId !== farmerId) throw new Error('Unauthorized');

  // تأكد إن الصورة موجودة فعلاً بالـ listing
  const existingImages = listing.images || [];
  if (!existingImages.includes(imageUrl)) {
    throw new Error('Image not found in this listing');
  }

  // احذف الصورة من Cloudinary
  const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
  await cloudinary.uploader.destroy(publicId);

  // حدّث الـ images array بالـ DB
  const updatedImages = existingImages.filter(img => img !== imageUrl);
  await repo.update(id, { images: updatedImages });

  return await repo.findOne({ where: { id } });
};

export const getAllListings = async (filters = {}) => {
  const repo = listingRepo();
  const query = repo.createQueryBuilder('listing');

  query.where('listing.status = :status', { status: 'Available' });

  if (filters.category) {
    query.andWhere('listing.category = :category', { category: filters.category });
  }

  if (filters.productType) {
    query.andWhere('listing.productType = :productType', { productType: filters.productType });
  }

  if (filters.location) {
    query.andWhere('listing.location ILIKE :location', { location: `%${filters.location}%` });
  }

  if (filters.price_min) {
    query.andWhere('listing.price >= :price_min', { price_min: parseFloat(filters.price_min) });
  }

  if (filters.price_max) {
    query.andWhere('listing.price <= :price_max', { price_max: parseFloat(filters.price_max) });
  }

  if (filters.qty_min) {
    query.andWhere('listing.qty >= :qty_min', { qty_min: parseFloat(filters.qty_min) });
  }

  if (filters.qty_max) {
    query.andWhere('listing.qty <= :qty_max', { qty_max: parseFloat(filters.qty_max) });
  }

  if (filters.search) {
    query.andWhere(
      'listing.search_vector @@ plainto_tsquery(:search)',
      { search: filters.search }
    );
  }

  return await query.getMany();
};