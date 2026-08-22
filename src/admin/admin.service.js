import { AppDataSource } from '../config/database.js';
import { UserEntity } from '../users/user.entity.js';
import { DealEntity } from '../deals/deal.entity.js';
import { DisputeEntity } from '../disputes/dispute.entity.js';
import { InspectionEntity } from '../inspection/inspection.entity.js';
import { FarmerEntity } from '../farmer/farmer.entity.js';
import { BuyerEntity } from '../buyer/buyer.entity.js';

const userRepo = () => AppDataSource.getRepository(UserEntity);
const dealRepo = () => AppDataSource.getRepository(DealEntity);
const disputeRepo = () => AppDataSource.getRepository(DisputeEntity);
const inspectionRepo = () => AppDataSource.getRepository(InspectionEntity);
const farmerRepo = () => AppDataSource.getRepository(FarmerEntity);
const buyerRepo = () => AppDataSource.getRepository(BuyerEntity);

// ⚠️ Module 7 (Escrow Payment) لسا مش موجود بالمشروع بهاي المرحلة.
// نسبة العمولة هون قيمة مؤقتة (placeholder) هاردكودد جوا الكود،
// لازم تتحدث/تنقل لمكان مركزي (config أو DB) لما موديول 7 يتعمل.
const PLATFORM_COMMISSION_RATE = 0.05; // 5%
// ============================================================
// Helper: التحقق من صحة صيغة UUID قبل الاستعلام من الداتابيز
// ============================================================
const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof id === 'string' && uuidRegex.test(id);
};
// ============================================================
// Helpers: Period ranges + % change
// ============================================================

const getPeriodRanges = (period = 'week') => {
  const now = new Date();
  const currentEnd = now;
  let currentStart;
  let previousStart;
  let previousEnd;

  if (period === 'month') {
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 30);

    previousEnd = new Date(currentStart);
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 30);
  } else {
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 7);

    previousEnd = new Date(currentStart);
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
  }

  return { currentStart, currentEnd, previousStart, previousEnd };
};

const calculatePercentChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 10) / 10;
};

