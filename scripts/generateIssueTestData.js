const mongoose = require('mongoose');
require('dotenv').config();

const Ticket = require('../models/Ticket');
const Customer = require('../models/Customer');
const User = require('../models/User');

// Mock data for testing issue detection
const mockCustomers = [
  {
    customerId: 'CUST-001001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0123',
    customerTier: 'gold',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    loyaltyPoints: 2500
  },
  {
    customerId: 'CUST-001002',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1-555-0124',
    customerTier: 'platinum',
    address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    loyaltyPoints: 5000
  },
  {
    customerId: 'CUST-001003',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1-555-0125',
    customerTier: 'silver',
    address: {
      street: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    },
    loyaltyPoints: 1200
  },
  {
    customerId: 'CUST-001004',
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '+1-555-0126',
    customerTier: 'bronze',
    address: {
      street: '321 Elm St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA'
    },
    loyaltyPoints: 300
  },
  {
    customerId: 'CUST-001005',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@email.com',
    phone: '+1-555-0127',
    customerTier: 'gold',
    address: {
      street: '654 Maple Dr',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      country: 'USA'
    },
    loyaltyPoints: 2800
  }
];

// Issue patterns for different supply chain categories
const issuePatterns = {
  inventory: [
    {
      subject: 'Product out of stock - urgent order needed',
      description: 'I need to place an urgent order for 50 units of Product XYZ but it shows as out of stock. This is for a client presentation tomorrow. Can you help me get this resolved immediately?',
      priority: 'urgent',
      category: 'order'
    },
    {
      subject: 'Backorder notification - when will item be available?',
      description: 'I received a backorder notification for my order #12345. The item was supposed to be in stock. When can I expect it to be available? This is affecting my business operations.',
      priority: 'high',
      category: 'order'
    },
    {
      subject: 'Inventory discrepancy - wrong quantity shown',
      description: 'The website shows 100 units available but when I try to order 50, it says only 5 are available. There seems to be an inventory tracking issue.',
      priority: 'medium',
      category: 'technical'
    },
    {
      subject: 'Stock shortage affecting multiple products',
      description: 'I\'m trying to place a bulk order but 3 out of 5 products are showing as out of stock. This is a recurring issue with your inventory management.',
      priority: 'high',
      category: 'order'
    }
  ],
  logistics: [
    {
      subject: 'Delivery delayed - package stuck in transit',
      description: 'My package has been stuck in transit for 5 days now. The tracking shows it left the distribution center but hasn\'t moved since. This is unacceptable.',
      priority: 'high',
      category: 'shipping'
    },
    {
      subject: 'Wrong delivery address - package sent to old address',
      description: 'I updated my address in my account but the package was still sent to my old address. The carrier says they can\'t redirect it. What can you do?',
      priority: 'urgent',
      category: 'shipping'
    },
    {
      subject: 'Carrier lost my package - need immediate resolution',
      description: 'The carrier is saying they lost my package worth $500. This is the second time this has happened with your shipping partner. I need this resolved now.',
      priority: 'urgent',
      category: 'shipping'
    },
    {
      subject: 'Delivery attempt failed - no one was home',
      description: 'The delivery was attempted but no one was home. I was told I\'d be notified but I never received any call or email. Now I have to wait another day.',
      priority: 'medium',
      category: 'shipping'
    },
    {
      subject: 'Package damaged during shipping',
      description: 'My package arrived damaged due to poor handling by the carrier. The contents are broken and unusable. I need a replacement immediately.',
      priority: 'high',
      category: 'shipping'
    }
  ],
  fulfillment: [
    {
      subject: 'Order processing taking too long',
      description: 'I placed my order 3 days ago and it\'s still showing as "processing". Usually it ships within 24 hours. What\'s the delay?',
      priority: 'medium',
      category: 'order'
    },
    {
      subject: 'Wrong items in my order',
      description: 'I ordered a blue shirt but received a red one. The packing slip shows blue but the actual item is red. This is a fulfillment error.',
      priority: 'high',
      category: 'order'
    },
    {
      subject: 'Missing items from my order',
      description: 'My order was supposed to contain 5 items but I only received 3. The packing list shows all 5 items but 2 are missing from the box.',
      priority: 'high',
      category: 'order'
    },
    {
      subject: 'Order packed incorrectly - fragile items damaged',
      description: 'My fragile items were packed without proper protection and arrived damaged. The fulfillment team needs better training on handling delicate products.',
      priority: 'high',
      category: 'order'
    }
  ],
  payment: [
    {
      subject: 'Payment failed - card charged but order not confirmed',
      description: 'My credit card was charged $150 but I never received an order confirmation. The payment went through but the order seems to have failed. Where is my money?',
      priority: 'urgent',
      category: 'billing'
    },
    {
      subject: 'Duplicate charge on my credit card',
      description: 'I was charged twice for the same order. I can see two identical charges of $89.99 on my statement. Please refund the duplicate charge immediately.',
      priority: 'high',
      category: 'billing'
    },
    {
      subject: 'Refund not processed after 2 weeks',
      description: 'I returned my item 2 weeks ago and was told I\'d get a refund within 5-7 business days. It\'s been 2 weeks and I still haven\'t received my refund.',
      priority: 'high',
      category: 'billing'
    },
    {
      subject: 'Incorrect billing amount - overcharged',
      description: 'I was charged $199.99 but the item price was $149.99. There seems to be a billing error. Please correct this and refund the difference.',
      priority: 'medium',
      category: 'billing'
    }
  ],
  quality: [
    {
      subject: 'Product quality is terrible - not as advertised',
      description: 'The product I received is completely different from what was advertised. The quality is poor and it looks nothing like the photos. This is false advertising.',
      priority: 'high',
      category: 'return'
    },
    {
      subject: 'Defective product - safety hazard',
      description: 'The product I received has a manufacturing defect that could be a safety hazard. The item is not safe to use. I need an immediate replacement.',
      priority: 'urgent',
      category: 'return'
    },
    {
      subject: 'Poor quality control - multiple defective items',
      description: 'I\'ve ordered from you 3 times in the past month and each time I received defective products. Your quality control is clearly not working properly.',
      priority: 'high',
      category: 'return'
    },
    {
      subject: 'Product arrived damaged due to poor packaging',
      description: 'The product arrived damaged because it was poorly packaged. The box was too small and the item was crushed. This is a packaging quality issue.',
      priority: 'medium',
      category: 'return'
    }
  ],
  customer_service: [
    {
      subject: 'No response to my support ticket for 3 days',
      description: 'I submitted a support ticket 3 days ago and haven\'t received any response. This is unacceptable customer service. I need help with my order.',
      priority: 'high',
      category: 'general'
    },
    {
      subject: 'Support agent was unhelpful and rude',
      description: 'I called customer service and the agent was unhelpful and rude. They didn\'t listen to my concerns and just kept repeating the same unhelpful information.',
      priority: 'medium',
      category: 'general'
    },
    {
      subject: 'Long wait times for customer service',
      description: 'I\'ve been on hold for 45 minutes trying to reach customer service. This is ridiculous. I have a simple question about my order status.',
      priority: 'medium',
      category: 'general'
    },
    {
      subject: 'Conflicting information from different agents',
      description: 'I\'ve spoken to 3 different agents and each one gave me different information about my order. This is confusing and unprofessional.',
      priority: 'medium',
      category: 'general'
    }
  ],
  technology: [
    {
      subject: 'Website keeps crashing when I try to checkout',
      description: 'Every time I try to complete my purchase, the website crashes and I lose my cart. This has happened 5 times now. I can\'t place my order.',
      priority: 'high',
      category: 'technical'
    },
    {
      subject: 'Mobile app not working properly',
      description: 'The mobile app keeps freezing and I can\'t view my orders or track shipments. I\'ve tried reinstalling but the problem persists.',
      priority: 'medium',
      category: 'technical'
    },
    {
      subject: 'Login issues - can\'t access my account',
      description: 'I can\'t log into my account. The system keeps saying my password is wrong even though I know it\'s correct. I\'ve tried resetting it multiple times.',
      priority: 'high',
      category: 'technical'
    },
    {
      subject: 'Order tracking system not updating',
      description: 'The order tracking system hasn\'t updated in 3 days. I can\'t see where my package is or when it will arrive. The tracking information is outdated.',
      priority: 'medium',
      category: 'technical'
    }
  ]
};

