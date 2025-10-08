const axios = require('axios');
const Ticket = require('../models/Ticket');
const Customer = require('../models/Customer');

class IssueDetectionService {
  constructor() {
    // Using Hugging Face's free inference API for open source models
    this.huggingFaceApiUrl = 'https://api-inference.huggingface.co/models';
    this.models = {
      // Text classification for issue categorization
      classification: 'cardiffnlp/twitter-roberta-base-emotion',
      // Named entity recognition for extracting key terms
      ner: 'dbmdz/bert-large-cased-finetuned-conll03-english',
      // Sentiment analysis
      sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      // Text summarization for pattern detection
      summarization: 'facebook/bart-large-cnn'
    };
    
    // Supply chain categories and their indicators
    this.supplyChainCategories = {
      'inventory': {
        keywords: ['out of stock', 'unavailable', 'backorder', 'inventory', 'stock', 'sold out'],
        subcategories: ['stock_shortage', 'inventory_mismatch', 'warehouse_issues']
      },
      'logistics': {
        keywords: ['shipping', 'delivery', 'transit', 'carrier', 'tracking', 'logistics', 'transport'],
        subcategories: ['delivery_delays', 'shipping_errors', 'carrier_issues', 'routing_problems']
      },
      'fulfillment': {
        keywords: ['order processing', 'fulfillment', 'packing', 'picking', 'warehouse'],
        subcategories: ['processing_delays', 'picking_errors', 'packaging_issues']
      },
      'payment': {
        keywords: ['payment', 'billing', 'charge', 'refund', 'transaction', 'credit card'],
        subcategories: ['payment_failures', 'billing_errors', 'refund_delays']
      },
      'quality': {
        keywords: ['defective', 'damaged', 'quality', 'broken', 'faulty', 'poor quality'],
        subcategories: ['product_defects', 'packaging_damage', 'quality_control']
      },
      'customer_service': {
        keywords: ['support', 'service', 'response', 'communication', 'agent'],
        subcategories: ['response_delays', 'communication_issues', 'agent_errors']
      },
      'technology': {
        keywords: ['website', 'app', 'system', 'technical', 'bug', 'error', 'glitch'],
        subcategories: ['platform_issues', 'integration_errors', 'system_downtime']
      }
    };

    // Issue severity levels
    this.severityLevels = {
      'critical': { threshold: 0.7, color: '#dc3545', description: 'System-wide issue affecting multiple customers' },
      'high': { threshold: 0.5, color: '#fd7e14', description: 'Significant impact on customer experience' },
      'medium': { threshold: 0.3, color: '#ffc107', description: 'Moderate impact, needs attention' },
      'low': { threshold: 0.1, color: '#28a745', description: 'Minor issue, monitor for trends' }
    };
  }

  async analyzeAllTickets() {
    try {
      console.log('🔍 Starting comprehensive ticket analysis...');
      
      // Get all tickets from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const tickets = await Ticket.find({
        createdAt: { $gte: thirtyDaysAgo }
      }).populate('customerId', 'name email customerTier');
      
      console.log('📊 Found tickets for analysis:', tickets.length);

      if (tickets.length === 0) {
        return { message: 'No tickets found for analysis', issues: [] };
      }

      console.log(`Analyzing ${tickets.length} tickets...`);

      // Step 1: Categorize tickets by supply chain area
      const categorizedTickets = await this.categorizeTickets(tickets);
      
      // Step 2: Detect patterns and trends
      const patterns = await this.detectPatterns(categorizedTickets);
      
      // Step 3: Identify root causes
      const rootCauses = await this.identifyRootCauses(patterns);
      
      // Step 4: Generate recommendations
      const recommendations = this.generateRecommendations(rootCauses);
      
      // Step 5: Calculate impact scores
      const impactAnalysis = this.calculateImpactScores(categorizedTickets, patterns);

      console.log('✅ Analysis complete. Found issues:', rootCauses.length);
      console.log('📊 Issues details:', rootCauses);
      
