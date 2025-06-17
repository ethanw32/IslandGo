const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000', // Your React app's URL
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Log environment variables (without password)
console.log('Environment check:', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD_SET: !!process.env.EMAIL_PASSWORD,
  PORT: process.env.PORT
});

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('Transporter verification error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    // Validate input
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        details: { to: !!to, subject: !!subject, html: !!html }
      });
    }

    console.log('Attempting to send email to:', to);
    console.log('Using email account:', process.env.EMAIL_USER);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email configuration is missing. Please check your .env file.');
    }

    const mailOptions = {
      from: `"IslandGo" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    res.json({ success: true, message: 'Email sent successfully', info });
  } catch (error) {
    console.error('Detailed error sending email:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    // Handle specific error types
    if (error.code === 'EAUTH') {
      return res.status(401).json({
        success: false,
        message: 'Email authentication failed. Please check your credentials.',
        error: error.message
      });
    }

    if (error.code === 'ESOCKET') {
      return res.status(503).json({
        success: false,
        message: 'Could not connect to email server. Please try again later.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
      code: error.code
    });
  }
});

// Booking status update endpoint
app.patch('/api/bookings/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    console.log('Received status update request:', {
      bookingId,
      status,
      headers: req.headers,
      body: req.body
    });

    if (!bookingId || !status) {
      console.error('Missing required fields:', { bookingId, status });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: bookingId and status'
      });
    }

    // Here you would update the booking status in your database
    // For now, we'll simulate a successful update
    console.log(`Updating booking ${bookingId} status to ${status}`);

    // Simulate database update
    const updatedBooking = {
      id: bookingId,
      status: status,
      updatedAt: new Date().toISOString()
    };

    console.log('Successfully updated booking:', updatedBooking);

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking status:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server at http://localhost:${PORT}/api/test`);
}); 