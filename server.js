const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory if it exists
const distPath = path.join(__dirname, 'dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Serve static files from src/dist for development compatibility
app.use('/src/dist', express.static(path.join(__dirname, 'src', 'dist')));

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
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Email transporter setup
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
  
  // Send email notification to admin
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.IMF_EMAIL,
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

  res.json({ success: true, payment: newPayment });
});

// File upload route
app.post('/api/upload', upload.single('receipt'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Send email notification to admin about the uploaded receipt
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.IMF_EMAIL,
    subject: 'Payment Receipt Uploaded',
    text: `A payment receipt has been uploaded:

File: ${req.file.filename}
Original Name: ${req.file.originalname}
Size: ${req.file.size} bytes`,
    attachments: [
      {
        filename: req.file.originalname,
        path: req.file.path
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Email sending error:', error);
      // Still return success since the file was uploaded, even if email failed
      res.json({ 
        success: true, 
        message: 'File uploaded successfully but email notification failed',
        filename: req.file.filename,
        emailStatus: 'failed'
      });
    } else {
      console.log('Email sent: ' + info.response);
      res.json({ 
        success: true, 
        message: 'File uploaded and email notification sent successfully',
        filename: req.file.filename,
        emailStatus: 'sent'
      });
    }
  });
});

// Serve the frontend for all other routes (for React Router)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback for development
    res.json({ message: 'Server is running', status: 'ok' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