// Generate realistic timestamps over the last 30 days
function generateTimestamps(count) {
  const timestamps = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < count; i++) {
    const randomTime = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
    timestamps.push(randomTime);
  }
  
  return timestamps.sort((a, b) => a - b);
}

// Create realistic message history for tickets
function generateMessageHistory(subject, description, customerName) {
  const messages = [
    {
      sender: 'customer',
      content: description,
      timestamp: new Date(),
      isAI: false
    }
  ];
  
  // Add some system responses based on category
  if (subject.toLowerCase().includes('urgent') || subject.toLowerCase().includes('critical')) {
    messages.push({
      sender: 'system',
      content: 'Ticket escalated to high priority due to urgent nature of request.',
      timestamp: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes later
      isAI: false
    });
  }
  
  if (subject.toLowerCase().includes('refund') || subject.toLowerCase().includes('billing')) {
    messages.push({
      sender: 'agent',
      content: `Hi ${customerName}, I understand your concern about the billing issue. Let me investigate this for you and get back to you within 24 hours.`,
      timestamp: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes later
      isAI: false
    });
  }
  
  return messages;
}

async function generateTestData() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_support');
    
    console.log('Clearing existing test data...');
    await Ticket.deleteMany({});
    await Customer.deleteMany({});
    
    console.log('Creating mock customers...');
    const customers = await Customer.insertMany(mockCustomers);
    console.log(`Created ${customers.length} customers`);
    
    console.log('Generating mock tickets...');
    const allTickets = [];
    const timestamps = generateTimestamps(150); // Generate 150 tickets over 30 days
    
    let timestampIndex = 0;
    
    // Generate tickets for each issue pattern
    for (const [category, issues] of Object.entries(issuePatterns)) {
      // Create more tickets for critical categories to simulate real patterns
      const ticketCount = category === 'logistics' ? 25 : 
                         category === 'inventory' ? 20 :
                         category === 'quality' ? 18 :
                         category === 'payment' ? 15 :
                         category === 'fulfillment' ? 12 :
                         category === 'customer_service' ? 10 :
                         category === 'technology' ? 8 : 5;
      
      for (let i = 0; i < ticketCount; i++) {
        const issueTemplate = issues[Math.floor(Math.random() * issues.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        const ticket = {
          ticketId: `TKT-${Date.now()}-${Math.floor(Math.random() * 10000)}-${i}`,
          customerId: customer._id,
          subject: issueTemplate.subject,
          description: issueTemplate.description,
          priority: issueTemplate.priority,
          status: Math.random() > 0.3 ? 'open' : 
                 Math.random() > 0.5 ? 'in_progress' : 'resolved',
          category: issueTemplate.category,
          channel: ['email', 'chat', 'phone', 'social'][Math.floor(Math.random() * 4)],
          messages: generateMessageHistory(issueTemplate.subject, issueTemplate.description, customer.name),
          createdAt: timestamps[timestampIndex] || new Date(),
          updatedAt: timestamps[timestampIndex] || new Date()
        };
        
        allTickets.push(ticket);
        timestampIndex++;
      }
    }
    
    // Insert all tickets
    const createdTickets = await Ticket.insertMany(allTickets);
    console.log(`Created ${createdTickets.length} tickets`);
    
    // Create some realistic order history for customers
    console.log('Adding order history to customers...');
    for (const customer of customers) {
      const orderCount = Math.floor(Math.random() * 10) + 1;
      const orders = [];
      
      for (let i = 0; i < orderCount; i++) {
        const orderDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
        orders.push({
          orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          orderDate: orderDate,
          status: ['completed', 'shipped', 'processing', 'cancelled'][Math.floor(Math.random() * 4)],
          totalAmount: Math.floor(Math.random() * 500) + 50,
          items: [{
            productId: `PROD-${Math.floor(Math.random() * 1000)}`,
            productName: `Product ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            quantity: Math.floor(Math.random() * 5) + 1,
            price: Math.floor(Math.random() * 100) + 20
          }]
        });
      }
      
      customer.orderHistory = orders;
      await customer.save();
    }
    
    console.log('Test data generation completed successfully!');
    console.log('\nSummary:');
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Tickets: ${createdTickets.length}`);
    console.log(`- Time range: Last 30 days`);
    console.log('\nYou can now test the issue detection system with realistic data.');
    
  } catch (error) {
    console.error('Error generating test data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
if (require.main === module) {
  generateTestData();
}

module.exports = { generateTestData, mockCustomers, issuePatterns };
