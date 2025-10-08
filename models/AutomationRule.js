const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  conditions: [{
    field: {
      type: String,
      enum: ['category', 'priority', 'customer_tier', 'keywords', 'channel', 'time_created', 'status']
    },
    operator: {
      type: String,
      enum: ['equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']
    },
    value: mongoose.Schema.Types.Mixed
  }],
  actions: [{
    type: {
      type: String,
      enum: ['assign_agent', 'set_priority', 'add_tag', 'send_response', 'escalate', 'close_ticket']
    },
    parameters: mongoose.Schema.Types.Mixed
  }],
  priority: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastTriggered: Date,
  triggerCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