      return {
        analysisDate: new Date(),
        totalTicketsAnalyzed: tickets.length,
        timeRange: '30 days',
        issues: rootCauses,
        patterns: patterns,
        recommendations: recommendations,
        impactAnalysis: impactAnalysis,
        summary: this.generateAnalysisSummary(rootCauses, impactAnalysis)
      };

    } catch (error) {
      console.error('Error in ticket analysis:', error);
      throw new Error('Failed to analyze tickets: ' + error.message);
    }
  }

  async categorizeTickets(tickets) {
    const categorized = {};
    
    // Initialize categories
    Object.keys(this.supplyChainCategories).forEach(category => {
      categorized[category] = {
        tickets: [],
        subcategories: {},
        keywords: [],
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        urgency: { low: 0, medium: 0, high: 0, urgent: 0 }
      };
    });

    for (const ticket of tickets) {
      const ticketText = `${ticket.subject} ${ticket.description}`.toLowerCase();
      
      // Categorize ticket
      for (const [category, config] of Object.entries(this.supplyChainCategories)) {
        const keywordMatches = config.keywords.filter(keyword => 
          ticketText.includes(keyword.toLowerCase())
        );
        
        if (keywordMatches.length > 0) {
          categorized[category].tickets.push({
            ticketId: ticket.ticketId,
            subject: ticket.subject,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            createdAt: ticket.createdAt,
            customer: ticket.customerId,
            matchedKeywords: keywordMatches
          });
          
          // Track keywords
          categorized[category].keywords.push(...keywordMatches);
          
          // Analyze sentiment
          const sentiment = await this.analyzeSentiment(ticket.description);
          categorized[category].sentiment[sentiment]++;
          
          // Track urgency
          categorized[category].urgency[ticket.priority]++;
          
          // Categorize by subcategory
          for (const subcategory of config.subcategories) {
            if (!categorized[category].subcategories[subcategory]) {
              categorized[category].subcategories[subcategory] = [];
            }
            categorized[category].subcategories[subcategory].push(ticket.ticketId);
          }
        }
      }
    }

    return categorized;
  }

  async detectPatterns(categorizedTickets) {
    const patterns = [];
    
    for (const [category, data] of Object.entries(categorizedTickets)) {
      if (data.tickets.length === 0) continue;
      
      // Time-based patterns
      const timePatterns = this.analyzeTimePatterns(data.tickets);
      
      // Customer tier patterns
      const tierPatterns = this.analyzeCustomerTierPatterns(data.tickets);
      
      // Priority escalation patterns
      const priorityPatterns = this.analyzePriorityPatterns(data.tickets);
      
      // Keyword frequency analysis
      const keywordPatterns = this.analyzeKeywordFrequency(data.keywords);
      
      // Sentiment trends
      const sentimentTrends = this.analyzeSentimentTrends(data.tickets);
      
      patterns.push({
        category,
        ticketCount: data.tickets.length,
        timePatterns,
        tierPatterns,
        priorityPatterns,
        keywordPatterns,
        sentimentTrends,
        subcategoryBreakdown: data.subcategories
      });
    }
    
    return patterns;
  }

  async identifyRootCauses(patterns) {
    const rootCauses = [];
    
    for (const pattern of patterns) {
      if (pattern.ticketCount < 3) continue; // Skip categories with too few tickets
      
      const rootCause = await this.analyzeRootCause(pattern);
      if (rootCause) {
        rootCauses.push(rootCause);
      }
    }
    
    // Sort by severity and impact
    return rootCauses.sort((a, b) => b.severityScore - a.severityScore);
  }

  async analyzeRootCause(pattern) {
    const { category, ticketCount, timePatterns, tierPatterns, priorityPatterns, keywordPatterns, sentimentTrends } = pattern;
    
    // Calculate severity score based on multiple factors
    const severityScore = this.calculateSeverityScore(pattern);
    
    if (severityScore < 0.2) return null; // Skip low-severity issues
    
    // Determine the most likely root cause
    let rootCause = this.determineRootCause(category, pattern);
    
    // Generate detailed analysis
    const analysis = await this.generateDetailedAnalysis(category, pattern);
    
    return {
      id: `issue_${category}_${Date.now()}`,
      category,
      title: this.generateIssueTitle(category, rootCause),
      description: analysis.description,
      rootCause,
      severity: this.getSeverityLevel(severityScore),
      severityScore,
      affectedCustomers: this.getAffectedCustomers(pattern),
      ticketCount,
      timePattern: timePatterns,
      recommendations: this.generateIssueRecommendations(category, rootCause, pattern),
      evidence: this.gatherEvidence(pattern),
      impact: this.calculateIssueImpact(pattern),
      lastDetected: new Date(),
      status: 'active'
    };
  }

  calculateSeverityScore(pattern) {
    const ticketCount = pattern.ticketCount || 0;
    const urgentTickets = pattern.priorityPatterns?.urgent || 0;
    const highTickets = pattern.priorityPatterns?.high || 0;
    const mediumTickets = pattern.priorityPatterns?.medium || 0;
    const negativeRatio = pattern.sentimentTrends?.negative || 0;
    const timeConcentration = pattern.timePatterns?.concentration || 0;
    
    let score = 0;
    
    // Volume factor (0-0.3)
    if (ticketCount >= 20) score += 0.3;
    else if (ticketCount >= 10) score += 0.25;
    else if (ticketCount >= 5) score += 0.2;
    else if (ticketCount >= 3) score += 0.15;
    else if (ticketCount >= 1) score += 0.1;
    
    // Priority escalation factor (0-0.4)
    if (ticketCount > 0) {
      const priorityRatio = (urgentTickets * 3 + highTickets * 2 + mediumTickets) / ticketCount;
      score += Math.min(priorityRatio * 0.4, 0.4);
    }
    
    // Sentiment factor (0-0.2)
    score += negativeRatio * 0.2;
    
    // Time concentration factor (0-0.1)
    score += timeConcentration * 0.1;
    
    return Math.min(score, 1);
  }

  determineRootCause(category, pattern) {
    const rootCauseMap = {
      'inventory': this.analyzeInventoryRootCause(pattern),
      'logistics': this.analyzeLogisticsRootCause(pattern),
      'fulfillment': this.analyzeFulfillmentRootCause(pattern),
      'payment': this.analyzePaymentRootCause(pattern),
      'quality': this.analyzeQualityRootCause(pattern),
      'customer_service': this.analyzeServiceRootCause(pattern),
      'technology': this.analyzeTechnologyRootCause(pattern)
    };
    
    return rootCauseMap[category] || 'Unknown systemic issue';
  }

  analyzeInventoryRootCause(pattern) {
    const keywords = pattern.keywordPatterns || {};
    
    if (keywords['out of stock'] > 2) return 'Stock shortage due to demand forecasting issues';
    if (keywords['backorder'] > 1) return 'Supply chain disruption affecting inventory replenishment';
    if (keywords['inventory'] > 3) return 'Inventory management system inefficiencies';
    
    return 'Inventory management process issues';
  }

  analyzeLogisticsRootCause(pattern) {
    const keywords = pattern.keywordPatterns || {};
    
    if (keywords['delivery'] > 3) return 'Delivery partner performance issues';
    if (keywords['tracking'] > 2) return 'Tracking system integration problems';
    if (keywords['carrier'] > 1) return 'Carrier service quality degradation';
    
    return 'Logistics coordination and execution issues';
  }

  analyzeFulfillmentRootCause(pattern) {
    const keywords = pattern.keywordPatterns || {};
    
    if (keywords['processing'] > 2) return 'Order processing workflow bottlenecks';
    if (keywords['packing'] > 1) return 'Warehouse packing process inefficiencies';
    if (keywords['picking'] > 1) return 'Warehouse picking accuracy issues';
    
    return 'Fulfillment center operational issues';
  }

  analyzePaymentRootCause(pattern) {
    const keywords = pattern.keywordPatterns || {};
    
    if (keywords['payment'] > 2) return 'Payment gateway integration issues';
    if (keywords['refund'] > 1) return 'Refund processing workflow delays';
    if (keywords['billing'] > 1) return 'Billing system calculation errors';
    
    return 'Payment processing system issues';
  }

  analyzeQualityRootCause(pattern) {
    const keywords = pattern.keywordPatterns || {};
    
    if (keywords['defective'] > 2) return 'Quality control process failures';
    if (keywords['damaged'] > 1) return 'Packaging and handling damage issues';
    if (keywords['quality'] > 2) return 'Product quality standards not being met';
    
    return 'Quality assurance process breakdown';
  }

  analyzeServiceRootCause(pattern) {
    const keywords = pattern.keywordPatterns || {};
    
    if (keywords['response'] > 2) return 'Customer service response time issues';
    if (keywords['communication'] > 1) return 'Internal communication breakdown';
    if (keywords['agent'] > 1) return 'Agent training or resource allocation issues';
    
    return 'Customer service process inefficiencies';
  }

  analyzeTechnologyRootCause(pattern) {
    const keywords = pattern.keywordPatterns || {};
    
    if (keywords['website'] > 2) return 'Frontend platform stability issues';
    if (keywords['system'] > 2) return 'Backend system performance problems';
    if (keywords['integration'] > 1) return 'Third-party integration failures';
    
    return 'Technology infrastructure issues';
  }

  async generateDetailedAnalysis(category, pattern) {
    const ticketCount = pattern.ticketCount;
    const timePattern = pattern.timePatterns;
    const sentiment = pattern.sentimentTrends;
    
    let description = `Analysis of ${ticketCount} tickets in the ${category} category reveals `;
    
    if (timePattern?.concentration > 0.7) {
      description += `a concentrated spike in issues over a short period, suggesting a systemic breakdown. `;
    } else if (timePattern?.trend === 'increasing') {
      description += `an increasing trend in issues, indicating a growing problem. `;
    }
    
    if (sentiment?.negative > 0.6) {
      description += `Customer sentiment is predominantly negative (${Math.round(sentiment.negative * 100)}%), `;
    }
    
    description += `The most common keywords identified are: ${Object.keys(pattern.keywordPatterns || {})
      .sort((a, b) => (pattern.keywordPatterns[b] || 0) - (pattern.keywordPatterns[a] || 0))
      .slice(0, 3)
      .join(', ')}. `;
    
    if (pattern.tierPatterns) {
      const topTier = Object.keys(pattern.tierPatterns)
        .sort((a, b) => (pattern.tierPatterns[b] || 0) - (pattern.tierPatterns[a] || 0))[0];
      description += `The issue primarily affects ${topTier} tier customers. `;
    }
    
    return { description };
  }

  generateIssueTitle(category, rootCause) {
    const titles = {
      'inventory': `Inventory Management Crisis: ${rootCause}`,
      'logistics': `Logistics Breakdown: ${rootCause}`,
      'fulfillment': `Fulfillment Center Issues: ${rootCause}`,
      'payment': `Payment System Problems: ${rootCause}`,
      'quality': `Quality Control Failure: ${rootCause}`,
      'customer_service': `Service Delivery Issues: ${rootCause}`,
      'technology': `Technology Infrastructure Problems: ${rootCause}`
    };
    
    return titles[category] || `Systemic Issue in ${category}: ${rootCause}`;
  }

  getAffectedCustomers(pattern) {
    const customers = new Set();
    pattern.tickets?.forEach(ticket => {
      if (ticket.customer?.email) {
        customers.add(ticket.customer.email);
      }
    });
    return Array.from(customers);
  }

  generateIssueRecommendations(category, rootCause, pattern) {
    const recommendations = [];
    
    // General recommendations based on category
    const categoryRecommendations = {
      'inventory': [
        'Implement real-time inventory tracking',
        'Improve demand forecasting algorithms',
        'Establish safety stock levels',
        'Review supplier relationships'
      ],
      'logistics': [
        'Audit delivery partner performance',
        'Implement backup carrier options',
        'Improve tracking system integration',
        'Review shipping zones and costs'
      ],
      'fulfillment': [
        'Optimize warehouse layout and processes',
        'Implement quality control checkpoints',
        'Train staff on proper handling procedures',
        'Review order processing workflows'
      ],
      'payment': [
        'Test payment gateway integrations',
        'Implement payment retry mechanisms',
        'Review refund processing workflows',
        'Audit billing system calculations'
      ],
      'quality': [
        'Strengthen quality control processes',
        'Review supplier quality standards',
        'Implement damage prevention measures',
        'Train staff on quality requirements'
      ],
      'customer_service': [
        'Increase agent training and resources',
        'Implement response time monitoring',
        'Improve internal communication processes',
        'Review escalation procedures'
      ],
      'technology': [
        'Conduct system performance audit',
        'Implement monitoring and alerting',
        'Review third-party integrations',
        'Plan infrastructure upgrades'
      ]
    };
    
    recommendations.push(...(categoryRecommendations[category] || []));
    
    // Add specific recommendations based on pattern analysis
    if (pattern.timePatterns?.concentration > 0.7) {
      recommendations.push('Investigate recent system changes or external factors');
    }
    
    if (pattern.sentimentTrends?.negative > 0.6) {
      recommendations.push('Implement immediate customer communication strategy');
    }
    
    return recommendations;
  }

  gatherEvidence(pattern) {
    const evidence = {
      ticketSamples: pattern.tickets?.slice(0, 5).map(ticket => ({
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        priority: ticket.priority,
        createdAt: ticket.createdAt
      })) || [],
      keywordFrequency: pattern.keywordPatterns || {},
      timeDistribution: pattern.timePatterns || {},
      customerImpact: pattern.tierPatterns || {}
    };
    
    return evidence;
  }

  calculateIssueImpact(pattern) {
    const ticketCount = pattern.ticketCount || 0;
    const urgentTickets = pattern.priorityPatterns?.urgent || 0;
    const highTickets = pattern.priorityPatterns?.high || 0;
    const mediumTickets = pattern.priorityPatterns?.medium || 0;
    const lowTickets = pattern.priorityPatterns?.low || 0;
    const negativeSentiment = pattern.sentimentTrends?.negative || 0;
    const timeConcentration = pattern.timePatterns?.concentration || 0;
    
    // Base score from ticket volume (normalized to 0-3 scale)
    let volumeScore = 0;
    if (ticketCount >= 20) volumeScore = 3;
    else if (ticketCount >= 10) volumeScore = 2.5;
    else if (ticketCount >= 5) volumeScore = 2;
    else if (ticketCount >= 3) volumeScore = 1.5;
    else if (ticketCount >= 1) volumeScore = 1;
    
    // Priority weight scoring (0-3 scale)
    let priorityScore = 0;
    if (urgentTickets > 0) priorityScore += urgentTickets * 0.8; // Each urgent ticket = 0.8 points
    if (highTickets > 0) priorityScore += highTickets * 0.5; // Each high ticket = 0.5 points
    if (mediumTickets > 0) priorityScore += mediumTickets * 0.2; // Each medium ticket = 0.2 points
    if (lowTickets > 0) priorityScore += lowTickets * 0.1; // Each low ticket = 0.1 points
    priorityScore = Math.min(priorityScore, 3); // Cap at 3
    
    // Sentiment impact (0-2 scale)
    let sentimentScore = 0;
    if (negativeSentiment > 0.8) sentimentScore = 2;
    else if (negativeSentiment > 0.6) sentimentScore = 1.5;
    else if (negativeSentiment > 0.4) sentimentScore = 1;
    else if (negativeSentiment > 0.2) sentimentScore = 0.5;
    
    // Time concentration factor (0-1.5 scale)
    let timeScore = 0;
    if (timeConcentration > 0.8) timeScore = 1.5; // Very concentrated in time
    else if (timeConcentration > 0.6) timeScore = 1.2;
    else if (timeConcentration > 0.4) timeScore = 0.8;
    else if (timeConcentration > 0.2) timeScore = 0.4;
    
    // Customer tier impact multiplier (if we have tier data)
    let tierMultiplier = 1;
    if (pattern.tierPatterns) {
      const platinumCustomers = pattern.tierPatterns.platinum || 0;
      const goldCustomers = pattern.tierPatterns.gold || 0;
      const silverCustomers = pattern.tierPatterns.silver || 0;
      const bronzeCustomers = pattern.tierPatterns.bronze || 0;
      
      // Higher tier customers have more impact
      const totalTierCustomers = platinumCustomers + goldCustomers + silverCustomers + bronzeCustomers;
      if (totalTierCustomers > 0) {
        const weightedTierScore = (platinumCustomers * 4 + goldCustomers * 3 + silverCustomers * 2 + bronzeCustomers * 1) / totalTierCustomers;
        tierMultiplier = 0.8 + (weightedTierScore / 4) * 0.4; // Range: 0.8 to 1.2
      }
    }
    
    // Calculate final impact score (0-10 scale)
    const baseScore = volumeScore + priorityScore + sentimentScore + timeScore;
    const finalScore = Math.min(baseScore * tierMultiplier, 10);
    
    // Determine impact level
    let impactLevel = 'Low';
    if (finalScore >= 7) impactLevel = 'High';
    else if (finalScore >= 4) impactLevel = 'Medium';
    
    // Calculate customer satisfaction percentage
    const customerSatisfaction = Math.max(0, Math.round((1 - negativeSentiment) * 100));
    
    return {
      score: Math.round(finalScore * 10) / 10, // Round to 1 decimal place
      level: impactLevel,
      affectedTickets: ticketCount,
      urgentTickets,
      highTickets,
      mediumTickets,
      lowTickets,
      customerSatisfaction,
      breakdown: {
        volumeScore: Math.round(volumeScore * 10) / 10,
        priorityScore: Math.round(priorityScore * 10) / 10,
        sentimentScore: Math.round(sentimentScore * 10) / 10,
        timeScore: Math.round(timeScore * 10) / 10,
        tierMultiplier: Math.round(tierMultiplier * 100) / 100
      }
    };
  }

  getSeverityLevel(score) {
    for (const [level, config] of Object.entries(this.severityLevels)) {
      if (score >= config.threshold) {
        return level;
      }
    }
    return 'low';
  }

  // Helper methods for pattern analysis
  analyzeTimePatterns(tickets) {
    if (tickets.length < 2) return { trend: 'stable', concentration: 0 };
    
    const dates = tickets.map(t => new Date(t.createdAt)).sort();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentTickets = tickets.filter(t => new Date(t.createdAt) > oneWeekAgo).length;
    const concentration = recentTickets / tickets.length;
    
    // Simple trend analysis
    const firstHalf = tickets.slice(0, Math.floor(tickets.length / 2)).length;
    const secondHalf = tickets.slice(Math.floor(tickets.length / 2)).length;
    const trend = secondHalf > firstHalf * 1.2 ? 'increasing' : 
                 secondHalf < firstHalf * 0.8 ? 'decreasing' : 'stable';
    
    return { trend, concentration, recentTickets, totalTickets: tickets.length };
  }

  analyzeCustomerTierPatterns(tickets) {
    const tiers = {};
    tickets.forEach(ticket => {
      if (ticket.customer?.customerTier) {
        tiers[ticket.customer.customerTier] = (tiers[ticket.customer.customerTier] || 0) + 1;
      }
    });
    return tiers;
  }

  analyzePriorityPatterns(tickets) {
    const priorities = {};
    tickets.forEach(ticket => {
      priorities[ticket.priority] = (priorities[ticket.priority] || 0) + 1;
    });
    return priorities;
  }

  analyzeKeywordFrequency(keywords) {
    const frequency = {};
    keywords.forEach(keyword => {
      frequency[keyword] = (frequency[keyword] || 0) + 1;
    });
    return frequency;
  }

  async analyzeSentimentTrends(tickets) {
    let positive = 0, negative = 0, neutral = 0;
    
    for (const ticket of tickets) {
      const sentiment = await this.analyzeSentiment(ticket.description);
      if (sentiment === 'positive') positive++;
      else if (sentiment === 'negative') negative++;
      else neutral++;
    }
    
    const total = tickets.length;
    return {
      positive: positive / total,
      negative: negative / total,
      neutral: neutral / total
    };
  }

  async analyzeSentiment(text) {
    try {
      // Use a simple keyword-based sentiment analysis for now
      // In production, you could integrate with Hugging Face API
      const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'thank', 'love', 'perfect'];
      const negativeWords = ['bad', 'terrible', 'awful', 'angry', 'frustrated', 'disappointed', 'hate', 'worst'];
      
      const words = text.toLowerCase().split(/\s+/);
      let positiveCount = 0, negativeCount = 0;
      
      words.forEach(word => {
        if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
        if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
      });
      
      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      return 'neutral';
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return 'neutral';
    }
  }

  calculateImpactScores(categorizedTickets, patterns) {
    const scores = {};
    
    Object.keys(categorizedTickets).forEach(category => {
      const data = categorizedTickets[category];
      const pattern = patterns.find(p => p.category === category);
      
      if (data.tickets.length === 0) return;
      
      const impactScore = this.calculateIssueImpact(pattern || { ticketCount: data.tickets.length });
      scores[category] = {
        ...impactScore,
        ticketCount: data.tickets.length,
        trend: pattern?.timePatterns?.trend || 'stable'
      };
    });
    
    return scores;
  }

  generateRecommendations(rootCauses) {
    const recommendations = [];
    
    // General recommendations based on issue severity
    const criticalIssues = rootCauses.filter(issue => issue.severity === 'critical');
    const highIssues = rootCauses.filter(issue => issue.severity === 'high');
    
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'immediate_action',
        title: 'Critical Issues Detected',
        description: `${criticalIssues.length} critical issues require immediate attention`,
        actions: [
          'Escalate to management immediately',
          'Implement emergency response procedures',
          'Notify affected customers proactively',
          'Allocate additional resources for resolution'
        ]
      });
    }
    
    if (highIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'process_improvement',
        title: 'High Priority Issues',
        description: `${highIssues.length} high-priority issues need attention`,
        actions: [
          'Review and update standard operating procedures',
          'Increase monitoring and alerting',
          'Schedule team training sessions',
          'Implement preventive measures'
        ]
      });
    }
    
    // Category-specific recommendations
    const categoryIssues = {};
    rootCauses.forEach(issue => {
      if (!categoryIssues[issue.category]) {
        categoryIssues[issue.category] = [];
      }
      categoryIssues[issue.category].push(issue);
    });
    
    Object.entries(categoryIssues).forEach(([category, issues]) => {
      recommendations.push({
        priority: 'medium',
        category: category,
        title: `${this.formatCategoryName(category)} Process Review`,
        description: `${issues.length} issues detected in ${category} operations`,
        actions: this.generateIssueRecommendations(category, issues[0].rootCause, { ticketCount: issues.length })
      });
    });
    
    return recommendations;
  }

  generateAnalysisSummary(rootCauses, impactAnalysis) {
    const criticalIssues = rootCauses.filter(issue => issue.severity === 'critical').length;
    const highIssues = rootCauses.filter(issue => issue.severity === 'high').length;
    const totalIssues = rootCauses.length;
    
    const highImpactCategories = Object.keys(impactAnalysis)
      .filter(category => impactAnalysis[category].level === 'High');
    
    return {
      totalIssuesDetected: totalIssues,
      criticalIssues,
      highIssues,
      highImpactCategories,
      overallHealth: totalIssues === 0 ? 'Excellent' : 
                    criticalIssues > 0 ? 'Critical' :
                    highIssues > 2 ? 'Poor' : 'Good',
      recommendations: totalIssues > 0 ? 'Immediate action required' : 'System operating normally'
    };
  }

  // Method to get real-time issue detection for new tickets
  async detectIssuesForNewTicket(ticket) {
    try {
      const analysis = await this.analyzeAllTickets();
      const relatedIssues = analysis.issues.filter(issue => 
        issue.category === this.categorizeTicket(ticket) ||
        issue.evidence.ticketSamples.some(t => 
          this.ticketsAreRelated(t, ticket)
        )
      );
      
      return {
        ticketId: ticket.ticketId,
        relatedIssues,
        suggestions: this.generateTicketSuggestions(ticket, relatedIssues),
        riskLevel: this.calculateTicketRiskLevel(ticket, relatedIssues)
      };
    } catch (error) {
      console.error('Error detecting issues for new ticket:', error);
      return { ticketId: ticket.ticketId, relatedIssues: [], suggestions: [], riskLevel: 'unknown' };
    }
  }

  categorizeTicket(ticket) {
    const text = `${ticket.subject} ${ticket.description}`.toLowerCase();
    
    for (const [category, config] of Object.entries(this.supplyChainCategories)) {
      const matches = config.keywords.filter(keyword => text.includes(keyword.toLowerCase()));
      if (matches.length > 0) return category;
    }
    
    return 'general';
  }

  ticketsAreRelated(ticket1, ticket2) {
    // Simple similarity check - in production, use more sophisticated NLP
    const text1 = `${ticket1.subject} ${ticket1.description}`.toLowerCase();
    const text2 = `${ticket2.subject} ${ticket2.description}`.toLowerCase();
    
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size > 0.3; // 30% similarity threshold
  }

  generateTicketSuggestions(ticket, relatedIssues) {
    const suggestions = [];
    
    if (relatedIssues.length > 0) {
      suggestions.push({
        type: 'systemic_issue',
        message: `This ticket is related to an ongoing systemic issue: ${relatedIssues[0].title}`,
        priority: 'high',
        action: 'Consider escalating to management'
      });
    }
    
    const category = this.categorizeTicket(ticket);
    if (category !== 'general') {
      suggestions.push({
        type: 'category_insight',
        message: `This appears to be a ${category} issue. Check for related patterns in the system.`,
        priority: 'medium',
        action: 'Review similar tickets in this category'
      });
    }
    
    return suggestions;
  }

  calculateTicketRiskLevel(ticket, relatedIssues) {
    if (relatedIssues.some(issue => issue.severity === 'critical')) return 'critical';
    if (relatedIssues.some(issue => issue.severity === 'high')) return 'high';
    if (ticket.priority === 'urgent') return 'high';
    if (ticket.priority === 'high') return 'medium';
    return 'low';
  }

  formatCategoryName(category) {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}

module.exports = new IssueDetectionService();
