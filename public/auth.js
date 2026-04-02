// ====================== Helpers ======================
const authState = { isLoading: false };

function getElements() {
    return {
        emailInput: document.getElementById('email'),
        passwordInput: document.getElementById('password'),
        nameInput: document.getElementById('name'),
        loginBtn: document.getElementById('login-btn'),
        signupBtn: document.getElementById('sign-up-btn'),
    };
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(message) {
    let el = document.getElementById('auth-message');
    if (!el) {
        el = document.createElement('div');
        el.id = 'auth-message';
        el.style.cssText = 'color:#e74c3c;background:#fdecea;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:14px;';
        const form = document.querySelector('.auth-form');
        if (form) form.prepend(el);
    }
    el.style.color = '#e74c3c';
    el.style.background = '#fdecea';
    el.textContent = message;
    el.style.display = 'block';
}

function showSuccess(message) {
    let el = document.getElementById('auth-message');
    if (!el) {
        el = document.createElement('div');
        el.id = 'auth-message';
        el.style.cssText = 'padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:14px;';
        const form = document.querySelector('.auth-form');
        if (form) form.prepend(el);
    }
    el.style.color = '#27ae60';
    el.style.background = '#eafaf1';
    el.textContent = message;
    el.style.display = 'block';
}

function setLoading(btn, loading) {
    authState.isLoading = loading;
    if (!btn) return;
    const span = btn.querySelector('span');
    const loader = btn.querySelector('.loader');
    if (loading) {
        btn.disabled = true;
        if (span) span.style.display = 'none';
        if (loader) loader.style.display = 'inline-block';
    } else {
        btn.disabled = false;
        if (span) span.style.display = '';
        if (loader) loader.style.display = 'none';
    }
}

// ====================== Verify Turnstile ======================
async function verifyTurnstileToken(token) {
    if (!token) return false;
    try {
        const response = await fetch('/api/verify-turnstile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('Turnstile verification error:', error);
        return false;
    }
}

// ====================== SIGNUP ======================
async function handleSignup(e) {
    e.preventDefault();
    if (authState.isLoading) return;

    const elements = getElements();
    const name = elements.nameInput?.value.trim() || '';
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;

    if (!name || !email || !password) {
        showError('Please fill in all fields');
        return;
    }
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }

    // Get Turnstile token
    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
    if (!turnstileToken) {
        showError('Please complete the security verification');
        return;
    }

    setLoading(elements.signupBtn, true);

    try {
        // Verify Turnstile
        const isValid = await verifyTurnstileToken(turnstileToken);
        if (!isValid) {
            showError('Security verification failed. Please try again.');
            setLoading(elements.signupBtn, false);
            return;
        }

        // Call real register API
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message || 'Signup failed. Please try again.');
            setLoading(elements.signupBtn, false);
            return;
        }

        showSuccess('Account created! Please check your email to verify, then sign in.');

        // Redirect to sign-in after 2 seconds
        setTimeout(() => {
            window.location.href = 'sign-in.html';
        }, 2000);

    } catch (error) {
        console.error('Signup error:', error);
        showError('Signup failed. Please try again.');
        setLoading(elements.signupBtn, false);
    }
}

// ====================== LOGIN ======================
async function handleLogin(e) {
    e.preventDefault();
    if (authState.isLoading) return;

    const elements = getElements();
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;

    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Get Turnstile token
    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
    if (!turnstileToken) {
        showError('Please complete the security verification');
        return;
    }

    setLoading(elements.loginBtn, true);

    try {
        // Verify Turnstile
        const isValid = await verifyTurnstileToken(turnstileToken);
        if (!isValid) {
            showError('Security verification failed. Please try again.');
            setLoading(elements.loginBtn, false);
            return;
        }

        // Call real login API
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message || 'Login failed. Please try again.');
            setLoading(elements.loginBtn, false);
            return;
        }

        // Save token and user info
        localStorage.setItem('bibleai_token', data.user.id);
        localStorage.setItem('bibleai_user', data.user.name);

        showSuccess('Login successful! Redirecting...');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed. Please try again.');
        setLoading(elements.loginBtn, false);
    }
}

// ====================== Attach Form Listeners ======================
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Password toggle
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        });
    }
});
