const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5001;

function request(path, method, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

const categories = ['前端开发', '后端开发', '学习资料', '工具网站', '娱乐', '新闻资讯'];
const baseUrls = [
  'https://react.dev',
  'https://vuejs.org',
  'https://nodejs.org',
  'https://developer.mozilla.org',
  'https://github.com',
  'https://stackoverflow.com',
  'https://www.npmjs.com',
  'https://vitejs.dev',
  'https://expressjs.com',
  'https://www.typescriptlang.org'
];

async function main() {
  const count = 55;
  console.log(`开始批量添加 ${count} 条书签...\n`);

  console.log('1. 登录获取token...');
  const loginResult = await request('/api/auth/login', 'POST', {
    email: 'test@persist.com',
    password: '123456'
  });
  const token = loginResult.token;
  console.log('✓ 登录成功\n');

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const baseUrl = baseUrls[i % baseUrls.length];
    const bookmark = {
      title: `测试书签 ${i + 1} - ${category}`,
      url: `${baseUrl}/${i}`,
      category: category,
      note: `这是第 ${i + 1} 条测试书签，用于验证分页功能`
    };

    try {
      await request('/api/bookmarks', 'POST', bookmark, token);
      process.stdout.write(`\r✓ 已添加 ${i + 1}/${count} 条`);
    } catch (err) {
      console.log(`\n✗ 添加失败: ${bookmark.title} - ${err.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 20));
  }

  console.log(`\n\n✅ 批量添加完成，共添加 ${count} 条书签`);

  console.log('\n2. 验证分页数据...');
  const result = await request('/api/bookmarks?page=1&pageSize=5', 'GET', null, token);
  console.log(`✓ 总书签数: ${result.stats.total}`);
  console.log(`✓ 当前页: ${result.pagination.page}`);
  console.log(`✓ 总页数: ${result.pagination.totalPages}`);
  console.log(`✓ 当前页书签数: ${result.bookmarks.length}`);
  console.log(`✓ 分类数量: ${result.categories.length}`);
  console.log(`\n分类列表: ${result.categories.join(', ')}`);
}

main().catch(err => {
  console.error('\n❌ 错误:', err.message);
  process.exit(1);
});
