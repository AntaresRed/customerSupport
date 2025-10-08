const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { ensureConnection, withConnection, getConnectionStatus } = require('./utils/dbConnection');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection middleware for serverless environments
app.use('/api', withConnection);

// Database connection with persistent management
async function connectDB() {
  try {
    // Always ensure connection in serverless environment
    if (process.env.NODE_ENV === 'production') {
      return await ensureConnection();
    }
    
    // For local development, only connect if not already connected
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      console.log('📡 Database already connected or connecting');
      return;
    }
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_support', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
}

// Ensure connection for serverless environments
async function ensureConnection() {
  try {
    const state = mongoose.connection.readyState;
    console.log(`🔍 Connection state: ${state} (${getConnectionStateName(state)})`);
    
    if (state === 1) {
      console.log('✅ Database already connected');
      return true;
    }
    
    // Force fresh connection for serverless
    console.log('🔄 Establishing fresh connection for serverless...');
    
    // Close any existing connection
    if (state !== 0) {
      await mongoose.connection.close();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 1, // Single connection for serverless
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Fresh connection established');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

// Force database connection for serverless environments
async function forceDBConnection() {
  try {
    console.log('🔄 Force connecting to database...');
    
    // Close any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔒 Closed existing connection');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Create fresh connection
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_support', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000, // 20 seconds timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 20000,
      maxPoolSize: 1, // Single connection for serverless
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Force connection successful');
    return true;
  } catch (error) {
    console.error('❌ Force connection failed:', error);
    return false;
  }
}

// Connect to database
connectDB();

// Database connection status check - now uses the new ensureConnection
async function ensureDBConnection() {
  return await ensureConnection();
}

// Helper function to get connection state name
function getConnectionStateName(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting', 
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/automation', require('./routes/automation'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/issue-detection', require('./routes/issueDetection'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const status = getConnectionStatus();
    
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      version: '4.0 - Persistent Connection Fix',
      database: status,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Connection test endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    const connected = await ensureConnection();
    
    if (connected) {
      res.json({
        success: true,
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
        state: mongoose.connection.readyState,
        stateName: getConnectionStateName(mongoose.connection.readyState)
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is working!',
    time: new Date().toISOString(),
    deployment: 'latest-v3.0'
  });
});

// Debug endpoint to check deployment status
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint - Force Deploy v3.0',
    timestamp: new Date().toISOString(),
    mongooseState: mongoose.connection.readyState,
    mongooseStates: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    },
    currentState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    version: '3.0',
    forceRedeploy: true
  });
});

// Database connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    
    // Force fresh connection
    const connectionSuccess = await forceDBConnection();
    const connectionStates = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (connectionSuccess) {
      // Try a simple database operation
      const User = require('./models/User');
      const userCount = await User.countDocuments();
      console.log(`✅ Database test successful - found ${userCount} users`);
      
      res.json({
        success: true,
        message: 'Database connected and operational',
        connectionState: mongoose.connection.readyState,
        connectionStates: connectionStates,
        currentState: connectionStates[mongoose.connection.readyState] || 'unknown',
        testOperation: `Successfully queried ${userCount} users`
      });
    } else {
      res.json({
        success: false,
        message: 'Database connection failed',
        connectionState: mongoose.connection.readyState,
        connectionStates: connectionStates,
        currentState: connectionStates[mongoose.connection.readyState] || 'unknown'
      });
    }
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      connectionState: mongoose.connection.readyState
    });
  }
});

// Data verification endpoint
app.get('/api/verify-data', async (req, res) => {
  try {
    // Ensure database connection
    const isConnected = await ensureDBConnection();
    if (!isConnected) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        connectionState: mongoose.connection.readyState
      });
    }
    
    const Customer = require('./models/Customer');
    const Ticket = require('./models/Ticket');
    const User = require('./models/User');
    
    const customers = await Customer.find({}).limit(5);
    const tickets = await Ticket.find({}).limit(5);
    const users = await User.find({}).limit(5);
    
    res.json({
      success: true,
      connectionState: mongoose.connection.readyState,
      counts: {
        customers: await Customer.countDocuments(),
        tickets: await Ticket.countDocuments(),
        users: await User.countDocuments()
      },
      sampleData: {
        customers: customers.map(c => ({
          id: c._id,
          name: c.name,
          email: c.email,
          customerId: c.customerId
        })),
        tickets: tickets.map(t => ({
          id: t._id,
          subject: t.subject,
          status: t.status,
          customerId: t.customerId
        })),
        users: users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      connectionState: mongoose.connection.readyState
    });
  }
});

