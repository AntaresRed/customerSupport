const axios = require('axios');

class AIService {
  constructor() {
    this.apiUrl = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';
    this.model = process.env.MISTRAL_MODEL || 'mistral-small-latest';
    this.conversationHistory = new Map(); // Store conversation history by session ID
    
    // Gemini API configuration
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
  }

  async generateResponse(prompt, context = {}) {
    try {
      console.log('=== AI Service Debug ===');
      console.log('MISTRAL_API_KEY exists:', !!process.env.MISTRAL_API_KEY);
      console.log('MISTRAL_API_KEY value:', process.env.MISTRAL_API_KEY ? 'SET (length: ' + process.env.MISTRAL_API_KEY.length + ')' : 'NOT SET');
      console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
      console.log('All environment variables:', Object.keys(process.env).filter(key => key.includes('API') || key.includes('MISTRAL')));
      
      // Check if we have any API key configured
      if (!process.env.MISTRAL_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
        console.log('❌ No AI API key configured, using local intelligent response');
        console.log('💡 To use real AI responses, add API keys to .env file');
        console.log('📖 See AI_SETUP.md for configuration instructions');
        return this.getFallbackResponse(prompt, context);
      }

      // Try Gemini AI first (best free tier)
      if (process.env.GEMINI_API_KEY) {
        console.log('🤖 Attempting Gemini AI API call...');
        console.log('API Key starts with:', process.env.GEMINI_API_KEY.substring(0, 8) + '...');
        try {
          const response = await this.callGeminiAPI(prompt, context);
          if (response) {
            console.log('✅ Gemini AI response received');
            return response;
          }
        } catch (geminiError) {
          console.log('❌ Gemini API failed:', geminiError.message);
          if (geminiError.response) {
            console.log('API Error Status:', geminiError.response.status);
            console.log('API Error Data:', geminiError.response.data);
          }
          console.log('🔄 Trying Mistral...');
        }
      } else {
        console.log('⚠️ GEMINI_API_KEY not found in environment');
      }

      // Try Mistral AI second
      if (process.env.MISTRAL_API_KEY) {
        console.log('🤖 Attempting Mistral AI API call...');
        console.log('API Key starts with:', process.env.MISTRAL_API_KEY.substring(0, 8) + '...');
        try {
          const response = await this.callMistralAPI(prompt, context);
          if (response) {
            console.log('✅ Mistral AI response received');
            return response;
          }
        } catch (mistralError) {
          console.log('❌ Mistral API failed:', mistralError.message);
          if (mistralError.response) {
            console.log('API Error Status:', mistralError.response.status);
            console.log('API Error Data:', mistralError.response.data);
          }
          console.log('🔄 Trying OpenAI...');
        }
      } else {
        console.log('⚠️ MISTRAL_API_KEY not found in environment');
      }

      // Fallback to OpenAI if Mistral fails or not configured
      if (process.env.OPENAI_API_KEY) {
        console.log('🤖 Attempting OpenAI API call...');
        try {
          const response = await this.callOpenAIAPI(prompt, context);
          if (response) {
            console.log('✅ OpenAI response received');
            return response;
          }
        } catch (openaiError) {
          console.log('❌ OpenAI API failed:', openaiError.message);
          console.log('🔄 Using local intelligent response...');
        }
      }

      // If all APIs fail, use fallback
      console.log('⚠️ All AI APIs failed or unavailable, using local intelligent response');
      return this.getFallbackResponse(prompt, context);

    } catch (error) {
      console.error('AI Service Error:', error.message);
      return this.getFallbackResponse(prompt, context);
    }
  }

  async callGeminiAPI(prompt, context = {}) {
    const axios = require('axios');
    
      const systemPrompt = this.buildSystemPrompt(context);
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
    
    const requestData = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // Try different Gemini models in order of preference
    const models = [
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'gemini-pro'
    ];

    for (const model of models) {
      try {
        console.log(`🔄 Trying Gemini model: ${model}`);
        const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        
        const response = await axios.post(
          `${modelUrl}?key=${process.env.GEMINI_API_KEY}`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 second timeout
          }
        );

        console.log(`✅ Successfully used Gemini model: ${model}`);
        return response.data.candidates[0].content.parts[0].text.trim();
        
      } catch (modelError) {
        console.log(`❌ Model ${model} failed:`, modelError.response?.status, modelError.response?.data?.error?.message);
        
        // If it's a 404 (model not found), try next model
        if (modelError.response?.status === 404) {
          continue;
        }
        
        // For other errors, throw immediately
        throw modelError;
      }
    }

