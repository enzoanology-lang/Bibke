const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, name, code) {
    await resend.emails.send({
        from: 'Bibleai <onboarding@resend.dev>',
        to: email,
        subject: 'Verify your Bibleai account',
        html: `
            <h2>Welcome to Bibleai, ${name}!</h2>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing:8px;">${code}</h1>
            <p>This code expires in 10 minutes.</p>
        `
    });
}

async function sendWelcomeEmail(email, name) {
    await resend.emails.send({
        from: 'Bibleai <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to Bibleai!',
        html: `
            <h2>Welcome, ${name}!</h2>
            <p>Your account has been verified. Enjoy your spiritual journey with Bibleai.</p>
        `
    });
}

module.exports = { sendVerificationEmail, sendWelcomeEmail };