// ============================================================
// US-43: Platform Overview Dashboard
// ============================================================
export const getPlatformStats = async (period = 'week') => {
  const { currentStart, currentEnd, previousStart, previousEnd } = getPeriodRanges(period);

  const [totalUsers, activeUsers, suspendedUsers, pendingVerifications] = await Promise.all([
    userRepo().count(),
    userRepo().count({ where: { isSuspended: false } }),
    userRepo().count({ where: { isSuspended: true } }),
    userRepo().count({ where: { isVerified: false } }),
  ]);

  const roleRows = await userRepo()
    .createQueryBuilder('user')
    .select('user.role', 'role')
    .addSelect('COUNT(*)', 'count')
    .groupBy('user.role')
    .getRawMany();

  const usersByRole = roleRows.map((row) => ({
    role: row.role,
    count: Number(row.count),
    percentage: totalUsers > 0 ? Math.round((Number(row.count) / totalUsers) * 1000) / 10 : 0,
  }));

  const [activeDeals, completedDeals, pendingDeals] = await Promise.all([
    dealRepo().count({ where: [{ status: 'confirmed' }, { status: 'active' }] }),
    dealRepo().count({ where: { status: 'completed' } }),
    dealRepo().count({ where: { status: 'pending' } }),
  ]);

  const dealsPendingInspectionRaw = await inspectionRepo()
    .createQueryBuilder('inspection')
    .select('DISTINCT inspection.dealId', 'dealId')
    .where('inspection.status IN (:...statuses)', { statuses: ['assigned', 'accepted'] })
    .getRawMany();
  const dealsPendingInspection = dealsPendingInspectionRaw.length;

  const openDisputes = await disputeRepo().count({ where: { status: 'open' } });

  const currentCompletedDeals = await dealRepo().find({
    where: { status: 'completed' },
    select: ['price', 'quantity', 'updatedAt'],
  });

  const currentPeriodDeals = currentCompletedDeals.filter(
    (deal) => deal.updatedAt >= currentStart && deal.updatedAt <= currentEnd
  );
  const previousPeriodDeals = currentCompletedDeals.filter(
    (deal) => deal.updatedAt >= previousStart && deal.updatedAt < previousEnd
  );

  const sumVolume = (deals) =>
    deals.reduce((sum, d) => sum + (Number(d.price) || 0) * (Number(d.quantity) || 0), 0);

  const currentVolume = sumVolume(currentPeriodDeals);
  const previousVolume = sumVolume(previousPeriodDeals);
  const totalGrossVolume = sumVolume(currentCompletedDeals);

  const [activeUsersPrev, activeDealsPrev, dealsPendingInspectionPrevRaw, openDisputesPrev] =
    await Promise.all([
      userRepo()
        .createQueryBuilder('user')
        .where('user.isSuspended = false')
        .andWhere('user.createdAt <= :date', { date: previousEnd })
        .getCount(),
      dealRepo()
        .createQueryBuilder('deal')
        .where('deal.status IN (:...statuses)', { statuses: ['confirmed', 'active'] })
        .andWhere('deal.createdAt <= :date', { date: previousEnd })
        .getCount(),
      inspectionRepo()
        .createQueryBuilder('inspection')
        .select('DISTINCT inspection.dealId', 'dealId')
        .where('inspection.status IN (:...statuses)', { statuses: ['assigned', 'accepted'] })
        .andWhere('inspection.createdAt <= :date', { date: previousEnd })
        .getRawMany(),
      disputeRepo()
        .createQueryBuilder('dispute')
        .where('dispute.status = :status', { status: 'open' })
        .andWhere('dispute.createdAt <= :date', { date: previousEnd })
        .getCount(),
    ]);

  return {
    period,
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      pendingVerifications,
      byRole: usersByRole,
      changeVsPreviousPeriod: calculatePercentChange(activeUsers, activeUsersPrev),
    },
    deals: {
      active: activeDeals,
      completed: completedDeals,
      pending: pendingDeals,
      pendingInspection: dealsPendingInspection,
      changeVsPreviousPeriod: calculatePercentChange(activeDeals, activeDealsPrev),
      pendingInspectionChangeVsPreviousPeriod: calculatePercentChange(
        dealsPendingInspection,
        dealsPendingInspectionPrevRaw.length
      ),
    },
    disputes: {
      open: openDisputes,
      changeVsPreviousPeriod: calculatePercentChange(openDisputes, openDisputesPrev),
    },
    revenue: {
      grossVolume: totalGrossVolume,
      commissionEarned: totalGrossVolume * PLATFORM_COMMISSION_RATE,
      currentPeriod: {
        grossVolume: currentVolume,
        commissionEarned: currentVolume * PLATFORM_COMMISSION_RATE,
        changeVsPreviousPeriod: calculatePercentChange(currentVolume, previousVolume),
      },
    },
  };
};

// ============================================================
// Deal Growth Over Time (weekly time-series for the chart)
// ============================================================
export const getDealGrowthOverTime = async (weeks = 6) => {
  const now = new Date();
  const buckets = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const count = await dealRepo()
      .createQueryBuilder('deal')
      .where('deal.createdAt >= :start', { start: weekStart })
      .andWhere('deal.createdAt < :end', { end: weekEnd })
      .andWhere('deal.status IN (:...statuses)', {
        statuses: ['confirmed', 'active', 'completed'],
      })
      .getCount();

    buckets.push({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      dealCount: count,
    });
  }

  return buckets;
};

// ============================================================
// Recent Open Disputes (for "Action Required" panel)
// ⚠️ DealEntity ما فيها relations لـ Farmer/Buyer، فلازم إثراء يدوي
// بنفس الطريقة يلي اتحددت لباگ notifyReportSubmitted بموديول 8.
// ============================================================
export const getRecentOpenDisputes = async (limit = 5) => {
  const disputes = await disputeRepo().find({
    where: { status: 'open' },
    relations: ['deal'],
    order: { createdAt: 'DESC' },
    take: limit,
  });

  const enriched = await Promise.all(
    disputes.map(async (dispute) => {
      let farmerName = null;
      let buyerName = null;

      if (dispute.deal) {
        const [farmer, buyer] = await Promise.all([
          farmerRepo().findOne({ where: { id: dispute.deal.farmerId } }),
          buyerRepo().findOne({ where: { id: dispute.deal.buyerId } }),
        ]);
        farmerName = farmer?.farmName || farmer?.fullName || null;
        buyerName = buyer?.companyName || buyer?.fullName || null;
      }

      return {
        id: dispute.id,
        dealId: dispute.dealId,
        reason: dispute.reason,
        createdAt: dispute.createdAt,
        farmerName,
        buyerName,
      };
    })
  );

  return enriched;
};

