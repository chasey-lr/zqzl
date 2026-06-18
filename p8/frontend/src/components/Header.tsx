import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/date';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
        🗳️ 团队投票决策
        </Link>
        <nav className="nav">
          {user ? (
            <div className="user-menu">
              <Link to="/" className="nav-link">我的投票</Link>
              <Link to="/create" className="nav-link nav-btn">
                + 创建投票
              </Link>
              <div className="user-info">
                <div className="avatar-small">
                {getInitials(user.nickname)}
                </div>
                <span className="user-name">{user.nickname}</span>
                <button onClick={handleLogout} className="logout-btn">
                  退出
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-link">登录</Link>
              <Link to="/register" className="nav-link nav-btn">注册</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
