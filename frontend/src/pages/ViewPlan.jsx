import React, { useEffect, useState } from 'react';
import { ExamEngineService } from '../services/api';
import { Download, Printer, Filter, Map, Layers } from 'lucide-react';

const ViewPlan = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await ExamEngineService.getSessions();
        const sessions = res.data.data || [];
        // If there are completed sessions, load the latest preview
        const completed = sessions.filter(s => s.status === 'completed');
        if (completed.length > 0) {
          const latest = completed[0];
          const preview = await ExamEngineService.getPreview(latest.id);
          setData(preview.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch plan');
      }
    };
    fetchPlan();
  }, []);


  return (
    <div className="fade-in">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Computed Seating Plan</h1>
          <p style={{ color: 'var(--text-muted)' }}>Finalized classroom arrangements and candidate distribution.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <Printer size={18} />
            Print
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </header>

      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '1.5rem',
        background: 'white',
        padding: '1rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', gap: '1rem' }}>
          <div style={{ 
            padding: '8px 16px', 
            background: '#f8fafc', 
            border: '1px solid var(--border)', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Map size={16} />
            Halls: <strong>Active</strong>
          </div>
          <div style={{ 
            padding: '8px 16px', 
            background: '#f8fafc', 
            border: '1px solid var(--border)', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Layers size={16} />
            Mode: <strong>Smart Interleave</strong>
          </div>
        </div>
        <button className="btn" style={{ background: 'white', border: '1px solid var(--border)' }}>
          <Filter size={18} />
          View Filter
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Hall No.</th>
              <th>Bench</th>
              <th>Seat</th>
              <th>Candidate Name</th>
              <th>Roll Number</th>
              <th>Branch</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.room_number}</td>
                <td>Bench {row.bench_number}</td>
                <td>
                  <span className="badge" style={{ background: row.seat_position === 1 ? '#e0f2fe' : '#f0f9ff', color: '#0369a1' }}>
                    {row.seat_position === 1 ? 'Left' : 'Right'}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{row.student_name}</td>
                <td>{row.roll_number}</td>
                <td><span className="badge badge-branch">{row.branch}</span></td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  No plan generated yet. Go to 'Exam Engine' to start computation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewPlan;
