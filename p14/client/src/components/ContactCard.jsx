import React, { useState } from 'react';
import { Card, Checkbox, Tooltip, Tag, Popover, Image } from 'antd';
import { PhoneOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import { getAvatarColor, formatPhone } from '../utils/helpers';

function ContactCard({ contact, groups, selected, onSelect, onClick, style }) {
  const [showActions, setShowActions] = useState(false);

  const groupList = contact.groupIds
    .map(gid => groups.find(g => g.id === gid))
    .filter(Boolean);

  const avatarColor = getAvatarColor(contact.name);
  const firstChar = contact.name.charAt(0).toUpperCase();

  const renderTooltipContent = () => (
    <div style={{ fontSize: 12, maxWidth: 250 }}>
      <p><strong>姓名：</strong>{contact.name}</p>
      <p><strong>手机号：</strong>{formatPhone(contact.phone)}</p>
      {contact.officePhone && <p><strong>办公电话：</strong>{contact.officePhone}</p>}
      {contact.email && <p><strong>邮箱：</strong>{contact.email}</p>}
      {contact.company && <p><strong>公司：</strong>{contact.company}</p>}
      {contact.department && <p><strong>部门：</strong>{contact.department}</p>}
      {contact.position && <p><strong>职位：</strong>{contact.position}</p>}
      {groupList.length > 0 && (
        <p><strong>分组：</strong>{groupList.map(g => g.name).join('、')}</p>
      )}
    </div>
  );

  const renderAvatar = () => {
    if (contact.avatar) {
      return (
        <Popover
          content={
            <Image
              src={contact.avatar}
              width={120}
              height={120}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={false}
            />
          }
          trigger="hover"
          placement="right"
        >
          <img
            src={contact.avatar}
            alt={contact.name}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        </Popover>
      );
    }
    return (
      <div
        className="avatar-placeholder"
        style={{
          width: 40,
          height: 40,
          fontSize: 16,
          backgroundColor: avatarColor
        }}
      >
        {firstChar}
      </div>
    );
  };

  return (
    <Tooltip title={renderTooltipContent} placement="topLeft" mouseEnterDelay={0.5}>
      <Card
        size="small"
        className="contact-card"
        style={{ ...style, marginBottom: 8 }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={(e) => {
          if (e.target.type === 'checkbox') return;
          onClick?.(contact);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Checkbox
            checked={selected}
            onChange={(e) => onSelect?.(contact.id, e.target.checked)}
            onClick={e => e.stopPropagation()}
          />
          {renderAvatar()}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {contact.name}
            </div>
            <div style={{
              color: '#666',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <PhoneOutlined style={{ fontSize: 11 }} />
              <span style={{ whiteSpace: 'nowrap' }}>{formatPhone(contact.phone)}</span>
            </div>
            {contact.company && (
              <div style={{
                color: '#999',
                fontSize: 11,
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <BankOutlined style={{ fontSize: 10 }} />
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {contact.company}
                </span>
              </div>
            )}
          </div>
        </div>

        {groupList.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {groupList.slice(0, 3).map(group => (
              <Tag
                key={group.id}
                icon={<span className="group-dot" style={{ background: group.color }} />}
                style={{
                  margin: 0,
                  padding: '0 6px',
                  fontSize: 11,
                  lineHeight: '18px',
                  height: 18
                }}
              >
                {group.name}
              </Tag>
            ))}
            {groupList.length > 3 && (
              <Tag style={{ margin: 0, fontSize: 11 }}>+{groupList.length - 3}</Tag>
            )}
          </div>
        )}
      </Card>
    </Tooltip>
  );
}

export default ContactCard;
