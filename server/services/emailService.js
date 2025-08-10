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
        subject: '🎉 Welcome to AI Finance Tracker - Your Account is Ready!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to AI Finance Tracker</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
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
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                        border-radius: 16px; 
                        overflow: hidden; 
                    }
                    .header { 
                        background: linear-gradient(135deg, #3056d3 0%, #4f46e5 100%); 
                        color: white; 
                        padding: 40px 30px; 
                        text-align: center; 
                    }
                    .header h1 { 
                        margin: 0; 
                        font-size: 2.2rem; 
                        font-weight: 700; 
                        letter-spacing: -0.025em; 
                    }
                    .header p { 
                        margin: 10px 0 0; 
                        font-size: 1.1rem; 
                        opacity: 0.9; 
                    }
                    .content { 
                        padding: 40px 30px; 
                        background: white; 
                    }
                    .welcome-message { 
                        text-align: center; 
                        margin-bottom: 30px; 
                    }
                    .welcome-message h2 { 
                        color: #3056d3; 
                        margin-bottom: 15px; 
                        font-size: 1.8rem; 
                    }
                    .welcome-message p { 
                        font-size: 1.1rem; 
                        color: #666; 
                        margin-bottom: 20px; 
                    }
                    .features { 
                        background: #f8f9fa; 
                        padding: 25px; 
                        border-radius: 12px; 
                        margin: 25px 0; 
                    }
                    .features h3 { 
                        color: #3056d3; 
                        margin-bottom: 20px; 
                        text-align: center; 
                        font-size: 1.3rem; 
                    }
                    .feature-grid { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 20px; 
                    }
                    .feature-item { 
                        display: flex; 
                        align-items: center; 
                        gap: 12px; 
                        padding: 15px; 
                        background: white; 
                        border-radius: 8px; 
                        border-left: 4px solid #3056d3; 
                    }
                    .feature-icon { 
                        width: 40px; 
                        height: 40px; 
                        background: #3056d3; 
                        border-radius: 50%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        color: white; 
                        font-size: 1.2rem; 
                    }
                    .feature-text { 
                        font-weight: 600; 
                        color: #333; 
                    }
                    .cta-section { 
                        text-align: center; 
                        margin: 35px 0; 
                    }
                    .cta-button { 
                        display: inline-block; 
                        background: linear-gradient(135deg, #3056d3 0%, #4f46e5 100%); 
                        color: white; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 12px; 
                        font-weight: 700; 
                        font-size: 1.1rem; 
                        box-shadow: 0 8px 25px rgba(48, 86, 211, 0.3); 
                        transition: all 0.3s ease; 
                    }
                    .cta-button:hover { 
                        transform: translateY(-2px); 
                        box-shadow: 0 12px 35px rgba(48, 86, 211, 0.4); 
                    }
                    .footer { 
                        background: #f8f9fa; 
                        padding: 25px 30px; 
                        text-align: center; 
                        color: #666; 
                        font-size: 0.9rem; 
                    }
                    .footer a { 
                        color: #3056d3; 
                        text-decoration: none; 
                    }
                    .footer a:hover { 
                        text-decoration: underline; 
                    }
                    .security-note { 
                        background: #e8f5e9; 
                        border: 1px solid #c8e6c9; 
                        padding: 15px; 
                        border-radius: 8px; 
                        margin: 20px 0; 
                        text-align: center; 
                    }
                    .security-note p { 
                        margin: 0; 
                        color: #2e7d32; 
                        font-weight: 600; 
                    }
                    @media (max-width: 600px) {
                        .feature-grid { 
                            grid-template-columns: 1fr; 
                        }
                        .header h1 { 
                            font-size: 1.8rem; 
                        }
                        .content { 
                            padding: 25px 20px; 
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to AI Finance Tracker!</h1>
                        <p>Your personal finance management journey starts now</p>
                    </div>
                    
                    <div class="content">
                        <div class="welcome-message">
                            <h2>Hello ${userName}! 👋</h2>
                            <p>Thank you for joining AI Finance Tracker! We're excited to help you take control of your finances with intelligent insights and powerful tools.</p>
                        </div>
                        
                        <div class="features">
                            <h3>🚀 What You Can Do Now</h3>
                            <div class="feature-grid">
                                <div class="feature-item">
                                    <div class="feature-icon">🏦</div>
                                    <div class="feature-text">Connect Bank Accounts</div>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">📊</div>
                                    <div class="feature-text">Track Spending Analytics</div>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">💰</div>
                                    <div class="feature-text">Set Budget Limits</div>
                                </div>
                                <div class="feature-item">
                                    <div class="feature-icon">🤖</div>
                                    <div class="feature-text">Chat with AI Assistant</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="security-note">
                            <p>🔒 Your account is secure and your data is protected with industry-standard encryption.</p>
                        </div>
                        
                        <div class="cta-section">
                            <a href="${process.env.FRONTEND_URL || 'https://finance-tracker-six-iota.vercel.app'}/dashboard.html" class="cta-button">
                                Get Started with Dashboard
                            </a>
                        </div>
                        
                        <p style="text-align: center; color: #666; margin-top: 25px;">
                            If you have any questions, our support team is here to help!
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2024 AI Finance Tracker. All rights reserved.</p>
                        <p>This email was sent to <strong>${email}</strong> because you signed up for our service.</p>
                        <p>If you didn't create this account, please <a href="mailto:support@aifinancetracker.com">contact us immediately</a>.</p>
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

// Send welcome email for new user signups
export const sendWelcomeEmail = async (userName, email) => {
    try {
        // Create email content
        const emailContent = createWelcomeEmail(userName, email);
        
        // Create transporter
        const transporter = createTransporter();
        
        // Send email
        const mailOptions = {
            from: `"AI Finance Tracker" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const result = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Welcome email sent successfully to ${email}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        return false;
    }
};
