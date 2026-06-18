import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBar from './components/ErrorBar';
import PersistentBanner from './components/PersistentBanner';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SurveyCreate from './pages/SurveyCreate';
import FillSurvey from './pages/FillSurvey';
import Statistics from './pages/Statistics';
import PublicSurveys from './pages/PublicSurveys';

const App = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isFillPage = location.pathname.startsWith('/fill/');

  const showNavbar = !isAuthPage && !isFillPage;

  return (
    <div className="app">
      <ErrorBar />
      <PersistentBanner />
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/public" element={<PublicSurveys />} />
        <Route path="/surveys/create" element={<SurveyCreate />} />
        <Route path="/surveys/:id/edit" element={<SurveyCreate />} />
        <Route path="/fill/:id" element={<FillSurvey />} />
        <Route path="/stats/:id" element={<Statistics />} />
        <Route path="*" element={
          <div className="main-content container">
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">页面不存在</div>
                <div className="empty-text">您访问的页面不存在或已被移除</div>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
};

export default App;
