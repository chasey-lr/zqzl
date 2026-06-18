import React, { useState } from 'react';
import { Button, Input, Popconfirm, Modal, Form, message, App as AntdApp } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import api from '../utils/api';

function GroupSidebar({ groups, currentGroup, onGroupChange, onGroupsChange, totalCount, ungroupedCount }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message: msg } = AntdApp.useApp();

  const handleAddGroup = () => {
    setEditingGroup(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEditGroup = (group, e) => {
    e.stopPropagation();
    setEditingGroup(group);
    form.setFieldsValue({ name: group.name, color: group.color });
    setModalOpen(true);
  };

  const handleDeleteGroup = async (groupId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/groups/${groupId}`);
      msg.success('删除成功');
      if (currentGroup === groupId) {
        onGroupChange('');
      }
      onGroupsChange?.();
    } catch (err) {
      msg.error(err.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, { name: values.name });
        msg.success('修改成功');
      } else {
        await api.post('/groups', { name: values.name });
        msg.success('创建成功');
      }

      setModalOpen(false);
      onGroupsChange?.();
    } catch (err) {
      if (err.errorFields) return;
      msg.error(err.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: 220, background: 'white', borderRadius: 8, padding: 16 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>分组管理</h3>
        <Button
          type="text"
          icon={<PlusOutlined />}
          size="small"
          onClick={handleAddGroup}
        />
      </div>

      <div
        className={`sidebar-group-item ${currentGroup === '' ? 'active' : ''}`}
        onClick={() => onGroupChange('')}
      >
        <div className="sidebar-group-name">
          <UserOutlined style={{ marginRight: 8, color: '#999' }} />
          <span>全部联系人</span>
        </div>
        <span className="badge-count">{totalCount}</span>
      </div>

      <div
        className={`sidebar-group-item ${currentGroup === 'ungrouped' ? 'active' : ''}`}
        onClick={() => onGroupChange('ungrouped')}
        style={{ marginTop: 4 }}
      >
        <div className="sidebar-group-name">
          <TeamOutlined style={{ marginRight: 8, color: '#999' }} />
          <span>未分组</span>
        </div>
        <span className="badge-count">{ungroupedCount}</span>
      </div>

      <div style={{ marginTop: 12, marginBottom: 8, fontSize: 12, color: '#999' }}>
        我的分组
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {groups.map(group => (
          <div
            key={group.id}
            className={`sidebar-group-item ${currentGroup === group.id ? 'active' : ''}`}
            onClick={() => onGroupChange(group.id)}
          >
            <div className="sidebar-group-name" style={{ flex: 1, minWidth: 0 }}>
              <span
                className="sidebar-group-color"
                style={{ background: group.color }}
              />
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {group.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="badge-count">{group.count || 0}</span>
              <div className="group-action-btns">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => handleEditGroup(group, e)}
                  style={{ padding: 0, minWidth: 0 }}
                />
                <Popconfirm
                  title="确认删除该分组吗？"
                  description="删除后，该组下的联系人将移至未分组"
                  onConfirm={(e) => handleDeleteGroup(group.id, e)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    style={{ padding: 0, minWidth: 0 }}
                  />
                </Popconfirm>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        title={editingGroup ? '编辑分组' : '新建分组'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={loading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分组名称"
            rules={[
              { required: true, message: '请输入分组名称' },
              { max: 20, message: '最多20个字符' }
            ]}
          >
            <Input placeholder="请输入分组名称" maxLength={20} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default GroupSidebar;
