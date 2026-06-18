import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout,
  Input,
  Button,
  Checkbox,
  Pagination,
  Select,
  Dropdown,
  Menu,
  message,
  App as AntdApp,
  Upload,
  Popconfirm,
  Modal
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  SwapOutlined,
  ExportOutlined,
  ImportOutlined,
  LogoutOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../utils/api';
import { groupContactsByInitial } from '../utils/helpers';
import GroupSidebar from '../components/GroupSidebar';
import ContactCard from '../components/ContactCard';
import ContactFormModal from '../components/ContactFormModal';
import ContactDetailModal from '../components/ContactDetailModal';
import AlphabetIndex from '../components/AlphabetIndex';

const { Header, Content, Sider } = Layout;

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentGroup, setCurrentGroup] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingContact, setViewingContact] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeLetter, setActiveLetter] = useState('');
  const [stats, setStats] = useState({ total: 0, ungrouped: 0 });
  const [moveGroupModalOpen, setMoveGroupModalOpen] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  const { user, logout } = useApp();
  const navigate = useNavigate();
  const { message: msg } = AntdApp.useApp();

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/contacts', {
        params: {
          page,
          pageSize,
          search: searchText,
          groupId: currentGroup
        }
      });
      setContacts(response.data.list);
      setTotal(response.data.total);
      setPage(response.data.page);
    } catch (err) {
      msg.error(err.response?.data?.error || '获取联系人失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText, currentGroup, msg]);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (err) {
      msg.error(err.response?.data?.error || '获取分组失败');
    }
  }, [msg]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/contacts/stats');
      setStats(response.data);
    } catch (err) {
      // ignore
    }
  }, [msg]);

  useEffect(() => {
    fetchGroups();
    fetchStats();
  }, [fetchGroups, fetchStats]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [searchText, currentGroup]);

  const handleRefresh = () => {
    fetchContacts();
    fetchGroups();
    fetchStats();
  };

  const contactGroups = useMemo(() => {
    return groupContactsByInitial(contacts);
  }, [contacts]);

  const isAllSelected = useMemo(() => {
    if (contacts.length === 0) return false;
    return contacts.every(c => selectedIds.includes(c.id));
  }, [contacts, selectedIds]);

  const isIndeterminate = useMemo(() => {
    if (selectedIds.length === 0) return false;
    if (isAllSelected) return false;
    return contacts.some(c => selectedIds.includes(c.id));
  }, [contacts, selectedIds, isAllSelected]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(contacts.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectContact = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setFormModalOpen(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setDetailModalOpen(false);
    setFormModalOpen(true);
  };

  const handleViewContact = (contact) => {
    setViewingContact(contact);
    setDetailModalOpen(true);
  };

  const handleDeleteContact = async () => {
    if (!viewingContact) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/contacts/${viewingContact.id}`);
      msg.success('删除成功');
      setDetailModalOpen(false);
      handleRefresh();
      setSelectedIds(prev => prev.filter(id => id !== viewingContact.id));
    } catch (err) {
      msg.error(err.response?.data?.error || '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setBatchLoading(true);
    try {
      await api.post('/contacts/batch/delete', { ids: selectedIds });
      msg.success(`成功删除 ${selectedIds.length} 个联系人`);
      setSelectedIds([]);
      handleRefresh();
    } catch (err) {
      msg.error(err.response?.data?.error || '批量删除失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchMove = async () => {
    if (selectedIds.length === 0 || !targetGroupId) return;
    setBatchLoading(true);
    try {
      await api.post('/contacts/batch/move', { ids: selectedIds, groupId: targetGroupId });
      msg.success('批量移动成功');
      setMoveGroupModalOpen(false);
      setSelectedIds([]);
      handleRefresh();
    } catch (err) {
      msg.error(err.response?.data?.error || '批量移动失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (searchText) params.append('search', searchText);
    if (currentGroup) params.append('groupId', currentGroup);
    
    const token = localStorage.getItem('token');
    const url = `/api/csv/export?${params.toString()}`;
    
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'contacts.csv';
        link.click();
        URL.revokeObjectURL(link.href);
        msg.success('导出成功');
      })
      .catch(() => {
        msg.error('导出失败');
      });
  };

  const handleImport = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    api.post('/csv/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        const { successCount, totalCount, errors } = res.data;
        if (errors.length > 0) {
          Modal.warning({
            title: '导入完成',
            content: (
              <div>
                <p>成功导入 {successCount} / {totalCount} 条</p>
                {errors.length > 0 && (
                  <div>
                    <p style={{ marginBottom: 8 }}>错误详情：</p>
                    <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {errors.map((err, idx) => (
                        <li key={idx} style={{ fontSize: 12, color: '#ff4d4f' }}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          });
        } else {
          msg.success(`成功导入 ${successCount} 条`);
        }
        handleRefresh();
      })
      .catch(err => {
        msg.error(err.response?.data?.error || '导入失败');
      });

    return false;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentGroupCount = useMemo(() => {
    if (currentGroup === '') return stats.total;
    if (currentGroup === 'ungrouped') return stats.ungrouped;
    const group = groups.find(g => g.id === currentGroup);
    return group?.count || 0;
  }, [currentGroup, groups, stats]);

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>团队通讯录</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined />
              {user?.email}
            </span>
          </Dropdown>
        </div>
      </Header>

      <Layout>
        <Sider width={240} style={{ background: '#f5f5f5', padding: 16 }}>
          <GroupSidebar
            groups={groups}
            currentGroup={currentGroup}
            onGroupChange={setCurrentGroup}
            onGroupsChange={handleRefresh}
            totalCount={stats.total}
            ungroupedCount={stats.ungrouped}
          />
        </Sider>

        <Content style={{ padding: 16, background: '#f5f5f5', position: 'relative' }}>
          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Input
                placeholder="搜索姓名、手机号、邮箱、公司..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <div style={{ flex: 1 }} />
              <Upload
                showUploadList={false}
                beforeUpload={handleImport}
                accept=".csv"
              >
                <Button icon={<ImportOutlined />}>导入CSV</Button>
              </Upload>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出CSV
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddContact}>
                新增联系人
              </Button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="batch-actions-bar">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span>已选择 {selectedIds.length} 项</span>
              <Popconfirm
                title="确认删除选中的联系人吗？"
                onConfirm={handleBatchDelete}
                okText="确认"
                cancelText="取消"
                okButtonProps={{ danger: true, loading: batchLoading }}
              >
                <Button danger icon={<DeleteOutlined />} size="small">
                  批量删除
                </Button>
              </Popconfirm>
              <Button
                icon={<SwapOutlined />}
                size="small"
                onClick={() => setMoveGroupModalOpen(true)}
              >
                批量移动分组
              </Button>
              <Button type="link" size="small" onClick={() => setSelectedIds([])}>
                取消选择
              </Button>
            </div>
          )}

          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: 16,
            minHeight: 400
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderBottom: '1px solid #f0f0f0',
              marginBottom: 12
            }}>
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={(e) => handleSelectAll(e.target.checked)}
                style={{ marginRight: 12 }}
              />
              <span style={{ color: '#666', fontSize: 13 }}>
                共 {total} 个联系人
              </span>
            </div>

            <div style={{ paddingRight: 40 }}>
              {contactGroups.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 0',
                  color: '#999'
                }}>
                  {loading ? '加载中...' : '暂无联系人'}
                </div>
              ) : (
                contactGroups.map(group => (
                  <div
                    key={group.letter}
                    id={`letter-section-${group.letter}`}
                    className="contact-letter-section"
                  >
                    <div className="contact-letter-title">
                      {group.letter}
                    </div>
                    <div style={{ padding: '8px 12px' }}>
                      {group.contacts.map(contact => (
                        <ContactCard
                          key={contact.id}
                          contact={contact}
                          groups={groups}
                          selected={selectedIds.includes(contact.id)}
                          onSelect={handleSelectContact}
                          onClick={handleViewContact}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {total > pageSize && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={setPage}
                  showSizeChanger={false}
                  showQuickJumper
                />
              </div>
            )}

            <div className="stats-footer">
              <span>总联系人：{stats.total} 人</span>
              <span>
                当前分组：
                {currentGroup === '' ? '全部' :
                 currentGroup === 'ungrouped' ? '未分组' :
                 groups.find(g => g.id === currentGroup)?.name}
                ：{currentGroupCount} 人
              </span>
            </div>
          </div>

          {contactGroups.length > 0 && (
            <AlphabetIndex
              contactGroups={contactGroups}
              activeLetter={activeLetter}
              onLetterClick={setActiveLetter}
            />
          )}
        </Content>
      </Layout>

      <ContactFormModal
        open={formModalOpen}
        contact={editingContact}
        groups={groups}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <ContactDetailModal
        open={detailModalOpen}
        contact={viewingContact}
        groups={groups}
        onClose={() => setDetailModalOpen(false)}
        onEdit={() => handleEditContact(viewingContact)}
        onDelete={handleDeleteContact}
        deleteLoading={deleteLoading}
      />

      <Modal
        title="批量移动分组"
        open={moveGroupModalOpen}
        onOk={handleBatchMove}
        onCancel={() => setMoveGroupModalOpen(false)}
        confirmLoading={batchLoading}
        okText="确认移动"
        cancelText="取消"
      >
        <p style={{ marginBottom: 16 }}>
          将 {selectedIds.length} 个联系人移动到：
        </p>
        <Select
          style={{ width: '100%' }}
          placeholder="请选择目标分组"
          value={targetGroupId || undefined}
          onChange={setTargetGroupId}
        >
          {groups.map(group => (
            <Select.Option key={group.id} value={group.id}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: group.color,
                  marginRight: 8
                }}
              />
              {group.name}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </Layout>
  );
}

export default Contacts;
