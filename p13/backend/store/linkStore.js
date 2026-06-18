require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const geoip = require('geoip-lite');
const { PersistentMap, PersistentArray } = require('./persistentStore');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const links = new PersistentMap('links.json');
const clicks = new PersistentArray('clicks.json');

function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function isShortCodeExists(code) {
  for (let link of links.values()) {
    if (link.shortCode === code) {
      return true;
    }
  }
  return false;
}

function generateUniqueShortCode() {
  let code;
  let attempts = 0;
  do {
    code = generateShortCode();
    attempts++;
    if (attempts > 100) {
      code = generateShortCode() + generateShortCode().slice(0, 2);
      break;
    }
  } while (isShortCodeExists(code));
  return code;
}

function createLink(userId, longUrl, shortCode, expiresAt) {
  const id = uuidv4();
  const link = {
    id,
    userId,
    longUrl,
    shortCode,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt || null,
    clickCount: 0
  };
  links.set(id, link);
  return link;
}

function getLinkByShortCode(shortCode) {
  for (let link of links.values()) {
    if (link.shortCode === shortCode) {
      return link;
    }
  }
  return null;
}

function getLinkById(id) {
  return links.get(id);
}

function getLinksByUser(userId) {
  return Array.from(links.values()).filter(link => link.userId === userId);
}

function updateLink(id, updates) {
  const link = links.get(id);
  if (!link) return null;
  const updated = { ...link, ...updates };
  links.set(id, updated);
  return updated;
}

function deleteLink(id) {
  return links.delete(id);
}

function findDuplicateLongUrl(userId, longUrl) {
  return Array.from(links.values()).find(
    link => link.userId === userId && link.longUrl === longUrl
  );
}

function parseIpRegion(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return { country: '本地', region: 'localhost', city: '本地开发' };
  }
  
  try {
    const cleanIp = ip.replace(/^::ffff:/, '');
    const geo = geoip.lookup(cleanIp);
    if (geo) {
      return {
        country: geo.country || '未知',
        region: geo.region || '未知',
        city: geo.city || '未知'
      };
    }
  } catch (err) {
    console.error('[GeoIP] 解析IP失败:', ip, err.message);
  }
  
  return { country: '未知', region: '未知', city: '未知' };
}

function getDeviceFromUA(userAgent) {
  if (!userAgent) return 'Unknown';
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return 'Mobile';
  }
  return 'PC';
}

function formatRegionDisplay(geoData) {
  if (!geoData) return '未知';
  if (geoData.country === '本地') return '本地开发';
  if (geoData.country === 'CN' || geoData.country === '中国') {
    return geoData.region || geoData.city || '中国';
  }
  return geoData.country || '未知';
}

function recordClick(linkId, ip, userAgent) {
  const device = getDeviceFromUA(userAgent);
  const geoData = parseIpRegion(ip);
  const regionDisplay = formatRegionDisplay(geoData);
  
  const clickRecord = {
    id: uuidv4(),
    linkId,
    ip: ip || 'unknown',
    userAgent: userAgent || '',
    device,
    country: geoData.country,
    region: geoData.region,
    city: geoData.city,
    regionDisplay,
    createdAt: new Date().toISOString()
  };
  
  clicks.push(clickRecord);
  
  const link = links.get(linkId);
  if (link) {
    const updated = { ...link, clickCount: (link.clickCount || 0) + 1 };
    links.set(linkId, updated);
  }
  
  return clickRecord;
}

function getClicksByLink(linkId) {
  return clicks.filter(click => click.linkId === linkId);
}

function incrementClickCountOnly(linkId) {
  const link = links.get(linkId);
  if (link) {
    const updated = { ...link, clickCount: (link.clickCount || 0) + 1 };
    links.set(linkId, updated);
  }
}

module.exports = {
  links,
  clicks,
  generateShortCode,
  generateUniqueShortCode,
  isShortCodeExists,
  createLink,
  getLinkByShortCode,
  getLinkById,
  getLinksByUser,
  updateLink,
  deleteLink,
  findDuplicateLongUrl,
  recordClick,
  getClicksByLink,
  getDeviceFromUA,
  parseIpRegion,
  formatRegionDisplay,
  incrementClickCountOnly,
  BASE_URL
};
