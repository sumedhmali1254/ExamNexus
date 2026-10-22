import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Calendar, Check, CheckCheck, Info, Shield, Sparkles, X, Menu } from 'lucide-react';

const Header = ({ mobileOpen, onToggleMobileMenu }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Database Synchronized',
      message: 'Connected to MySQL exam_seating_optimizer database successfully.',
      time: 'Just now',
      unread: true,
      type: 'success'
    },
    {
      id: 2,
      title: 'Optimization Engine Active',
      message: 'Zero-collision seating algorithms are calibrated and ready.',
      time: '12m ago',
      unread: true,
      type: 'info'
    },
    {
      id: 3,
      title: 'Anti-Cheating Rules Loaded',
      message: 'Active room and bench diversity constraints applied.',
      time: '1h ago',
      unread: false,
      type: 'neutral'
    }
  ]);

  const searchInputRef = useRef(null);
  const notifRef = useRef(null);

  // Keyboard shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Professional date formatting: e.g. "Thursday, 22 October 2026"
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, unread: false }) : n));
  };

  const clearNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="header" style={{ position: 'sticky', top: 0, zIndex: 90 }}>
      {/* Left: Hamburger & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <button 
          type="button"
          className="mobile-menu-btn" 
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="header-search" style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: isSearchFocused ? 'var(--primary)' : 'var(--text-subtle)',
              zIndex: 10,
              pointerEvents: 'none',
              transition: 'color 0.2s ease'
            }} 
          />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search students, halls, rules or sessions..." 
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 42px 10px 38px',
              borderRadius: '12px',
              border: `1.5px solid ${isSearchFocused ? 'var(--primary)' : 'var(--border)'}`,
              background: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: 'var(--text-main)',
              outline: 'none',
              boxShadow: isSearchFocused ? '0 0 0 3px rgba(79, 70, 229, 0.12)' : 'none',
              transition: 'all 0.22s ease'
            }}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                display: 'flex',
                alignItems: 'center',
                zIndex: 10
              }}
            >
              <X size={15} />
            </button>
          ) : (
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <span className="header-badge" style={{ fontSize: '0.68rem', padding: '2px 6px', fontWeight: 700 }}>
                Ctrl K
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Professional Date Display & Working Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Professional Standard Date Display */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 16px',
          background: '#ffffff',
          border: '1.5px solid var(--border)',
          borderRadius: '12px',
          fontSize: '0.84rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Calendar size={15} color="var(--primary)" />
          <span>{formattedDate}</span>
        </div>

        {/* Working Notification Bell with Dropdown Menu */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              background: showNotifications ? 'var(--primary-light)' : '#ffffff', 
              border: `1.5px solid ${showNotifications ? 'var(--primary)' : 'var(--border)'}`, 
              color: showNotifications ? 'var(--primary)' : 'var(--text-secondary)', 
              cursor: 'pointer', 
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
            aria-label="View notifications"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '18px',
                height: '18px',
                padding: '0 4px',
                background: 'var(--primary)',
                color: '#ffffff',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.4)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Flyout */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '360px',
              maxWidth: '90vw',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.04)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              {/* Dropdown Header */}
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: 'var(--font-brand)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '2px 7px',
                      borderRadius: '9999px'
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        background: notif.unread ? 'rgba(79, 70, 229, 0.03)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        position: 'relative'
                      }}
                      className="hover-bg"
                    >
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: notif.unread ? 'var(--primary)' : 'transparent',
                        marginTop: '6px',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: notif.unread ? 700 : 600, 
                          color: 'var(--text-main)',
                          lineHeight: 1.25 
                        }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '4px', fontWeight: 600 }}>
                          {notif.time}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => clearNotification(notif.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-subtle)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Dismiss"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Info size={28} color="var(--border)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No notifications</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>You're all caught up!</p>
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div style={{
                padding: '10px 18px',
                background: '#f8fafc',
                borderTop: '1px solid var(--border-light)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                  ExamNexus System Feeds
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
