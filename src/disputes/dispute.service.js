import { AppDataSource } from '../config/database.js';
import { DisputeEntity } from './dispute.entity.js';
import { DisputeEvidenceEntity } from './disputeEvidence.entity.js';

const disputeRepo = () => AppDataSource.getRepository(DisputeEntity);
const evidenceRepo = () => AppDataSource.getRepository(DisputeEvidenceEntity);

// ============================================================
// DISPUTE FUNCTIONS
// ============================================================

/**
 * إنشاء Dispute جديد
 * يتحقق من عدم وجود نزاع مفتوح على نفس الصفقة
 */
export const createDispute = async (data) => {
  const existing = await disputeRepo().findOne({
    where: { dealId: data.dealId, status: 'open' },
  });

  if (existing) {
    throw new Error('There is already an open dispute for this deal');
  }

  const dispute = disputeRepo().create(data);
  return await disputeRepo().save(dispute);
};

/**
 * جلب Dispute بالـ ID مع العلاقات
 */
export const getDisputeById = async (id) => {
  return await disputeRepo().findOne({
    where: { id },
    relations: ['deal'],
  });
};

/**
 * جلب Dispute بالـ ID بدون العلاقات (للاستخدام الداخلي)
 */
export const getDisputeByIdRaw = async (id) => {
  return await disputeRepo().findOne({ where: { id } });
};

/**
 * جلب كل الـ Disputes مع فلترة و Pagination (للـ Admin)
 */
export const getDisputesWithFilters = async (filters = {}) => {
  const { status, limit = 20, offset = 0 } = filters;

  const query = disputeRepo()
    .createQueryBuilder('dispute')
    .leftJoinAndSelect('dispute.deal', 'deal')
    .orderBy('dispute.createdAt', 'DESC')
    .skip(parseInt(offset))
    .take(parseInt(limit));

  if (status) {
    query.where('dispute.status = :status', { status });
  }

  const [disputes, total] = await query.getManyAndCount();

  return {
    disputes,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset),
    hasMore: offset + limit < total,
  };
};

/**
 * جلب كل الـ Disputes (للـ Admin) - بدون فلترة
 * @deprecated استخدم getDisputesWithFilters بدلاً من ذلك
 */
export const getAllDisputes = async () => {
  return await disputeRepo().find({
    relations: ['deal'],
    order: { createdAt: 'DESC' },
  });
};

/**
 * جلب Dispute تبع Deal معين
 */
export const getDisputeByDeal = async (dealId) => {
  return await disputeRepo().findOne({
    where: { dealId },
    relations: ['deal'],
  });
};

/**
 * جلب كل النزاعات التي رفعها مستخدم معين
 */
export const getDisputesByUser = async (userId) => {
  return await disputeRepo().find({
    where: { raisedBy: userId },
    relations: ['deal'],
    order: { createdAt: 'DESC' },
  });
};

/**
 * جلب عدد النزاعات المفتوحة
 */
export const getOpenDisputesCount = async () => {
  return await disputeRepo().count({
    where: { status: 'open' },
  });
};

/**
 * جلب النزاعات المفتوحة منذ أكثر من 48 ساعة (للتحديد التلقائي)
 */
export const getOpenDisputesOlderThan = async (hours = 48) => {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  return await disputeRepo()
    .createQueryBuilder('dispute')
    .where('dispute.status = :status', { status: 'open' })
    .andWhere('dispute.createdAt < :cutoff', { cutoff })
    .getMany();
};

// ============================================================
// EVIDENCE FUNCTIONS
// ============================================================

/**
 * إضافة Evidence للـ Dispute
 */
export const addEvidence = async (data) => {
  const evidence = evidenceRepo().create(data);
  return await evidenceRepo().save(evidence);
};

/**
 * جلب كل الـ Evidence تبع Dispute
 */
export const getEvidenceByDispute = async (disputeId) => {
  return await evidenceRepo().find({
    where: { disputeId },
    order: { createdAt: 'DESC' },
  });
};

/**
 * جلب Evidence بالـ ID
 */
export const getEvidenceById = async (id) => {
  return await evidenceRepo().findOne({
    where: { id },
    relations: ['dispute'],
  });
};

/**
 * جلب عدد الأدلة لنزاع معين
 */
export const getEvidenceCountByDispute = async (disputeId) => {
  return await evidenceRepo().count({
    where: { disputeId },
  });
};

/**
 * حذف Evidence (للـ Admin فقط)
 */
export const deleteEvidence = async (id) => {
  const evidence = await evidenceRepo().findOne({ where: { id } });
  if (!evidence) throw new Error('Evidence not found');

  await evidenceRepo().remove(evidence);
  return { message: 'Evidence deleted successfully' };
};

// ============================================================
// RESOLUTION FUNCTIONS
// ============================================================

/**
 * حل الـ Dispute (Admin فقط)
 */
export const resolveDispute = async (id, resolution, resolutionNote, resolvedBy) => {
  const dispute = await disputeRepo().findOne({ where: { id } });

  if (!dispute) throw new Error('Dispute not found');
  if (dispute.status === 'resolved') throw new Error('Dispute already resolved');

  await disputeRepo().update(id, {
    status: 'resolved',
    resolution,
    resolutionNote: resolutionNote || null,
    resolvedBy,
    resolvedAt: new Date(),
  });

  return await disputeRepo().findOne({ where: { id } });
};

/**
 * حل النزاعات تلقائياً بعد 48 ساعة (Cron Job)
 */
export const autoResolveDisputes = async () => {
  const openDisputes = await getOpenDisputesOlderThan(48);

  const results = [];
  for (const dispute of openDisputes) {
    try {
      // حل تلقائي: استرداد للمشتري (افتراضياً)
      const resolved = await resolveDispute(
        dispute.id,
        'refund',
        'Auto-resolved: No action taken within 48 hours',
        null // resolvedBy = system
      );

      // تحديث حالة الصفقة
      const { updateDeal } = await import('../deals/deal.service.js');
      await updateDeal(dispute.dealId, { status: 'cancelled' });

      results.push({
        disputeId: dispute.id,
        dealId: dispute.dealId,
        status: 'auto_resolved',
        resolution: 'refund',
      });

    } catch (error) {
      console.error(`Auto-resolve failed for dispute ${dispute.id}:`, error);
      results.push({
        disputeId: dispute.id,
        status: 'failed',
        error: error.message,
      });
    }
  }

  return results;
};

// ============================================================
// STATISTICS FUNCTIONS
// ============================================================

/**
 * إحصائيات النزاعات للمدير
 */
export const getDisputeStats = async () => {
  const total = await disputeRepo().count();
  const open = await disputeRepo().count({ where: { status: 'open' } });
  const resolved = await disputeRepo().count({ where: { status: 'resolved' } });

  const resolutionBreakdown = await disputeRepo()
    .createQueryBuilder('dispute')
    .select('dispute.resolution', 'resolution')
    .addSelect('COUNT(dispute.id)', 'count')
    .where('dispute.status = :status', { status: 'resolved' })
    .groupBy('dispute.resolution')
    .getRawMany();

  return {
    total,
    open,
    resolved,
    resolutionBreakdown: resolutionBreakdown.map((r) => ({
      resolution: r.resolution || 'unknown',
      count: parseInt(r.count),
    })),
  };
};