const express = require('express');
const authMiddleware = require('../middleware/auth');
const { BookmarkStore } = require('../store');

const router = express.Router();
router.use(authMiddleware);

const urlRegex = /^https?:\/\/.+/i;

router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, pageSize = 5 } = req.query;
    let bookmarks = await BookmarkStore.findByUserId(req.userId);
    bookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (category && category !== 'all') {
      bookmarks = bookmarks.filter(b => b.category === category);
    }
    if (search) {
      const keyword = search.toLowerCase();
      bookmarks = bookmarks.filter(b =>
        b.title.toLowerCase().includes(keyword) ||
        b.url.toLowerCase().includes(keyword)
      );
    }
    const total = bookmarks.length;
    const currentPage = Math.max(1, parseInt(page));
    const size = Math.max(1, parseInt(pageSize));
    const totalPages = Math.ceil(total / size);
    const start = (currentPage - 1) * size;
    const pagedBookmarks = bookmarks.slice(start, start + size);
    const categories = [...new Set((await BookmarkStore.findByUserId(req.userId)).map(b => b.category).filter(Boolean))];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = (await BookmarkStore.findByUserId(req.userId)).filter(b => new Date(b.createdAt) >= sevenDaysAgo).length;
    res.json({
      bookmarks: pagedBookmarks,
      pagination: {
        total,
        page: currentPage,
        pageSize: size,
        totalPages
      },
      categories,
      stats: {
        total: (await BookmarkStore.findByUserId(req.userId)).length,
        recent7Days: recentCount
      }
    });
  } catch (err) {
    res.status(500).json({ message: '获取书签列表失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, url, category, note } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: '标题不能为空' });
    }
    if (title.length > 50) {
      return res.status(400).json({ message: '标题最多50个字符' });
    }
    if (!url || !urlRegex.test(url)) {
      return res.status(400).json({ message: '请输入有效的URL（以http或https开头）' });
    }
    if (category && category.length > 20) {
      return res.status(400).json({ message: '分类最多20个字符' });
    }
    const bookmark = await BookmarkStore.create({
      userId: req.userId,
      title: title.trim(),
      url: url.trim(),
      category: category ? category.trim() : null,
      note: note ? note.trim() : null
    });
    res.status(201).json({ message: '添加成功', bookmark });
  } catch (err) {
    res.status(500).json({ message: '添加书签失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, category, note } = req.body;
    const bookmark = await BookmarkStore.findById(parseInt(id));
    if (!bookmark) {
      return res.status(404).json({ message: '书签不存在' });
    }
    if (bookmark.userId !== req.userId) {
      return res.status(403).json({ message: '无权限操作' });
    }
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: '标题不能为空' });
      if (title.length > 50) return res.status(400).json({ message: '标题最多50个字符' });
    }
    if (url !== undefined && !urlRegex.test(url)) {
      return res.status(400).json({ message: '请输入有效的URL（以http或https开头）' });
    }
    if (category !== undefined && category && category.length > 20) {
      return res.status(400).json({ message: '分类最多20个字符' });
    }
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (url !== undefined) updateData.url = url.trim();
    if (category !== undefined) updateData.category = category ? category.trim() : null;
    if (note !== undefined) updateData.note = note ? note.trim() : null;
    const updated = await BookmarkStore.update(parseInt(id), updateData);
    res.json({ message: '更新成功', bookmark: updated });
  } catch (err) {
    res.status(500).json({ message: '更新书签失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookmark = await BookmarkStore.findById(parseInt(id));
    if (!bookmark) {
      return res.status(404).json({ message: '书签不存在' });
    }
    if (bookmark.userId !== req.userId) {
      return res.status(403).json({ message: '无权限操作' });
    }
    await BookmarkStore.delete(parseInt(id));
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: '删除书签失败' });
  }
});

module.exports = router;
