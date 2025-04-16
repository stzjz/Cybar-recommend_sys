# Cybar

## 项目简介
Cybar是一个鸡尾酒配方管理和酒精度计算工具，帮助用户管理鸡尾酒配方并计算混合酒精饮料的酒精含量。该项目采用现代化的网页界面，提供友好的用户体验。

## 功能特点

- **配方管理**：浏览、查看配方列表（分页显示，包含创建者信息）和详情（包含创建者信息）。
- **酒精度计算**：精确计算混合饮料的最终酒精含量。
- **用户认证**：提供用户注册和登录功能，使用会话管理。
- **登录状态显示**：在页面右上角显示当前登录状态，提供登录/注册或注销链接。
- **添加新配方**：登录用户可以访问受保护的页面添加自定义鸡尾酒配方，自动计算并保存预估酒精度，同时记录创建者用户名。
- **评论系统**：登录用户可以对配方发表评论，查看其他用户的评论。
- **后台管理**：
    - **管理员访问**：只有管理员角色的用户可以访问后台管理页面。
    - **统计数据**：查看基本统计数据（总配方数、总用户数、各页面访问次数图表）。
    - **配方管理**：管理员可以删除现有配方。
    - **用户管理**：管理员可以查看用户列表、删除用户、修改用户角色（user/admin）。
    - **评论管理**：管理员可以查看所有评论列表，并删除任何评论。

## 技术栈

- 前端：HTML5、CSS3、JavaScript (原生), Chart.js (用于统计图表)
- 后端：Node.js、Express
- 数据存储：JSON文件
- 会话管理：express-session

## 安装指南

### 环境要求
- Node.js (v14.0.0或更高版本)
- npm (v6.0.0或更高版本)

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yourusername/Cybar.git

# 进入项目目录
cd Cybar

# 安装依赖
npm install
```

## 使用方法

### 启动服务器

```bash
# 启动服务器
node server.js
```

服务器将在 http://localhost:8080 启动 (注意端口已改为8080)。

### 使用说明

1. **浏览配方**：访问 http://localhost:8080/recipes/ 查看鸡尾酒配方列表（分页显示，包含创建者）。
2. **查看配方详情/评论**：点击配方列表中的链接进入详情页查看配方（包含创建者）、评论，并发表评论（需登录）。
3. **计算酒精度**：访问 http://localhost:8080/calculator/ 计算混合饮料的酒精含量
4. **用户注册**：访问 http://localhost:8080/auth/register/ 进行注册
5. **用户登录**：访问 http://localhost:8080/auth/login/ 进行登录
6. **添加配方**：登录后访问 http://localhost:8080/add/ 添加新的鸡尾酒配方（将记录您的用户名）。
7. **后台管理**：以管理员身份登录后访问 http://localhost:8080/admin/ 管理配方、用户和评论，查看统计数据。

## API 端点 (部分)

- `GET /api/recipes?page=<page_number>&limit=<items_per_page>`: 获取配方列表（分页）。
    - 返回: `{ recipes: [{..., createdBy: string}, ...], totalItems: number, totalPages: number, currentPage: number }`
- `GET /api/recipes/:id`: 获取单个配方详情。
    - 返回: `{..., createdBy: string}`
- `POST /api/recipes`: 添加新配方 (需要登录，自动添加 `createdBy` 字段)。
- `DELETE /api/recipes/:id`: 删除配方 (需要管理员权限)。
- `GET /api/recipes/:id/comments`: 获取配方的评论。
- `POST /api/recipes/:id/comments`: 添加评论 (需要登录)。
- `DELETE /api/comments/:commentId`: 删除评论 (需要管理员权限)。
- `POST /api/register`: 用户注册。
- `POST /api/login`: 用户登录。
- `POST /api/logout`: 用户注销。
- `GET /api/auth/status`: 获取当前登录状态。
- `GET /api/admin/stats`: 获取后台统计数据 (需要管理员权限)。
- `GET /api/admin/users`: 获取用户列表 (需要管理员权限)。
- `DELETE /api/admin/users/:userId`: 删除用户 (需要管理员权限)。
- `PUT /api/admin/users/:userId/role`: 修改用户角色 (需要管理员权限)。
- `GET /api/admin/comments`: 获取所有评论 (需要管理员权限)。

## 项目结构

```
Cybar/
├── admin/              # 后台管理界面 (HTML, CSS, JS)
│   ├── index.html
│   ├── admin.css
│   └── admin.js
├── add/                # 添加配方界面 (HTML, JS)
│   ├── index.html
│   └── script.js       # (Or your actual script name)
├── auth/               # 用户认证相关文件
│   ├── login.html
│   ├── register.html
│   └── auth.js
├── calculator/         # 酒精度计算器 (HTML, JS)
│   ├── index.html
│   └── calculator.js   # (Or your actual script name)
├── js/                 # 全局 JavaScript
│   └── global.js       # Handles auth status display, logout
├── recipes/            # 配方列表和详情 (HTML, JS)
│   ├── index.html      # Recipe list page (paginated)
│   ├── detail.html     # Recipe detail page
│   ├── recipes.js      # Handles recipe list logic (pagination)
│   └── detail.js       # Handles recipe detail logic
├── server.js           # Node.js服务器入口
├── package.json        # 项目依赖
├── recipes.json        # 配方数据存储 (包含 createdBy)
├── users.json          # 用户数据存储
├── comments.json       # 评论数据存储
├── style.css           # 全局样式
└── README.md           # 项目文档
```

## 开发指南

### 添加新功能

1. 创建相关页面和JavaScript文件
2. 添加API端点到server.js（如需要），确保添加适当的认证和授权中间件 (isAuthenticated, isAdmin)
3. 更新全局样式以保持一致性
4. 更新相关文档 (README.md)

### 代码风格

- 保持代码的简洁和可读性
- 使用语义化HTML元素
- 使用类选择器而非ID选择器进行样式设计
- 注释关键功能和API端点

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

