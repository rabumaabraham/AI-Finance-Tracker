import { Resend } from 'resend';
import User from '../models/user.js';
import EmailNotification from '../models/emailNotification.js';

// Create Resend client
const createResendClient = () => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY environment variable is required');
    }
    
    return new Resend(process.env.RESEND_API_KEY);
};

// Email templates
const createBudgetAlertEmail = (userName, category, spent, limit, percentage) => {
    const isExceeded = percentage >= 100;
    const subject = isExceeded 
        ? `Budget Limit Exceeded: ${category}` 
        : `Budget Limit Warning: ${category}`;
    
    const statusText = isExceeded ? 'EXCEEDED' : 'WARNING';
    const color = isExceeded ? '#dc3545' : '#ffc107';
    
    return {
        subject,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Budget Alert</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #3056d3 0%, #3056d3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .alert-box { background: white; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .status { font-size: 24px; font-weight: bold; color: ${color}; margin-bottom: 10px; }
                    .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .progress-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin: 15px 0; }
                    .progress-fill { background: ${color}; height: 100%; transition: width 0.3s ease; }
                    .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
                    .btn { display: inline-block; background: #3056d3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Personal Finance Tracker</h1>
                        <p>Budget Alert Notification</p>
                    </div>
                    
                    <div class="content">
                        <h2>Hello ${userName},</h2>
                        
                        <div class="alert-box">
                            <div class="status">${statusText}</div>
                            <p>Your <strong>${category}</strong> spending has reached <strong>${percentage.toFixed(0)}%</strong> of your monthly limit.</p>
                            
                            <div class="details">
                                <p><strong>Category:</strong> ${category}</p>
                                <p><strong>Amount Spent:</strong> €${spent.toFixed(2)}</p>
                                <p><strong>Monthly Limit:</strong> €${limit.toFixed(2)}</p>
                                <p><strong>Remaining:</strong> €${(limit - spent).toFixed(2)}</p>
                            </div>
                            
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            
                            <p style="text-align: center; margin-top: 15px;">
                                <strong>${percentage.toFixed(0)}% of limit used</strong>
                            </p>
                        </div>
                        
                        <p>${isExceeded 
                            ? 'You have exceeded your spending limit for this category. Consider reviewing your expenses and adjusting your budget if needed.'
                            : 'You are approaching your spending limit. Consider monitoring your expenses more closely.'
                        }</p>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'https://finance-tracker-six-iota.vercel.app'}/dashboard.html" class="btn">
                                View Dashboard
                            </a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated notification from your Personal Finance Tracker.</p>
                        <p>You can manage your budget limits in your dashboard.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

// Welcome email template for new user signups
const createWelcomeEmail = (userName, email) => {
    return {
        subject: 'Welcome to AI Finance Tracker - Your Account is Ready',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to AI Finance Tracker</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0; 
                        padding: 0; 
                        background-color: #f8f9fa; 
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background: white; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                        border-radius: 8px; 
                        overflow: hidden; 
                    }
                    .header { 
                        background: #3056d3; 
                        color: white; 
                        padding: 30px; 
                        text-align: center; 
                    }
                    .header h1 { 
                        margin: 0; 
                        font-size: 1.8rem; 
                    }
                    .content { 
                        padding: 30px; 
                    }
                    .welcome-message { 
                        text-align: center; 
                        margin-bottom: 25px; 
                    }
                    .welcome-message h2 { 
                        color: #3056d3; 
                        margin-bottom: 15px; 
                    }
                    .cta-section { 
                        text-align: center; 
                        margin: 25px 0; 
                    }
                    .cta-button { 
                        display: inline-block; 
                        background: #3056d3; 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: 600; 
                    }
                    .footer { 
                        background: #f8f9fa; 
                        padding: 20px; 
                        text-align: center; 
                        color: #666; 
                        font-size: 0.9rem; 
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to AI Finance Tracker</h1>
                    </div>
                    
                    <div class="content">
                        <div class="welcome-message">
                            <h2>Hello ${userName},</h2>
                            <p>Thank you for joining AI Finance Tracker! Your account is ready.</p>
                        </div>
                        
                        <div class="cta-section">
                            <a href="${process.env.FRONTEND_URL || 'https://finance-tracker-six-iota.vercel.app'}/dashboard.html" class="cta-button">
                                Go to Dashboard
                            </a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>© 2024 AI Finance Tracker</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

// Send budget alert email using Resend
export const sendBudgetAlertEmail = async (userId, category, spent, limit, percentage) => {
    try {
        // Get user details
        const user = await User.findById(userId);
        if (!user || !user.email) {
            console.error('User not found or no email:', userId);
            return false;
        }

        // Determine notification type
        const type = percentage >= 100 ? 'critical' : 'warning';
        
        // Check if we should send email (only for 90%+ and not sent recently)
        const shouldSendEmail = percentage >= 90;
        if (!shouldSendEmail) {
            console.log(`Email not sent for ${category}: ${percentage.toFixed(0)}% < 90% threshold`);
            return false;
        }

        // Check if notification was recently sent (within 24 hours)
        const wasRecentlySent = await EmailNotification.wasRecentlySent(userId, category, type, 24);
        if (wasRecentlySent) {
            console.log(`Email not sent for ${category}: notification recently sent for ${type} type`);
            return false;
        }

        console.log(`📧 Attempting to send budget alert to ${user.email} for ${category}`);

        // Create email content
        const emailContent = createBudgetAlertEmail(user.name, category, spent, limit, percentage);
        
        // Create Resend client
        const resend = createResendClient();
        
        // Send email using Resend
        console.log('📤 Sending budget alert via Resend API...');
        const result = await resend.emails.send({
            from: 'AI Finance Tracker <noreply@seenoai.com>', // Use your verified domain
            to: [user.email],
            subject: emailContent.subject,
            html: emailContent.html
        });
        
        console.log('📧 Resend API response:', JSON.stringify(result, null, 2));
        
        if (result.error) {
            throw new Error(`Resend API error: ${result.error.message || result.error}`);
        }
        
        if (!result.data || !result.data.id) {
            throw new Error('Resend API returned no email ID - email may not have been sent');
        }
        
        // Record the notification
        await EmailNotification.recordNotification(userId, category, percentage, type);
        
        console.log(`✅ Budget alert email sent to ${user.email} for ${category}: ${percentage.toFixed(0)}% (${type})`);
        console.log(`📧 Resend email ID: ${result.data.id}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error sending budget alert email:', error.message || error);
        
        // Log additional context for debugging
        console.error('📋 Budget alert context:', {
            userId,
            category,
            percentage,
            environment: process.env.NODE_ENV,
            platform: process.env.RENDER ? 'Render' : 'Unknown',
            timestamp: new Date().toISOString()
        });
        
        return false;
    }
};

// Send welcome email using Resend
export const sendWelcomeEmail = async (userName, email) => {
    try {
        console.log(`📧 Attempting to send welcome email to ${email}`);
        console.log('🔧 Using Resend API (not SMTP)');
        console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');

        // Create email content
        const emailContent = createWelcomeEmail(userName, email);
        
        // Create Resend client
        const resend = createResendClient();
        
        // Send email using Resend
        console.log('📤 Sending email via Resend API...');
        const result = await resend.emails.send({
            from: 'AI Finance Tracker <noreply@seenoai.com>', // Use your verified domain
            to: [email],
            subject: emailContent.subject,
            html: emailContent.html
        });
        
        console.log('📧 Resend API response:', JSON.stringify(result, null, 2));
        
        if (result.error) {
            throw new Error(`Resend API error: ${result.error.message || result.error}`);
        }
        
        if (!result.data || !result.data.id) {
            throw new Error('Resend API returned no email ID - email may not have been sent');
        }
        
        console.log(`✅ Welcome email sent successfully to ${email}`);
        console.log(`📧 Resend email ID: ${result.data.id}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error sending welcome email:', error.message || error);
        
        // Log additional context for debugging
        console.error('📋 Email context:', {
            email,
            userName,
            environment: process.env.NODE_ENV,
            platform: process.env.RENDER ? 'Render' : 'Unknown',
            timestamp: new Date().toISOString()
        });
        
        return false;
    }
};

// Send multiple budget alerts
export const sendBudgetAlerts = async (alerts) => {
    const emailPromises = alerts.map(alert => 
        sendBudgetAlertEmail(
            alert.budget.userId, 
            alert.budget.category, 
            alert.spent, 
            alert.budget.limit, 
            alert.percentage
        )
    );
    
    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - successful;
    
    console.log(`📧 Budget alert emails: ${successful} sent, ${failed} failed`);
    return { successful, failed };
};