const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mockDataService = require('./services/mockDataService');
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

// Mock Data Service - No Database Required
console.log('🚀 Starting application with Mock Data Service');
console.log('✅ All data is now served from memory - no database required!');

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
  try {
    const stats = mockDataService.getDashboardStats();
    
    res.json({
      success: true,
      message: 'Server is running with Mock Data Service',
      timestamp: new Date().toISOString(),
      version: '5.0 - Mock Data Service',
      dataService: {
        type: 'mock',
        status: 'active',
        records: {
          users: mockDataService.getAllUsers().length,
          customers: mockDataService.getAllCustomers().length,
          tickets: mockDataService.getAllTickets().length,
          knowledgeArticles: mockDataService.getAllKnowledgeArticles().length,
          automationRules: mockDataService.getAllAutomationRules().length
        }
      },
      dashboard: stats,
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

// Data service test endpoint
app.get('/api/test-data', (req, res) => {
  try {
    console.log('🧪 Testing mock data service...');
    
    const testResults = {
      users: mockDataService.getAllUsers().length > 0,
      customers: mockDataService.getAllCustomers().length > 0,
      tickets: mockDataService.getAllTickets().length > 0,
      knowledge: mockDataService.getAllKnowledgeArticles().length > 0,
      automation: mockDataService.getAllAutomationRules().length > 0
    };
    
    const allWorking = Object.values(testResults).every(result => result === true);
    
    res.json({
      success: allWorking,
      message: allWorking ? 'Mock data service is working perfectly!' : 'Some data services have issues',
      timestamp: new Date().toISOString(),
      testResults,
      sampleData: {
        firstCustomer: mockDataService.getAllCustomers()[0]?.name || 'No customers',
        firstTicket: mockDataService.getAllTickets()[0]?.title || 'No tickets',
        totalRecords: Object.values(testResults).length
      }
    });
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
    message: 'API is working with Mock Data Service',
    timestamp: new Date().toISOString(),
    version: '5.0'
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  const stats = mockDataService.getDashboardStats();
  
  res.json({
    success: true,
    message: 'Debug endpoint - Mock Data Service v5.0',
    timestamp: new Date().toISOString(),
    dataService: {
      type: 'mock',
      status: 'active'
    },
    stats,
    version: '5.0',
    mockDataReady: true
  });
});

// Initialize all data endpoint (now just returns mock data info)
app.get('/api/init-all', (req, res) => {
  console.log('🚀 Mock data service is already initialized!');

  try {
    const stats = mockDataService.getDashboardStats();
    
    res.json({
      success: true,
      message: 'Mock data service is ready! No initialization needed.',
      data: {
        users: mockDataService.getAllUsers().length,
        customers: mockDataService.getAllCustomers().length,
        tickets: mockDataService.getAllTickets().length,
        knowledgeArticles: mockDataService.getAllKnowledgeArticles().length,
        automationRules: mockDataService.getAllAutomationRules().length
      },
      stats,
      credentials: {
        email: 'admin@example.com',
        password: 'admin123'
      },
      note: 'All data is served from memory - no database required!'
    });

  } catch (error) {
    console.error('❌ Mock data error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Mock data service error.'
    });
  }
});

// Verify data endpoint
app.get('/api/verify-data', (req, res) => {
  try {
    console.log('🔍 Verifying mock data...');
    
    const stats = mockDataService.getDashboardStats();
    
    // Get sample data
    const sampleUsers = mockDataService.getAllUsers().slice(0, 3);
    const sampleCustomers = mockDataService.getAllCustomers().slice(0, 3);
    const sampleTickets = mockDataService.getAllTickets().slice(0, 3);

    res.json({
      success: true,
      message: 'Mock data verification completed',
      counts: {
        users: stats.totalAgents + 1, // +1 for admin
        customers: stats.totalCustomers,
        tickets: stats.totalTickets
      },
      sampleData: {
        users: sampleUsers,
        customers: sampleCustomers,
        tickets: sampleTickets
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Data verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Data verification failed'
    });
  }
});

// Deprecated seed-issues endpoint - now just returns mock data info
app.get('/api/seed-issues', (req, res) => {
  console.log('⚠️ /api/seed-issues is deprecated. Mock data is already available!');
  
  const issues = mockDataService.getAllIssues();
  
  res.json({
    success: true,
    message: 'Mock issue data is already available!',
    issues: issues,
    count: issues.length,
    note: 'No seeding needed - using mock data service'
  });
});

// Setup endpoint for production (now just returns mock data status)
app.get('/api/setup', (req, res) => {
  try {
    console.log('🚀 Mock data service is ready!');
    
    const stats = mockDataService.getDashboardStats();
    
    res.json({
      success: true,
      message: 'Mock data service is ready! No setup needed.',
      data: {
        users: mockDataService.getAllUsers().length,
        customers: mockDataService.getAllCustomers().length,
        tickets: mockDataService.getAllTickets().length,
        knowledgeArticles: mockDataService.getAllKnowledgeArticles().length,
        automationRules: mockDataService.getAllAutomationRules().length,
        issues: mockDataService.getAllIssues().length
      },
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Mock data service error.'
    });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Mock Data Service loaded with:`);
  console.log(`   - ${mockDataService.getAllUsers().length} users`);
  console.log(`   - ${mockDataService.getAllCustomers().length} customers`);
  console.log(`   - ${mockDataService.getAllTickets().length} tickets`);
  console.log(`   - ${mockDataService.getAllKnowledgeArticles().length} knowledge articles`);
  console.log(`   - ${mockDataService.getAllAutomationRules().length} automation rules`);
  console.log(`   - ${mockDataService.getAllIssues().length} detected issues`);
  console.log('✅ Ready to serve requests!');
});