const express = require('express');
const mockDataService = require('../services/mockDataService');
const aiService = require('../services/aiService');
const router = express.Router();

// Get all tickets with filtering and pagination
router.get('/', (req, res) => {
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

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (assignedAgent) filters.assignedAgent = assignedAgent;
    if (search) filters.search = search;

    const allTickets = mockDataService.getAllTickets(filters);
    const total = allTickets.length;
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const tickets = allTickets.slice(startIndex, endIndex);

    // Populate customer and agent data
    const populatedTickets = tickets.map(ticket => {
      const customer = mockDataService.findCustomerById(ticket.customer);
      const assignedAgent = ticket.assignedAgent ? mockDataService.findUserById(ticket.assignedAgent) : null;
      
      return {
        ...ticket,
        customerId: customer ? {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          customerId: customer.customerId
        } : null,
        assignedAgent: assignedAgent ? {
          _id: assignedAgent._id,
          name: assignedAgent.name,
          email: assignedAgent.email
        } : null
      };
    });

    res.json({
      tickets: populatedTickets,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ticket by ID
router.get('/:id', (req, res) => {
  try {
    const ticket = mockDataService.findTicketById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Populate customer and agent data
    const customer = mockDataService.findCustomerById(ticket.customer);
    const assignedAgent = ticket.assignedAgent ? mockDataService.findUserById(ticket.assignedAgent) : null;
    
    const populatedTicket = {
      ...ticket,
      customerId: customer ? {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        customerId: customer.customerId,
        customerTier: customer.customerTier
      } : null,
      assignedAgent: assignedAgent ? {
        _id: assignedAgent._id,
        name: assignedAgent.name,
        email: assignedAgent.email
      } : null
    };

    res.json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new ticket
router.post('/', (req, res) => {
  try {
    const { title, description, priority, category, customer } = req.body;
    
    const newTicket = mockDataService.createTicket({
      title,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      customer
    });

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update ticket
router.put('/:id', (req, res) => {
  try {
    const { title, description, status, priority, category, assignedAgent } = req.body;
    
    const updatedTicket = mockDataService.updateTicket(req.params.id, {
      title,
      description,
      status,
      priority,
      category,
      assignedAgent
    });

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add message to ticket
router.post('/:id/messages', (req, res) => {
  try {
    const { content, sender, senderType } = req.body;
    
    const updatedTicket = mockDataService.addMessageToTicket(req.params.id, {
      content,
      sender,
      senderType: senderType || 'customer'
    });

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ticket statistics
router.get('/stats/overview', (req, res) => {
  try {
    const stats = mockDataService.getDashboardStats();
    
    res.json({
      totalTickets: stats.totalTickets,
      openTickets: stats.openTickets,
      inProgressTickets: stats.inProgressTickets,
      resolvedTickets: stats.resolvedTickets,
      highPriorityTickets: stats.highPriorityTickets,
      avgResolutionTime: stats.avgResolutionTime
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Auto-categorize ticket
router.post('/:id/categorize', async (req, res) => {
  try {
    const ticket = mockDataService.findTicketById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Use AI service for categorization
    const category = await aiService.categorizeTicket(ticket.description);
    
    const updatedTicket = mockDataService.updateTicket(req.params.id, { category });
    
    res.json({
      ticketId: ticket._id,
      originalCategory: ticket.category,
      newCategory: category,
      confidence: 0.85
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate ticket summary
router.post('/:id/summarize', async (req, res) => {
  try {
    const ticket = mockDataService.findTicketById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Use AI service for summarization
    const summary = await aiService.summarizeTicket(ticket);
    
    res.json({
      ticketId: ticket._id,
      summary,
      wordCount: summary.split(' ').length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;