    throw new Error('All Gemini models failed');
  }

  async callMistralAPI(prompt, context = {}) {
    const axios = require('axios');
    
    const requestData = {
        model: this.model,
        messages: [
          {
          role: "system",
          content: this.buildSystemPrompt(context)
          },
          {
          role: "user",
            content: prompt
          }
        ],
      max_tokens: 500,
      temperature: 0.7
    };

    const response = await axios.post(this.apiUrl, requestData, {
        headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    return response.data.choices[0].message.content.trim();
  }

  async callOpenAIAPI(prompt, context = {}) {
    const axios = require('axios');
    
    const requestData = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: "system",
          content: this.buildSystemPrompt(context)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', requestData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    return response.data.choices[0].message.content.trim();
  }

  // New method to get issue-based recommendations
  async getIssueBasedRecommendations(customerMessage, context = {}, conversationHistory = []) {
    try {
      console.log('🔍 Getting issue-based recommendations for:', customerMessage);
      const issueDetectionService = require('./issueDetectionService');
      
      // Get current issue analysis
      const analysis = await issueDetectionService.analyzeAllTickets();
      console.log('📊 Issue analysis result:', analysis);
      
      if (!analysis || !analysis.issues || analysis.issues.length === 0) {
        console.log('⚠️ No issues found in analysis');
        return [];
      }

      // Analyze the entire conversation context, not just the current message
      const conversationText = this.buildConversationContext(customerMessage, conversationHistory);
      const conversationCategory = this.categorizeMessage(conversationText);
      
      // Find relevant issues based on conversation context and keywords
      let relevantIssues = analysis.issues.filter(issue => {
        const categoryMatch = issue.category === conversationCategory;
        const conversationMatch = this.conversationMatchesIssue(conversationText, issue);
        const messageMatch = this.messageMatchesIssueKeywords(customerMessage, issue);
        
        console.log(`🔍 Issue "${issue.title}" filtering:`, {
          categoryMatch,
          conversationMatch,
          messageMatch,
          issueCategory: issue.category,
          conversationCategory: conversationCategory,
          isRelevant: categoryMatch || conversationMatch || messageMatch
        });
        
        return categoryMatch || conversationMatch || messageMatch;
      });
      
      // If no relevant issues found, include top 2 issues as fallback
      if (relevantIssues.length === 0) {
        console.log('⚠️ No relevant issues found, using fallback - top 2 issues');
        relevantIssues = analysis.issues.slice(0, 2);
      }

      // Sort issues by relevance and severity
      const sortedIssues = relevantIssues.sort((a, b) => {
        // Prioritize critical and high severity issues
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aSeverity = severityOrder[a.severity] || 1;
        const bSeverity = severityOrder[b.severity] || 1;
        
        if (aSeverity !== bSeverity) {
          return bSeverity - aSeverity;
        }
        
        // Then by ticket count (impact)
        return b.ticketCount - a.ticketCount;
      });

      // Generate recommendation based on the most relevant issue only
      console.log('🔍 Relevant issues found:', sortedIssues.slice(0, 3));
      
      if (sortedIssues.length === 0) {
        console.log('⚠️ No relevant issues found');
        return [];
      }
      
      // Take only the top issue (most relevant)
      const topIssue = sortedIssues[0];
      const recommendation = this.generateIssueBasedRecommendation(topIssue, conversationText, conversationHistory);
      console.log('📝 Generated recommendation for top issue:', topIssue.title, recommendation);
      
      const recommendations = recommendation ? [recommendation] : [];
      console.log('✅ Final recommendations (single):', recommendations);
      return recommendations;
    } catch (error) {
      console.error('Error getting issue-based recommendations:', error);
      return [];
    }
  }

  buildConversationContext(currentMessage, conversationHistory) {
    // Combine current message with recent conversation history
    const recentMessages = conversationHistory.slice(-6); // Last 6 messages
    const conversationText = recentMessages.map(msg => msg.content).join(' ');
    
    return `${currentMessage} ${conversationText}`.toLowerCase();
  }

  conversationMatchesIssue(conversationText, issue) {
    // Check if the conversation context matches the issue
    const issueKeywords = [
      issue.title,
      issue.description,
      issue.rootCause,
      ...(issue.recommendations || [])
    ].join(' ').toLowerCase();

    // Check for keyword overlap with higher threshold for conversation matching
    const conversationWords = new Set(conversationText.split(/\s+/));
    const issueWords = new Set(issueKeywords.split(/\s+/));
    
    const intersection = new Set([...conversationWords].filter(x => issueWords.has(x)));
    const union = new Set([...conversationWords, ...issueWords]);
    
    const overlapRatio = intersection.size / union.size;
    const matches = overlapRatio > 0.2;
    
    console.log(`📊 Conversation matching for "${issue.title}":`, {
      conversationText: conversationText.substring(0, 100) + '...',
      issueKeywords: issueKeywords.substring(0, 100) + '...',
      intersection: Array.from(intersection),
      overlapRatio: overlapRatio.toFixed(3),
      threshold: 0.2,
      matches
    });
    
    return matches;
  }

  categorizeMessage(message) {
    const text = message.toLowerCase();
    
    // Supply chain categories mapping
    const categories = {
      'inventory': ['out of stock', 'unavailable', 'backorder', 'inventory', 'stock', 'sold out'],
      'logistics': ['shipping', 'delivery', 'transit', 'carrier', 'tracking', 'logistics', 'transport'],
      'fulfillment': ['order processing', 'fulfillment', 'packing', 'picking', 'warehouse'],
      'payment': ['payment', 'billing', 'charge', 'refund', 'transaction', 'credit card'],
      'quality': ['defective', 'damaged', 'quality', 'broken', 'faulty', 'poor quality'],
      'customer_service': ['support', 'service', 'response', 'communication', 'agent'],
      'technology': ['website', 'app', 'system', 'technical', 'bug', 'error', 'glitch']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  messageMatchesIssueKeywords(message, issue) {
    const messageText = message.toLowerCase();
    const issueKeywords = [
      issue.title,
      issue.description,
      issue.rootCause,
      ...(issue.recommendations || [])
    ].join(' ').toLowerCase();

    // Check for keyword overlap
    const messageWords = new Set(messageText.split(/\s+/));
    const issueWords = new Set(issueKeywords.split(/\s+/));
    
    const intersection = new Set([...messageWords].filter(x => issueWords.has(x)));
    const union = new Set([...messageWords, ...issueWords]);
    
    const overlapRatio = intersection.size / union.size;
    const matches = overlapRatio > 0.1;
    
    console.log(`📊 Message matching for "${issue.title}":`, {
      messageText: messageText.substring(0, 100) + '...',
      issueKeywords: issueKeywords.substring(0, 100) + '...',
      intersection: Array.from(intersection),
      overlapRatio: overlapRatio.toFixed(3),
      threshold: 0.1,
      matches
    });
    
    return matches;
  }

  generateIssueBasedRecommendation(issue, conversationText, conversationHistory = []) {
    const severityColors = {
      'critical': 'danger',
      'high': 'warning', 
      'medium': 'info',
      'low': 'success'
    };

    const severityIcons = {
      'critical': 'exclamation-triangle',
      'high': 'exclamation-circle',
      'medium': 'info-circle',
      'low': 'check-circle'
    };

    // Generate contextual recommendation based on issue
    let recommendation = '';
    let action = '';

    switch (issue.severity) {
      case 'critical':
        recommendation = `🚨 Critical Issue Alert: ${issue.title}`;
        action = 'Immediate escalation recommended';
        break;
      case 'high':
        recommendation = `⚠️ High Priority Issue: ${issue.title}`;
        action = 'Consider escalating to management';
        break;
      case 'medium':
        recommendation = `ℹ️ Related Issue: ${issue.title}`;
        action = 'Monitor for similar patterns';
        break;
      default:
        recommendation = `📋 Issue Reference: ${issue.title}`;
        action = 'Keep in mind for future reference';
    }

    return {
      type: 'issue_based',
      severity: issue.severity,
      category: issue.category,
      title: recommendation,
      description: issue.description.substring(0, 150) + '...',
      rootCause: issue.rootCause,
      recommendations: issue.recommendations.slice(0, 2), // Top 2 recommendations
      action: action,
      impact: issue.impact,
      affectedTickets: issue.ticketCount,
      color: severityColors[issue.severity] || 'info',
      icon: severityIcons[issue.severity] || 'info-circle',
      priority: issue.severity === 'critical' ? 1 : issue.severity === 'high' ? 2 : 3
    };
  }

  buildSystemPrompt(context) {
    let systemPrompt = `You are a helpful customer support agent for an e-commerce platform. 
    Your role is to assist customers with their inquiries professionally and efficiently.
    
    Guidelines:
    - Be polite, empathetic, and professional
    - Provide accurate and helpful information
    - If you don't know something, offer to connect them with a human agent
    - Keep responses concise but comprehensive
    - Use the customer's name when available
    - Reference order information when relevant`;

    if (context.customer) {
      systemPrompt += `\n\nCustomer Information:
      - Name: ${context.customer.name}
      - Email: ${context.customer.email}
      - Customer Tier: ${context.customer.customerTier}`;
    }

    if (context.orderHistory && context.orderHistory.length > 0) {
      systemPrompt += `\n\nRecent Orders:
      ${context.orderHistory.map(order => 
        `- Order ${order.orderId}: ${order.status} (${order.orderDate})`
      ).join('\n')}`;
    }

    if (context.cartItems && context.cartItems.length > 0) {
      systemPrompt += `\n\nCurrent Cart:
      ${context.cartItems.map(item => 
        `- ${item.productName} (Qty: ${item.quantity})`
      ).join('\n')}`;
    }

    return systemPrompt;
  }

  getFallbackResponse(prompt, context) {
    console.log('🧠 Using LOCAL INTELLIGENT response (not generic fallback)');
    
    // Check if this is a request for response suggestions
    if (prompt.includes('provide 3 different response suggestions') || prompt.includes('Format as JSON array')) {
      return this.generateFallbackResponseSuggestions(prompt, context);
    }
    
    // Get conversation history to make contextual responses
    const conversation = this.getConversation(context.sessionId) || { messages: [] };
    const messageHistory = conversation.messages || [];
    
    // If this is the first message, use initial customer complaints
    if (messageHistory.length === 0) {
      const initialResponses = [
        "Hi, I'm having trouble with my order. Can you help me?",
        "I ordered something 3 days ago but haven't received any tracking info. What's going on?",
        "The item I received is completely different from what I ordered. This is ridiculous!",
        "I need to return this item but I can't find the return label. Can you help?",
        "My package says delivered but I never got it. Where is it?",
        "I want to cancel my order but it's already shipped. What can I do?",
        "The quality of this product is terrible. I want a refund immediately.",
        "I've been waiting for my order for over a week. This is unacceptable!",
        "Can you tell me when my order will arrive? I need it by Friday.",
        "I'm not happy with this purchase. How do I return it?"
      ];
      return initialResponses[Math.floor(Math.random() * initialResponses.length)];
    }
    
    // Analyze the last agent message to respond contextually
    const lastAgentMessage = messageHistory.filter(msg => msg.role === 'user').pop();
    const conversationLength = messageHistory.length;
    
    if (lastAgentMessage) {
      const lastMessage = lastAgentMessage.content.toLowerCase();
      
      // Respond to apologies
      if (lastMessage.includes('apologize') || lastMessage.includes('sorry')) {
        const apologyResponses = [
          "I appreciate the apology, but I still need this resolved. What are you going to do about it?",
          "Thank you for apologizing, but that doesn't fix my problem. I need a solution now.",
          "I understand you're sorry, but I'm still frustrated. Can you actually help me?",
          "Apology accepted, but I need this issue fixed. What's your plan?",
          "I appreciate that, but I'm still not happy with this situation. What's next?"
        ];
        return apologyResponses[Math.floor(Math.random() * apologyResponses.length)];
      }
      
      // Respond to investigation offers
      if (lastMessage.includes('investigate') || lastMessage.includes('check')) {
        const investigationResponses = [
          "Okay, please investigate quickly. I need this resolved today.",
          "That's fine, but how long will this take? I can't wait forever.",
          "Good, please look into it. I'll be waiting for your update.",
          "I hope you find something soon. This is taking too long.",
          "Please investigate thoroughly. I want to know exactly what went wrong."
        ];
        return investigationResponses[Math.floor(Math.random() * investigationResponses.length)];
      }
      
      // Respond to refund offers
      if (lastMessage.includes('refund')) {
        const refundResponses = [
          "Yes, I want a full refund. When will I get my money back?",
          "A refund is fine, but I'm still disappointed with this experience.",
          "Thank you for offering a refund. Please process it quickly.",
          "I'll take the refund, but this has been a terrible experience.",
          "Yes, refund me. I don't want to deal with this anymore."
        ];
        return refundResponses[Math.floor(Math.random() * refundResponses.length)];
      }
      
      // Respond to replacement offers
      if (lastMessage.includes('replacement') || lastMessage.includes('replace')) {
        const replacementResponses = [
          "A replacement would be great, but make sure it's the right item this time.",
          "I'll take a replacement, but I want it shipped immediately.",
          "That works, but I need it by Friday. Can you guarantee that?",
          "Fine, send a replacement, but I'm not paying for return shipping.",
          "A replacement is okay, but this better not happen again."
        ];
        return replacementResponses[Math.floor(Math.random() * replacementResponses.length)];
      }
      
      // Respond to tracking info
      if (lastMessage.includes('tracking') || lastMessage.includes('track')) {
        const trackingResponses = [
          "Thank you for the tracking info. I'll keep an eye on it.",
          "Good, I can see it's moving. When will it arrive?",
          "I got the tracking number. It's still not moving though.",
          "Thanks for the tracking. I hope it gets here soon.",
          "I see the tracking info. It's been stuck in the same place for days."
        ];
        return trackingResponses[Math.floor(Math.random() * trackingResponses.length)];
      }
      
      // Respond to escalation offers
      if (lastMessage.includes('manager') || lastMessage.includes('supervisor') || lastMessage.includes('escalate')) {
        const escalationResponses = [
          "Yes, please get your manager. I need someone who can actually help.",
          "Good, I want to speak to someone with more authority.",
          "That's fine, but make sure they call me back today.",
          "I'll talk to your manager, but this should have been resolved already.",
          "Please escalate this. I'm tired of going in circles."
        ];
        return escalationResponses[Math.floor(Math.random() * escalationResponses.length)];
      }
      
      // Respond to thank you messages
      if (lastMessage.includes('thank') || lastMessage.includes('appreciate')) {
        const thankYouResponses = [
          "You're welcome, but I still need this issue resolved.",
          "No problem, but I hope this doesn't happen again.",
          "You're welcome. I appreciate your help.",
          "Thanks for acknowledging that. Now let's fix this.",
          "I appreciate that. I just want this resolved quickly."
        ];
        return thankYouResponses[Math.floor(Math.random() * thankYouResponses.length)];
      }
    }
    
    // If conversation is getting long, show increasing frustration or satisfaction
    if (conversationLength > 6) {
      const longConversationResponses = [
        "This is taking way too long. I've been talking to you for a while now.",
        "I'm getting frustrated. This should have been resolved by now.",
        "How much longer is this going to take? I have other things to do.",
        "I'm losing patience. Can we wrap this up soon?",
        "This conversation is going in circles. I need a real solution."
      ];
      return longConversationResponses[Math.floor(Math.random() * longConversationResponses.length)];
    }
    
    // Default contextual responses
    const defaultResponses = [
      "I understand, but I still need this resolved.",
      "That's helpful, but what about my original issue?",
      "I see, but I'm still not satisfied with this solution.",
      "Okay, but I want to make sure this is handled properly.",
      "I appreciate that, but I need more information."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  generateFallbackResponseSuggestions(prompt, context) {
    // Extract customer message from prompt
    const customerMessageMatch = prompt.match(/Customer message: "([^"]+)"/);
    if (!customerMessageMatch) {
      return JSON.stringify([
        {
          tone: "professional",
          response: "Thank you for contacting us. I understand your concern and I'm here to help you resolve this issue."
        },
        {
          tone: "friendly",
          response: "Hi there! Thanks for reaching out. I'd be happy to help you with this. Let me look into it for you."
        },
        {
          tone: "empathetic",
          response: "I'm sorry to hear about this issue. I understand how frustrating this must be, and I want to help you get this resolved quickly."
        }
      ]);
    }

    const customerMessage = customerMessageMatch[1].toLowerCase();
    
    // Generate contextual response suggestions based on customer message
    let suggestions = [];
    
    if (customerMessage.includes('refund') || customerMessage.includes('return')) {
      suggestions = [
        {
          tone: "professional",
          response: "I understand you'd like to process a refund. Let me help you with that right away. Could you please provide your order number?"
        },
        {
          tone: "friendly", 
          response: "No problem at all! I'd be happy to help you with your refund. Let me get your order details and process this for you."
        },
        {
          tone: "empathetic",
          response: "I'm sorry this purchase didn't work out for you. I completely understand wanting a refund, and I'll make sure this gets processed quickly for you."
        }
      ];
    } else if (customerMessage.includes('broken') || customerMessage.includes('defective') || customerMessage.includes('not working')) {
      suggestions = [
        {
          tone: "professional",
          response: "I'm sorry to hear about the issue with your product. Let me help you troubleshoot this and find a solution."
        },
        {
          tone: "friendly",
          response: "Oh no! That's definitely not what we want for you. Let me help you get this sorted out right away."
        },
        {
          tone: "empathetic", 
          response: "I'm really sorry this happened. I know how frustrating it is when something doesn't work as expected. Let me help you resolve this."
        }
      ];
    } else if (customerMessage.includes('shipping') || customerMessage.includes('delivery') || customerMessage.includes('tracking')) {
      suggestions = [
        {
          tone: "professional",
          response: "I'd be happy to help you with your shipping inquiry. Let me check the status of your order and provide you with the latest information."
        },
        {
          tone: "friendly",
          response: "Great question about shipping! Let me look up your order and give you all the details about where your package is."
        },
        {
          tone: "empathetic",
          response: "I understand you're eager to know about your order status. Let me check on that for you right away and get you the information you need."
        }
      ];
    } else {
      // Generic fallback responses
      suggestions = [
        {
          tone: "professional",
          response: "Thank you for contacting us. I understand your concern and I'm here to help you resolve this issue."
        },
        {
          tone: "friendly",
          response: "Hi there! Thanks for reaching out. I'd be happy to help you with this. Let me look into it for you."
        },
        {
          tone: "empathetic",
          response: "I'm sorry to hear about this issue. I understand how frustrating this must be, and I want to help you get this resolved quickly."
        }
      ];
    }
    
    return JSON.stringify(suggestions);
  }

  async analyzeTicketSentiment(ticketContent, conversationHistory = []) {
    try {
      console.log('🔍 Starting enhanced sentiment analysis...');
      
      // Use AI for more accurate sentiment analysis when available
      if (process.env.GEMINI_API_KEY || process.env.MISTRAL_API_KEY || process.env.OPENAI_API_KEY) {
        console.log('🤖 Using AI for sentiment analysis');
        
        const conversationContext = this.buildConversationContextForAnalysis(conversationHistory);
        const customerProfile = this.buildCustomerProfile(conversationHistory);
        
        const prompt = `You are an expert customer service sentiment analyst. Analyze this customer support interaction with high accuracy.

CURRENT MESSAGE: "${ticketContent}"

CONVERSATION CONTEXT:
${conversationContext}

CUSTOMER PROFILE:
${customerProfile}

ANALYSIS REQUIREMENTS:
1. Sentiment: Determine if the customer is positive, neutral, or negative
2. Urgency: Assess urgency level (low/medium/high/urgent) based on content and context
3. Emotions: Identify specific emotions expressed (anger, frustration, satisfaction, confusion, etc.)
4. Confidence: Rate analysis confidence based on clarity of indicators
5. Context: Consider conversation history and escalation patterns

RESPOND IN THIS EXACT JSON FORMAT (NO MARKDOWN, NO CODE BLOCKS, JUST RAW JSON):
{
  "sentiment": "positive|neutral|negative",
  "sentimentScore": -1.0 to 1.0,
  "urgency": "low|medium|high|urgent",
  "urgencyScore": 0.0 to 1.0,
  "emotions": ["emotion1", "emotion2", "emotion3"],
  "confidence": "high|medium|low",
  "reasoning": "Detailed explanation of your analysis",
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"],
  "escalationRisk": "low|medium|high",
  "customerSatisfaction": "satisfied|neutral|dissatisfied|very_dissatisfied"
}

CRITICAL: Return ONLY the JSON object, no additional text, no markdown formatting, no explanations outside the JSON.

IMPORTANT: Be very precise and consider:
- Emotional intensity indicators (caps, exclamations, strong words)
- Time-sensitive language ("urgent", "asap", "today", "immediately")
- Financial impact mentions ("refund", "charge", "money", "cost")
- Escalation indicators ("manager", "supervisor", "complaint", "legal")
- Conversation length and previous interactions
- Resolution attempts and customer patience level`;

      const response = await this.generateResponse(prompt);
        
        try {
          // Clean the response - remove markdown code blocks if present
          let cleanResponse = response.trim();
          
          // Remove markdown code block formatting
          if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.substring(7);
          }
          if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.substring(3);
          }
          if (cleanResponse.endsWith('```')) {
            cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
          }
          
          cleanResponse = cleanResponse.trim();
          console.log('🧹 Cleaned AI response:', cleanResponse);
          
          const analysis = JSON.parse(cleanResponse);
          console.log('✅ AI sentiment analysis completed');
          
          // Validate and enhance the AI analysis
          const validatedAnalysis = this.validateAndEnhanceAIAnalysis(analysis, ticketContent, conversationHistory);
          return this.enhanceSentimentAnalysis(validatedAnalysis, ticketContent, conversationHistory);
        } catch (parseError) {
          console.log('❌ AI response parsing failed, using enhanced fallback');
          console.log('Parse error:', parseError.message);
          console.log('Raw AI response:', response);
          return this.analyzeEnhancedSentiment(ticketContent, conversationHistory);
        }
      } else {
        console.log('🧠 Using enhanced local sentiment analysis');
        return this.analyzeEnhancedSentiment(ticketContent, conversationHistory);
      }
    } catch (error) {
      console.error('❌ Sentiment analysis error:', error);
      return this.analyzeEnhancedSentiment(ticketContent, conversationHistory);
    }
  }

  buildConversationContextForAnalysis(conversationHistory) {
    if (conversationHistory.length === 0) {
      return "This is the first message in the conversation.";
    }

    const recentMessages = conversationHistory.slice(-6); // Last 6 messages for context
    let context = "Recent conversation flow:\n";
    
    recentMessages.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'Agent' : 'Customer';
      const truncatedContent = msg.content.length > 100 
        ? msg.content.substring(0, 100) + '...' 
        : msg.content;
      context += `${index + 1}. ${role}: ${truncatedContent}\n`;
    });

    // Add conversation metrics
    const totalMessages = conversationHistory.length;
    const customerMessages = conversationHistory.filter(msg => msg.role === 'assistant').length;
    const agentMessages = conversationHistory.filter(msg => msg.role === 'user').length;
    
    context += `\nConversation metrics:\n`;
    context += `- Total messages: ${totalMessages}\n`;
    context += `- Customer messages: ${customerMessages}\n`;
    context += `- Agent messages: ${agentMessages}\n`;
    
    // Check for escalation indicators
    const escalationCount = this.detectEscalationIndicators(recentMessages);
    if (escalationCount > 0) {
      context += `- Escalation indicators: ${escalationCount} mentions of management/escalation\n`;
    }

    return context;
  }

  buildCustomerProfile(conversationHistory) {
    if (conversationHistory.length === 0) {
      return "New customer - no previous interaction history.";
    }

    const customerMessages = conversationHistory.filter(msg => msg.role === 'assistant');
    if (customerMessages.length === 0) {
      return "No customer messages in conversation history.";
    }

    let profile = "Customer interaction profile:\n";
    
    // Analyze customer communication style
    const avgMessageLength = customerMessages.reduce((sum, msg) => sum + msg.content.length, 0) / customerMessages.length;
    profile += `- Average message length: ${Math.round(avgMessageLength)} characters\n`;
    
    // Check for politeness indicators
    const politenessWords = ['please', 'thank you', 'thanks', 'appreciate', 'sorry', 'excuse me'];
    const politenessCount = customerMessages.reduce((count, msg) => {
      const text = msg.content.toLowerCase();
      return count + politenessWords.filter(word => text.includes(word)).length;
    }, 0);
    
    if (politenessCount > 2) {
      profile += `- Communication style: Polite and respectful\n`;
    } else if (politenessCount === 0) {
      profile += `- Communication style: Direct, less formal\n`;
    } else {
      profile += `- Communication style: Mixed politeness levels\n`;
    }

    // Analyze emotional progression
    const sentimentProgression = customerMessages.map(msg => {
      const analysis = this.performAdvancedSentimentAnalysis(msg.content.toLowerCase(), msg.content);
      return analysis.sentiment;
    });
    
    const recentSentiment = sentimentProgression.slice(-3);
    const sentimentTrend = this.analyzeSentimentTrend(recentSentiment);
    profile += `- Recent sentiment trend: ${sentimentTrend}\n`;

    // Check for repeated issues
    const issueKeywords = ['problem', 'issue', 'wrong', 'broken', 'not working', 'error', 'bug'];
    const issueCount = customerMessages.reduce((count, msg) => {
      const text = msg.content.toLowerCase();
      return count + issueKeywords.filter(keyword => text.includes(keyword)).length;
    }, 0);
    
    if (issueCount > 3) {
      profile += `- Issue persistence: Multiple issues mentioned - customer may be frustrated\n`;
    }

    return profile;
  }

  analyzeSentimentTrend(sentiments) {
    if (sentiments.length < 2) return "insufficient data";
    
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    const neutralCount = sentiments.filter(s => s === 'neutral').length;
    
    if (negativeCount > positiveCount && negativeCount > neutralCount) {
      return "declining - becoming more negative";
    } else if (positiveCount > negativeCount && positiveCount > neutralCount) {
      return "improving - becoming more positive";
    } else {
      return "stable - no clear trend";
    }
  }

  validateAndEnhanceAIAnalysis(analysis, ticketContent, conversationHistory) {
    // Validate required fields
    const validated = {
      sentiment: this.validateSentiment(analysis.sentiment),
      sentimentScore: this.validateScore(analysis.sentimentScore, -1, 1),
      urgency: this.validateUrgency(analysis.urgency),
      urgencyScore: this.validateScore(analysis.urgencyScore, 0, 1),
      emotions: this.validateEmotions(analysis.emotions),
      confidence: this.validateConfidence(analysis.confidence),
      reasoning: analysis.reasoning || 'AI-generated analysis',
      recommendations: this.validateRecommendations(analysis.recommendations),
      escalationRisk: this.validateEscalationRisk(analysis.escalationRisk),
      customerSatisfaction: this.validateSatisfaction(analysis.customerSatisfaction)
    };

    // Cross-validate sentiment and urgency consistency
    if (validated.sentiment === 'negative' && validated.urgency === 'low') {
      // If sentiment is negative but urgency is low, check for context
      const hasUrgencyIndicators = this.checkUrgencyIndicators(ticketContent);
      if (hasUrgencyIndicators) {
        validated.urgency = 'medium';
        validated.urgencyScore = 0.5;
      }
    }

    // Enhance with local analysis if confidence is low
    if (validated.confidence === 'low') {
      const localAnalysis = this.performAdvancedSentimentAnalysis(ticketContent.toLowerCase(), ticketContent);
      if (Math.abs(localAnalysis.score) > Math.abs(validated.sentimentScore)) {
        validated.sentiment = localAnalysis.sentiment;
        validated.sentimentScore = localAnalysis.score;
        validated.confidence = 'medium';
      }
    }

    return validated;
  }

  validateSentiment(sentiment) {
    const validSentiments = ['positive', 'neutral', 'negative'];
    return validSentiments.includes(sentiment) ? sentiment : 'neutral';
  }

  validateUrgency(urgency) {
    const validUrgencies = ['low', 'medium', 'high', 'urgent'];
    return validUrgencies.includes(urgency) ? urgency : 'low';
  }

  validateScore(score, min, max) {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return (min + max) / 2;
    return Math.max(min, Math.min(max, numScore));
  }

  validateEmotions(emotions) {
    if (!Array.isArray(emotions)) return [];
    
    // Trust AI to provide valid emotions, just clean and limit them
    return emotions
      .filter(emotion => typeof emotion === 'string' && emotion.trim().length > 0)
      .map(emotion => emotion.toLowerCase().trim())
      .slice(0, 5); // Limit to 5 emotions for clean display
  }

  validateConfidence(confidence) {
    const validConfidences = ['high', 'medium', 'low'];
    return validConfidences.includes(confidence) ? confidence : 'medium';
  }

  validateRecommendations(recommendations) {
    if (!Array.isArray(recommendations)) return [];
    return recommendations.filter(rec => typeof rec === 'string' && rec.length > 0).slice(0, 5);
  }

  validateEscalationRisk(risk) {
    const validRisks = ['low', 'medium', 'high'];
    return validRisks.includes(risk) ? risk : 'low';
  }

  validateSatisfaction(satisfaction) {
    const validSatisfactions = ['satisfied', 'neutral', 'dissatisfied', 'very_dissatisfied'];
    return validSatisfactions.includes(satisfaction) ? satisfaction : 'neutral';
  }

  checkUrgencyIndicators(text) {
    const urgencyWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'today', 'now'];
    const lowerText = text.toLowerCase();
    return urgencyWords.some(word => lowerText.includes(word));
  }

  enhanceSentimentAnalysis(aiAnalysis, ticketContent, conversationHistory) {
    // Enhance AI analysis with additional context and validation
    const enhanced = {
      sentiment: aiAnalysis.sentiment || 'neutral',
      sentimentScore: aiAnalysis.sentimentScore || 0,
      urgency: aiAnalysis.urgency || 'low',
      urgencyScore: aiAnalysis.urgencyScore || 0,
      emotions: aiAnalysis.emotions || [],
      confidence: aiAnalysis.confidence || 'medium',
      reasoning: aiAnalysis.reasoning || 'AI-generated analysis',
      recommendations: aiAnalysis.recommendations || [],
      timestamp: new Date().toISOString(),
      messageLength: ticketContent.length,
      conversationLength: conversationHistory.length
    };

    // Add conversation context analysis
    if (conversationHistory.length > 0) {
      enhanced.conversationContext = this.analyzeConversationContext(conversationHistory);
    }

    // Validate and adjust scores if needed
    enhanced.sentimentScore = Math.max(-1, Math.min(1, enhanced.sentimentScore));
    enhanced.urgencyScore = Math.max(0, Math.min(1, enhanced.urgencyScore));

    return enhanced;
  }

  analyzeEnhancedSentiment(content, conversationHistory = []) {
    const text = content.toLowerCase().trim();
    
    // Advanced sentiment analysis with conversation context
    const sentimentAnalysis = this.performAdvancedSentimentAnalysis(text, content);
    const urgencyAnalysis = this.performAdvancedUrgencyAnalysis(text, content);
    const emotionAnalysis = this.detectEmotions(text, content);
    const contextAnalysis = conversationHistory.length > 0 
      ? this.analyzeConversationContext(conversationHistory)
      : null;

    // Calculate confidence based on multiple factors
    const confidence = this.calculateAnalysisConfidence(
      sentimentAnalysis, urgencyAnalysis, emotionAnalysis, content.length
    );

    // Generate contextual reasoning
    const reasoning = this.generateDetailedReasoning(
      sentimentAnalysis, urgencyAnalysis, emotionAnalysis, contextAnalysis, content
    );

    // Generate actionable recommendations
    const recommendations = this.generateRecommendations(
      sentimentAnalysis, urgencyAnalysis, emotionAnalysis, contextAnalysis
    );

    return {
      sentiment: sentimentAnalysis.sentiment,
      sentimentScore: sentimentAnalysis.score,
      urgency: urgencyAnalysis.urgency,
      urgencyScore: urgencyAnalysis.score,
      emotions: emotionAnalysis.emotions,
      confidence: confidence,
      reasoning: reasoning,
      recommendations: recommendations,
      timestamp: new Date().toISOString(),
      messageLength: content.length,
      conversationLength: conversationHistory.length,
      conversationContext: contextAnalysis
    };
  }

  performAdvancedSentimentAnalysis(text, content) {
    // Enhanced sentiment patterns with more nuanced detection
    const sentimentPatterns = {
      // Strong positive indicators (weight: 3)
      strongPositive: [
        'excellent', 'outstanding', 'amazing', 'fantastic', 'brilliant', 'perfect', 'wonderful',
        'love it', 'love this', 'highly recommend', 'best ever', 'exactly what i wanted',
        'exceeded expectations', 'beyond expectations', 'absolutely perfect', 'incredible',
        'phenomenal', 'spectacular', 'superb', 'magnificent', 'exceptional', 'delighted',
        'thrilled', 'ecstatic', 'overjoyed', 'impressed', 'pleased', 'satisfied',
        'thank you so much', 'greatly appreciated', 'excellent service', 'top notch'
      ],
      // Moderate positive indicators (weight: 2)
      moderatePositive: [
        'good', 'great', 'nice', 'happy', 'satisfied', 'pleased', 'like', 'enjoy',
        'thank you', 'thanks', 'appreciate', 'helpful', 'useful', 'works well',
        'quality', 'worth it', 'recommend', 'impressed', 'pleased with', 'content',
        'acceptable', 'reasonable', 'fair', 'adequate', 'decent'
      ],
      // Weak positive indicators (weight: 1)
      weakPositive: [
        'ok', 'okay', 'fine', 'alright', 'not bad', 'could be better', 'it works',
        'functional', 'basic', 'standard', 'normal', 'average'
      ],
      // Strong negative indicators (weight: 3)
      strongNegative: [
        'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'despise', 'loathe',
        'worst ever', 'complete waste', 'absolutely terrible', 'unacceptable',
        'outraged', 'furious', 'livid', 'disgusted', 'appalled', 'shocked',
        'ridiculous', 'absurd', 'pathetic', 'useless', 'garbage', 'trash',
        'nightmare', 'disaster', 'catastrophe', 'unbelievable', 'inexcusable'
      ],
      // Moderate negative indicators (weight: 2)
      moderateNegative: [
        'bad', 'poor', 'disappointed', 'frustrated', 'annoyed', 'upset', 'mad',
        'angry', 'unhappy', 'unsatisfied', 'not good', 'not working', 'broken',
        'defective', 'faulty', 'problem', 'issue', 'complaint', 'wrong',
        'incorrect', 'mistake', 'error', 'failed', 'failure', 'concerned',
        'worried', 'displeased', 'dissatisfied', 'bothered', 'troubled'
      ],
      // Weak negative indicators (weight: 1)
      weakNegative: [
        'not great', 'not ideal', 'not perfect', 'questionable', 'uncertain',
        'hesitant', 'reluctant', 'skeptical', 'doubtful', 'unclear'
      ]
    };

    // Calculate weighted scores
    let positiveScore = 0;
    let negativeScore = 0;

    Object.entries(sentimentPatterns).forEach(([category, words]) => {
      const weight = category.includes('strong') ? 3 : category.includes('moderate') ? 2 : 1;
      words.forEach(word => {
        if (text.includes(word)) {
          if (category.includes('positive')) {
            positiveScore += weight;
          } else if (category.includes('negative')) {
            negativeScore += weight;
          }
        }
      });
    });

    // Apply intensity modifiers
    const intensityModifiers = {
      very: 1.5, really: 1.5, extremely: 2, absolutely: 2, completely: 1.5,
      totally: 1.5, quite: 1.2, somewhat: 0.8, slightly: 0.6, barely: 0.4,
      incredibly: 2, amazingly: 2, surprisingly: 1.3, unexpectedly: 1.3
    };

    Object.entries(intensityModifiers).forEach(([modifier, multiplier]) => {
      if (text.includes(modifier)) {
        positiveScore *= multiplier;
        negativeScore *= multiplier;
      }
    });

    // Check for emotional intensity indicators
    const exclamationCount = (content.match(/!/g) || []).length;
    const capsCount = (content.match(/[A-Z]{3,}/g) || []).length;
    const emotionalIntensity = exclamationCount + capsCount;
    
    if (emotionalIntensity > 0) {
      const intensityBoost = emotionalIntensity * 0.3;
      if (positiveScore > negativeScore) {
        positiveScore += intensityBoost;
      } else if (negativeScore > positiveScore) {
        negativeScore += intensityBoost;
      }
    }

    // Handle negation patterns
    this.handleNegationPatterns(text, positiveScore, negativeScore);

    // Calculate final sentiment
    const sentimentDiff = positiveScore - negativeScore;
    let sentiment = 'neutral';
    let score = 0;

    if (sentimentDiff > 1.5) {
      sentiment = 'positive';
      score = Math.min(1, sentimentDiff / 10);
    } else if (sentimentDiff < -1.5) {
      sentiment = 'negative';
      score = Math.max(-1, sentimentDiff / 10);
    } else {
      sentiment = 'neutral';
      score = 0;
    }

    return {
      sentiment,
      score: Math.round(score * 100) / 100,
      positiveScore: Math.round(positiveScore * 100) / 100,
      negativeScore: Math.round(negativeScore * 100) / 100,
      emotionalIntensity
    };
  }

  performAdvancedUrgencyAnalysis(text, content) {
    // Enhanced urgency patterns with contextual understanding
    const urgencyPatterns = {
      // Critical urgency (weight: 4)
      critical: [
        'emergency', 'urgent', 'asap', 'immediately', 'right now', 'critical',
        'desperate', 'help me now', 'can\'t wait', 'life or death', 'serious problem',
        '911', 'call me now', 'emergency situation', 'critical issue', 'urgent help needed',
        'time sensitive', 'deadline', 'expires today', 'last minute'
      ],
      // High urgency (weight: 3)
      high: [
        'refund', 'cancel', 'return', 'broken', 'damaged', 'not working',
        'fraud', 'scam', 'stolen', 'missing', 'lost', 'legal action',
        'sue', 'complaint', 'escalate', 'manager', 'supervisor', 'ceo',
        'chargeback', 'dispute', 'unauthorized', 'hacked', 'compromised',
        'urgent', 'important', 'priority', 'asap', 'soon', 'today'
      ],
      // Medium urgency (weight: 2)
      medium: [
        'need help', 'problem', 'issue', 'concerned', 'worried', 'question',
        'inquiry', 'status update', 'check', 'verify', 'confirm',
        'this week', 'by friday', 'next week', 'soon', 'when possible'
      ],
      // Low urgency (weight: 1)
      low: [
        'when possible', 'no rush', 'just wondering', 'curious', 'information',
        'general question', 'future', 'planning', 'someday', 'eventually',
        'when you have time', 'no hurry', 'take your time'
      ]
    };

    let urgencyScore = 0;

    Object.entries(urgencyPatterns).forEach(([level, words]) => {
      const weight = level === 'critical' ? 4 : level === 'high' ? 3 : level === 'medium' ? 2 : 1;
      words.forEach(word => {
        if (text.includes(word)) {
          urgencyScore += weight;
        }
      });
    });

    // Check for time-sensitive indicators
    const timeIndicators = [
      'today', 'tomorrow', 'this week', 'by friday', 'deadline', 'expires',
      'time sensitive', 'urgent', 'asap', 'immediately', 'right now'
    ];
    
    const timeSensitive = timeIndicators.some(indicator => text.includes(indicator));
    if (timeSensitive) {
      urgencyScore += 2;
    }

    // Check for financial impact indicators
    const financialIndicators = [
      'money', 'payment', 'charge', 'bill', 'cost', 'price', 'expensive',
      'refund', 'cancel', 'dispute', 'fraud', 'unauthorized'
    ];
    
    const hasFinancialImpact = financialIndicators.some(indicator => text.includes(indicator));
    if (hasFinancialImpact) {
      urgencyScore += 1.5;
    }

    // Determine urgency level
    let urgency = 'low';
    let score = 0;

    if (urgencyScore >= 8) {
      urgency = 'urgent';
      score = Math.min(1, urgencyScore / 12);
    } else if (urgencyScore >= 5) {
      urgency = 'high';
      score = Math.min(1, urgencyScore / 8);
    } else if (urgencyScore >= 2) {
      urgency = 'medium';
      score = Math.min(1, urgencyScore / 5);
    } else {
      urgency = 'low';
      score = Math.min(1, urgencyScore / 2);
    }

    return {
      urgency,
      score: Math.round(score * 100) / 100,
      rawScore: urgencyScore,
      timeSensitive,
      hasFinancialImpact
    };
  }

  detectEmotions(text, content) {
    const emotionPatterns = {
      anger: ['angry', 'mad', 'furious', 'livid', 'rage', 'outraged', 'irate', 'fuming'],
      frustration: ['frustrated', 'annoyed', 'bothered', 'irritated', 'exasperated', 'fed up'],
      disappointment: ['disappointed', 'let down', 'disillusioned', 'disheartened', 'discouraged'],
      confusion: ['confused', 'unclear', 'puzzled', 'bewildered', 'lost', 'don\'t understand'],
      worry: ['worried', 'concerned', 'anxious', 'nervous', 'stressed', 'uneasy'],
      satisfaction: ['satisfied', 'pleased', 'content', 'happy', 'delighted', 'thrilled'],
      gratitude: ['thankful', 'grateful', 'appreciative', 'thanks', 'thank you'],
      excitement: ['excited', 'thrilled', 'enthusiastic', 'eager', 'pumped', 'stoked'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected', 'wow'],
      embarrassment: ['embarrassed', 'ashamed', 'humiliated', 'mortified', 'awkward']
    };

    const detectedEmotions = [];
    const emotionScores = {};

    Object.entries(emotionPatterns).forEach(([emotion, patterns]) => {
      let score = 0;
      patterns.forEach(pattern => {
        if (text.includes(pattern)) {
          score += 1;
        }
      });
      
      if (score > 0) {
        detectedEmotions.push(emotion);
        emotionScores[emotion] = score;
      }
    });

    // Sort emotions by intensity
    const sortedEmotions = detectedEmotions.sort((a, b) => emotionScores[b] - emotionScores[a]);

    return {
      emotions: sortedEmotions.slice(0, 3), // Top 3 emotions
      emotionScores,
      primaryEmotion: sortedEmotions[0] || 'neutral'
    };
  }

  analyzeConversationContext(conversationHistory) {
    if (conversationHistory.length === 0) return null;

    const recentMessages = conversationHistory.slice(-5);
    const customerMessages = recentMessages.filter(msg => msg.role === 'assistant');
    const agentMessages = recentMessages.filter(msg => msg.role === 'user');

    // Analyze conversation flow
    const conversationLength = conversationHistory.length;
    const responseTime = this.calculateAverageResponseTime(recentMessages);
    const escalationIndicators = this.detectEscalationIndicators(recentMessages);
    const resolutionAttempts = this.countResolutionAttempts(recentMessages);

    return {
      conversationLength,
      responseTime,
      escalationIndicators,
      resolutionAttempts,
      customerMessageCount: customerMessages.length,
      agentMessageCount: agentMessages.length,
      conversationTone: this.analyzeConversationTone(recentMessages)
    };
  }

  calculateAnalysisConfidence(sentimentAnalysis, urgencyAnalysis, emotionAnalysis, messageLength) {
    let confidence = 'medium';

    // Factors that increase confidence
    const strongIndicators = sentimentAnalysis.emotionalIntensity > 2;
    const clearSentiment = Math.abs(sentimentAnalysis.score) > 0.3;
    const clearUrgency = urgencyAnalysis.rawScore > 3;
    const multipleEmotions = emotionAnalysis.emotions.length > 1;
    const adequateLength = messageLength > 20;

    const confidenceFactors = [strongIndicators, clearSentiment, clearUrgency, multipleEmotions, adequateLength];
    const confidenceScore = confidenceFactors.filter(Boolean).length;

    if (confidenceScore >= 4) {
      confidence = 'high';
    } else if (confidenceScore >= 2) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return confidence;
  }

  generateDetailedReasoning(sentimentAnalysis, urgencyAnalysis, emotionAnalysis, contextAnalysis, content) {
    let reasoning = `Analysis of ${content.length} character message: `;

    // Sentiment reasoning
    if (sentimentAnalysis.sentiment === 'positive') {
      reasoning += `Positive sentiment detected (score: +${sentimentAnalysis.score.toFixed(2)}). `;
    } else if (sentimentAnalysis.sentiment === 'negative') {
      reasoning += `Negative sentiment detected (score: ${sentimentAnalysis.score.toFixed(2)}). `;
    } else {
      reasoning += `Neutral sentiment (mixed signals: +${sentimentAnalysis.positiveScore.toFixed(1)}/-${sentimentAnalysis.negativeScore.toFixed(1)}). `;
    }

    // Urgency reasoning
    reasoning += `Urgency level: ${urgencyAnalysis.urgency} (score: ${urgencyAnalysis.rawScore}). `;
    if (urgencyAnalysis.timeSensitive) {
      reasoning += 'Time-sensitive indicators detected. ';
    }
    if (urgencyAnalysis.hasFinancialImpact) {
      reasoning += 'Financial impact indicators present. ';
    }

    // Emotion reasoning
    if (emotionAnalysis.emotions.length > 0) {
      reasoning += `Primary emotions: ${emotionAnalysis.emotions.join(', ')}. `;
    }

    // Context reasoning
    if (contextAnalysis) {
      reasoning += `Conversation context: ${contextAnalysis.conversationLength} messages, ${contextAnalysis.escalationIndicators} escalation indicators. `;
    }

    // Emotional intensity
    if (sentimentAnalysis.emotionalIntensity > 0) {
      reasoning += `High emotional intensity detected (${sentimentAnalysis.emotionalIntensity} indicators). `;
    }

    return reasoning.trim();
  }

  generateRecommendations(sentimentAnalysis, urgencyAnalysis, emotionAnalysis, contextAnalysis) {
    const recommendations = [];

    // Urgency-based recommendations
    if (urgencyAnalysis.urgency === 'urgent') {
      recommendations.push('Immediate response required - prioritize this ticket');
      recommendations.push('Consider escalating to senior agent or supervisor');
      recommendations.push('Provide frequent status updates to customer');
    } else if (urgencyAnalysis.urgency === 'high') {
      recommendations.push('Respond within 2 hours during business hours');
      recommendations.push('Consider proactive communication if resolution takes time');
    }

    // Sentiment-based recommendations
    if (sentimentAnalysis.sentiment === 'negative') {
      recommendations.push('Use empathetic and understanding tone');
      recommendations.push('Acknowledge customer\'s frustration');
      recommendations.push('Focus on quick resolution');
    } else if (sentimentAnalysis.sentiment === 'positive') {
      recommendations.push('Maintain positive rapport');
      recommendations.push('Thank customer for their patience');
    }

    // Emotion-based recommendations
    if (emotionAnalysis.primaryEmotion === 'anger') {
      recommendations.push('De-escalate with calm, professional tone');
      recommendations.push('Offer sincere apology for inconvenience');
    } else if (emotionAnalysis.primaryEmotion === 'confusion') {
      recommendations.push('Provide clear, step-by-step explanations');
      recommendations.push('Use simple language and avoid jargon');
    } else if (emotionAnalysis.primaryEmotion === 'worry') {
      recommendations.push('Provide reassurance and regular updates');
      recommendations.push('Be transparent about timelines');
    }

    // Context-based recommendations
    if (contextAnalysis && contextAnalysis.escalationIndicators > 0) {
      recommendations.push('Customer has requested escalation - handle carefully');
      recommendations.push('Document all interactions thoroughly');
    }

    if (contextAnalysis && contextAnalysis.conversationLength > 5) {
      recommendations.push('Long conversation - consider phone call for complex issues');
      recommendations.push('Summarize previous attempts to resolve');
    }

    return recommendations;
  }

  handleNegationPatterns(text, positiveScore, negativeScore) {
    const negationWords = ['not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere', 'hardly', 'barely'];
    const hasNegation = negationWords.some(word => text.includes(word));
    
    if (hasNegation) {
      // Specific negation patterns
      if (text.includes('not good') || text.includes('not great') || text.includes('not happy') || text.includes('not satisfied')) {
        negativeScore += 2;
        positiveScore = Math.max(0, positiveScore - 1);
      }
      if (text.includes('not bad') || text.includes('not terrible') || text.includes('not awful')) {
        positiveScore += 1;
        negativeScore = Math.max(0, negativeScore - 1);
      }
      if (text.includes('not working') || text.includes('not functioning') || text.includes('not responding')) {
        negativeScore += 1.5;
      }
    }
  }

  calculateAverageResponseTime(messages) {
    if (messages.length < 2) return 0;
    
    let totalTime = 0;
    let responseCount = 0;
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role !== messages[i-1].role) {
        const responseTime = new Date(messages[i].timestamp) - new Date(messages[i-1].timestamp);
        totalTime += responseTime;
        responseCount++;
      }
    }
    
    return responseCount > 0 ? totalTime / responseCount : 0;
  }

  detectEscalationIndicators(messages) {
    const escalationKeywords = ['manager', 'supervisor', 'escalate', 'higher up', 'ceo', 'executive'];
    let count = 0;
    
    messages.forEach(msg => {
      const text = msg.content.toLowerCase();
      escalationKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          count++;
        }
      });
    });
    
    return count;
  }

  countResolutionAttempts(messages) {
    const resolutionKeywords = ['try', 'attempt', 'solution', 'fix', 'resolve', 'help', 'assist'];
    let count = 0;
    
    messages.forEach(msg => {
      if (msg.role === 'user') { // Agent messages
        const text = msg.content.toLowerCase();
        resolutionKeywords.forEach(keyword => {
          if (text.includes(keyword)) {
            count++;
          }
        });
      }
    });
    
    return count;
  }

  analyzeConversationTone(messages) {
    if (messages.length === 0) return 'neutral';
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    messages.forEach(msg => {
      const analysis = this.performAdvancedSentimentAnalysis(msg.content.toLowerCase(), msg.content);
      if (analysis.sentiment === 'positive') positiveCount++;
      else if (analysis.sentiment === 'negative') negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    else if (negativeCount > positiveCount) return 'negative';
    else return 'neutral';
  }

  analyzeSentimentFallback(content) {
    const text = content.toLowerCase().trim();
    
    // Enhanced sentiment analysis with weighted scoring
    const sentimentPatterns = {
      // Strong positive indicators (weight: 3)
      strongPositive: [
        'excellent', 'outstanding', 'amazing', 'fantastic', 'brilliant', 'perfect', 'wonderful',
        'love it', 'love this', 'highly recommend', 'best ever', 'exactly what i wanted',
        'exceeded expectations', 'beyond expectations', 'absolutely perfect', 'incredible',
        'phenomenal', 'spectacular', 'superb', 'magnificent', 'exceptional'
      ],
      // Moderate positive indicators (weight: 2)
      moderatePositive: [
        'good', 'great', 'nice', 'happy', 'satisfied', 'pleased', 'like', 'enjoy',
        'thank you', 'thanks', 'appreciate', 'helpful', 'useful', 'works well',
        'quality', 'worth it', 'recommend', 'impressed', 'pleased with'
      ],
      // Weak positive indicators (weight: 1)
      weakPositive: [
        'ok', 'okay', 'fine', 'decent', 'acceptable', 'not bad', 'alright',
        'could be better', 'it works', 'functional'
      ],
      // Strong negative indicators (weight: 3)
      strongNegative: [
        'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'despise', 'loathe',
        'worst ever', 'complete waste', 'absolutely terrible', 'unacceptable',
        'outraged', 'furious', 'livid', 'disgusted', 'appalled', 'shocked',
        'ridiculous', 'absurd', 'pathetic', 'useless', 'garbage', 'trash'
      ],
      // Moderate negative indicators (weight: 2)
      moderateNegative: [
        'bad', 'poor', 'disappointed', 'frustrated', 'annoyed', 'upset', 'mad',
        'angry', 'unhappy', 'unsatisfied', 'not good', 'not working', 'broken',
        'defective', 'faulty', 'problem', 'issue', 'complaint', 'wrong',
        'incorrect', 'mistake', 'error', 'failed', 'failure'
      ],
      // Weak negative indicators (weight: 1)
      weakNegative: [
        'not great', 'could be better', 'not ideal', 'not perfect', 'concerned',
        'worried', 'unsure', 'question', 'confused', 'unclear'
      ]
    };

    // Urgency patterns with weights
    const urgencyPatterns = {
      // Critical urgency (weight: 4)
      critical: [
        'emergency', 'urgent', 'asap', 'immediately', 'right now', 'critical',
        'desperate', 'help me now', 'can\'t wait', 'life or death', 'serious problem'
      ],
      // High urgency (weight: 3)
      high: [
        'refund', 'cancel', 'return', 'broken', 'damaged', 'not working',
        'fraud', 'scam', 'stolen', 'missing', 'lost', 'legal action',
        'sue', 'complaint', 'escalate', 'manager', 'supervisor'
      ],
      // Medium urgency (weight: 2)
      medium: [
        'soon', 'today', 'this week', 'need help', 'problem', 'issue',
        'concerned', 'worried', 'question', 'inquiry', 'status update'
      ],
      // Low urgency (weight: 1)
      low: [
        'when possible', 'no rush', 'just wondering', 'curious', 'information',
        'general question', 'future', 'planning'
      ]
    };

    // Calculate weighted scores
    let positiveScore = 0;
    let negativeScore = 0;
    let urgencyScore = 0;

    // Check for sentiment patterns
    Object.entries(sentimentPatterns).forEach(([category, words]) => {
      const weight = category.includes('strong') ? 3 : category.includes('moderate') ? 2 : 1;
      words.forEach(word => {
        if (text.includes(word)) {
          if (category.includes('positive')) {
            positiveScore += weight;
          } else if (category.includes('negative')) {
            negativeScore += weight;
          }
        }
      });
    });

    // Check for urgency patterns
    Object.entries(urgencyPatterns).forEach(([level, words]) => {
      const weight = level === 'critical' ? 4 : level === 'high' ? 3 : level === 'medium' ? 2 : 1;
      words.forEach(word => {
        if (text.includes(word)) {
          urgencyScore += weight;
        }
      });
    });

    // Check for intensity modifiers
    const intensityModifiers = {
      very: 1.5, really: 1.5, extremely: 2, absolutely: 2, completely: 1.5,
      totally: 1.5, quite: 1.2, somewhat: 0.8, slightly: 0.6, barely: 0.4
    };

    Object.entries(intensityModifiers).forEach(([modifier, multiplier]) => {
      if (text.includes(modifier)) {
        // Apply multiplier to nearby sentiment
        positiveScore *= multiplier;
        negativeScore *= multiplier;
      }
    });

    // Check for negation patterns that might reverse sentiment
    const negationWords = ['not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere'];
    const hasNegation = negationWords.some(word => text.includes(word));
    
    if (hasNegation) {
      // If there's negation, we need to be more careful about sentiment
      // Look for patterns like "not good" vs "not bad"
      if (text.includes('not good') || text.includes('not great') || text.includes('not happy')) {
        negativeScore += 2;
        positiveScore = Math.max(0, positiveScore - 1);
      }
      if (text.includes('not bad') || text.includes('not terrible')) {
        positiveScore += 1;
        negativeScore = Math.max(0, negativeScore - 1);
      }
    }

    // Check for exclamation marks and caps (emotional intensity)
    const exclamationCount = (content.match(/!/g) || []).length;
    const capsCount = (content.match(/[A-Z]{2,}/g) || []).length;
    const emotionalIntensity = exclamationCount + capsCount;
    
    if (emotionalIntensity > 0) {
      // Increase the dominant sentiment score
      if (positiveScore > negativeScore) {
        positiveScore += emotionalIntensity * 0.5;
      } else if (negativeScore > positiveScore) {
        negativeScore += emotionalIntensity * 0.5;
      }
    }

    // Determine sentiment with confidence levels
    const sentimentDiff = positiveScore - negativeScore;
    let sentiment = 'neutral';
    let confidence = 'medium';

    if (sentimentDiff > 2) {
      sentiment = 'positive';
      confidence = sentimentDiff > 5 ? 'high' : 'medium';
    } else if (sentimentDiff < -2) {
      sentiment = 'negative';
      confidence = Math.abs(sentimentDiff) > 5 ? 'high' : 'medium';
    } else {
      sentiment = 'neutral';
      confidence = Math.abs(sentimentDiff) < 1 ? 'high' : 'medium';
    }

    // Determine urgency
    let urgency = 'low';
    if (urgencyScore >= 8) {
      urgency = 'urgent';
    } else if (urgencyScore >= 5) {
      urgency = 'high';
    } else if (urgencyScore >= 2) {
      urgency = 'medium';
    } else {
      urgency = 'low';
    }

    // Generate detailed reasoning
    let reasoning = `Analysis based on ${content.length} characters: `;
    
    if (sentiment === 'positive') {
      reasoning += `Positive sentiment detected (score: +${positiveScore.toFixed(1)}). `;
    } else if (sentiment === 'negative') {
      reasoning += `Negative sentiment detected (score: -${Math.abs(negativeScore).toFixed(1)}). `;
    } else {
      reasoning += `Neutral sentiment (positive: +${positiveScore.toFixed(1)}, negative: -${Math.abs(negativeScore).toFixed(1)}). `;
    }

    if (urgency === 'urgent') {
      reasoning += `Critical urgency detected (score: ${urgencyScore}). `;
    } else if (urgency === 'high') {
      reasoning += `High urgency identified (score: ${urgencyScore}). `;
    } else if (urgency === 'medium') {
      reasoning += `Medium urgency level (score: ${urgencyScore}). `;
    } else {
      reasoning += `Low urgency level (score: ${urgencyScore}). `;
    }

    if (emotionalIntensity > 0) {
      reasoning += `High emotional intensity detected (${emotionalIntensity} indicators). `;
    }

    if (hasNegation) {
      reasoning += `Negation patterns considered in analysis. `;
    }

    reasoning += `Confidence: ${confidence}.`;

    return {
      sentiment,
      urgency,
      reasoning,
      scores: {
        positive: positiveScore,
        negative: negativeScore,
        urgency: urgencyScore,
        emotionalIntensity
      }
    };
  }

  async suggestKnowledgeBaseArticles(query, articles) {
    try {
      const prompt = `Based on this customer query: "${query}"
      
      Rank these knowledge base articles by relevance (1-5, where 5 is most relevant):
      
      ${articles.map((article, index) => 
        `${index + 1}. ${article.title}\n   Content: ${article.content.substring(0, 200)}...`
      ).join('\n\n')}
      
      Respond with the top 3 most relevant article indices and brief explanations.`;

      const response = await this.generateResponse(prompt);
      return response;
    } catch (error) {
      console.error('Knowledge base suggestion error:', error);
      return "I'm having trouble finding relevant articles. Let me connect you with a human agent.";
    }
  }

  async generateCannedResponse(category, context) {
    const cannedResponses = {
      order_status: "Thank you for your inquiry about your order. I can see your order details and will provide you with the current status and tracking information.",
      shipping: "I understand you have questions about shipping. Let me check the shipping details for your order and provide you with the most up-to-date information.",
      return: "I see you're interested in returning an item. I'll help you with the return process and provide you with all the necessary steps and information.",
      technical: "Thank you for reporting this technical issue. I'll help you troubleshoot this problem and find a solution for you.",
      billing: "I understand you have billing questions. Let me review your account and provide you with accurate billing information.",
      general: "Thank you for contacting us. I'm here to help you with your inquiry and will do my best to provide you with the information you need."
    };

    return cannedResponses[category] || cannedResponses.general;
  }

  // Conversation Management Methods
  startConversation(sessionId, context = {}) {
    this.conversationHistory.set(sessionId, {
      messages: [],
      context: context,
      createdAt: new Date(),
      lastActivity: new Date()
    });
    return sessionId;
  }

  addMessage(sessionId, role, content, metadata = {}) {
    if (!this.conversationHistory.has(sessionId)) {
      this.startConversation(sessionId);
    }

    const conversation = this.conversationHistory.get(sessionId);
    const message = {
      role,
      content,
      timestamp: new Date(),
      metadata
    };

    conversation.messages.push(message);
    conversation.lastActivity = new Date();

    return message;
  }

  getConversation(sessionId) {
    return this.conversationHistory.get(sessionId) || null;
  }

  getConversationHistory(sessionId, limit = 10) {
    const conversation = this.getConversation(sessionId);
    if (!conversation) return [];

    return conversation.messages.slice(-limit);
  }

  async generateConversationalResponse(sessionId, userMessage, context = {}) {
    try {
      // Add user message to conversation
      this.addMessage(sessionId, 'user', userMessage);

      // Get conversation history
      const conversation = this.getConversation(sessionId);
      const recentMessages = this.getConversationHistory(sessionId, 6);

      // Try to get AI response first
      let response;
      let isAIGenerated = false;

            if (process.env.GEMINI_API_KEY || process.env.MISTRAL_API_KEY || process.env.OPENAI_API_KEY) {
        try {
          const conversationContext = this.buildConversationPrompt(userMessage, recentMessages, context);
          response = await this.generateResponse(conversationContext, context);
          isAIGenerated = true;
        } catch (aiError) {
          console.log('AI generation failed, using local response:', aiError.message);
          response = this.generateContextualCustomerResponse(userMessage, recentMessages, context);
        }
      } else {
        // No API key, use local generation
        response = this.generateContextualCustomerResponse(userMessage, recentMessages, context);
      }
      
      // Add AI response to conversation
      this.addMessage(sessionId, 'assistant', response, { isAI: true, isAIGenerated });

      return {
        response,
        conversationId: sessionId,
        timestamp: new Date(),
        context: conversation.context,
        isAIGenerated
      };
    } catch (error) {
      console.error('Conversational response error:', error);
      const fallbackResponse = this.getFallbackResponse(userMessage, context);
      this.addMessage(sessionId, 'assistant', fallbackResponse, { isAI: true, isFallback: true });
      
      return {
        response: fallbackResponse,
        conversationId: sessionId,
        timestamp: new Date(),
        isFallback: true
      };
    }
  }

  buildConversationalSystemPrompt(context, messageHistory) {
    let systemPrompt = `You are a CUSTOMER contacting an e-commerce platform's customer support. 
    You are NOT the support agent - you are the customer with various issues and concerns.
    
    IMPORTANT: Analyze the previous conversation history and respond contextually:
    - If the agent apologized, show some appreciation but maintain your concern
    - If the agent offered a solution, respond based on whether you're satisfied or not
    - If the agent asked for more information, provide it naturally
    - If the agent offered a refund/replacement, express your preference
    - If the agent escalated, show appreciation for the effort
    - If the conversation is getting long, show increasing frustration or satisfaction based on progress
    - Reference what the agent just said in your response
    - Build on the conversation naturally
    
    Guidelines:
    - Act like a real customer with genuine concerns
    - Be conversational, sometimes frustrated, sometimes happy
    - Ask questions about orders, returns, shipping, products
    - Express emotions appropriately (frustration, satisfaction, confusion)
    - Use casual language like a real customer would
    - Reference order numbers, product names, shipping issues
    - Sometimes be impatient, sometimes grateful
    - Ask for help with common e-commerce issues
    - Show appreciation when you get good service
    - Express concerns about refunds, exchanges, delivery times
    - Respond to what the agent just said, don't ignore their previous message`;

    if (context.customer) {
      systemPrompt += `\n\nCustomer Information:
      - Name: ${context.customer.name}
      - Email: ${context.customer.email}
      - Customer Tier: ${context.customer.customerTier}`;
    }

    if (context.orderHistory && context.orderHistory.length > 0) {
      systemPrompt += `\n\nRecent Orders:
      ${context.orderHistory.map(order => 
        `- Order ${order.orderId}: ${order.status} (${order.orderDate})`
      ).join('\n')}`;
    }

    if (context.cartItems && context.cartItems.length > 0) {
      systemPrompt += `\n\nCurrent Cart:
      ${context.cartItems.map(item => 
        `- ${item.productName} (Qty: ${item.quantity})`
      ).join('\n')}`;
    }

    // Add conversation context
    if (messageHistory.length > 0) {
      systemPrompt += `\n\nConversation Context:
      This is an ongoing conversation. Please maintain context and reference previous messages when relevant.`;
    }

    return systemPrompt;
  }

  generateContextualCustomerResponse(agentMessage, conversationHistory, context = {}) {
    const message = agentMessage.toLowerCase();
    const conversationLength = conversationHistory.length;
    
    // Analyze conversation context
    const lastCustomerMessage = conversationHistory.filter(msg => msg.role === 'assistant').pop();
    const customerMessages = conversationHistory.filter(msg => msg.role === 'assistant');
    const agentMessages = conversationHistory.filter(msg => msg.role === 'user');
    
    // Enhanced mood detection with more nuanced analysis
    let customerMood = this.analyzeCustomerMood(customerMessages, conversationHistory);
    let customerPersonality = this.determineCustomerPersonality(conversationHistory);
    let issueType = this.detectIssueType(conversationHistory);
    
    // Generate more intelligent and natural responses
    return this.generateIntelligentResponse(agentMessage, customerMood, customerPersonality, issueType, conversationLength, conversationHistory);
  }

  analyzeCustomerMood(customerMessages, conversationHistory) {
    if (customerMessages.length === 0) return 'neutral';
    
    const recentMessages = customerMessages.slice(-3);
    const customerText = recentMessages.map(m => m.content).join(' ').toLowerCase();
    
    // Enhanced mood detection with weighted scoring
    let moodScore = { frustrated: 0, angry: 0, satisfied: 0, confused: 0, urgent: 0, disappointed: 0 };
    
    // Strong negative indicators
    const strongNegative = ['furious', 'outraged', 'unacceptable', 'terrible', 'awful', 'horrible', 'disgusted'];
    const moderateNegative = ['frustrated', 'angry', 'upset', 'annoyed', 'disappointed', 'unhappy'];
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'now'];
    const positiveWords = ['happy', 'thank', 'great', 'excellent', 'perfect', 'satisfied', 'pleased'];
    const confusedWords = ['confused', 'understand', 'unclear', 'explain', 'help', 'what', 'how'];
    
    // Score based on word presence and intensity
    strongNegative.forEach(word => {
      if (customerText.includes(word)) moodScore.angry += 3;
    });
    
    moderateNegative.forEach(word => {
      if (customerText.includes(word)) moodScore.frustrated += 2;
    });
    
    urgentWords.forEach(word => {
      if (customerText.includes(word)) moodScore.urgent += 2;
    });
    
    positiveWords.forEach(word => {
      if (customerText.includes(word)) moodScore.satisfied += 2;
    });
    
    confusedWords.forEach(word => {
      if (customerText.includes(word)) moodScore.confused += 1;
    });
    
    // Check for disappointment indicators
    if (customerText.includes('expected') || customerText.includes('hoped') || customerText.includes('thought')) {
      moodScore.disappointed += 1;
    }
    
    // Check for escalation patterns
    if (customerText.includes('manager') || customerText.includes('supervisor') || customerText.includes('escalate')) {
      moodScore.angry += 2;
    }
    
    // Return the dominant mood
    const maxMood = Object.keys(moodScore).reduce((a, b) => moodScore[a] > moodScore[b] ? a : b);
    return moodScore[maxMood] > 0 ? maxMood : 'neutral';
  }

  determineCustomerPersonality(conversationHistory) {
    const customerMessages = conversationHistory.filter(msg => msg.role === 'assistant');
    if (customerMessages.length === 0) return 'polite';
    
    const customerText = customerMessages.map(m => m.content).join(' ').toLowerCase();
    
    // Analyze personality traits
    if (customerText.includes('please') && customerText.includes('thank')) return 'polite';
    if (customerText.includes('!') && customerText.length > 50) return 'expressive';
    if (customerText.includes('business') || customerText.includes('professional')) return 'professional';
    if (customerText.includes('quick') || customerText.includes('fast')) return 'impatient';
    if (customerText.length < 30 && customerMessages.length > 2) return 'concise';
    
    return 'neutral';
  }

  detectIssueType(conversationHistory) {
    const allText = conversationHistory.map(msg => msg.content).join(' ').toLowerCase();
    
    if (allText.includes('refund') || allText.includes('return') || allText.includes('money')) return 'financial';
    if (allText.includes('broken') || allText.includes('defective') || allText.includes('damaged')) return 'quality';
    if (allText.includes('shipping') || allText.includes('delivery') || allText.includes('tracking')) return 'logistics';
    if (allText.includes('order') || allText.includes('purchase')) return 'order_issue';
    if (allText.includes('account') || allText.includes('login') || allText.includes('password')) return 'account';
    if (allText.includes('cancel') || allText.includes('stop')) return 'cancellation';
    
    return 'general';
  }

  generateIntelligentResponse(agentMessage, customerMood, customerPersonality, issueType, conversationLength, conversationHistory) {
    const message = agentMessage.toLowerCase();
    
    // Generate responses based on multiple factors
    let responses = this.getResponsePool(message, customerMood, customerPersonality, issueType, conversationLength);
    
    // Add contextual variations based on conversation history
    responses = this.addContextualVariations(responses, conversationHistory, customerMood);
    
    // Select the most appropriate response
    return this.selectBestResponse(responses, customerMood, customerPersonality, conversationLength);
  }

  getResponsePool(agentMessage, mood, personality, issueType, conversationLength) {
    let responses = [];
    
    // Apology responses
    if (agentMessage.includes('apologize') || agentMessage.includes('sorry')) {
      responses = this.getApologyResponses(mood, personality);
    }
    // Investigation responses
    else if (agentMessage.includes('investigate') || agentMessage.includes('check') || agentMessage.includes('look into')) {
      responses = this.getInvestigationResponses(mood, personality, issueType);
    }
    // Refund responses
    else if (agentMessage.includes('refund')) {
      responses = this.getRefundResponses(mood, personality, issueType);
    }
    // Replacement responses
    else if (agentMessage.includes('replacement') || agentMessage.includes('replace')) {
      responses = this.getReplacementResponses(mood, personality, issueType);
    }
    // Tracking responses
    else if (agentMessage.includes('tracking') || agentMessage.includes('track')) {
      responses = this.getTrackingResponses(mood, personality, issueType);
    }
    // Escalation responses
    else if (agentMessage.includes('manager') || agentMessage.includes('supervisor') || agentMessage.includes('escalate')) {
      responses = this.getEscalationResponses(mood, personality);
    }
    // Thank you responses
    else if (agentMessage.includes('thank') || agentMessage.includes('appreciate')) {
      responses = this.getThankYouResponses(mood, personality);
    }
    // Generic responses
    else {
      responses = this.getGenericResponses(mood, personality, issueType, conversationLength);
    }
    
    return responses;
  }

  getApologyResponses(mood, personality) {
    const responses = {
      frustrated: [
        "I appreciate the apology, but I still need this resolved. What are you going to do about it?",
        "Thank you for apologizing, but that doesn't fix my problem. I need a solution now.",
        "I understand you're sorry, but I'm still frustrated. Can you actually help me?",
        "Apology accepted, but I need this issue fixed. What's your plan?"
      ],
      angry: [
        "An apology doesn't fix this mess. I need immediate action.",
        "Sorry isn't good enough. I want to know what you're going to do about this.",
        "I've heard enough apologies. I need results, not words.",
        "Save your apologies and fix this problem instead."
      ],
      satisfied: [
        "I appreciate the apology. Let's work together to resolve this.",
        "Thank you for acknowledging the issue. I hope we can fix this quickly.",
        "I understand things happen. What can we do to make this right?",
        "I appreciate your honesty. Let's get this sorted out."
      ],
      confused: [
        "I appreciate the apology, but I'm still not sure what happened. Can you explain?",
        "Thank you for saying sorry, but I'm confused about what went wrong.",
        "I understand you're sorry, but I need to understand what happened.",
        "Apology accepted, but can you help me understand the situation better?"
      ]
    };
    
    return responses[mood] || responses.frustrated;
  }

  getInvestigationResponses(mood, personality, issueType) {
    const responses = {
      frustrated: [
        "Okay, please investigate quickly. I need this resolved today.",
        "That's fine, but how long will this take? I can't wait forever.",
        "Good, please look into it. I'll be waiting for your update.",
        "I hope you find something soon. This is taking too long."
      ],
      urgent: [
        "This is urgent! Please investigate immediately and get back to me ASAP.",
        "I need this investigated right now. This can't wait.",
        "Please prioritize this investigation. It's critical.",
        "Investigate this immediately. I need answers today."
      ],
      confused: [
        "Thank you for looking into this. Can you explain what you're checking?",
        "I appreciate the investigation. What exactly are you looking for?",
        "Good, please investigate. Can you tell me what you expect to find?",
        "Thank you for checking. What should I expect from this investigation?"
      ]
    };
    
    return responses[mood] || responses.frustrated;
  }

  getRefundResponses(mood, personality, issueType) {
    const responses = {
      satisfied: [
        "Yes, I would like a refund. When will I get my money back?",
        "A refund would be fine. How long will the processing take?",
        "Thank you for offering a refund. Please process it quickly.",
        "I'll take the refund. This has been a disappointing experience."
      ],
      angry: [
        "Finally! I want my refund immediately. No more delays.",
        "About time! Process that refund right now.",
        "Yes, refund me. I'm done with this company.",
        "Give me my money back. This is unacceptable."
      ],
      disappointed: [
        "I'll take the refund, but I'm really disappointed this happened.",
        "A refund is fine, but this has ruined my trust in your company.",
        "I accept the refund, but this experience has been terrible.",
        "Okay, refund me, but I won't be shopping here again."
      ]
    };
    
    return responses[mood] || responses.satisfied;
  }

  getReplacementResponses(mood, personality, issueType) {
    const responses = {
      frustrated: [
        "A replacement would be great, but make sure it's the right item this time.",
        "I'll take a replacement, but I want it shipped immediately.",
        "That works, but I need it by Friday. Can you guarantee that?",
        "Fine, send a replacement, but I'm not paying for return shipping."
      ],
      satisfied: [
        "That sounds good. When will the replacement be sent?",
        "I'll take a replacement. Thank you for offering that.",
        "A replacement would be perfect. How long will shipping take?",
        "That works for me. Please send the replacement quickly."
      ],
      suspicious: [
        "A replacement? How do I know this one won't be broken too?",
        "I'll take it, but I'm worried the same thing will happen again.",
        "Fine, but what if this replacement has the same problem?",
        "Okay, but I want to make sure this one is actually working."
      ]
    };
    
    return responses[mood] || responses.satisfied;
  }

  getTrackingResponses(mood, personality, issueType) {
    const responses = {
      frustrated: [
        "Thank you for the tracking info. I'll keep an eye on it.",
        "Good, I can see it's moving. When will it arrive?",
        "I got the tracking number. It's still not moving though.",
        "Thanks for the tracking. I hope it gets here soon."
      ],
      urgent: [
        "I need that tracking info to work. This is urgent!",
        "The tracking shows it's not moving. What's going on?",
        "I'm checking the tracking constantly. This needs to arrive today.",
        "The tracking isn't updating. Something's wrong."
      ],
      satisfied: [
        "Perfect! I can see it's on its way. Thank you.",
        "Great, the tracking shows it's moving. I appreciate the update.",
        "Excellent! I can track it now. When should I expect delivery?",
        "Thank you for the tracking number. It's very helpful."
      ]
    };
    
    return responses[mood] || responses.frustrated;
  }

  getEscalationResponses(mood, personality) {
    const responses = {
      angry: [
        "Yes, please get your manager. I need someone who can actually help.",
        "Good, I want to speak to someone with more authority.",
        "That's fine, but make sure they call me back today.",
        "Please escalate this. I'm tired of going in circles."
      ],
      frustrated: [
        "I think that's necessary at this point. Please escalate it.",
        "Yes, I'd like to speak to your supervisor.",
        "Good idea. This needs to go to someone higher up.",
        "Please get your manager involved. This is taking too long."
      ],
      satisfied: [
        "I appreciate you escalating this. Thank you.",
        "That sounds reasonable. I look forward to hearing from your manager.",
        "Thank you for taking this seriously. Please have them contact me.",
        "I appreciate the escalation. This shows good customer service."
      ]
    };
    
    return responses[mood] || responses.frustrated;
  }

  getThankYouResponses(mood, personality) {
    const responses = {
      satisfied: [
        "You're welcome! I appreciate your help.",
        "No problem at all. Thank you for being so helpful.",
        "You're very welcome. I'm glad we got this sorted out.",
        "Thank you for saying that. I'm happy we resolved this."
      ],
      frustrated: [
        "You're welcome, but I still need this issue resolved.",
        "No problem, but I hope this doesn't happen again.",
        "You're welcome. I appreciate your help.",
        "Thanks for acknowledging that. Now let's fix this."
      ],
      polite: [
        "You're very welcome. I'm grateful for your assistance.",
        "Thank you for saying that. I really appreciate your help.",
        "It's my pleasure. I'm glad I could be of service.",
        "You're most welcome. Thank you for being so understanding."
      ]
    };
    
    return responses[mood] || responses.satisfied;
  }

  getGenericResponses(mood, personality, issueType, conversationLength) {
    if (conversationLength > 8 && mood === 'frustrated') {
      return [
        "This is taking way too long. I've been talking to you for a while now.",
        "I'm getting frustrated. This should have been resolved by now.",
        "How much longer is this going to take? I have other things to do.",
        "This conversation is going in circles. I need a real solution."
      ];
    } else if (conversationLength > 6) {
      return [
        "I understand, but I still need this resolved.",
        "That's helpful, but what about my original issue?",
        "I see, but I want to make sure this is handled properly.",
        "I appreciate that, but I need more information."
      ];
    } else {
      return [
        "I understand. What's the next step?",
        "Okay, that sounds reasonable. What happens now?",
        "I see. Can you help me with that?",
        "That makes sense. How long will this take?"
      ];
    }
  }

  addContextualVariations(responses, conversationHistory, mood) {
    // Add personal touches based on conversation history
    const customerMessages = conversationHistory.filter(msg => msg.role === 'assistant');
    const hasBeenPolite = customerMessages.some(msg => 
      msg.content.toLowerCase().includes('please') || msg.content.toLowerCase().includes('thank')
    );
    
    if (hasBeenPolite && mood !== 'angry') {
      responses = responses.map(response => {
        // Add polite variations
        const politeVariations = [
          response.replace('I need', 'I would really appreciate it if'),
          response.replace('I want', 'I would like'),
          response.replace('I', 'I would be grateful if I')
        ];
        return [...responses, ...politeVariations].filter((v, i, a) => a.indexOf(v) === i);
      }).flat();
    }
    
    return responses;
  }

  selectBestResponse(responses, mood, personality, conversationLength) {
    if (responses.length === 0) {
      return "I understand. What's the next step?";
    }
    
    // Weight responses based on mood and personality
    let weightedResponses = responses;
    
    // For angry customers, prefer shorter, more direct responses
    if (mood === 'angry') {
      weightedResponses = responses.filter(r => r.length < 80);
      if (weightedResponses.length === 0) weightedResponses = responses;
    }
    
    // For polite customers, prefer longer, more detailed responses
    if (personality === 'polite' && mood !== 'angry') {
      weightedResponses = responses.filter(r => r.length > 50);
      if (weightedResponses.length === 0) weightedResponses = responses;
    }
    
    // For long conversations, prefer more direct responses
    if (conversationLength > 6) {
      weightedResponses = responses.filter(r => r.length < 100);
      if (weightedResponses.length === 0) weightedResponses = responses;
    }
    
    // Return a random response from the weighted set
    return weightedResponses[Math.floor(Math.random() * weightedResponses.length)];
  }

  buildConversationPrompt(userMessage, conversationHistory, context = {}) {
    const recentMessages = conversationHistory.slice(-4); // Last 4 messages for context
    const conversationContext = recentMessages.map(msg => 
      `${msg.role === 'user' ? 'Agent' : 'Customer'}: ${msg.content}`
    ).join('\n');

    return `You are a customer service chatbot simulating a customer's responses. Based on the conversation history and the agent's latest message, respond as a customer would.

Conversation History:
${conversationContext}

Agent's Latest Message: ${userMessage}

Customer Context: ${JSON.stringify(context, null, 2)}

Respond as the customer would, considering:
- The customer's mood and emotional state based on the conversation
- The type of issue being discussed
- Whether the customer is satisfied, frustrated, angry, or confused
- The customer's personality (polite, direct, impatient, etc.)
- Keep responses natural and conversational
- Match the customer's communication style

Respond with just the customer's message, no additional formatting or explanations.`;
  }

  // Enhanced initial customer messages for better conversation starters
  getInitialCustomerMessages() {
    return [
      "Hi, I'm having trouble with my order. Can you help me?",
      "I ordered something 3 days ago but haven't received any tracking info. What's going on?",
      "The item I received is completely different from what I ordered. This is ridiculous!",
      "I need to return this item but I can't find the return label. Can you help?",
      "My package says delivered but I never got it. Where is it?",
      "I want to cancel my order but it's already shipped. What can I do?",
      "The quality of this product is terrible. I want a refund immediately.",
      "I've been waiting for my order for over a week. This is unacceptable!",
      "Can you tell me when my order will arrive? I need it by Friday.",
      "I'm not happy with this purchase. How do I return it?",
      "I received a damaged item and I'm very frustrated about this.",
      "My order was supposed to arrive yesterday but it's still not here.",
      "I think there's been a mistake with my billing. Can you check?",
      "I ordered the wrong size and need to exchange it quickly.",
      "The product description was misleading. This isn't what I expected.",
      "I need to update my shipping address before it ships out.",
      "The website said it was in stock but now it's showing as backordered.",
      "I'm having trouble logging into my account to check my order status.",
      "The packaging was damaged and I'm worried the item inside is too.",
      "I placed two separate orders but only received one confirmation email."
    ];
  }

  // Conversation Analytics
  getConversationAnalytics(sessionId) {
    const conversation = this.getConversation(sessionId);
    if (!conversation) return null;

    const messages = conversation.messages;
    const userMessages = messages.filter(m => m.role === 'user');
    const aiMessages = messages.filter(m => m.role === 'assistant');

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      duration: new Date() - conversation.createdAt,
      lastActivity: conversation.lastActivity,
      averageResponseTime: this.calculateAverageResponseTime(messages)
    };
  }

  calculateAverageResponseTime(messages) {
    let totalTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'assistant' && messages[i-1].role === 'user') {
        const responseTime = messages[i].timestamp - messages[i-1].timestamp;
        totalTime += responseTime;
        responseCount++;
      }
    }

    return responseCount > 0 ? totalTime / responseCount : 0;
  }

  // Clear old conversations (cleanup)
  clearOldConversations(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = new Date();
    for (const [sessionId, conversation] of this.conversationHistory.entries()) {
      if (now - conversation.lastActivity > maxAge) {
        this.conversationHistory.delete(sessionId);
      }
    }
  }

  // Export conversation
  exportConversation(sessionId) {
    const conversation = this.getConversation(sessionId);
    if (!conversation) return null;

    return {
      sessionId,
      createdAt: conversation.createdAt,
      lastActivity: conversation.lastActivity,
      context: conversation.context,
      messages: conversation.messages,
      analytics: this.getConversationAnalytics(sessionId)
    };
  }
}

module.exports = new AIService();
