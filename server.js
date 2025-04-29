const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Use promises version of fs
const session = require('express-session'); // Import express-session

const app = express();
const port = 8080; // Change port number to 8080

// --- Visit Counter (In-Memory - Resets on server restart) ---
// Use an object to store counts per path
const pageVisitCounts = {
    '/': 0, // Main page
    '/recipes/': 0,
    '/calculator/': 0,
    '/add/': 0, // Count attempts to access, even if redirected
    '/admin/': 0, // Count attempts to access, even if redirected
    // Add other paths if needed, ensure they match the GET route paths
};

const USERS_FILE = path.join(__dirname, 'users.json');
const RECIPES_FILE = path.join(__dirname, 'recipes.json');
const COMMENTS_FILE = path.join(__dirname, 'comments.json');
const LIKES_FILE = path.join(__dirname, 'likes.json');
const FAVORITES_FILE = path.join(__dirname, 'favorites.json');

// 新增常量 - 自定义鸡尾酒相关文件路径
const INGREDIENTS_FILE = path.join(__dirname, 'custom', 'ingredients.json');
const CUSTOM_COCKTAILS_FILE = path.join(__dirname, 'custom', 'custom_cocktails.json');

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

// Helper function to read users
const readUsers = async () => {
    try {
        // Explicitly specify utf8 encoding and handle potential BOM
        let data = await fs.readFile(USERS_FILE, 'utf8');
        // Remove BOM if present (common issue with UTF-8 files edited in Windows Notepad)
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1);
        }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, return empty array
            console.log("users.json not found, returning empty array."); // Add log
            return [];
        }
        // Log the specific JSON parsing error as well
        console.error("Error reading or parsing users file:", error);
        throw error; // Re-throw other errors
    }
};

// Helper function to write users
const writeUsers = async (users) => {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing users file:", error);
        throw error;
    }
};

// --- Helper function to read comments ---
const readComments = async () => {
    try {
        let data = await fs.readFile(COMMENTS_FILE, 'utf8');
        if (data.charCodeAt(0) === 0xFEFF) { data = data.slice(1); }
        // Comments stored as an object: { "recipeId": [ { comment }, ... ], ... }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log("comments.json not found, returning empty object.");
            return {}; // Return empty object if file doesn't exist
        }
        console.error("Error reading or parsing comments file:", error);
        throw error;
    }
};

// --- Helper function to write comments ---
const writeComments = async (comments) => {
    try {
        await fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing comments file:", error);
        throw error;
    }
};

// Helper function to read likes
const readLikes = async () => {
    try {
        let data = await fs.readFile(LIKES_FILE, 'utf8');
        if (data.charCodeAt(0) === 0xFEFF) { data = data.slice(1); }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log("likes.json not found, returning empty object.");
            return {}; // Return empty object if file doesn't exist
        }
        console.error("Error reading or parsing likes file:", error);
        throw error;
    }
};

// Helper function to write likes
const writeLikes = async (likes) => {
    try {
        await fs.writeFile(LIKES_FILE, JSON.stringify(likes, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing likes file:", error);
        throw error;
    }
};

// Helper function to read favorites
const readFavorites = async () => {
    try {
        let data = await fs.readFile(FAVORITES_FILE, 'utf8');
        if (data.charCodeAt(0) === 0xFEFF) { data = data.slice(1); }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log("favorites.json not found, returning empty object.");
            return {}; // Return empty object if file doesn't exist
        }
        console.error("Error reading or parsing favorites file:", error);
        throw error;
    }
};

// Helper function to write favorites
const writeFavorites = async (favorites) => {
    try {
        await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing favorites file:", error);
        throw error;
    }
};

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

// API to get admin statistics
app.get('/api/admin/stats', isAuthenticated, isAdmin, (req, res) => { // Add isAdmin middleware
    // Return the visit counts object along with other stats
    const stats = {
        totalRecipes: 0,
        visits: pageVisitCounts, // Return the whole counts object
        totalUsers: 0
    };

    Promise.all([
        fs.readFile(RECIPES_FILE, 'utf8').then(data => JSON.parse(data.charCodeAt(0) === 0xFEFF ? data.slice(1) : data)).catch(() => []),
        fs.readFile(USERS_FILE, 'utf8').then(data => JSON.parse(data.charCodeAt(0) === 0xFEFF ? data.slice(1) : data)).catch(() => [])
    ]).then(([recipes, users]) => {
        stats.totalRecipes = recipes.length;
        stats.totalUsers = users.length;
        res.json(stats);
    }).catch(error => {
        console.error("Error reading files for stats:", error);
        // Still send stats, including potentially incomplete visit counts
        res.json(stats);
    });
});

// --- New API Route to get all users (Admin only - MODIFIED FOR PAGINATION) ---
app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const allUsers = await readUsers();
        // Map users to exclude password field
        const usersWithoutPasswords = allUsers.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role || 'user'
        }));

        // --- Pagination Logic ---
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results = {};
        const totalItems = usersWithoutPasswords.length;
        results.totalItems = totalItems;
        results.totalPages = Math.ceil(totalItems / limit);
        results.currentPage = page;

        // Slice the array for the current page
        results.users = usersWithoutPasswords.slice(startIndex, endIndex);
        // --- End Pagination Logic ---

        res.json(results); // Return paginated results

    } catch (error) {
        console.error("Error reading users for admin:", error);
        res.status(500).json({ message: '无法加载用户信息' });
    }
});

