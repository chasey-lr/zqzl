const express = require('express');
const authMiddleware = require('../middleware/auth');
const { BookmarkStore } = require('../store');

const router = express.Router();
router.use(authMiddleware);

const urlRegex = /^https?:\/\/.+/i;

router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, pageSize = 5 } = req.query;

    const allBookmarks = await BookmarkStore.findByUserId(req.userId);
    if (!Array.isArray(allBookmarks)) {
      return res.status(500).json({ message: '获取书签列表失败' });
    }

    const totalCount = allBookmarks.length;

    const categories = totalCount > 0
      ? [...new Set(allBookmarks.map(b => b.category).filter(Boolean))]
      : [];

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let recent7DaysCount = 0;
    let filtered = [];

    if (totalCount > 0) {
      const keyword = search ? search.toLowerCase() : '';
      const filterCategory = category && category !== 'all';

      for (let i = 0; i < totalCount; i++) {
        const b = allBookmarks[i];

        if (new Date(b.createdAt).getTime() >= sevenDaysAgo) {
          recent7DaysCount++;
        }

        if (filterCategory && b.category !== category) continue;
        if (keyword &&
            !b.title.toLowerCase().includes(keyword) &&
            !b.url.toLowerCase().includes(keyword)) continue;

        filtered.push(b);
      }
    }

    const filteredTotal = filtered.length;
    const currentPage = Math.max(1, parseInt(page) || 1);
    const size = Math.max(1, Math.min(100, parseInt(pageSize) || 5));
    const totalPages = filteredTotal > 0 ? Math.ceil(filteredTotal / size) : 0;
    const start = (currentPage - 1) * size;
    const pagedBookmarks = filteredTotal > 0 ? filtered.slice(start, start + size) : [];

    res.json({
      bookmarks: pagedBookmarks,
      pagination: {
        total: filteredTotal,
        page: currentPage,
        pageSize: size,
        totalPages
      },
      categories,
      stats: {
        total: totalCount,
        recent7Days: recent7DaysCount
      }
    });
  } catch (err) {
    console.error('获取书签列表错误:', err);
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
    console.error('添加书签错误:', err);
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
    console.error('更新书签错误:', err);
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
    console.error('删除书签错误:', err);
    res.status(500).json({ message: '删除书签失败' });
  }
});

module.exports = router;
