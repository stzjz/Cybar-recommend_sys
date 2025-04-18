document.addEventListener('DOMContentLoaded', () => {
    const recipesContainer = document.getElementById('recipes-container');
    const loadingMessage = document.getElementById('loading-message');
    // Remove load button logic
    // const loadButton = document.getElementById('load-recipes-btn');
    const paginationContainer = document.getElementById('pagination-controls'); // Get pagination container

    let currentPage = 1;
    const limit = 10; // Or any other desired limit

    const displayRecipes = (data) => {
        recipesContainer.innerHTML = ''; // Clear previous results
        loadingMessage.style.display = 'none';
        recipesContainer.style.display = 'block'; // Show container

        if (!data || !data.recipes || data.recipes.length === 0) {
            recipesContainer.innerHTML = '<p>暂无配方。</p>';
            paginationContainer.innerHTML = ''; // Clear pagination if no recipes
            return;
        }

        data.recipes.forEach(recipe => {
            const article = document.createElement('article');
            article.classList.add('cocktail');

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

            // Add interaction counts
            const interactionInfo = document.createElement('div');
            interactionInfo.classList.add('interaction-counts');
            interactionInfo.innerHTML = `
                <span class="like-count"><i class="far fa-heart"></i> <span class="count">0</span></span>
                <span class="favorite-count"><i class="far fa-star"></i> <span class="count">0</span></span>
            `;
            article.appendChild(interactionInfo);

            // Optionally display brief ingredients or instructions here if needed
            const instructions = document.createElement('p');
            // Ensure instructions exist before trying to access substring
            instructions.textContent = `做法：${recipe.instructions ? recipe.instructions.substring(0, 100) + '...' : '无说明'}`; // Example snippet with check
            article.appendChild(instructions);

            recipesContainer.appendChild(article);

            // Load interaction counts for this recipe
            loadInteractionCounts(recipe.id, article);
        });

        // --- Render Pagination Controls ---
        renderPagination(data.totalPages, data.currentPage);
    };

    // Function to load interaction counts for a recipe
    async function loadInteractionCounts(recipeId, article) {
        try {
            const response = await fetch(`/api/recipes/${recipeId}/interactions`);
            if (!response.ok) {
                throw new Error('Failed to load interaction counts');
            }
            const data = await response.json();
            
            // Update the counts in the article
            const likeCount = article.querySelector('.like-count .count');
            const favoriteCount = article.querySelector('.favorite-count .count');
            
            if (likeCount) likeCount.textContent = data.likeCount;
            if (favoriteCount) favoriteCount.textContent = data.favoriteCount;
        } catch (error) {
            console.error(`Error loading interaction counts for recipe ${recipeId}:`, error);
        }
    }

    const fetchAndDisplayRecipes = (page = 1) => {
        loadingMessage.textContent = '正在加载配方...';
        loadingMessage.style.display = 'block';
        recipesContainer.style.display = 'none'; // Hide container while loading
        paginationContainer.innerHTML = ''; // Clear old pagination

        // Fetch recipes for the specific page
        fetch(`/api/recipes?page=${page}&limit=${limit}`)
            .then(response => {
                if (!response.ok) {
                    // Try to parse error response if possible
                    return response.json().then(err => { throw new Error(err.message || `HTTP error! status: ${response.status}`) });
                }
                return response.json();
            })
            .then(data => {
                currentPage = data.currentPage; // Update current page
                displayRecipes(data);
            })
            .catch(error => {
                loadingMessage.textContent = `加载配方失败: ${error.message}. 请稍后重试或检查服务器是否运行。`;
                recipesContainer.style.display = 'none';
                console.error('获取配方时出错:', error);
            });
    };

    // --- Function to Render Pagination Controls ---
    const renderPagination = (totalPages, currentPage) => {
        paginationContainer.innerHTML = ''; // Clear existing controls

        if (totalPages <= 1) return; // No controls needed for 1 or 0 pages

        const prevButton = document.createElement('button');
        prevButton.textContent = '上一页';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                fetchAndDisplayRecipes(currentPage - 1);
            }
        });
        paginationContainer.appendChild(prevButton);

        const pageInfo = document.createElement('span');
        pageInfo.textContent = ` 第 ${currentPage} / ${totalPages} 页 `;
        pageInfo.style.margin = '0 10px'; // Add some spacing
        paginationContainer.appendChild(pageInfo);

        const nextButton = document.createElement('button');
        nextButton.textContent = '下一页';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                fetchAndDisplayRecipes(currentPage + 1);
            }
        });
        paginationContainer.appendChild(nextButton);
    };


    // Remove event listener for the load button
    /*
    if (loadButton) {
        loadButton.addEventListener('click', fetchAndDisplayRecipes);
    } else {
         loadingMessage.textContent = '无法找到加载按钮。';
    }
    */

    // Initially load the first page of recipes
    fetchAndDisplayRecipes(1);
});
