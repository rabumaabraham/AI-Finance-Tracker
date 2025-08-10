import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'rabumaabraham2@gmail.com',
      pass: process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Send contact form email
export const sendContactEmail = async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    // Validate required fields
    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and message are required'
      });
    }

    // Create transporter
    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'rabumaabraham2@gmail.com',
      to: 'rabumaabraham2@gmail.com', // Your email where you'll receive contact form submissions
      subject: `New Contact Form Submission - ${fullName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><em>This message was sent from your AI Finance Tracker contact form.</em></p>
        <p><em>Timestamp: ${new Date().toLocaleString()}</em></p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Contact form submitted successfully! We\'ll get back to you soon.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending contact form. Please try again later.'
    });
  }
};
