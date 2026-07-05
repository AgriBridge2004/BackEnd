import { AppDataSource } from "../config/database.js";
import { QualityOfficerEntity } from "./QO.entity.js";

const qoRepository = AppDataSource.getRepository(QualityOfficerEntity);

/**
 * إنشاء بروفايل QO جديد مرتبط بالـ userId
 */
export const createQOProfile = async (userId, data) => {
  const existing = await qoRepository.findOne({ where: { userId } });
  if (existing) {
    const error = new Error("Quality Officer profile already exists for this user");
    error.statusCode = 409;
    throw error;
  }

  const qo = qoRepository.create({
    userId,
    fullName: data.fullName,
    phone: data.phone,
    region: data.region,
  });

  return await qoRepository.save(qo);
};

/**
 * جلب بروفايل QO الخاص بالمستخدم الحالي
 */
export const getMyQOProfile = async (userId) => {
  const qo = await qoRepository.findOne({ where: { userId } });
  if (!qo) {
    const error = new Error("Quality Officer profile not found");
    error.statusCode = 404;
    throw error;
  }
  return qo;
};

/**
 * جلب بروفايل QO عن طريق ID
 */
export const getQOById = async (qoId) => {
  const qo = await qoRepository.findOne({ where: { id: qoId } });
  if (!qo) {
    const error = new Error("Quality Officer not found");
    error.statusCode = 404;
    throw error;
  }
  return qo;
};

/**
 * تحديث بروفايل QO
 */
export const updateQOProfile = async (userId, data) => {
  const qo = await getMyQOProfile(userId);

  qo.fullName = data.fullName ?? qo.fullName;
  qo.phone = data.phone ?? qo.phone;
  qo.region = data.region ?? qo.region;

  return await qoRepository.save(qo);
};

/**
 * تحديث الحالة
 */
export const updateQOStatus = async (userId, status) => {
  const validStatuses = ["available", "busy", "on_leave"];
  if (!validStatuses.includes(status)) {
    const error = new Error("Invalid status value");
    error.statusCode = 400;
    throw error;
  }

  const qo = await getMyQOProfile(userId);
  qo.status = status;

  return await qoRepository.save(qo);
};

/**
 * جلب كل QOs
 */
export const getAllQOs = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.region) where.region = filters.region;

  return await qoRepository.find({ where });
};