const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Enable CORS for all routes to handle cross-origin requests
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://imf-africa-pay-klzv.onrender.com',
      'https://imf-africa-pay-v4zb.onrender.com',
      'https://imf-africa-pay-backend.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || 
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist directory if it exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Serving static files from root dist directory');
}

// Serve static files from src/dist for development compatibility
const srcDistPath = path.join(__dirname, 'src', 'dist');
if (fs.existsSync(srcDistPath)) {
  app.use(express.static(srcDistPath));
  console.log('Serving static files from src/dist directory');
}

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/imf-africa-pay', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Email transporter setup - use SendGrid if API key is provided, otherwise SMTP
let transporter = null;

if (process.env.SENDGRID_API_KEY) {
  // Use SendGrid
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  // Create a send function that uses SendGrid
  transporter = {
    sendMail: async (mailOptions) => {
      const msg = {
        to: mailOptions.to,
        from: mailOptions.from || process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
        subject: mailOptions.subject,
        text: mailOptions.text,
        html: mailOptions.html,
        attachments: mailOptions.attachments ? mailOptions.attachments.map(att => ({
          content: fs.readFileSync(att.path).toString('base64'),
          filename: att.filename,
          type: att.contentType || att.mimetype,
          disposition: 'attachment'
        })) : undefined
      };
      
      return await sgMail.send(msg);
    }
  };
  
  console.log('Email transporter configured with SendGrid');
} else if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  // Use SMTP
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: parseInt(process.env.EMAIL_PORT) === 465, // Use secure connection for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add timeout settings to prevent hanging
      connectionTimeout: 15000, // 15 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 15000,     // 15 seconds
      // Add additional options for better compatibility with cloud platforms
      requireTLS: true,
      tls: {
        rejectUnauthorized: false, // This helps with self-signed certificates on some platforms
        ciphers: 'SSLv3'
      }
    });

    // Verify transporter configuration but don't let it block startup
    setTimeout(() => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('Email transporter configuration error:', error);
          console.log('Email service is not available. Continuing without email functionality.');
          transporter = null; // Disable transporter if verification fails
        } else {
          console.log('Email transporter is ready to send messages');
        }
      });
    }, 2000); // Delay verification to not block startup
    
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    console.log('Email service is not available. Continuing without email functionality.');
  }
} else {
  console.log('Email environment variables not set. Continuing without email functionality.');
}

// Payment data storage (in production, use a database)
let payments = [];

// Routes
app.get('/api/payments', (req, res) => {
  res.json(payments);
});

app.post('/api/payment', (req, res) => {
  const { name, email, phone, plan, amount } = req.body;
  const newPayment = { id: Date.now().toString(), name, email, phone, plan, amount, status: 'pending' };
  payments.push(newPayment);
  
  // Send email notification to admin if transporter is available
  if (transporter) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"IMF Africa Pay" <${process.env.EMAIL_USER}>`,
      to: process.env.IMF_EMAIL || process.env.EMAIL_USER,
      subject: 'New Payment Received',
      text: `A new payment has been received:

Name: ${name}
Email: ${email}
Phone: ${phone}
Plan: ${plan}
Amount: ${amount}
Status: pending`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email sending error:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  } else {
    console.log('Email transporter not available, skipping email notification');
  }

  res.json({ success: true, payment: newPayment });
});

// File upload route - Enhanced to send receipt email to user
app.post('/api/upload', upload.single('receipt'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Extract user details from the request body (these should be sent from the frontend)
  const { name, email, amount, serviceType } = req.body;

  // Send response immediately to avoid timeout
  res.json({ 
    success: true, 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    emailStatus: 'processing' // Indicate that email is being processed in background
  });

  // Process emails in the background only if transporter is available
  if (transporter) {
    setTimeout(() => {
      // Log email attempt for debugging
      console.log(`Attempting to send emails for: ${name || 'Unknown'} (${email || 'No email'})`);
      
      // Send email notification to admin about the uploaded receipt
      const adminMailOptions = {
        from: process.env.EMAIL_FROM || `"IMF Africa Pay" <${process.env.EMAIL_USER}>`,
        to: process.env.IMF_EMAIL || process.env.EMAIL_USER,
        subject: 'Payment Receipt Uploaded',
        text: `A payment receipt has been uploaded:

File: ${req.file.filename}
Original Name: ${req.file.originalname}
Size: ${req.file.size} bytes
Uploaded by: ${name || 'Unknown'}
Email: ${email || 'N/A'}
Amount: ${amount || 'N/A'}
Service: ${serviceType || 'N/A'}`,
        attachments: [
          {
            filename: req.file.originalname,
            path: req.file.path
          }
        ]
      };

      // Compose receipt email to user
      const userReceiptMailOptions = {
        from: process.env.EMAIL_FROM || `"IMF Africa Pay" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Payment Receipt Confirmation - IMF Africa Pay',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .receipt-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>IMF Africa Pay</h1>
                <h2>Payment Receipt Confirmation</h2>
              </div>
              <div class="content">
                <p>Dear ${name || 'Valued Customer'},</p>
                
                <p>We have successfully received your payment receipt. Here are the details:</p>
                
                <div class="receipt-details">
                  <h3>Payment Information:</h3>
                  <p><strong>Name:</strong> ${name || 'N/A'}</p>
                  <p><strong>Email:</strong> ${email || 'N/A'}</p>
                  <p><strong>Amount:</strong> ₦${amount ? parseInt(amount).toLocaleString() : 'N/A'}</p>
                  <p><strong>Service Type:</strong> ${serviceType || 'N/A'}</p>
                  <p><strong>Receipt File:</strong> ${req.file.originalname}</p>
                  <p><strong>Upload Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <p>Your payment is currently being processed. You will receive another email once your payment has been verified and your service activated.</p>
                
                <p>If you have any questions, please contact our support team.</p>
                
                <p>Thank you for choosing IMF Africa Pay!</p>
                
                <p>Best regards,<br/>The IMF Africa Pay Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} International Ministers Forum. All rights reserved.</p>
                <p>This is an automated message, please do not reply directly to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: req.file.originalname,
            path: req.file.path
          }
        ]
      };

      // Send emails concurrently in the background
      Promise.all([
        // Send notification to admin
        transporter.sendMail(adminMailOptions)
          .then(info => {
            console.log('Admin email sent successfully:', info.response);
          })
          .catch(error => {
            console.error('Admin email failed:', error);
          }),
        // Send receipt confirmation to user
        transporter.sendMail(userReceiptMailOptions)
          .then(info => {
            console.log('User receipt email sent successfully:', info.response);
          })
          .catch(error => {
            console.error('User receipt email failed:', error);
          })
      ]);
    }, 100); // Small delay to ensure response is sent first
  } else {
    console.log('Email transporter not available, skipping email notifications');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the frontend for all other routes (for React Router)
app.get('*', (req, res) => {
  // Try root dist first
  const rootIndexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(rootIndexPath)) {
    console.log('Serving index.html from root dist');
    return res.sendFile(rootIndexPath);
  }
  
  // Try src/dist as fallback
  const srcIndexPath = path.join(__dirname, 'src', 'dist', 'index.html');
  if (fs.existsSync(srcIndexPath)) {
    console.log('Serving index.html from src/dist');
    return res.sendFile(srcIndexPath);
  }
  
  // Fallback for development
  console.log('No index.html found, sending fallback response');
  res.json({ message: 'Server is running', status: 'ok' });
});

// Use the PORT environment variable provided by DigitalOcean or default to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});