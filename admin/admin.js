// --- Updated DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Start of initialization logic (previously inside initializeAdminPage) ---
    const recipeListContainer = document.getElementById('admin-recipe-list');
    const userListContainer = document.getElementById('admin-user-list'); // Get user list container
    const statsContainer = document.getElementById('admin-stats');
    const refreshButton = document.getElementById('refresh-admin-data-btn'); // Get refresh button

    // --- Modal Elements ---
    const modal = document.getElementById('user-action-modal');
    const overlay = document.getElementById('modal-overlay');
    const closeModalBtn = modal.querySelector('.close-modal-btn');
    const modalUserIdInput = document.getElementById('modal-user-id');
    const modalUsernameTitle = document.getElementById('modal-username');
    const modalRoleSelect = document.getElementById('modal-role-select');
    const modalSaveRoleBtn = document.getElementById('modal-save-role-btn');
    const modalDeleteUserBtn = document.getElementById('modal-delete-user-btn');
    const modalMessage = document.getElementById('modal-message');

    // --- Keep the current initialization logic ---
    if (statsContainer) {
        loadStats(); // Ensure this function exists and works with current HTML
    } else {
        console.error("Stats container 'admin-stats' not found.");
    }

    if (recipeListContainer) {
        loadRecipesForAdmin(); // Ensure this function exists and works with current HTML
        // Add event listener for deleting recipes (using event delegation)
        recipeListContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-recipe-btn')) {
                const recipeId = event.target.dataset.id;
                if (recipeId && confirm(`确定要删除 ID 为 ${recipeId} 的配方吗？`)) {
                    deleteRecipe(recipeId); // Ensure this function exists
                }
            }
        });
    } else {
         console.error("Recipe list container 'admin-recipe-list' not found.");
         const msgElement = document.getElementById('admin-message');
         if(msgElement) msgElement.textContent = "无法加载配方列表容器。";
    }

    // --- Load Users ---
    if (userListContainer) {
        loadUsersForAdmin(); // Call function to load users

        // --- Add Event Listener for User Actions (using delegation) ---
        userListContainer.addEventListener('click', (event) => {
            const target = event.target;
            const userId = target.dataset.userId;

            if (!userId) return; // Ignore clicks not on buttons with user ID

            if (target.classList.contains('delete-user-btn')) {
                if (confirm(`确定要删除用户 ID 为 ${userId} 的账户吗？此操作无法撤销。`)) {
                    deleteUser(userId, target);
                }
            } else if (target.classList.contains('change-role-btn')) {
                const currentRole = target.dataset.currentRole;
                const newRole = prompt(`为用户 ID ${userId} 选择新角色 (user, admin):`, currentRole);
                if (newRole && newRole !== currentRole && ['user', 'admin'].includes(newRole)) {
                     updateUserRole(userId, newRole, target);
                } else if (newRole !== null) { // User entered something invalid or cancelled
                    alert('无效的角色或操作已取消。');
                }
            }
        });
        // --- End User Actions Listener ---

        // --- Event Listener for Opening Modal (Admins only) ---
        userListContainer.addEventListener('click', (event) => {
            // Check if the click is on a TR element within the tbody and user is admin
            const row = event.target.closest('tr');
            // Use 'is-admin' class now
            if (row && document.body.classList.contains('is-admin')) {
                const userId = row.dataset.userId;
                const username = row.dataset.username;
                const currentRole = row.dataset.currentRole || 'user';

                if (userId && username) {
                    openUserModal(userId, username, currentRole);
                }
            }
        });
    } else {
        console.error("User list container 'admin-user-list' not found.");
        const userMsgElement = document.getElementById('admin-user-message');
        if(userMsgElement) userMsgElement.textContent = "无法加载用户列表容器。";
    }

    // --- Add Event Listener for Refresh Button ---
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            console.log("Refresh button clicked.");
            // Show loading indicators while refreshing
            const statsMsg = document.getElementById('admin-stats');
            const recipeMsg = document.getElementById('admin-message');
            const recipeTbody = document.getElementById('admin-recipe-list');
            const userMsg = document.getElementById('admin-user-message');
            const userTbody = document.getElementById('admin-user-list');

            if(statsMsg) statsMsg.textContent = '正在刷新统计...';
            if(recipeMsg) recipeMsg.textContent = '正在刷新配方...';
            if(recipeTbody) recipeTbody.innerHTML = '<tr><td colspan="3">正在刷新...</td></tr>'; // Clear table body
            if(userMsg) userMsg.textContent = '正在刷新用户...';
            if(userTbody) userTbody.innerHTML = '<tr><td colspan="3">正在刷新...</td></tr>';

            // Call functions to reload data
            loadStats();
            loadRecipesForAdmin();
            loadUsersForAdmin(); // Reload users on refresh
        });
    } else {
        console.error("Refresh button 'refresh-admin-data-btn' not found.");
    }

    // --- Modal Control Event Listeners ---
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeUserModal);
    }
    if (overlay) {
        overlay.addEventListener('click', closeUserModal); // Close modal if overlay is clicked
    }
    if (modalSaveRoleBtn) {
        modalSaveRoleBtn.addEventListener('click', () => {
            const userId = modalUserIdInput.value;
            const newRole = modalRoleSelect.value;
            // Ensure newRole is valid (user or admin)
            if (userId && newRole && ['user', 'admin'].includes(newRole)) {
                 updateUserRole(userId, newRole, modalSaveRoleBtn);
            } else if (newRole && !['user', 'admin'].includes(newRole)) {
                 alert('无效的角色选择。'); // Add validation feedback
            }
        });
    }
    if (modalDeleteUserBtn) {
        modalDeleteUserBtn.addEventListener('click', () => {
            const userId = modalUserIdInput.value;
            const username = modalUsernameTitle.textContent.replace('管理用户: ', ''); // Get username for confirm msg
            if (userId && confirm(`确定要删除用户 "${username}" (ID: ${userId}) 吗？此操作无法撤销。`)) {
                deleteUser(userId, modalDeleteUserBtn); // Pass button for feedback
            }
        });
    }
    // --- End of initialization logic ---
});

