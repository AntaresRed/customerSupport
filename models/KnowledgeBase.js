const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['faq', 'troubleshooting', 'policy', 'tutorial', 'announcement'],
    required: true
  },
  tags: [String],
  keywords: [String],
  isPublished: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  relatedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],
  attachments: [{
    filename: String,
    url: String,
    fileType: String
  }]
}, {
  timestamps: true
});

// Update lastUpdated when content changes
knowledgeBaseSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title')) {
    this.lastUpdated = new Date();
  }
  next();
});

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
