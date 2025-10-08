// Global variables
let currentUser = null;
let socket = null;
let currentSection = 'overview';
let currentConversationId = null;
let conversationTemplates = [];
let issueAnalysisData = null;
let currentIssueFilter = 'all';
let allCustomers = []; // Store all customers for filtering
let filteredCustomers = []; // Store filtered customers

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // COMMENTED OUT: Login functionality - go directly to dashboard
    // Check if user is already logged in with demo token
    // const token = localStorage.getItem('token');
    
    // if (token && token.startsWith('demo-token-')) {
    //     // User is already logged in with demo token
    //     verifyTokenAndLoadDashboard();
    // } else {
    //     // Clear any old tokens and show login form
    //     localStorage.removeItem('token');
    //     showLoginForm();
    // }
    
    // Always go directly to dashboard (no login required)
    verifyTokenAndLoadDashboard();
    
    // Initialize socket connection
    initializeSocket();
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // COMMENTED OUT: Login form (no longer needed)
    // const loginFormElement = document.getElementById('loginFormElement');
    // 
    // if (loginFormElement) {
    //     loginFormElement.addEventListener('submit', handleLogin);
    // }
    
    // Sidebar navigation
    const sidebarItems = document.querySelectorAll('.list-group-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(section);
        });
    });
}

// COMMENTED OUT: Login form functionality (no longer needed)
// function showLoginForm() {
//     const loginForm = document.getElementById('loginForm');
//     const dashboard = document.getElementById('dashboard');
//     
//     if (loginForm) {
//         loginForm.classList.remove('d-none');
//     }
//     
//     if (dashboard) {
//         dashboard.classList.add('d-none');
//     }
// }

function showDashboard() {
    // Hide login form and show dashboard (login functionality commented out)
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('dashboard');
    
    if (loginForm) {
        loginForm.classList.add('d-none');
    }
    
    if (dashboard) {
        dashboard.classList.remove('d-none');
    }
    
    // Show overview section by default
    showSection('overview');
    loadDashboardData();
}

async function verifyTokenAndLoadDashboard() {
    // Skip authentication - just show dashboard
    currentUser = {
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'support_agent'
    };
    document.getElementById('userName').textContent = currentUser.name;
    showDashboard();
}

// COMMENTED OUT: Login handler (no longer needed)
// async function handleLogin(e) {
//     e.preventDefault();
//     
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
//     
//     // Accept any non-empty email and password
//     if (email.trim() === '' || password.trim() === '') {
//         alert('Please enter both email and password');
//         return;
//     }
//     
//     // Skip authentication - just show dashboard
//     currentUser = {
//         name: email.split('@')[0] || 'Demo User',
//         email: email,
//         role: 'support_agent'
//     };
//     
//     // Store a demo token to maintain login state
//     localStorage.setItem('token', 'demo-token-' + Date.now());
//     
//     const userNameElement = document.getElementById('userName');
//     if (userNameElement) {
//         userNameElement.textContent = currentUser.name;
//     }
//     
//     showDashboard();
// }

