// --- !! INSECURE CLIENT-SIDE PASSWORD CHECK !! ---
const correctPassword = "19241112"; // Password stored directly in client-side code!
let isAuthenticated = false;

function checkPassword() {
    const enteredPassword = prompt("请输入后台管理密码:");
    if (enteredPassword === correctPassword) {
        isAuthenticated = true;
        // Show main content if hidden
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.style.display = 'block';
        initializeAdminPage(); // Run the rest of the setup
    } else if (enteredPassword !== null) { // User entered something incorrect
        alert("密码错误！");
        // Optionally hide content or redirect
        const mainContent = document.querySelector('main');
        if (mainContent) mainContent.style.display = 'none';
        document.body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">访问被拒绝。</p>'; // Or redirect
    } else { // User cancelled the prompt
         const mainContent = document.querySelector('main');
         if (mainContent) mainContent.style.display = 'none';
         document.body.innerHTML = '<p style="text-align: center; margin-top: 50px;">需要密码才能访问。</p>';
    }
}
// --- End of Insecure Check ---


// Wrap the original code in a function to be called after successful auth
function initializeAdminPage() {
    if (!isAuthenticated) return; // Double check

    // --- Original DOMContentLoaded content starts here ---
    // REMOVE: const addForm = document.getElementById('add-recipe-form');
    const deleteForm = document.getElementById('delete-recipe-form');
    // REMOVE: const addMessageDiv = document.getElementById('add-message');
    const deleteMessageDiv = document.getElementById('delete-message');
    const recipeListUl = document.getElementById('recipe-list-admin');
    const refreshBtn = document.getElementById('refresh-list-btn');
    // REMOVE: const ingredientsListDiv = document.getElementById('ingredients-list');
    // REMOVE: const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const deleteSelect = document.getElementById('delete-recipe-select');
    const logoutBtn = document.getElementById('logout-btn'); // Get logout button
    // Add stats elements
    const statsList = document.getElementById('stats-list');
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');

    // --- REMOVE: 函数：添加新的成分输入行 ---
    /*
    const addIngredientRow = () => {
        // ... function content ...
    };
    */

    // --- REMOVE: 事件监听：点击 "添加成分" 按钮 ---
    /*
    if (addIngredientBtn) {
        addIngredientBtn.addEventListener('click', addIngredientRow);
    }
    */

    // --- REMOVE: 事件监听：点击初始的 "移除" 按钮 ---
    /*
    ingredientsListDiv.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        // ... listener content ...
    });
    */


    // --- 函数：加载当前配方列表 (并填充删除下拉列表) ---
    const loadRecipes = () => {
        recipeListUl.innerHTML = '<li>正在加载...</li>'; // 清空并显示加载中
        deleteSelect.innerHTML = '<option value="" disabled selected>-- 正在加载 --</option>'; // Clear and show loading in select

        fetch('/api/recipes')
            .then(response => response.ok ? response.json() : Promise.reject('无法加载列表'))
            .then(recipes => {
                recipeListUl.innerHTML = ''; // 清空列表
                deleteSelect.innerHTML = '<option value="" disabled selected>-- 请选择 --</option>'; // Clear select and add default

                if (recipes.length === 0) {
                    recipeListUl.innerHTML = '<li>暂无配方。</li>';
                    deleteSelect.disabled = true; // Disable select if no recipes
                } else {
                    deleteSelect.disabled = false; // Enable select
                    recipes.forEach(recipe => {
                        const li = document.createElement('li');
                        // Display name and calculated ABV
                        li.textContent = `${recipe.name} (~${recipe.estimatedAbv ? recipe.estimatedAbv.toFixed(1) : 'N/A'}% ABV)`;
                        recipeListUl.appendChild(li);

                        // Populate the select dropdown
                        const option = document.createElement('option');
                        option.value = recipe.name; // Use name as value
                        option.textContent = recipe.name;
                        deleteSelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                recipeListUl.innerHTML = '<li>加载列表失败。</li>';
                deleteSelect.innerHTML = '<option value="" disabled selected>-- 加载失败 --</option>';
                deleteSelect.disabled = true;
                console.error('加载配方列表错误:', error);
            });
    };

    // --- 函数：加载访问统计 (Simplified) ---
    const loadStats = () => {
        const statHomeSpan = document.getElementById('stat-home');
        if (!statHomeSpan) return; // Exit if element doesn't exist

        // Display loading state
        statHomeSpan.textContent = '加载中...';

        fetch('/api/stats')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(stats => {
                // Update only the home count
                statHomeSpan.textContent = stats.home || 0;
            })
            .catch(error => {
                console.error('加载统计数据错误:', error);
                 // Update only the home count span on error
                 statHomeSpan.textContent = '错误';
            });
    };

    // --- REMOVE: 事件监听：添加配方 ---
    /*
    if (addForm) {
        addForm.addEventListener('submit', (event) => {
            // ... listener content ...
        });
    }
    */

    // --- 事件监听：删除配方 (修改为使用下拉列表) ---
     if (deleteForm) {
        deleteForm.addEventListener('submit', (event) => {
            event.preventDefault();
            deleteMessageDiv.textContent = ''; // 清除旧消息

            const nameToDelete = deleteSelect.value; // Get value from the select dropdown

            if (!nameToDelete) { // Check if a valid option is selected
                deleteMessageDiv.textContent = '错误：请选择一个要删除的配方。';
                deleteMessageDiv.style.color = 'red';
                return;
            }

            // Confirm before deleting
            if (!confirm(`确定要删除配方 "${nameToDelete}" 吗？此操作无法撤销。`)) {
                return; // Stop if user cancels
            }

            // 对名称进行 URL 编码，以防名称中包含特殊字符
            const encodedName = encodeURIComponent(nameToDelete);

            fetch(`/api/recipes/${encodedName}`, {
                method: 'DELETE',
            })
            .then(response => response.json().then(data => ({ status: response.status, body: data })))
            .then(({ status, body }) => {
                 if (status === 200) {
                    deleteMessageDiv.textContent = body.message;
                    deleteMessageDiv.style.color = 'green';
                    // deleteForm.reset(); // Resetting select might not be desired, just reload
                    loadRecipes(); // 刷新列表
                } else {
                    deleteMessageDiv.textContent = `错误: ${body.message || '无法删除配方'}`;
                    deleteMessageDiv.style.color = 'red';
                }
            })
            .catch(error => {
                deleteMessageDiv.textContent = '删除时发生网络错误。';
                deleteMessageDiv.style.color = 'red';
                console.error('删除配方错误:', error);
            });
        });
    }

    // --- 事件监听：刷新列表按钮 (Also refresh stats) ---
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadRecipes();
            loadStats(); // Refresh stats when refreshing recipe list
        });
    }
    // --- NEW 事件监听：刷新统计按钮 ---
    if (refreshStatsBtn) {
         refreshStatsBtn.addEventListener('click', loadStats);
    }

    // --- 事件监听：登出按钮 ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            fetch('/api/logout', {
                method: 'POST',
            })
            .then(response => response.json().then(data => ({ status: response.status, body: data })))
            .then(({ status, body }) => {
                if (status === 200) {
                    // Logout successful, redirect to login page
                    alert('已成功登出。');
                    window.location.href = '/admin/login.html';
                } else {
                    alert(`登出失败: ${body.message || '未知错误'}`);
                }
            })
            .catch(error => {
                alert('登出时发生网络错误。');
                console.error('Logout error:', error);
            });
        });
    }

    // --- 初始加载配方列表 ---
    loadRecipes();
    loadStats(); // Load stats initially
    // --- End of Original DOMContentLoaded content ---
}

// Run the password check when the DOM is ready
document.addEventListener('DOMContentLoaded', checkPassword);

document.addEventListener('DOMContentLoaded', () => {
    // Ensure elements exist before adding listeners or loading data
    const recipeListContainer = document.getElementById('admin-recipe-list');
    const statsContainer = document.getElementById('admin-stats');

    if (statsContainer) {
        loadStats();
    } else {
        console.error("Stats container 'admin-stats' not found.");
    }

    if (recipeListContainer) {
        loadRecipesForAdmin();
        // Add event listener for deleting recipes (using event delegation)
        recipeListContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-recipe-btn')) {
                const recipeId = event.target.dataset.id;
                if (recipeId && confirm(`确定要删除 ID 为 ${recipeId} 的配方吗？`)) {
                    deleteRecipe(recipeId);
                }
            }
        });
    } else {
         console.error("Recipe list container 'admin-recipe-list' not found.");
         const msgElement = document.getElementById('admin-message');
         if(msgElement) msgElement.textContent = "无法加载配方列表容器。";
    }
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