// --- Function to open and populate the modal ---
function openUserModal(userId, username, currentRole) {
    const modal = document.getElementById('user-action-modal');
    const overlay = document.getElementById('modal-overlay');
    const modalUserIdInput = document.getElementById('modal-user-id');
    const modalUsernameTitle = document.getElementById('modal-username');
    const modalRoleSelect = document.getElementById('modal-role-select');
    const modalMessage = document.getElementById('modal-message');

    // Populate modal
    modalUserIdInput.value = userId;
    modalUsernameTitle.textContent = `管理用户: ${username}`;
    modalRoleSelect.value = currentRole;
    if(modalMessage) modalMessage.style.display = 'none'; // Hide previous messages

    // Ensure the select only shows valid options if needed, though HTML change is primary
    modalRoleSelect.value = currentRole;
    // Optionally disable 'god' if it somehow still exists
    const godOption = modalRoleSelect.querySelector('option[value="god"]');
    if (godOption) godOption.disabled = true;

    // Show modal and overlay
    if (modal) modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
}

// --- Function to close the modal ---
function closeUserModal() {
    const modal = document.getElementById('user-action-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    // Reset button states if needed
    const saveBtn = document.getElementById('modal-save-role-btn');
    const deleteBtn = document.getElementById('modal-delete-user-btn');
    if(saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '保存角色'; }
    if(deleteBtn) { deleteBtn.disabled = false; deleteBtn.textContent = '删除此用户'; }
}

// --- Function to load users for admin (Updated) ---
async function loadUsersForAdmin() {
    const container = document.getElementById('admin-user-list'); // Target tbody
    const messageElement = document.getElementById('admin-user-message');
    if (!container) return;
    if (messageElement) messageElement.textContent = '正在加载用户...';

    try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
             if (handleAuthError(response, messageElement)) return;
             throw new Error(`HTTP error! status: ${response.status}`);
        }
        const users = await response.json();

        container.innerHTML = ''; // Clear existing list
        if (users.length === 0) {
            container.innerHTML = `<tr><td colspan="4">没有用户可显示。</td></tr>`; // Adjust colspan
            if (messageElement) messageElement.textContent = '';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');

            // Always add data attributes if user is admin (which they must be to see this page)
            row.dataset.userId = user.id;
            row.dataset.username = user.username;
            row.dataset.currentRole = user.role || 'user';
            row.title = "点击管理此用户"; // Add tooltip

            // Always add an empty actions cell (content added via CSS/JS if needed, or keep empty)
            // Or directly add a button/icon to trigger the modal
            row.innerHTML = `
                <td>${user.id || 'N/A'}</td>
                <td>${user.username}</td>
                <td>${user.role || 'user'}</td>
                <td><button class="manage-user-btn" data-user-id="${user.id}" title="管理用户">管理</button></td>
            `;
            container.appendChild(row);
        });
        if (messageElement) messageElement.textContent = '';

    } catch (error) {
        console.error('Error loading users for admin:', error);
        const colspan = 4;
        if (container) container.innerHTML = `<tr><td colspan="${colspan}">加载用户列表失败。</td></tr>`; // Adjust colspan
        if (messageElement) {
            messageElement.textContent = '加载用户列表失败: ' + error.message;
            messageElement.style.color = 'red';
        }
    }
}

