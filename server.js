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
    const { exec } = require('child_process');
    exec('node scripts/generateIssueTestData.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Seed error:', error);
        return res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
      res.json({ 
        success: true, 
        message: 'Issue test data seeded successfully!',
        output: stdout
      });
    });
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
