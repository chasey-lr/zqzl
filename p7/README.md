# 问卷星 - 在线问卷创建与填写系统

一个功能完整的全栈在线问卷应用，支持问卷创建、发布、填写和统计。

## 技术栈

- **前端**: React 18, React Router v6
- **后端**: Node.js, Express.js
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (JSON Web Token)
- **测试**: Jest + Supertest

## 目录结构

```
p7/
├── backend/              # 后端服务
│   ├── data/             # SQLite数据库文件（自动创建）
│   ├── middleware/       # 中间件
│   │   └── auth.js       # JWT认证中间件
│   ├── routes/           # API路由
│   │   ├── auth.js       # 用户认证路由
│   │   ├── surveys.js    # 问卷管理路由
│   │   └── responses.js  # 回答提交路由
│   ├── scripts/          # 脚本
│   │   └── initDB.js     # 数据库初始化脚本
│   ├── tests/            # 单元测试
│   │   └── survey.test.js
│   ├── .env              # 环境变量
│   ├── db.js             # 数据库连接
│   ├── package.json
│   └── server.js         # 服务入口
├── frontend/             # 前端应用
│   ├── public/
│   └── src/
│       ├── components/   # 通用组件
│       ├── context/      # React Context
│       ├── pages/        # 页面组件
│       ├── styles/       # 样式文件
│       ├── utils/        # 工具函数
│       ├── App.js
│       └── index.js
└── README.md
```

## 环境变量配置

### 后端 (`backend/.env`)

```env
PORT=5000                          # 后端服务端口
JWT_SECRET=your_jwt_secret_key     # JWT签名密钥（生产环境请修改）
DB_PATH=./data/survey.db           # SQLite数据库文件路径
NODE_ENV=development               # 运行环境
```

## 安装与启动

### 前置要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 步骤 1: 安装后端依赖

```bash
cd backend
npm install
```

### 步骤 2: 初始化数据库

```bash
# 方式1：运行初始化脚本
npm run init-db

# 方式2：直接启动服务，首次启动会自动创建表结构
npm start
```

### 步骤 3: 启动后端服务

```bash
# 开发模式（热重载）
npm run dev

# 或生产模式
npm start
```

后端服务将在 `http://localhost:5000` 启动

### 步骤 4: 安装前端依赖（新终端窗口）

```bash
cd frontend
npm install
```

### 步骤 5: 启动前端开发服务

```bash
npm start
```

前端将在 `http://localhost:3000` 启动，已配置代理转发API请求到后端。

### 步骤 6: 运行后端测试

```bash
cd backend
npm test
```

## 功能特性

### 1. 用户系统
- 邮箱+密码注册/登录
- JWT 令牌认证
- 密码使用 bcrypt 加密存储

### 2. 问卷管理
- 创建/编辑/删除问卷
- 支持标题（最多80字）、描述、截止日期
- 三种问题类型：单选题、多选题、文本题
- 拖拽调整问题顺序
- 敏感词自动标注（"测试"、"demo"等自动追加"(示例)"）
- 状态管理：草稿 → 开放中 → 已关闭

### 3. 问卷填写
- 链接分享：`/fill/:id`
- 必答题校验（红星标记）
- 提交校验 + 高亮滚动定位
- IP + Cookie 双重防重复提交

### 4. 统计分析
- 总提交人数统计
- 选择题：CSS 柱状图（票数+百分比）
- 文本题：带序号的回答列表
- 超50份提交显示🔥热门标记

### 5. 列表管理
- 状态筛选（草稿/开放中/已关闭）
- 标题关键词搜索
- 分页（每页5条）
- 相对时间显示（悬停查看精确时间）

### 6. 错误处理
- 5秒自动消失的错误提示条
- 连续2次失败显示持久横幅 + 重试按钮

## API 接口文档

所有接口路径前缀为 `/api`

### 用户认证

#### 注册
```
POST /api/auth/register

请求体:
{
  "email": "string (必填, 有效邮箱格式)",
  "password": "string (必填, 至少6位)"
}

响应 201:
{
  "message": "注册成功",
  "token": "JWT令牌字符串",
  "user": { "id": 1, "email": "user@example.com" }
}

响应 400: { "error": "错误说明" }
```

#### 登录
```
POST /api/auth/login

请求体:
{
  "email": "string",
  "password": "string"
}

响应 200:
{
  "message": "登录成功",
  "token": "JWT令牌字符串",
  "user": { "id": 1, "email": "user@example.com" }
}

响应 401: { "error": "邮箱或密码错误" }
```

---

### 问卷管理

> 以下接口（除 /fill/:id 和 /public 外）均需在请求头携带 JWT:
> `Authorization: Bearer <token>`

