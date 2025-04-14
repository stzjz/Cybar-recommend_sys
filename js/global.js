document.addEventListener('DOMContentLoaded', () => {
    const userStatusDiv = document.getElementById('user-status');

    // Add class to body based on login status and role
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                document.body.classList.add('logged-in');
                document.body.classList.remove('logged-out');
                // Add is-admin class if user has admin role
                if (data.role === 'admin') {
                    document.body.classList.add('is-admin');
                } else {
                    document.body.classList.remove('is-admin');
                }
                if (userStatusDiv) {
                    userStatusDiv.innerHTML = `
                        <span>欢迎, ${data.username} ${data.role === 'admin' ? '(管理员)' : ''}</span> |
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
                document.body.classList.remove('is-admin'); // Ensure is-admin is removed when logged out
                if (userStatusDiv) {
                    userStatusDiv.innerHTML = `
                        <a href="/auth/login/">登录</a> |
                        <a href="/auth/register/">注册</a>
                    `;
                }
            }
            // Dispatch a custom event after status is known (optional, but can help)
            document.dispatchEvent(new CustomEvent('authStatusKnown', { detail: data }));
        })
        .catch(error => {
            console.error('Error fetching auth status:', error);
            document.body.classList.add('logged-out'); // Assume logged out on error
            document.body.classList.remove('logged-in');
            document.body.classList.remove('is-admin');
            if (userStatusDiv) {
                userStatusDiv.innerHTML = '<a href="/auth/login/">登录</a> | <a href="/auth/register/">注册</a>'; // Fallback
            }
             document.dispatchEvent(new CustomEvent('authStatusKnown', { detail: { loggedIn: false } }));
        });

    // Ensure userStatusDiv exists check is done only if needed
    // if (!userStatusDiv) {
    //     console.error('Element with ID "user-status" not found.');
    //     // return; // Don't return here, still need to set body class
    // }
});
