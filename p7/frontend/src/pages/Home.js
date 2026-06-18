import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 20px'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            marginBottom: 16,
            lineHeight: 1.2
          }}>
            轻松创建在线问卷
          </h1>
          <p style={{
            fontSize: 18,
            opacity: 0.9,
            marginBottom: 36,
            maxWidth: 600,
            margin: '0 auto 36px'
          }}>
            几分钟内创建专业的调查问卷，收集反馈并实时查看统计结果。
            简单、高效、免费！
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <button
                  className="btn btn-lg"
                  style={{ background: 'white', color: '#4f46e5', border: 'none', fontWeight: 600 }}
                  onClick={() => navigate('/surveys/create')}
                >
                  + 创建问卷
                </button>
                <button
                  className="btn btn-lg"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                  onClick={() => navigate('/dashboard')}
                >
                  进入工作台
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn btn-lg"
                  style={{ background: 'white', color: '#4f46e5', border: 'none', fontWeight: 600, textDecoration: 'none' }}
                >
                  免费注册
                </Link>
                <Link
                  to="/public"
                  className="btn btn-lg"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none' }}
                >
                  浏览问卷
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
          为什么选择问卷星？
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 48, fontSize: 16 }}>
          强大的功能，简单的操作，助您轻松收集洞察
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 28
        }}>
          <div className="card">
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 20
            }}>
              📝
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>简单易用</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
              拖拽式问题编辑，多种问题类型，小白也能轻松上手。几分钟内创建专业问卷。
            </p>
          </div>

          <div className="card">
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--success-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 20
            }}>
              📊
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>实时统计</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
              实时查看问卷提交数据，可视化图表展示，选择和文本回答一目了然。
            </p>
          </div>

          <div className="card">
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--warning-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 20
            }}>
              🔗
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>一键分享</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
              发布问卷后生成专属链接，一键分享给用户，自动检测重复提交。
            </p>
          </div>

          <div className="card">
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--danger-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 20
            }}>
              🔒
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>安全可靠</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
              账号密码加密存储，防重复提交机制，保障您的数据安全。
            </p>
          </div>

          <div className="card">
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#f3e8ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 20
            }}>
              🎯
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>灵活配置</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
              支持单选、多选、文本三种题型，可设置必答、截止日期等，灵活满足各类需求。
            </p>
          </div>

          <div className="card">
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 20
            }}>
              📱
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>响应式设计</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
              完美适配手机、平板、PC，随时随地创建和填写问卷。
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
            准备好了吗？
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16 }}>
            立即开始创建您的第一个在线问卷
          </p>
          {user ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/surveys/create')}
            >
              + 创建问卷
            </button>
          ) : (
            <Link
              to="/register"
              className="btn btn-primary btn-lg"
              style={{ textDecoration: 'none' }}
            >
              免费注册，立即使用
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
