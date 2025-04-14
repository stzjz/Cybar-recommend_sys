document.addEventListener('DOMContentLoaded', () => {
    const recipesContainer = document.getElementById('recipes-container');
    const loadingMessage = document.getElementById('loading-message');
    const loadButton = document.getElementById('load-recipes-btn');

    const displayRecipes = (recipes) => {
        recipesContainer.innerHTML = ''; // Clear previous results
        loadingMessage.style.display = 'none';
        recipesContainer.style.display = 'block'; // Show container

        if (recipes.length === 0) {
            recipesContainer.innerHTML = '<p>暂无配方。</p>';
            return;
        }

        recipes.forEach(recipe => {
            const article = document.createElement('article');
            article.classList.add('cocktail');

            const nameHeading = document.createElement('h3');
            const nameLink = document.createElement('a');
            nameLink.href = `detail.html?id=${recipe.id}`;
            // Display name and ABV
            nameLink.textContent = `${recipe.name} (~${recipe.estimatedAbv ? recipe.estimatedAbv.toFixed(1) : 'N/A'}% ABV)`;
            nameHeading.appendChild(nameLink);
            article.appendChild(nameHeading);

            // Optionally display brief ingredients or instructions here if needed
            const instructions = document.createElement('p');
            instructions.textContent = `做法：${recipe.instructions.substring(0, 100)}...`; // Example snippet
            article.appendChild(instructions);

            recipesContainer.appendChild(article);
        });
    };

    const fetchAndDisplayRecipes = () => {
        loadingMessage.textContent = '正在加载配方...';
        loadingMessage.style.display = 'block';
        recipesContainer.style.display = 'none'; // Hide container while loading

        fetch('/api/recipes')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(recipes => {
                displayRecipes(recipes);
            })
            .catch(error => {
                loadingMessage.textContent = '加载配方失败。请稍后重试或检查服务器是否运行。';
                recipesContainer.style.display = 'none';
                console.error('获取配方时出错:', error);
            });
    };

    // Add event listener to the load button
    if (loadButton) {
        loadButton.addEventListener('click', fetchAndDisplayRecipes);
    } else {
         loadingMessage.textContent = '无法找到加载按钮。';
    }

    // Initially, do not load recipes automatically
    // fetchAndDisplayRecipes(); // Remove this line
});
