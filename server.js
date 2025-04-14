const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Keep for other file operations
const session = require('express-session');

const app = express();
const port = 8080;

// --- Restore In-Memory Visit Counter ---
const pageVisitCounts = {
    '/': 0,          // 主菜单
    '/recipes/': 0,  // 配方列表
    '/calculator/': 0,// 计算器
    '/add/': 0,      // 添加配方
    // '/admin/': 0, // Admin page is not included in the trackedPaths for the chart
};
// Define tracked paths for consistency (used by middleware and API)
const trackedPaths = ['/', '/recipes/', '/calculator/', '/add/'];

const USERS_FILE = path.join(__dirname, 'users.json');
const RECIPES_FILE = path.join(__dirname, 'recipes.json');
const COMMENTS_FILE = path.join(__dirname, 'comments.json');
// const STATS_FILE = path.join(__dirname, 'stats.json'); // REMOVED

// Middleware
// Middleware to count page loads (HTML requests)
app.use((req, res, next) => {
    // Increment counter only for GET requests that likely return HTML pages we track
    const pathKey = req.path.endsWith('/') ? req.path : req.path + '/'; // Normalize path to end with /

    if (req.method === 'GET' && pageVisitCounts.hasOwnProperty(pathKey)) {
        pageVisitCounts[pathKey]++;
        console.log(`Visit counts: ${JSON.stringify(pageVisitCounts)}`); // Log visit counts
    }
    next(); // Continue to the next middleware/route
});

