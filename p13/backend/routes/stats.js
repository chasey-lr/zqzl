const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../store/authStore');
const { getLinkById, getClicksByLink, getDeviceFromUA, parseIpRegion, formatRegionDisplay } = require('../store/linkStore');

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
  
  const deviceStats = { PC: 0, Mobile: 0, Unknown: 0 };
  const regionStats = {};
  const countryStats = {};
  
  clicks.forEach(click => {
    const device = click.device || getDeviceFromUA(click.userAgent);
    if (device === 'PC' || device === 'Mobile') {
      deviceStats[device]++;
    } else {
      deviceStats.Unknown++;
    }
    
    const regionDisplay = click.regionDisplay || (() => {
      const geo = parseIpRegion(click.ip);
      return formatRegionDisplay(geo);
    })();
    regionStats[regionDisplay] = (regionStats[regionDisplay] || 0) + 1;
    
    if (click.country && click.country !== '未知') {
      countryStats[click.country] = (countryStats[click.country] || 0) + 1;
    }
  });
  
  res.json({
    success: true,
    stats: {
      totalClicks,
      last7Days,
      deviceStats,
      regionStats,
      countryStats,
      recentClicks: clicks.slice(-20).reverse().map(c => ({
        createdAt: c.createdAt,
        device: c.device || getDeviceFromUA(c.userAgent),
        region: c.regionDisplay || '未知',
        country: c.country || '未知',
        city: c.city || '未知',
        ip: c.ip
      })),
      dataNote: '地区数据基于GeoIP-lite离线库解析，本地IP显示为"本地开发"，公网IP可能存在精度偏差'
    }
  });
});

module.exports = router;
