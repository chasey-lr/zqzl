# 团队投票决策系统

一个功能完整的团队投票决策全栈 Web 应用，支持创建投票、参与投票、实时结果展示、评论互动等功能。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + React Router
- **后端**: Node.js + Express + JWT 认证
- **数据库**: MongoDB + Mongoose
- **测试**: Jest + Supertest

## 功能特性

### 用户认证
- 邮箱 + 密码注册登录
- JWT Token 认证
- 未登录用户可浏览公开投票

### 投票管理
- 创建公开/私密投票
- 投票主题（最多60字）、描述（可选）
- 2-8 个投票选项（每个最多30字）
- 自定义截止日期（默认7天）
- 私密投票支持邀请指定邮箱用户

### 投票参与
- 单选投票
- 实时进度条展示（彩色进度条 + 票数 + 百分比）
- 支持更改投票（截止前）
- 每个用户只能投一次

### 投票列表
- 按状态筛选（进行中/已结束/全部）
- 按主题关键词搜索
- 分页展示（每页6条）

### 详情页
- 投票信息展示
- 实时进度条（数字递增动画）
- 参与用户列表（前10个头像 + N更多）
- 私密投票隐藏投票人身份
- 剩余时间倒计时

### 实时更新
- 每10秒自动轮询更新
- 后台标签页暂停轮询
- 切回前台立即刷新
- 连续3次失败暂停轮询，支持手动刷新

### 评论功能
- 发表评论（最多200字）
- 评论点赞（每个用户只能点一次）
- 评论按时间倒序排列

### 创建者权限
- 编辑投票（已投票选项不可删除）
- 提前结束投票
- 删除投票（二次确认）

### 其他特性
- 全局错误提示（5秒自动消失）
- 相对时间显示（悬停显示精确时间）
- 响应式设计

## 项目结构

```
team-voting/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   └── server.js       # 入口文件
│   ├── tests/              # 测试文件
│   ├── .env.example        # 环境变量示例
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── context/        # React Context
│   │   ├── pages/          # 页面组件
│   │   ├── styles/         # 样式文件
│   │   ├── types/          # TypeScript 类型定义
│   │   ├── utils/          # 工具函数
│   │   ├── App.tsx         # 应用入口组件
│   │   └── main.tsx        # 入口文件
│   ├── index.html
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 14.0.0
- MongoDB >= 4.0
- npm 或 yarn

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd team-voting
```

#### 2. 配置环境变量

**后端配置**：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/team-voting
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

环境变量说明：
- `PORT`: 后端服务端口
- `MONGO_URI`: MongoDB 连接地址
- `JWT_SECRET`: JWT 签名密钥（请设置为复杂的随机字符串）
- `JWT_EXPIRES_IN`: JWT 过期时间

#### 3. 安装依赖

**安装后端依赖**：

```bash
cd backend
npm install
```

**安装前端依赖**：

```bash
cd ../frontend
npm install
```

### 启动项目

**启动 MongoDB**（确保 MongoDB 服务已运行）

**启动后端服务**：

```bash
cd backend
npm run dev
```

后端服务将在 `http://localhost:5000` 启动

**启动前端开发服务器**：

```bash
cd frontend
npm run dev
```

前端开发服务器将在 `http://localhost:3000` 启动

### 构建生产版本

**构建前端**：

```bash
cd frontend
npm run build
```

构建产物将输出到 `frontend/dist` 目录

**启动后端生产模式**：

```bash
cd backend
npm start
```

## API 文档

### 基础路径

所有 API 接口都以 `/api` 为前缀

### 认证相关

#### 1. 用户注册

- **路径**: `POST /api/auth/register`
- **描述**: 注册新用户
- **请求体**:
  ```json
  {
    "email": "user@example.com",
    "password": "123456",
    "nickname": "昵称"
  }
  ```
  - `email` (string, 必填): 用户邮箱
  - `password` (string, 必填): 密码（至少6位）
  - `nickname` (string, 可选): 用户昵称
- **返回**:
  ```json
  {
    "_id": "用户ID",
    "email": "user@example.com",
    "nickname": "昵称",
    "avatar": "",
    "token": "JWT Token"
  }
  ```

#### 2. 用户登录

- **路径**: `POST /api/auth/login`
- **描述**: 用户登录
- **请求体**:
  ```json
  {
    "email": "user@example.com",
    "password": "123456"
  }
  ```
  - `email` (string, 必填): 用户邮箱
  - `password` (string, 必填): 用户密码
- **返回**: 同注册接口

#### 3. 获取当前用户信息

- **路径**: `GET /api/auth/me`
- **描述**: 获取当前登录用户信息
- **请求头**: `Authorization: Bearer <token>`
- **返回**:
  ```json
  {
    "_id": "用户ID",
    "email": "user@example.com",
    "nickname": "昵称",
    "avatar": ""
  }
  ```

### 投票相关

#### 1. 获取公开投票列表

- **路径**: `GET /api/polls/public`
- **描述**: 获取所有公开投票（无需登录）
- **查询参数**:
  - `page` (number, 可选): 页码，默认 1
  - `limit` (number, 可选): 每页数量，默认 6
- **返回**:
  ```json
  {
    "polls": [...],
    "total": 100,
    "page": 1,
    "pages": 17,
    "limit": 6
  }
  ```

#### 2. 获取我的投票列表

