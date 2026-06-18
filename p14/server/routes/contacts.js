const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getContactsByUserId,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  deleteContactsBatch,
  moveContactsToGroup,
  getUngroupedCount,
  getGroupById
} = require('../data/store');

const router = express.Router();

router.use(authMiddleware);

function validateContactData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    const name = data.name;
    if (!name || !name.trim()) {
      errors.push('姓名不能为空');
    } else if (name.length > 20) {
      errors.push('姓名最多20个字符');
    }
  }

  if (!isUpdate || data.phone !== undefined) {
    const phone = data.phone;
    if (!phone || !phone.trim()) {
      errors.push('手机号不能为空');
    } else if (!/^\d{11}$/.test(phone.trim())) {
      errors.push('手机号必须是11位数字');
    }
  }

  if (data.email !== undefined && data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('邮箱格式不正确');
    }
  }

  return errors;
}

router.get('/', (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      groupId = '',
      sortBy = 'name'
    } = req.query;

    let contacts = getContactsByUserId(req.user.id);

    if (groupId === 'ungrouped') {
      contacts = contacts.filter(c => c.groupIds.length === 0);
    } else if (groupId) {
      const group = getGroupById(groupId);
      if (!group || group.userId !== req.user.id) {
        return res.status(404).json({ error: '分组不存在' });
      }
      contacts = contacts.filter(c => c.groupIds.includes(groupId));
    }

    if (search) {
      const keyword = search.toLowerCase();
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.phone.includes(keyword) ||
        c.email.toLowerCase().includes(keyword) ||
        c.company.toLowerCase().includes(keyword)
      );
    }

    if (sortBy === 'name') {
      contacts.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    }

    const total = contacts.length;
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    const startIndex = (pageNum - 1) * size;
    const paginatedContacts = contacts.slice(startIndex, startIndex + size);

    res.json({
      list: paginatedContacts,
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const contacts = getContactsByUserId(req.user.id);
    const ungrouped = getUngroupedCount(req.user.id);

    res.json({
      total: contacts.length,
      ungrouped
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contact = getContactById(id);

    if (!contact || contact.userId !== req.user.id) {
      return res.status(404).json({ error: '联系人不存在' });
    }

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', (req, res) => {
  try {
    const errors = validateContactData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const contact = createContact(req.user.id, req.body);
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contact = getContactById(id);

    if (!contact || contact.userId !== req.user.id) {
      return res.status(404).json({ error: '联系人不存在' });
    }

    const errors = validateContactData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const updated = updateContact(id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contact = getContactById(id);

    if (!contact || contact.userId !== req.user.id) {
      return res.status(404).json({ error: '联系人不存在' });
    }

    const success = deleteContact(id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '删除失败' });
    }
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/batch/delete', (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择要删除的联系人' });
    }

    const validIds = ids.filter(id => {
      const contact = getContactById(id);
      return contact && contact.userId === req.user.id;
    });

    const count = deleteContactsBatch(validIds);
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/batch/move', (req, res) => {
  try {
    const { ids, groupId } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择联系人' });
    }

    if (!groupId) {
      return res.status(400).json({ error: '请选择目标分组' });
    }

    const group = getGroupById(groupId);
    if (!group || group.userId !== req.user.id) {
      return res.status(404).json({ error: '分组不存在' });
    }

    const validIds = ids.filter(id => {
      const contact = getContactById(id);
      return contact && contact.userId === req.user.id;
    });

    const count = moveContactsToGroup(validIds, groupId);
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
