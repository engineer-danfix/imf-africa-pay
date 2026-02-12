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
      'https://imf-africa-pay-production.up.railway.app/',
      'https://imf-africa-pay-backend.onrender.com'
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
      // Ensure the from address is properly formatted for SendGrid
      // Use the SENDGRID_FROM_EMAIL if available, otherwise use a default
      const fromAddress = process.env.SENDGRID_FROM_EMAIL || 
                         process.env.EMAIL_USER || 
                         'noreply@imfafricapay.org'; // Use a default domain
      
      const msg = {
        to: mailOptions.to,
        from: fromAddress,
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
      
      try {
        return await sgMail.send(msg);
      } catch (error) {
        console.error('SendGrid error:', error);
        // Return a promise rejection to maintain consistency with nodemailer
        throw error;
      }
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
      from: process.env.EMAIL_FROM || `"IMF Africa Pay" <${process.env.EMAIL_USER || 'noreply@imfafricapay.org'}>`,
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

  // Send immediate response to avoid timeout
  res.json({ 
    success: true, 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    emailStatus: 'processing' // Indicate that email is being processed in background
  });

  // Process emails in the background only if transporter is available
  if (transporter) {
    setTimeout(async () => {
      // Log email attempt for debugging
      console.log(`Attempting to send emails for: ${name || 'Unknown'} (${email || 'No email'})`);
      
      try {
        // Send email notification to admin about the uploaded receipt
        const adminMailOptions = {
          from: process.env.EMAIL_FROM || `"IMF Africa Pay" <${process.env.EMAIL_USER || 'noreply@imfafricapay.org'}>`,
          to: process.env.IMF_EMAIL || process.env.EMAIL_USER || process.env.EMAIL_FROM || process.env.EMAIL_USER,
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

        // Compose receipt email to user with improved UI
        const userReceiptMailOptions = {
          from: process.env.EMAIL_FROM || `"IMF Africa Pay" <${process.env.EMAIL_USER || 'noreply@imfafricapay.org'}>`,
          to: email,
          subject: 'Payment Receipt Confirmation - IMF Africa Pay',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Payment Receipt Confirmation - IMF Africa Pay</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
                <tr>
                  <td style="padding: 20px 0;">
                    <!-- Main Email Container -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                      <!-- Header Section -->
                      <tr>
                        <td style="text-align: center; padding: 30px 20px; background-color: #1e40af; border-radius: 8px 8px 0 0;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">IMF Africa Pay</h1>
                          <h2 style="color: #dbeafe; margin: 10px 0 0 0; font-size: 20px; font-weight: normal;">Payment Receipt Confirmation</h2>
                        </td>
                      </tr>
                      
                      <!-- Content Section -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Dear ${name || 'Valued Customer'},
                          </p>
                          
                          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            We have successfully received your payment receipt. Here are the details:
                          </p>
                          
                          <!-- Receipt Details Card -->
                          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin: 25px 0;">
                            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">Payment Information:</h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                              <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                  <strong style="color: #374151; width: 150px; display: inline-block;">Name:</strong>
                                  <span style="color: #6b7280;">${name || 'N/A'}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                  <strong style="color: #374151; width: 150px; display: inline-block;">Email:</strong>
                                  <span style="color: #6b7280;">${email || 'N/A'}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                  <strong style="color: #374151; width: 150px; display: inline-block;">Amount:</strong>
                                  <span style="color: #6b7280;">₦${amount ? parseInt(amount).toLocaleString() : 'N/A'}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                  <strong style="color: #374151; width: 150px; display: inline-block;">Service Type:</strong>
                                  <span style="color: #6b7280;">${serviceType || 'N/A'}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                  <strong style="color: #374151; width: 150px; display: inline-block;">Receipt File:</strong>
                                  <span style="color: #6b7280;">${req.file.originalname}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0;">
                                  <strong style="color: #374151; width: 150px; display: inline-block;">Upload Time:</strong>
                                  <span style="color: #6b7280;">${new Date().toLocaleString()}</span>
                                </td>
                              </tr>
                            </table>
                          </div>
                          
                          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Your payment is currently being processed. You will receive another email once your payment has been verified and your service activated.
                          </p>
                          
                          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            If you have any questions, please contact our support team.
                          </p>
                          
                          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                            Thank you for choosing IMF Africa Pay!
                          </p>
                          
                          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                            Best regards,<br/>
                            <strong>The IMF Africa Pay Team</strong>
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer Section -->
                      <tr>
                        <td style="text-align: center; padding: 30px 20px; background-color: #f3f4f6; border-radius: 0 0 8px 8px;">
                          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                            © ${new Date().getFullYear()} International Ministers Forum. All rights reserved.
                          </p>
                          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                            This is an automated message, please do not reply directly to this email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
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
        await Promise.allSettled([
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
      } catch (error) {
        console.error('Background email processing failed:', error);
      }
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