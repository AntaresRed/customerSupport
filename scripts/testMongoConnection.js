const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('📡 Connection string:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'Not set');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not set');
      return;
    }
    
    // Test connection
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database access
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Authentication failed - check:');
      console.log('1. Username and password are correct');
      console.log('2. Database user has proper permissions');
      console.log('3. Connection string format is correct');
      console.log('4. Special characters in password are URL encoded');
    } else if (error.message.includes('network')) {
      console.log('\n🌐 Network error - check:');
      console.log('1. IP address is whitelisted in MongoDB Atlas');
      console.log('2. Cluster is running');
      console.log('3. Connection string is correct');
    }
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

testMongoConnection();
