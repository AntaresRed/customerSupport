const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: String,
    communicationChannel: {
      type: String,
      enum: ['email', 'phone', 'chat'],
      default: 'email'
    }
  },
  orderHistory: [{
    orderId: String,
    orderDate: Date,
    status: String,
    totalAmount: Number,
    items: [{
      productId: String,
      productName: String,
      quantity: Number,
      price: Number
    }]
  }],
  cartItems: [{
    productId: String,
    productName: String,
    quantity: Number,
    price: Number,
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],
  supportHistory: [{
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket'
    },
    subject: String,
    status: String,
    createdDate: Date
  }],
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  customerTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique customer ID
customerSchema.pre('save', async function(next) {
  if (!this.customerId) {
    try {
      // Use a more reliable method to generate unique ID
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.customerId = `CUST-${timestamp}${random}`;
      
      // Check if this ID already exists
      const existingCustomer = await this.constructor.findOne({ customerId: this.customerId });
      if (existingCustomer) {
        // If it exists, generate a new one
        this.customerId = `CUST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      }
    } catch (error) {
      console.error('Error generating customer ID:', error);
      this.customerId = `CUST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
