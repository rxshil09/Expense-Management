// Email utility functions
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if we have SMTP credentials configured
  const hasSmtpConfig = process.env.SMTP_EMAIL && 
                       process.env.SMTP_PASSWORD && 
                       process.env.SMTP_HOST;

  // If no SMTP config in development, just log
  if (process.env.NODE_ENV === 'development' && !hasSmtpConfig) {
    console.log('\n=== EMAIL SENT (DEV MODE - NO SMTP) ===');
    console.log('To:', options.email);
    console.log('Subject:', options.subject);
    console.log('Message:', options.message);
    console.log('=====================================\n');
    return;
  }

  try {
    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    console.log('\n=== SENDING EMAIL ===');
    console.log('To:', options.email);
    console.log('From:', message.from);
    console.log('Subject:', options.subject);
    console.log('====================\n');

    const info = await transporter.sendMail(message);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

const sendOTPEmail = async (email, otp, name) => {
  // Check if we have SMTP credentials configured
  const hasSmtpConfig = process.env.SMTP_EMAIL && 
                       process.env.SMTP_PASSWORD && 
                       process.env.SMTP_HOST;

  // If no SMTP config in development, just log
  if (process.env.NODE_ENV === 'development' && !hasSmtpConfig) {
    console.log('\n=== OTP EMAIL (DEV MODE - NO SMTP) ===');
    console.log('To:', email);
    console.log('Name:', name);
    console.log('OTP CODE:', otp);
    console.log('====================================\n');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .otp-code { 
          font-size: 32px; 
          font-weight: bold; 
          text-align: center; 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          letter-spacing: 5px;
          color: #4f46e5;
        }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email Address</h1>
        </div>
        <p>Hello ${name},</p>
        <p>Thank you for signing up! Please use the following 6-digit code to verify your email address:</p>
        <div class="otp-code">${otp}</div>
        <p>This code will expire in 10 minutes for security reasons.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <div class="footer">
          <p>Best regards,<br>The AuthBoilerplate Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    email,
    subject: 'Verify Your Email Address',
    message: `Your verification code is: ${otp}`,
    html,
  });
};

const sendPasswordResetEmail = async (email, resetToken, name) => {
  // Check if we have SMTP credentials configured
  const hasSmtpConfig = process.env.SMTP_EMAIL && 
                       process.env.SMTP_PASSWORD && 
                       process.env.SMTP_HOST;

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
  // Debug logging
  console.log('CLIENT_URL from env:', process.env.CLIENT_URL);
  console.log('Generated reset URL:', resetUrl);

  // If no SMTP config in development, just log
  if (process.env.NODE_ENV === 'development' && !hasSmtpConfig) {
    console.log('\n=== PASSWORD RESET EMAIL (DEV MODE - NO SMTP) ===');
    console.log('To:', email);
    console.log('Name:', name);
    console.log('Reset URL:', resetUrl);
    console.log('===============================================\n');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .reset-button { 
          display: inline-block;
          background: #4f46e5; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <p>Hello ${name},</p>
        <p>You recently requested to reset your password for your account. Click the button below to reset it:</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="reset-button">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>
        <div class="warning">
          <p><strong>Important:</strong> This link will expire in 10 minutes for security reasons.</p>
        </div>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <div class="footer">
          <p>Best regards,<br>The AuthBoilerplate Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    email,
    subject: 'Reset Your Password',
    message: `Reset your password using this link: ${resetUrl}`,
    html,
  });
};

module.exports = { sendEmail, sendOTPEmail, sendPasswordResetEmail };
