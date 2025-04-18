document.addEventListener('DOMContentLoaded', () => {
    const recipesContainer = document.getElementById('recipes-container');
    const loadingMessage = document.getElementById('loading-message');
    const paginationControls = document.getElementById('pagination-controls');
    let currentPage = 1; // Keep track of the current page

    const displayRecipes = (data) => {
        recipesContainer.innerHTML = ''; // Clear previous recipes or loading message
        loadingMessage.style.display = 'none'; // Hide loading message
        recipesContainer.style.display = 'block'; // Show container

        if (!data.recipes || data.recipes.length === 0) {
            recipesContainer.innerHTML = '<p>没有找到配方。</p>';
            return;
        }

        data.recipes.forEach(recipe => {
            const article = document.createElement('article');
            article.classList.add('cocktail'); // Use existing class for styling

            const nameHeading = document.createElement('h3');
            const nameLink = document.createElement('a');
            // Use recipe.id for the detail link and correct filename
            nameLink.href = `detail.html?id=${recipe.id}`; // Corrected link to detail.html
            // Display name and ABV
            nameLink.textContent = `${recipe.name} (~${recipe.estimatedAbv ? recipe.estimatedAbv.toFixed(1) : 'N/A'}% ABV)`;
            nameHeading.appendChild(nameLink);
            article.appendChild(nameHeading);

            // --- Add Creator Info ---
            const creatorInfo = document.createElement('p');
            creatorInfo.classList.add('recipe-creator'); // Add class for styling
            creatorInfo.textContent = `由 ${recipe.createdBy || '未知用户'} 创建`;
            article.appendChild(creatorInfo);
            // --- End Creator Info ---

            // --- Add Interaction Counts (Likes & Favorites) ---
            const interactionInfo = document.createElement('div');
            interactionInfo.classList.add('interaction-info'); // Add class for styling
            // Use counts directly from the recipe data
            const likeCount = recipe.likeCount !== undefined ? recipe.likeCount : 0;
            const favoriteCount = recipe.favoriteCount !== undefined ? recipe.favoriteCount : 0;
            interactionInfo.textContent = `👍 ${likeCount} | ⭐ ${favoriteCount}`;
            article.appendChild(interactionInfo);
            // --- End Interaction Counts ---

            // Optionally display brief ingredients or instructions here if needed
            const instructions = document.createElement('p');
            // Ensure instructions exist before trying to access substring
            instructions.textContent = `做法：${recipe.instructions ? recipe.instructions.substring(0, 100) + '...' : '无说明'}`; // Example snippet with check
            article.appendChild(instructions);

            recipesContainer.appendChild(article);

            // REMOVED: loadInteractionCounts(recipe.id, article); - Counts are now included directly
        });

        // --- Render Pagination Controls ---
        renderPagination(data.totalPages, data.currentPage);
    };

    // REMOVED: Function to load interaction counts for a recipe (loadInteractionCounts)

    // Function to fetch recipes for a specific page
    const fetchRecipes = async (page = 1) => {
        loadingMessage.style.display = 'block'; // Show loading message
        recipesContainer.style.display = 'none'; // Hide container while loading
        paginationControls.innerHTML = ''; // Clear pagination while loading

        try {
            // Fetch recipes with pagination parameters
            const response = await fetch(`/api/recipes?page=${page}&limit=10`); // Assuming 10 items per page
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            currentPage = data.currentPage; // Update current page tracker
            displayRecipes(data);
        } catch (error) {
            console.error('无法加载配方:', error);
            loadingMessage.textContent = '加载配方失败。请稍后重试。';
            loadingMessage.style.color = 'red';
            recipesContainer.style.display = 'none'; // Keep container hidden on error
        }
    };

    // Function to render pagination controls
    const renderPagination = (totalPages, currentPage) => {
        paginationControls.innerHTML = ''; // Clear existing controls

        if (totalPages <= 1) {
            return; // No pagination needed for single page
        }

        // Previous Button
        const prevButton = document.createElement('button');
        prevButton.textContent = '上一页';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                fetchRecipes(currentPage - 1);
            }
        });
        paginationControls.appendChild(prevButton);

        // Page Info Span
        const pageInfo = document.createElement('span');
        pageInfo.textContent = ` 第 ${currentPage} / ${totalPages} 页 `;
        pageInfo.style.margin = '0 10px'; // Add some spacing
        paginationControls.appendChild(pageInfo);

        // Next Button
        const nextButton = document.createElement('button');
        nextButton.textContent = '下一页';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                fetchRecipes(currentPage + 1);
            }
        });
        paginationControls.appendChild(nextButton);
    };

    // Initial load of recipes (load page 1)
    fetchRecipes(1);
});
