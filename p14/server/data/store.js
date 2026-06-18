const users = new Map();
const contacts = new Map();
const groups = new Map();

let userIdCounter = 1;
let contactIdCounter = 1;
let groupIdCounter = 1;

const generateUserId = () => `u${userIdCounter++}`;
const generateContactId = () => `c${contactIdCounter++}`;
const generateGroupId = () => `g${groupIdCounter++}`;

function findUserByEmail(email) {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return null;
}

function createUser(email, passwordHash) {
  const id = generateUserId();
  const user = { id, email, passwordHash, createdAt: Date.now() };
  users.set(id, user);
  return user;
}

function getUserById(id) {
  return users.get(id) || null;
}

function getGroupsByUserId(userId) {
  const result = [];
  for (const group of groups.values()) {
    if (group.userId === userId) {
      result.push(group);
    }
  }
  return result;
}

function createGroup(userId, name, color = null) {
  const id = generateGroupId();
  const group = {
    id,
    userId,
    name,
    color: color || getRandomColor(),
    createdAt: Date.now()
  };
  groups.set(id, group);
  return group;
}

function getGroupById(id) {
  return groups.get(id) || null;
}

function updateGroup(id, updates) {
  const group = groups.get(id);
  if (!group) return null;
  Object.assign(group, updates);
  return group;
}

function deleteGroup(id) {
  const group = groups.get(id);
  if (!group) return false;
  for (const contact of contacts.values()) {
    if (contact.userId === group.userId) {
      contact.groupIds = contact.groupIds.filter(gid => gid !== id);
    }
  }
  groups.delete(id);
  return true;
}

function getContactsByUserId(userId) {
  const result = [];
  for (const contact of contacts.values()) {
    if (contact.userId === userId) {
      result.push(contact);
    }
  }
  return result;
}

function getContactById(id) {
  return contacts.get(id) || null;
}

function createContact(userId, data) {
  const id = generateContactId();
  const contact = {
    id,
    userId,
    name: data.name,
    phone: data.phone,
    officePhone: data.officePhone || '',
    email: data.email || '',
    company: data.company || '',
    department: data.department || '',
    position: data.position || '',
    avatar: data.avatar || '',
    groupIds: data.groupIds || [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  contacts.set(id, contact);
  return contact;
}

function updateContact(id, updates) {
  const contact = contacts.get(id);
  if (!contact) return null;
  Object.assign(contact, updates, { updatedAt: Date.now() });
  return contact;
}

function deleteContact(id) {
  return contacts.delete(id);
}

function deleteContactsBatch(ids) {
  let count = 0;
  for (const id of ids) {
    if (contacts.delete(id)) count++;
  }
  return count;
}

function moveContactsToGroup(contactIds, groupId) {
  let count = 0;
  for (const id of contactIds) {
    const contact = contacts.get(id);
    if (contact) {
      if (!contact.groupIds.includes(groupId)) {
        contact.groupIds.push(groupId);
        count++;
      }
    }
  }
  return count;
}

function getRandomColor() {
  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getGroupContactCount(groupId, userId) {
  let count = 0;
  for (const contact of contacts.values()) {
    if (contact.userId === userId && contact.groupIds.includes(groupId)) {
      count++;
    }
  }
  return count;
}

function getUngroupedCount(userId) {
  let count = 0;
  for (const contact of contacts.values()) {
    if (contact.userId === userId && contact.groupIds.length === 0) {
      count++;
    }
  }
  return count;
}

module.exports = {
  findUserByEmail,
  createUser,
  getUserById,
  getGroupsByUserId,
  createGroup,
  getGroupById,
  updateGroup,
  deleteGroup,
  getContactsByUserId,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  deleteContactsBatch,
  moveContactsToGroup,
  getGroupContactCount,
  getUngroupedCount
};
