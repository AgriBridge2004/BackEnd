import {
  getNotificationsByUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from './notification.service.js';

// GET /notifications — جلب كل الإشعارات
export const getNotificationsController = async (req, res) => {
  try {
    const notifications = await getNotificationsByUser(req.user.id);
    return res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('GET NOTIFICATIONS ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /notifications/unread-count — عدد الإشعارات غير المقروءة
export const getUnreadCountController = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    return res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error('GET UNREAD COUNT ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /notifications/:id/read — تعليم إشعار كمقروء
export const markAsReadController = async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.id);
    return res.status(200).json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('MARK AS READ ERROR:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /notifications/read-all — تعليم كل الإشعارات كمقروءة
export const markAllAsReadController = async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    return res.status(200).json({
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('MARK ALL AS READ ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};