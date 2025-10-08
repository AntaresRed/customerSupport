const express = require('express');
const { authenticateToken } = require('./auth');
const Customer = require('../models/Customer');
const Ticket = require('../models/Ticket');
const router = express.Router();

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tier } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ];
    }
    if (tier) filter.customerTier = tier;

    const customers = await Customer.find(filter)
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(filter);

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get recent tickets for this customer
    const recentTickets = await Ticket.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('ticketId subject status priority createdAt');

    res.json({
      ...customer.toObject(),
      recentTickets
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customerId, name, email, phone, address, preferences } = req.body;

    let customer = await Customer.findOne({ customerId });
    
    if (customer) {
      // Update existing customer
      Object.assign(customer, { name, email, phone, address, preferences });
    } else {
      // Create new customer
      customer = new Customer({
        customerId,
        name,
        email,
        phone,
        address,
        preferences
      });
    }

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    Object.assign(customer, req.body);
    customer.lastActivity = new Date();
    await customer.save();

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add order to customer history
router.post('/:id/orders', authenticateToken, async (req, res) => {
  try {
    const { orderId, orderDate, status, totalAmount, items } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.orderHistory.push({
      orderId,
      orderDate: new Date(orderDate),
      status,
      totalAmount,
      items
    });

    // Update customer tier based on total spending
    const totalSpent = customer.orderHistory.reduce((sum, order) => sum + order.totalAmount, 0);
    if (totalSpent >= 10000) customer.customerTier = 'platinum';
    else if (totalSpent >= 5000) customer.customerTier = 'gold';
    else if (totalSpent >= 1000) customer.customerTier = 'silver';

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add item to customer cart
router.post('/:id/cart', authenticateToken, async (req, res) => {
  try {
    const { productId, productName, quantity, price } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if item already exists in cart
    const existingItem = customer.cartItems.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      customer.cartItems.push({
        productId,
        productName,
        quantity,
        price,
        addedDate: new Date()
      });
    }

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const totalSpent = customer.orderHistory.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = customer.orderHistory.length > 0 ? totalSpent / customer.orderHistory.length : 0;
    const cartValue = customer.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get support ticket statistics
    const ticketStats = await Ticket.aggregate([
      { $match: { customerId: customer._id } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          averageResolutionTime: { $avg: '$actualResolution' }
        }
      }
    ]);

    res.json({
      customerId: customer.customerId,
      name: customer.name,
      tier: customer.customerTier,
      totalSpent,
      averageOrderValue,
      cartValue,
      orderCount: customer.orderHistory.length,
      cartItemCount: customer.cartItems.length,
      loyaltyPoints: customer.loyaltyPoints,
      ticketStats: ticketStats[0] || {}
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