- **路径**: `GET /api/polls`
- **描述**: 获取当前用户创建的投票列表
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `status` (string, 可选): 筛选状态，可选值: `all`/`active`/`ended`，默认 `all`
  - `search` (string, 可选): 搜索关键词
  - `page` (number, 可选): 页码，默认 1
  - `limit` (number, 可选): 每页数量，默认 6
- **返回**: 同公开投票列表

#### 3. 获取投票详情

- **路径**: `GET /api/polls/:id`
- **描述**: 获取投票详细信息
- **请求头**: `Authorization: Bearer <token>`（私密投票需要）
- **路径参数**:
  - `id` (string, 必填): 投票ID
- **返回**:
  ```json
  {
    "_id": "投票ID",
    "title": "投票主题",
    "description": "投票描述",
    "options": [
      {
        "_id": "子文档ID",
        "optionId": "选项唯一标识",
        "text": "选项文本",
        "votes": 10,
        "color": "#3B82F6"
      }
    ],
    "type": "public",
    "invitedEmails": [],
    "creator": { ... },
    "deadline": "2024-01-01T00:00:00.000Z",
    "isEnded": false,
    "status": "active",
    "voteRecords": [...],
    "userVote": { ... },
    "totalVotes": 100,
    "createdAt": "2023-12-25T00:00:00.000Z"
  }
  ```

#### 4. 创建投票

- **路径**: `POST /api/polls`
- **描述**: 创建新投票
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "title": "投票主题",
    "description": "投票描述",
    "options": ["选项1", "选项2", "选项3"],
    "type": "public",
    "invitedEmails": ["user1@example.com"],
    "deadline": "2024-01-01T00:00:00.000Z"
  }
  ```
  - `title` (string, 必填): 投票主题（最多60字）
  - `description` (string, 可选): 投票描述
  - `options` (string[], 必填): 选项列表（2-8个，每个最多30字）
  - `type` (string, 可选): 投票类型，`public` 或 `private`，默认 `public`
  - `invitedEmails` (string[], 可选): 受邀用户邮箱列表（私密投票时使用）
  - `deadline` (string, 可选): 截止日期（ISO格式），默认7天后
- **返回**: 投票详情

#### 5. 更新投票

- **路径**: `PUT /api/polls/:id`
- **描述**: 更新投票信息（仅创建者可操作）
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "title": "新主题",
    "description": "新描述",
    "options": [
      { "optionId": "已有选项的optionId", "text": "修改后的文本" },
      { "optionId": "已有选项的optionId", "text": "选项2" },
      { "text": "新选项文本" }
    ]
  }
  ```
  - `options` 中每个元素可带 `optionId`（已有选项）或不带（新增选项）
  - 已有票数的选项只能修改文本，不能删除（省略其 optionId 视为删除）
- **返回**: 更新后的投票详情

#### 6. 删除投票

- **路径**: `DELETE /api/polls/:id`
- **描述**: 删除投票（仅创建者可操作）
- **请求头**: `Authorization: Bearer <token>`
- **返回**:
  ```json
  {
    "message": "投票已删除"
  }
  ```

#### 7. 投票

- **路径**: `POST /api/polls/:id/vote`
- **描述**: 参与投票或更改投票
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "optionId": "选项的唯一optionId"
  }
  ```
  - `optionId` (string, 必填): 选中的选项唯一标识（从投票详情接口的 options 数组中获取）
- **返回**: 更新后的投票详情

#### 8. 提前结束投票

- **路径**: `POST /api/polls/:id/end`
- **描述**: 提前结束投票（仅创建者可操作）
- **请求头**: `Authorization: Bearer <token>`
- **返回**: 更新后的投票详情

### 评论相关

#### 1. 获取评论列表

- **路径**: `GET /api/comments/:pollId`
- **描述**: 获取投票的评论列表
- **路径参数**:
  - `pollId` (string, 必填): 投票ID
- **查询参数**:
  - `page` (number, 可选): 页码
  - `limit` (number, 可选): 每页数量
- **返回**:
  ```json
  {
    "comments": [...],
    "total": 50,
    "page": 1,
    "pages": 3
  }
  ```

#### 2. 发表评论

- **路径**: `POST /api/comments/:pollId`
- **描述**: 发表评论
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "content": "评论内容"
  }
  ```
  - `content` (string, 必填): 评论内容（最多200字）
- **返回**: 评论详情

#### 3. 点赞/取消点赞评论

- **路径**: `POST /api/comments/:id/like`
- **描述**: 为评论点赞或取消点赞（每个用户只能点一次）
- **请求头**: `Authorization: Bearer <token>`
- **返回**: 更新后的评论详情

## 错误处理

所有 API 请求失败时返回统一格式：

```json
{
  "message": "错误信息描述"
}
```

常见错误码：
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 无权限
- `404`: 资源不存在

## 测试

### 运行后端测试

```bash
cd backend
npm test
```

测试覆盖的核心接口：
- 创建投票（正常情况、边界条件、错误处理）
- 投票接口（首次投票、更改投票、权限验证）

## 开发说明

### 后端开发

后端使用 Express 框架，采用 MVC 架构：
- `models/`: 数据模型定义（User, Poll, Comment）
- `controllers/`: 业务逻辑处理
- `routes/`: 路由定义
- `middleware/`: 中间件（认证等）

### 前端开发

前端使用 React + TypeScript + Vite：
- 状态管理使用 React Context (AuthContext, ErrorContext)
- 路由使用 React Router v6
- HTTP 请求使用 axios
- 样式使用纯 CSS

## License

MIT
