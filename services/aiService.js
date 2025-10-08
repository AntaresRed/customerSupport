const axios = require('axios');

class AIService {
  constructor() {
    this.apiUrl = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';
    this.model = process.env.MISTRAL_MODEL || 'mistral-7b-instruct';
    this.conversationHistory = new Map(); // Store conversation history by session ID
  }

  async generateResponse(prompt, context = {}) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const response = await axios.post(this.apiUrl, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real implementation, you would need an API key
          // For this demo, we'll simulate responses
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error.message);
      // Fallback response when API is not available
      return this.getFallbackResponse(prompt, context);
    }
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

  async analyzeTicketSentiment(ticketContent) {
    try {
      const prompt = `Analyze the sentiment of this customer support ticket and classify it as: positive, neutral, or negative. Also identify the urgency level as: low, medium, high, or urgent.
      
      Ticket content: "${ticketContent}"
      
      Respond in JSON format: {"sentiment": "positive/neutral/negative", "urgency": "low/medium/high/urgent", "reasoning": "brief explanation"}`;

      const response = await this.generateResponse(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        sentiment: 'neutral',
        urgency: 'medium',
        reasoning: 'Unable to analyze sentiment'
      };
    }
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

      // Build context-aware system prompt
      const systemPrompt = this.buildConversationalSystemPrompt(conversation.context || context, recentMessages);

      // Add conversation context to make responses more contextual
      let contextualPrompt = userMessage;
      if (recentMessages.length > 0) {
        const conversationContext = recentMessages.map(msg => 
          `${msg.role === 'user' ? 'Agent' : 'Customer'}: ${msg.content}`
        ).join('\n');
        
        contextualPrompt = `Previous conversation context:\n${conversationContext}\n\nCurrent agent message: ${userMessage}\n\nRespond as the customer based on this conversation flow and what the agent just said:`;
      }

      // Prepare messages for AI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: contextualPrompt }
      ];

      // Generate response
      const response = await this.generateResponseWithMessages(messages);
      
      // Add AI response to conversation
      this.addMessage(sessionId, 'assistant', response, { isAI: true });

      return {
        response,
        conversationId: sessionId,
        timestamp: new Date(),
        context: conversation.context
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

  async generateResponseWithMessages(messages) {
    try {
      const response = await axios.post(this.apiUrl, {
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI API Error:', error.message);
      return this.getFallbackResponse(messages[messages.length - 1]?.content || '', {});
    }
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
