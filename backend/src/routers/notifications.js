import express from 'express';
import Notification from '../models/Notification.js';
import { createStandardResponse } from '../utils/responses.js';
import { requireAuth } from '../middleware/auth.js';
import { broadcastToUser } from '../utils/sseEmitter.js';

const notificationsRouter = express.Router();

// Apply authentication middleware to all routes
notificationsRouter.use(requireAuth);

// Get all notifications for the current user
notificationsRouter.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    const query = { user_id: req.user.id };
    if (unreadOnly) {
      query.is_read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments(query);
    const unread = await Notification.countDocuments({ user_id: req.user.id, is_read: false });

    return res.json(createStandardResponse(true, {
      items: notifications,
      total,
      unread,
      page,
      limit,
      hasMore: skip + notifications.length < total
    }));

  } catch (error) {
    next(error);
  }
});

// Mark notification as read
notificationsRouter.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!notification) {
      return res.status(404).json(createStandardResponse(false, null, 'Notification not found'));
    }

    notification.is_read = true;
    await notification.save();

    return res.json(createStandardResponse(true, { marked: true }));

  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
notificationsRouter.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, is_read: false },
      { is_read: true }
    );

    return res.json(createStandardResponse(true, { marked: true }));

  } catch (error) {
    next(error);
  }
});

// Delete notification
notificationsRouter.delete('/:id', async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!notification) {
      return res.status(404).json(createStandardResponse(false, null, 'Notification not found'));
    }

    await Notification.deleteOne({ _id: req.params.id });

    return res.json(createStandardResponse(true, { deleted: true }));

  } catch (error) {
    next(error);
  }
});

// Helper function to create notifications for multiple users
export async function createNotificationsForUsers(userIds, notificationData) {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      ...notificationData
    }));

    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    // Broadcast to each user's open browser tabs in real-time
    for (const userId of userIds) {
      broadcastToUser(userId, 'notification:new', { userId: String(userId) });
    }

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Create notifications error:', error);
    return { success: false, error: error.message };
  }
}

export default notificationsRouter;

