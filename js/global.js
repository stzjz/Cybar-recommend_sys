document.addEventListener('DOMContentLoaded', () => {
    const userStatusDiv = document.getElementById('user-status');

    if (!userStatusDiv) {
        console.error('Element with ID "user-status" not found.');
        return;
    }

    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                userStatusDiv.innerHTML = `
                    <span>欢迎, ${data.username}</span> |
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
            } else {
                userStatusDiv.innerHTML = `
                    <a href="/auth/login/">登录</a> |
                    <a href="/auth/register/">注册</a>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching auth status:', error);
            userStatusDiv.innerHTML = '<a href="/auth/login/">登录</a> | <a href="/auth/register/">注册</a>'; // Fallback
        });
});
