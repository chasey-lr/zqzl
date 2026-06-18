import React, { useState } from 'react';
import { Form, Input, Button, App as AntdApp } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function Register() {
  const [loading, setLoading] = useState(false);
  const { register } = useApp();
  const navigate = useNavigate();
  const { message: msg } = AntdApp.useApp();

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      msg.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register(values.email, values.password);
      msg.success('注册成功');
      navigate('/contacts');
    } catch (err) {
      msg.error(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">注册账号</h2>
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码（至少6位）" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: '请确认密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            已有账号？ <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Register;
