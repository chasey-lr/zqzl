import React, { useState } from 'react';
import { Form, Input, Button, message, App as AntdApp } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();
  const { message: msg } = AntdApp.useApp();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      msg.success('登录成功');
      navigate('/contacts');
    } catch (err) {
      msg.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">团队通讯录</h2>
        <Form
          name="login"
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
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            还没有账号？ <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Login;
