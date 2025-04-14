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
