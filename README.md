# AI Finance Tracker

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![version](https://img.shields.io/badge/version-1.0-blue)

AI Finance Tracker is a personal finance management application that combines modern web technologies with AI to provide intelligent insights, automated transaction categorization, and real-time banking integration.

## Table of Contents
1. [Features](#features)
2. [Live Demo](#live-demo)
3. [Tech Stack](#tech-stack)
4. [Installation](#Installation)
5. [API Reference](#api-reference)
6. [Deployment](#deployment)
7. [Contribution](#Contributing)
8. [License](#license)

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

| Component | Technology |
|-----------|------------|
| **Frontend** | HTML5, CSS3, JavaScript, Bootstrap |
| **Backend** | Node.js, Express.js, MongoDB |
| **AI** | OpenRouter API |
| **Banking** | Nordigen API |
| **Payments** | Stripe |
| **Deployment** | Vercel + Render |

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get user profile |
| GET | `/api/nordigen/connect-bank` | Connect bank account |
| GET | `/api/nordigen/connected-banks` | Get connected accounts |
| GET | `/api/nordigen/transactions/:id` | Get transactions |
| GET | `/api/analytics/combined` | Get financial overview |
| GET | `/api/analytics/bank/:id` | Get bank analytics |
| GET | `/api/budgets` | Get user budgets |
| POST | `/api/budgets` | Create budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| POST | `/api/ai-chat` | Send message to AI |

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

## Contributing

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
