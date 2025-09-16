# AI Finance Tracker

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![version](https://img.shields.io/badge/version-1.0-blue)

AI Finance Tracker is a full-stack personal finance management app that helps users take control of their finances with intelligent automation and secure integrations. It connects to European banks through Nordigen, automatically fetches transactions, and uses AI to categorize spending in real time. Users can set budgets, receive instant alerts, and analyze top spending categories through clear visual reports. The built-in AI assistant offers personalized financial guidance, while premium features and billing are managed securely via Stripe. Access is fully protected with JWT authentication and password hashing, ensuring both functionality and security.


## Table of Contents
1. [Features](#features)
2. [Live Demo](#live-demo)
3. [Tech Stack](#tech-stack)
4. [Installation](#Installation)
5. [API Reference](#api-reference)


## Features

- **Bank Integration** - Connect European banks via Nordigen API
- **AI Assistant** - Chat with AI for financial advice using OpenRouter
- **Budget Management** - Set spending limits with email alerts
- **Analytics** - Visual spending insights and transaction categorization
- **Stripe Subscriptions** – Manage premium features and billing
- **Secure** - JWT authentication with password hashing
  

##  Live Demo

- Frontend: [click here](https://finance-tracker-six-iota.vercel.app)
- Backend: [click here](https://finance-tracker-tlss.onrender.com)
  

## Tech Stack

### Frontend
- **HTML5** - Semantic markup and modern web standards
- **CSS3** - Responsive design with Bootstrap framework
- **Vanilla JavaScript** - Interactive user interface and API integration
- **Bootstrap** - Mobile-first responsive design system

### Backend
- **Node.js** - JavaScript runtime for server-side development
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database for flexible data storage
- **JWT** - Secure authentication and authorization

### External Services
- **OpenRouter API** - AI-powered financial insights and chat functionality
- **Nordigen API** - European banking integration and transaction data
- **Stripe** - Payment processing and subscription management
- **Gmail SMTP** - Email notifications and alerts
  

## Installation

```bash
# Clone repository
git clone https://github.com/rabumaabraham/AI-Finance-Tracker.git
cd AI-Finance-Tracker

# Install dependencies
cd server && npm install

# Setup environment
cp env.example .env
# Add your API keys to .env

# Start server
npm run dev
```

**Required API Keys:**
- MongoDB Atlas (database)
- Nordigen API (banking)
- OpenRouter API (AI features)
- Stripe (payments)
- Gmail SMTP (notifications)
  

## API Reference

**Base URL:** `https://finance-tracker-tlss.onrender.com`

### Authentication Endpoints
- **POST** `/api/auth/signup` - Register a new user account
- **POST** `/api/auth/login` - Authenticate user and return JWT token
- **GET** `/api/auth/me` - Get current user profile information

### Banking Integration
- **GET** `/api/nordigen/connect-bank` - Initiate bank account connection process
- **GET** `/api/nordigen/connected-banks` - Retrieve all connected bank accounts
- **GET** `/api/nordigen/transactions/:id` - Fetch transactions for specific bank account

### Analytics & Insights
- **GET** `/api/analytics/combined` - Get comprehensive financial overview
- **GET** `/api/analytics/bank/:id` - Retrieve analytics for specific bank account

### Budget Management
- **GET** `/api/budgets` - Fetch all user budgets
- **POST** `/api/budgets` - Create a new budget with spending limits
- **DELETE** `/api/budgets/:id` - Remove a specific budget

### AI Assistant
- **POST** `/api/ai-chat` - Send message to AI for financial advice and insights
  

## Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set output directory: `client`
3. Deploy

### Backend (Render)
1. Connect GitHub repo to Render
2. Add environment variables
3. Set start command: `npm start`
4. Deploy


## Contribution

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/example-feature`
3. Commit your changes: `git commit -m 'Add example feature'`
4. Push to the branch: `git push origin feature/example-feature`
5. Open a Pull Request
   

## License

MIT License - see [LICENSE](LICENSE) file for details.


## Support

- **Email:** iamrabuma@gmail.com
- **Issues:** [GitHub Issues](https://github.com/rabumaabraham/AI-Finance-Tracker/issues)