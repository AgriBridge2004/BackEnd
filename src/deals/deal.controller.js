import {
  createDeal,
  getDealById,
  getDealsByUser,
  updateDeal,
  generateContract,
  signContract,
  generateContractPDF,
} from './deal.service.js';
import { getBuyerByUserId } from '../buyer/buyer.service.js';
import { getFarmerByUserId } from '../farmer/farmer.service.js';
import { getRFQById } from '../rfq/rfq.service.js';
import { getListingById } from '../listings/listing.service.js';

// POST /deals — إنشاء Deal جديد
export const createDealController = async (req, res) => {
  try {
    const { source, rfqId, listingId, price, quantity, deliveryDate, notes } = req.body;

    if (!source || !['rfq', 'listing'].includes(source)) {
      return res.status(400).json({ message: 'source must be rfq or listing' });
    }

    const buyer = await getBuyerByUserId(req.user.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer profile not found' });
    }

    let farmerId, productType, location;

    if (source === 'rfq') {
      if (!rfqId) return res.status(400).json({ message: 'rfqId is required for rfq source' });

      const rfq = await getRFQById(rfqId);
      if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
      if (rfq.status !== 'closed') return res.status(400).json({ message: 'RFQ must be closed (accepted) to create a deal' });

      productType = rfq.productType;
      location = rfq.location;
      farmerId = req.body.farmerId;

    } else if (source === 'listing') {
      if (!listingId) return res.status(400).json({ message: 'listingId is required for listing source' });

      const listing = await getListingById(listingId);
      if (!listing) return res.status(404).json({ message: 'Listing not found' });

      productType = listing.name;
      location = listing.location;
      farmerId = listing.farmerId;
    }

    if (!farmerId) return res.status(400).json({ message: 'farmerId is required' });
    if (!price || price <= 0) return res.status(400).json({ message: 'Valid price is required' });
    if (!quantity || quantity <= 0) return res.status(400).json({ message: 'Valid quantity is required' });

    const deal = await createDeal({
      source,
      rfqId: rfqId || null,
      listingId: listingId || null,
      buyerId: buyer.id,
      farmerId,
      productType,
      quantity,
      price,
      location,
      deliveryDate: deliveryDate || null,
      notes: notes || null,
    });

    const contract = generateContract(deal);
    const updatedDeal = await updateDeal(deal.id, { contract });

    return res.status(201).json({
      message: 'Deal created successfully',
      deal: updatedDeal,
    });

  } catch (error) {
    console.error('CREATE DEAL ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /deals/my — كل الـ Deals تبع المستخدم
export const getMyDealsController = async (req, res) => {
  try {
    const role = req.user.role;
    let userId;

    if (role === 'buyer') {
      const buyer = await getBuyerByUserId(req.user.id);
      if (!buyer) return res.status(404).json({ message: 'Buyer profile not found' });
      userId = buyer.id;
    } else if (role === 'farmer') {
      const farmer = await getFarmerByUserId(req.user.id);
      if (!farmer) return res.status(404).json({ message: 'Farmer profile not found' });
      userId = farmer.id;
    }

    const deals = await getDealsByUser(userId, role);
    return res.status(200).json({ deals });

  } catch (error) {
    console.error('GET MY DEALS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /deals/:id — تفاصيل Deal
export const getDealController = async (req, res) => {
  try {
    const deal = await getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    return res.status(200).json({ deal });

  } catch (error) {
    console.error('GET DEAL ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /deals/:id/contract/sign — توقيع العقد
export const signContractController = async (req, res) => {
  try {
    const role = req.user.role;

    if (!['buyer', 'farmer'].includes(role)) {
      return res.status(403).json({ message: 'Only buyer or farmer can sign' });
    }

    const deal = await getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    const buyer = role === 'buyer' ? await getBuyerByUserId(req.user.id) : null;
    const farmer = role === 'farmer' ? await getFarmerByUserId(req.user.id) : null;

    if (role === 'buyer' && deal.buyerId !== buyer?.id) {
      return res.status(403).json({ message: 'You are not the buyer of this deal' });
    }
    if (role === 'farmer' && deal.farmerId !== farmer?.id) {
      return res.status(403).json({ message: 'You are not the farmer of this deal' });
    }

    const updatedDeal = await signContract(deal.id, role);
    const bothSigned = updatedDeal.contract?.status === 'locked';

    return res.status(200).json({
      message: bothSigned
        ? 'Contract signed and locked! Deal is now active.'
        : `Contract signed by ${role}. Waiting for the other party.`,
      deal: updatedDeal,
    });

  } catch (error) {
    console.error('SIGN CONTRACT ERROR:', error);
    if (error.message === 'Deal not found') return res.status(404).json({ message: error.message });
    if (error.message === 'Contract not generated yet') return res.status(400).json({ message: error.message });
    if (error.message === 'Contract already locked') return res.status(409).json({ message: error.message });
    if (error.message === 'Buyer already signed') return res.status(409).json({ message: error.message });
    if (error.message === 'Farmer already signed') return res.status(409).json({ message: error.message });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /deals/:id/contract/pdf — تحميل العقد كـ PDF
export const getContractPDFController = async (req, res) => {
  try {
    const deal = await getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    if (!deal.contract) {
      return res.status(400).json({ message: 'Contract not generated yet' });
    }

    const pdfBuffer = await generateContractPDF(deal);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=contract-${deal.id}.pdf`
    );

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('GET CONTRACT PDF ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};