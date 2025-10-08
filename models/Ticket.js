const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: false
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'pending_customer', 'resolved', 'closed'],
    default: 'open'
  },
  category: {
    type: String,
    enum: ['order', 'shipping', 'return', 'technical', 'billing', 'general'],
    required: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  channel: {
    type: String,
    enum: ['email', 'chat', 'phone', 'social', 'self_service'],
    required: true
  },
  tags: [String],
  messages: [{
    sender: {
      type: String,
      enum: ['customer', 'agent', 'system']
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isAI: {
      type: Boolean,
      default: false
    }
  }],
  resolution: {
    type: String
  },
  satisfaction: {
    rating: Number,
    feedback: String
  },
  relatedOrderId: String,
  estimatedResolution: Date,
  actualResolution: Date
}, {
  timestamps: true
});

// Generate unique ticket ID
ticketSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    try {
      // Use a more reliable method to generate unique ID
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.ticketId = `TKT-${timestamp}${random}`;
    } catch (error) {
      console.error('Error generating ticket ID:', error);
      this.ticketId = `TKT-${Date.now()}`;
    }
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
