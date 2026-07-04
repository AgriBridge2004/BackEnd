import {
  createRFQ,
  getAllRFQs,
  getRFQById,
  getRFQsByBuyer,
  createQuote,
  getQuotesByRFQ,
  getQuoteById,
  updateQuoteStatus,
  closeRFQ,
} from './rfq.service.js';
import { getBuyerByUserId } from '../buyer/buyer.service.js';
import { getFarmerByUserId } from '../farmer/farmer.service.js';
import { sendOtpEmail } from '../config/mailer.js';
import { findUserById } from '../users/users.service.js';

// POST /rfqs — Buyer ينشر RFQ
export const createRFQController = async (req, res) => {
  try {
    const { productType, quantity, location, deliveryDate, budget, notes } = req.body;

    if (!productType || !quantity || !location) {
      return res.status(400).json({ message: 'productType, quantity and location are required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    const buyer = await getBuyerByUserId(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer profile not found' });
    }

    const rfq = await createRFQ({
      productType,
      quantity,
      location,
      deliveryDate: deliveryDate || null,
      budget: budget || null,
      notes: notes || null,
      buyerId: buyer.id,
    });

    return res.status(201).json({
      message: 'RFQ created successfully',
      rfq,
    });

  } catch (error) {
    console.error('CREATE RFQ ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /rfqs — كل المزارعين يشوفوا الـ RFQs المفتوحة
export const getAllRFQsController = async (req, res) => {
  try {
    const rfqs = await getAllRFQs();
    return res.status(200).json({ rfqs });
  } catch (error) {
    console.error('GET ALL RFQS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /rfqs/my — Buyer يشوف RFQs تبعه
export const getMyRFQsController = async (req, res) => {
  try {
    const buyer = await getBuyerByUserId(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer profile not found' });
    }

    const rfqs = await getRFQsByBuyer(buyer.id);
    return res.status(200).json({ rfqs });
  } catch (error) {
    console.error('GET MY RFQS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /rfqs/:id — تفاصيل RFQ + كل الـ quotes تبعه
export const getRFQController = async (req, res) => {
  try {
    const rfq = await getRFQById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    const quotes = await getQuotesByRFQ(rfq.id);

    return res.status(200).json({ rfq, quotes });
  } catch (error) {
    console.error('GET RFQ ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /rfqs/:id/quotes — Farmer يبعت Quote
export const createQuoteController = async (req, res) => {
  try {
    const { price, message } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }

    const rfq = await getRFQById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    if (rfq.status !== 'open') {
      return res.status(400).json({ message: 'This RFQ is no longer open' });
    }

    const farmer = await getFarmerByUserId(req.user.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    const quote = await createQuote({
      price,
      message: message || null,
      rfqId: rfq.id,
      farmerId: farmer.id,
    });

    // إيميل للـ Buyer (fire-and-forget)
    const buyerUser = await findUserById(rfq.buyerId);
    if (buyerUser) {
      sendOtpEmail(buyerUser.email, `New quote received for your RFQ: ${rfq.productType}`)
        .catch(err => console.error('Failed to send quote email:', err));
    }

    return res.status(201).json({
      message: 'Quote submitted successfully',
      quote,
    });

  } catch (error) {
    console.error('CREATE QUOTE ERROR:', error);
    if (error.message === 'You already submitted a quote for this RFQ') {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /rfqs/:id/quotes/:qid — Buyer يقبل/يرفض/Counter
export const updateQuoteController = async (req, res) => {
  try {
    const { action, counterPrice } = req.body;

    if (!['accept', 'reject', 'counter'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accept, reject, or counter' });
    }

    if (action === 'counter' && (!counterPrice || counterPrice <= 0)) {
      return res.status(400).json({ message: 'counterPrice is required for counter action' });
    }

    const quote = await getQuoteById(req.params.qid);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (quote.rfqId !== req.params.id) {
      return res.status(400).json({ message: 'Quote does not belong to this RFQ' });
    }

    let updates = {};
    let emailMessage = '';

    if (action === 'accept') {
      updates = { status: 'accepted' };
      emailMessage = `Your quote for RFQ has been accepted! Price: ${quote.price}`;
      // إغلاق الـ RFQ عن طريق الـ service
      await closeRFQ(req.params.id);
    } else if (action === 'reject') {
      updates = { status: 'rejected' };
      emailMessage = `Your quote for RFQ has been rejected.`;
    } else if (action === 'counter') {
      updates = { status: 'countered', counterPrice };
      emailMessage = `Buyer sent a counter offer: ${counterPrice}`;
    }

    const updatedQuote = await updateQuoteStatus(quote.id, updates);

    // إيميل للـ Farmer (fire-and-forget)
    const farmerUser = await findUserById(quote.farmerId);
    if (farmerUser) {
      sendOtpEmail(farmerUser.email, emailMessage)
        .catch(err => console.error('Failed to send notification email:', err));
    }

    return res.status(200).json({
      message: `Quote ${action}ed successfully`,
      quote: updatedQuote,
    });

  } catch (error) {
    console.error('UPDATE QUOTE ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};