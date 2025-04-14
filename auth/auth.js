document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const message = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            errorMessage.textContent = ''; // Clear previous errors

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    // Redirect to home or dashboard after successful login
                    window.location.href = '/';
                } else {
                    errorMessage.textContent = result.message || '登录失败';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMessage.textContent = '发生错误，请稍后重试';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            message.textContent = ''; // Clear previous messages
            message.style.color = 'inherit';

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    message.textContent = '注册成功！正在跳转到登录页面...';
                    message.style.color = 'green';
                    setTimeout(() => {
                        window.location.href = '/auth/login/';
                    }, 2000);
                } else {
                    message.textContent = result.message || '注册失败';
                    message.style.color = 'red';
                }
            } catch (error) {
                console.error('Registration error:', error);
                message.textContent = '发生错误，请稍后重试';
                message.style.color = 'red';
            }
        });
    }
});
