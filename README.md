# Cybar

## 项目简介
Cybar是一个鸡尾酒配方管理和酒精度计算工具，帮助用户管理鸡尾酒配方并计算混合酒精饮料的酒精含量。该项目采用现代化的网页界面，提供友好的用户体验。

## 功能特点

- **配方管理**：浏览、查看和管理鸡尾酒配方
- **酒精度计算**：精确计算混合饮料的最终酒精含量
- **添加新配方**：添加自定义鸡尾酒配方到数据库
- **后台管理**：管理现有配方，查看访问统计

## 技术栈

- 前端：HTML5、CSS3、JavaScript (原生)
- 后端：Node.js、Express
- 数据存储：JSON文件

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

服务器将在 http://localhost:3000 启动。

### 使用说明

1. **浏览配方**：访问 http://localhost:3000/recipes/ 查看鸡尾酒配方列表
2. **计算酒精度**：访问 http://localhost:3000/calculator/ 计算混合饮料的酒精含量
3. **添加配方**：访问 http://localhost:3000/add/ 添加新的鸡尾酒配方
4. **后台管理**：访问 http://localhost:3000/admin/ 管理现有配方和查看统计数据

## 项目结构

```
Cybar/
├── admin/              # 后台管理界面
├── add/                # 添加配方界面
├── calculator/         # 酒精度计算器
├── recipes/            # 配方列表和详情
├── server.js           # Node.js服务器入口
├── package.json        # 项目依赖
├── recipes.json        # 配方数据存储
├── style.css           # 全局样式
└── README.md           # 项目文档
```

## 开发指南

### 添加新功能

1. 创建相关页面和JavaScript文件
2. 添加API端点到server.js（如需要）
3. 更新全局样式以保持一致性
4. 更新相关文档

### 代码风格

- 保持代码的简洁和可读性
- 使用语义化HTML元素
- 使用类选择器而非ID选择器进行样式设计
- 注释关键功能

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

本项目使用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 未来计划

- [ ] 用户账户系统
- [ ] 更多视觉效果和动画
- [ ] 移动应用支持
- [ ] 社区分享功能
- [ ] 多语言支持

## 联系方式

- 项目维护者: [Your Name](mailto:your.email@example.com)
- 项目主页: [GitHub Repository](https://github.com/yourusername/Cybar)