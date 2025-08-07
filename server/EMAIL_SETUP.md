# Email Notification Setup Guide

## Overview
The budget limit system now includes email notifications that are sent to users when they reach 90% or more of their spending limits.

## Required Environment Variables

Add these to your `.env` file in the server directory:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## Gmail Setup Instructions

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication if not already enabled

### 2. Generate App Password
- Go to Google Account → Security → 2-Step Verification
- Click "App passwords" at the bottom
- Select "Mail" and "Other (Custom name)"
- Name it "Personal Finance Tracker"
- Copy the generated 16-character password

### 3. Update Environment Variables
- Set `EMAIL_USER` to your Gmail address
- Set `EMAIL_PASSWORD` to the app password (not your regular password)

## How It Works

### Email Triggers
- **90% Warning**: Email sent when spending reaches 90% of limit
- **100% Critical**: Email sent when spending exceeds 100% of limit

### Duplicate Prevention
- Emails are only sent once per category per type (warning/critical) within 24 hours
- This prevents spam while ensuring users are notified

### Email Content
- Professional HTML email with your app's branding
- Shows spending details, progress bar, and dashboard link
- Different styling for warnings vs critical alerts

## Testing

### Test Email Endpoint
You can test the email system using the API endpoint:

```bash
curl -X POST http://localhost:5000/api/budget/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Manual Testing
1. Set a low budget limit (e.g., €10 for Food)
2. Add transactions that exceed 90% of the limit
3. Check your email for notifications

## Troubleshooting

### Common Issues
1. **"Invalid login" error**: Check your app password is correct
2. **"Less secure app" error**: Use app passwords, not regular passwords
3. **No emails received**: Check spam folder and email configuration

### Debug Logs
The system logs all email activities:
- ✅ Successful sends
- ❌ Failed sends
- 📧 Batch results

Check server console for detailed logs.
