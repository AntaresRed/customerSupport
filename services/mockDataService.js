// Mock Data Service - No Database Required
// This service provides all the data needed for the application

class MockDataService {
  constructor() {
    this.initializeMockData();
  }

  initializeMockData() {
    // Mock Users
    this.users = [
      {
        _id: 'user_1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date()
      },
      {
        _id: 'user_2',
        name: 'John Agent',
        email: 'john@example.com',
        role: 'agent',
        createdAt: new Date('2024-01-02'),
        lastLogin: new Date()
      },
      {
        _id: 'user_3',
        name: 'Sarah Manager',
        email: 'sarah@example.com',
        role: 'manager',
        createdAt: new Date('2024-01-03'),
        lastLogin: new Date()
      }
    ];

    // Mock Customers
    this.customers = [
      {
        _id: 'customer_1',
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1-555-0123',
        customerId: 'CUST001',
        customerTier: 'gold',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        preferences: {
          language: 'en',
          timezone: 'America/New_York',
          notifications: true
        },
        totalOrders: 15,
        totalSpent: 2450.75,
        lastOrderDate: new Date('2024-10-01'),
        createdAt: new Date('2024-01-15')
      },
      {
        _id: 'customer_2',
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+1-555-0124',
        customerId: 'CUST002',
        customerTier: 'platinum',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        preferences: {
          language: 'en',
          timezone: 'America/Los_Angeles',
          notifications: true
        },
        totalOrders: 28,
        totalSpent: 5670.25,
        lastOrderDate: new Date('2024-10-05'),
        createdAt: new Date('2024-02-20')
      },
      {
        _id: 'customer_3',
        name: 'Mike Johnson',
        email: 'mike.j@email.com',
        phone: '+1-555-0125',
        customerId: 'CUST003',
        customerTier: 'silver',
        address: {
          street: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        preferences: {
          language: 'en',
          timezone: 'America/Chicago',
          notifications: false
        },
        totalOrders: 8,
        totalSpent: 1200.50,
        lastOrderDate: new Date('2024-09-28'),
        createdAt: new Date('2024-03-10')
      },
      {
        _id: 'customer_4',
        name: 'Emily Davis',
        email: 'emily.davis@email.com',
        phone: '+1-555-0126',
        customerId: 'CUST004',
        customerTier: 'gold',
        address: {
          street: '321 Elm St',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          country: 'USA'
        },
        preferences: {
          language: 'en',
          timezone: 'America/New_York',
          notifications: true
        },
        totalOrders: 22,
        totalSpent: 3890.00,
        lastOrderDate: new Date('2024-10-03'),
        createdAt: new Date('2024-01-25')
      },
      {
        _id: 'customer_5',
        name: 'David Wilson',
        email: 'david.w@email.com',
        phone: '+1-555-0127',
        customerId: 'CUST005',
        customerTier: 'bronze',
        address: {
          street: '654 Maple Dr',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          country: 'USA'
        },
        preferences: {
          language: 'en',
          timezone: 'America/Los_Angeles',
          notifications: true
        },
        totalOrders: 3,
        totalSpent: 450.25,
        lastOrderDate: new Date('2024-09-20'),
        createdAt: new Date('2024-08-15')
      }
    ];

    // Mock Tickets
    this.tickets = [
      {
        _id: 'ticket_1',
        ticketId: 'TK001',
        title: 'Order Not Delivered',
        description: 'My order #ORD12345 was supposed to arrive on Oct 5th but I haven\'t received it yet. The tracking shows it\'s still in transit.',
        status: 'open',
        priority: 'high',
        category: 'shipping',
        customer: 'customer_1',
        assignedAgent: 'user_2',
        createdAt: new Date('2024-10-06'),
        updatedAt: new Date('2024-10-07'),
        messages: [
          {
            _id: 'msg_1',
            content: 'My order #ORD12345 was supposed to arrive on Oct 5th but I haven\'t received it yet.',
            sender: 'customer_1',
            senderType: 'customer',
            timestamp: new Date('2024-10-06T10:30:00')
          },
          {
            _id: 'msg_2',
            content: 'I apologize for the delay. Let me check the tracking information for your order.',
            sender: 'user_2',
            senderType: 'agent',
            timestamp: new Date('2024-10-06T11:15:00')
          }
        ]
      },
      {
        _id: 'ticket_2',
        ticketId: 'TK002',
        title: 'Product Defect',
        description: 'The product I received has a defect. The screen has a crack and doesn\'t work properly.',
        status: 'in_progress',
        priority: 'medium',
        category: 'product',
        customer: 'customer_2',
        assignedAgent: 'user_2',
        createdAt: new Date('2024-10-05'),
        updatedAt: new Date('2024-10-07'),
        messages: [
          {
            _id: 'msg_3',
            content: 'The product I received has a defect. The screen has a crack and doesn\'t work properly.',
            sender: 'customer_2',
            senderType: 'customer',
            timestamp: new Date('2024-10-05T14:20:00')
          }
        ]
      },
      {
        _id: 'ticket_3',
        ticketId: 'TK003',
        title: 'Refund Request',
        description: 'I want to return this item and get a refund. It doesn\'t meet my expectations.',
        status: 'open',
        priority: 'low',
        category: 'returns',
        customer: 'customer_3',
        assignedAgent: null,
        createdAt: new Date('2024-10-07'),
        updatedAt: new Date('2024-10-07'),
        messages: [
          {
            _id: 'msg_4',
            content: 'I want to return this item and get a refund. It doesn\'t meet my expectations.',
            sender: 'customer_3',
            senderType: 'customer',
            timestamp: new Date('2024-10-07T09:45:00')
          }
        ]
      },
      {
        _id: 'ticket_4',
        ticketId: 'TK004',
        title: 'Payment Issue',
        description: 'I was charged twice for the same order. Please help me resolve this billing issue.',
        status: 'resolved',
        priority: 'high',
        category: 'billing',
        customer: 'customer_4',
        assignedAgent: 'user_2',
        createdAt: new Date('2024-10-03'),
        updatedAt: new Date('2024-10-06'),
        messages: [
          {
            _id: 'msg_5',
            content: 'I was charged twice for the same order. Please help me resolve this billing issue.',
            sender: 'customer_4',
            senderType: 'customer',
            timestamp: new Date('2024-10-03T16:30:00')
          },
          {
            _id: 'msg_6',
            content: 'I\'ve processed a refund for the duplicate charge. You should see it in your account within 3-5 business days.',
            sender: 'user_2',
            senderType: 'agent',
            timestamp: new Date('2024-10-06T10:15:00')
          }
        ]
      },
      {
        _id: 'ticket_5',
        ticketId: 'TK005',
        title: 'Technical Support',
        description: 'I\'m having trouble setting up the product. The instructions are unclear.',
        status: 'open',
        priority: 'medium',
        category: 'technical',
        customer: 'customer_5',
        assignedAgent: null,
        createdAt: new Date('2024-10-07'),
        updatedAt: new Date('2024-10-07'),
        messages: [
          {
            _id: 'msg_7',
            content: 'I\'m having trouble setting up the product. The instructions are unclear.',
            sender: 'customer_5',
            senderType: 'customer',
            timestamp: new Date('2024-10-07T13:20:00')
          }
        ]
      }
    ];

    // Mock Knowledge Base Articles
    this.knowledgeBase = [
      {
        _id: 'kb_1',
        title: 'How to Track Your Order',
        content: 'To track your order, follow these steps: 1. Go to our website and log in to your account. 2. Click on "My Orders" in your dashboard. 3. Find your order and click "Track Package". 4. You will see the current status and estimated delivery date.',
        category: 'shipping',
        tags: ['tracking', 'order', 'delivery', 'shipping'],
        author: 'user_1',
        isPublished: true,
        helpfulCount: 45,
        notHelpfulCount: 3,
        createdAt: new Date('2024-01-15'),
        lastUpdated: new Date('2024-09-20')
      },
      {
        _id: 'kb_2',
        title: 'Return Policy',
        content: 'Our return policy allows you to return items within 30 days of purchase. Items must be in original condition with tags attached. To start a return: 1. Log in to your account. 2. Go to "My Orders" and select the item. 3. Click "Return Item" and follow the instructions. 4. Print the return label and send the package back.',
        category: 'returns',
        tags: ['return', 'refund', 'policy', '30-days'],
        author: 'user_1',
        isPublished: true,
        helpfulCount: 32,
        notHelpfulCount: 1,
        createdAt: new Date('2024-01-10'),
        lastUpdated: new Date('2024-08-15')
      },
      {
        _id: 'kb_3',
        title: 'Payment Methods Accepted',
        content: 'We accept the following payment methods: Credit cards (Visa, MasterCard, American Express), Debit cards, PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through encrypted channels.',
        category: 'billing',
        tags: ['payment', 'credit-card', 'paypal', 'apple-pay'],
        author: 'user_1',
        isPublished: true,
        helpfulCount: 28,
        notHelpfulCount: 2,
        createdAt: new Date('2024-01-20'),
        lastUpdated: new Date('2024-07-10')
      },
      {
        _id: 'kb_4',
        title: 'Product Setup Guide',
        content: 'Setting up your product is easy: 1. Unbox the product and check all components. 2. Download the mobile app from App Store or Google Play. 3. Create an account or log in. 4. Follow the in-app setup instructions. 5. Connect to your Wi-Fi network. 6. Complete the setup wizard.',
        category: 'technical',
        tags: ['setup', 'installation', 'mobile-app', 'wifi'],
        author: 'user_2',
        isPublished: true,
        helpfulCount: 67,
        notHelpfulCount: 5,
        createdAt: new Date('2024-02-01'),
        lastUpdated: new Date('2024-09-25')
      },
      {
        _id: 'kb_5',
        title: 'Shipping Information',
        content: 'We offer free shipping on orders over $50. Standard shipping takes 3-5 business days. Express shipping (1-2 business days) is available for $9.99. International shipping is available to select countries with delivery times of 7-14 business days.',
        category: 'shipping',
        tags: ['shipping', 'free-shipping', 'delivery', 'international'],
        author: 'user_1',
        isPublished: true,
        helpfulCount: 41,
        notHelpfulCount: 4,
        createdAt: new Date('2024-01-25'),
        lastUpdated: new Date('2024-09-15')
      },
      {
        _id: 'kb_6',
        title: 'Account Management',
        content: 'Manage your account settings: 1. Log in and go to "Account Settings". 2. Update your personal information, email, and password. 3. Manage your notification preferences. 4. View your order history. 5. Update your shipping addresses.',
        category: 'account',
        tags: ['account', 'settings', 'profile', 'notifications'],
        author: 'user_1',
        isPublished: true,
        helpfulCount: 23,
        notHelpfulCount: 1,
        createdAt: new Date('2024-02-10'),
        lastUpdated: new Date('2024-08-30')
      },
      {
        _id: 'kb_7',
        title: 'Troubleshooting Common Issues',
        content: 'Common issues and solutions: 1. Product not connecting to Wi-Fi: Check your network password and ensure 2.4GHz band is enabled. 2. App not working: Update to the latest version. 3. Device not responding: Try resetting the device. 4. Poor performance: Check your internet connection speed.',
        category: 'technical',
        tags: ['troubleshooting', 'wifi', 'app', 'reset', 'performance'],
        author: 'user_2',
        isPublished: true,
        helpfulCount: 89,
        notHelpfulCount: 8,
        createdAt: new Date('2024-02-15'),
        lastUpdated: new Date('2024-10-01')
      },
      {
        _id: 'kb_8',
        title: 'Warranty Information',
        content: 'All products come with a 1-year manufacturer warranty covering defects in materials and workmanship. Warranty does not cover damage from misuse, accidents, or normal wear and tear. To claim warranty service, contact our support team with your purchase receipt.',
        category: 'warranty',
        tags: ['warranty', '1-year', 'defects', 'service'],
        author: 'user_1',
        isPublished: true,
        helpfulCount: 15,
        notHelpfulCount: 2,
        createdAt: new Date('2024-03-01'),
        lastUpdated: new Date('2024-07-20')
      },
      {
        _id: 'kb_9',
        title: 'Security and Privacy',
        content: 'We take your security seriously. All personal and payment information is encrypted and stored securely. We never share your data with third parties without your consent. You can review our privacy policy and manage your data preferences in your account settings.',
        category: 'security',
        tags: ['security', 'privacy', 'encryption', 'data-protection'],
        author: 'user_1',
        isPublished: true,
        helpfulCount: 34,
        notHelpfulCount: 1,
        createdAt: new Date('2024-03-10'),
        lastUpdated: new Date('2024-08-05')
      },
      {
        _id: 'kb_10',
        title: 'Customer Support Hours',
        content: 'Our customer support team is available: Monday-Friday: 9 AM - 6 PM EST, Saturday: 10 AM - 4 PM EST, Sunday: Closed. For urgent issues outside these hours, you can submit a ticket and we\'ll respond within 24 hours.',
        category: 'support',
        tags: ['support', 'hours', 'contact', '24-hours'],
        author: 'user_1',
        isPublished: true,
        helpfulCount: 52,
        notHelpfulCount: 3,
        createdAt: new Date('2024-03-15'),
        lastUpdated: new Date('2024-09-10')
      }
    ];

    // Mock Automation Rules
    this.automationRules = [
      {
        _id: 'rule_1',
        name: 'High Priority Auto-Assignment',
        description: 'Automatically assign high priority tickets to senior agents',
        conditions: [
          { field: 'priority', operator: 'equals', value: 'high' }
        ],
        actions: [
          { type: 'assign_agent', value: 'user_2' },
          { type: 'set_category', value: 'urgent' }
        ],
        isActive: true,
        priority: 1,
        triggerCount: 45,
        lastTriggered: new Date('2024-10-06'),
        createdAt: new Date('2024-01-15')
      },
      {
        _id: 'rule_2',
        name: 'Shipping Issues Escalation',
        description: 'Escalate shipping-related tickets to logistics team',
        conditions: [
          { field: 'category', operator: 'equals', value: 'shipping' },
          { field: 'priority', operator: 'equals', value: 'high' }
        ],
        actions: [
          { type: 'assign_agent', value: 'user_3' },
          { type: 'add_tag', value: 'logistics-escalated' }
        ],
        isActive: true,
        priority: 2,
        triggerCount: 23,
        lastTriggered: new Date('2024-10-05'),
        createdAt: new Date('2024-02-01')
      },
      {
        _id: 'rule_3',
        name: 'VIP Customer Priority',
        description: 'Give priority to platinum tier customers',
        conditions: [
          { field: 'customerTier', operator: 'equals', value: 'platinum' }
        ],
        actions: [
          { type: 'set_priority', value: 'high' },
          { type: 'assign_agent', value: 'user_2' }
        ],
        isActive: true,
        priority: 3,
        triggerCount: 67,
        lastTriggered: new Date('2024-10-07'),
        createdAt: new Date('2024-01-20')
      },
      {
        _id: 'rule_4',
        name: 'Auto-Response for Returns',
        description: 'Send automatic response for return requests',
        conditions: [
          { field: 'category', operator: 'equals', value: 'returns' }
        ],
        actions: [
          { type: 'send_message', value: 'Thank you for your return request. We will process it within 24 hours.' },
          { type: 'add_tag', value: 'auto-response-sent' }
        ],
        isActive: true,
        priority: 4,
        triggerCount: 89,
        lastTriggered: new Date('2024-10-07'),
        createdAt: new Date('2024-02-10')
      },
      {
        _id: 'rule_5',
        name: 'Weekend Ticket Handling',
        description: 'Handle tickets created on weekends',
        conditions: [
          { field: 'createdDay', operator: 'in', value: ['saturday', 'sunday'] }
        ],
        actions: [
          { type: 'send_message', value: 'Thank you for contacting us. We will respond on the next business day.' },
          { type: 'set_priority', value: 'low' }
        ],
        isActive: false,
        priority: 5,
        triggerCount: 12,
        lastTriggered: new Date('2024-09-28'),
        createdAt: new Date('2024-03-01')
      }
    ];

    // Mock Issue Detection Data
    this.issues = [
      {
        _id: 'issue_1',
        title: 'Logistics Breakdown: Delivery partner performance issues',
        description: 'Multiple customers reporting delayed deliveries from our primary logistics partner',
        category: 'logistics',
        severity: 'critical',
        affectedCustomers: 45,
        rootCause: 'Logistics partner experiencing capacity constraints',
        recommendations: [
          'Switch to backup logistics partner for affected regions',
          'Implement real-time tracking notifications',
          'Offer compensation to affected customers'
        ],
        status: 'active',
        createdAt: new Date('2024-10-05'),
        lastUpdated: new Date('2024-10-07')
      },
      {
        _id: 'issue_2',
        title: 'Payment Gateway Intermittent Failures',
        description: 'Customers experiencing payment failures during checkout process',
        category: 'technology',
        severity: 'high',
        affectedCustomers: 23,
        rootCause: 'Third-party payment gateway API rate limiting',
        recommendations: [
          'Implement payment retry logic',
          'Add alternative payment methods',
          'Monitor gateway performance metrics'
        ],
        status: 'investigating',
        createdAt: new Date('2024-10-06'),
        lastUpdated: new Date('2024-10-07')
      },
      {
        _id: 'issue_3',
        title: 'Product Quality Defects in Recent Batch',
        description: 'Increased reports of defective products from recent manufacturing batch',
        category: 'quality',
        severity: 'medium',
        affectedCustomers: 18,
        rootCause: 'Manufacturing process deviation',
        recommendations: [
          'Halt shipment of affected batch',
          'Implement additional quality checks',
          'Recall affected products'
        ],
        status: 'resolved',
        createdAt: new Date('2024-10-03'),
        lastUpdated: new Date('2024-10-06')
      }
    ];
  }

  // User methods
  findUserById(id) {
    return this.users.find(user => user._id === id);
  }

  findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  getAllUsers() {
    return this.users;
  }

  // Customer methods
  getAllCustomers() {
    return this.customers;
  }

  findCustomerById(id) {
    return this.customers.find(customer => customer._id === id);
  }

  findCustomerByEmail(email) {
    return this.customers.find(customer => customer.email === email);
  }

  createCustomer(customerData) {
    const newCustomer = {
      _id: `customer_${Date.now()}`,
      ...customerData,
      createdAt: new Date()
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  updateCustomer(id, updateData) {
    const index = this.customers.findIndex(customer => customer._id === id);
    if (index !== -1) {
      this.customers[index] = { ...this.customers[index], ...updateData };
      return this.customers[index];
    }
    return null;
  }

  // Ticket methods
  getAllTickets(filters = {}) {
    let filteredTickets = [...this.tickets];
    
    if (filters.status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === filters.status);
    }
    if (filters.priority) {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === filters.priority);
    }
    if (filters.category) {
      filteredTickets = filteredTickets.filter(ticket => ticket.category === filters.category);
    }
    if (filters.assignedAgent) {
      filteredTickets = filteredTickets.filter(ticket => ticket.assignedAgent === filters.assignedAgent);
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchTerm) ||
        ticket.description.toLowerCase().includes(searchTerm) ||
        ticket.ticketId.toLowerCase().includes(searchTerm)
      );
    }

