import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, UserCircle, 
  Settings, ChevronLeft, ChevronRight,
  LayoutDashboard, Calculator,
  Shield, Eye, UserCheck, Sparkles, RefreshCw
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, onCloseMobile }) => {
  const menuItems = [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={19} /> },
    { title: 'Student Registry', path: '/students', icon: <Users size={19} /> },
    { title: 'Faculty Portal', path: '/teachers', icon: <UserCircle size={19} /> },
    { title: 'Room Config', path: '/rooms', icon: <Building2 size={19} /> },
    { section: 'Exam Optimization' },
    { title: 'Exam Engine', path: '/exam-engine', icon: <Calculator size={19} /> },
    { title: 'Seating Rules', path: '/seating-rules', icon: <Shield size={19} /> },
    { title: 'Seating Preview', path: '/seating-preview', icon: <Eye size={19} /> },
    { title: 'Teacher Allocation', path: '/teacher-allocation', icon: <UserCheck size={19} /> },
    { section: 'System' },
    { title: 'Institutional Control', path: '/settings', icon: <Settings size={19} /> },
  ];

  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:3000/api-status');
        if (res.ok) setServerStatus('online');
        else setServerStatus('offline');
      } catch (err) {
        setServerStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const [isHovered, setIsHovered] = useState(false);

  // Effective state: expanded if pinned (not collapsed) OR if currently peeking (hovering)
  const isExpanded = !collapsed || isHovered;

  return (
    <aside 
      className={`sidebar ${collapsed && !isHovered ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        width: isExpanded ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)',
        transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 1000
      }}
    >
      {/* Brand Logo Header */}
      <div 
        className="sidebar-logo" 
        style={{ 
          justifyContent: isExpanded ? 'flex-start' : 'center', 
          position: 'relative',
          padding: isExpanded ? '0 1.25rem' : '0',
          gap: '10px'
        }}
      >
        {isExpanded ? (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span className="sidebar-logo-text" style={{ whiteSpace: 'nowrap' }}>
              Exam<span className="sidebar-logo-accent">Nexus</span>
            </span>
          </div>
        ) : (
          <div 
            title="ExamNexus" 
            style={{ 
              fontFamily: 'var(--font-brand)', 
              fontSize: '1.2rem', 
              fontWeight: 900, 
              letterSpacing: '0.05em',
              background: 'var(--primary-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              userSelect: 'none',
              padding: '6px'
            }}
          >
            EN
          </div>
        )}

        {/* Pin/Toggle Button */}
        {isExpanded && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            style={{ 
              background: '#ffffff', 
              border: '1px solid var(--border)', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              right: '12px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
              zIndex: 5,
              transition: 'all 0.2s ease'
            }}
            className="hover-bg"
            title={collapsed ? "Pin Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {menuItems.map((item, idx) => {
          if (item.section) {
            return isExpanded ? (
              <div key={idx} className="nav-section-label">
                {item.section}
              </div>
            ) : <div key={idx} style={{ borderTop: '1px solid var(--border-light)', margin: '10px 10px' }} />;
          }
          return (
            <NavLink 
              key={item.path} 
              to={item.path} 
              onClick={() => onCloseMobile?.()}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={!isExpanded ? item.title : undefined}
            >
              {item.icon}
              {isExpanded && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div 
        onClick={() => window.location.reload()} 
        style={{ 
          marginTop: 'auto',
          padding: isExpanded ? '0 16px' : '0', 
          background: serverStatus === 'online' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          gap: '12px',
          cursor: 'pointer',
          transition: 'background 0.2s ease'
        }}
        className="status-footer"
        title="Click to check connection"
      >
        <div className={`status-dot ${serverStatus === 'online' ? 'online' : 'offline'}`} />
        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: serverStatus === 'online' ? '#059669' : '#dc2626',
              lineHeight: 1.1,
              fontFamily: 'var(--font-brand)'
            }}>
              {serverStatus === 'online' ? 'Engine Online' : 'Engine Offline'}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <RefreshCw size={9} /> Click to refresh
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
