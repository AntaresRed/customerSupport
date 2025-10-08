const express = require('express');
const router = express.Router();
const issueDetectionService = require('../services/issueDetectionService');
const Ticket = require('../models/Ticket');
const Customer = require('../models/Customer');

// Get comprehensive issue analysis
router.get('/analysis', async (req, res) => {
  try {
    console.log('Starting comprehensive issue analysis...');
    const analysis = await issueDetectionService.analyzeAllTickets();
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in issue analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze issues',
      message: error.message
    });
  }
});

// Get real-time issue detection for a specific ticket
router.post('/detect/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findById(ticketId).populate('customerId');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }
    
    const detection = await issueDetectionService.detectIssuesForNewTicket(ticket);
    
    res.json({
      success: true,
      data: detection,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in ticket issue detection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect issues for ticket',
      message: error.message
    });
  }
});

// Get issues by category
router.get('/issues/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const analysis = await issueDetectionService.analyzeAllTickets();
    
    const categoryIssues = analysis.issues.filter(issue => 
      issue.category === category
    );
    
    res.json({
      success: true,
      data: {
        category,
        issues: categoryIssues,
        totalIssues: categoryIssues.length
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting category issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get category issues',
      message: error.message
    });
  }
});

// Get high-priority issues
router.get('/issues/priority/high', async (req, res) => {
  try {
    const analysis = await issueDetectionService.analyzeAllTickets();
    
    const highPriorityIssues = analysis.issues.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'high'
    );
    
    res.json({
      success: true,
      data: {
        issues: highPriorityIssues,
        count: highPriorityIssues.length
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting high-priority issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get high-priority issues',
      message: error.message
    });
  }
});

// Get supply chain health overview
router.get('/health', async (req, res) => {
  try {
    const analysis = await issueDetectionService.analyzeAllTickets();
    
    const healthOverview = {
      overallHealth: analysis.summary.overallHealth,
      totalIssues: analysis.summary.totalIssuesDetected,
      criticalIssues: analysis.summary.criticalIssues,
      highIssues: analysis.summary.highIssues,
      categories: Object.keys(analysis.impactAnalysis).map(category => ({
        category,
        ...analysis.impactAnalysis[category]
      })),
      recommendations: analysis.summary.recommendations,
      lastAnalyzed: analysis.analysisDate
    };
    
    res.json({
      success: true,
      data: healthOverview,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting health overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health overview',
      message: error.message
    });
  }
});

// Get trend analysis
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    const tickets = await Ticket.find({
      createdAt: { $gte: daysAgo }
    }).sort({ createdAt: 1 });
    
    // Group tickets by day
    const dailyData = {};
    tickets.forEach(ticket => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, byCategory: {}, byPriority: {} };
      }
      dailyData[date].total++;
      
      // Categorize ticket
      const category = issueDetectionService.categorizeTicket(ticket);
      dailyData[date].byCategory[category] = (dailyData[date].byCategory[category] || 0) + 1;
      dailyData[date].byPriority[ticket.priority] = (dailyData[date].byPriority[ticket.priority] || 0) + 1;
    });
    
    // Convert to array format for charts
    const trendData = Object.keys(dailyData).map(date => ({
      date,
      ...dailyData[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      success: true,
      data: {
        period: `${days} days`,
        trends: trendData,
        summary: {
          totalTickets: tickets.length,
          averagePerDay: Math.round(tickets.length / parseInt(days) * 10) / 10,
          peakDay: Object.keys(dailyData).reduce((a, b) => 
            dailyData[a].total > dailyData[b].total ? a : b
          )
        }
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting trend analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trend analysis',
      message: error.message
    });
  }
});

// Get recommendations for specific issue
router.get('/recommendations/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const analysis = await issueDetectionService.analyzeAllTickets();
    
    const issue = analysis.issues.find(i => i.id === issueId);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        issueId,
        recommendations: issue.recommendations,
        impact: issue.impact,
        evidence: issue.evidence
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
      message: error.message
    });
  }
});

// Get customer impact analysis
router.get('/customer-impact', async (req, res) => {
  try {
    const analysis = await issueDetectionService.analyzeAllTickets();
    
    const customerImpact = {};
    
    analysis.issues.forEach(issue => {
      issue.affectedCustomers.forEach(customerEmail => {
        if (!customerImpact[customerEmail]) {
          customerImpact[customerEmail] = {
            email: customerEmail,
            issues: [],
            severity: 'low'
          };
        }
        customerImpact[customerEmail].issues.push({
          id: issue.id,
          title: issue.title,
          category: issue.category,
          severity: issue.severity
        });
        
        // Update overall severity
        if (issue.severity === 'critical' || customerImpact[customerEmail].severity === 'critical') {
          customerImpact[customerEmail].severity = 'critical';
        } else if (issue.severity === 'high' || customerImpact[customerEmail].severity === 'high') {
          customerImpact[customerEmail].severity = 'high';
        } else if (issue.severity === 'medium') {
          customerImpact[customerEmail].severity = 'medium';
        }
      });
    });
    
    const impactArray = Object.values(customerImpact).sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    res.json({
      success: true,
      data: {
        customers: impactArray,
        totalAffected: impactArray.length,
        criticalCustomers: impactArray.filter(c => c.severity === 'critical').length,
        highImpactCustomers: impactArray.filter(c => c.severity === 'high').length
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting customer impact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer impact analysis',
      message: error.message
    });
  }
});

// Export analysis data
router.get('/export', async (req, res) => {
  try {
    const analysis = await issueDetectionService.analyzeAllTickets();
    
    const exportData = {
      exportDate: new Date(),
      analysis: analysis,
      metadata: {
        totalTicketsAnalyzed: analysis.totalTicketsAnalyzed,
        timeRange: analysis.timeRange,
        issuesDetected: analysis.issues.length
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="issue-analysis.json"');
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analysis data',
      message: error.message
    });
  }
});

module.exports = router;

