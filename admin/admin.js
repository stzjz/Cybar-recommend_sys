// --- Updated DOMContentLoaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Start of initialization logic (previously inside initializeAdminPage) ---
    const recipeListContainer = document.getElementById('admin-recipe-list');
    const statsContainer = document.getElementById('admin-stats');
    const refreshButton = document.getElementById('refresh-admin-data-btn'); // Get refresh button

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

    // --- Add Event Listener for Refresh Button ---
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            console.log("Refresh button clicked.");
            // Show loading indicators while refreshing
            const statsMsg = document.getElementById('admin-stats');
            const recipeMsg = document.getElementById('admin-message');
            const recipeTbody = document.getElementById('admin-recipe-list');

            if(statsMsg) statsMsg.textContent = '正在刷新统计...';
            if(recipeMsg) recipeMsg.textContent = '正在刷新配方...';
            if(recipeTbody) recipeTbody.innerHTML = '<tr><td colspan="3">正在刷新...</td></tr>'; // Clear table body

            // Call functions to reload data
            loadStats();
            loadRecipesForAdmin();
        });
    } else {
        console.error("Refresh button 'refresh-admin-data-btn' not found.");
    }
    // --- End of initialization logic ---
});

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

async function loadStats() {
    const statsContainer = document.getElementById('admin-stats'); // General message area for stats
    const messageElement = document.getElementById('admin-message'); // Use general message area too
    const totalRecipesEl = document.getElementById('stat-total-recipes');
    const totalUsersEl = document.getElementById('stat-total-users');
    const pageVisitsList = document.getElementById('stat-page-visits'); // Get the UL for page visits

    if (!statsContainer || !totalRecipesEl || !totalUsersEl || !pageVisitsList) { // Check for pageVisitsList
        console.error("One or more stats elements not found.");
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

        totalRecipesEl.textContent = stats.totalRecipes ?? 'N/A';
        totalUsersEl.textContent = stats.totalUsers ?? 'N/A';

        // --- Update Page Visit Counts ---
        const visitSpans = pageVisitsList.querySelectorAll('span[data-path]');
        visitSpans.forEach(span => {
            const path = span.dataset.path;
            // Use stats.visits (the object containing counts)
            span.textContent = stats.visits && stats.visits[path] !== undefined ? stats.visits[path] : 'N/A';
        });
        // --- End Update Page Visit Counts ---

        statsContainer.textContent = ''; // Clear loading message

    } catch (error) {
        console.error('Error loading stats:', error);
        const errorMsg = `加载统计数据失败: ${error.message || '未知错误'}`;
        statsContainer.textContent = errorMsg; // Show error in stats area
        statsContainer.style.color = 'red';
        // Also clear specific stat values
        totalRecipesEl.textContent = '错误';
        totalUsersEl.textContent = '错误';
        const visitSpans = pageVisitsList.querySelectorAll('span[data-path]');
        visitSpans.forEach(span => { span.textContent = '错误'; }); // Clear visit counts too
        if (messageElement) { // Show in general message area too
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
