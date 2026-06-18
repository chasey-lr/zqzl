const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const {
  createContact,
  getContactsByUserId,
  getGroupById,
  getGroupsByUserId,
  createGroup
} = require('../data/store');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      rows.push(parseCSVLine(line));
    }
  }

  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map(s => s.trim());
}

function toCSVRow(fields) {
  return fields.map(f => {
    if (f === null || f === undefined) return '';
    const str = String(f);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }).join(',');
}

const FIELD_MAPPINGS = {
  '姓名': 'name',
  'name': 'name',
  '手机号': 'phone',
  'phone': 'phone',
  '电话': 'phone',
  '办公电话': 'officePhone',
  'officePhone': 'officePhone',
  '邮箱': 'email',
  'email': 'email',
  '公司': 'company',
  'company': 'company',
  '部门': 'department',
  'department': 'department',
  '职位': 'position',
  'position': 'position',
  '头像': 'avatar',
  'avatar': 'avatar',
  '分组': 'groups',
  'groups': 'groups',
  'group': 'groups'
};

router.post('/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传CSV文件' });
    }

    const content = req.file.buffer.toString('utf-8');
    const { headers, rows } = parseCSV(content);

    if (headers.length === 0) {
      return res.status(400).json({ error: 'CSV文件为空或格式错误' });
    }

    const fieldMap = {};
    headers.forEach((h, idx) => {
      const key = h.trim();
      const mappedField = FIELD_MAPPINGS[key];
      if (mappedField) {
        fieldMap[idx] = mappedField;
      }
    });

    const userGroups = getGroupsByUserId(req.user.id);
    const groupNameMap = {};
    userGroups.forEach(g => {
      groupNameMap[g.name] = g.id;
    });

    let successCount = 0;
    const errors = [];

    rows.forEach((row, rowIndex) => {
      const contactData = {};
      const groupNames = [];

      Object.keys(fieldMap).forEach(idx => {
        const field = fieldMap[idx];
        const value = row[parseInt(idx)] || '';

        if (field === 'groups') {
          if (value) {
            const names = value.split(/[;；,，]/).map(n => n.trim()).filter(n => n);
            groupNames.push(...names);
          }
        } else {
          contactData[field] = value;
        }
      });

      if (!contactData.name || !contactData.name.trim()) {
        errors.push(`第${rowIndex + 2}行：姓名不能为空`);
        return;
      }
      if (contactData.name.length > 20) {
        errors.push(`第${rowIndex + 2}行：姓名最多20个字符`);
        return;
      }
      if (!contactData.phone || !/^\d{11}$/.test(contactData.phone.trim())) {
        errors.push(`第${rowIndex + 2}行：手机号必须是11位数字`);
        return;
      }
      if (contactData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
        errors.push(`第${rowIndex + 2}行：邮箱格式不正确`);
        return;
      }

      const groupIds = [];
      groupNames.forEach(name => {
        if (groupNameMap[name]) {
          groupIds.push(groupNameMap[name]);
        } else {
          const newGroup = createGroup(req.user.id, name);
          groupNameMap[name] = newGroup.id;
          groupIds.push(newGroup.id);
        }
      });

      contactData.groupIds = groupIds;
      createContact(req.user.id, contactData);
      successCount++;
    });

    res.json({
      success: true,
      successCount,
      totalCount: rows.length,
      errors
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/export', (req, res) => {
  try {
    const { search = '', groupId = '' } = req.query;

    let contacts = getContactsByUserId(req.user.id);
    const groups = getGroupsByUserId(req.user.id);
    const groupMap = {};
    groups.forEach(g => { groupMap[g.id] = g.name; });

    if (groupId === 'ungrouped') {
      contacts = contacts.filter(c => c.groupIds.length === 0);
    } else if (groupId) {
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

    contacts.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

    const headers = ['姓名', '手机号', '办公电话', '邮箱', '公司', '部门', '职位', '分组'];
    let csvContent = toCSVRow(headers) + '\n';

    contacts.forEach(contact => {
      const groupNames = contact.groupIds
        .map(gid => groupMap[gid])
        .filter(Boolean)
        .join(';');

      csvContent += toCSVRow([
        contact.name,
        contact.phone,
        contact.officePhone,
        contact.email,
        contact.company,
        contact.department,
        contact.position,
        groupNames
      ]) + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.send('\uFEFF' + csvContent);
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
