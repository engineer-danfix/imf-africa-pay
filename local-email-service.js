const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables from local file
require('dotenv').config({ path: '.env.local' });

// Create Express app
const app = express();
app.use(express.json());

// Use the same port as your main application
const PORT = process.env.PORT || 3001;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/imf-africa-pay';

// Payment Schema (matching your existing schema with notification tracking)
const paymentSchema = new mongoose.Schema({
  name: String,
  email: String,
  amount: Number,
  serviceType: String,
  reference: String,
  receiptPath: String,
  timestamp: { type: Date, default: Date.now },
  // New field to track notification status
  notificationSent: { type: Boolean, default: false },
  notificationTimestamp: { type: Date, default: null }
});

const Payment = mongoose.model('Payment', paymentSchema);

// Email configuration (using your existing environment variables)
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Test email configuration
const testEmailConfig = async () => {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.log('Email configuration incomplete');
      return false;
    }
    
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.log('Email configuration error:', error.message);
    return false;
  }
};

// Function to send payment notification emails
const sendPaymentNotifications = async (payment) => {
  try {
    // Check if notification was already sent
    if (payment.notificationSent) {
      console.log(`Notification already sent for payment ${payment.reference} at ${payment.notificationTimestamp}`);
      return { success: true, message: 'Notification already sent previously' };
    }

    // Send confirmation to user
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"IMF Africa Pay" <no-reply@imfafrica.org>',
      to: payment.email,
      subject: 'Payment Receipt Confirmation',
      html: `
        <h2>Payment Receipt Received</h2>
        <p>Dear ${payment.name},</p>
        <p>Thank you for your payment. We have received your transfer receipt.</p>
        <p><strong>Payment Details:</strong></p>
        <ul>
          <li>Name: ${payment.name}</li>
          <li>Amount: $${payment.amount.toFixed(2)}</li>
          <li>Service: ${payment.serviceType}</li>
          <li>Reference: ${payment.reference}</li>
          <li>Date: ${payment.timestamp.toLocaleString()}</li>
        </ul>
        <p>We will process your payment shortly.</p>
        <p>Best regards,<br>IMF Africa Team</p>
      `,
      attachments: payment.receiptPath ? [{
        filename: path.basename(payment.receiptPath),
        path: payment.receiptPath
      }] : []
    });

    // Send notification to admin
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"IMF Africa Pay" <no-reply@imfafrica.org>',
      to: process.env.IMF_EMAIL || 'admin@imfafrica.org',
      subject: 'New Payment Receipt Submitted',
      html: `
        <h2>New Payment Receipt</h2>
        <p>A new payment receipt has been submitted:</p>
        <p><strong>Payment Details:</strong></p>
        <ul>
          <li>Name: ${payment.name}</li>
          <li>Email: ${payment.email}</li>
          <li>Amount: $${payment.amount.toFixed(2)}</li>
          <li>Service: ${payment.serviceType}</li>
          <li>Reference: ${payment.reference}</li>
          <li>Date: ${payment.timestamp.toLocaleString()}</li>
        </ul>
      `,
      attachments: payment.receiptPath ? [{
        filename: path.basename(payment.receiptPath),
        path: payment.receiptPath
      }] : []
    });

    // Update payment record to mark notification as sent
    await Payment.findByIdAndUpdate(payment._id, {
      notificationSent: true,
      notificationTimestamp: new Date()
    });

    console.log(`Email notifications sent for payment ${payment.reference}`);
    return { success: true, message: 'Email notifications sent successfully' };
  } catch (error) {
    console.error('Failed to send email notifications:', error.message);
    return { success: false, error: 'Failed to send email notifications' };
  }
};

// API Routes

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    // Check email configuration
    let emailStatus = 'Unknown';
    try {
      await transporter.verify();
      emailStatus = 'Valid';
    } catch (error) {
      emailStatus = 'Invalid';
    }
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: dbStatus,
      email: emailStatus
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// Get all payments (optionally filter by notification status)
app.get('/api/payments', async (req, res) => {
  try {
    const { notified } = req.query;
    let filter = {};
    
    if (notified === 'true') {
      filter.notificationSent = true;
    } else if (notified === 'false') {
      filter.notificationSent = false;
    }
    
    const payments = await Payment.find(filter).sort({ timestamp: -1 });
    res.json({ 
      success: true, 
      data: payments 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve payments' 
    });
  }
});

// Get a specific payment by ID
app.get('/api/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: payment 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve payment' 
    });
  }
});

// Send email notifications for a specific payment
app.post('/api/send-notifications/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found' 
      });
    }

    const result = await sendPaymentNotifications(payment);
    
    res.json({ 
      success: result.success,
      message: result.message,
      data: payment
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send notifications' 
    });
  }
});

// Send email notifications for all unpaid notifications
app.post('/api/send-pending-notifications', async (req, res) => {
  try {
    const payments = await Payment.find({ notificationSent: false });
    let successCount = 0;
    let failCount = 0;
    let alreadySentCount = 0;

    for (const payment of payments) {
      try {
        const result = await sendPaymentNotifications(payment);
        if (result.success) {
          if (result.message === 'Notification already sent previously') {
            alreadySentCount++;
          } else {
            successCount++;
          }
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    res.json({ 
      success: true, 
      message: `Processed ${payments.length} pending payments: ${successCount} sent, ${alreadySentCount} already sent, ${failCount} failed`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process payments' 
    });
  }
});

// Send test email
app.post('/api/test-email', async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    
    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, text'
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"IMF Africa Pay" <no-reply@imfafrica.org>',
      to,
      subject,
      text
    });

    res.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Test email configuration
    await testEmailConfig();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`IMF Africa Pay Local Email Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Get all payments: http://localhost:${PORT}/api/payments`);
      console.log(`Get pending payments: http://localhost:${PORT}/api/payments?notified=false`);
      console.log(`Send notifications for payment: POST http://localhost:${PORT}/api/send-notifications/:id`);
      console.log(`Send all pending notifications: POST http://localhost:${PORT}/api/send-pending-notifications`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
  }
};

startServer();

module.exports = app;