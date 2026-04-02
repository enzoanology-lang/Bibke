// Verify Turnstile token with your backend
async function verifyTurnstileToken(token) {
    console.log('Verifying Turnstile token:', token);
    
    if (!token) {
        console.error('No Turnstile token provided');
        return false;
    }
    
    try {
        const response = await fetch('/api/verify-turnstile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                token: token  // Make sure this matches what your backend expects
            })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return false;
        }
        
        const data = await response.json();
        console.log('Verification response:', data);
        
        return data.success === true;
    } catch (error) {
        console.error('Verification error:', error);
        return false;
    }
}

// Modified handleLogin function
async function handleLogin(e, turnstileToken) {
    e.preventDefault();

    if (authState.isLoading) return;

    const elements = getElements();
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;

    // Validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Make sure we have the Turnstile token
    if (!turnstileToken) {
        // Try to get the token from the Turnstile widget
        const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
        if (turnstileResponse) {
            turnstileToken = turnstileResponse.value;
        }
    }
    
    if (!turnstileToken) {
        showError('Please complete the security verification');
        return;
    }

    setLoading(elements.loginBtn, true);

    try {
        // Verify Turnstile token
        const isValid = await verifyTurnstileToken(turnstileToken);
        if (!isValid) {
            showError('Security verification failed. Please try again.');
            setLoading(elements.loginBtn, false);
            return;
        }

        // Your existing login logic
        await simulateAuthRequest({
            email,
            password,
            action: 'login'
        });

        const token = generateToken();
        const userName = email.split('@')[0];
        
        localStorage.setItem('bibleai_token', token);
        localStorage.setItem('bibleai_user', userName);

        showSuccess('Login successful! Redirecting...');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed. Please try again.');
        setLoading(elements.loginBtn, false);
    }
}

// Modified handleSignup function
async function handleSignup(e, turnstileToken) {
    e.preventDefault();

    if (authState.isLoading) return;

    const elements = getElements();
    const name = elements.nameInput?.value.trim() || '';
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;

    // Validation
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

    // Make sure we have the Turnstile token
    if (!turnstileToken) {
        // Try to get the token from the Turnstile widget
        const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
        if (turnstileResponse) {
            turnstileToken = turnstileResponse.value;
        }
    }
    
    if (!turnstileToken) {
        showError('Please complete the security verification');
        return;
    }

    setLoading(elements.signupBtn, true);

    try {
        // Verify Turnstile token
        const isValid = await verifyTurnstileToken(turnstileToken);
        if (!isValid) {
            showError('Security verification failed. Please try again.');
            setLoading(elements.signupBtn, false);
            return;
        }

        // Your existing signup logic
        await simulateAuthRequest({
            name,
            email,
            password,
            action: 'signup'
        });

        const token = generateToken();
        const userName = name.split(' ')[0];
        
        localStorage.setItem('bibleai_token', token);
        localStorage.setItem('bibleai_user', userName);

        showSuccess('Account created successfully! Redirecting...');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'Signup failed. Please try again.');
        setLoading(elements.signupBtn, false);
    }
}
