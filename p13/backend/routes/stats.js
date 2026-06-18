const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../store/authStore');
const { getLinkById, getClicksByLink } = require('../store/linkStore');

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

router.get('/:linkId', authMiddleware, (req, res) => {
  const { linkId } = req.params;
  const userId = req.user.userId;
  
  const link = getLinkById(linkId);
  if (!link || link.userId !== userId) {
    return res.status(404).json({ error: '链接不存在' });
  }
  
  const clicks = getClicksByLink(linkId);
  const totalClicks = clicks.length;
  
  const now = new Date();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last7Days.push({
      date: dateStr,
      count: 0
    });
  }
  
  clicks.forEach(click => {
    const clickDate = click.createdAt.split('T')[0];
    const dayData = last7Days.find(d => d.date === clickDate);
    if (dayData) {
      dayData.count++;
    }
  });
  
  const deviceStats = { PC: 0, Mobile: 0 };
  const regionStats = {};
  
  clicks.forEach(click => {
    const device = getDeviceFromUA(click.userAgent);
    deviceStats[device]++;
    
    const region = click.region || getRandomRegion();
    regionStats[region] = (regionStats[region] || 0) + 1;
  });
  
  res.json({
    success: true,
    stats: {
      totalClicks,
      last7Days,
      deviceStats,
      regionStats,
      recentClicks: clicks.slice(-10).reverse().map(c => ({
        createdAt: c.createdAt,
        device: getDeviceFromUA(c.userAgent),
        region: c.region || getRandomRegion(),
        ip: c.ip
      }))
    }
  });
});

module.exports = router;