// --- Function to delete a user (Admin) ---
async function deleteUser(userId, buttonElement) {
    const modalMessage = document.getElementById('modal-message');
    buttonElement.disabled = true;
    buttonElement.textContent = '删除中...';
    if (modalMessage) { modalMessage.textContent = `正在删除用户 ${userId}...`; modalMessage.style.display = 'block'; modalMessage.style.color = 'inherit';}

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
        });

        if (response.ok || response.status === 204) {
            alert('用户删除成功！');
            closeUserModal(); // Close modal on success
            loadUsersForAdmin(); // Refresh the user list
        } else {
            if (handleAuthError(response, modalMessage)) { buttonElement.disabled = false; buttonElement.textContent = '删除此用户'; return; }
            let errorResult = { message: `删除失败 (${response.status})` };
            try { errorResult = await response.json(); } catch (e) {}
            console.error('Error deleting user:', response.status, errorResult);
            if (modalMessage) {
                modalMessage.textContent = `删除用户失败: ${errorResult.message}`;
                modalMessage.style.color = 'red';
                modalMessage.style.display = 'block';
            }
            buttonElement.disabled = false;
            buttonElement.textContent = '删除此用户';
        }
    } catch (error) {
        console.error('Network error deleting user:', error);
        if (modalMessage) {
            modalMessage.textContent = '删除用户时发生网络错误。';
            modalMessage.style.color = 'red';
            modalMessage.style.display = 'block';
        }
        buttonElement.disabled = false;
        buttonElement.textContent = '删除此用户';
    }
}

// --- Function to update user role (Admin) ---
async function updateUserRole(userId, newRole, buttonElement) {
    const modalMessage = document.getElementById('modal-message');
    buttonElement.disabled = true;
    buttonElement.textContent = '保存中...';
    if (modalMessage) { modalMessage.textContent = `正在修改用户 ${userId} 角色为 ${newRole}...`; modalMessage.style.display = 'block'; modalMessage.style.color = 'inherit';}

    // Ensure newRole validation matches allowed roles ('user', 'admin')
    if (!['user', 'admin'].includes(newRole)) {
        alert('无法将角色设置为 ' + newRole);
        buttonElement.disabled = false;
        buttonElement.textContent = '保存角色';
        return;
    }

    try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newRole: newRole }),
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message || '角色修改成功！');
            closeUserModal(); // Close modal on success
            loadUsersForAdmin(); // Refresh the user list
        } else {
            if (handleAuthError(response, modalMessage)) { buttonElement.disabled = false; buttonElement.textContent = '保存角色'; return; }
            let errorResult = { message: `修改失败 (${response.status})` };
            try { errorResult = await response.json(); } catch (e) {}
            console.error('Error updating role:', response.status, errorResult);
            if (modalMessage) {
                modalMessage.textContent = `修改角色失败: ${errorResult.message}`;
                modalMessage.style.color = 'red';
                modalMessage.style.display = 'block';
            }
            buttonElement.disabled = false;
            buttonElement.textContent = '保存角色';
        }
    } catch (error) {
        console.error('Network error updating role:', error);
        if (modalMessage) {
            modalMessage.textContent = '修改角色时发生网络错误。';
            modalMessage.style.color = 'red';
            modalMessage.style.display = 'block';
        }
        buttonElement.disabled = false;
        buttonElement.textContent = '保存角色';
    }
}

