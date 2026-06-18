const express = require('express');
const router = express.Router();
const { getLinkByShortCode, recordClick } = require('../store/linkStore');

function getDeviceFromUA(userAgent) {
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    return 'Mobile';
  }
  return 'PC';
}

function getRandomRegion() {
  const provinces = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖北', '山东', '河南', '福建', '陕西', '湖南', '重庆', '天津', '辽宁'];
  return provinces[Math.floor(Math.random() * provinces.length)];
}

function isLinkExpired(link) {
  if (!link.expiresAt) return false;
  return new Date(link.expiresAt) < new Date();
}

router.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  
  const link = getLinkByShortCode(shortCode);
  
  if (!link || isLinkExpired(link)) {
    const html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>链接无效</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
          }
          h1 {
            color: #f56c6c;
            font-size: 48px;
            margin: 0 0 20px 0;
          }
          p {
            color: #606266;
            font-size: 18px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>404</h1>
          <p>链接无效或已过期</p>
        </div>
      </body>
      </html>
    `;
    return res.status(404).send(html);
  }
  
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';
  const device = getDeviceFromUA(userAgent);
  const region = getRandomRegion();
  
  setImmediate(() => {
    recordClick(link.id, ip, userAgent, device, region);
  });
  
  res.redirect(302, link.longUrl);
});

module.exports = router;