// --- New API Route to get ALL comments (Admin only - MODIFIED FOR PAGINATION) ---
app.get('/api/admin/comments', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const allCommentsData = await readComments();
        const flatCommentList = [];

        for (const recipeId in allCommentsData) {
            allCommentsData[recipeId].forEach(comment => {
                flatCommentList.push({
                    ...comment,
                    recipeId: recipeId
                });
            });
        }

        // Sort comments by timestamp, newest first (before pagination)
        flatCommentList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // --- Pagination Logic ---
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15; // Default limit
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results = {};
        const totalItems = flatCommentList.length;
        results.totalItems = totalItems;
        results.totalPages = Math.ceil(totalItems / limit);
        results.currentPage = page;

        // Slice the array for the current page
        results.comments = flatCommentList.slice(startIndex, endIndex);
        // --- End Pagination Logic ---

        res.json(results); // Send the paginated, flattened list

    } catch (error) {
        console.error("Error reading comments for admin:", error);
        res.status(500).json({ message: '无法加载评论信息' });
    }
});

// --- New API Route to DELETE a comment (Admin only) ---
// Ensure this route is already protected by isAuthenticated and isAdmin
app.delete('/api/comments/:commentId', isAuthenticated, isAdmin, async (req, res) => {
    const commentIdToDelete = req.params.commentId;
    const adminUsername = req.session.username; // Get admin username for logging
    console.log(`Admin '${adminUsername}' attempting to delete comment ID: ${commentIdToDelete}`); // Log attempt

    try {
        console.log(`Reading comments file: ${COMMENTS_FILE}`);
        const allComments = await readComments();
        let commentFound = false;
        let recipeIdOfComment = null;
        let updatedCommentsForRecipe = null;

        // Iterate through all recipes' comments to find the comment by ID
        for (const recipeId in allComments) {
            const commentsForRecipe = allComments[recipeId];
            const initialLength = commentsForRecipe.length;

            // Filter out the comment to delete
            const filteredComments = commentsForRecipe.filter(comment => comment.id !== commentIdToDelete);

            // Check if a comment was removed for this recipe
            if (filteredComments.length < initialLength) {
                console.log(`Comment ${commentIdToDelete} found in recipe ${recipeId}.`);
                commentFound = true;
                recipeIdOfComment = recipeId;
                updatedCommentsForRecipe = filteredComments; // Store the filtered array

                // If the recipe now has no comments, remove the recipe key
                if (updatedCommentsForRecipe.length === 0) {
                    console.log(`Recipe ${recipeId} has no comments left, removing key.`);
                    delete allComments[recipeId];
                } else {
                    // Otherwise, update the comments for this recipe
                    allComments[recipeId] = updatedCommentsForRecipe;
                }
                break; // Stop searching once found and removed
            }
        }

        if (!commentFound) {
            console.log(`Comment ${commentIdToDelete} not found.`);
            return res.status(404).json({ message: '未找到要删除的评论' });
        }

        // Write the updated comments object back to the file
        console.log(`Writing updated comments back to ${COMMENTS_FILE}`);
        await writeComments(allComments);
        console.log(`Admin '${adminUsername}' successfully deleted comment ${commentIdToDelete} from recipe ${recipeIdOfComment}`);
        res.status(200).json({ message: '评论删除成功' }); // Use 200 OK or 204 No Content

    } catch (error) {
        console.error(`Error during deletion of comment ${commentIdToDelete} by admin '${adminUsername}':`, error);
        // Check for specific file system errors if needed
        if (error.code) {
            console.error(`File system error code: ${error.code}`);
        }
        res.status(500).json({ message: '删除评论时发生服务器内部错误' });
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
        const userToDelete = users.find(u => u.id === req.params.userId); // Find user before filtering

        users = users.filter(user => user.id !== req.params.userId);

        if (users.length === initialLength) {
            return res.status(404).json({ message: '未找到要删除的用户' });
        }

        await writeUsers(users);
        console.log(`Admin User ${req.session.username} deleted user ${(userToDelete && userToDelete.username) || req.params.userId}`); // Log username if found
        res.status(200).json({ message: '用户删除成功' });

    } catch (error) {
        console.error(`Error deleting user ${req.params.userId}:`, error);
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
        const oldRole = users[userIndex].role;
        users[userIndex].role = req.body.newRole;

        await writeUsers(users);
        console.log(`Admin User ${req.session.username} changed role of user ${users[userIndex].username} from ${oldRole} to ${req.body.newRole}`);
        res.status(200).json({ message: '用户角色修改成功', updatedUser: { id: users[userIndex].id, username: users[userIndex].username, role: users[userIndex].role } });

    } catch (error) {
        console.error(`Error updating role for user ${req.params.userId}:`, error);
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

// API to get recipes (example) - Gets ALL recipes -> NOW WITH PAGINATION & COUNTS
app.get('/api/recipes', async (req, res) => {
    try {
        // Explicitly specify utf8 encoding and handle potential BOM
        let data = await fs.readFile(RECIPES_FILE, 'utf8');        // Remove BOM if present
        if (data.charCodeAt(0) === 0xFEFF) { data = data.slice(1); }
        const allRecipes = JSON.parse(data);

        // ▼▼▼ 新增：搜索逻辑 ▼▼▼
        let filteredRecipes = [...allRecipes];
        const searchQuery = req.query.search;
        if (searchQuery) {
            const lowerSearch = searchQuery.toLowerCase();
            filteredRecipes = allRecipes.filter(recipe => {
                // 匹配名称/原料/创建者/说明
                return recipe.name.toLowerCase().includes(lowerSearch) ||
                    recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowerSearch)) ||
                    (recipe.createdBy && recipe.createdBy.toLowerCase().includes(lowerSearch)) ||
                    recipe.instructions.toLowerCase().includes(lowerSearch);
            });
        }
        // ▲▲▲ 新增结束 ▲▲▲

        // --- Read Likes and Favorites Data ---
        let likes = {};
        let favorites = {};
        try {
            likes = await readLikes();
        } catch (likeError) {
            console.warn("Could not read likes file, defaulting to empty:", likeError.code);
        }
        try {
            favorites = await readFavorites();
        } catch (favError) {
            console.warn("Could not read favorites file, defaulting to empty:", favError.code);
        }
        // --- End Read Likes and Favorites ---

        // --- Pagination Logic ---
        const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || 10; const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results = {};
        const totalItems = filteredRecipes.length;
        results.totalItems = totalItems;
        results.totalPages = Math.ceil(totalItems / limit);
        results.currentPage = page;

        // Slice the array for the current page
        const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex);

        // --- Add Like and Favorite Counts to Paginated Recipes ---
        results.recipes = paginatedRecipes.map(recipe => {
            const likeCount = likes[recipe.id] ? likes[recipe.id].length : 0;
            const favoriteCount = favorites[recipe.id] ? favorites[recipe.id].length : 0;
            return {
                ...recipe, // Spread existing recipe properties
                likeCount: likeCount,
                favoriteCount: favoriteCount
            };
        });
        // --- End Add Counts ---

        res.json(results);
    } catch (error) {
        console.error("Error reading recipes:", error);
        if (error.code === 'ENOENT') { res.status(404).json({ message: '配方数据文件未找到' }); } else { res.status(500).json({ message: '读取配方时出错' }); }
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
    const creatorUsername = req.session.username; // Get username from session

    if (!newRecipe || !newRecipe.name) {
        return res.status(400).json({ message: '无效的配方数据' });
    }
    if (!creatorUsername) {
        // This should ideally not happen due to isAuthenticated, but good to check
        return res.status(401).json({ message: '无法确定创建者，请重新登录' });
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
        newRecipe.createdBy = creatorUsername; // Add the creator username
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

// API Route to toggle like for a recipe
app.post('/api/recipes/:id/like', isAuthenticated, async (req, res) => {
    const recipeId = req.params.id;
    const userId = req.session.userId;

    try {
        const likes = await readLikes();
        if (!likes[recipeId]) {
            likes[recipeId] = [];
        }

        const userIndex = likes[recipeId].indexOf(userId);
        if (userIndex === -1) {
            likes[recipeId].push(userId);
        } else {
            likes[recipeId].splice(userIndex, 1);
        }

        await writeLikes(likes);
        res.json({
            success: true,
            isLiked: userIndex === -1,
            likeCount: likes[recipeId].length
        });
    } catch (error) {
        console.error(`Error toggling like for recipe ${recipeId}:`, error);
        res.status(500).json({ message: '操作失败' });
    }
});

// API Route to toggle favorite for a recipe
app.post('/api/recipes/:id/favorite', isAuthenticated, async (req, res) => {
    const recipeId = req.params.id;
    const userId = req.session.userId;

    try {
        const favorites = await readFavorites();
        if (!favorites[recipeId]) {
            favorites[recipeId] = [];
        }

        const userIndex = favorites[recipeId].indexOf(userId);
        if (userIndex === -1) {
            favorites[recipeId].push(userId);
        } else {
            favorites[recipeId].splice(userIndex, 1);
        }

        await writeFavorites(favorites);
        res.json({
            success: true,
            isFavorited: userIndex === -1,
            favoriteCount: favorites[recipeId].length
        });
    } catch (error) {
        console.error(`Error toggling favorite for recipe ${recipeId}:`, error);
        res.status(500).json({ message: '操作失败' });
    }
});

// API Route to get like and favorite status for a recipe
// This route is still useful for the detail page or logged-in specific status
app.get('/api/recipes/:id/interactions', isAuthenticated, async (req, res) => {
    const recipeId = req.params.id;
    const userId = req.session.userId;

    try {
        const [likes, favorites] = await Promise.all([
            readLikes(),
            readFavorites()
        ]);

        const likeCount = likes[recipeId] ? likes[recipeId].length : 0;
        const favoriteCount = favorites[recipeId] ? favorites[recipeId].length : 0;
        const isLiked = likes[recipeId] ? likes[recipeId].includes(userId) : false;
        // --- Add isFavorited calculation ---
        const isFavorited = favorites[recipeId] ? favorites[recipeId].includes(userId) : false;

        res.json({
            likeCount,
            favoriteCount,
            isLiked,
            isFavorited // Include isFavorited in the response
        });
        // --- End Add isFavorited ---
    } catch (error) {
        console.error(`Error getting interactions for recipe ${recipeId}:`, error);
        // Send generic counts even on error, but indicate user status might be wrong
        res.status(500).json({
            likeCount: 0,
            favoriteCount: 0,
            isLiked: false,
            isFavorited: false,
            message: '无法加载交互状态'
        });
    }
});

// --- User Profile Routes ---
app.get('/api/user/current', isAuthenticated, (req, res) => {
    res.json({
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
    });
});

app.get('/api/user/likes', isAuthenticated, async (req, res) => {
    try {
        const likes = await readLikes();
        const recipes = await fs.readFile(RECIPES_FILE, 'utf8').then(JSON.parse);
        const likedRecipes = [];

        // 遍历所有配方的点赞数据
        for (const recipeId in likes) {
            if (likes[recipeId].includes(req.session.userId)) {
                const recipe = recipes.find(r => r.id === recipeId);
                if (recipe) {
                    likedRecipes.push(recipe);
                }
            }
        }

        res.json(likedRecipes);
    } catch (error) {
        console.error('Error fetching user likes:', error);
        res.status(500).json({ error: '获取点赞历史失败' });
    }
});

app.get('/api/user/favorites', isAuthenticated, async (req, res) => {
    try {
        const favorites = await readFavorites();
        const recipes = await fs.readFile(RECIPES_FILE, 'utf8').then(JSON.parse);
        const favoritedRecipes = [];

        // 遍历所有配方的收藏数据
        for (const recipeId in favorites) {
            if (favorites[recipeId].includes(req.session.userId)) {
                const recipe = recipes.find(r => r.id === recipeId);
                if (recipe) {
                    favoritedRecipes.push(recipe);
                }
            }
        }

        res.json(favoritedRecipes);
    } catch (error) {
        console.error('Error fetching user favorites:', error);
        res.status(500).json({ error: '获取收藏历史失败' });
    }
});

// --- Custom Cocktail Creator Routes ---
// 1. 静态页面路由
app.get('/custom/', (req, res) => {
    res.sendFile(path.join(__dirname, 'custom', 'index.html'));
});

// 2. 获取所有原料的API
app.get('/api/custom/ingredients', async (req, res) => {
    try {
        let data = await fs.readFile(INGREDIENTS_FILE, 'utf8');
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1);
        }
        const ingredients = JSON.parse(data);
        res.json(ingredients);
    } catch (error) {
        console.error("Error reading ingredients:", error);
        res.status(500).json({ message: '加载原料数据失败' });
    }
});

// 3. 创建自定义鸡尾酒的API
app.post('/api/custom/cocktails', isAuthenticated, async (req, res) => {
    try {
        const newCocktail = req.body;

        // 验证必填字段
        if (!newCocktail.name || !newCocktail.ingredients || newCocktail.ingredients.length === 0) {
            return res.status(400).json({ message: '鸡尾酒名称和至少一种原料是必填的' });
        }

        // 读取自定义鸡尾酒数据
        let customCocktails = { cocktails: [] };
        try {
            let data = await fs.readFile(CUSTOM_COCKTAILS_FILE, 'utf8');
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.slice(1);
            }
            customCocktails = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        // 给新鸡尾酒添加ID和创建者信息
        const cocktailId = Date.now().toString();
        const completeCocktail = {
            ...newCocktail,
            id: cocktailId,
            createdBy: req.session.username,
            createdAt: new Date().toISOString()
        };

        // 添加到自定义鸡尾酒列表
        customCocktails.cocktails.push(completeCocktail);
        await fs.writeFile(CUSTOM_COCKTAILS_FILE, JSON.stringify(customCocktails, null, 2), 'utf8');

        // 添加到全局配方列表（这样可以在recipes页面中显示）
        try {
            let recipesData = await fs.readFile(RECIPES_FILE, 'utf8');
            if (recipesData.charCodeAt(0) === 0xFEFF) {
                recipesData = recipesData.slice(1);
            }
            const recipes = JSON.parse(recipesData);

            // 转换成recipes.json格式
            const recipeFormat = {
                id: cocktailId,
                name: newCocktail.name,
                ingredients: newCocktail.ingredients.map(ing => ({
                    name: ing.name,
                    volume: ing.volume,
                    abv: ing.abv
                })),
                instructions: newCocktail.steps.join('\n'),
                estimatedAbv: newCocktail.estimatedAbv,
                createdBy: req.session.username,
                description: newCocktail.description || ''
            };

            recipes.push(recipeFormat);
            await fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');
        } catch (error) {
            console.error("Error updating recipes.json:", error);
            // 继续执行，因为自定义鸡尾酒已成功保存
        }

        res.status(201).json({
            message: '鸡尾酒创建成功',
            id: cocktailId
        });

    } catch (error) {
        console.error("Error creating custom cocktail:", error);
        res.status(500).json({ message: '创建鸡尾酒失败' });
    }
});

// 4. 获取所有自定义鸡尾酒的API
app.get('/api/custom/cocktails', async (req, res) => {
    try {
        let data = await fs.readFile(CUSTOM_COCKTAILS_FILE, 'utf8');
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1);
        }
        const customCocktails = JSON.parse(data);
        res.json(customCocktails);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // 文件不存在，返回空数组
            return res.json({ cocktails: [] });
        }
        console.error("Error reading custom cocktails:", error);
        res.status(500).json({ message: '加载自定义鸡尾酒失败' });
    }
});

// 5. 获取单个自定义鸡尾酒的API
app.get('/api/custom/cocktails/:id', async (req, res) => {
    const cocktailId = req.params.id;

    try {
        let data = await fs.readFile(CUSTOM_COCKTAILS_FILE, 'utf8');
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1);
        }
        const customCocktails = JSON.parse(data);

        const cocktail = customCocktails.cocktails.find(c => c.id === cocktailId);
        if (!cocktail) {
            return res.status(404).json({ message: '未找到指定的鸡尾酒' });
        }

        res.json(cocktail);
    } catch (error) {
        console.error(`Error reading custom cocktail ${cocktailId}:`, error);
        res.status(500).json({ message: '加载鸡尾酒详情失败' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`); // Update console log message
});
