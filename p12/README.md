# 个人书签收藏夹

一个全栈Web应用，支持用户注册登录，每个用户独立管理自己的书签链接。

## 技术栈

- **前端**: React 18 + React Router 6 + Vite
- **后端**: Node.js + Express
- **认证**: JWT (jsonwebtoken + bcryptjs)
- **数据存储**: 内存数组（重启后清空，预留MySQL接口）

## 功能特性

1. 用户注册和登录（邮箱格式校验、密码至少6位）
2. 添加/编辑/删除书签（标题、URL、分类、备注）
3. 书签列表按添加时间降序排列
4. 按分类筛选 + 关键词搜索（标题/网址，忽略大小写）
5. URL截断显示（30字符）+ 悬停显示完整URL
6. 点击链接前确认跳转
7. 时间显示为相对时间，悬停显示精确时间
8. 分页功能（每页5条）
9. 实时统计（总数、当前分类、最近7天）
10. 全局错误提示 + 连续3次失败后的持久错误横幅

## 目录结构

```
p12/
├── backend/          # 后端服务
│   ├── config/       # 配置
│   ├── middleware/   # 中间件
│   ├── routes/       # 路由
│   ├── store/        # 数据存储（内存数组 + MySQL接口预留）
│   ├── server.js     # 入口文件
│   └── package.json
└── frontend/         # 前端应用
    ├── src/
    │   ├── components/   # UI组件
    │   ├── context/      # React Context
    │   ├── pages/        # 页面
    │   ├── styles/       # 全局样式
    │   ├── utils/        # 工具函数
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 环境变量

### 后端 (backend/.env)

复制 `.env.example` 为 `.env` 并按需修改：

```
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:5173
```

- `PORT`: 后端服务端口（默认5000）
- `JWT_SECRET`: JWT签名密钥（生产环境必须修改）
- `CORS_ORIGIN`: 允许跨域的前端地址

## 安装与启动

### 1. 启动后端服务

```bash
cd backend
npm install    # 首次安装依赖
npm start
```

后端服务将运行在 `http://localhost:5000`

### 2. 启动前端服务

新开一个终端：

```bash
cd frontend
npm install    # 首次安装依赖
npm run dev
```

前端服务将运行在 `http://localhost:5173`

### 3. 访问应用

在浏览器中打开 `http://localhost:5173`

## API 接口

### 认证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 书签（需要Token）

- `GET /api/bookmarks` - 获取书签列表（支持参数：category, search, page, pageSize）
- `POST /api/bookmarks` - 添加书签
- `PUT /api/bookmarks/:id` - 更新书签
- `DELETE /api/bookmarks/:id` - 删除书签

## 替换为MySQL数据库

后端数据存储当前使用内存数组，重启后数据会清空。如需使用MySQL：

1. 安装依赖：`cd backend && npm install mysql2`
2. 打开 `backend/store/index.js`
3. 按照文件顶部的注释说明，将内存数组替换为MySQL连接池和SQL查询
4. 对应修改各CRUD函数为异步数据库操作

## 跨域配置

后端通过 `cors` 中间件处理跨域，`CORS_ORIGIN` 环境变量控制允许的前端地址。
前端Vite开发服务器已配置代理 `/api` 到后端，避免开发环境跨域问题。
