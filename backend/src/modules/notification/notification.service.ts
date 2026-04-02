import { prisma } from '@/config/database';
import { NotificationType, Prisma } from '@prisma/client';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
) => {
  return prisma.notification.create({
    data: {
      user_id: userId,
      type,
      title,
      message,
      data: data ? (data as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
};

export const getNotifications = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.notification.count({ where: { user_id: userId } }),
    prisma.notification.count({ where: { user_id: userId, read: false } }),
  ]);

  return {
    notifications,
    unread_count: unreadCount,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const markAsRead = async (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { read: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { user_id: userId, read: false },
    data: { read: true },
  });
};

export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({ where: { user_id: userId, read: false } });
};
