import { AppDataSource } from '../config/database.js';
import { NotificationEntity } from './notification.entity.js';

const notificationRepo = () => AppDataSource.getRepository(NotificationEntity);

export const createNotification = async (data) => {
  const notification = notificationRepo().create(data);
  return await notificationRepo().save(notification);
};

export const getNotificationsByUser = async (userId) => {
  return await notificationRepo().find({
    where: { userId },
    order: { createdAt: 'DESC' },
  });
};

export const getUnreadCount = async (userId) => {
  return await notificationRepo().count({
    where: { userId, isRead: false },
  });
};

export const markAsRead = async (id, userId) => {
  const repo = notificationRepo();
  const notification = await repo.findOne({ where: { id, userId } });
  if (!notification) throw new Error('Notification not found');
  await repo.update(id, { isRead: true });
  return await repo.findOne({ where: { id } });
};

export const markAllAsRead = async (userId) => {
  await notificationRepo().update({ userId, isRead: false }, { isRead: true });
  return { message: 'All notifications marked as read' };
};