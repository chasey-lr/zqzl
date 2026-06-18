import React from 'react';
import { Modal, Button, Tag, Popconfirm, Descriptions, Image } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  BankOutlined,
  HomeOutlined,
  UserOutlined
} from '@ant-design/icons';
import { getAvatarColor, formatPhone } from '../utils/helpers';

function ContactDetailModal({ contact, groups, open, onClose, onEdit, onDelete, deleteLoading }) {
  if (!contact) return null;

  const groupList = contact.groupIds
    .map(gid => groups.find(g => g.id === gid))
    .filter(Boolean);

  const avatarColor = getAvatarColor(contact.name);
  const firstChar = contact.name.charAt(0).toUpperCase();

  const renderAvatar = () => {
    if (contact.avatar) {
      return (
        <Image
          src={contact.avatar}
          alt={contact.name}
          width={80}
          height={80}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
          preview={{ mask: '点击放大' }}
        />
      );
    }
    return (
      <div className="detail-avatar-placeholder" style={{ backgroundColor: avatarColor }}>
        {firstChar}
      </div>
    );
  };

  return (
    <Modal
      title="联系人详情"
      open={open}
      onCancel={onClose}
      footer={[
        <Popconfirm
          key="delete"
          title="确认删除该联系人吗？"
          onConfirm={onDelete}
          okText="确认"
          cancelText="取消"
          okButtonProps={{ danger: true, loading: deleteLoading }}
        >
          <Button key="delete" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={onEdit}>
          编辑
        </Button>
      ]}
      width={500}
    >
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        {renderAvatar()}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{contact.name}</h2>
          {contact.position && (
            <p style={{ margin: '4px 0', color: '#666' }}>{contact.position}</p>
          )}
          {groupList.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {groupList.map(group => (
                <Tag
                  key={group.id}
                  color={group.color}
                  icon={<span style={{ opacity: 0 }}>•</span>}
                >
                  {group.name}
                </Tag>
              ))}
            </div>
          )}
        </div>
      </div>

      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="手机号">
          <PhoneOutlined style={{ marginRight: 8, color: '#999' }} />
          {formatPhone(contact.phone)}
        </Descriptions.Item>

        {contact.officePhone && (
          <Descriptions.Item label="办公电话">
            <PhoneOutlined style={{ marginRight: 8, color: '#999' }} />
            {contact.officePhone}
          </Descriptions.Item>
        )}

        {contact.email && (
          <Descriptions.Item label="邮箱">
            <MailOutlined style={{ marginRight: 8, color: '#999' }} />
            {contact.email}
          </Descriptions.Item>
        )}

        {contact.company && (
          <Descriptions.Item label="公司">
            <BankOutlined style={{ marginRight: 8, color: '#999' }} />
            {contact.company}
          </Descriptions.Item>
        )}

        {contact.department && (
          <Descriptions.Item label="部门">
            <HomeOutlined style={{ marginRight: 8, color: '#999' }} />
            {contact.department}
          </Descriptions.Item>
        )}

        {contact.position && (
          <Descriptions.Item label="职位">
            <UserOutlined style={{ marginRight: 8, color: '#999' }} />
            {contact.position}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
}

export default ContactDetailModal;
