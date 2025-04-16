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

    // --- Fetch and display comments ---
    if (recipeId) {
        loadComments(recipeId);
        setupCommentForm(recipeId);
    }

    // --- Add event listener for deleting comments (using delegation) ---
    const commentsListContainer = document.getElementById('comments-list');
    if (commentsListContainer) {
        commentsListContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-comment-btn')) {
                const commentId = event.target.dataset.commentId;
                if (commentId && confirm('确定要删除这条评论吗？')) {
                    deleteComment(commentId, event.target); // Pass button for feedback
                }
            }
        });
    }
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

    // --- Add Creator Info ---
    const creatorInfo = document.createElement('p');
    creatorInfo.classList.add('recipe-creator-detail'); // Add class for styling
    creatorInfo.innerHTML = `<strong>创建者:</strong> ${recipe.createdBy || '未知用户'}`;
    container.appendChild(creatorInfo);
    // --- End Creator Info ---

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

// --- Function to load and display comments ---
async function loadComments(recipeId) {
    const commentsListContainer = document.getElementById('comments-list');
    if (!commentsListContainer) return;
    commentsListContainer.innerHTML = '<p>正在加载评论...</p>';

    try {
        const response = await fetch(`/api/recipes/${recipeId}/comments`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const comments = await response.json();
        renderComments(comments);
    } catch (error) {
        console.error('获取评论时出错:', error);
        commentsListContainer.innerHTML = '<p style="color: red;">无法加载评论。</p>';
    }
}

// --- Function to render comments ---
function renderComments(comments) {
    const commentsListContainer = document.getElementById('comments-list');
    if (!commentsListContainer) return;
    commentsListContainer.innerHTML = ''; // Clear loading message

    if (!comments || comments.length === 0) {
        commentsListContainer.innerHTML = '<p>暂无评论。</p>';
        return;
    }

    const isAdmin = document.body.classList.contains('is-admin'); // Check if user is admin

    comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort newest first

    comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('comment');
        commentDiv.dataset.commentId = comment.id; // Add comment ID to the div for easier removal

        // Add delete button HTML only if user is admin
        const deleteButtonHTML = isAdmin
            ? `<button class="delete-comment-btn" data-comment-id="${comment.id}" title="删除评论">×</button>`
            : '';

        commentDiv.innerHTML = `
            <div class="comment-header">
                <p class="comment-meta">
                    <strong>${comment.username || '匿名用户'}</strong>
                    <span> - ${new Date(comment.timestamp).toLocaleString('zh-CN')}</span>
                </p>
                ${deleteButtonHTML}
            </div>
            <p class="comment-text">${escapeHTML(comment.text)}</p>
        `;
        commentsListContainer.appendChild(commentDiv);
    });
}

// --- Function to set up the comment form ---
function setupCommentForm(recipeId) {
    const commentForm = document.getElementById('comment-form');
    const commentText = document.getElementById('comment-text');
    const commentError = document.getElementById('comment-error');
    const loginPrompt = document.getElementById('login-prompt');

    // Check login status to show/hide form (relies on body class from global.js)
    if (document.body.classList.contains('logged-out')) {
        if (commentForm) commentForm.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
        return; // Don't add submit listener if not logged in
    } else {
         if (commentForm) commentForm.style.display = 'block';
         if (loginPrompt) loginPrompt.style.display = 'none';
    }


    if (commentForm && commentText) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (commentError) commentError.style.display = 'none'; // Hide previous errors

            const commentContent = commentText.value.trim();
            if (!commentContent) {
                if (commentError) {
                    commentError.textContent = '评论内容不能为空。';
                    commentError.style.display = 'block';
                }
                return;
            }

            try {
                const response = await fetch(`/api/recipes/${recipeId}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ commentText: commentContent }),
                });

                if (response.ok) {
                    const newComment = await response.json();
                    commentText.value = ''; // Clear textarea
                    // Optionally, add the new comment directly to the list or reload all comments
                    addCommentToDOM(newComment); // Add directly for instant feedback
                    // loadComments(recipeId); // Or reload all
                } else {
                    // Handle errors (like 401 Unauthorized if session expired mid-way)
                    let errorData = { message: `提交失败 (${response.status})` };
                     try { errorData = await response.json(); } catch(err) {}

                     if (response.status === 401 || response.status === 403) {
                         // Handle auth error specifically if needed (e.g., redirect)
                         if (commentError) commentError.textContent = '请重新登录后提交评论。';
                         // Optionally redirect after delay
                         // setTimeout(() => { window.location.href = '/auth/login/'; }, 1500);
                     } else {
                         if (commentError) commentError.textContent = errorData.message;
                     }
                     if (commentError) commentError.style.display = 'block';
                }
            } catch (error) {
                console.error('提交评论时出错:', error);
                 if (commentError) {
                    commentError.textContent = '提交评论时发生网络错误。';
                    commentError.style.display = 'block';
                }
            }
        });
    }
}

// --- Helper function to add a single comment to the top of the list ---
function addCommentToDOM(comment) {
    const commentsListContainer = document.getElementById('comments-list');
    if (!commentsListContainer) return;

    // Remove "暂无评论" message if present
    const noCommentsMsg = commentsListContainer.querySelector('p');
    if (noCommentsMsg && noCommentsMsg.textContent === '暂无评论。') {
        commentsListContainer.innerHTML = '';
    }

    const commentDiv = document.createElement('div');
    commentDiv.classList.add('comment');
    commentDiv.innerHTML = `
        <p class="comment-meta">
            <strong>${comment.username || '匿名用户'}</strong>
            <span> - ${new Date(comment.timestamp).toLocaleString('zh-CN')}</span>
        </p>
        <p class="comment-text">${escapeHTML(comment.text)}</p>
    `;
    // Prepend to show newest first
    commentsListContainer.insertBefore(commentDiv, commentsListContainer.firstChild);
}

// --- Helper function to escape HTML ---
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// --- Function to delete a comment ---
async function deleteComment(commentId, buttonElement) {
    buttonElement.disabled = true; // Disable button during request
    buttonElement.textContent = '...'; // Indicate processing

    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            // Remove the comment element from the DOM
            const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
            if (commentElement) {
                commentElement.remove();
            }
            // Check if comments list is now empty
            const commentsListContainer = document.getElementById('comments-list');
            if (commentsListContainer && !commentsListContainer.hasChildNodes()) {
                 commentsListContainer.innerHTML = '<p>暂无评论。</p>';
            }
            alert('评论删除成功！'); // Optional success message
        } else {
            let errorData = { message: `删除失败 (${response.status})` };
            try { errorData = await response.json(); } catch(err) {}
            console.error('Error deleting comment:', errorData);
            alert(`删除评论失败: ${errorData.message}`);
            // Re-enable button on failure
            buttonElement.disabled = false;
            buttonElement.textContent = '×';
        }
    } catch (error) {
        console.error('Network error deleting comment:', error);
        alert('删除评论时发生网络错误。');
        // Re-enable button on failure
        buttonElement.disabled = false;
        buttonElement.textContent = '×';
    }
}