app.use(express.static(__dirname)); // Serve static files from the root directory
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Session configuration
app.use(session({
    secret: 'your secret key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next(); // User is logged in, proceed
    }

    // Check if the request likely expects JSON (API request)
    // Heuristic: Check 'Accept' header or if path starts with '/api/'
    const isApiRequest = req.accepts('json') || req.path.startsWith('/api/');

    if (isApiRequest) {
        // For API requests, send 401 Unauthorized status and JSON error
        console.log(`Authentication failed for API request: ${req.method} ${req.originalUrl}`); // Add log
        res.status(401).json({ message: 'Authentication required. Please log in.' });
    } else {
        // For non-API requests (likely browser page navigation), redirect to login
        console.log(`Redirecting unauthenticated page request to login: ${req.method} ${req.originalUrl}`); // Add log
        res.redirect('/auth/login/');
    }
};

// --- Admin Check Middleware (No longer needs 'god') ---
const isAdmin = (req, res, next) => {
    // Must be authenticated first
    if (!req.session.userId) {
        // For API requests, send 401 Unauthorized status and JSON error
        if (req.accepts('json') || req.path.startsWith('/api/')) {
             console.log(`Authentication required for admin resource: ${req.method} ${req.originalUrl}`);
             return res.status(401).json({ message: 'Authentication required.' });
        } else {
            // For non-API requests (page access), redirect to login
             console.log(`Redirecting unauthenticated admin page request to login: ${req.method} ${req.originalUrl}`);
             return res.redirect('/auth/login/'); // Redirect to login if not authenticated at all
        }
    }

    // Check if the role stored in session is 'admin'
    const userRole = req.session.role;
    if (userRole !== 'admin') { // Only check for 'admin' now
        console.log(`Forbidden: User ${req.session.username} (role: ${userRole}) tried to access admin resource: ${req.method} ${req.originalUrl}`);
        // For API requests, send 403 Forbidden JSON
        if (req.accepts('json') || req.path.startsWith('/api/')) {
            return res.status(403).json({ message: 'Forbidden: Administrator access required.' });
        } else {
            // For page requests, send HTML with an alert and redirect
            res.status(403).send(`
                <!DOCTYPE html>
                <html lang="zh-cn">
                <head>
                    <meta charset="UTF-8">
                    <title>访问受限</title>
                    <link rel="stylesheet" href="/style.css"> <!-- Optional: Link to your stylesheet -->
                    <style>
                        body { display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }
                        .message-box { padding: 20px; background-color: #2a2a2a; border: 1px solid #444; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="message-box">
                        <p>正在处理...</p>
                    </div>
                    <script>
                        alert('仅管理员可用！');
                        window.location.href = '/'; // Redirect to homepage
                    </script>
                </body>
                </html>
            `);
            return; // Stop further processing
        }
    }
    // User is admin, proceed
    next();
};

// --- Routes ---

// API Route to get current authentication status
app.get('/api/auth/status', (req, res) => {
    if (req.session.userId) {
        // --- 关键点：确保 session 中的 role 被包含在响应中 ---
        console.log(`Auth Status Check: User ${req.session.username}, Role: ${req.session.role}`); // 添加日志确认
        res.json({
            loggedIn: true,
            username: req.session.username,
            role: req.session.role // 确保这里传递了 role
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Serve static HTML pages for auth
app.get('/auth/login/', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth', 'login.html'));
});

app.get('/auth/register/', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth', 'register.html'));
});

// API Routes for Authentication

// Register a new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    if (password.length < 3) { // Example: Minimum password length
        return res.status(400).json({ message: '密码长度至少需要3位' });
    }

    try {
        const users = await readUsers();

        // --- Check for duplicate username (case-insensitive) ---
        const existingUser = users.find(user => user.username.toLowerCase() === username.toLowerCase());
        if (existingUser) {
            return res.status(409).json({ message: '用户名已被注册' }); // 409 Conflict
        }
        // --- End duplicate check ---

        // Create new user object
        const newUser = {
            id: Date.now().toString(), // Simple unique ID
            username: username,
            password: password, // Store plain text password (INSECURE - consider hashing)
            role: 'user' // Default role
        };

        // Add new user to the array
        users.push(newUser);

        // Write updated users array back to file
        await writeUsers(users);

        console.log(`New user registered: ${username}`);
        res.status(201).json({ message: '注册成功' });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: '注册过程中发生服务器错误' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    try {
        const users = await readUsers();
        // 确保这里比较密码的方式是正确的 (如果是明文比较，如下；如果是哈希比较，则需要调整)
        const user = users.find(user => user.username === username && user.password === password);

        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // --- 关键点：确保 user.role 被正确读取并存储 ---
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role || 'user'; // 从 user 对象获取 role，如果不存在则默认为 'user'
        console.log(`Login successful: User ${user.username}, Role stored in session: ${req.session.role}`); // 添加日志确认

        res.status(200).json({ message: '登录成功' });
    } catch (error) {
        console.error("Login error:", error); // Log login errors
        res.status(500).json({ message: '服务器错误' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: '无法注销，请稍后重试' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.status(200).json({ message: '注销成功' });
        // Or redirect: res.redirect('/auth/login/');
    });
});

// --- Protected Routes ---

// Apply isAuthenticated middleware to routes that require login
app.get('/add/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'add', 'index.html')); // Assuming add page is index.html
});

app.get('/admin/', isAuthenticated, isAdmin, (req, res) => { // Add isAdmin middleware
    res.sendFile(path.join(__dirname, 'admin', 'index.html')); // Assuming admin page is index.html
});

// --- Admin API Routes (Require isAdmin) ---

// API to DELETE a recipe
app.delete('/api/recipes/:id', isAuthenticated, isAdmin, async (req, res) => { // Add isAdmin middleware
    const recipeIdToDelete = req.params.id;
    try {
        let recipes = [];
        try {
            let data = await fs.readFile(RECIPES_FILE, 'utf8');
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.slice(1);
            }
            recipes = JSON.parse(data);
        } catch (readError) {
            if (readError.code === 'ENOENT') {
                return res.status(404).json({ message: '配方数据文件不存在' });
            }
            throw readError; // Throw other read errors
        }

        const initialLength = recipes.length;
        const updatedRecipes = recipes.filter(recipe => recipe.id !== recipeIdToDelete);

        if (updatedRecipes.length === initialLength) {
            // No recipe found with that ID
            return res.status(404).json({ message: '未找到要删除的配方' });
        }

        // Write the updated array back to the file
        await fs.writeFile(RECIPES_FILE, JSON.stringify(updatedRecipes, null, 2), 'utf8');
        res.status(200).json({ message: '配方删除成功' }); // Use 200 OK or 204 No Content

    } catch (error) {
        console.error(`Error deleting recipe ${recipeIdToDelete}:`, error);
        res.status(500).json({ message: '删除配方时出错' });
    }
});

// API to get admin statistics (Updated with robust sorting)
app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await readUsers();
        const recipes = await readRecipes();

        // Get visits data directly from memory object
        // Filter to only include the paths intended for the chart
        const visitsDataFiltered = {};
        trackedPaths.forEach(path => {
             // Ensure the path exists in pageVisitCounts before accessing
             if (pageVisitCounts.hasOwnProperty(path)) {
                 visitsDataFiltered[path] = pageVisitCounts[path];
             } else {
                 visitsDataFiltered[path] = 0; // Default to 0 if somehow missing
             }
        });
        console.log('[Admin Stats API] Visits data from memory (filtered):', visitsDataFiltered);

        const responsePayload = {
            totalRecipes: recipes.length,
            totalUsers: users.length,
            visits: visitsDataFiltered, // Send filtered visits data from memory
        };
        console.log('[Admin Stats API] Sending response payload:', responsePayload);
        res.json(responsePayload);

    } catch (error) {
        // Errors are now more likely from readUsers/readRecipes
        console.error("[Admin Stats API] Error fetching admin stats:", error);
        res.status(500).json({ message: '无法加载管理统计信息' });
    }
});

