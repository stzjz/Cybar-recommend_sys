document.addEventListener('DOMContentLoaded', () => {
    const addRecipeForm = document.getElementById('add-recipe-form');
    const ingredientsList = document.getElementById('ingredients-list');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const addMessage = document.getElementById('add-message');
    // Initialize counter based on existing entries (should be 1 initially)
    let ingredientCounter = ingredientsList.querySelectorAll('.ingredient-entry').length;

    // Function to add a new ingredient input group
    function addIngredientInput() {
        ingredientCounter++;
        const newEntry = document.createElement('div');
        newEntry.classList.add('ingredient-entry');
        // Updated HTML structure with correct IDs, names, and placeholders
        newEntry.innerHTML = `
            <div class="inputs-wrapper">
                <div class="input-column name-column">
                    <label class="ingredient-label" for="ingredient-name-${ingredientCounter}">配料 ${ingredientCounter} 名称:</label>
                    <input type="text" id="ingredient-name-${ingredientCounter}" name="ingredient-name[]" class="ingredient-name" placeholder="例如：汤力水" required>
                </div>
                <div class="input-column volume-column">
                    <label class="ingredient-label" for="ingredient-volume-${ingredientCounter}">体积 (ml):</label>
                    <input type="number" id="ingredient-volume-${ingredientCounter}" name="ingredient-volume[]" class="ingredient-volume" step="any" min="0" placeholder="例如：150" required>
                </div>
                <div class="input-column abv-column">
                    <label class="ingredient-label" for="ingredient-abv-${ingredientCounter}">ABV (%):</label>
                    <input type="number" id="ingredient-abv-${ingredientCounter}" name="ingredient-abv[]" class="ingredient-abv" step="any" min="0" max="100" placeholder="例如：0" required>
                </div>
            </div>
            <button type="button" class="remove-ingredient-btn">移除此配料</button>
        `;
        ingredientsList.appendChild(newEntry);

        // Add event listener to the new remove button inside this function
        // No need to add listener here if using event delegation below
    }

    // Function to renumber ingredient labels after removal
    function renumberIngredients() {
        const entries = ingredientsList.querySelectorAll('.ingredient-entry');
        ingredientCounter = entries.length; // Update the counter
        entries.forEach((entry, index) => {
            const number = index + 1;
            const nameLabel = entry.querySelector('.name-column .ingredient-label');
            const volumeLabel = entry.querySelector('.volume-column .ingredient-label');
            const abvLabel = entry.querySelector('.abv-column .ingredient-label');

            if (nameLabel) nameLabel.textContent = `配料 ${number} 名称:`;
            if (volumeLabel) volumeLabel.textContent = `体积 (ml):`; // Keep these simpler maybe?
            if (abvLabel) abvLabel.textContent = `ABV (%):`;

            // Also update IDs if necessary, though maybe not strictly required if names are arrays
            // entry.querySelector('.ingredient-name').id = `ingredient-name-${number}`;
            // entry.querySelector('.ingredient-volume').id = `ingredient-volume-${number}`;
            // entry.querySelector('.ingredient-abv').id = `ingredient-abv-${number}`;
            // if (nameLabel) nameLabel.setAttribute('for', `ingredient-name-${number}`);
            // if (volumeLabel) volumeLabel.setAttribute('for', `ingredient-volume-${number}`);
            // if (abvLabel) abvLabel.setAttribute('for', `ingredient-abv-${number}`);
        });
    }


    // Event listener for adding ingredient inputs
    addIngredientBtn.addEventListener('click', addIngredientInput);

    // Event listener for removing ingredient inputs (using event delegation)
    ingredientsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-ingredient-btn')) {
             // Ensure we don't remove the very last ingredient entry if it's the only one
             if (ingredientsList.querySelectorAll('.ingredient-entry').length > 1) {
                event.target.closest('.ingredient-entry').remove();
                renumberIngredients(); // Renumber after removal
             } else {
                 alert("至少需要一个配料。");
             }
        }
    });

    // Event listener for form submission
    addRecipeForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        addMessage.style.display = 'none'; // Hide previous messages
        addMessage.className = 'message'; // Reset message class

        const cocktailNameInput = document.getElementById('cocktail-name');
        const instructionsInput = document.getElementById('instructions');
        const cocktailName = cocktailNameInput.value.trim();
        const instructions = instructionsInput.value.trim();
        const ingredientEntries = ingredientsList.querySelectorAll('.ingredient-entry');
        const ingredients = [];
        let formIsValid = true; // Flag for input validation

        // Reset previous validation styles
        cocktailNameInput.style.borderColor = '';
        instructionsInput.style.borderColor = '';
        ingredientEntries.forEach(entry => {
            entry.querySelectorAll('input').forEach(input => input.style.borderColor = '');
        });


        ingredientEntries.forEach((entry, index) => {
            const nameInput = entry.querySelector('.ingredient-name');
            const volumeInput = entry.querySelector('.ingredient-volume');
            const abvInput = entry.querySelector('.ingredient-abv');

            // Validate each input within the loop
            const name = nameInput ? nameInput.value.trim() : '';
            const volumeStr = volumeInput ? volumeInput.value : '';
            const abvStr = abvInput ? abvInput.value : '';
            const volume = parseFloat(volumeStr);
            const abv = parseFloat(abvStr);

            let entryValid = true;
            if (!name) {
                nameInput.style.borderColor = 'red';
                entryValid = false;
            }
            if (volumeStr === '' || isNaN(volume) || volume < 0) {
                volumeInput.style.borderColor = 'red';
                entryValid = false;
            }
             if (abvStr === '' || isNaN(abv) || abv < 0 || abv > 100) {
                abvInput.style.borderColor = 'red';
                entryValid = false;
            }

            if (entryValid) {
                 ingredients.push({ name, volume, abv });
            } else {
                formIsValid = false; // Mark form as invalid if any entry is invalid
            }
        });

        // Basic validation for name and instructions
        if (!cocktailName) {
             cocktailNameInput.style.borderColor = 'red';
             formIsValid = false;
        }
        if (!instructions) {
             instructionsInput.style.borderColor = 'red';
             formIsValid = false;
        }


        if (ingredients.length === 0 || !formIsValid) {
            showMessage('请检查所有字段是否已正确填写。名称、说明为必填项，且至少需要一个有效的配料 (名称必填, 体积≥0, ABV 0-100)。', 'red');
            // Scroll to the first invalid field (optional enhancement)
            const firstInvalid = addRecipeForm.querySelector('[style*="border-color: red"]');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus();
            }
            return;
        }

        const recipeData = {
            name: cocktailName,
            instructions: instructions,
            ingredients: ingredients
        };

        console.log('Submitting Recipe Data:', recipeData); // Log data for debugging

        // --- Backend Interaction ---
        try {
            // Disable submit button during submission
            const submitButton = document.getElementById('submit-recipe-btn');
            submitButton.disabled = true;
            submitButton.textContent = '正在添加...';


            const response = await fetch('/api/recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipeData)
            });

            const result = await response.json(); // Try to parse JSON regardless of status

            if (response.ok) { // Status 200-299
                showMessage(`配方 "${cocktailName}" 添加成功！`, 'green');
                addRecipeForm.reset(); // Clear the form
                // Reset ingredients list to a single entry
                ingredientsList.innerHTML = `
                    <div class="ingredient-entry">
                         <div class="inputs-wrapper">
                            <div class="input-column name-column">
                                <label class="ingredient-label" for="ingredient-name-1">配料 1 名称:</label>
                                <input type="text" id="ingredient-name-1" name="ingredient-name[]" class="ingredient-name" placeholder="例如：金酒" required>
                            </div>
                            <div class="input-column volume-column">
                                <label class="ingredient-label" for="ingredient-volume-1">体积 (ml):</label>
                                <input type="number" id="ingredient-volume-1" name="ingredient-volume[]" class="ingredient-volume" step="any" min="0" placeholder="例如：50" required>
                            </div>
                            <div class="input-column abv-column">
                                <label class="ingredient-label" for="ingredient-abv-1">ABV (%):</label>
                                <input type="number" id="ingredient-abv-1" name="ingredient-abv[]" class="ingredient-abv" step="any" min="0" max="100" placeholder="例如：40" required>
                            </div>
                        </div>
                        <!-- No remove button for the first entry -->
                    </div>`;
                ingredientCounter = 1; // Reset counter
                // Reset border colors on inputs just in case
                cocktailNameInput.style.borderColor = '';
                instructionsInput.style.borderColor = '';

            } else {
                // Handle errors (e.g., display specific error message from backend)
                showMessage(`添加配方失败。错误 ${response.status}: ${result.message || response.statusText}`, 'red');
            }
        } catch (error) {
            console.error('Error submitting recipe:', error);
            showMessage('提交配方时发生网络或解析错误。请检查网络连接和服务器状态。', 'red');
        } finally {
             // Re-enable submit button
            const submitButton = document.getElementById('submit-recipe-btn');
            if (submitButton) { // Check if button still exists
                submitButton.disabled = false;
                submitButton.textContent = '确认并添加配方';
            }
        }
        // --- End Backend Interaction ---
    });

    // Function to display messages
    function showMessage(message, type) {
        addMessage.textContent = message;
        addMessage.className = 'message'; // Reset classes
        if (type === 'green') {
            // Apply success styles directly or use a class
            addMessage.style.cssText = 'display: block; border-left-color: #00e676; color: #dcedc8; background-color: rgba(0, 80, 0, 0.5);';
        } else if (type === 'red') {
             // Apply error styles directly or use a class
            addMessage.style.cssText = 'display: block; border-left-color: #ff4081; color: #ffcdd2; background-color: rgba(80, 0, 0, 0.5);';
        }
        addMessage.style.display = 'block';
         // Scroll message into view
        addMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Ensure the initial static entry doesn't have a remove button (redundant check, but safe)
    const firstEntry = ingredientsList.querySelector('.ingredient-entry');
    if (firstEntry && ingredientsList.querySelectorAll('.ingredient-entry').length === 1) {
        const removeBtn = firstEntry.querySelector('.remove-ingredient-btn');
        if (removeBtn) {
            removeBtn.remove();
        }
    }
});
