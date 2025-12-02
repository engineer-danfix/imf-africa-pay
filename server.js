const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/imf-africa-pay';

// In-memory storage for payments when MongoDB is not available
let inMemoryPayments = [];
let PaymentModel = null;

// Try to connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB Atlas');
  
  // Define Payment Schema only after successful connection
  const paymentSchema = new mongoose.Schema({
    paymentData: {
      name: String,
      email: String,
      amount: Number,
      serviceType: String
    },
    paymentReference: String,
    fileName: String,
    receiptPath: String,
    dateOfPayment: { type: Date, default: Date.now },
    timeOfPayment: String,
    timestamp: { type: Date, default: Date.now }
  });
  
  PaymentModel = mongoose.model('Payment', paymentSchema);
}).catch((err) => {
  console.warn('MongoDB connection warning:', err.message);
  console.log('Using in-memory storage for payments (data will not persist)');
});

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

// Create email transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Test email configuration on startup
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
  } catch (error) {
    console.warn('Email configuration warning:', error.message);
    console.log('Email notifications will be disabled');
  }
};

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.access('uploads');
  } catch {
    await fs.mkdir('uploads');
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png' || 
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or PDF files are allowed'));
    }
  }
});

// Function to send payment confirmation emails
const sendPaymentConfirmationEmail = async (paymentData, paymentReference, receiptPath, fileName) => {
  try {
    // Skip if email is not configured
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('Email not configured - skipping payment confirmation emails');
      return;
    }
    
    // Email to user
    const userMailOptions = {
      from: process.env.EMAIL_FROM || '"IMF Africa Pay" <no-reply@imfafrica.org>',
      to: paymentData.email,
      subject: 'Payment Received Confirmation - IMF Africa Pay',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Payment Received Confirmation</h2>
          <p>Dear ${paymentData.name},</p>
          <p>Thank you for your payment. We have successfully received your payment with the following details:</p>
          
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Details</h3>
            <p><strong>Reference:</strong> ${paymentReference}</p>
            <p><strong>Service:</strong> ${paymentData.serviceType}</p>
            <p><strong>Amount:</strong> ₦${paymentData.amount.toLocaleString()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <p>Your payment receipt is attached to this email for your records.</p>
          <p>If you have any questions, please contact our support team.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #64748b; font-size: 14px;">
            Best regards,<br>
            <strong>IMF Africa Pay Team</strong>
          </p>
        </div>
      `,
      attachments: receiptPath ? [
        {
          filename: fileName || 'payment_receipt.pdf',
          path: path.join(__dirname, receiptPath)
        }
      ] : []
    };

    // Email to IMF
    const imfMailOptions = {
      from: process.env.EMAIL_FROM || '"IMF Africa Pay" <no-reply@imfafrica.org>',
      to: process.env.IMF_EMAIL || 'admin@imfafrica.org',
      subject: 'New Payment Received - IMF Africa Pay',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Payment Received</h2>
          <p>A new payment has been received with the following details:</p>
          
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Details</h3>
            <p><strong>Reference:</strong> ${paymentReference}</p>
            <p><strong>Payer Name:</strong> ${paymentData.name}</p>
            <p><strong>Payer Email:</strong> ${paymentData.email}</p>
            <p><strong>Service:</strong> ${paymentData.serviceType}</p>
            <p><strong>Amount:</strong> ₦${paymentData.amount.toLocaleString()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <p>Payment receipt is attached for verification.</p>
        </div>
      `,
      attachments: receiptPath ? [
        {
          filename: fileName || 'payment_receipt.pdf',
          path: path.join(__dirname, receiptPath)
        }
      ] : []
    };

    // Send emails
    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(imfMailOptions);
    
    console.log(`Payment confirmation emails sent for reference: ${paymentReference}`);
  } catch (error) {
    console.error('Error sending payment confirmation emails:', error);
    // Don't throw error as we don't want to fail the payment if email fails
  }
};

// Function to save payment (handles both MongoDB and in-memory storage)
const savePayment = async (paymentData) => {
  if (PaymentModel && mongoose.connection.readyState === 1) {
    // Use MongoDB
    const paymentRecord = new PaymentModel(paymentData);
    return await paymentRecord.save();
  } else {
    // Use in-memory storage
    const paymentRecord = {
      _id: Date.now().toString(),
      ...paymentData,
      timestamp: new Date()
    };
    inMemoryPayments.push(paymentRecord);
    return paymentRecord;
  }
};

// Function to get all payments
const getAllPayments = async () => {
  if (PaymentModel && mongoose.connection.readyState === 1) {
    // Use MongoDB
    return await PaymentModel.find().sort({ timestamp: -1 });
  } else {
    // Use in-memory storage
    return inMemoryPayments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
};

// Function to get payment by ID
const getPaymentById = async (id) => {
  if (PaymentModel && mongoose.connection.readyState === 1) {
    // Use MongoDB
    return await PaymentModel.findById(id);
  } else {
    // Use in-memory storage
    return inMemoryPayments.find(p => p._id === id);
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

// Send transfer receipt endpoint
app.post('/api/send-transfer-receipt', upload.single('receipt'), async (req, res) => {
  try {
    // Parse paymentData if it's a string
    let { paymentData, paymentReference, fileName } = req.body;
    
    // If paymentData is a string, parse it as JSON
    if (typeof paymentData === 'string') {
      try {
        paymentData = JSON.parse(paymentData);
      } catch (parseError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid payment data format' 
        });
      }
    }
    
    // Validate required fields
    if (!paymentData || !paymentData.name || !paymentData.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required payment information' 
      });
    }
    
    // Format time of payment
    const now = new Date();
    const timeOfPayment = now.toLocaleTimeString();
    const dateOfPayment = now;
    
    // Create payment record
    const paymentRecordData = {
      paymentData,
      paymentReference,
      fileName,
      receiptPath: req.file ? `/uploads/${req.file.filename}` : null,
      timeOfPayment,
      dateOfPayment
    };
    
    const savedPayment = await savePayment(paymentRecordData);
    
    // Send payment confirmation emails with the original file name
    if (savedPayment.receiptPath) {
      await sendPaymentConfirmationEmail(
        paymentData, 
        paymentReference, 
        savedPayment.receiptPath,
        fileName // Pass the original file name
      );
    }
    
    // Send success response
    res.json({ 
      success: true, 
      message: 'Payment submitted successfully',
      reference: paymentReference,
      data: savedPayment
    });
    
    console.log(`Payment received from ${paymentData.name} (${paymentData.email})`);
    
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process payment' 
    });
  }
});

// Get all payment records (for admin purposes)
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await getAllPayments();
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

// Get a specific payment record
app.get('/api/payments/:id', async (req, res) => {
  try {
    const payment = await getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment record not found' 
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

// Serve the React frontend (if built)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'src/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File size must be less than 5MB' 
      });
    }
  }
  
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Start server
const startServer = async () => {
  await ensureUploadsDir();
  await testEmailConfig();
  
  app.listen(PORT, () => {
    console.log(`IMF Africa Pay Backend Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();

module.exports = app;