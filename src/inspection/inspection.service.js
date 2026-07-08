// src/inspections/inspection.service.js

import { AppDataSource } from '../config/database.js';
import { InspectionEntity } from './inspection.entity.js';
import { InspectionPhotoEntity } from './inspection-photo.entity.js';

const inspectionRepo = () => AppDataSource.getRepository(InspectionEntity);
const photoRepo = () => AppDataSource.getRepository(InspectionPhotoEntity);

// ─────────────────────────────────────────
// 1. الأدمن يعيّن QO على صفقة (US-37)
// ─────────────────────────────────────────
export const assignInspection = async (assignData) => {
  try {
    const repo = inspectionRepo();

    const existing = await repo.findOne({
      where: { dealId: assignData.dealId, status: 'assigned' },
    });

    if (existing) {
      throw new Error('يوجد تفتيش مُعيَّن مسبقًا لهذه الصفقة');
    }

    const inspection = repo.create({
      dealId: assignData.dealId,
      qoId: assignData.qoId,
      inspectionLocation: assignData.inspectionLocation,
      requiredDate: assignData.requiredDate,
      status: 'assigned',
    });

    return await repo.save(inspection);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to assign inspection: ${message}`);
  }
};

// ─────────────────────────────────────────
// 2. QO يقبل أو يرفض التكليف (R3.02)
// ─────────────────────────────────────────
export const respondToAssignment = async (inspectionId, qoId, accept) => {
  try {
    const repo = inspectionRepo();

    const inspection = await repo.findOne({ where: { id: inspectionId } });

    if (!inspection) {
      throw new Error('التفتيش غير موجود');
    }

    if (inspection.qoId !== qoId) {
      throw new Error('هذا التفتيش غير مخصص لك');
    }

    if (inspection.status !== 'assigned') {
      throw new Error('لا يمكن تعديل حالة هذا التفتيش');
    }

    inspection.status = accept ? 'accepted' : 'declined';
    return await repo.save(inspection);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to respond to assignment: ${message}`);
  }
};

// ─────────────────────────────────────────
// 3. QO يقدّم تقرير التفتيش (US-38)
// ─────────────────────────────────────────
export const submitReport = async (inspectionId, qoId, reportData) => {
  try {
    const repo = inspectionRepo();

    const inspection = await repo.findOne({ where: { id: inspectionId } });

    if (!inspection) {
      throw new Error('التفتيش غير موجود');
    }

    if (inspection.qoId !== qoId) {
      throw new Error('هذا التفتيش غير مخصص لك');
    }

    if (inspection.status !== 'accepted') {
      throw new Error('يجب قبول التكليف قبل تقديم التقرير');
    }

    if (!reportData.photoUrls || reportData.photoUrls.length < 5) {
      throw new Error('التقرير يتطلب 5 صور على الأقل');
    }

    inspection.inspectionDate = reportData.inspectionDate;
    inspection.verifiedQuantity = reportData.verifiedQuantity;
    inspection.qualityGrade = reportData.qualityGrade;
    inspection.summary = reportData.summary;
    inspection.outcome = reportData.outcome;
    inspection.status = 'submitted';
    inspection.submittedAt = new Date();

    const saved = await repo.save(inspection);

    const photos = reportData.photoUrls.map((url) =>
      photoRepo().create({
        inspectionId: saved.id,
        photoUrl: url,
      }),
    );
    await photoRepo().save(photos);

    return await getInspectionById(saved.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to submit report: ${message}`);
  }
};

// ─────────────────────────────────────────
// دوال قراءة (Read)
// ─────────────────────────────────────────
export const getInspectionById = async (id) => {
  try {
    return await inspectionRepo().findOne({
      where: { id },
      relations: ['photos', 'deal', 'qo'],
    });
  } catch (error) {
    throw new Error(`Failed to get inspection: ${error.message}`);
  }
};

export const getInspectionsByDeal = async (dealId) => {
  try {
    return await inspectionRepo().find({
      where: { dealId },
      relations: ['photos'],
      order: { createdAt: 'DESC' },
    });
  } catch (error) {
    throw new Error(`Failed to get inspections by deal: ${error.message}`);
  }
};

export const getInspectionsByQo = async (qoId) => {
  try {
    return await inspectionRepo().find({
      where: { qoId },
      relations: ['deal'],
      order: { createdAt: 'DESC' },
    });
  } catch (error) {
    throw new Error(`Failed to get inspections by QO: ${error.message}`);
  }
};

export const getAllInspections = async () => {
  try {
    return await inspectionRepo().find({ relations: ['photos', 'deal', 'qo'] });
  } catch (error) {
    throw new Error(`Failed to get inspections: ${error.message}`);
  }
};