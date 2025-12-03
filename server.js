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

// Use Render's port or default to 3000
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

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB Atlas');
  dbConnectionStatus = 'CONNECTED';
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  dbConnectionStatus = 'ERROR';
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB Atlas');
  dbConnectionStatus = 'DISCONNECTED';
});

// Email configuration with debugging
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_PORT ? (parseInt(process.env.EMAIL_PORT) === 465) : false,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  tls: {
    rejectUnauthorized: false
  },
  // Additional settings for better Gmail compatibility
  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,
  debug: true,
  logger: true,
  // Gmail-specific settings that often work
  service: 'gmail',
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
};

console.log('Email Configuration Check:');
console.log('- Host:', emailConfig.host);
console.log('- Port:', emailConfig.port);
console.log('- Secure:', emailConfig.secure);
console.log('- User:', emailConfig.auth.user ? 'SET' : 'NOT SET');
// Don't log the password for security
console.log('- TLS Settings:', emailConfig.tls);
console.log('- Timeouts:', {
  connection: emailConfig.connectionTimeout,
  greeting: emailConfig.greetingTimeout,
  socket: emailConfig.socketTimeout
});

let transporter = null;
let dbConnectionStatus = 'DISCONNECTED';

// Initialize email transporter with detailed error handling and fallback
const initializeEmail = async (maxRetries = 3) => {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.log('Email configuration incomplete - email notifications disabled');
      return false;
    }

    // Try primary configuration first
    console.log('Attempting to create email transporter with primary config...');
    transporter = nodemailer.createTransport(emailConfig);
    
    console.log('Attempting to verify email transporter...');
    // Retry logic for email verification
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Email verification attempt ${attempt}/${maxRetries}`);
        await transporter.verify();
        console.log(`Email transporter initialized successfully (attempt ${attempt})`);
        return true;
      } catch (error) {
        console.log(`Email verification attempt ${attempt} failed:`);
        console.log('- Error Code:', error.code);
        console.log('- Error Message:', error.message);
        console.log('- Error Details:', error);
        
        // If this is the last attempt, try a few specific fixes
        if (attempt === maxRetries) {
          console.log('Trying alternative Gmail configuration...');
          
          // Try with different TLS settings
          const altConfig = {
            ...emailConfig,
            tls: {
              rejectUnauthorized: false,
              ciphers: 'SSLv3'
            }
          };
          
          transporter = nodemailer.createTransport(altConfig);
          
          try {
            console.log('Testing alternative configuration...');
            await transporter.verify();
            console.log('Alternative email transporter initialized successfully');
            return true;
          } catch (altError) {
            console.log('Alternative configuration also failed:');
            console.log('- Error Code:', altError.code);
            console.log('- Error Message:', altError.message);
          }
        } else if (attempt < maxRetries) {
          console.log(`Retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.log('All email verification attempts failed');
        }
      }
    }
    
    return false;
  } catch (error) {
    console.log('Critical error during email transporter initialization:');
    console.log('- Error Name:', error.name);
    console.log('- Error Message:', error.message);
    console.log('- Error Stack:', error.stack);
    return false;
  }
};

// Test email configuration on startup
const testEmailConfig = async () => {
  try {
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.log('Email configuration incomplete - skipping email setup');
      return false;
    }

    const transporter = nodemailer.createTransport(emailConfig);
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.log('Email configuration error:', error.message);
    return false;
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

// Health check endpoint with email status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: dbConnectionStatus,
    email: transporter ? 'CONFIGURED' : 'NOT CONFIGURED',
    port: PORT
  });
});

// Email test endpoint (for debugging)
app.post('/api/test-email', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(400).json({
        success: false,
        error: 'Email transporter not initialized'
      });
    }

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

// Send transfer receipt
app.post('/api/send-transfer-receipt', upload.single('receipt'), async (req, res) => {
  try {
    // Validate required fields
    const { name, email, amount, serviceType, reference } = req.body;
    
    if (!name || !email || !amount || !serviceType || !reference) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Validate amount is a number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid amount' 
      });
    }

    // Handle file upload
    let filePath = '';
    if (req.file) {
      filePath = req.file.path;
    }

    // Save payment record
    const paymentData = {
      name,
      email,
      amount: amountNum,
      serviceType,
      reference,
      receiptPath: filePath,
      timestamp: new Date()
    };

    const savedPayment = await savePayment(paymentData);

    // Send email notifications if transporter is available
    if (transporter) {
      try {
        // Send confirmation to user
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"IMF Africa Pay" <no-reply@imfafrica.org>',
          to: email,
          subject: 'Payment Receipt Received',
          html: `
            <h2>Payment Receipt Received</h2>
            <p>Dear ${name},</p>
            <p>Thank you for your payment. We have received your transfer receipt.</p>
            <p><strong>Payment Details:</strong></p>
            <ul>
              <li>Name: ${name}</li>
              <li>Amount: $${amountNum.toFixed(2)}</li>
              <li>Service: ${serviceType}</li>
              <li>Reference: ${reference}</li>
              <li>Date: ${new Date().toLocaleString()}</li>
            </ul>
            <p>We will process your payment shortly.</p>
            <p>Best regards,<br>IMF Africa Team</p>
          `,
          attachments: filePath ? [{
            filename: req.file.originalname,
            path: filePath
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
              <li>Name: ${name}</li>
              <li>Email: ${email}</li>
              <li>Amount: $${amountNum.toFixed(2)}</li>
              <li>Service: ${serviceType}</li>
              <li>Reference: ${reference}</li>
              <li>Date: ${new Date().toLocaleString()}</li>
            </ul>
          `,
          attachments: filePath ? [{
            filename: req.file.originalname,
            path: filePath
          }] : []
        });

        console.log('Email notifications sent successfully');
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError.message);
        // Don't fail the request if email fails, just log the error
      }
    } else {
      console.log('Email transporter not available - skipping email notifications');
    }

    res.json({ 
      success: true, 
      message: 'Transfer receipt submitted successfully',
      data: savedPayment
    });
  } catch (error) {
    console.error('Error processing transfer receipt:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process transfer receipt' 
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
  const emailInitialized = await initializeEmail();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IMF Africa Pay Backend Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    
    if (!emailInitialized) {
      console.log('Email notifications are disabled due to configuration issues');
    }
  });
};

startServer();

module.exports = app;