// Setup endpoint for database initialization
app.get('/api/setup', async (req, res) => {
  try {
    const { setupProduction } = require('./scripts/setupProduction');
    await setupProduction();
    res.json({ 
      success: true, 
      message: 'Database setup completed successfully!',
      credentials: {
        email: 'admin@example.com',
        password: 'admin123'
      },
      note: 'Please change the default password in production!'
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Simplified setup endpoint - step by step approach
app.get('/api/init-all', async (req, res) => {
  console.log('🚀 Starting simplified initialization...');
  
  try {
    // Step 1: Test database connection
    console.log('🔄 Testing database connection...');
    const connectionSuccess = await forceDBConnection();
    
    if (!connectionSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        message: 'Cannot establish database connection',
        connectionState: mongoose.connection.readyState
      });
    }
    
    console.log('✅ Database connection successful');
    
    // Step 2: Create admin user
    console.log('👤 Creating admin user...');
    const User = require('./models/User');
    
    let adminUser = await User.findOne({ email: 'admin@example.com' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    // Step 3: Create sample customers
    console.log('👥 Creating sample customers...');
    const Customer = require('./models/Customer');
    
    const existingCustomers = await Customer.countDocuments();
    if (existingCustomers === 0) {
      const customers = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          customerId: 'CUST001',
          customerTier: 'gold'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          customerId: 'CUST002',
          customerTier: 'platinum'
        }
      ];
      
      await Customer.insertMany(customers);
      console.log('✅ Sample customers created');
    } else {
      console.log('ℹ️ Customers already exist');
    }
    
    // Step 4: Create sample tickets
    console.log('🎫 Creating sample tickets...');
    const Ticket = require('./models/Ticket');
    
    const existingTickets = await Ticket.countDocuments();
    if (existingTickets === 0) {
      const customers = await Customer.find().limit(2);
      if (customers.length > 0) {
        const tickets = [
          {
            title: 'Order issue',
            description: 'My order has not arrived yet',
            priority: 'high',
            status: 'open',
            category: 'shipping',
            customer: customers[0]._id
          },
          {
            title: 'Product question',
            description: 'How do I use this product?',
            priority: 'low',
            status: 'open',
            category: 'product',
            customer: customers[1] ? customers[1]._id : customers[0]._id
          }
        ];
        
        await Ticket.insertMany(tickets);
        console.log('✅ Sample tickets created');
      }
    } else {
      console.log('ℹ️ Tickets already exist');
    }
    
    // Step 5: Return success
    const finalCounts = {
      customers: await Customer.countDocuments(),
      tickets: await Ticket.countDocuments(),
      users: await User.countDocuments()
    };
    
    console.log('🎉 Initialization completed successfully!');
    
    res.json({
      success: true,
      message: 'Database initialized successfully!',
      data: finalCounts,
      credentials: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    });
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Initialization failed. Please check the logs.'
    });
  }
});

// Keep the old complex endpoint as backup (commented out)
/*
app.get('/api/init-all-backup', async (req, res) => {
  try {
    if (existingCustomers < 5) {
      const sampleCustomers = [
        {
          customerId: 'CUST-DEMO-001',
          name: 'Alice Johnson',
          email: 'alice@demo.com',
          phone: '+1-555-0101',
          customerTier: 'gold',
          loyaltyPoints: 1500,
          orderHistory: [],
          cartItems: [],
          lastActivity: new Date()
        },
        {
          customerId: 'CUST-DEMO-002',
          name: 'Bob Wilson',
          email: 'bob@demo.com', 
          phone: '+1-555-0102',
          customerTier: 'silver',
          loyaltyPoints: 800,
          orderHistory: [],
          cartItems: [],
          lastActivity: new Date()
        },
        {
          customerId: 'CUST-DEMO-003',
          name: 'Carol Davis',
          email: 'carol@demo.com',
          phone: '+1-555-0103', 
          customerTier: 'platinum',
          loyaltyPoints: 3000,
          orderHistory: [],
          cartItems: [],
          lastActivity: new Date()
        },
        {
          customerId: 'CUST-DEMO-004',
          name: 'David Smith',
          email: 'david@demo.com',
          phone: '+1-555-0104',
          customerTier: 'bronze',
          loyaltyPoints: 200,
          orderHistory: [],
          cartItems: [],
          lastActivity: new Date()
        },
        {
          customerId: 'CUST-DEMO-005',
          name: 'Emma Brown',
          email: 'emma@demo.com',
          phone: '+1-555-0105',
          customerTier: 'gold',
          loyaltyPoints: 1200,
          orderHistory: [],
          cartItems: [],
          lastActivity: new Date()
        }
      ];
      
      for (const customerData of sampleCustomers) {
        const existing = await Customer.findOne({ email: customerData.email });
        if (!existing) {
          await Customer.create(customerData);
          console.log(`✅ Created customer: ${customerData.name}`);
        }
      }
    }
    
    // Step 3: Create sample tickets
    const Ticket = require('./models/Ticket');
    const existingTickets = await Ticket.countDocuments();
    
    if (existingTickets < 10) {
      const customers = await Customer.find().limit(5);
      if (customers.length > 0) {
        const sampleTickets = [
          {
            customerId: customers[0]._id,
            subject: 'Order not delivered on time',
            description: 'My order was supposed to arrive yesterday but it\'s still not here. This is very frustrating as I needed it for an important event.',
            category: 'shipping',
            priority: 'high',
            status: 'open',
            tags: ['delivery', 'delay', 'urgent'],
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          },
          {
            customerId: customers[1]?._id || customers[0]._id,
            subject: 'Wrong item received',
            description: 'I ordered a blue shirt size M but received a red shirt size L. I need to return this and get the correct item.',
            category: 'order',
            priority: 'medium',
            status: 'open',
            tags: ['wrong-item', 'return', 'exchange'],
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            customerId: customers[2]?._id || customers[0]._id,
            subject: 'Product quality issue',
            description: 'The product I received has a defect. The zipper is broken and the material feels cheap. I want a refund.',
            category: 'quality',
            priority: 'high',
            status: 'in_progress',
            tags: ['defect', 'quality', 'refund'],
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          },
          {
            customerId: customers[0]._id,
            subject: 'Billing question',
            description: 'I was charged twice for the same order. Can you please check and refund the duplicate charge?',
            category: 'billing',
            priority: 'medium',
            status: 'resolved',
            tags: ['billing', 'duplicate', 'refund'],
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
          },
          {
            customerId: customers[3]?._id || customers[0]._id,
            subject: 'Technical support needed',
            description: 'I\'m having trouble setting up the product. The instructions are unclear and I need help.',
            category: 'technical',
            priority: 'low',
            status: 'open',
            tags: ['setup', 'instructions', 'help'],
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          }
        ];
        
        for (const ticketData of sampleTickets) {
          const existing = await Ticket.findOne({ 
            customerId: ticketData.customerId,
            subject: ticketData.subject 
          });
          if (!existing) {
            await Ticket.create(ticketData);
            console.log(`✅ Created ticket: ${ticketData.subject}`);
          }
        }
      }
    }
    
    // Step 4: Create knowledge base articles
    const KnowledgeBase = require('./models/KnowledgeBase');
    const existingKnowledge = await KnowledgeBase.countDocuments();
    
    if (existingKnowledge < 5) {
      const knowledgeArticles = [
        {
          title: 'How to track your order',
          content: 'You can track your order by logging into your account and going to the "My Orders" section. You can also use the tracking number provided in your confirmation email to track your package on the carrier\'s website.',
          category: 'faq',
          tags: ['tracking', 'orders', 'shipping'],
          keywords: ['track', 'order', 'shipping', 'delivery', 'status'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Return and refund policy',
          content: 'Our return policy allows you to return items within 30 days of purchase. Items must be in original condition with tags attached. Refunds will be processed within 5-7 business days after we receive your return.',
          category: 'policy',
          tags: ['returns', 'refunds', 'policy'],
          keywords: ['return', 'refund', 'policy', 'exchange', '30 days'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Account security and password reset',
          content: 'To reset your password, click "Forgot Password" on the login page and enter your email address. You\'ll receive a secure link to create a new password.',
          category: 'technical',
          tags: ['security', 'password', 'account'],
          keywords: ['password', 'reset', 'security', 'login', 'account'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Payment methods and billing',
          content: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. You can update your payment method in your account settings.',
          category: 'billing',
          tags: ['payment', 'billing', 'credit card'],
          keywords: ['payment', 'billing', 'credit card', 'paypal', 'subscription'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Shipping information and delivery times',
          content: 'Standard shipping takes 3-5 business days within the US, 7-14 days internationally. Express shipping (1-2 days) is available for additional fees.',
          category: 'shipping',
          tags: ['shipping', 'delivery', 'express'],
          keywords: ['shipping', 'delivery', 'express', 'overnight', 'free shipping'],
          author: adminUser._id,
          viewCount: 0
        }
      ];
      
      for (const articleData of knowledgeArticles) {
        const existing = await KnowledgeBase.findOne({ title: articleData.title });
        if (!existing) {
          await KnowledgeBase.create(articleData);
          console.log(`✅ Created knowledge article: ${articleData.title}`);
        }
      }
    }
    
    // Step 5: Create automation rules
    const AutomationRule = require('./models/AutomationRule');
    const existingRules = await AutomationRule.countDocuments();
    
    if (existingRules < 3) {
      const automationRules = [
        {
          name: 'Auto-assign High Priority Tickets',
          description: 'Automatically assigns tickets with high priority to senior support agents',
          trigger: 'ticket_created',
          conditions: { priority: 'high' },
          actions: [{ type: 'assign_to_agent', params: { agentType: 'senior' } }],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Escalate Overdue Tickets',
          description: 'Escalates tickets that have been open for more than 48 hours',
          trigger: 'ticket_overdue',
          conditions: { status: 'open', hoursOpen: { $gt: 48 } },
          actions: [{ type: 'escalate_to_manager', params: { escalationLevel: 'manager' } }],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Auto-respond to Common Queries',
          description: 'Provides automated responses for frequently asked questions',
          trigger: 'ticket_created',
          conditions: { category: 'faq' },
          actions: [{ type: 'send_auto_response', params: { template: 'faq_response' } }],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        }
      ];
      
      for (const ruleData of automationRules) {
        const existing = await AutomationRule.findOne({ name: ruleData.name });
        if (!existing) {
          await AutomationRule.create(ruleData);
          console.log(`✅ Created automation rule: ${ruleData.name}`);
        }
      }
    }
    
    // Step 6: Return final status
    const finalCounts = {
      customers: await Customer.countDocuments(),
      tickets: await Ticket.countDocuments(),
      users: await User.countDocuments(),
      knowledgeBase: await KnowledgeBase.countDocuments(),
      automationRules: await AutomationRule.countDocuments()
    };
    
    res.json({
      success: true,
      message: 'Complete initialization successful!',
      data: finalCounts,
      credentials: {
        email: 'admin@example.com',
        password: 'admin123'
      },
      note: 'Your application is now ready to use!'
    });
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Initialization failed. Please check the logs.'
    });
  }
});
*/

// Seed issues endpoint (legacy)
app.get('/api/seed-issues', async (req, res) => {
  res.json({
    success: false,
    message: 'This endpoint is deprecated. Please use /api/init-all instead.',
    redirect: '/api/init-all'
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-ticket', (ticketId) => {
    socket.join(`ticket-${ticketId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
