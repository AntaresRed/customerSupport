const express = require('express');
const mockDataService = require('../services/mockDataService');
const router = express.Router();

// Get all customers
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, search, tier } = req.query;
    
    let customers = mockDataService.getAllCustomers();
    
    // Apply filters
    if (search) {
      const searchTerm = search.toLowerCase();
      customers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.customerId.toLowerCase().includes(searchTerm)
      );
    }
    
    if (tier) {
      customers = customers.filter(customer => customer.customerTier === tier);
    }
    
    const total = customers.length;
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCustomers = customers.slice(startIndex, endIndex);

    res.json({
      customers: paginatedCustomers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer by ID
router.get('/:id', (req, res) => {
  try {
    const customer = mockDataService.findCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update customer
router.post('/', (req, res) => {
  try {
    const { customerId, name, email, phone, address, preferences } = req.body;

    let customer = mockDataService.findCustomerByEmail(email);
    
    if (customer) {
      // Update existing customer
      customer = mockDataService.updateCustomer(customer._id, { 
        name, 
        email, 
        phone, 
        address, 
        preferences 
      });
    } else {
      // Create new customer
      customer = mockDataService.createCustomer({
        customerId: customerId || `CUST${Date.now()}`,
        name,
        email,
        phone,
        address,
        preferences
      });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update customer
router.put('/:id', (req, res) => {
  try {
    const { name, email, phone, address, preferences, customerTier } = req.body;
    
    const updatedCustomer = mockDataService.updateCustomer(req.params.id, {
      name,
      email,
      phone,
      address,
      preferences,
      customerTier
    });

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add order to customer
router.post('/:id/orders', (req, res) => {
  try {
    const customer = mockDataService.findCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { orderId, amount, status, items } = req.body;
    
    // Mock order creation
    const newOrder = {
      orderId,
      amount,
      status,
      items,
      createdAt: new Date()
    };

    // Update customer's order history
    if (!customer.orders) customer.orders = [];
    customer.orders.push(newOrder);
    customer.totalOrders = customer.orders.length;
    customer.totalSpent = customer.orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    customer.lastOrderDate = new Date();

    res.json({
      message: 'Order added successfully',
      customer: customer
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add item to customer's cart
router.post('/:id/cart', (req, res) => {
  try {
    const customer = mockDataService.findCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { productId, quantity, price } = req.body;
    
    // Mock cart item
    const cartItem = {
      productId,
      quantity,
      price,
      addedAt: new Date()
    };

    // Update customer's cart
    if (!customer.cart) customer.cart = [];
    customer.cart.push(cartItem);

    res.json({
      message: 'Item added to cart successfully',
      cart: customer.cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer analytics
router.get('/:id/analytics', (req, res) => {
  try {
    const customer = mockDataService.findCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Mock analytics data
    const analytics = {
      customerId: customer._id,
      totalOrders: customer.totalOrders || 0,
      totalSpent: customer.totalSpent || 0,
      averageOrderValue: customer.totalOrders > 0 ? (customer.totalSpent / customer.totalOrders) : 0,
      lastOrderDate: customer.lastOrderDate,
      customerTier: customer.customerTier,
      ordersByMonth: [
        { month: 'January', orders: 2, amount: 150.00 },
        { month: 'February', orders: 1, amount: 75.50 },
        { month: 'March', orders: 3, amount: 225.75 }
      ],
      topCategories: [
        { category: 'Electronics', count: 5, amount: 450.00 },
        { category: 'Clothing', count: 3, amount: 180.50 },
        { category: 'Books', count: 2, amount: 45.25 }
      ],
      supportTickets: mockDataService.getAllTickets().filter(ticket => ticket.customer === customer._id).length
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;