// Assuming this file handles the form submission for add/index.html

const addRecipeForm = document.getElementById('add-recipe-form'); // Make sure your form has this ID

if (addRecipeForm) {
    addRecipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather form data into an object (example)
        const formData = new FormData(addRecipeForm);
        const newRecipe = Object.fromEntries(formData.entries());
        // You might need more specific data extraction depending on your form fields
        // Example: const newRecipe = { name: formData.get('recipe-name'), ingredients: [...] };

        const messageElement = document.getElementById('add-recipe-message'); // Add an element to display messages
        if (messageElement) messageElement.textContent = ''; // Clear previous messages

        try {
            const response = await fetch('/api/recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add other headers if needed, like CSRF token
                },
                body: JSON.stringify(newRecipe),
            });

            // --- Check the response before parsing JSON ---
            if (response.ok) {
                // Check if the response is actually JSON before parsing
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const result = await response.json();
                    console.log('Recipe added:', result);
                    if (messageElement) {
                        messageElement.textContent = result.message || '配方添加成功！';
                        messageElement.style.color = 'green';
                    }
                    addRecipeForm.reset(); // Clear the form
                    // Optionally redirect or update UI
                } else {
                    // Received a 2xx status but not JSON - might be unexpected HTML
                    console.error('Received non-JSON response:', await response.text());
                    if (messageElement) {
                        messageElement.textContent = '收到意外的服务器响应。';
                        messageElement.style.color = 'orange';
                    }
                     // Check if we were redirected to login (common case)
                    if (response.url && response.url.includes('/auth/login')) {
                         if (messageElement) messageElement.textContent = '会话已过期，请重新登录。正在跳转...';
                         window.location.href = '/auth/login/'; // Redirect to login
                    }
                }
            } else {
                // Handle non-2xx responses (like 401 Unauthorized, 403 Forbidden, 500 Server Error)
                 // Check if it's an authentication issue (redirected or specific status)
                 if (response.status === 401 || response.status === 403 || (response.redirected && response.url.includes('/auth/login'))) {
                     if (messageElement) messageElement.textContent = '您需要登录才能添加配方。正在跳转到登录页面...';
                     // Redirect to login page after a short delay
                     setTimeout(() => {
                         window.location.href = '/auth/login/';
                     }, 1500);
                 } else {
                    // Handle other errors (e.g., validation errors, server errors)
                    let errorResult;
                    try {
                        // Try parsing error message as JSON (server might send JSON errors)
                         errorResult = await response.json();
                    } catch (parseError) {
                        // If parsing fails, use the status text
                        errorResult = { message: response.statusText };
                    }
                    console.error('Error submitting recipe:', response.status, errorResult);
                    if (messageElement) {
                        messageElement.textContent = `错误: ${errorResult.message || '无法添加配方'}`;
                        messageElement.style.color = 'red';
                    }
                 }
            }
        } catch (error) {
            console.error('Network or other error:', error);
            if (messageElement) {
                messageElement.textContent = '网络错误或客户端脚本错误。';
                messageElement.style.color = 'red';
            }
        }
    });
} else {
    console.error('Add recipe form not found!');
}

// Make sure you have an element in add/index.html to display messages, e.g.:
// <p id="add-recipe-message"></p>
