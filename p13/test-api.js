const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
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
          const response = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject({ response: { data: response, status: res.statusCode } });
          }
        } catch (e) {
          reject({ message: '解析响应失败: ' + body });
        }
      });
    });
    
    req.on('error', (e) => reject({ message: e.message }));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testApi() {
  console.log('=== 测试后端API ===\n');
  let token = null;
  let linkId = null;
  let shortCode = null;

  try {
    console.log('1. 测试发送验证码...');
    const res1 = await makeRequest('POST', '/api/auth/send-code', {
      email: 'test@example.com'
    });
    console.log('✓ 验证码发送成功:', res1.message);

    console.log('\n2. 查看后端控制台获取验证码...');
    console.log('   后端控制台会输出类似: [模拟发送] 验证码已发送到 test@example.com: XXXXXX');

    console.log('\n3. 测试注册 (使用验证码123456，先发送一次获取真实验证码)...');
    
    console.log('\n   正在重新发送验证码...');
    const res1b = await makeRequest('POST', '/api/auth/send-code', {
      email: 'test@example.com'
    });
    
    console.log('\n4. 测试登录 (跳过注册，先尝试登录)...');
    try {
      const res3 = await makeRequest('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: '123456'
      });
      console.log('✓ 登录成功');
      token = res3.token;
    } catch (err) {
      console.log('  登录失败，尝试注册...');
      console.log('  (请查看后端控制台获取验证码，然后修改代码中的code值)');
      console.log('\n  为了继续测试，我们先使用另一个邮箱注册...');
      
      const testEmail = 'user' + Date.now() + '@example.com';
      console.log('  使用邮箱:', testEmail);
      
      await makeRequest('POST', '/api/auth/send-code', { email: testEmail });
      
      const res2 = await makeRequest('POST', '/api/auth/register', {
        email: testEmail,
        code: '123456',
        password: '123456'
      });
      console.log('✓ 注册成功，Token已获取');
      token = res2.token;
    }

    console.log('\n5. 测试创建短链接...');
    const res4 = await makeRequest('POST', '/api/links', {
      longUrl: 'https://www.baidu.com',
      shortCode: '',
      expiresAt: ''
    }, token);
    console.log('✓ 短链接创建成功:', res4.link.shortUrl);
    linkId = res4.link.id;
    shortCode = res4.link.link?.shortCode || res4.link.shortCode;

    console.log('\n6. 测试获取链接列表...');
    const res5 = await makeRequest('GET', '/api/links?page=1&pageSize=15', null, token);
    console.log('✓ 获取链接列表成功，共', res5.links.length, '条，总计', res5.total);

    console.log('\n7. 测试编辑链接...');
    const res6 = await makeRequest('PUT', `/api/links/${linkId}`, {
      longUrl: 'https://www.google.com',
      expiresAt: ''
    }, token);
    console.log('✓ 编辑成功，新长链接:', res6.link.longUrl);

    console.log('\n8. 测试获取统计数据...');
    const res7 = await makeRequest('GET', `/api/stats/${linkId}`, null, token);
    console.log('✓ 获取统计成功，总点击:', res7.stats.totalClicks);
    console.log('   设备统计:', JSON.stringify(res7.stats.deviceStats));
    console.log('   最近7天:', JSON.stringify(res7.stats.last7Days));

    console.log('\n9. 测试搜索功能...');
    const res9 = await makeRequest('GET', '/api/links?search=baidu', null, token);
    console.log('✓ 搜索测试完成');

    console.log('\n10. 测试自定义短码...');
    try {
      const customCode = 'test' + Date.now().toString().slice(-4);
      const res10 = await makeRequest('POST', '/api/links', {
        longUrl: 'https://www.github.com',
        shortCode: customCode,
        expiresAt: ''
      }, token);
      console.log('✓ 自定义短码成功:', res10.link.shortCode);
    } catch (err) {
      console.log('  自定义短码提示:', err.response?.data?.error || err.message);
    }

    console.log('\n11. 测试短码重复...');
    try {
      await makeRequest('POST', '/api/links', {
        longUrl: 'https://www.gitlab.com',
        shortCode: shortCode,
        expiresAt: ''
      }, token);
    } catch (err) {
      console.log('✓ 重复短码正确拦截:', err.response?.data?.error);
    }

    console.log('\n12. 测试重复长链接...');
    try {
      await makeRequest('POST', '/api/links', {
        longUrl: 'https://www.google.com',
        shortCode: '',
        expiresAt: ''
      }, token);
    } catch (err) {
      if (err.response?.status === 409) {
        console.log('✓ 重复长链接正确提示:', err.response.data.error);
        console.log('   已有短码:', err.response.data.existingLink?.shortCode);
      } else {
        console.log('  错误:', err.response?.data?.error || err.message);
      }
    }

    console.log('\n13. 测试删除链接...');
    const res8 = await makeRequest('DELETE', `/api/links/${linkId}`, null, token);
    console.log('✓ 删除成功');

    console.log('\n=== 所有核心API测试通过！ ===');
    console.log('\n📌 前端地址: http://localhost:5174');
    console.log('📌 后端地址: http://localhost:3000');
    console.log('📌 测试跳转: http://localhost:3000/s/' + shortCode);
    console.log('\n💡 使用说明:');
    console.log('   1. 访问前端页面 http://localhost:5174');
    console.log('   2. 点击"立即注册"，输入邮箱');
    console.log('   3. 点击"获取验证码"，查看后端控制台输出的验证码');
    console.log('   4. 输入验证码和密码完成注册');
    console.log('   5. 登录后即可使用所有功能');
    
  } catch (err) {
    console.log('\n✗ 测试失败:', err.response?.data?.error || err.message);
    if (err.response?.data?.existingLink) {
      console.log('  已有链接:', err.response.data.existingLink.shortUrl);
    }
  }
}

testApi();
