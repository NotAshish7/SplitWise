// Simple in-memory database
export const db = {
  users: [],
  otps: [],
  expenses: [],
  groups: [],
  group_members: [],
  group_expenses: [],
  payments: [],
  reminders: [],
  notifications: [],
  password_history: []
};

let idCounters = { user: 0, expense: 0, group: 0, payment: 0, reminder: 0, notification: 0, otp: 0 };

export function getDb() {
  return {
    prepare(sql) {
      const query = {
        get(...args) {
          if (sql.includes('SELECT * FROM users')) {
            if (args[0]) {
              return db.users.find(u => u.email === args[0] || u.id === args[0]) || null;
            }
            return db.users.length > 0 ? db.users[0] : null;
          }
          if (sql.includes('SELECT * FROM expenses')) {
            return db.expenses.find(e => e.id === Number(args[0]) && e.user_id === args[1]) || null;
          }
          if (sql.includes('SELECT * FROM groups') && args[0]) {
            return db.groups.find(g => g.invite_code === args[0]) || null;
          }
          if (sql.includes('SELECT * FROM otps')) {
            if (args.length >= 3) {
              const latest = [...db.otps].reverse().find(o => o.email === args[0] && o.code === args[1] && o.purpose === args[2]);
              return latest || null;
            }
            return null;
          }
          if (sql.includes('SELECT COUNT(*) FROM group_members')) {
            return { count: db.group_members.filter(m => m.group_id === args[0]).length };
          }
          if (sql.includes('SELECT SUM')) {
            const userExpenses = db.expenses.filter(e => e.user_id === args[0]);
            return { total: userExpenses.reduce((sum, e) => sum + e.amount, 0) };
          }
          if (sql.includes('id = ?')) {
            return db.group_members.find(m => m.group_id === args[0] && m.user_id === args[1]) || null;
          }
          return null;
        },
        
        all(...args) {
          if (sql.includes('FROM expenses') && args[0]) {
            return db.expenses.filter(e => e.user_id === args[0]);
          }
          if (sql.includes('FROM groups')) {
            const userGroups = db.group_members.filter(gm => gm.user_id === args[0]).map(gm => gm.group_id);
            return db.groups.filter(g => userGroups.includes(g.id)).map(g => {
              const memberCount = db.group_members.filter(m => m.group_id === g.id).length;
              return { ...g, memberCount };
            });
          }
          if (sql.includes('FROM reminders')) {
            return db.reminders.filter(r => !r.user_id || r.user_id === args[0]);
          }
          if (sql.includes('FROM notifications')) {
            return db.notifications.filter(n => !n.user_id || n.user_id === args[0]);
          }
          if (sql.includes('FROM payments')) {
            return db.payments.filter(p => p.sender_id === args[0] || p.receiver_id === args[0]);
          }
          if (sql.includes('FROM group_expenses')) {
            return db.group_expenses.filter(e => e.group_id === args[0]);
          }
          if (sql.includes('FROM users') && sql.includes('JOIN group_members')) {
            return db.users.filter(u => db.group_members.some(gm => gm.user_id === u.id && gm.group_id === args[0]));
          }
          if (sql.includes('FROM group_expenses')) {
            return db.group_expenses.filter(e => e.group_id === args[0]);
          }
          return [];
        },
        
        run(...args) {
          let id;
          
          if (sql.includes('INSERT INTO users')) {
            id = ++idCounters.user;
            const user = {
              id,
              name: args[0],
              email: args[1].toLowerCase(),
              password_hash: args[2],
              email_verified: 0,
              preferred_currency: 'INR',
              theme: 'light',
              created_at: new Date().toISOString()
            };
            db.users.push(user);
            return { lastInsertRowid: id, changes: 1 };
          }
          
          if (sql.includes('INSERT INTO expenses')) {
            id = ++idCounters.expense;
            const exp = {
              id,
              user_id: args[0],
              title: args[1],
              amount: args[2],
              category: args[3],
              spent_at: args[4],
              notes: args[5] || null,
              created_at: new Date().toISOString()
            };
            db.expenses.push(exp);
            return { lastInsertRowid: id, changes: 1 };
          }
          
          if (sql.includes('INSERT INTO groups')) {
            id = ++idCounters.group;
            const g = {
              id,
              name: args[0],
              owner_id: args[1],
              invite_code: args[2],
              created_at: new Date().toISOString()
            };
            db.groups.push(g);
            const memId = ++idCounters.group;
            db.group_members.push({ id: memId, group_id: id, user_id: args[1], status: 'active' });
            return { lastInsertRowid: id, changes: 1 };
          }
          
          if (sql.includes('INSERT INTO group_expenses')) {
            id = ++idCounters.expense;
            const ge = {
              id,
              group_id: args[0],
              payer_id: args[1],
              title: args[2],
              amount: args[3],
              category: args[4],
              spent_at: args[5],
              created_at: new Date().toISOString()
            };
            db.group_expenses.push(ge);
            return { lastInsertRowid: id, changes: 1 };
          }
          
          if (sql.includes('INSERT INTO payments')) {
            id = ++idCounters.payment;
            const p = {
              id,
              sender_id: args[0],
              receiver_id: args[1],
              amount: args[2],
              status: args[3],
              note: args[4] || null,
              created_at: new Date().toISOString(),
              sender_name: db.users.find(u => u.id === args[0])?.name || '',
              receiver_name: db.users.find(u => u.id === args[1])?.name || '',
              sender_email: db.users.find(u => u.id === args[0])?.email || '',
              receiver_email: db.users.find(u => u.id === args[1])?.email || ''
            };
            db.payments.push(p);
            return { lastInsertRowid: id, changes: 1 };
          }
          
          if (sql.includes('INSERT INTO reminders')) {
            id = ++idCounters.reminder;
            const r = {
              id,
              user_id: args[0],
              title: args[1],
              due_at: args[2],
              status: 'pending',
              created_at: new Date().toISOString()
            };
            db.reminders.push(r);
            return { lastInsertRowid: id, changes: 1 };
          }
          
          if (sql.includes('INSERT INTO notifications')) {
            id = ++idCounters.notification;
            const n = {
              id,
              user_id: args[0],
              type: args[1],
              message: args[2],
              created_at: new Date().toISOString()
            };
            db.notifications.push(n);
            return { lastInsertRowid: id, changes: 1 };
          }
          
          if (sql.includes('INSERT INTO otps')) {
            id = ++idCounters.otp;
            const o = {
              id,
              email: args[0].toLowerCase(),
              code: args[1],
              purpose: args[2],
              expires_at: args[3],
              created_at: new Date().toISOString()
            };
            db.otps.push(o);
            return { lastInsertRowid: id, changes: 1 };
          }
          
          if (sql.includes('UPDATE users') && args.length === 1 && args[0]) {
            const email = args[0];
            const user = db.users.find(u => u.email === email);
            if (user) {
              user.email_verified = 1;
            }
            return { changes: user ? 1 : 0 };
          }
          
          if (sql.includes('DELETE FROM expenses')) {
            const idx = db.expenses.findIndex(e => e.id === Number(args[0]) && e.user_id === args[1]);
            if (idx >= 0) {
              db.expenses.splice(idx, 1);
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          
          return { changes: 0 };
        }
      };
      return query;
    }
  };
}

export async function ensureDatabase() {
  // eslint-disable-next-line no-console
  console.log('In-memory database initialized');
}
