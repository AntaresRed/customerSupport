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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_support', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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

// Seed issues endpoint
app.get('/api/seed-issues', async (req, res) => {
  try {
    // Try to import and use the script function first
    try {
      const { generateTestData } = require('./scripts/generateIssueTestData');
      await generateTestData();
      res.json({ 
        success: true, 
        message: 'Issue test data seeded successfully using script!'
      });
    } catch (importError) {
      console.log('Script import failed, using fallback method:', importError.message);
      
      // Fallback: Create some basic test data directly
      const Ticket = require('./models/Ticket');
      const Customer = require('./models/Customer');
      
      // Create a few sample customers if they don't exist
      const existingCustomers = await Customer.countDocuments();
      if (existingCustomers < 3) {
        const sampleCustomers = [
          {
            customerId: 'CUST-TEST-001',
            name: 'Test Customer 1',
            email: 'test1@example.com',
            phone: '+1-555-0001',
            customerTier: 'gold',
            loyaltyPoints: 1000
          },
          {
            customerId: 'CUST-TEST-002', 
            name: 'Test Customer 2',
            email: 'test2@example.com',
            phone: '+1-555-0002',
            customerTier: 'silver',
            loyaltyPoints: 500
          }
        ];
        await Customer.insertMany(sampleCustomers);
      }
      
      // Create some sample tickets for issue detection
      const existingTickets = await Ticket.countDocuments();
      if (existingTickets < 5) {
        const customers = await Customer.find().limit(2);
        if (customers.length > 0) {
          const sampleTickets = [
            {
              customerId: customers[0]._id,
              subject: 'Order delivery delayed',
              description: 'My order was supposed to arrive yesterday but it\'s still not here. This is the third time this month.',
              category: 'shipping',
              priority: 'high',
              status: 'open',
              tags: ['delivery', 'delay']
            },
            {
              customerId: customers[1]?._id || customers[0]._id,
              subject: 'Wrong item received',
              description: 'I ordered a blue shirt but received a red one. Need to return this immediately.',
              category: 'order',
              priority: 'medium',
              status: 'open',
              tags: ['wrong-item', 'return']
            }
          ];
          await Ticket.insertMany(sampleTickets);
        }
      }
      
      res.json({ 
        success: true, 
        message: 'Basic test data seeded successfully using fallback method!'
      });
    }
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
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
