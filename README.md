# AI-Powered Personal Finance Tracker

A modern web application for tracking personal finances with AI-powered insights and bank account integration.

## Features

- 🔐 **User Authentication**: Secure login and signup system
- 💳 **Bank Integration**: Connect multiple bank accounts via Nordigen API
- 📊 **Financial Dashboard**: Comprehensive overview of your finances
- 🤖 **AI Insights**: AI-powered financial analysis and recommendations
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful, intuitive interface built with Bootstrap

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 5 for responsive design
- LineIcons for beautiful icons

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- Nordigen API for bank integration

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Nordigen API credentials (optional, for bank integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Powered-Personal-Finance-Tracker
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `server` directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NORDIGEN_SECRET_ID=your_nordigen_secret_id
   NORDIGEN_SECRET_KEY=your_nordigen_secret_key
   ```

4. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   The server will run on `http://localhost:5000`

5. **Open the frontend**
   - Navigate to the `client` directory
   - Open `index.html` in your web browser
   - Or serve it using a local server:
     ```bash
     cd client
     npx http-server -p 3000
     ```

## Usage

### Authentication
1. **Sign Up**: Create a new account with your email and password
2. **Login**: Use your credentials to access the dashboard
3. **Logout**: Click the logout button in the dashboard sidebar

### Dashboard Features
- **Overview**: Get a quick summary of your financial status
- **Bank Integration**: Connect your bank accounts for automatic transaction import
- **AI Insights**: Receive personalized financial recommendations
- **Analytics**: View detailed spending patterns and trends

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user

### Bank Integration (Nordigen)
- `GET /api/bank/accounts` - Get connected bank accounts
- `GET /api/bank/transactions` - Get transaction history

## Project Structure

```
AI-Powered Personal Finance Tracker/
├── client/                 # Frontend files
│   ├── assets/            # CSS, JS, images
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── signup.html        # Signup page
│   └── dashboard.html     # Main dashboard
├── server/                # Backend files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # External API services
│   └── index.js          # Server entry point
└── README.md
```

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Input validation and sanitization
- CORS protection
- Secure HTTP headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
