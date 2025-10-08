const express = require('express');
const { authenticateToken } = require('./auth');
const AutomationRule = require('../models/AutomationRule');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const router = express.Router();

// Get all automation rules
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rules = await AutomationRule.find()
      .populate('createdBy', 'name email')
      .sort({ priority: -1, createdAt: -1 });

    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new automation rule
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, conditions, actions, priority } = req.body;

    const rule = new AutomationRule({
      name,
      description,
      conditions,
      actions,
      priority: priority || 0,
      createdBy: req.user.userId
    });

    await rule.save();
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update automation rule
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    Object.assign(rule, req.body);
    await rule.save();

    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete automation rule
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    await AutomationRule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle rule active status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test automation rule
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    const { testTicket } = req.body;
    const matches = await evaluateRuleConditions(rule.conditions, testTicket);

    res.json({
      rule: rule.name,
      matches,
      wouldTrigger: matches && rule.isActive
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Execute automation rules for a ticket
router.post('/execute/:ticketId', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('customerId');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const rules = await AutomationRule.find({ isActive: true })
      .sort({ priority: -1 });

    const executedActions = [];

    for (const rule of rules) {
      const matches = await evaluateRuleConditions(rule.conditions, ticket);
      
      if (matches) {
        for (const action of rule.actions) {
          const result = await executeAction(action, ticket);
          executedActions.push({
            rule: rule.name,
            action: action.type,
            result
          });
        }

        rule.lastTriggered = new Date();
        rule.triggerCount += 1;
        await rule.save();
      }
    }

    res.json({
      ticketId: ticket._id,
      executedActions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to evaluate rule conditions
async function evaluateRuleConditions(conditions, ticket) {
  for (const condition of conditions) {
    const { field, operator, value } = condition;
    let ticketValue = ticket[field];

    // Handle nested fields
    if (field === 'customer_tier' && ticket.customerId) {
      ticketValue = ticket.customerId.customerTier;
    }

    switch (operator) {
      case 'equals':
        if (ticketValue !== value) return false;
        break;
      case 'contains':
        if (!String(ticketValue).toLowerCase().includes(String(value).toLowerCase())) return false;
        break;
      case 'greater_than':
        if (ticketValue <= value) return false;
        break;
      case 'less_than':
        if (ticketValue >= value) return false;
        break;
      case 'in':
        if (!value.includes(ticketValue)) return false;
        break;
      case 'not_in':
        if (value.includes(ticketValue)) return false;
        break;
    }
  }
  return true;
}

// Helper function to execute actions
async function executeAction(action, ticket) {
  const { type, parameters } = action;

  switch (type) {
    case 'assign_agent':
      if (parameters.agentId) {
        ticket.assignedAgent = parameters.agentId;
        await ticket.save();
        return { success: true, message: 'Agent assigned' };
      }
      break;

    case 'set_priority':
      if (parameters.priority) {
        ticket.priority = parameters.priority;
        await ticket.save();
        return { success: true, message: 'Priority updated' };
      }
      break;

    case 'add_tag':
      if (parameters.tag) {
        if (!ticket.tags.includes(parameters.tag)) {
          ticket.tags.push(parameters.tag);
          await ticket.save();
        }
        return { success: true, message: 'Tag added' };
      }
      break;

    case 'send_response':
      if (parameters.message) {
        ticket.messages.push({
          sender: 'system',
          content: parameters.message,
          timestamp: new Date()
        });
        await ticket.save();
        return { success: true, message: 'Response sent' };
      }
      break;

    case 'escalate':
      ticket.priority = 'urgent';
      await ticket.save();
      return { success: true, message: 'Ticket escalated' };

    case 'close_ticket':
      ticket.status = 'closed';
      ticket.actualResolution = new Date();
      await ticket.save();
      return { success: true, message: 'Ticket closed' };
  }

  return { success: false, message: 'Action not executed' };
}

// Get automation statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await AutomationRule.aggregate([
      {
        $group: {
          _id: null,
          totalRules: { $sum: 1 },
          activeRules: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalTriggers: { $sum: '$triggerCount' }
        }
      }
    ]);

    const topRules = await AutomationRule.find()
      .sort({ triggerCount: -1 })
      .limit(5)
      .select('name triggerCount');

    res.json({
      overview: stats[0] || {},
      topRules
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
