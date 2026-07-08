// src/inspections/inspection.service.js

import { AppDataSource } from '../config/database.js';
import { InspectionEntity } from './inspection.entity.js';
import { InspectionPhotoEntity } from './inspection-photo.entity.js';
import { createNotification } from '../notifications/notification.service.js';
import { getQOById } from '../QO/QO.service.js';

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

    const saved = await repo.save(inspection);

    // ✅ إشعار QO بالتكليف الجديد
    try {
      const qo = await getQOById(assignData.qoId);
      if (qo?.userId) {
        await createNotification({
          userId: qo.userId,
          type: 'inspection_assigned',
          title: 'تكليف تفتيش جديد',
          body: `تم تكليفك بتفتيش في ${assignData.inspectionLocation} بتاريخ ${assignData.requiredDate}`,
          link: `/inspection/inspections/${saved.id}`,
        });
      }
    } catch (notifyError) {
      // ✅ فشل الإشعار ما لازم يوقف عملية التعيين نفسها
      console.error('FAILED TO NOTIFY QO ON ASSIGNMENT:', notifyError.message);
    }

    return saved;
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

    // ✅ لازم نجيب علاقة الصفقة عشان نعرف مين المزارع والمشتري لاحقًا
    const inspection = await repo.findOne({
      where: { id: inspectionId },
      relations: ['deal'],
    });

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

    // ✅ إشعار الطرفين (المزارع والمشتري) بجاهزية التقرير
    try {
      await notifyReportSubmitted(saved);
    } catch (notifyError) {
      // ✅ فشل الإشعار ما لازم يوقف عملية حفظ التقرير نفسها
      console.error('FAILED TO NOTIFY PARTIES ON REPORT SUBMISSION:', notifyError.message);
    }

    return await getInspectionById(saved.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to submit report: ${message}`);
  }
};

// ─────────────────────────────────────────
// Helper: إرسال إشعار للمزارع والمشتري بعد تقديم التقرير
// ⚠️ افتراضي مؤقتًا: بيعتمد على شكل علاقة Deal.farmer / Deal.buyer
// لازم تأكيد شكل Deal.entity.js لضبطها بدقة
// ─────────────────────────────────────────
const notifyReportSubmitted = async (savedInspection) => {
  const outcomeLabels = {
    approved: 'تمت الموافقة',
    partially_approved: 'موافقة جزئية',
    rejected: 'مرفوض',
  };
  const outcomeText = outcomeLabels[savedInspection.outcome] || savedInspection.outcome;

  const deal = savedInspection.deal;
  if (!deal) return;

  const notifyTargets = [];
  if (deal.farmer?.userId) notifyTargets.push(deal.farmer.userId);
  if (deal.buyer?.userId) notifyTargets.push(deal.buyer.userId);

  for (const targetUserId of notifyTargets) {
    await createNotification({
      userId: targetUserId,
      type: 'inspection_report_submitted',
      title: 'تقرير التفتيش جاهز',
      body: `تم تقديم تقرير التفتيش لصفقتك. النتيجة: ${outcomeText}`,
      link: `/deals/${savedInspection.dealId}`,
    });
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