import { AppDataSource } from '../config/database.js';
import { ListingEntity } from './listing.entity.js';
import { SavedListingEntity } from './savedListing.entity.js';

const listingRepo = () => AppDataSource.getRepository(ListingEntity);
const savedRepo = () => AppDataSource.getRepository(SavedListingEntity);

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

  if (filters.listingType) {
    query.andWhere('listing.listingType = :listingType', { listingType: filters.listingType });
  }

  if (filters.grade) {
    query.andWhere('listing.grade = :grade', { grade: filters.grade });
  }

  if (filters.search) {
    query.andWhere(
      'listing.search_vector @@ plainto_tsquery(:search)',
      { search: filters.search }
    );
  }

  // ─── Sort ───────────────────────────────────────
  const sortMap = {
    newest: { field: 'listing.createdAt', order: 'DESC' },
    oldest: { field: 'listing.createdAt', order: 'ASC' },
    price_asc: { field: 'listing.price', order: 'ASC' },
    price_desc: { field: 'listing.price', order: 'DESC' },
  };

  const sort = sortMap[filters.sort] || sortMap.newest;
  query.orderBy(sort.field, sort.order);

  // ─── Pagination ─────────────────────────────────
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 12;
  const skip = (page - 1) * limit;

  query.skip(skip).take(limit);

  const [listings, total] = await query.getManyAndCount();

  return {
    listings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── Save Listing ────────────────────────────────
export const saveListing = async (userId, listingId) => {
  const listing = await listingRepo().findOne({ where: { id: listingId } });
  if (!listing) throw new Error('Listing not found');

  const existing = await savedRepo().findOne({ where: { userId, listingId } });
  if (existing) throw new Error('Listing already saved');

  const saved = savedRepo().create({ userId, listingId });
  return await savedRepo().save(saved);
};

export const unsaveListing = async (userId, listingId) => {
  const saved = await savedRepo().findOne({ where: { userId, listingId } });
  if (!saved) throw new Error('Listing not saved');
  return await savedRepo().remove(saved);
};

export const getSavedListings = async (userId) => {
  return await savedRepo().find({
    where: { userId },
    relations: ['listing'],
    order: { createdAt: 'DESC' },
  });
};

// ─── Similar Products ────────────────────────────
export const getSimilarListings = async (id) => {
  const listing = await listingRepo().findOne({ where: { id } });
  if (!listing) throw new Error('Listing not found');

  return await listingRepo()
    .createQueryBuilder('listing')
    .where('listing.category = :category', { category: listing.category })
    .andWhere('listing.id != :id', { id })
    .andWhere('listing.status = :status', { status: 'Available' })
    .orderBy('listing.createdAt', 'DESC')
    .take(4)
    .getMany();
};