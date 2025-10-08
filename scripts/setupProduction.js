const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Customer = require('../models/Customer');
const Ticket = require('../models/Ticket');
const KnowledgeBase = require('../models/KnowledgeBase');
const AutomationRule = require('../models/AutomationRule');

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_support';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create default admin user
async function createDefaultUser() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123', // Change this in production
        role: 'admin',
        department: 'support'
      });
      await adminUser.save();
      console.log('✅ Default admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Create sample customers
async function createSampleCustomers() {
  try {
    const existingCustomers = await Customer.countDocuments();
    if (existingCustomers === 0) {
      const sampleCustomers = [
        {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '+1-555-0123',
          customerTier: 'gold',
          loyaltyPoints: 2500,
          orderHistory: [],
          cartItems: []
        },
        {
          name: 'Bob Wilson',
          email: 'bob@example.com',
          phone: '+1-555-0456',
          customerTier: 'silver',
          loyaltyPoints: 1200,
          orderHistory: [],
          cartItems: []
        }
      ];

      await Customer.insertMany(sampleCustomers);
      console.log('✅ Sample customers created');
    } else {
      console.log('ℹ️ Customers already exist');
    }
  } catch (error) {
    console.error('❌ Error creating sample customers:', error);
  }
}

// Create sample knowledge base articles
async function createSampleKnowledge() {
  try {
    const existingArticles = await KnowledgeBase.countDocuments();
    if (existingArticles === 0) {
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.log('⚠️ No admin user found, skipping knowledge base creation');
        return;
      }

      const sampleArticles = [
        {
          title: 'How to track your order',
          content: 'You can track your order by logging into your account and going to the "My Orders" section. You can also use the tracking number provided in your confirmation email to track your package on the carrier\'s website.',
          category: 'faq',
          tags: ['tracking', 'orders', 'shipping'],
          keywords: ['track', 'order', 'shipping', 'delivery'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Return and refund policy',
          content: 'Our return policy allows you to return items within 30 days of purchase. Items must be in original condition with tags attached. Refunds will be processed within 5-7 business days after we receive your return.',
          category: 'policy',
          tags: ['returns', 'refunds', 'policy'],
          keywords: ['return', 'refund', 'policy', 'exchange'],
          author: adminUser._id,
          viewCount: 0
        }
      ];

      await KnowledgeBase.insertMany(sampleArticles);
      console.log('✅ Sample knowledge base articles created');
    } else {
      console.log('ℹ️ Knowledge base articles already exist');
    }
  } catch (error) {
    console.error('❌ Error creating knowledge base articles:', error);
  }
}

// Main setup function
async function setupProduction() {
  console.log('🚀 Starting production setup...');
  
  try {
    await connectDB();
    await createDefaultUser();
    await createSampleCustomers();
    await createSampleKnowledge();
    
    console.log('✅ Production setup completed successfully!');
    console.log('📋 Default credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('⚠️  Please change the default password in production!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupProduction();
}

module.exports = { setupProduction };
