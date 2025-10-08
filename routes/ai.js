const express = require('express');
const { authenticateToken } = require('./auth');
const aiService = require('../services/aiService');
const KnowledgeBase = require('../models/KnowledgeBase');
const router = express.Router();

// Generate AI response for customer inquiry
router.post('/generate-response', authenticateToken, async (req, res) => {
  try {
    const { prompt, context } = req.body;

    const response = await aiService.generateResponse(prompt, context);
    
    res.json({
      response,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Analyze ticket sentiment and urgency
router.post('/analyze-sentiment', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    const analysis = await aiService.analyzeTicketSentiment(content);
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get AI-powered knowledge base suggestions
router.post('/suggest-articles', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

    // Get relevant articles from database
    const articles = await KnowledgeBase.find({
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .limit(10)
    .select('title content category tags');

    const suggestions = await aiService.suggestKnowledgeBaseArticles(query, articles);
    
    res.json({
      query,
      suggestions,
      articles: articles.slice(0, limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate canned response based on category
router.post('/canned-response', authenticateToken, async (req, res) => {
  try {
    const { category, context } = req.body;

    const response = await aiService.generateCannedResponse(category, context);
    
    res.json({
      response,
      category,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Auto-categorize ticket
router.post('/categorize-ticket', authenticateToken, async (req, res) => {
  try {
    const { subject, description } = req.body;

    const prompt = `Based on this ticket subject and description, categorize it into one of these categories: order, shipping, return, technical, billing, general.

    Subject: "${subject}"
    Description: "${description}"

    Respond with just the category name.`;

    const category = await aiService.generateResponse(prompt);
    
    res.json({
      category: category.trim().toLowerCase(),
      confidence: 'high' // In a real implementation, you'd calculate confidence
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate ticket summary
router.post('/summarize-ticket', authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;

    const conversation = messages.map(msg => 
      `${msg.sender}: ${msg.content}`
    ).join('\n');

    const prompt = `Summarize this customer support conversation in 2-3 sentences, highlighting the main issue and resolution:

    ${conversation}`;

    const summary = await aiService.generateResponse(prompt);
    
    res.json({
      summary,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate response suggestions
router.post('/response-suggestions', authenticateToken, async (req, res) => {
  try {
    const { customerMessage, context } = req.body;

    const prompt = `As a customer support agent, provide 3 different response suggestions for this customer message. Each should be professional but have a different tone: formal, friendly, and empathetic.

    Customer message: "${customerMessage}"
    
    Context: ${JSON.stringify(context, null, 2)}

    Format as JSON array with "tone" and "response" fields.`;

    const suggestions = await aiService.generateResponse(prompt);
    
    try {
      const parsedSuggestions = JSON.parse(suggestions);
      res.json(parsedSuggestions);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      res.json([
        {
          tone: "professional",
          response: "Thank you for contacting us. I understand your concern and I'm here to help you resolve this issue."
        },
        {
          tone: "friendly", 
          response: "Hi there! Thanks for reaching out. I'd be happy to help you with this today."
        },
        {
          tone: "empathetic",
          response: "I can see how frustrating this must be for you. Let me work on getting this resolved right away."
        }
      ]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Chatbot Conversation Management
router.post('/chatbot/start-conversation', authenticateToken, async (req, res) => {
  try {
    const { context } = req.body;
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    aiService.startConversation(sessionId, context);
    
    res.json({
      sessionId,
      message: 'Conversation started',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/chatbot/send-message', authenticateToken, async (req, res) => {
  try {
    const { sessionId, message, context } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ message: 'Session ID and message are required' });
    }

    const response = await aiService.generateConversationalResponse(sessionId, message, context);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/chatbot/conversation/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = aiService.getConversation(sessionId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/chatbot/conversation/:sessionId/analytics', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const analytics = aiService.getConversationAnalytics(sessionId);
    
    if (!analytics) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/chatbot/conversation/:sessionId/export', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = aiService.exportConversation(sessionId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/chatbot/conversation/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = aiService.getConversation(sessionId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    aiService.conversationHistory.delete(sessionId);
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get conversation templates
router.get('/chatbot/templates', authenticateToken, async (req, res) => {
  try {
    const templates = [
      {
        id: 'apologize_generic',
        name: 'Generic Apology',
        content: 'I sincerely apologize for the inconvenience this has caused you. Let me help resolve this issue right away.',
        category: 'greeting'
      },
      {
        id: 'investigate_issue',
        name: 'Investigate Issue',
        content: 'I understand your concern. Let me investigate this issue for you and get back to you with a solution within the next few hours.',
        category: 'general'
      },
      {
        id: 'offer_refund',
        name: 'Offer Refund',
        content: 'I\'m sorry for the trouble. I can process a full refund for you right away. The refund will be processed within 3-5 business days. Would that be acceptable?',
        category: 'return'
      },
      {
        id: 'offer_replacement',
        name: 'Offer Replacement',
        content: 'I\'ll send you a replacement item immediately at no extra cost. I\'ll also provide you with a prepaid return label for the damaged item. Is that okay with you?',
        category: 'return'
      },
      {
        id: 'provide_tracking',
        name: 'Provide Tracking Info',
        content: 'Let me get you the tracking information for your order. I\'ll send it to your email right now, and you can track your package in real-time.',
        category: 'shipping'
      },
      {
        id: 'escalate_to_manager',
        name: 'Escalate to Manager',
        content: 'I understand this is important to you. Let me connect you with my supervisor who can better assist you with this matter.',
        category: 'general'
      },
      {
        id: 'thank_customer',
        name: 'Thank Customer',
        content: 'Thank you for bringing this to our attention. We appreciate your patience and understanding, and we value you as a customer.',
        category: 'greeting'
      },
      {
        id: 'order_cancellation',
        name: 'Order Cancellation',
        content: 'I can help you cancel your order. Since it hasn\'t shipped yet, I can cancel it immediately and process a full refund. Would you like me to proceed?',
        category: 'order'
      },
      {
        id: 'shipping_upgrade',
        name: 'Offer Shipping Upgrade',
        content: 'I can upgrade your shipping to express delivery at no additional cost to ensure you receive your order as soon as possible. Would you like me to arrange that?',
        category: 'shipping'
      },
      {
        id: 'partial_refund',
        name: 'Offer Partial Refund',
        content: 'I understand your concern about the quality. I can offer you a 50% refund while you keep the item, or a full refund if you return it. Which option would you prefer?',
        category: 'return'
      },
      {
        id: 'check_inventory',
        name: 'Check Inventory',
        content: 'Let me check our inventory and see if we have the correct item in stock. I\'ll also verify the product details to ensure we send you exactly what you ordered.',
        category: 'order'
      },
      {
        id: 'follow_up',
        name: 'Follow Up Promise',
        content: 'I\'ll personally follow up on this issue and ensure it\'s resolved to your satisfaction. You can expect to hear from me within 24 hours with an update.',
        category: 'general'
      }
    ];

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
