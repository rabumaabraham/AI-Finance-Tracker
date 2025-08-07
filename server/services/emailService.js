import nodemailer from 'nodemailer';
import User from '../models/user.js';
import EmailNotification from '../models/emailNotification.js';

// Create transporter for Gmail SMTP
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        // Add these options for better compatibility
        secure: false,
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Email templates
const createBudgetAlertEmail = (userName, category, spent, limit, percentage) => {
    const isExceeded = percentage >= 100;
    const subject = isExceeded 
        ? `🚨 Budget Limit Exceeded: ${category}` 
        : `⚠️ Budget Limit Warning: ${category}`;
    
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
                        <h1>💰 Personal Finance Tracker</h1>
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
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">
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

// Send budget alert email
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

        // Create email content
        const emailContent = createBudgetAlertEmail(user.name, category, spent, limit, percentage);
        
        // Create transporter
        const transporter = createTransporter();
        
        // Send email
        const mailOptions = {
            from: `"Personal Finance Tracker" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const result = await transporter.sendMail(mailOptions);
        
        // Record the notification
        await EmailNotification.recordNotification(userId, category, percentage, type);
        
        console.log(`✅ Budget alert email sent to ${user.email} for ${category}: ${percentage.toFixed(0)}% (${type})`);
        return true;
        
    } catch (error) {
        console.error('❌ Error sending budget alert email:', error);
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
