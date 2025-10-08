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
          content: 'You can track your order by logging into your account and going to the "My Orders" section. You can also use the tracking number provided in your confirmation email to track your package on the carrier\'s website. For international orders, tracking may take 24-48 hours to appear in the system.',
          category: 'faq',
          tags: ['tracking', 'orders', 'shipping'],
          keywords: ['track', 'order', 'shipping', 'delivery', 'status'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Return and refund policy',
          content: 'Our return policy allows you to return items within 30 days of purchase. Items must be in original condition with tags attached. Refunds will be processed within 5-7 business days after we receive your return. Digital products are non-refundable unless defective.',
          category: 'policy',
          tags: ['returns', 'refunds', 'policy'],
          keywords: ['return', 'refund', 'policy', 'exchange', '30 days'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Account security and password reset',
          content: 'To reset your password, click "Forgot Password" on the login page and enter your email address. You\'ll receive a secure link to create a new password. For account security, use a strong password with at least 8 characters including numbers and symbols.',
          category: 'technical',
          tags: ['security', 'password', 'account'],
          keywords: ['password', 'reset', 'security', 'login', 'account'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Payment methods and billing',
          content: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. For subscription services, payments are automatically charged monthly. You can update your payment method in your account settings under "Billing Information".',
          category: 'billing',
          tags: ['payment', 'billing', 'credit card'],
          keywords: ['payment', 'billing', 'credit card', 'paypal', 'subscription'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Shipping information and delivery times',
          content: 'Standard shipping takes 3-5 business days within the US, 7-14 days internationally. Express shipping (1-2 days) and overnight shipping are available for additional fees. We ship Monday through Friday, excluding holidays. Free shipping is available on orders over $50.',
          category: 'shipping',
          tags: ['shipping', 'delivery', 'express'],
          keywords: ['shipping', 'delivery', 'express', 'overnight', 'free shipping'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Product warranty and support',
          content: 'All products come with a 1-year manufacturer warranty covering defects in materials and workmanship. Extended warranties are available for purchase. For warranty claims, contact our support team with your order number and description of the issue.',
          category: 'warranty',
          tags: ['warranty', 'support', 'defects'],
          keywords: ['warranty', 'support', 'defects', 'claim', 'manufacturer'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'How to cancel or modify an order',
          content: 'Orders can be cancelled within 2 hours of placement through your account dashboard. For modifications, contact customer support immediately. Once an order ships, it cannot be cancelled but can be returned following our return policy.',
          category: 'orders',
          tags: ['cancel', 'modify', 'orders'],
          keywords: ['cancel', 'modify', 'order', 'change', 'edit'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Loyalty program and rewards',
          content: 'Our loyalty program rewards customers with points for every purchase. Earn 1 point per $1 spent, with bonus points during promotional periods. Points can be redeemed for discounts, free shipping, or exclusive products. Points expire after 2 years of inactivity.',
          category: 'loyalty',
          tags: ['loyalty', 'rewards', 'points'],
          keywords: ['loyalty', 'rewards', 'points', 'discount', 'bonus'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Technical support and troubleshooting',
          content: 'For technical issues, first check our troubleshooting guide in the product documentation. Common solutions include clearing browser cache, updating software, or restarting your device. If issues persist, contact our technical support team with detailed error messages.',
          category: 'technical',
          tags: ['technical', 'support', 'troubleshooting'],
          keywords: ['technical', 'support', 'troubleshoot', 'error', 'bug'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Privacy policy and data protection',
          content: 'We are committed to protecting your privacy and personal data. We collect only necessary information to process orders and provide customer service. Your data is encrypted and stored securely. We never sell your information to third parties.',
          category: 'privacy',
          tags: ['privacy', 'data', 'protection'],
          keywords: ['privacy', 'data', 'protection', 'security', 'personal'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'How to update your profile information',
          content: 'You can update your profile information by logging into your account and clicking on "Account Settings" or "Profile". From there, you can change your name, email, phone number, and address. Changes are saved automatically and take effect immediately.',
          category: 'account',
          tags: ['profile', 'account', 'settings'],
          keywords: ['profile', 'account', 'settings', 'update', 'change', 'information'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Understanding your order status',
          content: 'Order statuses include: Pending (payment processing), Confirmed (payment received), Processing (being prepared), Shipped (on the way), Delivered (arrived), and Cancelled. You can track your order status in real-time through your account dashboard.',
          category: 'orders',
          tags: ['order', 'status', 'tracking'],
          keywords: ['order', 'status', 'tracking', 'pending', 'confirmed', 'shipped', 'delivered'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'How to contact customer support',
          content: 'You can contact our customer support team through multiple channels: Live chat (available 24/7), Email support (response within 2 hours), Phone support (business hours), and our help center with comprehensive guides. We also offer priority support for premium customers.',
          category: 'support',
          tags: ['support', 'contact', 'help'],
          keywords: ['support', 'contact', 'help', 'chat', 'email', 'phone', 'assistance'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Product reviews and ratings guide',
          content: 'You can leave product reviews and ratings after receiving your order. Reviews help other customers make informed decisions. Ratings are on a 1-5 star scale. You can edit your review within 30 days of posting. Inappropriate reviews may be moderated.',
          category: 'reviews',
          tags: ['reviews', 'ratings', 'feedback'],
          keywords: ['reviews', 'ratings', 'feedback', 'stars', 'rating', 'opinion'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'How to use discount codes and coupons',
          content: 'To use discount codes, enter the code at checkout in the "Promo Code" field. Codes can be applied to eligible items and will show the discount amount. Some codes have minimum purchase requirements or expiration dates. Only one code can be used per order.',
          category: 'billing',
          tags: ['discount', 'coupon', 'promo'],
          keywords: ['discount', 'coupon', 'promo', 'code', 'savings', 'offer'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'Mobile app features and benefits',
          content: 'Our mobile app offers exclusive features: Push notifications for order updates, Quick reorder functionality, Mobile-exclusive deals, Barcode scanning for product information, and Offline access to order history. Download from App Store or Google Play.',
          category: 'mobile',
          tags: ['mobile', 'app', 'features'],
          keywords: ['mobile', 'app', 'features', 'notifications', 'scan', 'offline'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'How to manage your subscriptions',
          content: 'You can manage your subscriptions in your account under "Subscriptions". From there, you can pause, cancel, or modify subscription frequency. Changes take effect at the next billing cycle. You can also skip deliveries or change delivery addresses.',
          category: 'subscriptions',
          tags: ['subscription', 'manage', 'billing'],
          keywords: ['subscription', 'manage', 'cancel', 'pause', 'modify', 'billing'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'International shipping information',
          content: 'We ship to over 50 countries worldwide. International shipping takes 7-21 business days depending on destination. Customs fees may apply and are the customer\'s responsibility. Some items may have shipping restrictions based on destination country laws.',
          category: 'shipping',
          tags: ['international', 'shipping', 'customs'],
          keywords: ['international', 'shipping', 'customs', 'global', 'worldwide', 'countries'],
          author: adminUser._id,
          viewCount: 0
        },
        {
          title: 'How to report a problem or bug',
          content: 'To report technical issues or bugs, please contact our technical support team with detailed information: What you were trying to do, What happened instead, Screenshots if applicable, Browser/device information, and Error messages. We appreciate your feedback!',
          category: 'technical',
          tags: ['bug', 'report', 'technical'],
          keywords: ['bug', 'report', 'technical', 'issue', 'problem', 'error'],
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

async function createSampleAutomationRules() {
  try {
    const existingRules = await AutomationRule.countDocuments();
    if (existingRules === 0) {
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.log('⚠️ No admin user found, skipping automation rules creation');
        return;
      }

      const sampleRules = [
        {
          name: 'Auto-assign High Priority Tickets',
          description: 'Automatically assigns tickets with high priority to senior support agents',
          trigger: 'ticket_created',
          conditions: {
            priority: 'high'
          },
          actions: [
            {
              type: 'assign_to_agent',
              params: {
                agentType: 'senior'
              }
            },
            {
              type: 'send_notification',
              params: {
                message: 'High priority ticket has been auto-assigned to senior agent'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Escalate Overdue Tickets',
          description: 'Escalates tickets that have been open for more than 48 hours',
          trigger: 'ticket_overdue',
          conditions: {
            status: 'open',
            hoursOpen: { $gt: 48 }
          },
          actions: [
            {
              type: 'escalate_to_manager',
              params: {
                escalationLevel: 'manager'
              }
            },
            {
              type: 'update_priority',
              params: {
                newPriority: 'high'
              }
            },
            {
              type: 'send_escalation_email',
              params: {
                template: 'ticket_escalation'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Auto-respond to Common Queries',
          description: 'Provides automated responses for frequently asked questions',
          trigger: 'ticket_created',
          conditions: {
            category: 'faq',
            keywords: ['password', 'reset', 'login']
          },
          actions: [
            {
              type: 'send_auto_response',
              params: {
                template: 'password_reset_guide'
              }
            },
            {
              type: 'suggest_knowledge_article',
              params: {
                articleCategory: 'technical'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Follow up on Resolved Tickets',
          description: 'Sends follow-up emails to customers after tickets are resolved',
          trigger: 'ticket_resolved',
          conditions: {
            status: 'resolved',
            resolutionTime: { $lt: 24 }
          },
          actions: [
            {
              type: 'send_followup_email',
              params: {
                template: 'resolution_followup',
                delay: '24h'
              }
            },
            {
              type: 'request_feedback',
              params: {
                surveyType: 'satisfaction'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Auto-categorize Shipping Issues',
          description: 'Automatically categorizes tickets related to shipping and delivery',
          trigger: 'ticket_created',
          conditions: {
            keywords: ['shipping', 'delivery', 'tracking', 'package']
          },
          actions: [
            {
              type: 'update_category',
              params: {
                newCategory: 'shipping'
              }
            },
            {
              type: 'assign_to_team',
              params: {
                team: 'logistics'
              }
            },
            {
              type: 'add_tags',
              params: {
                tags: ['shipping', 'delivery']
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Notify Managers of VIP Issues',
          description: 'Immediately notifies managers when VIP customers report issues',
          trigger: 'ticket_created',
          conditions: {
            customerTier: 'platinum',
            priority: { $in: ['high', 'urgent'] }
          },
          actions: [
            {
              type: 'notify_management',
              params: {
                urgency: 'immediate',
                recipients: ['manager', 'director']
              }
            },
            {
              type: 'escalate_priority',
              params: {
                newPriority: 'urgent'
              }
            },
            {
              type: 'create_alert',
              params: {
                alertType: 'vip_issue'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Auto-close Spam Tickets',
          description: 'Automatically identifies and closes spam or invalid tickets',
          trigger: 'ticket_created',
          conditions: {
            keywords: ['spam', 'test', 'invalid'],
            contentLength: { $lt: 10 }
          },
          actions: [
            {
              type: 'mark_as_spam',
              params: {
                reason: 'automated_detection'
              }
            },
            {
              type: 'close_ticket',
              params: {
                status: 'closed',
                resolution: 'spam'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Schedule Maintenance Notifications',
          description: 'Automatically schedules maintenance notifications for affected customers',
          trigger: 'maintenance_scheduled',
          conditions: {
            maintenanceType: 'system_update',
            affectedServices: { $exists: true }
          },
          actions: [
            {
              type: 'notify_affected_customers',
              params: {
                template: 'maintenance_notice',
                advanceNotice: '24h'
              }
            },
            {
              type: 'update_status_page',
              params: {
                status: 'scheduled_maintenance'
              }
            },
            {
              type: 'create_maintenance_ticket',
              params: {
                category: 'maintenance'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Auto-respond to Low Priority Tickets',
          description: 'Automatically sends acknowledgment for low priority tickets during off-hours',
          trigger: 'ticket_created',
          conditions: {
            priority: 'low',
            createdTime: { $gte: '18:00', $lte: '08:00' }
          },
          actions: [
            {
              type: 'send_auto_response',
              params: {
                template: 'after_hours_acknowledgment'
              }
            },
            {
              type: 'set_expected_response_time',
              params: {
                hours: 24
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Escalate Unresolved Tickets After 72 Hours',
          description: 'Automatically escalates tickets that remain unresolved for more than 72 hours',
          trigger: 'ticket_overdue',
          conditions: {
            status: 'open',
            hoursOpen: { $gt: 72 },
            priority: { $in: ['medium', 'high'] }
          },
          actions: [
            {
              type: 'escalate_to_manager',
              params: {
                escalationLevel: 'senior_manager'
              }
            },
            {
              type: 'update_priority',
              params: {
                newPriority: 'high'
              }
            },
            {
              type: 'send_escalation_notification',
              params: {
                template: 'urgent_escalation'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Auto-assign Technical Issues to IT Team',
          description: 'Automatically assigns technical issues to the IT support team',
          trigger: 'ticket_created',
          conditions: {
            category: 'technical',
            keywords: ['bug', 'error', 'system', 'login', 'password', 'access']
          },
          actions: [
            {
              type: 'assign_to_team',
              params: {
                team: 'it_support'
              }
            },
            {
              type: 'add_tags',
              params: {
                tags: ['technical', 'it', 'automated']
              }
            },
            {
              type: 'send_notification',
              params: {
                message: 'Technical issue automatically assigned to IT team'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Send Customer Satisfaction Survey',
          description: 'Sends satisfaction survey to customers after ticket resolution',
          trigger: 'ticket_resolved',
          conditions: {
            status: 'resolved',
            resolutionTime: { $lt: 48 }
          },
          actions: [
            {
              type: 'send_satisfaction_survey',
              params: {
                delay: '24h',
                template: 'satisfaction_survey'
              }
            },
            {
              type: 'track_customer_satisfaction',
              params: {
                metric: 'resolution_satisfaction'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Auto-categorize Billing Issues',
          description: 'Automatically categorizes and routes billing-related tickets',
          trigger: 'ticket_created',
          conditions: {
            keywords: ['billing', 'payment', 'charge', 'refund', 'invoice', 'credit']
          },
          actions: [
            {
              type: 'update_category',
              params: {
                newCategory: 'billing'
              }
            },
            {
              type: 'assign_to_team',
              params: {
                team: 'billing_support'
              }
            },
            {
              type: 'set_priority',
              params: {
                priority: 'medium'
              }
            },
            {
              type: 'add_tags',
              params: {
                tags: ['billing', 'financial', 'automated']
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Create Follow-up Tasks for High Priority Tickets',
          description: 'Automatically creates follow-up tasks for high priority tickets',
          trigger: 'ticket_created',
          conditions: {
            priority: 'high'
          },
          actions: [
            {
              type: 'create_followup_task',
              params: {
                taskType: 'priority_followup',
                dueTime: '24h'
              }
            },
            {
              type: 'set_reminder',
              params: {
                reminderTime: '12h',
                message: 'High priority ticket follow-up required'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Auto-close Inactive Tickets',
          description: 'Automatically closes tickets that have been inactive for 30 days',
          trigger: 'ticket_inactive',
          conditions: {
            status: 'open',
            lastActivity: { $lt: '30d' },
            priority: 'low'
          },
          actions: [
            {
              type: 'send_inactivity_notice',
              params: {
                template: 'inactivity_warning',
                noticePeriod: '7d'
              }
            },
            {
              type: 'auto_close_ticket',
              params: {
                status: 'closed',
                resolution: 'inactive_timeout'
              }
            },
            {
              type: 'log_closure_reason',
              params: {
                reason: '30_day_inactivity'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Notify Managers of System Outages',
          description: 'Immediately notifies managers when system outage tickets are created',
          trigger: 'ticket_created',
          conditions: {
            keywords: ['outage', 'down', 'unavailable', 'system', 'service'],
            priority: { $in: ['high', 'urgent'] }
          },
          actions: [
            {
              type: 'notify_management',
              params: {
                urgency: 'immediate',
                recipients: ['cto', 'engineering_manager', 'operations_manager']
              }
            },
            {
              type: 'create_incident_report',
              params: {
                severity: 'high'
              }
            },
            {
              type: 'update_status_page',
              params: {
                status: 'investigating'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        },
        {
          name: 'Auto-escalate Complaints to Customer Success',
          description: 'Automatically escalates customer complaints to the customer success team',
          trigger: 'ticket_created',
          conditions: {
            keywords: ['complaint', 'dissatisfied', 'unhappy', 'poor service', 'terrible'],
            sentiment: 'negative'
          },
          actions: [
            {
              type: 'escalate_to_team',
              params: {
                team: 'customer_success'
              }
            },
            {
              type: 'set_priority',
              params: {
                priority: 'high'
              }
            },
            {
              type: 'add_tags',
              params: {
                tags: ['complaint', 'escalation', 'customer_success']
              }
            },
            {
              type: 'send_escalation_alert',
              params: {
                template: 'complaint_escalation'
              }
            }
          ],
          isActive: true,
          createdBy: adminUser._id,
          executionCount: 0
        }
      ];

      await AutomationRule.insertMany(sampleRules);
      console.log('✅ Sample automation rules created');
    } else {
      console.log('ℹ️ Automation rules already exist');
    }
  } catch (error) {
    console.error('❌ Error creating automation rules:', error);
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
    await createSampleAutomationRules();
    
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
