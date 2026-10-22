import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, GraduationCap, Zap,
  Calendar, ArrowRight, LayoutGrid, Shield, Sparkles,
  CheckCircle2, Compass, ArrowUpRight
} from 'lucide-react';
import { DashboardService } from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await DashboardService.getStats();
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) return (
    <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.25rem' }}>
      <div className="spinner" style={{ width: 44, height: 44, border: '4px solid #e0e7ff', borderTop: '4px solid var(--primary)', borderRadius: '50%' }} />
      <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Synchronizing Institutional Registry...</p>
    </div>
  );

  const Shortcut = ({ icon: Icon, label, desc, path, gradient, shadowColor }) => (
    <div 
      onClick={() => navigate(path)} 
      className="card hover-bg" 
      style={{
        padding: '1.4rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        cursor: 'pointer',
        background: '#ffffff', 
        border: '1px solid var(--border)', 
        borderRadius: '16px',
        transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: '14px', 
          background: gradient, 
          color: '#ffffff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: `0 6px 16px ${shadowColor}`,
          flexShrink: 0
        }}>
          <Icon size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)', fontFamily: 'var(--font-brand)', letterSpacing: '-0.01em' }}>{label}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{desc}</div>
        </div>
      </div>
      <div style={{ 
        width: 32, 
        height: 32, 
        borderRadius: '50%', 
        background: 'var(--border-light)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-muted)',
        transition: 'all 0.2s ease'
      }}>
        <ArrowUpRight size={16} />
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header Banner */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '4px 10px', 
            background: 'var(--primary-light)', 
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--primary)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '8px',
            fontFamily: 'var(--font-brand)'
          }}>
            <Sparkles size={12} /> Optimization Hub Active
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-brand)', letterSpacing: '-0.03em' }}>
            Institutional Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px', fontWeight: 500 }}>
            Real-time analytics and algorithmic allocation controls for academic examinations.
          </p>
        </div>

        <button 
          onClick={() => navigate('/exam-engine')} 
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '0.92rem' }}
        >
          <Zap size={18} />
          <span>Launch Exam Engine</span>
        </button>
      </header>

      {/* Primary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Registered Students', value: data.overall.students, icon: Users, gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', glow: 'rgba(236, 72, 153, 0.25)', bgTint: 'rgba(236, 72, 153, 0.08)' },
          { label: 'Faculty Invigilators', value: data.overall.teachers, icon: GraduationCap, gradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', glow: 'rgba(13, 148, 136, 0.25)', bgTint: 'rgba(13, 148, 136, 0.08)' },
          { label: 'Configured Halls', value: data.overall.rooms, icon: Building2, gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', glow: 'rgba(99, 102, 241, 0.25)', bgTint: 'rgba(99, 102, 241, 0.08)' },
          { label: 'Total Seating Capacity', value: data.overall.capacity, icon: Zap, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', glow: 'rgba(245, 158, 11, 0.25)', bgTint: 'rgba(245, 158, 11, 0.08)' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '14px', 
                background: stat.gradient, 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: `0 6px 16px ${stat.glow}`
              }}>
                <stat.icon size={22} />
              </div>
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                color: 'var(--text-subtle)', 
                background: 'var(--border-light)', 
                padding: '3px 8px', 
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)' 
              }}>
                LIVE
              </span>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <div className="val">{stat.value.toLocaleString()}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '6px', fontFamily: 'var(--font-brand)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Critical Modules + Department Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        {/* Quick Access Modules */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <Compass size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-brand)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Core Operations
            </h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
            <Shortcut 
              icon={Zap} 
              label="Exam Engine" 
              desc="Generate optimized seating plans" 
              path="/exam-engine" 
              gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" 
              shadowColor="rgba(79, 70, 229, 0.28)" 
            />
            <Shortcut 
              icon={Shield} 
              label="Anti-Cheat Rules" 
              desc="Configure adjacency & constraints" 
              path="/seating-rules" 
              gradient="linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" 
              shadowColor="rgba(139, 92, 246, 0.28)" 
            />
            <Shortcut 
              icon={LayoutGrid} 
              label="Floor & Rooms" 
              desc="Configure halls, rows & benches" 
              path="/rooms" 
              gradient="linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)" 
              shadowColor="rgba(6, 182, 212, 0.28)" 
            />
            <Shortcut 
              icon={Users} 
              label="Student Registry" 
              desc="Enrollments, years & branches" 
              path="/students" 
              gradient="linear-gradient(135deg, #059669 0%, #047857 100%)" 
              shadowColor="rgba(5, 150, 105, 0.28)" 
            />
          </div>

          {/* System Advisory Card */}
          <div style={{ 
            marginTop: '1.75rem', 
            padding: '1.4rem 1.6rem', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(6, 182, 212, 0.04) 100%)', 
            border: '1.5px solid rgba(79, 70, 229, 0.15)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-brand)', letterSpacing: '0.04em' }}>
                ALGORITHMIC ENGINE READY
              </h4>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
              The high-performance optimization engine guarantees <strong>zero department collisions</strong> across adjacent seats. Verify candidate counts and room availability before launching allocation.
            </p>
          </div>
        </section>

        {/* Integrated Department Summary */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-brand)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Department Distribution
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
              {data.departments ? data.departments.length : 0} Branches
            </span>
          </div>

          <div className="card" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {data.departments && data.departments.length > 0 ? (
                data.departments.map((dept, i) => (
                  <div key={dept.id || i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', 
                    borderBottom: i === data.departments.length - 1 ? 'none' : '1px solid var(--border-light)',
                    transition: 'background 0.15s ease'
                  }} className="hover-bg">
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>{dept.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600, marginTop: '2px' }}>{dept.domain_name || 'Engineering & Science'}</div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-brand)' }}>{dept.student_count || 0}</div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-subtle)', letterSpacing: '0.04em' }}>STUDENTS</div>
                      </div>
                      <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0d9488', fontFamily: 'var(--font-brand)' }}>{dept.teacher_count || 0}</div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-subtle)', letterSpacing: '0.04em' }}>FACULTY</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Building2 size={36} color="var(--border)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>No departments registered yet.</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '4px' }}>Configure domains & departments in Settings.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
