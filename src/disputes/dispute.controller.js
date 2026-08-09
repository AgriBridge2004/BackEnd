import {
  createDispute,
  getDisputeById,
  getAllDisputes,
  getDisputeByDeal,
  addEvidence,
  getEvidenceByDispute,
  resolveDispute,
  getDisputesByUser,
  getDisputesWithFilters,
  getEvidenceById,
  getDisputeStats,
} from './dispute.service.js';
import { getDealById, updateDeal } from '../deals/deal.service.js';
import { getBuyerByUserId } from '../buyer/buyer.service.js';
import { getFarmerByUserId } from '../farmer/farmer.service.js';
import { uploadToCloudinary } from '../middleware/upload.middleware.js';

/**
 * التحقق من أن المستخدم طرف في الصفقة
 */
const checkUserIsPartyInDeal = async (userId, dealId, role) => {
  const deal = await getDealById(dealId);
  if (!deal) return false;

  if (role === 'buyer') {
    const buyer = await getBuyerByUserId(userId);
    return buyer && deal.buyerId === buyer.id;
  } else if (role === 'farmer') {
    const farmer = await getFarmerByUserId(userId);
    return farmer && deal.farmerId === farmer.id;
  }
  return false;
};

// ============================================================
// POST /disputes — فتح Dispute
// ============================================================
export const createDisputeController = async (req, res) => {
  try {
    const { dealId, reason } = req.body;

    if (!dealId || !reason) {
      return res.status(400).json({ message: 'dealId and reason are required' });
    }

    const deal = await getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    if (deal.status === 'completed' || deal.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot open dispute on a completed or cancelled deal' });
    }

    // تأكيد إن المستخدم طرف بالـ Deal
    const isParty = await checkUserIsPartyInDeal(req.user.id, dealId, req.user.role);
    if (!isParty) {
      return res.status(403).json({ message: 'You are not part of this deal' });
    }

    const dispute = await createDispute({
      dealId,
      raisedBy: req.user.id,
      reason,
    });

    // تجميد الـ Deal
    await updateDeal(dealId, { status: 'disputed' });

    // إشعار عبر Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`deal_${dealId}`).emit('dispute_opened', {
        disputeId: dispute.id,
        message: 'A dispute has been opened for this deal',
      });
    }

    return res.status(201).json({
      message: 'Dispute opened successfully. Deal is now frozen.',
      dispute,
    });

  } catch (error) {
    console.error('CREATE DISPUTE ERROR:', error);
    if (error.message === 'There is already an open dispute for this deal') {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// POST /disputes/:id/evidence — إضافة Evidence
// ============================================================
export const addEvidenceController = async (req, res) => {
  try {
    const dispute = await getDisputeById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (dispute.status === 'resolved') {
      return res.status(400).json({ message: 'Cannot add evidence to a resolved dispute' });
    }

    // التحقق من أن المستخدم طرف في النزاع أو مدير
    if (req.user.role !== 'admin') {
      const isParty = await checkUserIsPartyInDeal(req.user.id, dispute.dealId, req.user.role);
      if (!isParty && dispute.raisedBy !== req.user.id) {
        return res.status(403).json({ message: 'You are not authorized to add evidence to this dispute' });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one file is required' });
    }

    const { description } = req.body;

    const uploadedFiles = await Promise.all(
      req.files.map(async (file) => {
        const url = await uploadToCloudinary(file.buffer, 'agribridge/disputes');
        return await addEvidence({
          disputeId: dispute.id,
          uploadedBy: req.user.id,
          fileUrl: url,
          fileType: file.mimetype,
          description: description || null,
        });
      })
    );

    // إشعار عبر Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`deal_${dispute.dealId}`).emit('evidence_added', {
        disputeId: dispute.id,
        evidenceCount: uploadedFiles.length,
        message: 'New evidence has been added to the dispute',
      });
    }

    return res.status(201).json({
      message: 'Evidence added successfully',
      evidence: uploadedFiles,
    });

  } catch (error) {
    console.error('ADD EVIDENCE ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// GET /disputes — كل الـ Disputes (Admin مع فلترة)
// ============================================================
export const getAllDisputesController = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const result = await getDisputesWithFilters({
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('GET ALL DISPUTES ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// GET /disputes/my — نزاعات المستخدم الحالي
// ============================================================
export const getMyDisputesController = async (req, res) => {
  try {
    const disputes = await getDisputesByUser(req.user.id);

    return res.status(200).json({
      count: disputes.length,
      disputes,
    });

  } catch (error) {
    console.error('GET MY DISPUTES ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// GET /disputes/deal/:dealId — نزاع صفقة معينة
// ============================================================
export const getDisputeByDealController = async (req, res) => {
  try {
    const { dealId } = req.params;

    if (!dealId) {
      return res.status(400).json({ message: 'dealId is required' });
    }

    const deal = await getDealById(dealId);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // التحقق من الصلاحية: المستخدم يجب أن يكون طرف في الصفقة أو مدير
    if (req.user.role !== 'admin') {
      const isParty = await checkUserIsPartyInDeal(req.user.id, dealId, req.user.role);
      if (!isParty) {
        return res.status(403).json({ message: 'You are not authorized to view this deal\'s dispute' });
      }
    }

    const dispute = await getDisputeByDeal(dealId);
    if (!dispute) {
      return res.status(404).json({ message: 'No dispute found for this deal' });
    }

    const evidence = await getEvidenceByDispute(dispute.id);

    return res.status(200).json({ dispute, evidence });

  } catch (error) {
    console.error('GET DISPUTE BY DEAL ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// GET /disputes/:id — تفاصيل Dispute + Evidence
// ============================================================
export const getDisputeController = async (req, res) => {
  try {
    const dispute = await getDisputeById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // التحقق من الصلاحية
    if (req.user.role !== 'admin') {
      const isParty = await checkUserIsPartyInDeal(req.user.id, dispute.dealId, req.user.role);
      if (!isParty && dispute.raisedBy !== req.user.id) {
        return res.status(403).json({ message: 'You are not authorized to view this dispute' });
      }
    }

    const evidence = await getEvidenceByDispute(dispute.id);

    return res.status(200).json({ dispute, evidence });

  } catch (error) {
    console.error('GET DISPUTE ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// GET /disputes/evidence/:id — جلب دليل معين
// ============================================================
export const getEvidenceByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const evidence = await getEvidenceById(id);

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    // التحقق من الصلاحية
    if (req.user.role !== 'admin') {
      const dispute = await getDisputeById(evidence.disputeId);
      const isParty = await checkUserIsPartyInDeal(req.user.id, dispute.dealId, req.user.role);
      if (!isParty && dispute.raisedBy !== req.user.id) {
        return res.status(403).json({ message: 'You are not authorized to view this evidence' });
      }
    }

    return res.status(200).json({ evidence });

  } catch (error) {
    console.error('GET EVIDENCE BY ID ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// POST /disputes/:id/resolve — حل الـ Dispute (Admin)
// ============================================================
export const resolveDisputeController = async (req, res) => {
  try {
    const { resolution, resolutionNote } = req.body;

    if (!resolution || !['full_release', 'partial', 'refund'].includes(resolution)) {
      return res.status(400).json({ message: 'resolution must be full_release, partial, or refund' });
    }

    const dispute = await getDisputeById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    const resolved = await resolveDispute(
      dispute.id,
      resolution,
      resolutionNote,
      req.user.id
    );

    // تحديث status الـ Deal حسب الحل
    let dealStatus = 'completed';
    if (resolution === 'refund') dealStatus = 'cancelled';

    await updateDeal(dispute.dealId, { status: dealStatus });

    // إشعار عبر Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`deal_${dispute.dealId}`).emit('dispute_resolved', {
        resolution,
        resolutionNote,
        message: `Dispute resolved: ${resolution}`,
      });
    }

    return res.status(200).json({
      message: 'Dispute resolved successfully',
      dispute: resolved,
    });

  } catch (error) {
    console.error('RESOLVE DISPUTE ERROR:', error);
    if (error.message === 'Dispute already resolved') {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// GET /disputes/stats — إحصائيات النزاعات (Admin)
// ============================================================
export const getDisputeStatsController = async (req, res) => {
  try {
    const stats = await getDisputeStats();

    return res.status(200).json(stats);

  } catch (error) {
    console.error('GET DISPUTE STATS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};