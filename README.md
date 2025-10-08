# E-commerce Customer Support Tool

A comprehensive GPT-powered customer support tool for e-commerce platforms built with Node.js, Express, MongoDB, and integrated with Mistral AI for intelligent responses.

## Features

### 🎫 Unified Ticketing System
- Centralized dashboard for all customer inquiries
- Real-time ticket updates with Socket.io
- Advanced filtering and search capabilities
- Priority-based ticket management
- Automated ticket assignment

### 🛒 E-commerce Platform Integration
- Deep integration with customer order history
- Real-time shopping cart information
- Shipping and tracking details
- Customer tier and loyalty points management
- Order status tracking

### 📚 Self-Service Portal
- Comprehensive knowledge base with search
- FAQ management system
- Article categorization and tagging
- Helpfulness rating system
- AI-powered article suggestions

### 🤖 Automation Workflows
- Rule-based ticket routing
- Automated responses for common questions
- Priority escalation rules
- Customizable automation triggers
- Performance analytics

### 👥 Customer Relationship Management (CRM)
- Unified customer profiles
- Complete conversation history
- Purchase history and analytics
- Customer tier management
- Contact information management

### 🧠 AI-Powered Features
- Mistral AI integration for intelligent responses
- Sentiment analysis for ticket prioritization
- Auto-categorization of tickets
- Knowledge base suggestions
- Response generation assistance

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Bootstrap 5
- **Real-time**: Socket.io
- **AI Integration**: Mistral AI API
- **Authentication**: JWT tokens

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-support-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ecommerce_support
   JWT_SECRET=your_jwt_secret_key_here
   PORT=3000
   MISTRAL_API_URL=https://api.mistral.ai/v1/chat/completions
   MISTRAL_MODEL=mistral-7b-instruct
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed sample data (optional)**
   ```bash
   node scripts/seedData.js
   ```

6. **Start the application**
   ```bash
   npm start
   ```

7. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Default Login Credentials

After seeding the data, you can use these credentials:

- **Admin**: admin@example.com / password123
- **Agent 1**: john@example.com / password123
- **Agent 2**: sarah@example.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Tickets
- `GET /api/tickets` - Get all tickets with filtering
- `GET /api/tickets/:id` - Get specific ticket
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/messages` - Add message to ticket
- `GET /api/tickets/stats/overview` - Get ticket statistics

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get specific customer
- `POST /api/customers` - Create/update customer
- `PUT /api/customers/:id` - Update customer
- `POST /api/customers/:id/orders` - Add order to customer
- `POST /api/customers/:id/cart` - Add item to cart
- `GET /api/customers/:id/analytics` - Get customer analytics

### Knowledge Base
- `GET /api/knowledge` - Get all articles
- `GET /api/knowledge/:id` - Get specific article
- `POST /api/knowledge` - Create new article
- `PUT /api/knowledge/:id` - Update article
- `DELETE /api/knowledge/:id` - Delete article
- `POST /api/knowledge/search` - Search articles with AI
- `POST /api/knowledge/:id/rate` - Rate article helpfulness

### Automation
- `GET /api/automation` - Get all automation rules
- `POST /api/automation` - Create new rule
- `PUT /api/automation/:id` - Update rule
- `DELETE /api/automation/:id` - Delete rule
- `PATCH /api/automation/:id/toggle` - Toggle rule status
- `POST /api/automation/:id/test` - Test rule
- `POST /api/automation/execute/:ticketId` - Execute rules for ticket

### AI Services
- `POST /api/ai/generate-response` - Generate AI response
- `POST /api/ai/analyze-sentiment` - Analyze ticket sentiment
- `POST /api/ai/suggest-articles` - Get AI article suggestions
- `POST /api/ai/canned-response` - Generate canned response
- `POST /api/ai/categorize-ticket` - Auto-categorize ticket
- `POST /api/ai/summarize-ticket` - Generate ticket summary
- `POST /api/ai/response-suggestions` - Get response suggestions

## Project Structure

```
ecommerce-support-tool/
├── config/
│   └── database.js          # Database configuration
├── models/
│   ├── User.js              # User model
│   ├── Customer.js          # Customer model
│   ├── Ticket.js            # Ticket model
│   ├── KnowledgeBase.js     # Knowledge base model
│   └── AutomationRule.js    # Automation rule model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── tickets.js           # Ticket management routes
│   ├── customers.js         # Customer management routes
│   ├── knowledge.js         # Knowledge base routes
│   ├── automation.js        # Automation routes
│   └── ai.js                # AI service routes
├── services/
│   └── aiService.js         # Mistral AI integration
├── scripts/
│   └── seedData.js          # Sample data seeder
├── public/
│   ├── index.html           # Main application interface
│   ├── styles.css           # Custom styles
│   └── app.js               # Frontend JavaScript
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Key Features Implementation

### Mistral AI Integration
The application integrates with Mistral AI for intelligent responses without requiring API keys. The AI service includes:
- Fallback responses when API is unavailable
- Context-aware response generation
- Sentiment analysis
- Knowledge base suggestions
- Auto-categorization

### Real-time Updates
Socket.io integration provides real-time updates for:
- New ticket creation
- Ticket status changes
- New messages in tickets
- Live dashboard updates

### Responsive Design
The frontend is fully responsive and includes:
- Mobile-friendly interface
- Dark mode support
- Modern UI with Bootstrap 5
- Interactive components

## Customization

### Adding New Ticket Categories
1. Update the category enum in `models/Ticket.js`
2. Add options to the frontend form in `public/index.html`
3. Update filtering logic in `public/app.js`

### Creating Custom Automation Rules
1. Define conditions using the available operators
2. Specify actions to be taken
3. Set priority levels for rule execution order

### Extending AI Capabilities
1. Modify `services/aiService.js` to add new AI functions
2. Create corresponding API endpoints in `routes/ai.js`
3. Update frontend to use new AI features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
