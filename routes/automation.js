const express = require('express');
const mockDataService = require('../services/mockDataService');
const router = express.Router();

// Get all automation rules
router.get('/', (req, res) => {
  try {
    const rules = mockDataService.getAllAutomationRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get automation rule by ID
router.get('/:id', (req, res) => {
  try {
    const rule = mockDataService.findAutomationRuleById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({ message: 'Automation rule not found' });
    }

    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new automation rule
router.post('/', (req, res) => {
  try {
    const { name, description, conditions, actions, priority } = req.body;
    
    const newRule = mockDataService.createAutomationRule({
      name,
      description,
      conditions: conditions || [],
      actions: actions || [],
      priority: priority || 1
    });

    res.status(201).json(newRule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update automation rule
router.put('/:id', (req, res) => {
  try {
    const { name, description, conditions, actions, priority, isActive } = req.body;
    
    const updatedRule = mockDataService.updateAutomationRule(req.params.id, {
      name,
      description,
      conditions,
      actions,
      priority,
      isActive
    });

    if (!updatedRule) {
      return res.status(404).json({ message: 'Automation rule not found' });
    }

    res.json(updatedRule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete automation rule
router.delete('/:id', (req, res) => {
  try {
    const rule = mockDataService.findAutomationRuleById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({ message: 'Automation rule not found' });
    }

    // Mock deletion (in real app, you'd remove from array)
    const updatedRule = mockDataService.updateAutomationRule(req.params.id, {
      isActive: false,
      deletedAt: new Date()
    });

    res.json({ message: 'Automation rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle automation rule status
router.patch('/:id/toggle', (req, res) => {
  try {
    const rule = mockDataService.findAutomationRuleById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({ message: 'Automation rule not found' });
    }

    const updatedRule = mockDataService.updateAutomationRule(req.params.id, {
      isActive: !rule.isActive
    });

    res.json({
      message: `Rule ${updatedRule.isActive ? 'activated' : 'deactivated'} successfully`,
      rule: updatedRule
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test automation rule
router.post('/:id/test', (req, res) => {
  try {
    const rule = mockDataService.findAutomationRuleById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({ message: 'Automation rule not found' });
    }

    // Mock rule testing
    const testResult = {
      ruleId: rule._id,
      ruleName: rule.name,
      testPassed: true,
      matchedConditions: rule.conditions.length,
      executedActions: rule.actions.length,
      testData: {
        sampleTicket: {
          title: 'Test Ticket',
          priority: 'medium',
          category: 'general'
        },
        conditionsMatched: rule.conditions.map(condition => ({
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
          matched: true
        })),
        actionsExecuted: rule.actions.map(action => ({
          type: action.type,
          value: action.value,
          executed: true
        }))
      }
    };

    res.json(testResult);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Execute automation rules for a ticket
router.post('/execute/:ticketId', (req, res) => {
  try {
    const ticket = mockDataService.findTicketById(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const rules = mockDataService.getAllAutomationRules().filter(rule => rule.isActive);
    const executedActions = [];

    // Mock rule execution
    rules.forEach(rule => {
      const matches = evaluateRuleConditions(rule.conditions, ticket);
      
      if (matches) {
        rule.actions.forEach(action => {
          const result = executeAction(action, ticket);
          executedActions.push({
            rule: rule.name,
            action: action.type,
            result
          });
        });

        // Update rule trigger count
        mockDataService.updateAutomationRule(rule._id, {
          lastTriggered: new Date(),
          triggerCount: (rule.triggerCount || 0) + 1
        });
      }
    });

    res.json({
      ticketId: ticket._id,
      executedActions,
      rulesProcessed: rules.length,
      actionsExecuted: executedActions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to evaluate rule conditions
function evaluateRuleConditions(conditions, ticket) {
  return conditions.every(condition => {
    switch (condition.field) {
      case 'priority':
        return ticket.priority === condition.value;
      case 'category':
        return ticket.category === condition.value;
      case 'status':
        return ticket.status === condition.value;
      case 'assignedAgent':
        return ticket.assignedAgent === condition.value;
      default:
        return false;
    }
  });
}

// Helper function to execute action
function executeAction(action, ticket) {
  switch (action.type) {
    case 'assign_agent':
      mockDataService.updateTicket(ticket._id, { assignedAgent: action.value });
      return `Assigned ticket to agent ${action.value}`;
    case 'set_priority':
      mockDataService.updateTicket(ticket._id, { priority: action.value });
      return `Set priority to ${action.value}`;
    case 'set_category':
      mockDataService.updateTicket(ticket._id, { category: action.value });
      return `Set category to ${action.value}`;
    case 'add_tag':
      // Mock adding tag
      return `Added tag: ${action.value}`;
    case 'send_message':
      mockDataService.addMessageToTicket(ticket._id, {
        content: action.value,
        sender: 'system',
        senderType: 'system'
      });
      return `Sent message: ${action.value}`;
    default:
      return `Executed action: ${action.type}`;
  }
}

// Get automation statistics
router.get('/stats/overview', (req, res) => {
  try {
    const rules = mockDataService.getAllAutomationRules();
    const activeRules = rules.filter(rule => rule.isActive);
    const totalTriggers = rules.reduce((sum, rule) => sum + (rule.triggerCount || 0), 0);
    
    const stats = {
      totalRules: rules.length,
      activeRules: activeRules.length,
      inactiveRules: rules.length - activeRules.length,
      totalTriggers,
      averageTriggersPerRule: rules.length > 0 ? Math.round(totalTriggers / rules.length) : 0,
      mostTriggeredRule: rules.reduce((max, rule) => 
        (rule.triggerCount || 0) > (max.triggerCount || 0) ? rule : max, 
        { triggerCount: 0 }
      )
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;