import { Router } from 'express';
import { z } from 'zod';
import { getDb, db } from '../systems/db.js';
import { authRequired } from '../middleware/auth.js';
import { createStandardResponse } from '../utils/responses.js';
import { sendEmail } from '../utils/mailer.js';

export const remindersRouter = Router();
remindersRouter.use(authRequired);

const reminderSchema = z.object({ title: z.string().min(1), dueAt: z.string().min(1) });

remindersRouter.post('/', (req, res) => {
  const parse = reminderSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(createStandardResponse(false, null, 'Invalid input'));
  const { title, dueAt } = parse.data;
  const info = getDb().prepare('INSERT INTO reminders (user_id, title, due_at) VALUES (?, ?, ?)')
    .run(req.user.id, title, dueAt);
  getDb().prepare('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)')
    .run(req.user.id, 'reminder', `Reminder added: ${title}`);
  return res.json(createStandardResponse(true, { id: info.lastInsertRowid }));
});

remindersRouter.get('/', (req, res) => {
  const items = db.reminders.filter(r => r.user_id === req.user.id).sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
  const notifications = db.notifications.filter(n => n.user_id === req.user.id).slice(-20).reverse();
  return res.json(createStandardResponse(true, { items, notifications }));
});

const markSchema = z.object({ status: z.enum(['pending', 'done']) });
remindersRouter.patch('/:id', (req, res) => {
  const parse = markSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(createStandardResponse(false, null, 'Invalid input'));
  const reminder = db.reminders.find(r => r.id === Number(req.params.id) && r.user_id === req.user.id);
  if (!reminder) return res.status(404).json(createStandardResponse(false, null, 'Not found'));
  reminder.status = parse.data.status;
  return res.json(createStandardResponse(true, { updated: true }));
});

remindersRouter.post('/send-email', (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json(createStandardResponse(false, null, 'User not found'));
  const { subject = 'Payment Reminder', text = 'This is a friendly reminder from SplitWise.' } = req.body || {};
  sendEmail(user.email, subject, text);
  return res.json(createStandardResponse(true, { sent: true }));
});
