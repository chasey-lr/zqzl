# 团队任务看板 (Team Task Board)

一个用于小团队日常任务追踪的全栈 Web 应用，支持看板视图和列表视图，任务可拖拽管理。

## 功能特性

- ✅ **任务管理**: 创建、编辑、删除任务
- ✅ **看板视图**: 以列展示任务状态（待办/进行中/已完成），支持拖拽移动
- ✅ **列表视图**: 表格形式展示，支持按优先级、指派人、截止日期排序
- ✅ **过期提醒**: 过期/当天截止任务有醒目标记，列表中优先置顶
- ✅ **欢迎通知**: 新指派人首次分配任务时自动弹出欢迎提示
- ✅ **数据持久化**: 服务端 JSON 文件存储，刷新不丢失
- ✅ **响应式设计**: 支持宽屏和移动端（断点 768px）
- ✅ **触屏支持**: 移动端支持触屏拖拽操作
- ✅ **健康检查**: 页面底部实时显示服务器时间戳
- ✅ **日志记录**: 前后端均有结构化日志输出

## 技术栈

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - Web 框架
- **JSON 文件存储** - 轻量级数据持久化方案
- **Jest + Supertest** - 单元测试框架

### 前端
- **React 18** - UI 框架
- **Vite** - 构建工具
- **原生 HTML5 Drag & Drop API** - 拖拽功能
- **原生 CSS** - 样式（无 UI 库依赖）

## 运行环境要求

- Node.js >= 18.x
- npm >= 9.x

## 项目结构

```
p2/
├── server/                 # 后端服务
│   ├── src/
│   │   ├── index.js        # 入口文件
│   │   ├── app.js          # Express 应用配置
│   │   ├── db.js           # 数据存储层
│   │   ├── middleware/
│   │   │   └── logger.js   # 日志中间件
│   │   └── routes/
│   │       ├── tasks.js    # 任务 API 路由
│   │       └── health.js   # 健康检查路由
│   ├── tests/
│   │   └── tasks.test.js   # 单元测试
│   ├── data/               # 数据存储目录
│   └── package.json
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── utils/          # 工具函数
│   │   ├── styles/         # 样式文件
│   │   ├── App.jsx         # 主应用组件
│   │   └── main.jsx        # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── openapi.yaml            # OpenAPI 3.0 接口文档
└── README.md               # 本文件
```

## 快速开始

### 1. 安装后端依赖

```bash
cd server
npm install
```

### 2. 启动后端服务

```bash
cd server
npm start
```

服务将在 `http://localhost:3001` 启动。

### 3. 安装前端依赖

```bash
cd client
npm install
```

### 4. 启动前端开发服务

```bash
cd client
npm run dev
```

前端将在 `http://localhost:5173` 启动，已配置代理转发 API 请求到后端。

### 5. 访问应用

打开浏览器访问 `http://localhost:5173`

## 初始化示例数据

首次启动时数据为空，可通过前端"新建任务"按钮创建任务，或使用以下脚本快速添加示例数据：

```bash
# 在项目根目录执行
cd server
node -e "
const { initDB, createTask } = require('./src/db');
initDB();
const samples = [
  { title: '完成项目需求文档', description: '编写详细的产品需求文档', priority: 'high', status: 'todo', assignee: '张三', dueDate: '2026-06-20' },
  { title: '设计数据库结构', description: '设计数据库表结构和关系', priority: 'high', status: 'in-progress', assignee: '李四', dueDate: '2026-06-18' },
  { title: '搭建前端项目框架', description: '使用 React + Vite 搭建项目', priority: 'medium', status: 'done', assignee: '王五', dueDate: '2026-06-10' }
];
samples.forEach(t => createTask(t));
console.log('示例数据创建完成');
"
```

## API 接口文档

完整的 API 文档请参考 [openapi.yaml](./openapi.yaml)。

### 健康检查
- `GET /api/health` - 获取服务状态和时间戳

### 任务管理
- `GET /api/tasks` - 获取所有任务
- `GET /api/tasks/:id` - 获取单个任务
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/:id` - 更新任务
- `PATCH /api/tasks/:id/status` - 更新任务状态
- `DELETE /api/tasks/:id` - 删除任务

### 任务字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 任务唯一标识 (UUID) |
| title | string | 任务标题 |
| description | string | 任务描述 |
| priority | string | 优先级: high/medium/low |
| status | string | 状态: todo/in-progress/done |
| assignee | string | 指派人 |
| dueDate | string | 截止日期 (YYYY-MM-DD) |
| createdAt | string | 创建时间 (ISO 8601) |
| updatedAt | string | 更新时间 (ISO 8601) |

## 运行测试

后端单元测试使用内存模式运行，不影响真实数据：

```bash
cd server
npm test
```

测试覆盖：
- 健康检查接口
- 创建任务接口（正常创建、空标题、缺失标题、默认值）
- 更新任务状态接口（正常更新、无效状态、不存在的任务）
- 完整 CRUD 操作

## 存储方案选型说明

本项目选用 **JSON 文件存储** 作为数据持久化方案，理由如下：

1. **零依赖**: 不需要安装额外的数据库软件，开箱即用
2. **轻量级**: 适合小团队场景（任务数量通常在数百以内）
3. **易于部署**: 单文件存储，备份和迁移简单
4. **数据可读**: JSON 格式直观，可直接查看和编辑
5. **开发效率高**: 无需学习 SQL 或 ORM，代码简洁

如果后续需要扩展到更大规模，可以轻松迁移到 SQLite 或 PostgreSQL 等关系型数据库，因为数据访问层已抽象封装（[db.js](./server/src/db.js)）。

## 日志说明

### 后端日志
每个请求都会记录：
- 请求方法和路径（INFO 级别）
- 响应状态码和耗时（4xx/5xx 为 WARN 级别）
- 时间戳（ISO 8601 格式）

示例：
```
[2024-01-15T10:30:00.000Z] [INFO] GET /api/tasks
[2024-01-15T10:30:00.010Z] [INFO] GET /api/tasks - 200 - 10ms
```

### 前端日志
关键操作会输出到浏览器控制台：
- API 请求发起和响应
- 排序、拖拽等用户操作
- 错误和警告信息

## 响应式设计

- **桌面端 (>768px)**: 看板三列并排，列表完整显示
- **移动端 (<=768px)**: 看板列垂直堆叠，表格可横向滚动

移动端支持触屏拖拽：长按任务卡片 200ms 后开始拖拽，拖动到目标列释放即可。

## 开发命令

### 后端
```bash
npm start    # 启动服务
npm run dev  # 开发模式（文件变化自动重启）
npm test     # 运行单元测试
```

### 前端
```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run preview  # 预览生产构建
```

## 许可

MIT License
