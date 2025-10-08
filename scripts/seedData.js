const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Ticket = require('../models/Ticket');
const KnowledgeBase = require('../models/KnowledgeBase');
const AutomationRule = require('../models/AutomationRule');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_support', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedData() {
  try {
    console.log('Starting data seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Ticket.deleteMany({});
    await KnowledgeBase.deleteMany({});
    await AutomationRule.deleteMany({});
    console.log('Existing data cleared.');

    // Create users
    console.log('Creating users...');
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      department: 'support'
    });
    await adminUser.save();
    console.log('Admin user created');

    const agent1 = new User({
      name: 'John Smith',
      email: 'john@example.com',
      password: 'password123',
      role: 'agent',
      department: 'support'
    });
    await agent1.save();
    console.log('Agent 1 created');

    const agent2 = new User({
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      password: 'password123',
      role: 'agent',
      department: 'technical'
    });
    await agent2.save();
    console.log('Agent 2 created');

    // Create customers
    console.log('Creating customers...');
    const customer1 = new Customer({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1-555-0123',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      customerTier: 'gold',
      loyaltyPoints: 2500,
      orderHistory: [
        {
          orderId: 'ORD-001',
          orderDate: new Date('2024-01-15'),
          status: 'delivered',
          totalAmount: 299.99,
          items: [
            { productId: 'PROD-001', productName: 'Wireless Headphones', quantity: 1, price: 299.99 }
          ]
        },
        {
          orderId: 'ORD-002',
          orderDate: new Date('2024-01-20'),
          status: 'shipped',
          totalAmount: 149.99,
          items: [
            { productId: 'PROD-002', productName: 'Smart Watch', quantity: 1, price: 149.99 }
          ]
        }
      ],
      cartItems: [
        {
          productId: 'PROD-003',
          productName: 'Phone Case',
          quantity: 2,
          price: 19.99,
          addedDate: new Date()
        }
      ]
    });
    await customer1.save();
    console.log('Customer 1 created with ID:', customer1.customerId);

    const customer2 = new Customer({
      name: 'Bob Wilson',
      email: 'bob@example.com',
      phone: '+1-555-0456',
      address: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      customerTier: 'silver',
      loyaltyPoints: 1200,
      orderHistory: [
        {
          orderId: 'ORD-003',
          orderDate: new Date('2024-01-10'),
          status: 'delivered',
          totalAmount: 89.99,
          items: [
            { productId: 'PROD-004', productName: 'Laptop Stand', quantity: 1, price: 89.99 }
          ]
        }
      ],
      cartItems: []
    });
    await customer2.save();
    console.log('Customer 2 created with ID:', customer2.customerId);

    // Create tickets
    console.log('Creating tickets...');
    const ticket1 = new Ticket({
      customerId: customer1._id,
      subject: 'Order not delivered',
      description: 'I placed an order 5 days ago but it still hasn\'t arrived. The tracking shows it was delivered but I never received it.',
      category: 'order',
      priority: 'high',
      status: 'open',
      channel: 'email',
      tags: ['delivery', 'missing-package'],
      messages: [
        {
          sender: 'customer',
          content: 'I placed an order 5 days ago but it still hasn\'t arrived. The tracking shows it was delivered but I never received it.',
          timestamp: new Date()
        },
        {
          sender: 'system',
          content: 'Thank you for contacting us about your order. I understand how frustrating it must be to not receive your package when the tracking shows it as delivered. Let me investigate this issue for you right away.',
          timestamp: new Date(),
          isAI: true
        }
      ]
    });
    await ticket1.save();
    console.log('Ticket 1 created with ID:', ticket1.ticketId);

    const ticket2 = new Ticket({
      customerId: customer2._id,
      subject: 'Return request for laptop stand',
      description: 'I want to return the laptop stand I ordered. It doesn\'t fit my laptop properly.',
      category: 'return',
      priority: 'medium',
      status: 'in_progress',
      channel: 'chat',
      assignedAgent: agent1._id,
      tags: ['return', 'laptop-stand'],
      messages: [
        {
          sender: 'customer',
          content: 'I want to return the laptop stand I ordered. It doesn\'t fit my laptop properly.',
          timestamp: new Date()
        },
        {
          sender: 'agent',
          content: 'I\'m sorry to hear that the laptop stand doesn\'t fit your laptop. I\'d be happy to help you with the return process. Could you please provide your order number?',
          timestamp: new Date()
        }
      ]
    });
    await ticket2.save();
    console.log('Ticket 2 created with ID:', ticket2.ticketId);

    // Create knowledge base articles
    console.log('Creating knowledge base articles...');
    const article1 = new KnowledgeBase({
      title: 'How to track your order',
      content: 'You can track your order by logging into your account and going to the "My Orders" section. You can also use the tracking number provided in your confirmation email to track your package on the carrier\'s website.',
      category: 'faq',
      tags: ['tracking', 'orders', 'shipping'],
      keywords: ['track', 'order', 'shipping', 'delivery'],
      author: adminUser._id,
      viewCount: 150,
      helpfulCount: 45
    });
    await article1.save();
    console.log('Article 1 created');

    const article2 = new KnowledgeBase({
      title: 'Return and exchange policy',
      content: 'We offer a 30-day return policy for most items. Items must be in original condition with tags attached. Electronics have a 14-day return window. To initiate a return, please contact our support team or use the return portal in your account.',
      category: 'policy',
      tags: ['returns', 'exchanges', 'policy'],
      keywords: ['return', 'exchange', 'refund', 'policy'],
      author: adminUser._id,
      viewCount: 89,
      helpfulCount: 32
    });
    await article2.save();
    console.log('Article 2 created');

    const article3 = new KnowledgeBase({
      title: 'Troubleshooting wireless headphones connection issues',
      content: 'If you\'re having trouble connecting your wireless headphones, try these steps: 1) Make sure the headphones are charged, 2) Reset the headphones by holding the power button for 10 seconds, 3) Remove the device from your Bluetooth settings and pair again, 4) Check if your device\'s Bluetooth is enabled.',
      category: 'troubleshooting',
      tags: ['headphones', 'bluetooth', 'connection', 'troubleshooting'],
      keywords: ['headphones', 'bluetooth', 'connect', 'pair', 'troubleshoot'],
      author: agent2._id,
      viewCount: 67,
      helpfulCount: 28
    });
    await article3.save();
    console.log('Article 3 created');

    // Create automation rules
    console.log('Creating automation rules...');
    const rule1 = new AutomationRule({
      name: 'Auto-assign high priority tickets',
      description: 'Automatically assign high priority tickets to available agents',
      conditions: [
        { field: 'priority', operator: 'equals', value: 'high' },
        { field: 'status', operator: 'equals', value: 'open' }
      ],
      actions: [
        { type: 'assign_agent', parameters: { agentId: agent1._id } },
        { type: 'add_tag', parameters: { tag: 'auto-assigned' } }
      ],
      priority: 10,
      createdBy: adminUser._id,
      triggerCount: 5
    });
    await rule1.save();
    console.log('Rule 1 created');

    const rule2 = new AutomationRule({
      name: 'Escalate urgent tickets',
      description: 'Escalate urgent tickets to highest priority and notify management',
      conditions: [
        { field: 'priority', operator: 'equals', value: 'urgent' }
      ],
      actions: [
        { type: 'escalate', parameters: {} },
        { type: 'add_tag', parameters: { tag: 'escalated' } }
      ],
      priority: 20,
      createdBy: adminUser._id,
      triggerCount: 2
    });
    await rule2.save();
    console.log('Rule 2 created');

    const rule3 = new AutomationRule({
      name: 'Auto-close resolved tickets after 24 hours',
      description: 'Automatically close tickets that have been resolved for more than 24 hours',
      conditions: [
        { field: 'status', operator: 'equals', value: 'resolved' }
      ],
      actions: [
        { type: 'close_ticket', parameters: {} }
      ],
      priority: 5,
      createdBy: adminUser._id,
      triggerCount: 0
    });
    await rule3.save();
    console.log('Rule 3 created');

    console.log('Data seeding completed successfully!');
    console.log('Created:');
    console.log('- 3 users (1 admin, 2 agents)');
    console.log(`- 2 customers with order history and cart data (${customer1.customerId}, ${customer2.customerId})`);
    console.log(`- 2 tickets with messages (${ticket1.ticketId}, ${ticket2.ticketId})`);
    console.log('- 3 knowledge base articles');
    console.log('- 3 automation rules');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@example.com / password123');
    console.log('Agent 1: john@example.com / password123');
    console.log('Agent 2: sarah@example.com / password123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();
