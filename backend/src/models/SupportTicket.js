import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  from:      { type: String, enum: ['support', 'auto'], default: 'support' },
  agent:     { type: String, default: null },    // agent name
  text:      { type: String, required: true },
  sentAt:    { type: Date,   default: Date.now },
});

const noteSchema = new mongoose.Schema({
  agent:  { type: String, required: true },
  text:   { type: String, required: true },
  sentAt: { type: Date,   default: Date.now },
});

const supportTicketSchema = new mongoose.Schema({
  ticketId:              { type: String, required: true, unique: true },
  ticketNum:             { type: Number, required: true, unique: true },
  name:                  { type: String, required: true },
  email:                 { type: String, required: true, lowercase: true },
  subject:               { type: String, required: true },
  message:               { type: String, required: true },
  status:                { type: String, enum: ['open','in_progress','closed'], default: 'open' },
  priority:              { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  source:                { type: String, enum: ['website','gmail'], default: 'website' },
  assignedTo:            { type: String, default: null },
  assignedAgentId:       { type: mongoose.Schema.Types.ObjectId, ref: 'SupportAgent', default: null },
  closedAt:              { type: Date,   default: null },
  closedBy:              { type: String, default: null },
  confirmationMessageId: { type: String, default: null },
  directEmailReceived:   { type: Boolean, default: false }, // true = agent has seen 1st direct email; next ones get patience reply
  replies:               [replySchema],
  internalNotes:         [noteSchema],
  activityLog: [{
    action:  { type: String },   // assigned | transferred | status_changed | replied | note_added | closed
    agent:   { type: String },
    detail:  { type: String },
    at:      { type: Date, default: Date.now },
  }],
}, { timestamps: true });

supportTicketSchema.statics.nextTicketNum = async function () {
  const last = await this.findOne({}, {}, { sort: { ticketNum: -1 } });
  return last ? last.ticketNum + 1 : 101;
};

export default mongoose.model('SupportTicket', supportTicketSchema);
