const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
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

// Database connection
async function connectDB() {
  try {
    // Don't reconnect if already connected or connecting
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      console.log('📡 Database already connected or connecting');
      return;
    }
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_support', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
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

// Database connection status check
async function ensureDBConnection() {
  const currentState = mongoose.connection.readyState;
  console.log(`🔍 Current connection state: ${currentState} (${getConnectionStateName(currentState)})`);
  
  if (currentState === 1) {
    console.log('✅ Database already connected');
    return true;
  }
  
  // For serverless environments, always force a fresh connection
  console.log('🔄 Serverless environment detected, forcing fresh connection...');
  return await forceDBConnection();
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
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running! (Updated)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is working!',
    time: new Date().toISOString()
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

// Comprehensive setup endpoint - does everything
app.get('/api/init-all', async (req, res) => {
  try {
    console.log('🚀 Starting complete initialization...');
    
    // Step 0: Force database connection for serverless
    console.log('🔄 Forcing fresh database connection...');
    const connectionSuccess = await forceDBConnection();
    
    if (!connectionSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        message: 'Cannot establish database connection. Please check MongoDB URI and network access.',
        connectionState: mongoose.connection.readyState
      });
    }
    
    console.log('✅ Database connection established');
    
    // Step 1: Setup database (admin user, basic structure)
    try {
      const { setupProduction } = require('./scripts/setupProduction');
      await setupProduction();
      console.log('✅ Database setup completed');
    } catch (setupError) {
      console.log('⚠️ Setup script failed, creating basic admin user...', setupError.message);
      
      // Create basic admin user manually
      const User = require('./models/User');
      const existingAdmin = await User.findOne({ email: 'admin@example.com' });
      if (!existingAdmin) {
        const adminUser = new User({
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin',
          department: 'support'
        });
        await adminUser.save();
        console.log('✅ Basic admin user created');
      }
    }
    
    // Step 2: Create sample customers
    const Customer = require('./models/Customer');
    const existingCustomers = await Customer.countDocuments();
    
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
    
    // Step 4: Return final status
    const finalCounts = {
      customers: await Customer.countDocuments(),
      tickets: await Ticket.countDocuments(),
      users: await User.countDocuments()
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