    return filteredTickets;
  }

  findTicketById(id) {
    return this.tickets.find(ticket => ticket._id === id);
  }

  createTicket(ticketData) {
    const newTicket = {
      _id: `ticket_${Date.now()}`,
      ticketId: `TK${String(this.tickets.length + 1).padStart(3, '0')}`,
      ...ticketData,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    this.tickets.push(newTicket);
    return newTicket;
  }

  updateTicket(id, updateData) {
    const index = this.tickets.findIndex(ticket => ticket._id === id);
    if (index !== -1) {
      this.tickets[index] = { 
        ...this.tickets[index], 
        ...updateData, 
        updatedAt: new Date() 
      };
      return this.tickets[index];
    }
    return null;
  }

  addMessageToTicket(ticketId, messageData) {
    const ticket = this.findTicketById(ticketId);
    if (ticket) {
      const newMessage = {
        _id: `msg_${Date.now()}`,
        ...messageData,
        timestamp: new Date()
      };
      ticket.messages.push(newMessage);
      ticket.updatedAt = new Date();
      return ticket;
    }
    return null;
  }

  // Knowledge Base methods
  getAllKnowledgeArticles(filters = {}) {
    let filteredArticles = [...this.knowledgeBase];
    
    if (filters.category) {
      filteredArticles = filteredArticles.filter(article => article.category === filters.category);
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredArticles = filteredArticles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return filteredArticles;
  }

  findKnowledgeArticleById(id) {
    return this.knowledgeBase.find(article => article._id === id);
  }

  createKnowledgeArticle(articleData) {
    const newArticle = {
      _id: `kb_${Date.now()}`,
      ...articleData,
      isPublished: true,
      helpfulCount: 0,
      notHelpfulCount: 0,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    this.knowledgeBase.push(newArticle);
    return newArticle;
  }

  updateKnowledgeArticle(id, updateData) {
    const index = this.knowledgeBase.findIndex(article => article._id === id);
    if (index !== -1) {
      this.knowledgeBase[index] = { 
        ...this.knowledgeBase[index], 
        ...updateData, 
        lastUpdated: new Date() 
      };
      return this.knowledgeBase[index];
    }
    return null;
  }

  // Automation Rules methods
  getAllAutomationRules() {
    return this.automationRules;
  }

  findAutomationRuleById(id) {
    return this.automationRules.find(rule => rule._id === id);
  }

  createAutomationRule(ruleData) {
    const newRule = {
      _id: `rule_${Date.now()}`,
      ...ruleData,
      isActive: true,
      triggerCount: 0,
      createdAt: new Date()
    };
    this.automationRules.push(newRule);
    return newRule;
  }

  updateAutomationRule(id, updateData) {
    const index = this.automationRules.findIndex(rule => rule._id === id);
    if (index !== -1) {
      this.automationRules[index] = { ...this.automationRules[index], ...updateData };
      return this.automationRules[index];
    }
    return null;
  }

  // Issue Detection methods
  getAllIssues() {
    return this.issues;
  }

  findIssueById(id) {
    return this.issues.find(issue => issue._id === id);
  }

  // Dashboard statistics
  getDashboardStats() {
    const totalTickets = this.tickets.length;
    const openTickets = this.tickets.filter(t => t.status === 'open').length;
    const inProgressTickets = this.tickets.filter(t => t.status === 'in_progress').length;
    const resolvedTickets = this.tickets.filter(t => t.status === 'resolved').length;
    const totalCustomers = this.customers.length;
    const totalAgents = this.users.filter(u => u.role === 'agent').length;
    const highPriorityTickets = this.tickets.filter(t => t.priority === 'high').length;
    const avgResolutionTime = 2.5; // Mock average in hours

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      totalCustomers,
      totalAgents,
      highPriorityTickets,
      avgResolutionTime
    };
  }

  // Search functionality
  searchAll(query) {
    const searchTerm = query.toLowerCase();
    const results = {
      tickets: this.tickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchTerm) ||
        ticket.description.toLowerCase().includes(searchTerm)
      ),
      customers: this.customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm)
      ),
      knowledge: this.knowledgeBase.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm)
      )
    };
    return results;
  }
}

// Create singleton instance
const mockDataService = new MockDataService();

module.exports = mockDataService;
