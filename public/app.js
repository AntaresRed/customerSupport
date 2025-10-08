// Global variables
let currentUser = null;
let socket = null;
let currentSection = 'overview';
let currentConversationId = null;
let conversationTemplates = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token and load dashboard
        verifyTokenAndLoadDashboard();
    } else {
        showLoginForm();
    }
    
    // Initialize socket connection
    initializeSocket();
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    
    // Sidebar navigation
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(section);
        });
    });
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('d-none');
    document.getElementById('dashboard').classList.add('d-none');
}

function showDashboard() {
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('dashboard').classList.remove('d-none');
    loadDashboardData();
}

async function verifyTokenAndLoadDashboard() {
    const token = localStorage.getItem('token');
    
    // Check if it's a demo token
    if (token && token.startsWith('demo-token-')) {
        // For demo tokens, create a demo user
        currentUser = {
            name: 'Demo User',
            email: 'demo@example.com',
            role: 'support_agent'
        };
        document.getElementById('userName').textContent = currentUser.name;
        showDashboard();
        return;
    }
    
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            document.getElementById('userName').textContent = currentUser.name;
            showDashboard();
        } else {
            localStorage.removeItem('token');
            showLoginForm();
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        showLoginForm();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Accept any non-empty email and password
    if (email.trim() === '' || password.trim() === '') {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        // Try the actual API first
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            document.getElementById('userName').textContent = currentUser.name;
            showDashboard();
        } else {
            // Fallback: Accept any login for demo purposes
            const demoToken = 'demo-token-' + Date.now();
            currentUser = {
                name: email.split('@')[0] || 'Demo User',
                email: email,
                role: 'support_agent'
            };
            
            localStorage.setItem('token', demoToken);
            document.getElementById('userName').textContent = currentUser.name;
            showDashboard();
        }
    } catch (error) {
        console.error('Login error:', error);
        // Fallback: Accept any login for demo purposes
        const demoToken = 'demo-token-' + Date.now();
        currentUser = {
            name: email.split('@')[0] || 'Demo User',
            email: email,
            role: 'support_agent'
        };
        
        localStorage.setItem('token', demoToken);
        document.getElementById('userName').textContent = currentUser.name;
        showDashboard();
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    showLoginForm();
}


function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('ticket-created', (ticket) => {
        console.log('New ticket created:', ticket);
        if (currentSection === 'tickets' || currentSection === 'overview') {
            loadTickets();
        }
    });
    
    socket.on('ticket-updated', (ticket) => {
        console.log('Ticket updated:', ticket);
        if (currentSection === 'tickets' || currentSection === 'overview') {
            loadTickets();
        }
    });
    
    socket.on('message-added', (message) => {
        console.log('New message:', message);
        // Handle real-time message updates
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.remove('d-none');
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // Load section data
        switch(sectionName) {
            case 'overview':
                loadDashboardData();
                break;
            case 'tickets':
                loadTickets();
                break;
            case 'customers':
                loadCustomers();
                break;
            case 'knowledge':
                loadKnowledgeBase();
                break;
            case 'automation':
                loadAutomationRules();
                break;
            case 'ai':
                // AI section doesn't need initial data loading
                break;
        }
    }
    
    // Update active nav item
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
}

