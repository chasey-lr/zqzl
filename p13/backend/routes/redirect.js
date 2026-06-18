const express = require('express');
const router = express.Router();
const { getLinkByShortCode, recordClick } = require('../store/linkStore');

function getRealIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) return realIp;
  const remoteAddr = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  if (remoteAddr === '::1') return '127.0.0.1';
  if (remoteAddr && remoteAddr.startsWith('::ffff:')) {
    return remoteAddr.replace('::ffff:', '');
  }
  return remoteAddr || '127.0.0.1';
}

function isLinkExpired(link) {
  if (!link.expiresAt) return false;
  return new Date(link.expiresAt) < new Date();
}

router.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  
  const link = getLinkByShortCode(shortCode);
  
  if (!link || isLinkExpired(link)) {
    console.log(`[Redirect] 短链接无效或已过期: ${shortCode} (IP: ${getRealIp(req)})`);
    const html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>链接无效 - 短链接系统</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
          }
          .container {
            text-align: center;
            padding: 48px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            max-width: 420px;
          }
          .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: #fef0f0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .icon svg {
            width: 40px;
            height: 40px;
            color: #f56c6c;
          }
          h1 {
            color: #303133;
            font-size: 28px;
            margin: 0 0 12px 0;
          }
          p {
            color: #606266;
            font-size: 16px;
            margin: 0 0 24px 0;
            line-height: 1.6;
          }
          .code {
            background: #f5f7fa;
            padding: 6px 12px;
            border-radius: 4px;
            font-family: monospace;
            color: #909399;
            font-size: 14px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1>404</h1>
          <p>链接无效或已过期</p>
          <span class="code">/${shortCode}</span>
        </div>
      </body>
      </html>
    `;
    return res.status(404).send(html);
  }
  
  const ip = getRealIp(req);
  const userAgent = req.headers['user-agent'] || '';
  
  setImmediate(() => {
    try {
      recordClick(link.id, ip, userAgent);
      console.log(`[Redirect] 点击记录: ${shortCode} -> ${link.longUrl.substring(0, 60)}... (IP: ${ip})`);
    } catch (err) {
      console.error('[Redirect] 记录点击失败:', err.message);
    }
  });
  
  res.redirect(302, link.longUrl);
});

module.exports = router;
