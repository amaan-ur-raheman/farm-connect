import { Router } from 'express';
import { authenticate } from '@/shared/middleware/auth';
import { asyncHandler } from '@/shared/middleware/handlers';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from './notification.service';

export const notificationRouter = Router();

notificationRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const data = await getNotifications(req.user!.userId, page, limit);
  res.json({ success: true, data });
}));

notificationRouter.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
  const count = await getUnreadCount(req.user!.userId);
  res.json({ success: true, data: { count } });
}));

notificationRouter.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  await markAsRead(req.params.id as string, req.user!.userId);
  res.json({ success: true, data: { message: 'Marked as read' } });
}));

notificationRouter.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
  await markAllAsRead(req.user!.userId);
  res.json({ success: true, data: { message: 'All notifications marked as read' } });
}));
