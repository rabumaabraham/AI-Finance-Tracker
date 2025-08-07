# Gmail App Passwords Setup Guide

## Method 1: Direct Link (Try This First)
1. Go directly to: https://myaccount.google.com/apppasswords
2. If you see the App passwords page, follow the steps below
3. If you get an error, try Method 2

## Method 2: Through Security Settings
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **"Security"** in the left sidebar
3. Look for **"2-Step Verification"** and click on it
4. **Scroll down to the very bottom** of the page
5. Look for **"App passwords"** section
6. If you don't see it, try Method 3

## Method 3: Alternative Path
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **"Security"** in the left sidebar
3. Look for **"App passwords"** as a separate option (not under 2-Step Verification)
4. If you still don't see it, try Method 4

## Method 4: Search Method
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Use the search bar at the top and type: **"app passwords"**
3. Click on the result that says "App passwords"

## Method 5: If App Passwords Still Don't Appear

### Check Your Account Type:
- **Personal Gmail**: App passwords should be available
- **Google Workspace**: Your admin might need to enable it
- **School/Organization**: Contact your IT department

### Alternative: Use "Less Secure Apps"
If App passwords don't work:
1. Go to [myaccount.google.com](https://myaccount.google.com) → Security
2. Look for **"Less secure app access"**
3. Turn it **ON**
4. Use your regular Gmail password

## Once You Find App Passwords:
1. Click **"Select app"** → Choose **"Mail"**
2. Click **"Select device"** → Choose **"Other (Custom name)"**
3. Type **"Personal Finance Tracker"**
4. Click **"Generate"**
5. Copy the **16-character password** (looks like: `abcd efgh ijkl mnop`)

## Update Your .env File:
```env
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
FRONTEND_URL=http://localhost:3000
```

## Test the Setup:
After updating your .env file, restart the server and try setting a budget limit again.
