document.addEventListener('DOMContentLoaded', () => {
    const userStatusDiv = document.getElementById('user-status');
    const loginPrompt = document.getElementById('login-prompt'); // Get the login prompt element

    // Initially hide the prompt
    if (loginPrompt) {
        loginPrompt.style.display = 'none';
    }

    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            console.log('Auth Status Received:', data);
            if (data.loggedIn) {
                document.body.classList.add('logged-in');
                document.body.classList.remove('logged-out');

                // Hide login prompt when logged in
                if (loginPrompt) {
                    loginPrompt.style.display = 'none';
                }

                const userRole = data.role;
                console.log('User Role:', userRole);

                // Only check for 'is-admin' now
                if (userRole === 'admin') {
                    document.body.classList.add('is-admin');
                    console.log('Added class: is-admin');
                } else {
                    document.body.classList.remove('is-admin');
                }
                // Remove 'is-god' check
                document.body.classList.remove('is-god');

                // Update welcome message
                 if (userStatusDiv) {
                    let roleDisplay = '';
                    if (userRole === 'admin') roleDisplay = '(管理员)'; // Only show admin
                    // Remove god display
                    userStatusDiv.innerHTML = `
                        <span>欢迎, ${data.username} ${roleDisplay}</span> |
                        <a href="#" id="logout-link">注销</a>
                    `;
                    const logoutLink = document.getElementById('logout-link');
                    if (logoutLink) {
                        logoutLink.addEventListener('click', async (e) => {
                            e.preventDefault();
                            try {
                                const response = await fetch('/api/logout', { method: 'POST' });
                                if (response.ok) {
                                    window.location.href = '/auth/login/'; // Redirect after logout
                                } else {
                                    console.error('Logout failed');
                                    alert('注销失败，请稍后重试。');
                                }
                            } catch (error) {
                                console.error('Error during logout:', error);
                                alert('注销时发生错误。');
                            }
                        });
                    }
                }

            } else {
                document.body.classList.add('logged-out');
                document.body.classList.remove('logged-in');
                document.body.classList.remove('is-admin');
                document.body.classList.remove('is-god'); // Ensure removed

                // Show login prompt when logged out
                if (loginPrompt) {
                    loginPrompt.style.display = 'block';
                }

                if (userStatusDiv) {
                    userStatusDiv.innerHTML = `
                        <a href="/auth/login/">登录</a> |
                        <a href="/auth/register/">注册</a>
                    `;
                }
            }
            document.dispatchEvent(new CustomEvent('authStatusKnown', { detail: data }));
        })
        .catch(error => {
            console.error('Error fetching auth status:', error);
            document.body.classList.add('logged-out');
            document.body.classList.remove('logged-in');
            document.body.classList.remove('is-admin');
            document.body.classList.remove('is-god'); // Ensure removed

            // Show login prompt in case of error (likely logged out)
            if (loginPrompt) {
                loginPrompt.style.display = 'block';
            }

            if (userStatusDiv) {
                userStatusDiv.innerHTML = '<a href="/auth/login/">登录</a> | <a href="/auth/register/">注册</a>'; // Fallback
            }
             document.dispatchEvent(new CustomEvent('authStatusKnown', { detail: { loggedIn: false } }));
        });
});