// --- New API Route to get all users (Admin only) ---
app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await readUsers();
        // Map users to exclude password field
        const usersWithoutPasswords = users.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role || 'user' // Ensure role is included, default to 'user'
        }));
        res.json(usersWithoutPasswords);
    } catch (error) {
        console.error("Error reading users for admin:", error);
        res.status(500).json({ message: '无法加载用户信息' });
    }
});

// --- New API Route to DELETE a comment (Admin only) ---
app.delete('/api/comments/:commentId', isAuthenticated, isAdmin, async (req, res) => {
    const commentIdToDelete = req.params.commentId;
    try {
        const allComments = await readComments();
        let commentFound = false;
        let recipeIdOfComment = null;

        // Iterate through all recipes' comments to find the comment by ID
        for (const recipeId in allComments) {
            const commentsForRecipe = allComments[recipeId];
            const initialLength = commentsForRecipe.length;
            // Filter out the comment to delete
            allComments[recipeId] = commentsForRecipe.filter(comment => comment.id !== commentIdToDelete);
            // Check if a comment was removed
            if (allComments[recipeId].length < initialLength) {
                commentFound = true;
                recipeIdOfComment = recipeId;
                // If the recipe now has no comments, remove the recipe key (optional cleanup)
                if (allComments[recipeId].length === 0) {
                    delete allComments[recipeId];
                }
                break; // Stop searching once found and removed
            }
        }

        if (!commentFound) {
            return res.status(404).json({ message: '未找到要删除的评论' });
        }

        // Write the updated comments object back to the file
        await writeComments(allComments);
        console.log(`Admin ${req.session.username} deleted comment ${commentIdToDelete} from recipe ${recipeIdOfComment}`);
        res.status(200).json({ message: '评论删除成功' }); // Or 204 No Content

    } catch (error) {
        console.error(`Error deleting comment ${commentIdToDelete}:`, error);
        res.status(500).json({ message: '删除评论时出错' });
    }
});

// --- User Management API Routes (Now require isAdmin) ---

