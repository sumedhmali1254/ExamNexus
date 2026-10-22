import React, { useEffect, useState } from 'react';
import { 
  UserCheck, Users, Building2, RefreshCw, 
  CheckCircle, AlertTriangle, Calendar 
} from 'lucide-react';
import { ExamEngineService } from '../services/api';

const TeacherAllocation = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [allocating, setAllocating] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await ExamEngineService.getSessions();
        const completed = (res.data.data || [])
          .filter(s => s.status === 'completed')
          .sort((a, b) => b.id - a.id);
        
        setSessions(completed);
        if (completed.length > 0) {
          loadAllocations(completed[0].id);
        }
      } catch (err) { console.error(err); }
    };
    loadSessions();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAllocations = async (sessionId) => {
    setSelectedSession(sessionId);
    setCurrentPage(1);
    try {
      const res = await ExamEngineService.getTeacherAllocation(sessionId);
      setAllocations(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleAllocate = async () => {
    if (!selectedSession) return;
    setAllocating(true);
    try {
      const res = await ExamEngineService.allocateTeachers({ session_id: selectedSession });
      if (res.data.success) {
        showToast(res.data.message);
        loadAllocations(selectedSession);
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (err) {
      showToast('Allocation failed', 'error');
    } finally {
      setAllocating(false);
    }
  };

  const totalPages = Math.ceil(allocations.length / pageSize);
  const paginatedAllocations = allocations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fade-in">
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          padding: '14px 22px', borderRadius: '14px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', fontWeight: 700, boxShadow: '0 16px 40px -6px rgba(15, 23, 42, 0.2)',
          display: 'flex', gap: '10px', alignItems: 'center', animation: 'toastSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {toast.msg}
        </div>
      )}

      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-brand)', letterSpacing: '-0.02em' }}>
            Faculty Invigilation Roster
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
            Assign faculty invigilators to examination halls across scheduled sessions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={selectedSession || ''} 
            onChange={e => loadAllocations(e.target.value)}
            style={{ 
              padding: '10px 16px', 
              border: '1.5px solid var(--border)', 
              borderRadius: '12px', 
              fontWeight: 600,
              minWidth: '260px'
            }}
          >
            {sessions.length > 0 ? (
              sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.session_name || `Session #${s.id}`} — {new Date(s.exam_date).toLocaleDateString()}
                </option>
              ))
            ) : (
              <option value="" disabled>No completed exam sessions available</option>
            )}
          </select>

          <button 
            type="button"
            onClick={handleAllocate} 
            disabled={!selectedSession || allocating} 
            className="btn btn-primary"
            style={{ padding: '11px 20px' }}
          >
            {allocating ? <RefreshCw size={17} className="spinner" /> : <UserCheck size={17} />}
            <span>{allocating ? 'Allocating...' : 'Auto Allocate Invigilators'}</span>
          </button>
        </div>
      </header>

      {allocations.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>#</th>
                <th>Room / Venue</th>
                <th>Assigned Faculty</th>
                <th>Department</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Duty Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAllocations.map((a, i) => (
                <tr key={a.id || i}>
                  <td className="cell-mono" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    {(currentPage - 1) * pageSize + i + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="var(--primary)" />
                      <span style={{ fontWeight: 800, fontFamily: 'var(--font-brand)', color: 'var(--text-main)' }}>
                        {a.room_number.toLowerCase().includes('hall') ? a.room_number : `Hall ${a.room_number}`}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{a.teacher_name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {a.department ? a.department.split(', ').map(d => (
                        <span key={d} className="badge badge-branch">{d}</span>
                      )) : <span style={{ color: 'var(--text-subtle)' }}>N/A</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-success">Assigned</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing <b>{(currentPage - 1) * pageSize + 1}</b> to <b>{Math.min(currentPage * pageSize, allocations.length)}</b> of <b>{allocations.length}</b> room allocations
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-btn" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className="pagination-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      ) : selectedSession ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '5rem 2rem', 
          background: '#ffffff', 
          borderRadius: '20px', 
          border: '1px dashed var(--border)' 
        }}>
          <Users size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>No Faculty Allocated Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Click <strong>"Auto Allocate Invigilators"</strong> to run automated allocation algorithms and pair faculty with halls.
          </p>
          <button 
            type="button"
            onClick={handleAllocate} 
            disabled={allocating} 
            className="btn btn-primary"
          >
            <UserCheck size={17} />
            <span>Auto Allocate Now</span>
          </button>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '5rem 2rem', 
          background: '#ffffff', 
          borderRadius: '20px', 
          border: '1px dashed var(--border)' 
        }}>
          <Calendar size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>Select an Exam Session</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Choose an active completed exam session from the dropdown above to view or generate teacher allocations.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherAllocation;