// COMMENTED OUT: Logout functionality (no longer needed)
// function logout() {
//     localStorage.removeItem('token');
//     currentUser = null;
//     showLoginForm();
// }


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
            case 'issues':
                loadIssueDetection();
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
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            updateDashboardStats(stats.overview);
        }
        
        // Load recent tickets
        const ticketsResponse = await fetch('/api/tickets?limit=5', {
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
                    <div class="ticket-badges">
                        <span class="ticket-priority priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span>
                        <span class="ticket-status status-${ticket.status}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadTickets() {
    const container = document.getElementById('ticketsList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    try {
        const response = await fetch('/api/tickets');
        
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
                    <div class="ticket-badges">
                        <span class="ticket-priority priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span>
                        <span class="ticket-status status-${ticket.status}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <small class="text-muted d-block mt-1">${ticket.assignedAgent?.name || 'Unassigned'}</small>
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
        const response = await fetch('/api/customers');
        
        if (response.ok) {
            const data = await response.json();
            allCustomers = data.customers; // Store all customers globally
            filteredCustomers = [...allCustomers]; // Initialize filtered customers
            displayCustomers(filteredCustomers);
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
    
    // Add a header showing the count of filtered results
    const searchTerm = document.getElementById('customerSearch')?.value?.trim() || '';
    const tierFilter = document.getElementById('tierFilter')?.value || '';
    
    let headerHtml = '';
    if (searchTerm || tierFilter) {
        const totalCount = allCustomers.length;
        const filteredCount = customers.length;
        headerHtml = `
            <div class="mb-3 p-2 bg-light rounded">
                <small class="text-muted">
                    <i class="fas fa-filter me-1"></i>
                    Showing ${filteredCount} of ${totalCount} customers
                    ${searchTerm ? `matching "${searchTerm}"` : ''}
                    ${tierFilter ? `in ${tierFilter.toUpperCase()} tier` : ''}
                </small>
            </div>
        `;
    }
    
    container.innerHTML = headerHtml + customers.map((customer, index) => `
        <div class="customer-item fade-in-up hover-lift" style="animation-delay: ${index * 0.1}s">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1 text-gradient">${customer.name || 'Unknown Customer'}</h6>
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
    const category = document.getElementById('categoryFilter').value;
    await loadKnowledgeBaseWithFilter(category);
}

async function viewArticle(articleId) {
    try {
        const response = await fetch(`/api/knowledge/${articleId}`, {
        });
        
        if (response.ok) {
            const article = await response.json();
            showArticleModal(article);
        } else {
            alert('Error loading article');
        }
    } catch (error) {
        console.error('Error loading article:', error);
        alert('Error loading article');
    }
}

function showArticleModal(article) {
    // Format the content with proper line breaks and paragraphs
    const formattedContent = article.content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');

    const modalHtml = `
        <div class="modal fade" id="articleModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-book me-2"></i>${article.title}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Article Meta Information -->
                        <div class="row mb-4">
                            <div class="col-md-8">
                                <div class="d-flex flex-wrap gap-2 mb-2">
                                    <span class="badge bg-primary fs-6">${article.category.toUpperCase()}</span>
                                    ${article.tags.map(tag => `<span class="badge bg-light text-dark clickable-tag" onclick="searchByTag('${tag}')">#${tag}</span>`).join('')}
                                </div>
                                <div class="text-muted small">
                                    <i class="fas fa-user me-1"></i>By ${article.author?.name || 'Unknown'} • 
                                    <i class="fas fa-eye me-1"></i>${article.viewCount} views • 
                                    <i class="fas fa-clock me-1"></i>Last updated: ${new Date(article.lastUpdated).toLocaleDateString()}
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="btn-group" role="group">
                                    <button class="btn btn-outline-primary btn-sm" onclick="copyArticleLink('${article._id}')" title="Copy Link">
                                        <i class="fas fa-link"></i>
                                    </button>
                                    <button class="btn btn-outline-secondary btn-sm" onclick="printArticle()" title="Print Article">
                                        <i class="fas fa-print"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Article Content -->
                        <div class="article-content" style="line-height: 1.6; font-size: 1.1rem;">
                            ${formattedContent}
                        </div>

                        <!-- Article Statistics -->
                        <div class="row mt-4 pt-3 border-top">
                            <div class="col-md-6">
                                <div class="d-flex align-items-center">
                                    <span class="text-success me-2">
                                        <i class="fas fa-thumbs-up"></i> ${article.helpfulCount || 0} found helpful
                                    </span>
                                    <span class="text-danger">
                                        <i class="fas fa-thumbs-down"></i> ${article.notHelpfulCount || 0} not helpful
                                    </span>
                                </div>
                            </div>
                            <div class="col-md-6 text-end">
                                <small class="text-muted">
                                    Article ID: ${article._id}
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div class="me-auto">
                            <button class="btn btn-success" onclick="rateArticle('${article._id}', true)">
                                <i class="fas fa-thumbs-up me-1"></i>Helpful
                            </button>
                            <button class="btn btn-outline-danger ms-2" onclick="rateArticle('${article._id}', false)">
                                <i class="fas fa-thumbs-down me-1"></i>Not Helpful
                            </button>
                        </div>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('articleModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('articleModal'));
    modal.show();
}

async function rateArticle(articleId, helpful) {
    try {
        const response = await fetch(`/api/knowledge/${articleId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ helpful })
        });
        
        if (response.ok) {
            // Show success message
            const message = helpful ? 
                'Thank you for your feedback! This article was marked as helpful.' : 
                'Thank you for your feedback. We\'ll work to improve this article.';
            
            // Show a toast notification instead of alert
            showNotification(message, 'success');
            
            // Update the rating buttons to show the new count
            updateArticleRating(articleId, helpful);
        } else {
            showNotification('Error submitting feedback. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error rating article:', error);
        showNotification('Error submitting feedback. Please try again.', 'error');
    }
}

function copyArticleLink(articleId) {
    const articleUrl = `${window.location.origin}/api/knowledge/${articleId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(articleUrl).then(() => {
        showNotification('Article link copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = articleUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Article link copied to clipboard!', 'success');
    });
}

function printArticle() {
    const modal = document.getElementById('articleModal');
    if (!modal) return;
    
    const printContent = modal.querySelector('.modal-body').innerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Article Print</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .article-content { line-height: 1.6; }
                    .badge { margin-right: 5px; }
                </style>
            </head>
            <body>
                <div class="container mt-4">
                    ${printContent}
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

function updateArticleRating(articleId, helpful) {
    // Update the rating display in the modal
    const modal = document.getElementById('articleModal');
    if (!modal) return;
    
    const helpfulCountElement = modal.querySelector('.text-success');
    const notHelpfulCountElement = modal.querySelector('.text-danger');
    
    if (helpful && helpfulCountElement) {
        const currentCount = parseInt(helpfulCountElement.textContent.match(/\d+/)[0]) || 0;
        helpfulCountElement.innerHTML = `<i class="fas fa-thumbs-up"></i> ${currentCount + 1} found helpful`;
    } else if (!helpful && notHelpfulCountElement) {
        const currentCount = parseInt(notHelpfulCountElement.textContent.match(/\d+/)[0]) || 0;
        notHelpfulCountElement.innerHTML = `<i class="fas fa-thumbs-down"></i> ${currentCount + 1} not helpful`;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function displayKnowledgeBase(articles, searchQuery = null) {
    const container = document.getElementById('knowledgeList');
    
    if (articles.length === 0) {
        const message = searchQuery ? 
            `<div class="empty-state"><i class="fas fa-search"></i><p>No articles found for "${searchQuery}"</p><button class="btn btn-primary btn-sm" onclick="clearKnowledgeSearch()">Clear Search</button></div>` :
            '<div class="empty-state"><i class="fas fa-book"></i><p>No articles found</p></div>';
        container.innerHTML = message;
        return;
    }
    
    // Show search context if searching
    let searchHeader = '';
    if (searchQuery) {
        searchHeader = `
            <div class="search-results-header mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-search me-2"></i>
                        Search results for "${searchQuery}" (${articles.length} found)
                    </h6>
                    <button class="btn btn-sm btn-outline-secondary" onclick="clearKnowledgeSearch()">
                        <i class="fas fa-times"></i> Clear
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = searchHeader + articles.map(article => `
        <div class="knowledge-item slide-in">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${article.title}</h6>
                    <p class="text-muted mb-2">${article.content.substring(0, 150)}${article.content.length > 150 ? '...' : ''}</p>
                    <div class="d-flex gap-2 mb-2">
                        <span class="badge bg-primary">${article.category}</span>
                        ${article.tags.map(tag => `<span class="badge bg-light text-dark clickable-tag" onclick="searchByTag('${tag}')">${tag}</span>`).join('')}
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
    // Clear any existing modal instances
    const existingModal = document.getElementById('ticketDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Clear the form
    document.getElementById('ticketForm').reset();
    
    // Show the create ticket modal
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
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase().trim();
    const tierFilter = document.getElementById('tierFilter').value;
    
    // If no search term and no tier filter, show all customers
    if (!searchTerm && !tierFilter) {
        filteredCustomers = [...allCustomers];
    } else {
        // Filter customers based on search term and tier
        filteredCustomers = allCustomers.filter(customer => {
            const matchesSearch = !searchTerm || 
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.email.toLowerCase().includes(searchTerm) ||
                customer.customerId.toLowerCase().includes(searchTerm);
            
            const matchesTier = !tierFilter || customer.customerTier === tierFilter;
            
            return matchesSearch && matchesTier;
        });
    }
    
    displayCustomers(filteredCustomers);
}

function filterCustomers() {
    // Trigger search when tier filter changes (searchCustomers handles both search and tier filtering)
    searchCustomers();
}

function clearCustomerFilters() {
    document.getElementById('customerSearch').value = '';
    document.getElementById('tierFilter').value = '';
    filteredCustomers = [...allCustomers];
    displayCustomers(filteredCustomers);
}

async function searchKnowledge() {
    const search = document.getElementById('knowledgeSearch').value;
    if (!search.trim()) {
        loadKnowledgeBase();
        return;
    }
    
    const container = document.getElementById('knowledgeList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Searching...</span></div></div>';
    
    try {
        const response = await fetch(`/api/knowledge?search=${encodeURIComponent(search)}`, {
        });
        
        if (response.ok) {
            const data = await response.json();
            displayKnowledgeBase(data.articles, search);
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error searching knowledge base</p></div>';
        }
    } catch (error) {
        console.error('Error searching knowledge base:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error searching knowledge base</p></div>';
    }
}

function filterKnowledge() {
    const filter = document.getElementById('categoryFilter').value;
    const search = document.getElementById('knowledgeSearch').value;
    
    if (search.trim()) {
        // If there's a search query, search with category filter
        searchKnowledgeWithFilter(search, filter);
    } else {
        // Otherwise just filter by category
        loadKnowledgeBaseWithFilter(filter);
    }
}

async function loadKnowledgeBaseWithFilter(category = null) {
    const container = document.getElementById('knowledgeList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    try {
        let url = '/api/knowledge';
        if (category) {
            url += `?category=${encodeURIComponent(category)}`;
        }
        
        const response = await fetch(url, {
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

async function searchKnowledgeWithFilter(search, category = null) {
    const container = document.getElementById('knowledgeList');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner-border" role="status"><span class="visually-hidden">Searching...</span></div></div>';
    
    try {
        let url = `/api/knowledge?search=${encodeURIComponent(search)}`;
        if (category) {
            url += `&category=${encodeURIComponent(category)}`;
        }
        
        const response = await fetch(url, {
        });
        
        if (response.ok) {
            const data = await response.json();
            displayKnowledgeBase(data.articles, search);
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error searching knowledge base</p></div>';
        }
    } catch (error) {
        console.error('Error searching knowledge base:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error searching knowledge base</p></div>';
    }
}

function searchByTag(tag) {
    document.getElementById('knowledgeSearch').value = tag;
    searchKnowledge();
}

function clearKnowledgeSearch() {
    document.getElementById('knowledgeSearch').value = '';
    document.getElementById('categoryFilter').value = '';
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
async function viewTicketDetails(ticketId) {
    try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        
        if (response.ok) {
            const ticket = await response.json();
            showTicketModal(ticket);
        } else {
            showNotification('Error loading ticket details', 'error');
        }
    } catch (error) {
        console.error('Error loading ticket:', error);
        showNotification('Error loading ticket details', 'error');
    }
}

function showTicketModal(ticket) {
    const modalHtml = `
        <div class="modal fade" id="ticketDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-ticket-alt me-2"></i>Ticket Details - ${ticket.ticketId}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Ticket Header Information -->
                        <div class="row mb-4">
                            <div class="col-md-8">
                                <h4 class="mb-2">${ticket.subject}</h4>
                                <div class="d-flex flex-wrap gap-2 mb-3">
                                    <span class="badge bg-primary fs-6">${ticket.category.toUpperCase()}</span>
                                    <span class="badge priority-${ticket.priority} fs-6">${ticket.priority.toUpperCase()}</span>
                                    <span class="badge status-${ticket.status} fs-6">${ticket.status.replace('_', ' ').toUpperCase()}</span>
                                    ${ticket.tags.map(tag => `<span class="badge bg-light text-dark">#${tag}</span>`).join('')}
                                </div>
                                <div class="text-muted small">
                                    <i class="fas fa-user me-1"></i>Customer: ${ticket.customerId?.name || 'Unknown'} (${ticket.customerId?.email || 'No email'}) • 
                                    <i class="fas fa-user-tie me-1"></i>Agent: ${ticket.assignedAgent?.name || 'Unassigned'} • 
                                    <i class="fas fa-clock me-1"></i>Created: ${new Date(ticket.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="btn-group-vertical" role="group">
                                    <button class="btn btn-outline-primary btn-sm" onclick="updateTicketStatus('${ticket._id}')" title="Update Status">
                                        <i class="fas fa-edit me-1"></i>Update Status
                                    </button>
                                    <button class="btn btn-outline-success btn-sm" onclick="addMessageToTicket('${ticket._id}')" title="Add Message">
                                        <i class="fas fa-comment me-1"></i>Add Message
                                    </button>
                                    ${ticket.status !== 'closed' ? `
                                        <button class="btn btn-outline-danger btn-sm" onclick="closeTicket('${ticket._id}')" title="Close Ticket">
                                            <i class="fas fa-times me-1"></i>Close Ticket
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Ticket Description -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="fas fa-file-alt me-2"></i>Description</h6>
                            </div>
                            <div class="card-body">
                                <p class="mb-0">${ticket.description}</p>
                            </div>
                        </div>

                        <!-- Messages/Conversation -->
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0"><i class="fas fa-comments me-2"></i>Conversation</h6>
                                <span class="badge bg-secondary">${ticket.messages?.length || 0} messages</span>
                            </div>
                            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                                ${ticket.messages && ticket.messages.length > 0 ? 
                                    ticket.messages.map(message => `
                                        <div class="message-item mb-3 p-3 border rounded ${message.sender === 'customer' ? 'bg-light' : message.sender === 'agent' ? 'bg-primary text-white' : 'bg-warning'}">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-${message.sender === 'customer' ? 'user' : message.sender === 'agent' ? 'user-tie' : 'robot'} me-2"></i>
                                                    <strong>${message.sender === 'customer' ? 'Customer' : message.sender === 'agent' ? 'Agent' : 'System'}</strong>
                                                    ${message.isAI ? '<span class="badge bg-info ms-2">AI</span>' : ''}
                                                </div>
                                                <small class="text-muted">${new Date(message.timestamp).toLocaleString()}</small>
                                            </div>
                                            <p class="mb-0">${message.content}</p>
                                        </div>
                                    `).join('') : 
                                    '<div class="text-center text-muted py-4"><i class="fas fa-comment-slash fa-2x mb-2"></i><br>No messages yet</div>'
                                }
                            </div>
                        </div>

                        <!-- Ticket Resolution (if closed) -->
                        ${ticket.status === 'closed' && ticket.resolution ? `
                            <div class="card mt-4">
                                <div class="card-header">
                                    <h6 class="mb-0"><i class="fas fa-check-circle me-2"></i>Resolution</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0">${ticket.resolution}</p>
                                    <small class="text-muted">
                                        Resolved on: ${ticket.actualResolution ? new Date(ticket.actualResolution).toLocaleString() : 'Unknown'}
                                    </small>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Customer Satisfaction (if available) -->
                        ${ticket.satisfaction ? `
                            <div class="card mt-4">
                                <div class="card-header">
                                    <h6 class="mb-0"><i class="fas fa-star me-2"></i>Customer Satisfaction</h6>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex align-items-center">
                                        <div class="me-3">
                                            ${Array.from({length: 5}, (_, i) => 
                                                `<i class="fas fa-star ${i < ticket.satisfaction.rating ? 'text-warning' : 'text-muted'}"></i>`
                                            ).join('')}
                                        </div>
                                        <span class="badge bg-${ticket.satisfaction.rating >= 4 ? 'success' : ticket.satisfaction.rating >= 3 ? 'warning' : 'danger'}">
                                            ${ticket.satisfaction.rating}/5
                                        </span>
                                    </div>
                                    ${ticket.satisfaction.feedback ? `<p class="mt-2 mb-0">"${ticket.satisfaction.feedback}"</p>` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing ticket details modal if any
    const existingModal = document.getElementById('ticketDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('ticketDetailsModal'));
    modal.show();
    
    // Clean up modal when hidden
    const modalElement = document.getElementById('ticketDetailsModal');
    modalElement.addEventListener('hidden.bs.modal', function () {
        modalElement.remove();
    });
}

// Update ticket status
function updateTicketStatus(ticketId) {
    const statusOptions = ['open', 'in_progress', 'pending_customer', 'resolved', 'closed'];
    const currentStatus = 'open'; // Default status since we can't easily determine current status
    
    const statusHtml = `
        <div class="modal fade" id="statusModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Update Ticket Status</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">New Status</label>
                            <select class="form-select" id="newStatus">
                                ${statusOptions.map(status => 
                                    `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status.replace('_', ' ').toUpperCase()}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Resolution Notes (Optional)</label>
                            <textarea class="form-control" id="resolutionNotes" rows="3" placeholder="Add any notes about the status change..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveTicketStatus('${ticketId}')">Update Status</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing status modal
    const existingModal = document.getElementById('statusModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', statusHtml);
    const modal = new bootstrap.Modal(document.getElementById('statusModal'));
    modal.show();
}

async function saveTicketStatus(ticketId) {
    const newStatus = document.getElementById('newStatus').value;
    const resolutionNotes = document.getElementById('resolutionNotes').value;
    
    try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                status: newStatus,
                resolution: resolutionNotes || undefined,
                actualResolution: newStatus === 'closed' ? new Date().toISOString() : undefined
            })
        });
        
        if (response.ok) {
            showNotification('Ticket status updated successfully', 'success');
            
            // Close the status modal
            const statusModal = bootstrap.Modal.getInstance(document.getElementById('statusModal'));
            statusModal.hide();
            
            // Refresh the ticket modal
            setTimeout(() => {
                viewTicketDetails(ticketId);
            }, 500);
            
            // Refresh the tickets list
            loadTickets();
        } else {
            showNotification('Error updating ticket status', 'error');
        }
    } catch (error) {
        console.error('Error updating ticket status:', error);
        showNotification('Error updating ticket status', 'error');
    }
}

// Add message to ticket
function addMessageToTicket(ticketId) {
    const messageHtml = `
        <div class="modal fade" id="messageModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Message to Ticket</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Message Type</label>
                            <select class="form-select" id="messageType">
                                <option value="agent">Agent Response</option>
                                <option value="system">System Message</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Message Content</label>
                            <textarea class="form-control" id="messageContent" rows="5" placeholder="Enter your message..." required></textarea>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="isAI" value="true">
                                <label class="form-check-label" for="isAI">
                                    This is an AI-generated response
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveTicketMessage('${ticketId}')">Add Message</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing message modal
    const existingModal = document.getElementById('messageModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', messageHtml);
    const modal = new bootstrap.Modal(document.getElementById('messageModal'));
    modal.show();
}

async function saveTicketMessage(ticketId) {
    const messageType = document.getElementById('messageType').value;
    const messageContent = document.getElementById('messageContent').value;
    const isAI = document.getElementById('isAI').checked;
    
    if (!messageContent.trim()) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/tickets/${ticketId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                content: messageContent,
                sender: messageType,
                isAI: isAI
            })
        });
        
        if (response.ok) {
            showNotification('Message added successfully', 'success');
            
            // Close the message modal
            const messageModal = bootstrap.Modal.getInstance(document.getElementById('messageModal'));
            messageModal.hide();
            
            // Refresh the ticket modal
            setTimeout(() => {
                viewTicketDetails(ticketId);
            }, 500);
            
            // Refresh the tickets list
            loadTickets();
        } else {
            showNotification('Error adding message', 'error');
        }
    } catch (error) {
        console.error('Error adding message:', error);
        showNotification('Error adding message', 'error');
    }
}


// ==================== CHATBOT FUNCTIONALITY ====================

// Initialize chatbot when AI section is shown
function initializeChatbot() {
    loadChatTemplates();
    startNewConversation();
}

// Send automatic customer message when conversation starts
async function sendAutomaticCustomerMessage() {
    console.log('🔄 sendAutomaticCustomerMessage called');
    
    const customerMessages = [
        "Hi, I'm having trouble with my order. Can you help me?",
        "I ordered something 3 days ago but haven't received any tracking info. What's going on?",
        "The item I received is completely different from what I ordered. This is ridiculous!",
        "I need to return this item but I can't find the return label. Can you help?",
        "My package says delivered but I never got it. Where is it?",
        "I want to cancel my order but it's already shipped. What can I do?",
        "The quality of this product is terrible. I want a refund immediately.",
        "I've been waiting for my order for over a week. This is unacceptable!",
        "Can you tell me when my order will arrive? I need it by Friday.",
        "I'm not happy with this purchase. How do I return it?"
    ];
    
    // Select a random customer message
    const randomMessage = customerMessages[Math.floor(Math.random() * customerMessages.length)];
    
    console.log('📝 Adding customer message:', randomMessage);
    
    // Add the message to chat display only - don't send to AI service
    addMessageToChat('customer', randomMessage);
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
    console.log('🚀 startNewConversation called');
    
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
            console.log('✅ New conversation started:', currentConversationId);
            
            // Set default message in input bar
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = "Hello! Can you please inform me regarding your grievance";
            }
        }
    } catch (error) {
        console.error('Error starting conversation:', error);
    }
}

// Get customer context from mock data
function getCustomerContext() {
    const mockCustomer = window.currentMockCustomer || mockCustomers[0];
    return {
        customer: {
            name: mockCustomer.name,
            email: mockCustomer.email
        },
        orderId: mockCustomer.orderId,
        category: mockCustomer.issue.toLowerCase().replace(/[^a-z]/g, '')
    };
}

// Send chat message
async function sendChatMessage(automaticMessage = null, isAutomatic = false) {
    const input = document.getElementById('chatInput');
    const message = automaticMessage || input.value.trim();
    
    if (!message) return;
    
    if (!currentConversationId) {
        await startNewConversation();
    }
    
    // Add user message to chat (only if not automatic)
    if (!isAutomatic) {
    addMessageToChat('user', message);
    input.value = '';
    }
    
    // Refresh analytics if visible
    refreshAnalyticsIfVisible();
    
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
            } else {
                // Refresh analytics if visible
                refreshAnalyticsIfVisible();
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
    console.log('💬 addMessageToChat called with role:', role, 'content:', content.substring(0, 50) + '...');
    
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
    avatar.textContent = role === 'user' ? 'A' : (role === 'customer' ? 'C' : 'A'); // A = Agent, C = Customer
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;
    
    // Add AI generation indicator for assistant responses
    if (role === 'assistant') {
      const aiIndicator = document.createElement('div');
      aiIndicator.className = 'ai-indicator';
      
      if (metadata.isAIGenerated) {
        aiIndicator.innerHTML = '<i class="fas fa-robot me-1"></i>AI-Generated Response';
        aiIndicator.style.cssText = 'font-size: 0.75rem; color: #28a745; margin-bottom: 0.25rem; font-style: italic;';
      } else if (metadata.isFallback) {
        aiIndicator.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Fallback Response';
        aiIndicator.style.cssText = 'font-size: 0.75rem; color: #ffc107; margin-bottom: 0.25rem; font-style: italic;';
      } else {
        aiIndicator.innerHTML = '<i class="fas fa-brain me-1"></i>Local Intelligence';
        aiIndicator.style.cssText = 'font-size: 0.75rem; color: #17a2b8; margin-bottom: 0.25rem; font-style: italic;';
      }
      
      bubble.appendChild(aiIndicator);
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
    if (!analyticsCard) {
        console.error('Analytics card not found');
        showNotification('Analytics card not found', 'error');
        return;
    }
    
    if (analyticsCard.classList.contains('d-none')) {
        analyticsCard.classList.remove('d-none');
        analyticsCard.classList.add('show');
        loadConversationAnalytics();
        
        // Set up auto-refresh for analytics
        startAnalyticsAutoRefresh();
        
        showNotification('Analytics panel opened', 'success');
    } else {
        analyticsCard.classList.add('d-none');
        analyticsCard.classList.remove('show');
        
        // Stop auto-refresh
        stopAnalyticsAutoRefresh();
        
        showNotification('Analytics panel closed', 'info');
    }
}

// Auto-refresh analytics every 30 seconds
let analyticsRefreshInterval = null;

function startAnalyticsAutoRefresh() {
    // Clear any existing interval
    stopAnalyticsAutoRefresh();
    
    // Set up new interval
    analyticsRefreshInterval = setInterval(() => {
        if (!document.getElementById('analyticsCard').classList.contains('d-none')) {
            loadConversationAnalytics();
        }
    }, 30000); // Refresh every 30 seconds
}

function stopAnalyticsAutoRefresh() {
    if (analyticsRefreshInterval) {
        clearInterval(analyticsRefreshInterval);
        analyticsRefreshInterval = null;
    }
}

// Update conversation analytics
function updateConversationAnalytics(analytics) {
    displayConversationAnalytics(analytics);
}

// Refresh analytics when new messages are added
function refreshAnalyticsIfVisible() {
    const analyticsCard = document.getElementById('analyticsCard');
    if (analyticsCard && !analyticsCard.classList.contains('d-none')) {
        loadConversationAnalytics();
    }
}

// Toggle templates dropdown
function toggleTemplates() {
    const chevron = document.getElementById('templatesChevron');
    if (chevron) {
        chevron.classList.toggle('fa-chevron-down');
        chevron.classList.toggle('fa-chevron-up');
    }
}

// Mock customer data
const mockCustomers = [
    { name: "Sarah Johnson", orderId: "#ORD-2024-001234", email: "sarah.johnson@email.com", issue: "Order Inquiry" },
    { name: "Michael Chen", orderId: "#ORD-2024-001567", email: "m.chen@email.com", issue: "Shipping" },
    { name: "Emily Rodriguez", orderId: "#ORD-2024-001890", email: "emily.r@email.com", issue: "Return/Exchange" },
    { name: "David Thompson", orderId: "#ORD-2024-002123", email: "david.t@email.com", issue: "Technical Support" },
    { name: "Lisa Wang", orderId: "#ORD-2024-002456", email: "lisa.wang@email.com", issue: "Billing" },
    { name: "James Wilson", orderId: "#ORD-2024-002789", email: "j.wilson@email.com", issue: "General Question" },
    { name: "Maria Garcia", orderId: "#ORD-2024-003012", email: "maria.g@email.com", issue: "Order Inquiry" },
    { name: "Robert Brown", orderId: "#ORD-2024-003345", email: "robert.brown@email.com", issue: "Shipping" }
];

// Load random customer data
function loadMockCustomer() {
    const randomCustomer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
    
    const nameElement = document.getElementById('mockCustomerName');
    const orderElement = document.getElementById('mockOrderId');
    const issueElement = document.getElementById('mockIssueCategory');
    
    if (nameElement) nameElement.textContent = randomCustomer.name;
    if (orderElement) orderElement.textContent = randomCustomer.orderId;
    if (issueElement) issueElement.textContent = randomCustomer.issue;
    
    // Update the getCustomerContext function to use mock data
    window.currentMockCustomer = randomCustomer;
}

// Load conversation analytics
async function loadConversationAnalytics() {
    const container = document.getElementById('conversationAnalytics');
    if (!container) {
        console.error('Analytics container not found');
        return;
    }
    
    // Show loading state
    container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin me-2"></i>Loading analytics...</div>';
    
    if (!currentConversationId) {
        // Show general analytics or message about starting a conversation
        displayGeneralAnalytics();
        return;
    }
    
    try {
        const response = await fetch(`/api/ai/chatbot/conversation/${currentConversationId}/analytics`);
        
        if (response.ok) {
            const analytics = await response.json();
            displayConversationAnalytics(analytics);
        } else {
            throw new Error(`Failed to load analytics: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        displayAnalyticsError(error.message);
    }
}

// Display general analytics when no conversation is active
function displayGeneralAnalytics() {
    const container = document.getElementById('conversationAnalytics');
    container.innerHTML = `
        <div class="text-center text-muted">
            <i class="fas fa-info-circle me-2"></i>
            <p class="mb-2">No active conversation</p>
            <small>Start a conversation to see analytics</small>
        </div>
    `;
}

// Display analytics error
function displayAnalyticsError(errorMessage) {
    const container = document.getElementById('conversationAnalytics');
    container.innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Analytics Error:</strong> ${errorMessage}
        </div>
    `;
}

// Display conversation analytics
function displayConversationAnalytics(analytics) {
    const container = document.getElementById('conversationAnalytics');
    
    // Calculate additional metrics
    const durationMinutes = Math.round(analytics.duration / (1000 * 60));
    const durationSeconds = Math.round((analytics.duration % (1000 * 60)) / 1000);
    const responseTimeSeconds = Math.round(analytics.averageResponseTime / 1000);
    const messagesPerMinute = durationMinutes > 0 ? (analytics.totalMessages / durationMinutes).toFixed(1) : 0;
    
    container.innerHTML = `
        <div class="row g-3">
            <div class="col-6">
                <div class="analytics-item">
                    <span class="analytics-label">
                        <i class="fas fa-comments me-1"></i>Total Messages
                    </span>
                    <span class="analytics-value">${analytics.totalMessages}</span>
                </div>
            </div>
            <div class="col-6">
                <div class="analytics-item">
                    <span class="analytics-label">
                        <i class="fas fa-user me-1"></i>User Messages
                    </span>
                    <span class="analytics-value">${analytics.userMessages}</span>
                </div>
            </div>
            <div class="col-6">
                <div class="analytics-item">
                    <span class="analytics-label">
                        <i class="fas fa-robot me-1"></i>AI Responses
                    </span>
                    <span class="analytics-value">${analytics.aiMessages}</span>
                </div>
            </div>
            <div class="col-6">
                <div class="analytics-item">
                    <span class="analytics-label">
                        <i class="fas fa-clock me-1"></i>Duration
                    </span>
                    <span class="analytics-value">${durationMinutes}m ${durationSeconds}s</span>
                </div>
            </div>
            <div class="col-6">
                <div class="analytics-item">
                    <span class="analytics-label">
                        <i class="fas fa-tachometer-alt me-1"></i>Avg Response Time
                    </span>
                    <span class="analytics-value">${responseTimeSeconds}s</span>
                </div>
            </div>
            <div class="col-6">
                <div class="analytics-item">
                    <span class="analytics-label">
                        <i class="fas fa-chart-line me-1"></i>Messages/Min
                    </span>
                    <span class="analytics-value">${messagesPerMinute}</span>
                </div>
            </div>
        </div>
        
        <div class="mt-3">
            <div class="analytics-summary">
                <h6 class="text-muted mb-2">
                    <i class="fas fa-chart-pie me-1"></i>Conversation Summary
                </h6>
                <div class="row g-2">
                    <div class="col-12">
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-primary" role="progressbar" 
                                 style="width: ${analytics.userMessages > 0 ? (analytics.userMessages / analytics.totalMessages * 100) : 0}%">
                            </div>
                        </div>
                        <small class="text-muted">User participation: ${analytics.userMessages > 0 ? Math.round(analytics.userMessages / analytics.totalMessages * 100) : 0}%</small>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-3 text-center">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Last updated: ${new Date().toLocaleTimeString()}
            </small>
        </div>
    `;
}

// Analyze sentiment
async function analyzeSentiment() {
    const lastUserMessage = getLastUserMessage();
    if (!lastUserMessage) {
        // Try to get any message from the chat
        const allMessages = document.querySelectorAll('.message-bubble div:first-child');
        if (allMessages.length === 0) {
            showNotification('No messages to analyze. Please send a message first.', 'warning');
            return;
        }
        
        // Use the last message available
        const lastMessage = allMessages[allMessages.length - 1].textContent;
        if (!lastMessage || lastMessage.trim() === '') {
            showNotification('No valid message content to analyze.', 'warning');
            return;
        }
        
        // Use the last available message
        await performSentimentAnalysis(lastMessage);
        return;
    }
    
    await performSentimentAnalysis(lastUserMessage);
}

async function performSentimentAnalysis(content) {
    try {
        showNotification('Analyzing sentiment with conversation context...', 'info');
        
        const conversationHistory = getConversationHistory();
        
        const response = await fetch('/api/ai/analyze-sentiment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                content: content,
                conversationHistory: conversationHistory
            })
        });
        
        if (response.ok) {
            const analysis = await response.json();
            showEnhancedSentimentAnalysis(analysis);
            showNotification('Enhanced sentiment analysis completed!', 'success');
        } else {
            showNotification('Error analyzing sentiment. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        showNotification('Error analyzing sentiment. Please try again.', 'error');
    }
}

// Get last user message
function getLastUserMessage() {
    const userMessages = document.querySelectorAll('.chat-message.user .message-bubble div:first-child');
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].textContent : null;
}

// Get conversation history for analysis
function getConversationHistory() {
    const userMessages = document.querySelectorAll('.chat-message.user .message-bubble div:first-child');
    const customerMessages = document.querySelectorAll('.chat-message.customer .message-bubble div:first-child');
    
    const conversationHistory = [];
    
    // Combine all messages in chronological order
    const allMessages = [];
    
    userMessages.forEach((msg, index) => {
        allMessages.push({
            role: 'user',
            content: msg.textContent.trim(),
            timestamp: new Date().toISOString(),
            index: index
        });
    });
    
    customerMessages.forEach((msg, index) => {
        allMessages.push({
            role: 'assistant',
            content: msg.textContent.trim(),
            timestamp: new Date().toISOString(),
            index: index
        });
    });
    
    // Sort by index to maintain chronological order
    allMessages.sort((a, b) => a.index - b.index);
    
    return allMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
    }));
}

// Show enhanced sentiment analysis
function showEnhancedSentimentAnalysis(analysis) {
    const sentimentClass = `sentiment-${analysis.sentiment}`;
    const sentimentText = analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1);
    const urgencyClass = `urgency-${analysis.urgency}`;
    const urgencyText = analysis.urgency.charAt(0).toUpperCase() + analysis.urgency.slice(1);
    
    // Get sentiment icon
    let sentimentIcon = '😐';
    if (analysis.sentiment === 'positive') sentimentIcon = '😊';
    else if (analysis.sentiment === 'negative') sentimentIcon = '😠';
    
    // Get urgency icon
    let urgencyIcon = '🟢';
    if (analysis.urgency === 'urgent') urgencyIcon = '🔴';
    else if (analysis.urgency === 'high') urgencyIcon = '🟠';
    else if (analysis.urgency === 'medium') urgencyIcon = '🟡';
    
    // Get confidence level
    const confidence = analysis.confidence || 'medium';
    const confidenceIcon = confidence === 'high' ? '🎯' : confidence === 'medium' ? '📊' : '❓';
    const confidenceColor = confidence === 'high' ? 'text-success' : confidence === 'medium' ? 'text-warning' : 'text-danger';
    
    // Format emotions
    const emotionsHtml = analysis.emotions && analysis.emotions.length > 0 
        ? analysis.emotions.map(emotion => `<span class="badge bg-info me-1">${emotion}</span>`).join('')
        : '<span class="text-muted">No specific emotions detected</span>';
    
    // Format recommendations
    const recommendationsHtml = analysis.recommendations && analysis.recommendations.length > 0
        ? analysis.recommendations.map(rec => `<li class="small">${rec}</li>`).join('')
        : '<li class="small text-muted">No specific recommendations available</li>';
    
    // Conversation context info
    const contextInfo = analysis.conversationContext 
        ? `<div class="mt-2">
               <small class="text-info">
                   <i class="fas fa-comments me-1"></i>
                   <strong>Conversation Context:</strong> ${analysis.conversationContext.conversationLength} messages, 
                   ${analysis.conversationContext.escalationIndicators} escalation indicators, 
                   ${analysis.conversationContext.conversationTone} tone
               </small>
           </div>`
        : '';

    // Additional analysis metrics
    const additionalMetrics = analysis.escalationRisk || analysis.customerSatisfaction 
        ? `<div class="row g-2 mt-2">
               ${analysis.escalationRisk ? `
                   <div class="col-6">
                       <small class="text-warning">
                           <i class="fas fa-exclamation-triangle me-1"></i>
                           <strong>Escalation Risk:</strong> ${analysis.escalationRisk.toUpperCase()}
                       </small>
                   </div>
               ` : ''}
               ${analysis.customerSatisfaction ? `
                   <div class="col-6">
                       <small class="text-info">
                           <i class="fas fa-smile me-1"></i>
                           <strong>Satisfaction:</strong> ${analysis.customerSatisfaction.replace('_', ' ').toUpperCase()}
                       </small>
                   </div>
               ` : ''}
           </div>`
        : '';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info mt-2 sentiment-analysis-result enhanced-sentiment';
    alertDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <div class="d-flex align-items-center mb-3">
                    <i class="fas fa-brain me-2 text-primary"></i>
                    <strong>Enhanced Sentiment Analysis Results</strong>
                    <span class="ms-2 badge bg-secondary">${confidenceIcon} ${confidence.toUpperCase()}</span>
                    <span class="ms-2 badge bg-dark">${analysis.messageLength} chars</span>
                </div>
                
                <div class="row g-3 mb-3">
                    <div class="col-md-4">
                        <div class="sentiment-result">
                            <div class="d-flex align-items-center mb-2">
                                <span class="me-2">${sentimentIcon}</span>
                                <strong>Sentiment:</strong>
                            </div>
                            <span class="badge sentiment-badge ${sentimentClass}">${sentimentText}</span>
                            <div class="mt-1">
                                <small class="text-muted">Score: ${analysis.sentimentScore ? analysis.sentimentScore.toFixed(2) : 'N/A'}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="urgency-result">
                            <div class="d-flex align-items-center mb-2">
                                <span class="me-2">${urgencyIcon}</span>
                                <strong>Urgency:</strong>
                            </div>
                            <span class="badge urgency-badge ${urgencyClass}">${urgencyText}</span>
                            <div class="mt-1">
                                <small class="text-muted">Score: ${analysis.urgencyScore ? analysis.urgencyScore.toFixed(2) : 'N/A'}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="emotions-result">
                            <div class="d-flex align-items-center mb-2">
                                <span class="me-2">🎭</span>
                                <strong>Emotions:</strong>
                            </div>
                            <div>${emotionsHtml}</div>
                        </div>
                    </div>
                </div>
                
                ${contextInfo}
                ${additionalMetrics}
                
                <div class="mt-3">
                    <h6 class="text-primary mb-2">
                        <i class="fas fa-lightbulb me-1"></i>Agent Recommendations
                    </h6>
                    <ul class="list-unstyled mb-0">
                        ${recommendationsHtml}
                    </ul>
                </div>
                
                <div class="mt-3">
                    <details>
                        <summary class="text-muted small cursor-pointer">
                            <i class="fas fa-info-circle me-1"></i>Detailed Analysis
                        </summary>
                        <div class="mt-2 p-2 bg-light rounded">
                            <small class="text-muted">${analysis.reasoning || 'No detailed reasoning available'}</small>
                        </div>
                    </details>
                </div>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.getElementById('chatMessages').appendChild(alertDiv);
    
    // Scroll to the analysis result
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show sentiment analysis (legacy function for compatibility)
function showSentimentAnalysis(analysis) {
    const sentimentClass = `sentiment-${analysis.sentiment}`;
    const sentimentText = analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1);
    const urgencyClass = `urgency-${analysis.urgency}`;
    const urgencyText = analysis.urgency.charAt(0).toUpperCase() + analysis.urgency.slice(1);
    
    // Get sentiment icon
    let sentimentIcon = '😐';
    if (analysis.sentiment === 'positive') sentimentIcon = '😊';
    else if (analysis.sentiment === 'negative') sentimentIcon = '😠';
    
    // Get urgency icon
    let urgencyIcon = '🟢';
    if (analysis.urgency === 'urgent') urgencyIcon = '🔴';
    else if (analysis.urgency === 'high') urgencyIcon = '🟠';
    else if (analysis.urgency === 'medium') urgencyIcon = '🟡';
    
    // Get confidence level
    const confidence = analysis.scores ? (analysis.scores.positive + analysis.scores.negative > 5 ? 'high' : 'medium') : 'medium';
    const confidenceIcon = confidence === 'high' ? '🎯' : '📊';
    const confidenceColor = confidence === 'high' ? 'text-success' : 'text-warning';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info mt-2 sentiment-analysis-result';
    alertDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-brain me-2 text-primary"></i>
                    <strong>Sentiment Analysis Results</strong>
                    <span class="ms-2 badge bg-secondary">${confidenceIcon} ${confidence.toUpperCase()}</span>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="sentiment-result">
                            <div class="d-flex align-items-center mb-1">
                                <span class="me-2">${sentimentIcon}</span>
                                <strong>Sentiment:</strong>
                            </div>
                            <span class="badge sentiment-badge ${sentimentClass}">${sentimentText}</span>
                            ${analysis.scores ? `<small class="d-block text-muted mt-1">Score: ${analysis.scores.positive > analysis.scores.negative ? '+' : ''}${(analysis.scores.positive - analysis.scores.negative).toFixed(1)}</small>` : ''}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="urgency-result">
                            <div class="d-flex align-items-center mb-1">
                                <span class="me-2">${urgencyIcon}</span>
                                <strong>Urgency:</strong>
                            </div>
                            <span class="badge urgency-badge ${urgencyClass}">${urgencyText}</span>
                            ${analysis.scores ? `<small class="d-block text-muted mt-1">Score: ${analysis.scores.urgency}</small>` : ''}
                        </div>
                    </div>
                </div>
                ${analysis.scores && analysis.scores.emotionalIntensity > 0 ? `
                <div class="mt-2">
                    <small class="text-info">
                        <i class="fas fa-fire me-1"></i>
                        <strong>Emotional Intensity:</strong> ${analysis.scores.emotionalIntensity} indicators
                    </small>
                </div>
                ` : ''}
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        <strong>Analysis:</strong> ${analysis.reasoning}
                    </small>
                </div>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.getElementById('chatMessages').appendChild(alertDiv);
    
    // Scroll to the analysis result
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
        const conversationHistory = getConversationHistory();
        
        // If no conversation history, create a mock customer message for issue-based recommendations
        let customerMessageForAnalysis = lastUserMessage;
        if (conversationHistory.length === 0) {
            // Create a mock customer message based on the context
            const mockCustomer = context.customer || {};
            customerMessageForAnalysis = `Customer ${mockCustomer.name || 'inquiry'}: ${mockCustomer.issue || 'general inquiry'}`;
        }
        
        const response = await fetch('/api/ai/response-suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerMessage: customerMessageForAnalysis,
                context: context,
                conversationHistory: conversationHistory
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Response suggestions data:', data);
            
            // Handle both old and new response formats
            if (data.responseSuggestions) {
                // New format with issue recommendations
                showResponseSuggestions(data.responseSuggestions);
                console.log('🔍 Issue recommendations check:', {
                    hasIssues: data.hasIssues,
                    issueRecommendations: data.issueRecommendations,
                    length: data.issueRecommendations ? data.issueRecommendations.length : 0
                });
                if (data.hasIssues && data.issueRecommendations && data.issueRecommendations.length > 0) {
                    showIssueRecommendations(data.issueRecommendations);
                } else {
                    console.log('⚠️ No issue recommendations to show');
                }
            } else {
                // Old format (fallback)
                showResponseSuggestions(data);
            }
        }
    } catch (error) {
        console.error('Error getting response suggestions:', error);
    }
}

// Show response suggestions
function showResponseSuggestions(suggestions) {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'response-suggestions alert alert-info';
    suggestionsDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">
                <i class="fas fa-lightbulb me-2"></i>Response Suggestions
            </h6>
            <button class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <div class="row g-3">
            ${suggestions.map((suggestion, index) => `
                <div class="col-md-4">
                    <div class="card h-100 suggestion-card" onclick="useSuggestion('${suggestion.response.replace(/'/g, "\\'")}')">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge bg-primary suggestion-tone">${suggestion.tone}</span>
                                <i class="fas fa-plus-circle text-primary"></i>
                            </div>
                            <p class="card-text suggestion-content">${suggestion.response}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="mt-3 text-center">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Click on any suggestion to add it to your chat input
            </small>
        </div>
    `;
    
    document.getElementById('chatMessages').appendChild(suggestionsDiv);
    
    // Scroll to suggestions
    suggestionsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Use suggestion
function useSuggestion(suggestion) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = suggestion;
        chatInput.focus();
        // Trigger input event to update any listeners
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Remove the suggestions container
    const suggestionsContainer = document.querySelector('.response-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.remove();
    }
    
    showNotification('Suggestion added to chat input!', 'success');
}

// Show issue-based recommendations
function showIssueRecommendations(issueRecommendations) {
    const recommendationsDiv = document.createElement('div');
    recommendationsDiv.className = 'issue-recommendations alert alert-warning';
    recommendationsDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">
                <i class="fas fa-exclamation-triangle me-2"></i>Issue-Based Recommendations
            </h6>
            <button class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <div class="row g-3">
            ${issueRecommendations.map((issue, index) => `
                <div class="col-md-6">
                    <div class="card h-100 issue-card border-${issue.color}">
                        <div class="card-header bg-${issue.color} text-white d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-${issue.icon} me-2"></i>
                                <strong>${issue.title}</strong>
                            </div>
                            <span class="badge bg-light text-dark">${issue.severity.toUpperCase()}</span>
                        </div>
                        <div class="card-body">
                            <p class="card-text small mb-2">${issue.description}</p>
                            <div class="mb-2">
                                <strong>Root Cause:</strong>
                                <span class="small">${issue.rootCause}</span>
                            </div>
                            ${issue.recommendations && issue.recommendations.length > 0 ? `
                                <div class="mb-2">
                                    <strong>Recommended Actions:</strong>
                                    <ul class="small mb-0">
                                        ${issue.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <small class="text-muted">
                                    <i class="fas fa-ticket-alt me-1"></i>
                                    ${issue.affectedTickets} affected tickets
                                </small>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-sm btn-outline-${issue.color}" onclick="useIssueRecommendation('${issue.action.replace(/'/g, "\\'")}')">
                                        <i class="fas fa-plus me-1"></i>Use Action
                                    </button>
                                    <button class="btn btn-sm btn-${issue.color}" onclick="openSendResponseModal('${issue.title.replace(/'/g, "\\'")}', '${issue.action.replace(/'/g, "\\'")}')">
                                        <i class="fas fa-paper-plane me-1"></i>Send Response
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="mt-3">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                These recommendations are based on detected systemic issues in your support system.
            </small>
        </div>
    `;
    
    document.getElementById('chatMessages').appendChild(recommendationsDiv);
    
    // Scroll to recommendations
    recommendationsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Use issue recommendation
function useIssueRecommendation(action) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = action;
        chatInput.focus();
        // Trigger input event to update any listeners
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Remove the issue recommendations container
    const recommendationsContainer = document.querySelector('.issue-recommendations');
    if (recommendationsContainer) {
        recommendationsContainer.remove();
    }
    
    // Show escalation toast notification
    showNotification('Issue has been escalated to the appropriate team!', 'warning');
}

// Open modal for sending response to customer
function openSendResponseModal(issueTitle, suggestedAction) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal fade" id="sendResponseModal" tabindex="-1" aria-labelledby="sendResponseModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="sendResponseModalLabel">
                            <i class="fas fa-paper-plane me-2"></i>Send Response to Customer
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <h6><i class="fas fa-info-circle me-2"></i>Issue Context:</h6>
                            <p class="mb-1"><strong>Issue:</strong> ${issueTitle}</p>
                            <p class="mb-0"><strong>Suggested Action:</strong> ${suggestedAction}</p>
                        </div>
                        
                        <div class="mb-3">
                            <label for="customerResponse" class="form-label">
                                <i class="fas fa-comment me-1"></i>Your Response to Customer:
                            </label>
                            <textarea 
                                class="form-control" 
                                id="customerResponse" 
                                rows="4" 
                                placeholder="Type your response to the customer here..."
                                style="resize: vertical;"
                            ></textarea>
                            <div class="form-text">
                                <i class="fas fa-lightbulb me-1"></i>
                                This message will be sent as a response to the customer's inquiry.
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="responseType" class="form-label">
                                <i class="fas fa-tag me-1"></i>Response Type:
                            </label>
                            <select class="form-select" id="responseType">
                                <option value="resolution">Resolution/Action Taken</option>
                                <option value="investigation">Under Investigation</option>
                                <option value="escalation">Escalated to Team</option>
                                <option value="followup">Follow-up Required</option>
                                <option value="information">Information Request</option>
                            </select>
                        </div>
                        
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="addToChat" checked>
                            <label class="form-check-label" for="addToChat">
                                <i class="fas fa-comments me-1"></i>
                                Also add this response to the chat conversation
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancel
                        </button>
                        <button type="button" class="btn btn-primary" onclick="sendResponseToCustomer()">
                            <i class="fas fa-paper-plane me-1"></i>Send Response
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('sendResponseModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('sendResponseModal'));
    modal.show();
    
    // Focus on textarea
    setTimeout(() => {
        const textarea = document.getElementById('customerResponse');
        if (textarea) {
            textarea.focus();
        }
    }, 500);
}

// Send response to customer
function sendResponseToCustomer() {
    const responseText = document.getElementById('customerResponse').value.trim();
    const responseType = document.getElementById('responseType').value;
    const addToChat = document.getElementById('addToChat').checked;
    
    if (!responseText) {
        showNotification('Please enter a response message!', 'error');
        return;
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('sendResponseModal'));
    if (modal) {
        modal.hide();
    }
    
    // Add to chat if requested
    if (addToChat) {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = responseText;
            chatInput.focus();
            // Trigger input event to update any listeners
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    // Remove the issue recommendations container
    const recommendationsContainer = document.querySelector('.issue-recommendations');
    if (recommendationsContainer) {
        recommendationsContainer.remove();
    }
    
    // Show success notification
    const typeLabels = {
        'resolution': 'Resolution',
        'investigation': 'Investigation Update',
        'escalation': 'Escalation Notice',
        'followup': 'Follow-up Request',
        'information': 'Information Response'
    };
    
    showNotification(`${typeLabels[responseType]} sent to customer successfully!`, 'success');
    
    // Clean up modal after hiding
    setTimeout(() => {
        const modalElement = document.getElementById('sendResponseModal');
        if (modalElement) {
            modalElement.remove();
        }
    }, 500);
}

// Search knowledge base (AI section)
async function searchKnowledgeBase() {
    // Create a modal for knowledge base search
    const modalHtml = `
        <div class="modal fade" id="knowledgeSearchModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-search me-2"></i>Knowledge Base Search
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="knowledgeSearchInput" class="form-label">Search Query</label>
                            <input type="text" class="form-control" id="knowledgeSearchInput" 
                                   placeholder="Enter your search query..." autofocus>
                        </div>
                        <div id="knowledgeSearchResults" class="mt-3" style="display: none;">
                            <h6>Search Results:</h6>
                            <div id="knowledgeResultsContent"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="performKnowledgeSearch()">
                            <i class="fas fa-search me-1"></i>Search
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('knowledgeSearchModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    try {
        const modalElement = document.getElementById('knowledgeSearchModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            showNotification('Error creating search modal', 'error');
        }
    } catch (error) {
        console.error('Error showing modal:', error);
        showNotification('Error opening search interface', 'error');
    }
    
    // Focus on input and handle Enter key
    const searchInput = document.getElementById('knowledgeSearchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performKnowledgeSearch();
        }
    });
}

// Perform the actual knowledge base search
async function performKnowledgeSearch() {
    const query = document.getElementById('knowledgeSearchInput').value.trim();
    
    if (!query) {
        showNotification('Please enter a search query', 'warning');
        return;
    }
    
    const resultsDiv = document.getElementById('knowledgeSearchResults');
    const contentDiv = document.getElementById('knowledgeResultsContent');
    
    // Show loading state
    contentDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin me-2"></i>Searching...</div>';
    resultsDiv.style.display = 'block';
    
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
            displayKnowledgeSearchResults(data);
        } else {
            const errorText = await response.text();
            throw new Error(`Search failed: ${response.status} ${errorText}`);
        }
    } catch (error) {
        console.error('Error searching knowledge base:', error);
        contentDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error searching knowledge base: ${error.message}
            </div>
        `;
    }
}

// Display knowledge search results
function displayKnowledgeSearchResults(data) {
    const contentDiv = document.getElementById('knowledgeResultsContent');
    
    let html = '';
    
    if (data.suggestions) {
        html += `
            <div class="alert alert-info mb-3">
                <h6><i class="fas fa-lightbulb me-2"></i>AI Suggestions:</h6>
                <p class="mb-0">${data.suggestions}</p>
            </div>
        `;
    }
    
    if (data.articles && data.articles.length > 0) {
        html += '<h6><i class="fas fa-book me-2"></i>Relevant Articles:</h6>';
        html += '<div class="row g-3">';
        
        data.articles.forEach((article, index) => {
            html += `
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title">${article.title}</h6>
                            <p class="card-text text-muted small">
                                ${article.content.substring(0, 150)}...
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge bg-primary">${article.category}</span>
                                <button class="btn btn-sm btn-outline-primary" 
                                        onclick="useKnowledgeArticle('${article._id}', '${article.title.replace(/'/g, "\\'")}')">
                                    <i class="fas fa-plus me-1"></i>Use Article
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html += `
            <div class="alert alert-warning">
                <i class="fas fa-info-circle me-2"></i>
                No relevant articles found for your search query.
            </div>
        `;
    }
    
    contentDiv.innerHTML = html;
}

// Use knowledge article in chat
function useKnowledgeArticle(articleId, articleTitle) {
    // Add article reference to chat input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        const articleReference = `[Knowledge Base: ${articleTitle}] `;
        chatInput.value = articleReference + chatInput.value;
        chatInput.focus();
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('knowledgeSearchModal'));
    if (modal) {
        modal.hide();
    }
    
    showNotification('Article reference added to chat input!', 'success');
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
        // Load mock customer data
        loadMockCustomer();
        // Initialize analytics (since it's now open by default)
        loadConversationAnalytics();
        startAnalyticsAutoRefresh();
        // Initialize quick access sync
        setTimeout(syncQuickAccess, 100);
    }
};

// Sync quick access toolbar with detailed forms
function syncQuickAccess() {
    const quickCustomerName = document.getElementById('quickCustomerName');
    const quickIssueCategory = document.getElementById('quickIssueCategory');
    const customerName = document.getElementById('customerName');
    const issueCategory = document.getElementById('issueCategory');
    
    if (quickCustomerName && customerName) {
        quickCustomerName.addEventListener('input', () => {
            customerName.value = quickCustomerName.value;
        });
        customerName.addEventListener('input', () => {
            quickCustomerName.value = customerName.value;
        });
    }
    
    if (quickIssueCategory && issueCategory) {
        quickIssueCategory.addEventListener('change', () => {
            issueCategory.value = quickIssueCategory.value;
        });
        issueCategory.addEventListener('change', () => {
            quickIssueCategory.value = issueCategory.value;
        });
    }
}

// ==================== ISSUE DETECTION FUNCTIONS ====================

async function loadIssueDetection() {
    try {
        console.log('Loading issue detection data...');
        
        // Load health overview
        await loadHealthOverview();
        
        // Load category health
        await loadCategoryHealth();
        
        // Load issues list
        await loadIssuesList();
        
        // Load trend analysis
        await loadTrendAnalysis();
        
    } catch (error) {
        console.error('Error loading issue detection data:', error);
        showAlert('Error loading issue detection data', 'danger');
    }
}

async function loadHealthOverview() {
    try {
        const response = await fetch('/api/issue-detection/health');
        const data = await response.json();
        
        if (data.success) {
            const health = data.data;
            
            document.getElementById('totalIssues').textContent = health.totalIssues || 0;
            document.getElementById('criticalIssues').textContent = health.criticalIssues || 0;
            document.getElementById('highIssues').textContent = health.highIssues || 0;
            document.getElementById('systemHealth').textContent = health.overallHealth || 'Unknown';
            
            // Update system health color
            const healthElement = document.getElementById('systemHealth');
            const healthCard = healthElement.closest('.card');
            healthCard.className = 'card ' + getHealthColorClass(health.overallHealth);
        }
    } catch (error) {
        console.error('Error loading health overview:', error);
    }
}

function getHealthColorClass(health) {
    switch (health.toLowerCase()) {
        case 'excellent': return 'bg-success text-white';
        case 'good': return 'bg-success text-white';
        case 'poor': return 'bg-warning text-white';
        case 'critical': return 'bg-danger text-white';
        default: return 'bg-secondary text-white';
    }
}

async function loadCategoryHealth() {
    try {
        const response = await fetch('/api/issue-detection/analysis');
        const data = await response.json();
        
        if (data.success) {
            const analysis = data.data;
            const categoryHealthContainer = document.getElementById('categoryHealthChart');
            
            if (analysis.impactAnalysis) {
                let html = '';
                Object.entries(analysis.impactAnalysis).forEach(([category, impact]) => {
                    const healthClass = getHealthColorClass(impact.level);
                    const icon = getCategoryIcon(category);
                    
                    html += `
                        <div class="col-md-4 mb-3">
                            <div class="card ${healthClass}">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-1">${formatCategoryName(category)}</h6>
                                            <p class="mb-0 small">${impact.ticketCount} tickets</p>
                                        </div>
                                        <div class="text-center">
                                            <i class="${icon} fa-2x"></i>
                                            <div class="small">${impact.level}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                categoryHealthContainer.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error loading category health:', error);
    }
}

function getCategoryIcon(category) {
    const icons = {
        'inventory': 'fas fa-boxes',
        'logistics': 'fas fa-truck',
        'fulfillment': 'fas fa-warehouse',
        'payment': 'fas fa-credit-card',
        'quality': 'fas fa-award',
        'customer_service': 'fas fa-headset',
        'technology': 'fas fa-laptop-code'
    };
    return icons[category] || 'fas fa-question-circle';
}

function formatCategoryName(category) {
    return category.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

async function loadIssuesList() {
    try {
        const response = await fetch('/api/issue-detection/analysis');
        const data = await response.json();
        
        if (data.success) {
            issueAnalysisData = data.data;
            displayIssues(issueAnalysisData.issues || []);
        }
    } catch (error) {
        console.error('Error loading issues list:', error);
        document.getElementById('issuesList').innerHTML = `
            <div class="text-center py-4 text-danger">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <p>Error loading issues</p>
            </div>
        `;
    }
}

function displayIssues(issues) {
    const issuesList = document.getElementById('issuesList');
    
    if (issues.length === 0) {
        issuesList.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-check-circle fa-2x mb-2"></i>
                <p>No issues detected</p>
                <small>Your system is running smoothly!</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    issues.forEach(issue => {
        const severityClass = getSeverityClass(issue.severity);
        const severityIcon = getSeverityIcon(issue.severity);
        
        html += `
            <div class="card mb-3 issue-card" data-issue-id="${issue.id}" onclick="showIssueDetails('${issue.id}')">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title mb-1">${issue.title}</h6>
                            <p class="card-text text-muted small mb-2">${issue.description}</p>
                            <div class="d-flex gap-2 mb-2">
                                <span class="badge ${severityClass}">
                                    <i class="${severityIcon} me-1"></i>${issue.severity.toUpperCase()}
                                </span>
                                <span class="badge bg-secondary">${formatCategoryName(issue.category)}</span>
                                <span class="badge bg-info">${issue.ticketCount} tickets</span>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="text-muted small">
                                <i class="fas fa-users me-1"></i>${issue.affectedCustomers.length} customers
                            </div>
                            <div class="text-muted small">
                                <i class="fas fa-clock me-1"></i>${formatDate(issue.lastDetected)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    issuesList.innerHTML = html;
}

function getSeverityClass(severity) {
    const classes = {
        'critical': 'bg-danger',
        'high': 'bg-warning',
        'medium': 'bg-info',
        'low': 'bg-success'
    };
    return classes[severity] || 'bg-secondary';
}

function getSeverityIcon(severity) {
    const icons = {
        'critical': 'fas fa-fire',
        'high': 'fas fa-exclamation-triangle',
        'medium': 'fas fa-exclamation-circle',
        'low': 'fas fa-info-circle'
    };
    return icons[severity] || 'fas fa-question-circle';
}

function showIssueDetails(issueId) {
    if (!issueAnalysisData || !issueAnalysisData.issues) return;
    
    const issue = issueAnalysisData.issues.find(i => i.id === issueId);
    if (!issue) return;
    
    const issueDetails = document.getElementById('issueDetails');
    
    const html = `
        <div class="issue-details">
            <h6 class="mb-3">${issue.title}</h6>
            
            <div class="mb-3">
                <strong>Description:</strong>
                <p class="small text-muted">${issue.description}</p>
            </div>
            
            <div class="mb-3">
                <strong>Root Cause:</strong>
                <p class="small">${issue.rootCause}</p>
            </div>
            
            <div class="mb-3">
                <strong>Impact Analysis:</strong>
                <div class="progress mb-2" style="height: 8px;">
                    <div class="progress-bar ${getSeverityClass(issue.severity)}" 
                         style="width: ${issue.impact.score * 10}%"></div>
                </div>
                <div class="small text-muted mb-2">
                    <strong>Score: ${issue.impact.score.toFixed(1)}/10 (${issue.impact.level})</strong>
                </div>
                
                ${issue.impact.breakdown ? `
                <div class="small">
                    <div class="row g-1">
                        <div class="col-6">
                            <span class="badge bg-info">Volume: ${issue.impact.breakdown.volumeScore}</span>
                        </div>
                        <div class="col-6">
                            <span class="badge bg-warning">Priority: ${issue.impact.breakdown.priorityScore}</span>
                        </div>
                        <div class="col-6">
                            <span class="badge bg-danger">Sentiment: ${issue.impact.breakdown.sentimentScore}</span>
                        </div>
                        <div class="col-6">
                            <span class="badge bg-secondary">Time: ${issue.impact.breakdown.timeScore}</span>
                        </div>
                    </div>
                    <div class="mt-1">
                        <small class="text-muted">Tier Multiplier: ${issue.impact.breakdown.tierMultiplier}x</small>
                    </div>
                </div>
                ` : ''}
                
                <div class="mt-2">
                    <div class="small">
                        <strong>Ticket Breakdown:</strong><br>
                        <span class="text-danger">Urgent: ${issue.impact.urgentTickets || 0}</span> | 
                        <span class="text-warning">High: ${issue.impact.highTickets || 0}</span> | 
                        <span class="text-info">Medium: ${issue.impact.mediumTickets || 0}</span> | 
                        <span class="text-success">Low: ${issue.impact.lowTickets || 0}</span>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <strong>Affected Customers:</strong>
                <p class="small text-muted">${issue.affectedCustomers.length} customers</p>
            </div>
            
            <div class="mb-3">
                <strong>Recommendations:</strong>
                <ul class="small">
                    ${issue.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            
            <div class="mb-3">
                <strong>Evidence:</strong>
                <div class="small text-muted">
                    <p>Sample tickets: ${issue.evidence.ticketSamples.length}</p>
                    <p>Keywords: ${Object.keys(issue.evidence.keywordFrequency).length}</p>
                </div>
            </div>
        </div>
    `;
    
    issueDetails.innerHTML = html;
    
    // Update active issue card
    document.querySelectorAll('.issue-card').forEach(card => {
        card.classList.remove('border-primary');
    });
    document.querySelector(`[data-issue-id="${issueId}"]`).classList.add('border-primary');
}

function filterIssues(severity) {
    currentIssueFilter = severity;
    
    if (!issueAnalysisData || !issueAnalysisData.issues) return;
    
    let filteredIssues = issueAnalysisData.issues;
    
    if (severity !== 'all') {
        filteredIssues = issueAnalysisData.issues.filter(issue => issue.severity === severity);
    }
    
    displayIssues(filteredIssues);
    
    // Update filter buttons
    document.querySelectorAll('#issuesList').parentElement.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

async function loadTrendAnalysis() {
    try {
        const response = await fetch('/api/issue-detection/trends?days=30');
        const data = await response.json();
        
        if (data.success) {
            const trends = data.data;
            const trendContainer = document.getElementById('trendAnalysis');
            
            const html = `
                <div class="trend-analysis">
                    <h6 class="mb-3">Last 30 Days</h6>
                    <div class="mb-2">
                        <strong>Total Tickets:</strong> ${trends.summary.totalTickets}
                    </div>
                    <div class="mb-2">
                        <strong>Average per Day:</strong> ${trends.summary.averagePerDay}
                    </div>
                    <div class="mb-3">
                        <strong>Peak Day:</strong> ${formatDate(trends.summary.peakDay)}
                    </div>
                    
                    <div class="small text-muted">
                        <div>Trend: ${getTrendDirection(trends.trends)}</div>
                        <div>Last Updated: ${formatDate(new Date())}</div>
                    </div>
                </div>
            `;
            
            trendContainer.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading trend analysis:', error);
        document.getElementById('trendAnalysis').innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-exclamation-triangle"></i>
                <p class="small">Error loading trends</p>
            </div>
        `;
    }
}

function getTrendDirection(trends) {
    if (trends.length < 2) return 'Insufficient data';
    
    const firstWeek = trends.slice(0, 7).reduce((sum, day) => sum + day.total, 0);
    const lastWeek = trends.slice(-7).reduce((sum, day) => sum + day.total, 0);
    
    if (lastWeek > firstWeek * 1.2) return 'Increasing';
    if (lastWeek < firstWeek * 0.8) return 'Decreasing';
    return 'Stable';
}

async function runIssueAnalysis() {
    try {
        showAlert('Running issue analysis...', 'info');
        
        const response = await fetch('/api/issue-detection/analysis');
        const data = await response.json();
        
        if (data.success) {
            issueAnalysisData = data.data;
            await loadIssueDetection(); // Reload all data
            showAlert('Issue analysis completed successfully!', 'success');
        } else {
            showAlert('Error running analysis: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error running issue analysis:', error);
        showAlert('Error running issue analysis', 'danger');
    }
}

async function exportIssueData() {
    try {
        const response = await fetch('/api/issue-detection/export');
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'issue-analysis.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('Issue data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showAlert('Error exporting data', 'danger');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Show conversation starter suggestions
function showConversationStarters() {
    const conversationStarters = [
        "Hi, I'm having trouble with my order. Can you help me?",
        "I ordered something 3 days ago but haven't received any tracking info. What's going on?",
        "The item I received is completely different from what I ordered. This is ridiculous!",
        "I need to return this item but I can't find the return label. Can you help?",
        "My package says delivered but I never got it. Where is it?",
        "I want to cancel my order but it's already shipped. What can I do?",
        "The quality of this product is terrible. I want a refund immediately.",
        "I've been waiting for my order for over a week. This is unacceptable!",
        "Can you tell me when my order will arrive? I need it by Friday.",
        "I'm not happy with this purchase. How do I return it?"
    ];
    
    // Select 3 random conversation starters
    const selectedStarters = conversationStarters
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    
    const startersDiv = document.createElement('div');
    startersDiv.className = 'conversation-starters alert alert-info';
    startersDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">
                <i class="fas fa-lightbulb me-2"></i>Try these conversation starters:
            </h6>
            <button class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <div class="row g-2">
            ${selectedStarters.map((starter, index) => `
                <div class="col-md-4">
                    <button class="btn btn-outline-primary btn-sm w-100 starter-btn" onclick="useConversationStarter('${starter.replace(/'/g, "\\'")}')">
                        ${starter}
                    </button>
                </div>
            `).join('')}
        </div>
        <div class="mt-2">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Click any starter to begin the conversation
            </small>
        </div>
    `;
    
    document.getElementById('chatMessages').appendChild(startersDiv);
    startersDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function useConversationStarter(starter) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = starter;
        chatInput.focus();
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Remove conversation starters
    const startersContainer = document.querySelector('.conversation-starters');
    if (startersContainer) {
        startersContainer.remove();
    }
    
    showNotification('Conversation starter added!', 'success');
}


