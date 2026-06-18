# 个人待办清单

一个全栈 Web 待办清单应用，支持用户注册登录，每个用户独立管理自己的待办事项。

## 技术栈

- **前端**: HTML + CSS + 原生 JavaScript（无框架）
- **后端**: Node.js + Express
- **数据存储**: 内存数组（重启后数据清空，仅用于演示）
- **认证**: JWT (JSON Web Token)
- **密码加密**: bcryptjs

## 功能特性

- 用户注册和登录（邮箱 + 密码）
- 待办事项的增删改查
- 标记待办事项为已完成/待办
- 按状态筛选（全部/待办/已完成）
- 实时统计（总事项数、待办数、已完成数）
- 相对时间显示，悬停显示绝对时间
- 错误提示条（3秒自动消失）
- 响应式设计

## 项目结构

```
.
├── package.json          # 项目配置文件
├── server.js             # 后端服务入口
├── README.md             # 项目说明文档
└── public/               # 前端静态文件目录
    ├── index.html        # 待办清单主页
    ├── login.html        # 登录页面
    ├── register.html     # 注册页面
    ├── css/
    │   └── style.css     # 样式文件
    └── js/
        ├── auth.js       # 认证相关逻辑
        └── app.js        # 待办清单主逻辑
```

## 安装与运行

### 环境要求

- Node.js >= 12.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

服务启动后，在浏览器中访问：

```
http://localhost:3001
```

## API 接口

### 认证相关

#### POST /api/register
用户注册

请求体：
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

响应：
```json
{
  "message": "注册成功",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### POST /api/login
用户登录

请求体：
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

响应：
```json
{
  "message": "登录成功",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### 待办事项相关

所有待办事项接口都需要在请求头中携带 JWT Token：
```
Authorization: Bearer {token}
```

#### GET /api/todos
获取当前用户的所有待办事项（按创建时间降序排列）

响应：
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "待办事项标题",
    "description": "描述（可选）",
    "completed": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/todos
创建新的待办事项

请求体：
```json
{
  "title": "待办事项标题",
  "description": "描述（可选）"
}
```

响应：
```json
{
  "id": 1,
  "userId": 1,
  "title": "待办事项标题",
  "description": "",
  "completed": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /api/todos/:id
更新待办事项

请求体（可部分更新）：
```json
{
  "title": "新标题",
  "description": "新描述",
  "completed": true
}
```

响应：返回更新后的待办事项对象

#### DELETE /api/todos/:id
删除待办事项

响应：
```json
{
  "message": "删除成功"
}
```

## 使用说明

1. 首次使用请先注册账号（访问 http://localhost:3001/register ）
2. 注册成功后自动跳转到待办清单主页
3. 在输入框中输入待办事项标题，点击"添加"按钮创建
4. 点击复选框标记事项为已完成/待办
5. 点击"编辑"按钮修改事项标题
6. 点击"删除"按钮删除事项（需确认）
7. 使用顶部筛选下拉框按状态筛选
8. 底部固定显示统计信息
9. 点击右上角"退出登录"退出

## 注意事项

- 数据存储在内存中，重启服务器后所有数据将清空
- JWT 密钥为硬编码的 `your-secret-key-change-in-production`，生产环境请务必修改
- 本项目仅用于演示和学习目的
