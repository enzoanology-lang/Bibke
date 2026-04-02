const { MongoClient } = require('mongodb');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');
const { sendVerificationEmail, sendWelcomeEmail } = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || '0x4AAAAAACzXvTv6K5iEEUbcluotXyigoAQ';

let db; // Global database reference

// ====================== MongoDB Connection ======================
async function connectDB() {
    if (!MONGO_URI) {
        console.warn('⚠ MONGO_URI not set — database features will be disabled');
        return null;
    }

    try {
        const client = new MongoClient(MONGO_URI);   // No deprecated options needed
        await client.connect();
        db = client.db('bibleai');   // Change name if you want a different DB

        console.log('✅ Connected to MongoDB Atlas successfully');
        return db;
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.error('Please check your MONGO_URI environment variable on Render');
        return null;
    }
}

// ====================== Middleware ======================
app.use(cors());
app.use(express.json());                    // Important for parsing POST body (register, verify, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ====================== Turnstile Route ======================
app.post('/api/verify-turnstile', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ success: false, error: 'No token provided' });
    }

    try {
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET);
        formData.append('response', token);

        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        });

        const outcome = await result.json();
        res.json({ success: outcome.success });
    } catch (error) {
        console.error('Turnstile verification error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// ====================== REGISTER ROUTE ======================
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        if (!db) {
            return res.status(500).json({ message: 'Database not connected' });
        }

        const users = db.collection('users');

        // Check if user already exists
        const existing = await users.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Generate 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await users.insertOne({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            isVerified: false,
            verificationCode,
            verificationExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            createdAt: new Date()
        });

        // Send verification email
        await sendVerificationEmail(email, name, verificationCode);

        res.status(201).json({
            message: 'Account created successfully! Please check your email for the verification code.',
            userId: result.insertedId
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// ====================== VERIFY EMAIL ROUTE ======================
app.post('/api/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: 'Email and code are required' });
        }

        if (!db) {
            return res.status(500).json({ message: 'Database not connected' });
        }

        const users = db.collection('users');
        const user = await users.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({ message: 'Account not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account already verified' });
        }

        if (new Date() > user.verificationExpires) {
            return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Mark as verified
        await users.updateOne(
            { email: email.toLowerCase() },
            {
                $set: {
                    isVerified: true,
                    verificationCode: null,
                    verificationExpires: null
                }
            }
        );

        // Optional: Send welcome email
        await sendWelcomeEmail(email, user.name, true);

        res.status(200).json({
            message: 'Account verified successfully! You can now log in.'
        });

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// ====================== LOGIN ROUTE ======================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        if (!db) {
            return res.status(500).json({ message: 'Database not connected' });
        }

        const users = db.collection('users');
        const user = await users.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// ====================== Catch-all for SPA ======================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ====================== Start Server ======================
async function startServer() {
    await connectDB();   // Wait for MongoDB before starting server

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`   Live URL: https://bibleaigpt.onrender.com`);
    });
}

startServer();

// Optional: Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});
