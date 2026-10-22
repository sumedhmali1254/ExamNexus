import React from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Calendar } from 'lucide-react';

const Reports = () => {
  return (
    <div className="fade-in">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Performance Reports</h1>
          <p style={{ color: 'var(--text-muted)' }}>Analysis of seat utilization and department-wise statistics.</p>
        </div>
        <button className="btn btn-primary">
          <Download size={18} />
          Export All Data
        </button>
      </header>

      <div className="card-grid">
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Utilization Trends</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>Monthly</span>
              <Calendar size={16} color="var(--text-muted)" />
            </div>
          </div>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '1rem' }}>
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <div key={i} style={{ 
                flex: 1, 
                height: `${h}%`, 
                background: i === 3 ? 'var(--primary-gradient)' : 'var(--secondary-gradient)', 
                borderRadius: '8px 8px 0 0',
                boxShadow: i === 3 ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
                transition: 'all 0.25s ease'
              }} className="hover-scale"></div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="stat-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-brand)' }}>Efficiency Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Hall Utilization</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-brand)' }}>88%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '88%', background: 'var(--primary-gradient)', borderRadius: '9999px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Resource Optimization</span>
                <span style={{ fontWeight: 800, color: 'var(--secondary)', fontFamily: 'var(--font-brand)' }}>94%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '94%', background: 'var(--secondary-gradient)', borderRadius: '9999px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
