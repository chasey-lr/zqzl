import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to={user ? '/dashboard' : '/'} className="navbar-brand">
          <div className="navbar-logo">问</div>
          <span>问卷星</span>
        </NavLink>

        <div className="navbar-links">
          <NavLink to="/public">公开问卷</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard">我的工作台</NavLink>
              <div className="user-info">
                <span className="user-email">{user.email}</span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  退出
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login">登录</NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">注册</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