// ============================================================
// US-44: Manage Users (Search / Filter / Suspend / Verify / Delete)
// ============================================================
export const getAllUsers = async (filters = {}) => {
  const { role, isSuspended, email, limit = 20, offset = 0 } = filters;

  const query = userRepo().createQueryBuilder('user');

  if (role) {
    query.andWhere('user.role = :role', { role });
  }

  if (isSuspended !== undefined) {
    query.andWhere('user.isSuspended = :isSuspended', { isSuspended });
  }

  if (email) {
    query.andWhere('user.email ILIKE :email', { email: `%${email}%` });
  }

  query
    .orderBy('user.createdAt', 'DESC')
    .skip(Number(offset))
    .take(Number(limit));

  const [users, total] = await query.getManyAndCount();

  const sanitizedUsers = users.map(({ password, otp, refreshToken, resetPasswordToken, ...rest }) => rest);

  return { users: sanitizedUsers, total };
};

export const getUserById = async (id) => {
  if (!isValidUUID(id)) {
    throw new Error('Invalid user ID format');
  }
  const user = await userRepo().findOne({ where: { id } });
  if (!user) {
    throw new Error('User not found');
  }
  const { password, otp, refreshToken, resetPasswordToken, ...rest } = user;
  return rest;
};

export const updateUserStatus = async (id, isSuspended, requestingAdminId) => {
  if (!isValidUUID(id)) {
    throw new Error('Invalid user ID format');
  }

  if (id === requestingAdminId) {
    throw new Error('Admins cannot suspend their own account');
  }

  const user = await userRepo().findOne({ where: { id } });
  if (!user) {
    throw new Error('User not found');
  }

  await userRepo().update(id, { isSuspended });

  const updatedUser = await userRepo().findOne({ where: { id } });
  const { password, otp, refreshToken, resetPasswordToken, ...rest } = updatedUser;
  return rest;
};

export const verifyUserByAdmin = async (id) => {
  if (!isValidUUID(id)) {
    throw new Error('Invalid user ID format');
  }
  const user = await userRepo().findOne({ where: { id } });
  if (!user) {
    throw new Error('User not found');
  }

  await userRepo().update(id, { isVerified: true });

  const updatedUser = await userRepo().findOne({ where: { id } });
  const { password, otp, refreshToken, resetPasswordToken, ...rest } = updatedUser;
  return rest;
};

export const deleteUserByAdmin = async (id, requestingAdminId) => {
  if (!isValidUUID(id)) {
    throw new Error('Invalid user ID format');
  }

  if (id === requestingAdminId) {
    throw new Error('Admins cannot delete their own account');
  }

  const user = await userRepo().findOne({ where: { id } });
  if (!user) {
    throw new Error('User not found');
  }

  await userRepo().remove(user);
  return { message: 'User deleted successfully' };
};

// ============================================================
// US-45: Revenue Reports and Financial Overview
// ⚠️ مبني على Deal.price × Deal.quantity فقط لأنه موديول 7 (Escrow)
// لسا مش موجود بهاي المرحلة.
// ============================================================
export const getRevenueReport = async (filters = {}) => {
  const { startDate, endDate } = filters;

  const query = dealRepo()
    .createQueryBuilder('deal')
    .where('deal.status = :status', { status: 'completed' });

  if (startDate) {
    query.andWhere('deal.updatedAt >= :startDate', { startDate });
  }

  if (endDate) {
    query.andWhere('deal.updatedAt <= :endDate', { endDate });
  }

  const deals = await query.getMany();

  const grossVolume = deals.reduce(
    (sum, deal) => sum + (Number(deal.price) || 0) * (Number(deal.quantity) || 0),
    0
  );

  const commissionEarned = grossVolume * PLATFORM_COMMISSION_RATE;

  return {
    dealCount: deals.length,
    grossVolume,
    commissionEarned,
    inspectionFees: 0,
    commissionRate: PLATFORM_COMMISSION_RATE,
  };
};