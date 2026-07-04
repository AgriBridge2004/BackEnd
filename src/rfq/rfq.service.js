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

export const getAllRFQs = async () => {
  return await rfqRepo().find({
    where: { status: 'open' },
    order: { createdAt: 'DESC' },
  });
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