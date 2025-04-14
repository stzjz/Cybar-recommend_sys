const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// --- In-memory Access Counter (Simplified) ---
const accessCounts = {
    home: 0,
    // Removed other counts
};

// --- Middleware ---
app.use(express.json());

// --- Tracking Logic & Static Serving ---

// --- Root / Home ---
app.get('/', (req, res, next) => {
    accessCounts.home++;
    console.log('Home access count:', accessCounts.home);
    next(); // Pass control to the static middleware
});
// Serve root static files AFTER tracking '/'
app.use(express.static(__dirname));

// --- Serve other sections without tracking ---
app.use('/recipes', express.static(path.join(__dirname, 'recipes')));
app.use('/calculator', express.static(path.join(__dirname, 'calculator')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// --- Removed tracking routes for recipes, calculator, admin ---


const recipesFilePath = path.join(__dirname, 'recipes.json');

// --- Helper Functions ---
const readRecipes = () => {
    try {
        const data = fs.readFileSync(recipesFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // 如果文件不存在或为空，返回空数组
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            writeRecipes([]);
            return [];
        }
        console.error("读取配方文件时出错:", error);
        return []; // 出错时返回空数组
    }
};

const writeRecipes = (recipes) => {
    try {
        fs.writeFileSync(recipesFilePath, JSON.stringify(recipes, null, 2), 'utf8');
    } catch (error) {
        console.error("写入配方文件时出错:", error);
    }
};

const calculateEstimatedAbv = (ingredients) => {
    if (!Array.isArray(ingredients)) return 0; // Handle cases where ingredients might not be an array

    let totalVolume = 0;
    let totalAlcohol = 0;
    ingredients.forEach(ing => {
        // Ensure ing exists and has volume/abv properties
        const volume = ing && ing.volume ? parseFloat(ing.volume) : 0;
        const abv = ing && ing.abv ? parseFloat(ing.abv) : 0;

        if (volume > 0) {
            totalVolume += volume;
            totalAlcohol += volume * (abv / 100);
        }
    });
    // Avoid division by zero
    return totalVolume > 0 ? (totalAlcohol / totalVolume) * 100 : 0;
};


// --- API Endpoints ---

// --- Statistics API (Simplified) ---
app.get('/api/stats', (req, res) => {
    // Return only home count
    res.json({
        home: accessCounts.home,
    });
});

// --- Recipe APIs (Now all public by default) ---
app.get('/api/recipes', (req, res) => {
    const recipes = readRecipes();
    res.json(recipes);
});
app.get('/api/recipes/:name', (req, res) => {
    const recipes = readRecipes();
    const recipeName = decodeURIComponent(req.params.name);
    const recipe = recipes.find(r => r.name === recipeName);
    if (recipe) {
        res.json(recipe);
    } else {
        res.status(404).json({ message: `未找到配方 "${recipeName}"` });
    }
});

// POST /api/recipes
app.post('/api/recipes', (req, res) => {
    // NOTE: This is now publicly accessible without login!
    const recipes = readRecipes();
    const { name, ingredients, instructions } = req.body;

    // --- Restore full validation logic here ---
    if (!name || !instructions || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ message: '配方数据不完整或格式错误 (名称, 说明, 成分数组)' });
    }
    // Validate each ingredient - Restore full logic
    const ingredientsValid = ingredients.every(ing =>
        ing && typeof ing.name === 'string' && ing.name.trim() !== '' &&
        ing.hasOwnProperty('volume') && typeof ing.volume === 'number' && ing.volume >= 0 &&
        ing.hasOwnProperty('abv') && typeof ing.abv === 'number' && ing.abv >= 0 && ing.abv <= 100
    );
    if (!ingredientsValid) {
         return res.status(400).json({ message: '成分数据格式错误 (需要 name:string, volume:number, abv:number)' });
    }
    // Check for existing name - Restore full logic
    if (recipes.some(r => r.name === name)) {
         return res.status(409).json({ message: '已存在同名配方' });
    }
    // --- End of restored validation logic ---


    const newRecipe = { name, ingredients, instructions, estimatedAbv: calculateEstimatedAbv(ingredients) };
    recipes.push(newRecipe);
    writeRecipes(recipes);
    res.status(201).json(newRecipe);
});

// DELETE /api/recipes/:name
app.delete('/api/recipes/:name', (req, res) => {
    // NOTE: This is now publicly accessible without login!
    let recipes = readRecipes();
    const recipeName = decodeURIComponent(req.params.name);
    const initialLength = recipes.length;
    recipes = recipes.filter(r => r.name !== recipeName);
    if (recipes.length < initialLength) {
        writeRecipes(recipes);
        res.status(200).json({ message: `配方 "${recipeName}" 已删除` });
    } else {
        res.status(404).json({ message: `未找到配方 "${recipeName}"` });
    }
});


// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在运行于 http://localhost:${port}`);
    console.log('主页: http://localhost:3000');
    console.log('配方页: http://localhost:3000/recipes/');
    console.log('计算器页: http://localhost:3000/calculator/');
    console.log('后台管理: http://localhost:3000/admin/');
});
