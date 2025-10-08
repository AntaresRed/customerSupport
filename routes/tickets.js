const express = require('express');
const { authenticateToken } = require('./auth');
const Ticket = require('../models/Ticket');
const Customer = require('../models/Customer');
const aiService = require('../services/aiService');
const router = express.Router();

// Get all tickets with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      category, 
      assignedAgent, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedAgent) filter.assignedAgent = assignedAgent;
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await Ticket.find(filter)
      .populate('customerId', 'name email customerId')
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ticket by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customerId')
      .populate('assignedAgent', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new ticket
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customerId, subject, description, category, priority, channel } = req.body;

    // Find or create customer
    let customer = await Customer.findOne({ customerId });
    if (!customer) {
      customer = new Customer({
        customerId,
        name: req.body.customerName || 'Unknown Customer',
        email: req.body.customerEmail || 'unknown@example.com'
      });
      await customer.save();
    }

    const ticket = new Ticket({
      customerId: customer._id,
      subject,
      description,
      category,
      priority: priority || 'medium',
      channel: channel || 'email'
    });

    await ticket.save();

    // AI-powered analysis and auto-response
    const aiAnalysis = await aiService.analyzeTicketSentiment(description);
    const aiResponse = await aiService.generateResponse(
      `Customer inquiry: ${description}`,
      { customer, ticket }
    );

    // Add AI response to ticket
    ticket.messages.push({
      sender: 'system',
      content: aiResponse,
      isAI: true
    });

    // Update ticket based on AI analysis
    if (aiAnalysis.urgency) {
      ticket.priority = aiAnalysis.urgency;
    }

    await ticket.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('ticket-created', ticket);

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update ticket
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, priority, assignedAgent, resolution } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedAgent) ticket.assignedAgent = assignedAgent;
    if (resolution) ticket.resolution = resolution;

    if (status === 'resolved' || status === 'closed') {
      ticket.actualResolution = new Date();
    }

    await ticket.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`ticket-${ticket._id}`).emit('ticket-updated', ticket);

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add message to ticket
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { content, sender } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const message = {
      sender: sender || 'agent',
      content,
      timestamp: new Date()
    };

    ticket.messages.push(message);
    await ticket.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`ticket-${ticket._id}`).emit('message-added', message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ticket statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
        }
      }
    ]);

    const categoryStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {},
      byCategory: categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