#### 获取我的问卷列表
```
GET /api/surveys?status=all&search=&page=1&pageSize=5

查询参数:
- status: all|draft|open|closed (可选，默认all)
- search: 标题关键词 (可选)
- page: 页码 (默认1)
- pageSize: 每页数量 (默认5)

响应 200:
{
  "surveys": [
    {
      "id": 1,
      "user_id": 1,
      "title": "问卷标题",
      "description": "描述",
      "status": "draft|open|closed",
      "deadline": "ISO时间|null",
      "created_at": "ISO时间",
      "published_at": "ISO时间|null",
      "closed_at": "ISO时间|null",
      "response_count": 0
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 5,
    "total": 10,
    "totalPages": 2
  }
}
```

#### 获取公开问卷列表
```
GET /api/surveys/public?page=1&pageSize=10

响应 200: 同上结构，仅返回 status=open 的问卷
```

#### 获取单个问卷详情（含问题）
```
GET /api/surveys/:id

响应 200:
{
  "id": 1,
  "title": "...",
  "description": "...",
  "status": "...",
  ...
  "questions": [
    {
      "id": 1,
      "type": "single|multiple|text",
      "title": "问题标题",
      "required": true|false,
      "sort_order": 0,
      "options": ["选项1", "选项2"]
    }
  ]
}

响应 404: { "error": "问卷不存在" }
```

#### 获取可填写问卷（公开接口，无需登录）
```
GET /api/surveys/fill/:id

响应 200: 同上结构
响应 403: { "error": "问卷未开放或已关闭" }
响应 403: { "error": "问卷已过截止日期" }
```

#### 创建问卷
```
POST /api/surveys

请求体:
{
  "title": "string (必填, 最多80字)",
  "description": "string (可选)",
  "deadline": "ISO时间|null (可选)",
  "questions": [
    {
      "type": "single|multiple|text",
      "title": "string (必填)",
      "required": true|false,
      "sort_order": 0,
      "options": ["选项1", "选项2"]  // 单选/多选必填，至少2个
    }
  ]
}

响应 201:
{
  "message": "问卷创建成功",
  "survey": { /* 完整问卷对象，含questions */ }
}

响应 400: { "error": "错误说明" }
```

#### 更新问卷
```
PUT /api/surveys/:id

请求体: 同创建接口（部分字段可选）

注意：仅 status=draft 的问卷可编辑

响应 200: { "message": "问卷更新成功", "survey": {...} }
```

#### 发布问卷
```
POST /api/surveys/:id/publish

响应 200:
{
  "message": "问卷发布成功",
  "survey": {...},
  "fillLink": "/fill/1"
}

响应 400: { "error": "问卷至少需要一个问题才能发布" }
```

#### 关闭问卷
```
POST /api/surveys/:id/close

响应 200: { "message": "问卷已关闭", "survey": {...} }

注意：关闭后不可再次开启
```

#### 删除问卷
```
DELETE /api/surveys/:id

响应 200: { "message": "问卷删除成功" }

注意：会级联删除所有回答数据
```

---

### 回答提交

#### 检查是否已提交（公开接口）
```
GET /api/responses/check/:surveyId

响应 200: { "submitted": true|false }
```

#### 提交回答（公开接口）
```
POST /api/responses/submit

请求体:
{
  "survey_id": 1,
  "answers": [
    { "question_id": 1, "answer": "红色" },
    { "question_id": 2, "answer": "[\"篮球\",\"游泳\"]" },  // 多选需JSON字符串
    { "question_id": 3, "answer": "文本回答内容" }
  ]
}

响应 200: { "message": "提交成功，感谢参与！" }
响应 400: { "error": "错误说明", "questionId": 1 }  // 校验失败
响应 403: { "error": "您已提交过此问卷" }
响应 403: { "error": "问卷未开放或已关闭" }
```

#### 获取问卷统计
```
GET /api/responses/stats/:surveyId

需要问卷创建者权限

响应 200:
{
  "survey": { "id": 1, "title": "...", "status": "...", ... },
  "totalResponses": 100,
  "questionStats": [
    {
      "questionId": 1,
      "type": "single",
      "title": "年龄段",
      "required": true,
      "options": [
        { "label": "18岁以下", "count": 15, "percentage": 15 },
        ...
      ]
    },
    {
      "questionId": 2,
      "type": "text",
      "title": "您的建议",
      "textAnswers": [
        { "index": 1, "content": "希望增加...", "created_at": "..." },
        ...
      ]
    }
  ]
}

响应 404: { "error": "问卷不存在" }
```

---

### 健康检查
```
GET /api/health

响应 200: { "status": "ok", "message": "Survey API server is running" }
```

## 常见问题

### Q: 前端启动后无法访问后端？
A: 请确认后端已在5000端口启动。前端 `package.json` 已配置 `"proxy": "http://localhost:5000"`，生产环境请改用 nginx 或 CORS 配置。

### Q: 数据库文件在哪里？
A: 默认位于 `backend/data/survey.db`，可通过 `.env` 中 `DB_PATH` 修改。

### Q: 如何修改JWT过期时间？
A: 编辑 `backend/routes/auth.js` 中 `jwt.sign()` 的 `expiresIn` 参数。

### Q: 如何添加更多敏感词？
A: 编辑 `backend/routes/surveys.js` 顶部的 `SENSITIVE_WORDS` 数组。

## License

MIT
