import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/splitwise');

const SupportAgent = mongoose.model('SupportAgent', new mongoose.Schema({}, { strict: false }), 'supportagents');

const all = await SupportAgent.find({}, { accessToken: 1, name: 1, role: 1 }).lean();
console.log(`Found ${all.length} entries:`);
all.forEach(a => console.log(`  [${a.role || 'agent'}] ${a.name || '(unnamed)'} — ${a.accessToken}`));

const result = await SupportAgent.deleteMany({});
console.log(`\n✅ Deleted ${result.deletedCount} entries. Collection is now empty.`);

await mongoose.disconnect();
