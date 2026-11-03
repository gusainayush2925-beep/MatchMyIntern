// ===== PUBLIC REGISTER FORM =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  document.getElementById('role').addEventListener('change', (e) => {
    const companyField = document.getElementById('companyField');
    companyField.style.display = e.target.value === 'recruiter' ? 'block' : 'none';
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const companyName = document.getElementById('companyName')?.value || '';

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    const btn = registerForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registering...';

    const payload = { name, email, password, role };
    if (role === 'recruiter' && companyName) payload.companyName = companyName;

    const result = await apiCall('/auth/register', 'POST', payload);

    if (result.ok) {
      localStorage.setItem('verifyEmail', email);
      localStorage.setItem('verifyName', name);
      showToast('✅ OTP sent to your email!', 'success');
      setTimeout(() => window.location.href = 'verify-otp.html', 1200);
    } else {
      showToast(result.data.message || 'Registration failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

// ===== LOGIN FORM =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Logging in...';

    const result = await apiCall('/auth/login', 'POST', { email, password });

    if (result.ok && result.data.token) {
      const user = result.data.user;

      if (user.role === 'admin') {
        showToast('⚠️ Admins must use the admin login page!', 'error');
        btn.disabled = false;
        btn.textContent = 'Login';
        return;
      }

      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      showToast('Welcome back!', 'success');

      setTimeout(() => {
        window.location.href = `${user.role}-dashboard.html`;
      }, 1000);
    } else if (result.status === 403 && result.data.requiresVerification) {
      localStorage.setItem('verifyEmail', email);
      showToast('Please verify your email first', 'error');
      setTimeout(() => window.location.href = 'verify-otp.html', 1500);
    } else {
      showToast(result.data.message || 'Login failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });
}

// ===== HIDDEN ADMIN REGISTER FORM =====
const adminRegisterForm = document.getElementById('adminRegisterForm');
if (adminRegisterForm) {
  adminRegisterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('adminName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const adminCode = document.getElementById('adminSecretCode').value.trim();

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (!adminCode) {
      showToast('Admin Secret Code is required', 'error');
      return;
    }

    const btn = adminRegisterForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verifying...';

    const payload = { name, email, password, role: 'admin', adminCode };
    const result = await apiCall('/auth/register', 'POST', payload);

    if (result.ok) {
      localStorage.setItem('verifyEmail', email);
      localStorage.setItem('verifyName', name);
      showToast('✅ Admin OTP sent to your email!', 'success');
      setTimeout(() => window.location.href = 'verify-otp.html', 1500);
    } else {
      showToast(result.data.message || 'Admin registration failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Create Admin Account';
    }
  });
}

// ===== HIDDEN ADMIN LOGIN FORM =====
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    const btn = adminLoginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verifying...';

    const result = await apiCall('/auth/login', 'POST', { email, password });

    if (result.ok && result.data.token) {
      const user = result.data.user;

      if (user.role !== 'admin') {
        showToast('❌ This page is for admins only!', 'error');
        btn.disabled = false;
        btn.textContent = '🔐 Login as Admin';
        return;
      }

      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      showToast('✅ Welcome, Admin!', 'success');

      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 1000);
    } else {
      showToast(result.data.message || 'Login failed', 'error');
      btn.disabled = false;
      btn.textContent = '🔐 Login as Admin';
    }
  });
}