async function loadRecipesForAdmin() {
    const container = document.getElementById('admin-recipe-list'); // Target tbody
    const messageElement = document.getElementById('admin-message');
    if (!container) return;
    if (messageElement) messageElement.textContent = '正在加载配方...';

    try {
        const response = await fetch('/api/recipes');
        if (!response.ok) {
             if (handleAuthError(response, messageElement)) return;
             throw new Error(`HTTP error! status: ${response.status}`);
        }
        const recipes = await response.json();

        container.innerHTML = ''; // Clear existing list (tbody content)
        if (recipes.length === 0) {
            container.innerHTML = '<tr><td colspan="3">没有配方可管理。</td></tr>';
            if (messageElement) messageElement.textContent = '';
            return;
        }

        recipes.forEach(recipe => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${recipe.id || 'N/A'}</td>
                <td>${recipe.name}</td>
                <td>
                    <button class="delete-recipe-btn" data-id="${recipe.id}">删除</button>
                </td>
            `;
            container.appendChild(row);
        });
        if (messageElement) messageElement.textContent = '';

    } catch (error) {
        console.error('Error loading recipes for admin:', error);
        if (container) container.innerHTML = '<tr><td colspan="3">加载配方列表失败。</td></tr>';
        if (messageElement) {
            messageElement.textContent = '加载配方列表失败: ' + error.message;
            messageElement.style.color = 'red';
        }
        // Don't call handleAuthError again if it was already checked in !response.ok
    }
}

async function deleteRecipe(recipeId) {
    const messageElement = document.getElementById('admin-message');
    if (messageElement) {
        messageElement.textContent = `正在删除配方 ${recipeId}...`;
        messageElement.style.color = 'inherit'; // Reset color
    }

    try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
            method: 'DELETE',
        });

        if (response.ok || response.status === 204) {
            alert('配方删除成功！');
            if (messageElement) messageElement.textContent = '配方删除成功！';
            loadRecipesForAdmin(); // Refresh the list
        } else {
             if (handleAuthError(response, messageElement)) return;

             let errorResult = { message: `删除失败 (${response.status})` };
             try {
                 const contentType = response.headers.get("content-type");
                 if (contentType && contentType.includes("application/json")) {
                    errorResult = await response.json();
                 } else { errorResult.message = response.statusText || errorResult.message; }
             } catch (e) { errorResult.message = response.statusText || errorResult.message; }

             console.error('Error deleting recipe:', response.status, errorResult);
             alert(`删除失败: ${errorResult.message}`);
             if (messageElement) {
                 messageElement.textContent = `删除失败: ${errorResult.message}`;
                 messageElement.style.color = 'red';
             }
        }
    } catch (error) {
        console.error('Network or script error during deletion:', error);
        alert('删除配方时发生网络错误。');
        if (messageElement) {
            messageElement.textContent = '删除配方时发生网络错误。';
            messageElement.style.color = 'red';
        }
    }
}

let pageVisitsChartInstance = null; // Variable to hold the chart instance

async function loadStats() {
    const statsContainer = document.getElementById('admin-stats');
    const messageElement = document.getElementById('admin-message');
    const totalRecipesEl = document.getElementById('stat-total-recipes');
    const totalUsersEl = document.getElementById('stat-total-users');
    // Remove reference to old page visits list UL if it was removed from HTML
    // const pageVisitsList = document.getElementById('stat-page-visits');
    const chartCanvas = document.getElementById('pageVisitsChart'); // Get canvas element

    // Basic check for chart context
    if (!chartCanvas) {
        console.error("Chart canvas element 'pageVisitsChart' not found.");
        // Optionally display an error message in statsContainer
        if(statsContainer) statsContainer.textContent = '无法加载图表容器。';
        return; // Stop if canvas doesn't exist
    }
    const ctx = chartCanvas.getContext('2d');
    if (!ctx) {
         console.error("Failed to get 2D context for chart canvas.");
         if(statsContainer) statsContainer.textContent = '无法初始化图表。';
         return; // Stop if context fails
    }


    if (!statsContainer || !totalRecipesEl || !totalUsersEl) {
        console.error("One or more stats text elements not found.");
        return;
    }
    statsContainer.textContent = '正在加载统计数据...';
    if (messageElement) messageElement.textContent = '';

    try {
        const response = await fetch('/api/admin/stats');

        if (!response.ok) {
            if (handleAuthError(response, messageElement || statsContainer)) return;
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stats = await response.json();

        // Update text stats
        totalRecipesEl.textContent = stats.totalRecipes ?? 'N/A';
        totalUsersEl.textContent = stats.totalUsers ?? 'N/A';

        // --- Prepare data for Chart.js ---
        const visitsData = stats.visits || {};
        const pageLabels = Object.keys(visitsData);
        const visitCounts = Object.values(visitsData);

        // --- Create/Update Chart.js Chart ---
        const chartData = {
            labels: pageLabels,
            datasets: [{
                label: '页面访问次数',
                data: visitCounts,
                backgroundColor: [ // Example colors - add more if needed
                    'rgba(0, 229, 255, 0.6)', // Cyan
                    'rgba(255, 64, 129, 0.6)', // Pink
                    'rgba(255, 152, 0, 0.6)',  // Orange
                    'rgba(76, 175, 80, 0.6)',   // Green
                    'rgba(156, 39, 176, 0.6)', // Purple
                    'rgba(255, 235, 59, 0.6)', // Yellow
                ],
                borderColor: [ // Example border colors
                    'rgba(0, 229, 255, 1)',
                    'rgba(255, 64, 129, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(76, 175, 80, 1)',
                    'rgba(156, 39, 176, 1)',
                    'rgba(255, 235, 59, 1)',
                ],
                borderWidth: 1
            }]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false, // Allow chart to fill container height/width
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                         color: '#e0e0e0' // Light color for Y-axis labels
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)' // Light grid lines
                    }
                },
                x: {
                     ticks: {
                         color: '#e0e0e0' // Light color for X-axis labels
                     },
                     grid: {
                        color: 'rgba(255, 255, 255, 0.1)' // Light grid lines
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend for a cleaner look with few datasets
                },
                title: {
                    display: true,
                    text: '页面访问统计',
                    color: '#ffffff', // White title
                    font: { size: 16 }
                }
            }
        };

        // Destroy previous chart instance if it exists before creating a new one
        if (pageVisitsChartInstance) {
            pageVisitsChartInstance.destroy();
        }

        // Create the new chart
        pageVisitsChartInstance = new Chart(ctx, {
            type: 'bar', // Or 'pie', 'line', etc.
            data: chartData,
            options: chartOptions
        });
        // --- End Chart.js ---


        statsContainer.textContent = ''; // Clear loading message

    } catch (error) {
        console.error('Error loading stats:', error);
        const errorMsg = `加载统计数据失败: ${error.message || '未知错误'}`;
        statsContainer.textContent = errorMsg;
        statsContainer.style.color = 'red';
        // Clear text stats on error
        totalRecipesEl.textContent = '错误';
        totalUsersEl.textContent = '错误';
        // Optionally clear or hide the chart canvas on error
        if (pageVisitsChartInstance) {
            pageVisitsChartInstance.destroy();
            pageVisitsChartInstance = null;
        }
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height); // Clear canvas

        if (messageElement) {
            messageElement.textContent = errorMsg;
            messageElement.style.color = 'red';
        }
    }
}

// Helper function to check for authentication errors and redirect
function handleAuthError(responseOrError, messageElement) {
    const status = responseOrError?.status;
    if (status === 401 || status === 403) {
         if (messageElement) {
             messageElement.textContent = '会话无效或未登录，请重新登录。正在跳转...';
             messageElement.style.color = 'red'; // Ensure error color
         }
         setTimeout(() => {
             window.location.href = '/auth/login/';
         }, 1500);
         return true;
    }
    return false;
}
