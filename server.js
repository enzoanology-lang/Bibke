const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || '0x4AAAAAACzWlwGguatYGKhMxO0uDLTrEds';

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Handle SPA routing - send all other requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