// API Route to DELETE a user (Requires Admin)
app.delete('/api/admin/users/:userId', isAuthenticated, isAdmin, async (req, res) => { // Use isAdmin
    const userIdToDelete = req.params.userId;
    const adminUserId = req.session.userId; // Get the ID of the admin performing the action

    if (userIdToDelete === adminUserId) {
        return res.status(400).json({ message: '无法删除自己的账户' });
    }
    // Optional: Prevent admins from deleting other admins? Decide based on requirements.
    // If needed, add check here:
    // const users = await readUsers();
    // const userToDelete = users.find(u => u.id === userIdToDelete);
    // if (userToDelete && userToDelete.role === 'admin') {
    //     return res.status(403).json({ message: '无法删除其他管理员账户' });
    // }

    try {
        let users = await readUsers();
        const initialLength = users.length;
        users = users.filter(user => user.id !== userIdToDelete);

        if (users.length === initialLength) {
            return res.status(404).json({ message: '未找到要删除的用户' });
        }

        await writeUsers(users);
        console.log(`Admin User ${req.session.username} deleted user ${userIdToDelete}`);
        res.status(200).json({ message: '用户删除成功' });

    } catch (error) {
        console.error(`Error deleting user ${userIdToDelete}:`, error);
        res.status(500).json({ message: '删除用户时出错' });
    }
});

// API Route to update a user's role (Requires Admin)
app.put('/api/admin/users/:userId/role', isAuthenticated, isAdmin, async (req, res) => { // Use isAdmin
    const userIdToUpdate = req.params.userId;
    const { newRole } = req.body;
    const adminUserId = req.session.userId;

    // Validate newRole - Admins likely shouldn't be able to create 'god' roles anymore
    const validRoles = ['user', 'admin']; // Define valid roles admins can assign
    if (!newRole || !validRoles.includes(newRole)) {
        return res.status(400).json({ message: `无效的角色。有效角色: ${validRoles.join(', ')}` });
    }

    if (userIdToUpdate === adminUserId && newRole !== 'admin') {
        return res.status(400).json({ message: '无法降低自己的管理员权限' });
    }
    // Optional: Prevent admins from changing other admins' roles?
    // const users = await readUsers();
    // const userToUpdate = users.find(u => u.id === userIdToUpdate);
    // if (userToUpdate && userToUpdate.role === 'admin' && userIdToUpdate !== adminUserId) {
    //     return res.status(403).json({ message: '无法修改其他管理员的角色' });
    // }

    try {
        let users = await readUsers();
        const userIndex = users.findIndex(user => user.id === userIdToUpdate);

        if (userIndex === -1) {
            return res.status(404).json({ message: '未找到要修改的用户' });
        }

        // Update the user's role
        users[userIndex].role = newRole;

        await writeUsers(users);
        console.log(`Admin User ${req.session.username} changed role of user ${userIdToUpdate} to ${newRole}`);
        res.status(200).json({ message: '用户角色修改成功', updatedUser: { id: users[userIndex].id, username: users[userIndex].username, role: users[userIndex].role } });

    } catch (error) {
        console.error(`Error updating role for user ${userIdToUpdate}:`, error);
        res.status(500).json({ message: '修改用户角色时出错' });
    }
});

// --- Existing Routes (Example - adapt as needed) ---

app.get('/recipes/', (req, res) => {
    res.sendFile(path.join(__dirname, 'recipes', 'index.html')); // Assuming recipes page is index.html
});

app.get('/calculator/', (req, res) => {
    res.sendFile(path.join(__dirname, 'calculator', 'index.html')); // Assuming calculator page is index.html
});

// API to get recipes (example) - Gets ALL recipes
app.get('/api/recipes', async (req, res) => {
    try {
        // Explicitly specify utf8 encoding and handle potential BOM
        let data = await fs.readFile(RECIPES_FILE, 'utf8'); // Already specifies 'utf8'
        // Remove BOM if present
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1);
        }
        res.json(JSON.parse(data));
    } catch (error) {
        console.error("Error reading recipes:", error);
        if (error.code === 'ENOENT') {
            res.json([]); // Return empty array if file doesn't exist
        } else {
            res.status(500).json({ message: '无法加载配方' });
        }
    }
});

