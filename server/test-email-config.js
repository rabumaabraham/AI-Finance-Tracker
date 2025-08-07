import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Email Configuration Test');
console.log('==========================');

// Check if environment variables are loaded
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? '✅ Set' : '❌ Missing');

// Show first few characters of password (for security)
if (process.env.EMAIL_PASSWORD) {
    const password = process.env.EMAIL_PASSWORD;
    console.log('Password length:', password.length);
    console.log('Password starts with:', password.substring(0, 4) + '...');
} else {
    console.log('❌ EMAIL_PASSWORD is not set in .env file');
}

console.log('\n📝 Make sure your .env file contains:');
console.log('EMAIL_USER=your_gmail@gmail.com');
console.log('EMAIL_PASSWORD=your_16_character_app_password');
console.log('FRONTEND_URL=http://localhost:3000');
