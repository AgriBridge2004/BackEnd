import {
  assignInspection,
  respondToAssignment,
  submitReport,
  getInspectionById,
  getInspectionsByDeal,
  getInspectionsByQo,
  getAllInspections,
} from './inspection.service.js';

import { getQoByUserId } from '../QO/QO.service.js';
import { processMultipleUploadedImages } from '../middleware/upload.middleware.js'; // ✅ تغيير الـ import

// ✅ Helper: التحقق من صور التقرير قبل الرفع (5 صور على الأقل)
const validateReportPhotos = (files) => {
  const photos = files?.reportPhotos;

  if (!photos || photos.length < 5) {
    throw new Error('Inspection report requires at least 5 photos');
  }

  const allowedTypes = ['image/jpeg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  for (const photo of photos) {
    if (!allowedTypes.includes(photo.mimetype)) {
      throw new Error('All photos must be JPG or PNG only');
    }
    if (photo.size > maxSize) {
      throw new Error('Each photo must be less than 10MB');
    }
  }

  return photos;
};

// ─────────────────────────────────────────
// POST /inspections/assign
// الأدمن يعيّن QO على صفقة (US-37)
// ─────────────────────────────────────────
export const assignInspectionController = async (req, res) => {
  try {
    const { dealId, qoId, inspectionLocation, requiredDate } = req.body;

    if (!dealId || !qoId || !inspectionLocation || !requiredDate) {
      return res.status(400).json({
        message: 'dealId, qoId, inspectionLocation, requiredDate are required',
      });
    }

    const inspection = await assignInspection({
      dealId,
      qoId,
      inspectionLocation,
      requiredDate,
    });

    return res.status(201).json({
      message: 'Inspection assigned successfully',
      inspection,
    });

  } catch (error) {
    console.error('ASSIGN INSPECTION ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// PATCH /inspections/:id/respond
// QO يقبل أو يرفض التكليف (R3.02)
// body: { accept: true | false }
// ─────────────────────────────────────────
export const respondToAssignmentController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { accept } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    if (typeof accept !== 'boolean') {
      return res.status(400).json({ message: 'accept must be true or false' });
    }

    const qo = await getQoByUserId(userId);
    if (!qo) {
      return res.status(404).json({ message: 'Quality officer profile not found' });
    }

    const inspection = await respondToAssignment(id, qo.id, accept);

    return res.status(200).json({
      message: accept ? 'Assignment accepted' : 'Assignment declined',
      inspection,
    });

  } catch (error) {
    console.error('RESPOND TO ASSIGNMENT ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// POST /inspections/:id/report
// QO يقدّم تقرير التفتيش الكامل (US-38)
// ─────────────────────────────────────────
export const submitReportController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const qo = await getQoByUserId(userId);
    if (!qo) {
      return res.status(404).json({ message: 'Quality officer profile not found' });
    }

    const { inspectionDate, verifiedQuantity, qualityGrade, summary, outcome } = req.body;

    if (!inspectionDate || !verifiedQuantity || !qualityGrade || !outcome) {
      return res.status(400).json({
        message: 'inspectionDate, verifiedQuantity, qualityGrade, outcome are required',
      });
    }

    // ✅ التحقق من الصور قبل الرفع
    try {
      validateReportPhotos(req.files);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    // ✅ الحل: نستخدم الدالة الجديدة المخصصة للصور المتعددة
    const photoUrls = await processMultipleUploadedImages(
      req.files,
      'reportPhotos',
      'agribridge/inspections',
    );

    const inspection = await submitReport(id, qo.id, {
      inspectionDate,
      verifiedQuantity: parseFloat(verifiedQuantity),
      qualityGrade,
      summary: summary || null,
      outcome,
      photoUrls,
    });

    return res.status(200).json({
      message: 'Inspection report submitted successfully',
      inspection,
    });

  } catch (error) {
    console.error('SUBMIT REPORT ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET /inspections/:id
// جلب تفتيش واحد بالتفصيل
// ─────────────────────────────────────────
export const getInspectionController = async (req, res) => {
  try {
    const inspection = await getInspectionById(req.params.id);

    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    return res.status(200).json(inspection);

  } catch (error) {
    console.error('GET INSPECTION ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET /deals/:dealId/inspections
// كل التفتيشات المرتبطة بصفقة معيّنة
// ─────────────────────────────────────────
export const getInspectionsByDealController = async (req, res) => {
  try {
    const inspections = await getInspectionsByDeal(req.params.dealId);

    return res.status(200).json({
      message: 'Deal inspections retrieved successfully',
      count: inspections.length,
      inspections,
    });

  } catch (error) {
    console.error('GET DEAL INSPECTIONS ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET /inspections/mine
// كل التفتيشات المكلَّف فيها QO الحالي
// ─────────────────────────────────────────
export const getMyInspectionsController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const qo = await getQoByUserId(userId);
    if (!qo) {
      return res.status(404).json({ message: 'Quality officer profile not found' });
    }

    const inspections = await getInspectionsByQo(qo.id);

    return res.status(200).json({
      message: 'Your inspections retrieved successfully',
      count: inspections.length,
      inspections,
    });

  } catch (error) {
    console.error('GET MY INSPECTIONS ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET /inspections
// الأدمن بس - كل التفتيشات بالنظام
// ─────────────────────────────────────────
export const getAllInspectionsController = async (req, res) => {
  try {
    const inspections = await getAllInspections();

    return res.status(200).json({
      message: 'Inspections retrieved successfully',
      count: inspections.length,
      inspections,
    });

  } catch (error) {
    console.error('GET ALL INSPECTIONS ERROR:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};