// --- Add Route for Single Recipe Detail ---
app.get('/api/recipes/:id', async (req, res) => {
    const recipeId = req.params.id;
    try {
        let data = await fs.readFile(RECIPES_FILE, 'utf8');
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1);
        }
        const recipes = JSON.parse(data);
        // Find the recipe by ID (Ensure your recipes have unique IDs)
        // If your recipes don't have an 'id' field yet, you might need to add one
        // or search by name if names are unique. Assuming 'id' exists for now.
        const recipe = recipes.find(r => r.id === recipeId); // Adjust 'r.id' if your ID field is named differently

        if (recipe) {
            res.json(recipe); // Send the found recipe
        } else {
            // Recipe with the given ID not found
            res.status(404).json({ message: '未找到配方' });
        }
    } catch (error) {
        console.error(`Error reading recipes file or finding recipe ${recipeId}:`, error);
        if (error.code === 'ENOENT') {
            res.status(404).json({ message: '配方数据文件不存在' });
        } else {
            res.status(500).json({ message: '获取配方详情时出错' });
        }
    }
});

// --- API Route to get comments for a recipe ---
app.get('/api/recipes/:id/comments', async (req, res) => {
    const recipeId = req.params.id;
    try {
        const allComments = await readComments();
        const recipeComments = allComments[recipeId] || []; // Get comments for this recipe or empty array
        res.json(recipeComments);
    } catch (error) {
        res.status(500).json({ message: '无法加载评论' });
    }
});

// --- API Route to add a comment to a recipe (Protected) ---
app.post('/api/recipes/:id/comments', isAuthenticated, async (req, res) => {
    const recipeId = req.params.id;
    const { commentText } = req.body;
    const username = req.session.username; // Get username from session
    const userId = req.session.userId;     // Get userId from session

    if (!commentText || commentText.trim() === '') {
        return res.status(400).json({ message: '评论内容不能为空' });
    }

    try {
        const allComments = await readComments();
        if (!allComments[recipeId]) {
            allComments[recipeId] = []; // Initialize array if no comments yet for this recipe
        }

        const newComment = {
            id: Date.now().toString(), // Simple unique ID
            userId: userId,
            username: username,
            text: commentText.trim(),
            timestamp: new Date().toISOString() // Store timestamp in ISO format
        };

        allComments[recipeId].push(newComment); // Add the new comment
        await writeComments(allComments); // Save updated comments

        res.status(201).json(newComment); // Return the newly created comment

    } catch (error) {
        console.error(`Error adding comment for recipe ${recipeId}:`, error);
        res.status(500).json({ message: '无法添加评论' });
    }
});

// API to add recipes (now protected)
app.post('/api/recipes', isAuthenticated, async (req, res) => {
    // ... (Keep your existing logic for adding recipes)
    const newRecipe = req.body;
    if (!newRecipe || !newRecipe.name) {
        return res.status(400).json({ message: '无效的配方数据' });
    }
    try {
        let recipes = [];
        try {
            // Explicitly specify utf8 encoding and handle potential BOM for reading
            let data = await fs.readFile(RECIPES_FILE, 'utf8'); // Already specifies 'utf8'
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.slice(1);
            }
            recipes = JSON.parse(data);
        } catch (readError) {
            if (readError.code !== 'ENOENT') throw readError;
        }
        newRecipe.id = Date.now().toString();
        recipes.push(newRecipe);
        // Explicitly specify utf8 encoding for writing
        await fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8'); // Already specifies 'utf8'
        res.status(201).json({ message: '配方添加成功', recipe: newRecipe });
    } catch (error) {
        console.error("Error adding recipe:", error);
        res.status(500).json({ message: '无法添加配方' });
    }
});

// Root route (optional - can redirect or serve a main page)
app.get('/', (req, res) => {
    // Example: Redirect to recipes page or a dashboard
    res.redirect('/recipes/');
});

