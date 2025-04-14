document.addEventListener('DOMContentLoaded', () => {
    const recipeDetailSection = document.getElementById('recipe-detail');
    const loadingMessage = document.getElementById('loading-detail-message');
    const pageTitle = document.querySelector('title');
    const headerTitle = document.getElementById('recipe-header-title');

    // Get recipe name from URL query parameter (?name=...)
    const urlParams = new URLSearchParams(window.location.search);
    const recipeName = urlParams.get('name');

    if (!recipeName) {
        loadingMessage.textContent = '错误：未指定配方名称。';
        pageTitle.textContent = '错误 - 配方详情';
        headerTitle.textContent = '错误';
        return;
    }

    // Fetch the specific recipe data
    // Encode the name for the URL path segment
    const encodedRecipeName = encodeURIComponent(recipeName);
    fetch(`/api/recipes/${encodedRecipeName}`)
        .then(response => {
            if (response.status === 404) {
                 return Promise.reject('未找到配方');
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(recipe => {
            loadingMessage.style.display = 'none'; // Hide loading message

            // Update page and header titles
            const estimatedAbvText = recipe.estimatedAbv ? recipe.estimatedAbv.toFixed(1) : 'N/A';
            pageTitle.textContent = `${recipe.name} - 配方详情`;
            headerTitle.textContent = `${recipe.name} (~${estimatedAbvText}% ABV)`; // Add ABV to header

            // Display recipe details
            const nameHeading = document.createElement('h2');
            // nameHeading.textContent = recipe.name; // Already in header
            // recipeDetailSection.appendChild(nameHeading);

            const ingredientsHeading = document.createElement('h3');
            ingredientsHeading.textContent = '所需成分:';
            recipeDetailSection.appendChild(ingredientsHeading);

            const ingredientsList = document.createElement('ul');
            if (Array.isArray(recipe.ingredients)) {
                recipe.ingredients.forEach(ingredient => {
                    const li = document.createElement('li');
                    let text = ingredient.name;
                    // Add volume and ABV if volume > 0
                    if (ingredient.volume > 0) {
                        text += `: ${ingredient.volume}ml`;
                        if (ingredient.abv > 0) {
                            text += ` (${ingredient.abv}%)`;
                        }
                    } else if (ingredient.volume === 0 && ingredient.abv === 0 && !text.includes('Garnish') && !text.includes('装饰')) {
                         // Optionally indicate non-measured items like garnishes if volume is 0
                         // text += ' (适量/装饰)'; // Or handle based on name
                    }
                    li.textContent = text;
                    ingredientsList.appendChild(li);
                });
            } else {
                 const li = document.createElement('li');
                 li.textContent = '成分信息格式错误。';
                 ingredientsList.appendChild(li);
            }
            recipeDetailSection.appendChild(ingredientsList);

            const instructionsHeading = document.createElement('h3');
            instructionsHeading.textContent = '调制方法:';
            recipeDetailSection.appendChild(instructionsHeading);

            const instructions = document.createElement('p');
            instructions.textContent = recipe.instructions;
            recipeDetailSection.appendChild(instructions);

        })
        .catch(error => {
            loadingMessage.textContent = `加载配方 "${decodeURIComponent(recipeName)}" 失败: ${error}`;
            pageTitle.textContent = '错误 - 配方详情';
            headerTitle.textContent = '加载失败';
            console.error('获取配方详情时出错:', error);
        });
});