async function loadDashboardData() {
    try {
        // Load ticket statistics
        const statsResponse = await fetch('/api/tickets/stats/overview', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            updateDashboardStats(stats.overview);
        }
        
        // Load recent tickets
        const ticketsResponse = await fetch('/api/tickets?limit=5', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (ticketsResponse.ok) {
            const data = await ticketsResponse.json();
            displayRecentTickets(data.tickets);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalTickets').textContent = stats.total || 0;
    document.getElementById('openTickets').textContent = stats.open || 0;
    document.getElementById('resolvedTickets').textContent = stats.resolved || 0;
    document.getElementById('urgentTickets').textContent = stats.urgent || 0;
}

function displayRecentTickets(tickets) {
    const container = document.getElementById('recentTickets');
    
    if (tickets.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No recent tickets</p></div>';
        return;
    }
    
    container.innerHTML = tickets.map(ticket => `
        <div class="ticket-item slide-in">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">${ticket.subject}</h6>
                    <p class="text-muted mb-1">${ticket.ticketId} - ${ticket.customerId?.name || 'Unknown Customer'}</p>
                    <small class="text-muted">${new Date(ticket.createdAt).toLocaleDateString()}</small>
                </div>
                <div class="text-end">
                    <span class="ticket-priority priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span>
                    <br>
                    <span class="ticket-status status-${ticket.status}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadTickets() {
    const container = document.getElementById('ticketsList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    try {
        const response = await fetch('/api/tickets', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayTickets(data.tickets);
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading tickets</p></div>';
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading tickets</p></div>';
    }
}

function displayTickets(tickets) {
    const container = document.getElementById('ticketsList');
    
    if (tickets.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-ticket-alt"></i><p>No tickets found</p></div>';
        return;
    }
    
    container.innerHTML = tickets.map((ticket, index) => `
        <div class="ticket-item fade-in-up hover-lift" style="animation-delay: ${index * 0.1}s">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1 text-gradient">${ticket.subject}</h6>
                    <p class="text-muted mb-1">${ticket.ticketId} - ${ticket.customerId?.name || 'Unknown Customer'}</p>
                    <p class="mb-2">${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}</p>
                    <div class="d-flex gap-2 mb-2">
                        <span class="badge bg-secondary">${ticket.category}</span>
                        ${ticket.tags.map(tag => `<span class="badge bg-light text-dark">${tag}</span>`).join('')}
                    </div>
                    <small class="text-muted">Created: ${new Date(ticket.createdAt).toLocaleDateString()}</small>
                </div>
                <div class="text-end">
                    <span class="ticket-priority priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span>
                    <br>
                    <span class="ticket-status status-${ticket.status}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
                    <br>
                    <small class="text-muted">${ticket.assignedAgent?.name || 'Unassigned'}</small>
                    <br>
                    <div class="mt-2">
                        ${ticket.status !== 'closed' ? `
                            <button class="btn btn-sm btn-success me-1 hover-glow" onclick="closeTicket('${ticket._id}')" title="Close Ticket">
                                <i class="fas fa-check"></i> Close
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-primary hover-glow" onclick="viewTicketDetails('${ticket._id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadCustomers() {
    const container = document.getElementById('customersList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    try {
        const response = await fetch('/api/customers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayCustomers(data.customers);
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading customers</p></div>';
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading customers</p></div>';
    }
}

function displayCustomers(customers) {
    const container = document.getElementById('customersList');
    
    if (customers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No customers found</p></div>';
        return;
    }
    
    container.innerHTML = customers.map((customer, index) => `
        <div class="customer-item fade-in-up hover-lift" style="animation-delay: ${index * 0.1}s">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1 text-gradient">${customer.name}</h6>
                    <p class="text-muted mb-1">${customer.customerId} - ${customer.email}</p>
                    <div class="d-flex gap-2 mb-2">
                        <span class="customer-tier tier-${customer.customerTier}">${customer.customerTier.toUpperCase()}</span>
                        <span class="badge bg-light text-dark">${customer.orderHistory?.length || 0} Orders</span>
                        <span class="badge bg-light text-dark">${customer.cartItems?.length || 0} Cart Items</span>
                    </div>
                    <small class="text-muted">Last Activity: ${new Date(customer.lastActivity).toLocaleDateString()}</small>
                </div>
                <div class="text-end">
                    <button class="btn btn-sm btn-outline-primary hover-glow" onclick="viewCustomerDetails('${customer._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadKnowledgeBase() {
    const container = document.getElementById('knowledgeList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    try {
        const response = await fetch('/api/knowledge', {
        });
        
        if (response.ok) {
            const data = await response.json();
            displayKnowledgeBase(data.articles);
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading knowledge base</p></div>';
        }
    } catch (error) {
        console.error('Error loading knowledge base:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading knowledge base</p></div>';
    }
}

function displayKnowledgeBase(articles) {
    const container = document.getElementById('knowledgeList');
    
    if (articles.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>No articles found</p></div>';
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <div class="knowledge-item slide-in">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${article.title}</h6>
                    <p class="text-muted mb-2">${article.content.substring(0, 150)}${article.content.length > 150 ? '...' : ''}</p>
                    <div class="d-flex gap-2 mb-2">
                        <span class="badge bg-primary">${article.category}</span>
                        ${article.tags.map(tag => `<span class="badge bg-light text-dark">${tag}</span>`).join('')}
                    </div>
                    <small class="text-muted">
                        By ${article.author?.name || 'Unknown'} • 
                        ${article.viewCount} views • 
                        ${new Date(article.lastUpdated).toLocaleDateString()}
                    </small>
                </div>
                <div class="text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewArticle('${article._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadAutomationRules() {
    const container = document.getElementById('automationList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    try {
        const response = await fetch('/api/automation', {
        });
        
        if (response.ok) {
            const data = await response.json();
            displayAutomationRules(data);
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading automation rules</p></div>';
        }
    } catch (error) {
        console.error('Error loading automation rules:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading automation rules</p></div>';
    }
}

function displayAutomationRules(rules) {
    const container = document.getElementById('automationList');
    
    if (rules.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-cogs"></i><p>No automation rules found</p></div>';
        return;
    }
    
    container.innerHTML = rules.map(rule => `
        <div class="automation-rule slide-in">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${rule.name}</h6>
                    <p class="text-muted mb-2">${rule.description || 'No description'}</p>
                    <div class="d-flex gap-2 mb-2">
                        <span class="badge ${rule.isActive ? 'bg-success' : 'bg-secondary'}">${rule.isActive ? 'Active' : 'Inactive'}</span>
                        <span class="badge bg-light text-dark">Priority: ${rule.priority}</span>
                        <span class="badge bg-light text-dark">Triggers: ${rule.triggerCount}</span>
                    </div>
                    <small class="text-muted">
                        Created by ${rule.createdBy?.name || 'Unknown'} • 
                        ${new Date(rule.createdAt).toLocaleDateString()}
                    </small>
                </div>
                <div class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editRule('${rule._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRule('${rule._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Ticket management functions
function createNewTicket() {
    const modal = new bootstrap.Modal(document.getElementById('ticketModal'));
    modal.show();
}

async function submitTicket() {
    const formData = {
        customerId: document.getElementById('ticketCustomerId').value,
        subject: document.getElementById('ticketSubject').value,
        description: document.getElementById('ticketDescription').value,
        category: document.getElementById('ticketCategory').value,
        priority: document.getElementById('ticketPriority').value,
        channel: document.getElementById('ticketChannel').value
    };
    
    try {
        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const ticket = await response.json();
            console.log('Ticket created:', ticket);
            
            // Close modal and refresh tickets
            const modal = bootstrap.Modal.getInstance(document.getElementById('ticketModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('ticketForm').reset();
            
            // Refresh current view
            if (currentSection === 'tickets' || currentSection === 'overview') {
                loadTickets();
                loadDashboardData();
            }
        } else {
            const error = await response.json();
            alert('Error creating ticket: ' + error.message);
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        alert('Error creating ticket. Please try again.');
    }
}

// AI functions
async function generateAIResponse() {
    const message = document.getElementById('customerMessage').value;
    if (!message.trim()) {
        alert('Please enter a customer message');
        return;
    }
    
    const container = document.getElementById('aiResponse');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Generating response...</span></div></div>';
    
    try {
        const response = await fetch('/api/ai/generate-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: message })
        });
        
        if (response.ok) {
            const data = await response.json();
            container.innerHTML = `<div class="ai-response">${data.response}</div>`;
        } else {
            container.innerHTML = '<div class="alert alert-danger">Error generating response</div>';
        }
    } catch (error) {
        console.error('Error generating AI response:', error);
        container.innerHTML = '<div class="alert alert-danger">Error generating response</div>';
    }
}

async function searchWithAI() {
    const query = document.getElementById('aiSearchQuery').value;
    if (!query.trim()) {
        alert('Please enter a search query');
        return;
    }
    
    const container = document.getElementById('aiSearchResults');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Searching...</span></div></div>';
    
    try {
        const response = await fetch('/api/ai/suggest-articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });
        
        if (response.ok) {
            const data = await response.json();
            container.innerHTML = `
                <div class="ai-response">
                    <h6>AI Suggestions:</h6>
                    <p>${data.suggestions}</p>
                    <h6>Relevant Articles:</h6>
                    ${data.articles.map(article => `
                        <div class="knowledge-item">
                            <h6>${article.title}</h6>
                            <p>${article.content.substring(0, 100)}...</p>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<div class="alert alert-danger">Error searching knowledge base</div>';
        }
    } catch (error) {
        console.error('Error searching with AI:', error);
        container.innerHTML = '<div class="alert alert-danger">Error searching knowledge base</div>';
    }
}

// Filter functions
function filterTickets() {
    const filter = document.getElementById('ticketFilter').value;
    // Implement ticket filtering
    loadTickets();
}

function searchCustomers() {
    const search = document.getElementById('customerSearch').value;
    // Implement customer search
    loadCustomers();
}

function filterCustomers() {
    const filter = document.getElementById('tierFilter').value;
    // Implement customer filtering
    loadCustomers();
}

function searchKnowledge() {
    const search = document.getElementById('knowledgeSearch').value;
    // Implement knowledge base search
    loadKnowledgeBase();
}

function filterKnowledge() {
    const filter = document.getElementById('categoryFilter').value;
    // Implement knowledge base filtering
    loadKnowledgeBase();
}

// Placeholder functions for future implementation
function createNewArticle() {
    alert('Create new article functionality will be implemented');
}

function createNewRule() {
    alert('Create new rule functionality will be implemented');
}

function viewCustomerDetails(customerId) {
    // Mock customer stats data
    const mockCustomerStats = {
        id: customerId,
        name: "John Smith",
        email: "john.smith@email.com",
        tier: "Gold",
        joinDate: "2022-03-15",
        totalOrders: 47,
        totalSpent: 2847.50,
        averageOrderValue: 60.59,
        lastOrderDate: "2024-01-15",
        supportTickets: 8,
        resolvedTickets: 6,
        openTickets: 2,
        satisfactionScore: 4.2,
        preferredCategory: "Electronics",
        returnRate: 0.08,
        lifetimeValue: 2847.50,
        recentActivity: [
            { date: "2024-01-15", action: "Order placed", details: "Order #12345 - $89.99" },
            { date: "2024-01-12", action: "Support ticket", details: "Issue with delivery" },
            { date: "2024-01-10", action: "Order delivered", details: "Order #12340 - $156.99" },
            { date: "2024-01-08", action: "Return processed", details: "Refund of $45.99" },
            { date: "2024-01-05", action: "Review submitted", details: "5-star rating for product" }
        ]
    };
    
    showCustomerStatsModal(mockCustomerStats);
}

function showCustomerStatsModal(customer) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="customerStatsModal" tabindex="-1" aria-labelledby="customerStatsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="customerStatsModalLabel">
                            <i class="fas fa-user me-2"></i>Customer Statistics - ${customer.name}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <!-- Customer Info -->
                            <div class="col-md-4">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Customer Information</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <strong>Name:</strong> ${customer.name}
                                        </div>
                                        <div class="mb-3">
                                            <strong>Email:</strong> ${customer.email}
                                        </div>
                                        <div class="mb-3">
                                            <strong>Tier:</strong> 
                                            <span class="badge bg-warning">${customer.tier}</span>
                                        </div>
                                        <div class="mb-3">
                                            <strong>Member Since:</strong> ${new Date(customer.joinDate).toLocaleDateString()}
                                        </div>
                                        <div class="mb-3">
                                            <strong>Satisfaction Score:</strong> 
                                            <div class="d-flex align-items-center">
                                                <div class="rating me-2">
                                                    ${'★'.repeat(Math.floor(customer.satisfactionScore))}${'☆'.repeat(5-Math.floor(customer.satisfactionScore))}
                                                </div>
                                                <span class="text-muted">${customer.satisfactionScore}/5</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Order Statistics -->
                            <div class="col-md-4">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="fas fa-shopping-cart me-2"></i>Order Statistics</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row text-center">
                                            <div class="col-6 mb-3">
                                                <div class="stat-value text-primary">${customer.totalOrders}</div>
                                                <div class="stat-label">Total Orders</div>
                                            </div>
                                            <div class="col-6 mb-3">
                                                <div class="stat-value text-success">$${customer.totalSpent.toFixed(2)}</div>
                                                <div class="stat-label">Total Spent</div>
                                            </div>
                                            <div class="col-6 mb-3">
                                                <div class="stat-value text-info">$${customer.averageOrderValue.toFixed(2)}</div>
                                                <div class="stat-label">Avg Order Value</div>
                                            </div>
                                            <div class="col-6 mb-3">
                                                <div class="stat-value text-warning">${customer.returnRate * 100}%</div>
                                                <div class="stat-label">Return Rate</div>
                                            </div>
                                        </div>
                                        <div class="mt-3">
                                            <strong>Last Order:</strong> ${new Date(customer.lastOrderDate).toLocaleDateString()}
                                        </div>
                                        <div class="mt-2">
                                            <strong>Preferred Category:</strong> ${customer.preferredCategory}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Support Statistics -->
                            <div class="col-md-4">
                                <div class="card h-100">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="fas fa-headset me-2"></i>Support Statistics</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row text-center">
                                            <div class="col-6 mb-3">
                                                <div class="stat-value text-primary">${customer.supportTickets}</div>
                                                <div class="stat-label">Total Tickets</div>
                                            </div>
                                            <div class="col-6 mb-3">
                                                <div class="stat-value text-success">${customer.resolvedTickets}</div>
                                                <div class="stat-label">Resolved</div>
                                            </div>
                                            <div class="col-6 mb-3">
                                                <div class="stat-value text-warning">${customer.openTickets}</div>
                                                <div class="stat-label">Open</div>
                                            </div>
                                            <div class="col-6 mb-3">
                                                <div class="stat-value text-info">${((customer.resolvedTickets / customer.supportTickets) * 100).toFixed(0)}%</div>
                                                <div class="stat-label">Resolution Rate</div>
                                            </div>
                                        </div>
                                        <div class="mt-3">
                                            <strong>Lifetime Value:</strong> $${customer.lifetimeValue.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Recent Activity -->
                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0"><i class="fas fa-history me-2"></i>Recent Activity</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="timeline">
                                            ${customer.recentActivity.map(activity => `
                                                <div class="timeline-item">
                                                    <div class="timeline-marker bg-primary"></div>
                                                    <div class="timeline-content">
                                                        <div class="timeline-header">
                                                            <strong>${activity.action}</strong>
                                                            <span class="timeline-date">${new Date(activity.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div class="timeline-details">${activity.details}</div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="createTicketForCustomer('${customer.id}')">
                            <i class="fas fa-plus me-1"></i>Create Ticket
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('customerStatsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('customerStatsModal'));
    modal.show();
}

function createTicketForCustomer(customerId) {
    // Close the modal first
    const modal = bootstrap.Modal.getInstance(document.getElementById('customerStatsModal'));
    modal.hide();
    
    // Switch to tickets section and pre-fill customer info
    showSection('tickets');
    alert('Creating new ticket for customer ' + customerId + ' - This would open a ticket creation form');
}

function viewArticle(articleId) {
    alert('View article functionality will be implemented');
}

function editRule(ruleId) {
    // Mock rule data for editing
    const mockRule = {
        id: ruleId,
        name: "High Priority Auto-Assignment",
        description: "Automatically assign high priority tickets to senior agents",
        isActive: true,
        conditions: [
            { field: "priority", operator: "equals", value: "high" },
            { field: "category", operator: "equals", value: "technical" }
        ],
        actions: [
            { type: "assign_agent", value: "senior_agent" },
            { type: "set_priority", value: "urgent" },
            { type: "send_notification", value: "immediate" }
        ],
        triggerEvents: ["ticket_created", "ticket_updated"],
        executionOrder: 1
    };
    
    showEditRuleModal(mockRule);
}

function showEditRuleModal(rule) {
    const modalHTML = `
        <div class="modal fade" id="editRuleModal" tabindex="-1" aria-labelledby="editRuleModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="editRuleModalLabel">
                            <i class="fas fa-edit me-2"></i>Edit Automation Rule
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editRuleForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ruleName" class="form-label">Rule Name</label>
                                        <input type="text" class="form-control" id="ruleName" value="${rule.name}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ruleStatus" class="form-label">Status</label>
                                        <select class="form-select" id="ruleStatus">
                                            <option value="active" ${rule.isActive ? 'selected' : ''}>Active</option>
                                            <option value="inactive" ${!rule.isActive ? 'selected' : ''}>Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="ruleDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="ruleDescription" rows="3" required>${rule.description}</textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Trigger Events</label>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="triggerCreated" ${rule.triggerEvents.includes('ticket_created') ? 'checked' : ''}>
                                            <label class="form-check-label" for="triggerCreated">Ticket Created</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="triggerUpdated" ${rule.triggerEvents.includes('ticket_updated') ? 'checked' : ''}>
                                            <label class="form-check-label" for="triggerUpdated">Ticket Updated</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="triggerAssigned" ${rule.triggerEvents.includes('ticket_assigned') ? 'checked' : ''}>
                                            <label class="form-check-label" for="triggerAssigned">Ticket Assigned</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="triggerClosed" ${rule.triggerEvents.includes('ticket_closed') ? 'checked' : ''}>
                                            <label class="form-check-label" for="triggerClosed">Ticket Closed</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Conditions</label>
                                <div id="conditionsContainer">
                                    ${rule.conditions.map((condition, index) => `
                                        <div class="condition-row mb-2 p-3 border rounded">
                                            <div class="row">
                                                <div class="col-md-4">
                                                    <select class="form-select" name="conditionField">
                                                        <option value="priority" ${condition.field === 'priority' ? 'selected' : ''}>Priority</option>
                                                        <option value="category" ${condition.field === 'category' ? 'selected' : ''}>Category</option>
                                                        <option value="status" ${condition.field === 'status' ? 'selected' : ''}>Status</option>
                                                        <option value="customer_tier" ${condition.field === 'customer_tier' ? 'selected' : ''}>Customer Tier</option>
                                                    </select>
                                                </div>
                                                <div class="col-md-3">
                                                    <select class="form-select" name="conditionOperator">
                                                        <option value="equals" ${condition.operator === 'equals' ? 'selected' : ''}>Equals</option>
                                                        <option value="contains" ${condition.operator === 'contains' ? 'selected' : ''}>Contains</option>
                                                        <option value="greater_than" ${condition.operator === 'greater_than' ? 'selected' : ''}>Greater Than</option>
                                                        <option value="less_than" ${condition.operator === 'less_than' ? 'selected' : ''}>Less Than</option>
                                                    </select>
                                                </div>
                                                <div class="col-md-4">
                                                    <input type="text" class="form-control" name="conditionValue" value="${condition.value}">
                                                </div>
                                                <div class="col-md-1">
                                                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeCondition(this)">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                <button type="button" class="btn btn-outline-primary btn-sm" onclick="addCondition()">
                                    <i class="fas fa-plus me-1"></i>Add Condition
                                </button>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Actions</label>
                                <div id="actionsContainer">
                                    ${rule.actions.map((action, index) => `
                                        <div class="action-row mb-2 p-3 border rounded">
                                            <div class="row">
                                                <div class="col-md-4">
                                                    <select class="form-select" name="actionType">
                                                        <option value="assign_agent" ${action.type === 'assign_agent' ? 'selected' : ''}>Assign Agent</option>
                                                        <option value="set_priority" ${action.type === 'set_priority' ? 'selected' : ''}>Set Priority</option>
                                                        <option value="set_status" ${action.type === 'set_status' ? 'selected' : ''}>Set Status</option>
                                                        <option value="send_notification" ${action.type === 'send_notification' ? 'selected' : ''}>Send Notification</option>
                                                        <option value="add_tag" ${action.type === 'add_tag' ? 'selected' : ''}>Add Tag</option>
                                                    </select>
                                                </div>
                                                <div class="col-md-6">
                                                    <input type="text" class="form-control" name="actionValue" value="${action.value}">
                                                </div>
                                                <div class="col-md-2">
                                                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeAction(this)">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                <button type="button" class="btn btn-outline-primary btn-sm" onclick="addAction()">
                                    <i class="fas fa-plus me-1"></i>Add Action
                                </button>
                            </div>
                            
                            <div class="mb-3">
                                <label for="executionOrder" class="form-label">Execution Order</label>
                                <input type="number" class="form-control" id="executionOrder" value="${rule.executionOrder}" min="1" max="100">
                                <div class="form-text">Lower numbers execute first</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger me-auto" onclick="deleteRule('${rule.id}')">
                            <i class="fas fa-trash me-1"></i>Delete Rule
                        </button>
                        <button type="button" class="btn btn-primary" onclick="saveRule()">
                            <i class="fas fa-save me-1"></i>Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('editRuleModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editRuleModal'));
    modal.show();
}

function addCondition() {
    const container = document.getElementById('conditionsContainer');
    const conditionHTML = `
        <div class="condition-row mb-2 p-3 border rounded">
            <div class="row">
                <div class="col-md-4">
                    <select class="form-select" name="conditionField">
                        <option value="priority">Priority</option>
                        <option value="category">Category</option>
                        <option value="status">Status</option>
                        <option value="customer_tier">Customer Tier</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <select class="form-select" name="conditionOperator">
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control" name="conditionValue" placeholder="Value">
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeCondition(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', conditionHTML);
}

function removeCondition(button) {
    button.closest('.condition-row').remove();
}

function addAction() {
    const container = document.getElementById('actionsContainer');
    const actionHTML = `
        <div class="action-row mb-2 p-3 border rounded">
            <div class="row">
                <div class="col-md-4">
                    <select class="form-select" name="actionType">
                        <option value="assign_agent">Assign Agent</option>
                        <option value="set_priority">Set Priority</option>
                        <option value="set_status">Set Status</option>
                        <option value="send_notification">Send Notification</option>
                        <option value="add_tag">Add Tag</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <input type="text" class="form-control" name="actionValue" placeholder="Value">
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeAction(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', actionHTML);
}

function removeAction(button) {
    button.closest('.action-row').remove();
}

function saveRule() {
    // Collect form data
    const formData = {
        name: document.getElementById('ruleName').value,
        description: document.getElementById('ruleDescription').value,
        isActive: document.getElementById('ruleStatus').value === 'active',
        executionOrder: parseInt(document.getElementById('executionOrder').value)
    };
    
    // Collect conditions
    const conditions = [];
    document.querySelectorAll('.condition-row').forEach(row => {
        const field = row.querySelector('[name="conditionField"]').value;
        const operator = row.querySelector('[name="conditionOperator"]').value;
        const value = row.querySelector('[name="conditionValue"]').value;
        if (field && operator && value) {
            conditions.push({ field, operator, value });
        }
    });
    
    // Collect actions
    const actions = [];
    document.querySelectorAll('.action-row').forEach(row => {
        const type = row.querySelector('[name="actionType"]').value;
        const value = row.querySelector('[name="actionValue"]').value;
        if (type && value) {
            actions.push({ type, value });
        }
    });
    
    formData.conditions = conditions;
    formData.actions = actions;
    
    // Simulate save
    console.log('Saving rule:', formData);
    showNotification('Rule updated successfully!', 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editRuleModal'));
    modal.hide();
    
    // Refresh rules list
    loadAutomationRules();
}

function deleteRule(ruleId) {
    if (confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
        // Simulate delete
        console.log('Deleting rule:', ruleId);
        showNotification('Rule deleted successfully!', 'success');
        
        // Close modal if open
        const modal = document.getElementById('editRuleModal');
        if (modal) {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
        
        // Refresh rules list
        loadAutomationRules();
    }
}

// Close ticket function
async function closeTicket(ticketId) {
    if (confirm('Are you sure you want to close this ticket?')) {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'closed',
                    resolution: 'Ticket closed by support agent'
                })
            });
            
            if (response.ok) {
                // Refresh the tickets list
                loadTickets();
                // Show success message
                showNotification('Ticket closed successfully', 'success');
            } else {
                const error = await response.json();
                showNotification('Error closing ticket: ' + error.message, 'error');
            }
        } catch (error) {
            console.error('Error closing ticket:', error);
            showNotification('Error closing ticket', 'error');
        }
    }
}

// View ticket details
function viewTicketDetails(ticketId) {
    // This would open a modal or navigate to a detailed view
    alert('View ticket details functionality - Ticket ID: ' + ticketId);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ==================== CHATBOT FUNCTIONALITY ====================

// Initialize chatbot when AI section is shown
function initializeChatbot() {
    loadChatTemplates();
    startNewConversation();
}

// Load conversation templates
async function loadChatTemplates() {
    try {
        const response = await fetch('/api/ai/chatbot/templates', {
        });
        
        if (response.ok) {
            conversationTemplates = await response.json();
            displayChatTemplates();
        }
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

// Display conversation templates
function displayChatTemplates() {
    const container = document.getElementById('chatTemplates');
    container.innerHTML = conversationTemplates.map(template => `
        <button class="btn btn-outline-primary template-button" onclick="useTemplate('${template.id}')">
            <div class="fw-bold">${template.name}</div>
            <small class="text-muted">${template.content}</small>
        </button>
    `).join('');
}

// Use a template
function useTemplate(templateId) {
    const template = conversationTemplates.find(t => t.id === templateId);
    if (template) {
        document.getElementById('chatInput').value = template.content;
        sendChatMessage();
    }
}

// Start a new conversation
async function startNewConversation() {
    try {
        const context = getCustomerContext();
        const response = await fetch('/api/ai/chatbot/start-conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ context })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentConversationId = data.sessionId;
            clearChatMessages();
            updateConversationStatus('Ready');
            console.log('New conversation started:', currentConversationId);
        }
    } catch (error) {
        console.error('Error starting conversation:', error);
    }
}

// Get customer context from form
function getCustomerContext() {
    return {
        customer: {
            name: document.getElementById('customerName').value || 'Customer',
            email: 'customer@example.com'
        },
        orderId: document.getElementById('orderId').value,
        category: document.getElementById('issueCategory').value
    };
}

// Send chat message
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!currentConversationId) {
        await startNewConversation();
    }
    
    // Add user message to chat
    addMessageToChat('user', message);
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    updateConversationStatus('AI is thinking...');
    
    try {
        const context = getCustomerContext();
        const response = await fetch('/api/ai/chatbot/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: currentConversationId,
                message: message,
                context: context
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            hideTypingIndicator();
            addMessageToChat('assistant', data.response, { isAI: true });
            updateConversationStatus('Ready');
            
            // Update analytics if available
            if (data.analytics) {
                updateConversationAnalytics(data.analytics);
            }
        } else {
            hideTypingIndicator();
            addMessageToChat('assistant', 'Sorry, I encountered an error. Please try again.', { isError: true });
            updateConversationStatus('Error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        addMessageToChat('assistant', 'Sorry, I encountered an error. Please try again.', { isError: true });
        updateConversationStatus('Error');
    }
}

// Add message to chat display
function addMessageToChat(role, content, metadata = {}) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${role}`;
    avatar.textContent = role === 'user' ? 'A' : 'C'; // A = Agent, C = Customer
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;
    
    // Add context indicator for AI responses
    if (role === 'assistant') {
      const contextIndicator = document.createElement('div');
      contextIndicator.className = 'context-indicator';
      contextIndicator.innerHTML = '<i class="fas fa-brain me-1"></i>Context-aware response';
      contextIndicator.style.cssText = 'font-size: 0.75rem; color: #6c757d; margin-bottom: 0.25rem; font-style: italic;';
      bubble.appendChild(contextIndicator);
    }
    
    bubble.appendChild(contentDiv);
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    metaDiv.textContent = new Date().toLocaleTimeString();
    bubble.appendChild(metaDiv);
    
    if (role === 'user') {
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <span>AI is typing</span>
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Clear chat messages
function clearChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="welcome-message text-center py-4">
            <i class="fas fa-robot fa-3x text-muted mb-3"></i>
            <h5>Welcome to AI Assistant</h5>
            <p class="text-muted">Start a conversation by typing a message below or use one of the quick templates.</p>
        </div>
    `;
}

// Update conversation status
function updateConversationStatus(status) {
    const statusElement = document.getElementById('conversationStatus');
    statusElement.textContent = status;
    
    if (status === 'Ready') {
        statusElement.className = 'badge bg-success ms-2';
    } else if (status === 'AI is thinking...') {
        statusElement.className = 'badge bg-warning ms-2';
    } else if (status === 'Error') {
        statusElement.className = 'badge bg-danger ms-2';
    }
}

// Handle Enter key press in chat input
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// Clear conversation
function clearConversation() {
    if (confirm('Are you sure you want to clear this conversation?')) {
        clearChatMessages();
        currentConversationId = null;
        updateConversationStatus('Ready');
    }
}

// Export conversation
async function exportConversation() {
    if (!currentConversationId) {
        alert('No conversation to export');
        return;
    }
    
    try {
        const response = await fetch(`/api/ai/chatbot/conversation/${currentConversationId}/export`, {
        });
        
        if (response.ok) {
            const conversation = await response.json();
            const dataStr = JSON.stringify(conversation, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `conversation_${currentConversationId}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Error exporting conversation:', error);
        alert('Error exporting conversation');
    }
}

// Toggle analytics
function toggleAnalytics() {
    const analyticsCard = document.getElementById('analyticsCard');
    if (analyticsCard.classList.contains('d-none')) {
        analyticsCard.classList.remove('d-none');
        loadConversationAnalytics();
    } else {
        analyticsCard.classList.add('d-none');
    }
}

// Load conversation analytics
async function loadConversationAnalytics() {
    if (!currentConversationId) return;
    
    try {
        const response = await fetch(`/api/ai/chatbot/conversation/${currentConversationId}/analytics`, {
        });
        
        if (response.ok) {
            const analytics = await response.json();
            displayConversationAnalytics(analytics);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Display conversation analytics
function displayConversationAnalytics(analytics) {
    const container = document.getElementById('conversationAnalytics');
    container.innerHTML = `
        <div class="analytics-item">
            <span class="analytics-label">Total Messages</span>
            <span class="analytics-value">${analytics.totalMessages}</span>
        </div>
        <div class="analytics-item">
            <span class="analytics-label">User Messages</span>
            <span class="analytics-value">${analytics.userMessages}</span>
        </div>
        <div class="analytics-item">
            <span class="analytics-label">AI Responses</span>
            <span class="analytics-value">${analytics.aiMessages}</span>
        </div>
        <div class="analytics-item">
            <span class="analytics-label">Duration</span>
            <span class="analytics-value">${Math.round(analytics.duration / 1000)}s</span>
        </div>
        <div class="analytics-item">
            <span class="analytics-label">Avg Response Time</span>
            <span class="analytics-value">${Math.round(analytics.averageResponseTime)}ms</span>
        </div>
    `;
}

// Analyze sentiment
async function analyzeSentiment() {
    const lastUserMessage = getLastUserMessage();
    if (!lastUserMessage) {
        alert('No user message to analyze');
        return;
    }
    
    try {
        const response = await fetch('/api/ai/analyze-sentiment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: lastUserMessage })
        });
        
        if (response.ok) {
            const analysis = await response.json();
            showSentimentAnalysis(analysis);
        }
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
    }
}

// Get last user message
function getLastUserMessage() {
    const userMessages = document.querySelectorAll('.chat-message.user .message-bubble div:first-child');
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].textContent : null;
}

// Show sentiment analysis
function showSentimentAnalysis(analysis) {
    const sentimentClass = `sentiment-${analysis.sentiment}`;
    const sentimentText = analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1);
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info mt-2';
    alertDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <strong>Sentiment Analysis:</strong>
                <span class="sentiment-indicator ${sentimentClass}">${sentimentText}</span>
                <span class="ms-2">(${analysis.urgency} urgency)</span>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <small class="text-muted">${analysis.reasoning}</small>
    `;
    
    document.getElementById('chatMessages').appendChild(alertDiv);
}

// Suggest response
async function suggestResponse() {
    const lastUserMessage = getLastUserMessage();
    if (!lastUserMessage) {
        alert('No user message to suggest responses for');
        return;
    }
    
    try {
        const context = getCustomerContext();
        const response = await fetch('/api/ai/response-suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerMessage: lastUserMessage,
                context: context
            })
        });
        
        if (response.ok) {
            const suggestions = await response.json();
            showResponseSuggestions(suggestions);
        }
    } catch (error) {
        console.error('Error getting response suggestions:', error);
    }
}

// Show response suggestions
function showResponseSuggestions(suggestions) {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'response-suggestions';
    suggestionsDiv.innerHTML = `
        <h6>Response Suggestions:</h6>
        ${suggestions.map(suggestion => `
            <div class="suggestion-item" onclick="useSuggestion('${suggestion.response}')">
                <div class="suggestion-tone">${suggestion.tone}</div>
                <div class="suggestion-content">${suggestion.response}</div>
            </div>
        `).join('')}
        <button class="btn btn-sm btn-outline-secondary mt-2" onclick="this.parentElement.remove()">
            Close
        </button>
    `;
    
    document.getElementById('chatMessages').appendChild(suggestionsDiv);
}

// Use suggestion
function useSuggestion(suggestion) {
    document.getElementById('chatInput').value = suggestion;
    document.querySelector('.response-suggestions').remove();
}

// Search knowledge base
async function searchKnowledge() {
    const query = prompt('Enter your search query:');
    if (!query) return;
    
    try {
        const response = await fetch('/api/ai/suggest-articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });
        
        if (response.ok) {
            const data = await response.json();
            showKnowledgeSearchResults(data);
        }
    } catch (error) {
        console.error('Error searching knowledge base:', error);
    }
}

// Show knowledge search results
function showKnowledgeSearchResults(data) {
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'response-suggestions';
    resultsDiv.innerHTML = `
        <h6>Knowledge Base Search Results:</h6>
        <p><strong>AI Suggestions:</strong> ${data.suggestions}</p>
        <h6>Relevant Articles:</h6>
        ${data.articles.map(article => `
            <div class="suggestion-item">
                <div class="suggestion-tone">${article.category}</div>
                <div class="suggestion-content">
                    <strong>${article.title}</strong><br>
                    ${article.content.substring(0, 100)}...
                </div>
            </div>
        `).join('')}
        <button class="btn btn-sm btn-outline-secondary mt-2" onclick="this.parentElement.remove()">
            Close
        </button>
    `;
    
    document.getElementById('chatMessages').appendChild(resultsDiv);
}

// Update showSection to initialize chatbot
const originalShowSection = showSection;
showSection = function(sectionName) {
    originalShowSection(sectionName);
    
    if (sectionName === 'ai') {
        initializeChatbot();
    }
};
