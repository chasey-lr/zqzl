const { v4: uuidv4 } = require('uuid');

const links = new Map();
const clicks = [];

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
  do {
    code = generateShortCode();
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
  Object.assign(link, updates);
  return link;
}

function deleteLink(id) {
  return links.delete(id);
}

function findDuplicateLongUrl(userId, longUrl) {
  return Array.from(links.values()).find(
    link => link.userId === userId && link.longUrl === longUrl
  );
}

function recordClick(linkId, ip, userAgent, device, region) {
  clicks.push({
    id: uuidv4(),
    linkId,
    ip,
    userAgent,
    device,
    region,
    createdAt: new Date().toISOString()
  });
  const link = links.get(linkId);
  if (link) {
    link.clickCount++;
  }
}

function getClicksByLink(linkId) {
  return clicks.filter(click => click.linkId === linkId);
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
  getClicksByLink
};
