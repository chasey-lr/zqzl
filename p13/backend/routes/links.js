const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../store/authStore');
const {
  generateUniqueShortCode,
  isShortCodeExists,
  createLink,
  getLinksByUser,
  getLinkById,
  updateLink,
  deleteLink,
  findDuplicateLongUrl
} = require('../store/linkStore');

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

function getLinkStatus(link) {
  if (!link.expiresAt) return 'active';
  const now = new Date();
  const expires = new Date(link.expiresAt);
  const diffDays = (expires - now) / (1000 * 60 * 60 * 24);
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'expiring-soon';
  return 'active';
}

function enrichLink(link) {
  return {
    ...link,
    status: getLinkStatus(link),
    shortUrl: `http://localhost:3000/s/${link.shortCode}`
  };
}

router.post('/', authMiddleware, (req, res) => {
  const { longUrl, shortCode, expiresAt } = req.body;
  const userId = req.user.userId;
  
  if (!longUrl || !isValidUrl(longUrl)) {
    return res.status(400).json({ error: '请输入有效的URL' });
  }
  
  const duplicate = findDuplicateLongUrl(userId, longUrl);
  if (duplicate) {
    return res.status(409).json({
      error: '此链接已存在，是否复用已有短码？',
      existingLink: enrichLink(duplicate)
    });
  }
  
  let finalShortCode;
  if (shortCode) {
    if (!/^[a-zA-Z0-9]{4,12}$/.test(shortCode)) {
      return res.status(400).json({ error: '自定义短码只能包含字母数字，长度4-12位' });
    }
    if (isShortCodeExists(shortCode)) {
      return res.status(400).json({ error: '该短码已被使用，请更换' });
    }
    finalShortCode = shortCode;
  } else {
    finalShortCode = generateUniqueShortCode();
  }
  
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return res.status(400).json({ error: '过期时间不能早于当前时间' });
  }
  
  const link = createLink(userId, longUrl, finalShortCode, expiresAt);
  res.json({ success: true, link: enrichLink(link) });
});

router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { 
    page = 1, 
    pageSize = 15, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    startDate,
    endDate
  } = req.query;
  
  let links = getLinksByUser(userId);
  
  if (search) {
    const searchLower = search.toLowerCase();
    links = links.filter(link => 
      link.shortCode.toLowerCase().includes(searchLower) ||
      link.longUrl.toLowerCase().includes(searchLower)
    );
  }
  
  if (startDate) {
    const start = new Date(startDate);
    links = links.filter(link => new Date(link.createdAt) >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    links = links.filter(link => new Date(link.createdAt) <= end);
  }
  
  links.sort((a, b) => {
    let valA, valB;
    if (sortBy === 'clickCount') {
      valA = a.clickCount;
      valB = b.clickCount;
    } else {
      valA = new Date(a.createdAt);
      valB = new Date(b.createdAt);
    }
    if (sortOrder === 'asc') {
      return valA > valB ? 1 : -1;
    }
    return valA < valB ? 1 : -1;
  });
  
  const total = links.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedLinks = links.slice(startIndex, endIndex).map(enrichLink);
  
  res.json({
    success: true,
    links: paginatedLinks,
    total,
    hasMore: endIndex < total
  });
});

router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { longUrl, expiresAt } = req.body;
  const userId = req.user.userId;
  
  const link = getLinkById(id);
  if (!link || link.userId !== userId) {
    return res.status(404).json({ error: '链接不存在' });
  }
  
  if (longUrl && !isValidUrl(longUrl)) {
    return res.status(400).json({ error: '请输入有效的URL' });
  }
  
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return res.status(400).json({ error: '过期时间不能早于当前时间' });
  }
  
  const updates = {};
  if (longUrl) updates.longUrl = longUrl;
  if (expiresAt !== undefined) updates.expiresAt = expiresAt;
  
  const updatedLink = updateLink(id, updates);
  res.json({ success: true, link: enrichLink(updatedLink) });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  const link = getLinkById(id);
  if (!link || link.userId !== userId) {
    return res.status(404).json({ error: '链接不存在' });
  }
  
  deleteLink(id);
  res.json({ success: true });
});

router.get('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  const link = getLinkById(id);
  if (!link || link.userId !== userId) {
    return res.status(404).json({ error: '链接不存在' });
  }
  
  res.json({ success: true, link: enrichLink(link) });
});

module.exports = router;
