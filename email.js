// email.js
const nodemailer = require('nodemailer');

// Create transporter (configure for your email service)
const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'outlook', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS  // Your email password or app password
    }
});

async function sendVerificationEmail(email, name, code) {
    try {
        await transporter.sendMail({
            from: `"Your App Name" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email',
            html: `
                <h1>Hello ${name}!</h1>
                <p>Thank you for registering. Please verify your email using this code:</p>
                <h2 style="color: blue;">${code}</h2>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

async function sendWelcomeEmail(email, name, isVerified) {
    try {
        await transporter.sendMail({
            from: `"Your App Name" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to BibleAI!',
            html: `
                <h1>Welcome ${name}!</h1>
                <p>Your account has been successfully verified.</p>
                <p>You can now log in and start using BibleAI.</p>
                <p>Thank you for joining us!</p>
            `
        });
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't throw for welcome email - it's not critical
    }
}

module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail
};
