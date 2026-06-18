const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('开始测试...');
  
  try {
    console.log('1. 测试发送验证码');
    const res = await axios.post(`${BASE_URL}/api/auth/send-code`, {
      email: 'admin@test.com'
    });
    console.log('成功:', res.data);
    
    console.log('\n2. 测试获取用户信息(未登录)');
    try {
      await axios.get(`${BASE_URL}/api/auth/me`);
    } catch (e) {
      console.log('正确拦截未登录:', e.response.status);
    }
    
    console.log('\n3. 测试注册');
    const testEmail = 'user' + Date.now() + '@test.com';
    console.log('使用邮箱:', testEmail);
    
    await axios.post(`${BASE_URL}/api/auth/send-code`, { email: testEmail });
    
    const res2 = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: testEmail,
      code: '123456',
      password: '123456'
    });
    console.log('注册成功');
    const token = res2.data.token;
    
    console.log('\n4. 测试创建短链接');
    const res3 = await axios.post(`${BASE_URL}/api/links`, {
      longUrl: 'https://www.baidu.com'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('创建成功:', res3.data.link.shortCode);
    const linkId = res3.data.link.id;
    const shortCode = res3.data.link.shortCode;
    
    console.log('\n5. 测试获取列表');
    const res4 = await axios.get(`${BASE_URL}/api/links`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('获取列表成功, 数量:', res4.data.links.length);
    
    console.log('\n6. 测试统计');
    const res5 = await axios.get(`${BASE_URL}/api/stats/${linkId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('统计:', res5.data.stats.totalClicks);
    
    console.log('\n7. 测试跳转页面');
    const res6 = await axios.get(`${BASE_URL}/s/${shortCode}`, {
      maxRedirects: 0,
      validateStatus: null
    });
    console.log('跳转状态:', res6.status, '->', res6.headers.location || '404页面');
    
    console.log('\n✓ 所有测试通过!');
    
  } catch (e) {
    console.log('测试失败:', e.response?.data?.error || e.message);
    console.log(e.response?.data);
  }
}

test();
