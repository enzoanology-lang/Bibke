const { MongoClient } = require('mongodb');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

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

// ====================== Example Registration Route (Add your logic here) ======================
// We'll expand this later when you add sendVerificationEmail

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
