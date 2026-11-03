const API_BASE_URL = 'http://localhost:5000/api';

async function apiCall(endpoint, method = 'GET', data = null, requiresAuth = false, isFormData = false) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (data) config.body = isFormData ? data : JSON.stringify(data);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();
    return { ok: response.ok, status: response.status, data: result };
  } catch (error) {
    return { ok: false, status: 0, data: { message: 'Server se connect nahi ho paya ❌' } };
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function checkAuth(requiredRole = null) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!token || !user) {
    window.location.href = 'login.html';
    return null;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = `${user.role}-dashboard.html`;
    return null;
  }
  
  return user;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `<span style="font-size:1.3rem;">${type === 'success' ? '✅' : '❌'}</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.4s reverse';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getStatusColor(status) {
  const colors = {
    pending: 'warning', reviewed: 'info',
    accepted: 'success', rejected: 'danger',
  };
  return colors[status] || 'secondary';
}

// ✅ NEW: XSS Protection
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}