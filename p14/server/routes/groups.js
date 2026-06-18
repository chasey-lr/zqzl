const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getGroupsByUserId,
  createGroup,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupContactCount
} = require('../data/store');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const groups = getGroupsByUserId(req.user.id);
    const groupsWithCount = groups.map(g => ({
      ...g,
      count: getGroupContactCount(g.id, req.user.id)
    }));
    res.json(groupsWithCount);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '分组名称不能为空' });
    }

    const existingGroups = getGroupsByUserId(req.user.id);
    if (existingGroups.some(g => g.name === name.trim())) {
      return res.status(400).json({ error: '分组名称已存在' });
    }

    const group = createGroup(req.user.id, name.trim(), color);
    res.json({ ...group, count: 0 });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const group = getGroupById(id);
    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: '分组不存在' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: '分组名称不能为空' });
      }
      const existingGroups = getGroupsByUserId(req.user.id);
      if (existingGroups.some(g => g.name === name.trim() && g.id !== id)) {
        return res.status(400).json({ error: '分组名称已存在' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;

    const updated = updateGroup(id, updates);
    const count = getGroupContactCount(id, req.user.id);
    res.json({ ...updated, count });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const group = getGroupById(id);
    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: '分组不存在' });
    }

    const success = deleteGroup(id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '删除失败' });
    }
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
