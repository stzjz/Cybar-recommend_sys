document.addEventListener('DOMContentLoaded', () => {
    const userStatusDiv = document.getElementById('user-status');

    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            console.log('[global.js] Auth Status Received:', data); // Log received data
            if (data.loggedIn) {
                document.body.classList.add('logged-in');
                document.body.classList.remove('logged-out');
                console.log('[global.js] Added class: logged-in'); // Log class add

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
                console.log('[global.js] Added class: logged-out'); // Log class add
                if (userStatusDiv) {
                    userStatusDiv.innerHTML = `
                        <a href="/auth/login/">登录</a> |
                        <a href="/auth/register/">注册</a>
                    `;
                }
            }
            // Dispatch custom event AFTER updating body class
            console.log('[global.js] Dispatching authStatusKnown event.');
            document.dispatchEvent(new CustomEvent('authStatusKnown', { detail: data }));
        })
        .catch(error => {
            console.error('[global.js] Error fetching auth status:', error);
            document.body.classList.add('logged-out'); // Assume logged out on error
            document.body.classList.remove('logged-in');
            document.body.classList.remove('is-admin');
            document.body.classList.remove('is-god'); // Ensure removed
            if (userStatusDiv) {
                userStatusDiv.innerHTML = '<a href="/auth/login/">登录</a> | <a href="/auth/register/">注册</a>'; // Fallback
            }
            // Dispatch event even on error so dependent scripts can proceed
            console.log('[global.js] Dispatching authStatusKnown event after error.');
            document.dispatchEvent(new CustomEvent('authStatusKnown', { detail: { loggedIn: false } }));
        });
});
