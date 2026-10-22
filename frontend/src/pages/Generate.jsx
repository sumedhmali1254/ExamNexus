import React, { useState } from 'react';
import { Zap, ShieldCheck, Settings2, BarChart, Loader2, CheckCircle2 } from 'lucide-react';
import { ExamEngineService } from '../services/api';

const Generate = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Idle, 1: Processing, 2: Done
  const [options, setOptions] = useState({
    students_per_bench: 1,
    allow_same_branch: 0,
    allow_same_year: 0
  });

  const handleGenerate = async () => {
    setLoading(true);
    setStep(1);
    try {
      // Backend expects session_name and rules at top level or flattened
      const res = await ExamEngineService.generate({ 
        session_name: 'Main Exam 2026',
        ...options 
      });
      if (res.data.success) {
        setStep(2);
      }
    } catch (err) {
      alert('Generation Failed: Ensure C-Algorithms are compiled properly.');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          background: 'var(--primary)', 
          color: 'white', 
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Zap size={32} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Optimized Exam Engine</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Configure and run automated seating and faculty allocator.</p>
      </header>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="stat-card">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <Settings2 size={20} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            Algorithmic Rules
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem' }}>General Configuration</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>Students per Bench</span>
                  <select 
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    value={options.students_per_bench}
                    onChange={(e) => setOptions({...options, students_per_bench: parseInt(e.target.value)})}
                  >
                    <option value="1">One Student</option>
                    <option value="2">Two Students</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem' }}>Collision Check</span>
                  <span className="badge" style={{ background: '#ecfdf5', color: '#059669' }}>Active</span>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem' }}>Interleaving Strategy</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={!options.allow_same_branch} 
                    onChange={(e) => setOptions({...options, allow_same_branch: e.target.checked ? 0 : 1})}
                  />
                  Avoid adjacent Same Branch
                </label>
                <label style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={!options.allow_same_year} 
                    onChange={(e) => setOptions({...options, allow_same_year: e.target.checked ? 0 : 1})}
                  />
                  Avoid adjacent Same Year
                </label>
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius)', 
          padding: '2rem',
          textAlign: 'center' 
        }}>
          {step === 0 && (
            <button 
              className="btn btn-primary" 
              onClick={handleGenerate}
              style={{ padding: '15px 40px', fontSize: '1.1rem', margin: '0 auto' }}
            >
              Run Seating Computation
            </button>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-brand)', color: 'var(--text-main)' }}>Generating Optimal Seating Arrangement...</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Applying branch interleaving and collision avoidance constraints</div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: '#059669', marginBottom: '10px' }}>
                <CheckCircle2 size={48} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>Optimization Successful!</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The seating arrangement and teacher duties have been calculated.</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(0)} className="btn" style={{ border: '1px solid var(--border)', background: 'white' }}>Reset Engine</button>
                <button className="btn btn-primary">View Final Plan</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generate;