// Serve recipe detail page (HTML only, JS fetches data)
// THIS IS THE CORRECT ONE TO KEEP
app.get('/recipes/:id', (req, res) => {
    // Basic validation for ID format if needed
    // Just serve the static HTML, the client-side JS will fetch data
    // Visit count is handled by middleware
    res.sendFile(path.join(__dirname, 'recipes', 'recipe.html'));
});

// API to get recipe details (REMOVED like status)
app.get('/api/recipes/:id/details', async (req, res) => {
    const recipeId = req.params.id;
    try {
        const recipes = await readRecipes();
        const recipe = recipes.find(r => r.id === recipeId);

        if (!recipe) {
            return res.status(404).json({ message: '配方未找到' });
        }

        // Initialize fields if missing (for safety) - likeCount/likedBy no longer needed here
        recipe.visitCount = recipe.visitCount || 0;
        // recipe.likeCount = recipe.likeCount || 0; // Removed
        // recipe.likedBy = recipe.likedBy || []; // Removed

        // Check if current user has liked this recipe - REMOVED
        // const userId = req.session.userId;
        // const liked = userId ? recipe.likedBy.includes(userId) : false; // Removed

        // Return recipe data WITHOUT like status
        // Destructure to exclude likedBy if it still exists in the file
        const { likedBy, likeCount, ...recipeData } = recipe;
        res.json(recipeData); // Send recipe data only

    } catch (error) {
        console.error("Error fetching recipe details:", error);
        res.status(500).json({ message: '获取配方详情时出错' });
    }
});

// --- REMOVED Like/Unlike API Routes ---
/*
app.post('/api/recipes/:id/toggle_like', isAuthenticated, async (req, res) => {
    // ... removed implementation ...
});
*/

// Start server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`); // Update console log message
});

// --- Helper Functions ---

// Function to read JSON file, return empty array/object on error/not found
const readJsonFile = async (filePath, defaultReturn = []) => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`File not found: ${filePath}. Returning default.`);
            return defaultReturn; // Return default if file doesn't exist
        }
        console.error(`Error reading or parsing JSON file ${filePath}:`, error);
        // Depending on severity, you might want to throw error or return default
        // For read operations, returning default might be safer to prevent crashes
        return defaultReturn;
    }
};

// Function to write JSON file
const writeJsonFile = async (filePath, data) => {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing JSON file ${filePath}:`, error);
        throw error; // Re-throw write errors as they are critical
    }
};

// Specific read/write functions using the helpers
const readRecipes = () => readJsonFile(RECIPES_FILE, []);
const writeRecipes = (data) => writeJsonFile(RECIPES_FILE, data);
const readUsers = () => readJsonFile(USERS_FILE, []);
const writeUsers = (data) => writeJsonFile(USERS_FILE, data);
const readComments = () => readJsonFile(COMMENTS_FILE, {}); // Default is object for comments
const writeComments = (data) => writeJsonFile(COMMENTS_FILE, data);

// --- Middleware Setup ---
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your strong secret key here', // *** CHANGE THIS ***
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// Middleware to count specific page visits and persist to stats.json
// trackedPaths is already defined earlier in the file

app.use((req, res, next) => {
    const isPageRequest = req.method === 'GET' && (!path.extname(req.path) || req.path.endsWith('/'));

    if (isPageRequest) {
        let pathKey = req.path;
        if (!pathKey.endsWith('/')) pathKey += '/';
        if (!pathKey.startsWith('/')) pathKey = '/' + pathKey;

        // Check if the path is one we are tracking in memory
        if (pageVisitCounts.hasOwnProperty(pathKey)) {
            pageVisitCounts[pathKey]++;
            console.log(`[Visit Counter - Memory] Updated counts: ${JSON.stringify(pageVisitCounts)}`);
        }
    }
    next(); // Continue to the next middleware/route
});

// ...existing code...

// --- Start Server ---
// ...existing code...
