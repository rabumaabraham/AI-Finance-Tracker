# AI Finance Tracker

An intelligent personal finance management application with AI-powered insights, real-time bank connections, and smart budgeting tools.

## Features

- 🏦 **Bank Integration**: Connect multiple bank accounts via Nordigen API
- 📊 **Smart Analytics**: AI-powered transaction categorization and spending insights
- 💰 **Budget Management**: Set spending limits with email alerts
- 🤖 **AI Assistant**: Chat with AI for financial advice and insights
- 📱 **Responsive Design**: Modern, mobile-friendly interface
- 🔒 **Secure**: Bank-level encryption and JWT authentication

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap for responsive design
- Vanilla JS for functionality

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Nordigen API for bank integration
- OpenRouter API for AI features
- Stripe for payments
- Nodemailer for email notifications

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Nordigen API (for bank integration)
NORDIGEN_SECRET_ID=your_nordigen_secret_id
NORDIGEN_SECRET_KEY=your_nordigen_secret_key

# OpenRouter API (for AI features)
OPENROUTER_API_KEY=your_openrouter_api_key

# Email Configuration
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password

# Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Frontend URL
FRONTEND_URL=https://your-frontend-url.com

# Server
PORT=5000
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Finance-Tracker
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set up environment variables**
   - Copy the `.env` example above
   - Fill in your actual API keys and credentials

4. **Start the server**
   ```bash
   npm run dev
   ```

5. **Open the frontend**
   - Open `client/index.html` in your browser
   - Or deploy the client to a hosting service

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Bank Integration
- `GET /api/nordigen/banks` - Get available banks
- `POST /api/nordigen/connect` - Connect bank account
- `GET /api/nordigen/transactions/:requisitionId` - Fetch transactions

### Analytics
- `GET /api/analytics/combined` - Get combined analytics
- `GET /api/analytics/bank/:bankAccountId` - Get bank-specific analytics

### Budget Management
- `GET /api/budgets` - Get user budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### AI Chat
- `POST /api/ai-chat` - Send message to AI assistant

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `None` (static site)
3. Set output directory: `client`
4. Deploy

### Backend (Railway/Heroku)
1. Connect your GitHub repository
2. Set environment variables
3. Set start command: `npm start`
4. Deploy

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Rate limiting on API endpoints
- Secure bank data handling via Nordigen

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email iamrabuma@gmail.com or create an issue in the repository.
