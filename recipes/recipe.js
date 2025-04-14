document.addEventListener('DOMContentLoaded', () => {
    const recipeId = window.location.pathname.split('/').filter(Boolean).pop(); // Get ID from URL
    console.log('Recipe Page Loaded for ID:', recipeId); // Log ID

    const recipeNameEl = document.getElementById('recipe-name');
    const ingredientsListEl = document.getElementById('ingredients-list');
    const instructionsEl = document.getElementById('instructions');
    const estimatedAbvEl = document.getElementById('estimated-abv');
    const visitCountEl = document.getElementById('visit-count');
    // Removed likeCountDisplayEl, likeBtn, loginToLikeEl

    // --- REMOVED Function to update Like Button State ---
    /*
    function updateLikeButton(liked, likeCount) {
        // ... removed implementation ...
    }
    */

    // --- Fetch Recipe Details ---
    async function loadRecipeDetails() {
        console.log('Fetching recipe details from API...');
        if (!recipeId) {
            console.error('Recipe ID is missing.');
            recipeNameEl.textContent = '无效的配方 ID';
            return;
        }
        try {
            const response = await fetch(`/api/recipes/${recipeId}/details`);
            console.log('API Response Status:', response.status); // Log status
            if (!response.ok) {
                const errorText = await response.text(); // Get error text from response
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const recipe = await response.json();
            console.log('Recipe Data Received:', recipe); // Log received data

            // Check if elements exist before updating
            if (recipeNameEl) recipeNameEl.textContent = recipe.name;
            if (instructionsEl) instructionsEl.textContent = recipe.instructions || '暂无说明';
            if (estimatedAbvEl) estimatedAbvEl.textContent = recipe.estimatedAbv ? `~${recipe.estimatedAbv.toFixed(1)}%` : 'N/A';
            if (visitCountEl) visitCountEl.textContent = `访问: ${recipe.visitCount || 0}`;

            if (ingredientsListEl) {
                ingredientsListEl.innerHTML = ''; // Clear loading
                if (recipe.ingredients && recipe.ingredients.length > 0) {
                    recipe.ingredients.forEach(ing => {
                        const li = document.createElement('li');
                        li.textContent = `${ing.name}: ${ing.volume}ml${ing.abv > 0 ? ` (${ing.abv}%)` : ''}`;
                        ingredientsListEl.appendChild(li);
                    });
                } else {
                    ingredientsListEl.innerHTML = '<li>暂无成分信息</li>';
                }
            } else {
                 console.error('Ingredients list element not found!');
            }

            // --- REMOVED Update like button call ---
            // updateLikeButton(recipe.liked, recipe.likeCount || 0);

        } catch (error) {
            console.error('Error loading recipe details:', error);
            if (recipeNameEl) recipeNameEl.textContent = '加载配方详情失败';
            // Optionally display error to user more prominently
        }
    }

    // --- REMOVED Like Button Event Listener ---
    /*
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            console.log('Like button clicked.'); // Log click
            // Double check login status just before API call
            if (!document.body.classList.contains('logged-in')) {
                alert('请先登录再点赞！');
                console.warn('Attempted to like while logged out.');
                return;
            }
            likeBtn.disabled = true; // Disable during request

            try {
                console.log('Sending toggle like request...');
                const response = await fetch(`/api/recipes/${recipeId}/toggle_like`, {
                    method: 'POST',
                });
                const result = await response.json();
                console.log('Toggle like response:', result); // Log result

                if (response.ok && result.success) {
                    updateLikeButton(result.liked, result.likeCount);
                } else {
                    alert(`操作失败: ${result.message || '未知错误'}`);
                    likeBtn.disabled = false; // Re-enable on failure
                }
            } catch (error) {
                console.error('Error toggling like:', error);
                alert('网络错误，请稍后重试。');
                likeBtn.disabled = false; // Re-enable on network error
            }
        });
    } else {
        console.error('Like button element not found!');
    }
    */

    // --- Initial Load ---
    // Wait for auth status to be known before loading details that depend on it (like button state)
    document.addEventListener('authStatusKnown', (event) => {
        console.log('Auth status known event received:', event.detail);
        loadRecipeDetails(); // Load details after knowing login status
    });
    // Fallback if authStatusKnown event doesn't fire (e.g., error in global.js)
    // setTimeout(loadRecipeDetails, 500); // Or load after a small delay

    // --- Comments Logic (Keep existing comments logic here) ---
    // ... existing code for loading and posting comments ...
});
