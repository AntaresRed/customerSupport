const mongoose = require('mongoose');

// Connection state names
const CONNECTION_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

/**
 * Ensures database connection is established
 * @returns {Promise<boolean>} - Returns true if connected, false otherwise
 */
async function ensureConnection() {
  try {
    const state = mongoose.connection.readyState;
    console.log(`🔍 Connection state: ${state} (${CONNECTION_STATES[state] || 'unknown'})`);
    
    if (state === 1) {
      console.log('✅ Database already connected');
      return true;
    }
    
    // Force fresh connection for serverless
    console.log('🔄 Establishing fresh connection...');
    
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

/**
 * Middleware to ensure database connection before route execution
 */
function withConnection(req, res, next) {
  // Only ensure connection for production (serverless) environments
  if (process.env.NODE_ENV === 'production') {
    ensureConnection()
      .then(connected => {
        if (!connected) {
          console.error('❌ Failed to establish database connection');
          return res.status(500).json({ 
            success: false, 
            error: 'Database connection failed',
            message: 'Unable to connect to database. Please try again.' 
          });
        }
        next();
      })
      .catch(error => {
        console.error('❌ Database middleware error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Database middleware error',
          message: 'Database connection error occurred.' 
        });
      });
  } else {
    next();
  }
}

/**
 * Wrapper function for async route handlers that ensures connection
 * @param {Function} handler - The async route handler function
 * @returns {Function} - Wrapped handler with connection checking
 */
function withConnectionWrapper(handler) {
  return async (req, res, next) => {
    try {
      // Ensure connection for production environments
      if (process.env.NODE_ENV === 'production') {
        const connected = await ensureConnection();
        if (!connected) {
          return res.status(500).json({ 
            success: false, 
            error: 'Database connection failed',
            message: 'Unable to connect to database. Please try again.' 
          });
        }
      }
      
      // Execute the original handler
      await handler(req, res, next);
    } catch (error) {
      console.error('❌ Route handler error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        message: 'An error occurred while processing your request.' 
      });
    }
  };
}

/**
 * Get current connection status
 * @returns {Object} - Connection status information
 */
function getConnectionStatus() {
  const state = mongoose.connection.readyState;
  return {
    connected: state === 1,
    state: state,
    stateName: CONNECTION_STATES[state] || 'unknown',
    host: mongoose.connection.host || 'unknown',
    port: mongoose.connection.port || 'unknown',
    name: mongoose.connection.name || 'unknown'
  };
}

module.exports = {
  ensureConnection,
  withConnection,
  withConnectionWrapper,
  getConnectionStatus,
  CONNECTION_STATES
};
