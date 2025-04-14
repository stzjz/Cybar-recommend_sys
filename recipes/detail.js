document.addEventListener('DOMContentLoaded', () => {
    const recipeDetailContainer = document.getElementById('recipe-detail'); // Your container ID for details
    const errorMessageElement = document.getElementById('error-message'); // Element to show errors

    // --- Get recipe ID from URL query parameter ---
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id'); // Get the 'id' parameter

    if (!recipeId) {
        console.error('Recipe ID not found in URL');
        if (errorMessageElement) errorMessageElement.textContent = '错误：未在 URL 中指定配方 ID。';
        return;
    }

    // --- Fetch recipe detail using the ID ---
    fetch(`/api/recipes/${recipeId}`) // Use the recipeId in the fetch URL
        .then(response => {
            if (!response.ok) {
                // Throw an error with the status text to be caught below
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(recipe => {
            displayRecipeDetail(recipe);
        })
        .catch(error => {
            console.error('获取配方详情时出错:', error.message);
            if (errorMessageElement) errorMessageElement.textContent = `获取配方详情时出错: ${error.message.includes('404') ? '未找到配方' : '服务器错误或网络问题'}`;
        });
});

function displayRecipeDetail(recipe) {
    const container = document.getElementById('recipe-detail');
    if (!container) return;

    // Clear previous content or loading message
    container.innerHTML = '';

    // Populate the container with recipe details
    const title = document.createElement('h2');
    title.textContent = recipe.name;
    container.appendChild(title);

    const ingredientsTitle = document.createElement('h3');
    ingredientsTitle.textContent = '配料:';
    container.appendChild(ingredientsTitle);

    const ingredientsList = document.createElement('ul');
    recipe.ingredients.forEach(ing => {
        const li = document.createElement('li');
        li.textContent = `${ing.name}: ${ing.volume}ml (ABV: ${ing.abv}%)`;
        ingredientsList.appendChild(li);
    });
    container.appendChild(ingredientsList);

    const instructionsTitle = document.createElement('h3');
    instructionsTitle.textContent = '制作方法:';
    container.appendChild(instructionsTitle);

    const instructions = document.createElement('p');
    instructions.textContent = recipe.instructions;
    container.appendChild(instructions);

    const abv = document.createElement('p');
    abv.innerHTML = `<strong>预计酒精度:</strong> ${recipe.estimatedAbv}%`;
    container.appendChild(abv);

    // Add back link if needed
    const backLink = document.createElement('a');
    backLink.href = './'; // Link back to the recipe list page
    backLink.textContent = '返回配方列表';
    backLink.classList.add('back-link'); // Add class for styling if needed
    container.appendChild(backLink);
}

// Make sure your detail.html has elements with ids 'recipe-detail' and 'error-message'
// e.g.:
// <main>
//     <div id="recipe-detail">加载中...</div>
//     <p id="error-message" style="color: red;"></p>
// </main>
