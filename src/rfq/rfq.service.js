import { AppDataSource } from '../config/database.js';
import { RFQEntity } from './rfq.entity.js';
import { QuoteEntity } from './quote.entity.js';

const rfqRepo = () => AppDataSource.getRepository(RFQEntity);
const quoteRepo = () => AppDataSource.getRepository(QuoteEntity);

// ─── RFQ ───────────────────────────────────────────

export const createRFQ = async (rfqData) => {
  const rfq = rfqRepo().create(rfqData);
  return await rfqRepo().save(rfq);
};

export const getAllRFQs = async (filters = {}) => {
  const repo = rfqRepo();
  const query = repo.createQueryBuilder('rfq');

  query.where('rfq.status = :status', { status: 'open' });

  // ─── Filters ───────────────────────────────────────────
  if (filters.productType) {
    query.andWhere('rfq.productType ILIKE :productType', { 
      productType: `%${filters.productType}%` 
    });
  }

  if (filters.location) {
    query.andWhere('rfq.location ILIKE :location', { 
      location: `%${filters.location}%` 
    });
  }

  if (filters.budget_min) {
    query.andWhere('rfq.budget >= :budget_min', { 
      budget_min: parseFloat(filters.budget_min) 
    });
  }

  if (filters.budget_max) {
    query.andWhere('rfq.budget <= :budget_max', { 
      budget_max: parseFloat(filters.budget_max) 
    });
  }

  // ─── Sort ───────────────────────────────────────────────
  switch (filters.sort) {
    case 'oldest':
      query.orderBy('rfq.createdAt', 'ASC');
      break;
    case 'deadline':
      query.orderBy('rfq.deliveryDate', 'ASC');
      break;
    case 'newest':
    default:
      query.orderBy('rfq.createdAt', 'DESC');
      break;
  }

  // ─── Pagination ─────────────────────────────────────────
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  query.skip(offset).take(limit);

  const [rfqs, total] = await query.getManyAndCount();

  return {
    rfqs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  };
};
export const getRFQById = async (id) => {
  return await rfqRepo().findOne({ where: { id } });
};

export const getRFQsByBuyer = async (buyerId) => {
  return await rfqRepo().find({
    where: { buyerId },
    order: { createdAt: 'DESC' },
  });
};

// ─── Quote ─────────────────────────────────────────

export const createQuote = async (quoteData) => {
  // تحقق إن الفارمر ما بعت quote قبل لنفس الـ RFQ
  const existing = await quoteRepo().findOne({
    where: {
      rfqId: quoteData.rfqId,
      farmerId: quoteData.farmerId,
    },
  });

  if (existing) {
    throw new Error('You already submitted a quote for this RFQ');
  }

  const quote = quoteRepo().create(quoteData);
  return await quoteRepo().save(quote);
};

export const getQuotesByRFQ = async (rfqId) => {
  return await quoteRepo().find({
    where: { rfqId },
    order: { createdAt: 'DESC' },
  });
};

export const getQuoteById = async (id) => {
  return await quoteRepo().findOne({ where: { id } });
};

export const updateQuoteStatus = async (id, updates) => {
  const repo = quoteRepo();
  await repo.update(id, updates);
  return await repo.findOne({ where: { id } });
};

export const closeRFQ = async (id) => {
  const repo = rfqRepo();
  await repo.update(id, { status: 'closed' });
  return await repo.findOne({ where: { id } });
};