const express = require('express');
const mockDataService = require('../services/mockDataService');
const issueDetectionService = require('../services/issueDetectionService');
const router = express.Router();

// Get all detected issues
router.get('/', (req, res) => {
  try {
    const issues = mockDataService.getAllIssues();
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get issue by ID
router.get('/:id', (req, res) => {
  try {
    const issue = mockDataService.findIssueById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Analyze all tickets for issues
router.post('/analyze', async (req, res) => {
  try {
    console.log('🔍 Starting issue analysis...');
    
    // Get all tickets for analysis
    const tickets = mockDataService.getAllTickets();
    
    // Mock analysis results (in real app, use the actual service)
    const analysisResults = {
      totalTicketsAnalyzed: tickets.length,
      issuesDetected: mockDataService.getAllIssues().length,
      analysisTimestamp: new Date(),
      categories: {
        logistics: tickets.filter(t => t.category === 'shipping').length,
        product: tickets.filter(t => t.category === 'product').length,
        billing: tickets.filter(t => t.category === 'billing').length,
        technical: tickets.filter(t => t.category === 'technical').length
      },
      severityBreakdown: {
        critical: mockDataService.getAllIssues().filter(i => i.severity === 'critical').length,
        high: mockDataService.getAllIssues().filter(i => i.severity === 'high').length,
        medium: mockDataService.getAllIssues().filter(i => i.severity === 'medium').length,
        low: mockDataService.getAllIssues().filter(i => i.severity === 'low').length
      }
    };

    res.json(analysisResults);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get issue statistics
router.get('/stats/overview', (req, res) => {
  try {
    const issues = mockDataService.getAllIssues();
    
    const stats = {
      totalIssues: issues.length,
      activeIssues: issues.filter(issue => issue.status === 'active').length,
      resolvedIssues: issues.filter(issue => issue.status === 'resolved').length,
      investigatingIssues: issues.filter(issue => issue.status === 'investigating').length,
      severityBreakdown: {
        critical: issues.filter(issue => issue.severity === 'critical').length,
        high: issues.filter(issue => issue.severity === 'high').length,
        medium: issues.filter(issue => issue.severity === 'medium').length,
        low: issues.filter(issue => issue.severity === 'low').length
      },
      categoryBreakdown: {
        logistics: issues.filter(issue => issue.category === 'logistics').length,
        technology: issues.filter(issue => issue.category === 'technology').length,
        quality: issues.filter(issue => issue.category === 'quality').length,
        customer_service: issues.filter(issue => issue.category === 'customer_service').length,
        payment: issues.filter(issue => issue.category === 'payment').length,
        fulfillment: issues.filter(issue => issue.category === 'fulfillment').length
      },
      totalAffectedCustomers: issues.reduce((sum, issue) => sum + (issue.affectedCustomers || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get issues by category
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const issues = mockDataService.getAllIssues().filter(issue => issue.category === category);
    
    res.json({
      category,
      issues,
      count: issues.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get issues by severity
router.get('/severity/:severity', (req, res) => {
  try {
    const { severity } = req.params;
    const issues = mockDataService.getAllIssues().filter(issue => issue.severity === severity);
    
    res.json({
      severity,
      issues,
      count: issues.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update issue status
router.put('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const issue = mockDataService.findIssueById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Mock status update
    const updatedIssue = {
      ...issue,
      status,
      lastUpdated: new Date()
    };

    res.json({
      message: 'Issue status updated successfully',
      issue: updatedIssue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add recommendation to issue
router.post('/:id/recommendations', (req, res) => {
  try {
    const { recommendation } = req.body;
    const issue = mockDataService.findIssueById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Mock adding recommendation
    if (!issue.recommendations) issue.recommendations = [];
    issue.recommendations.push(recommendation);

    res.json({
      message: 'Recommendation added successfully',
      issue
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get issue trends
router.get('/analytics/trends', (req, res) => {
  try {
    const issues = mockDataService.getAllIssues();
    
    // Mock trend data
    const trends = {
      dailyTrends: [
        { date: '2024-10-01', issues: 5, resolved: 3 },
        { date: '2024-10-02', issues: 7, resolved: 4 },
        { date: '2024-10-03', issues: 3, resolved: 6 },
        { date: '2024-10-04', issues: 8, resolved: 5 },
        { date: '2024-10-05', issues: 4, resolved: 7 },
        { date: '2024-10-06', issues: 6, resolved: 4 },
        { date: '2024-10-07', issues: 2, resolved: 5 }
      ],
      categoryTrends: [
        { category: 'logistics', trend: 'increasing', change: '+15%' },
        { category: 'technology', trend: 'decreasing', change: '-8%' },
        { category: 'quality', trend: 'stable', change: '0%' },
        { category: 'customer_service', trend: 'increasing', change: '+5%' }
      ],
      resolutionTrends: {
        averageResolutionTime: '2.5 days',
        resolutionRate: '78%',
        escalationRate: '12%'
      }
    };

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Detect issues for new ticket
router.post('/detect/:ticketId', async (req, res) => {
  try {
    const ticket = mockDataService.findTicketById(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Mock issue detection for the ticket
    const detectedIssues = mockDataService.getAllIssues().filter(issue => {
      // Simple matching logic
      return ticket.category === issue.category || 
             ticket.description.toLowerCase().includes(issue.title.toLowerCase().split(' ')[0]);
    });

    res.json({
      ticketId: ticket._id,
      detectedIssues,
      count: detectedIssues.length,
      analysis: {
        confidence: 0.85,
        method: 'pattern_matching',
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;