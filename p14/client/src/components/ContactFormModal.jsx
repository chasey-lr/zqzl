import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Upload, Button, message, App as AntdApp } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Option } = Select;

function ContactFormModal({ open, contact, groups, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [newGroupInput, setNewGroupInput] = useState('');
  const { message: msg } = AntdApp.useApp();

  useEffect(() => {
    if (open) {
      if (contact) {
        form.setFieldsValue({
          name: contact.name,
          phone: contact.phone,
          officePhone: contact.officePhone,
          email: contact.email,
          company: contact.company,
          department: contact.department,
          position: contact.position,
          groupIds: contact.groupIds || []
        });
        setAvatarPreview(contact.avatar || '');
      } else {
        form.resetFields();
        setAvatarPreview('');
      }
    }
  }, [open, contact, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        ...values,
        avatar: avatarPreview
      };

      if (contact) {
        await api.put(`/contacts/${contact.id}`, data);
        msg.success('修改成功');
      } else {
        await api.post('/contacts', data);
        msg.success('添加成功');
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      if (err.errorFields) return;
      msg.error(err.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleAddNewGroup = async () => {
    if (!newGroupInput.trim()) return;
    
    try {
      const response = await api.post('/groups', { name: newGroupInput.trim() });
      const newGroup = response.data;
      
      const currentGroups = form.getFieldValue('groupIds') || [];
      form.setFieldsValue({
        groupIds: [...currentGroups, newGroup.id]
      });
      
      setNewGroupInput('');
      onSuccess?.(); 
      msg.success('分组创建成功');
    } catch (err) {
      msg.error(err.response?.data?.error || '创建分组失败');
    }
  };

  const dropdownRender = (menu) => (
    <div>
      {menu}
      <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
        <Input
          placeholder="新建分组"
          value={newGroupInput}
          onChange={(e) => setNewGroupInput(e.target.value)}
          onPressEnter={handleAddNewGroup}
          addonAfter={
            <Button type="text" size="small" onClick={handleAddNewGroup}>
              <PlusOutlined />
            </Button>
          }
          size="small"
        />
      </div>
    </div>
  );

  return (
    <Modal
      title={contact ? '编辑联系人' : '新增联系人'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okText="确认"
      cancelText="取消"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>头像</div>
            <div style={{
              width: 80,
              height: 80,
              border: '1px dashed #d9d9d9',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: 8
            }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: '#ccc', fontSize: 12 }}>暂无头像</span>
              )}
            </div>
            <Upload
              showUploadList={false}
              beforeUpload={handleUpload}
              accept="image/*"
            >
              <Button size="small" icon={<UploadOutlined />}>上传</Button>
            </Upload>
          </div>
        </div>

        <Form.Item
          name="name"
          label="姓名"
          rules={[
            { required: true, message: '请输入姓名' },
            { max: 20, message: '最多20个字符' }
          ]}
        >
          <Input placeholder="请输入姓名" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机号"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^\d{11}$/, message: '请输入11位手机号' }
          ]}
        >
          <Input placeholder="请输入手机号" maxLength={11} />
        </Form.Item>

        <Form.Item name="officePhone" label="办公电话">
          <Input placeholder="请输入办公电话（选填）" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input placeholder="请输入邮箱（选填）" />
        </Form.Item>

        <Form.Item name="company" label="公司">
          <Input placeholder="请输入公司（选填）" />
        </Form.Item>

        <Form.Item name="department" label="部门">
          <Input placeholder="请输入部门（选填）" />
        </Form.Item>

        <Form.Item name="position" label="职位">
          <Input placeholder="请输入职位（选填）" />
        </Form.Item>

        <Form.Item name="groupIds" label="分组">
          <Select
            mode="multiple"
            placeholder="选择分组（可多选）"
            dropdownRender={dropdownRender}
            allowClear
          >
            {groups.map(group => (
              <Option key={group.id} value={group.id}>
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
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default ContactFormModal;
