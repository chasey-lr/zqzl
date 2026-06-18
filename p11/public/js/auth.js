const API_BASE = '/api';

function showError(message) {
  const errorBar = document.getElementById('errorBar');
  if (errorBar) {
    errorBar.textContent = message;
    errorBar.classList.add('show');
    setTimeout(() => {
      errorBar.classList.remove('show');
    }, 3000);
  }
}

async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(API_BASE + url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '操作失败');
    }

    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      showError('操作失败，请重试');
    } else {
      showError(error.message || '操作失败，请重试');
    }
    throw error;
  }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showError('请填写完整信息');
      return;
    }

    try {
      const result = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      window.location.href = '/todos';
    } catch (error) {
      
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!email || !password || !confirmPassword) {
      showError('请填写完整信息');
      return;
    }

    if (password !== confirmPassword) {
      showError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      showError('密码长度至少6位');
      return;
    }

    try {
      const result = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      window.location.href = '/todos';
    } catch (error) {
      
    }
  });
}

function checkAuth() {
  const token = localStorage.getItem('token');
  const currentPath = window.location.pathname;
  
  const isAuthPage = currentPath === '/login' || 
                     currentPath === '/login.html' || 
                     currentPath === '/register' || 
                     currentPath === '/register.html' ||
                     currentPath === '/';

  if (token && isAuthPage) {
    window.location.href = '/todos';
  } else if (!token && !isAuthPage) {
    window.location.href = '/login';
  }
}

checkAuth();
