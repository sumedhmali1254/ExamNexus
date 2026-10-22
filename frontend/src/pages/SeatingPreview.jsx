import React, { useEffect, useState } from 'react';
import { 
  Eye, RefreshCw, ChevronDown, ChevronRight, 
  Users, Building2, Info, Calendar, History, Clock, Trash2, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { ExamEngineService } from '../services/api';

const SeatingPreview = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [preview, setPreview] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherAllocations, setTeacherAllocations] = useState([]);

  const handleDeleteSession = async () => {
    try {
      await ExamEngineService.deleteSession(selectedSession);
      window.location.reload();
    } catch (err) {
      alert("Failed to delete session");
    }
  };

  const loadPreview = async (sessionId) => {
    if (!sessionId) return;
    // Ensure sessionId is a string or number, not containing a colon
    const cleanId = String(sessionId).replace(':', '');
    setSelectedSession(cleanId);
    try {
      const res = await ExamEngineService.getPreview(cleanId);
      setPreview(res.data.data);
      setSessionInfo(res.data.session);
    } catch (err) { console.error(err); }

    try {
      const tacRes = await ExamEngineService.getTeacherAllocation(cleanId);
      setTeacherAllocations(tacRes.data.data || []);
    } catch (err) { console.error("Failed loading teacher allocation", err); }
  };

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const res = await ExamEngineService.getSessions();
        const completed = (res.data.data || [])
          .filter(s => s.status === 'completed')
          .sort((a, b) => b.id - a.id); // Latest first
        
        setSessions(completed);
        
        if (completed.length > 0) {
          await loadPreview(completed[0].id);
        }
      } catch (err) { 
        console.error(err); 
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  // Group assignments by room
  const roomGroups = {};
  preview.forEach(a => {
    if (!roomGroups[a.room_id]) {
      roomGroups[a.room_id] = {
        room_number: a.room_number,
        num_rows: a.num_rows,
        num_columns: a.num_columns,
        seats: []
      };
    }
    roomGroups[a.room_id].seats.push(a);
  });

  const totalSeated = preview.length;
  const totalRooms = Object.keys(roomGroups).length;

  const cardStyle = {
    background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem'
  };

  if (loading) return (
    <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Retrieving seating data...</p>
    </div>
  );

  return (
    <div className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Seating Preview</h1>
          <p style={{ color: 'var(--text-muted)' }}>Visual distribution of candidates across examination halls.</p>
        </div>
        
        {sessions.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              style={{ 
                padding: '10px 20px', background: 'white', border: '1.5px solid var(--border)', 
                borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                cursor: 'pointer', transition: 'all 0.2s ease', color: showHistory ? 'var(--primary)' : 'inherit'
              }}
              className="hover-bg"
            >
              <History size={18} />
              {selectedSession ? `Session #${selectedSession}` : 'Session Registry'}
              <ChevronDown size={16} />
            </button>
            
            {showHistory && (
              <>
                <div onClick={() => setShowHistory(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} />
                <div style={{ 
                  position: 'absolute', top: '120%', right: 0, width: '280px', background: 'white', 
                  borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border)',
                  zIndex: 1000, overflow: 'hidden', padding: '8px'
                }}>
                  <div style={{ padding: '10px 12px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Execution History
                  </div>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {sessions.map((s, i) => (
                    <div 
                      key={s.id} 
                      onClick={() => {
                        loadPreview(s.id);
                        setShowHistory(false);
                      }}
                      style={{ 
                        padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease',
                        background: selectedSession === s.id ? 'var(--primary-lighter)' : 'transparent',
                        border: selectedSession === s.id ? '1px solid rgba(79, 70, 229, 0.25)' : '1px solid transparent'
                      }}
                      className="hover-bg"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{s.session_name || `Session #${s.id}`}</span>
                        {i === 0 && <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontWeight: 800 }}>LATEST</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(s.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          Generated at {new Date(s.timestamp || s.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}
          </div>
        )}
      </header>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '8rem 2rem', background: 'white', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <div style={{ width: 80, height: 80, background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#cbd5e1' }}>
            <Eye size={40} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>No Seating Generated</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
            It looks like you haven't generated any seating arrangements yet. Head over to the <strong>Exam Engine</strong> to orchestrate your first session.
          </p>
        </div>
      ) : (
        <>
          {/* Comprehensive Session Configuration dashboard */}
          {selectedSession && sessionInfo && (
            (() => {
              const rules = typeof sessionInfo.applied_rules === 'string' ? JSON.parse(sessionInfo.applied_rules) : sessionInfo.applied_rules;
              return (
              <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, background: 'var(--primary)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {rules?.Exam || `Session #${sessionInfo.id}`}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{rules?.Domain || 'Core Domain'}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(sessionInfo.exam_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Workflow Metadata</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Generated at {new Date(sessionInfo.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                      <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>ID Reference: CMD-{sessionInfo.id}</div>
                    </div>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', 
                        background: '#fff1f2', color: '#e11d48', border: '1.5px solid #fecaca', 
                        borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, 
                        cursor: 'pointer', transition: 'all 0.2s ease', alignSelf: 'center'
                      }}
                      className="hover-scale"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Population & Target</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#94a3b8', minWidth: '80px' }}>Years:</span> {rules?.Years || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#94a3b8', minWidth: '80px' }}>Dept(s):</span> 
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                          {rules?.Departments && rules.Departments !== 'N/A' 
                            ? rules.Departments 
                            : [...new Set(preview.map(a => a.branch))].join(', ') || 'N/A'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#94a3b8', minWidth: '80px' }}>Window:</span> {sessionInfo.start_time} - {sessionInfo.end_time}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seating Constraints Applied</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {rules ? (
                        (() => {
                          const ruleMapper = {
                            'room_alloc_mode': 'Room Filling',
                            'roll_preference': 'Seat Ordering',
                            'seats_per_bench': 'Capacity / Bench',
                            'max_depts_per_room': 'Max Depts / Room',
                            'max_years_per_room': 'Max Years / Room',
                            'same_dept_adjacent': 'Side-by-side (Dept)',
                            'same_year_adjacent': 'Side-by-side (Year)',
                            'same_dept_same_bench': 'Same Bench (Dept)',
                            'same_year_same_bench': 'Same Bench (Year)',
                            'same_div_same_bench': 'Same Bench (Div)'
                          };
                          
                          const valueMapper = {
                            'fill_full': 'Fill Rooms Fully',
                            'spread': 'Distribute Evenly',
                            'no_preference': 'Maximum Randomized',
                            'sequential': 'Roll No Sequence',
                            'same_div_order': 'Roll No Sequence'
                          };

                          return Object.entries(rules)
                            .filter(([k]) => ruleMapper[k] || !['Domain', 'Exam', 'Years', 'Departments', 'roll_preference', 'id'].includes(k))
                            .map(([k, v]) => {
                              const label = ruleMapper[k] || k.replace(/_/g, ' ');
                              const displayValue = valueMapper[v] || (typeof v === 'boolean' || v === 0 || v === 1 ? (v ? 'Restricted' : 'Allowed') : v);
                              const isNegative = displayValue === 'Allowed' || displayValue === 'Disabled';

                              // Don't show rules that are currently "Allowed" (inactive) to keep the UI clean
                              if (displayValue === 'Allowed') return null;

                              return (
                                <div key={k} style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: '#94a3b8' }}>{label}:</span>
                                  <span style={{ color: isNegative ? '#94a3b8' : '#059669', marginLeft: '6px' }}>{displayValue}</span>
                                </div>
                              );
                            })
                            .filter(Boolean); // Clear the null entries
                        })()
                      ) : (
                        <div style={{ gridColumn: 'span 2', fontSize: '0.8rem', color: '#cbd5e1', fontStyle: 'italic' }}>Historical session data unavailable</div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
                  {[
                    { label: 'Students Seated', value: totalSeated, icon: <Users size={18} />, color: '#059669' },
                    { label: 'Rooms Utilized', value: totalRooms, icon: <Building2 size={18} />, color: '#3b82f6' },
                    { label: 'Density Index', value: totalRooms > 0 ? `${Math.round((totalSeated / (Object.values(roomGroups).reduce((s, r) => s + r.num_rows * r.num_columns * 2, 0) || 1)) * 100)}%` : '0%', icon: <Info size={18} />, color: '#8b5cf6' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: s.color + '08', borderRadius: '12px', border: `1px solid ${s.color}15` }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'white', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>{s.icon}</div>
                      <div><div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div><div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#334155' }}>{s.value}</div></div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })()
          )}

          {/* Room Grids */}
          {Object.entries(roomGroups).map(([roomId, room]) => {
            const isExpanded = expandedRoom === roomId;
            const totalBenches = room.num_rows * room.num_columns;

            const benchMap = {};
            room.seats.forEach(s => {
              if (!benchMap[s.bench_number]) benchMap[s.bench_number] = {};
              benchMap[s.bench_number][s.seat_position] = s;
            });

            const displayRoomName = room.room_number.replace(/^(hall\s+)+/i, 'Hall ');
            const allocatedTeachers = teacherAllocations.filter(t => t.room_id == roomId);

            return (
              <div key={roomId} style={cardStyle}>
                <div onClick={() => setExpandedRoom(expandedRoom === roomId ? null : roomId)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ minWidth: 46, height: 46, padding: '0 8px', borderRadius: '12px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.65rem', lineHeight: 1.1, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)', fontFamily: 'var(--font-brand)' }}>
                      {displayRoomName.includes(' ') ? (
                        <>
                          <div>{displayRoomName.split(' ')[0]}</div>
                          <div style={{ fontSize: '0.85rem' }}>{displayRoomName.split(' ').slice(1).join(' ')}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.9rem' }}>{displayRoomName}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontFamily: 'var(--font-brand)', fontSize: '1.05rem', color: 'var(--text-main)' }}>{displayRoomName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{room.seats.length} / {totalBenches * 2} seats occupied</div>
                    </div>
                    
                    {allocatedTeachers.length > 0 && (
                      <div style={{ marginLeft: '20px', padding: '5px 12px', background: 'var(--primary-light)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} color="var(--primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                          Invigilator: {allocatedTeachers.map(t => t.teacher_name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  {isExpanded ? <ChevronDown size={20} color="var(--text-muted)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: `repeat(${room.num_columns}, 1fr)`, gap: '14px' }}>
                    {Array.from({ length: totalBenches }, (_, i) => i + 1).map(benchNum => {
                      const left = benchMap[benchNum]?.[1];
                      const right = benchMap[benchNum]?.[2];

                      return (
                        <div key={benchNum} style={{
                          border: '1.5px solid var(--border)', borderRadius: '14px', padding: '12px', background: '#f8fafc',
                          position: 'relative', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)'
                        }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center', fontFamily: 'var(--font-brand)', letterSpacing: '0.04em' }}>
                            BENCH {benchNum}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[left, right].map((seat, si) => (
                              <div key={si}
                                onMouseEnter={() => seat && setHoveredSeat(seat)}
                                onMouseLeave={() => setHoveredSeat(null)}
                                style={{
                                  padding: '10px 4px', borderRadius: '10px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700,
                                  background: seat ? 'var(--primary-light)' : '#ffffff',
                                  color: seat ? 'var(--primary)' : '#cbd5e1',
                                  border: `1.5px solid ${seat ? 'rgba(79, 70, 229, 0.3)' : 'var(--border)'}`,
                                  cursor: seat ? 'pointer' : 'default', position: 'relative',
                                  minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontFamily: 'var(--font-mono)',
                                  boxShadow: seat ? '0 2px 6px rgba(79, 70, 229, 0.12)' : 'none',
                                  transition: 'all 0.2s ease'
                                }}>
                                {seat ? seat.roll_number : '—'}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Hover Tooltip */}
      {hoveredSeat && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'white', borderRadius: '16px', padding: '16px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1.5px solid var(--primary)',
          minWidth: '240px', animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px', color: 'var(--primary)' }}>{hoveredSeat.student_name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', fontSize: '0.85rem', color: '#64748b' }}>
            <div>Roll: <strong style={{color: '#334155'}}>{hoveredSeat.roll_number}</strong></div>
            <div>Department: <strong style={{color: '#334155'}}>{hoveredSeat.branch}</strong></div>
            <div>Year: <strong style={{color: '#334155'}}>{hoveredSeat.year}</strong></div>
            <div>Division: <strong style={{color: '#334155'}}>{hoveredSeat.division}</strong></div>
          </div>
        </div>
      )}

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, backdropFilter: 'blur(4px)' }} onClick={() => setShowDeleteModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'white', padding: '2rem', borderRadius: '24px', zIndex: 10001,
            width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #fecaca', textAlign: 'center'
          }}>
            <div style={{ width: 64, height: 64, background: '#fff1f2', color: '#e11d48', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Delete Session?</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Are you completely sure you want to delete this session? This will remove all seating assignments and teacher allocations permanently. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteModal(false)} className="hover-bg" style={{ flex: 1, padding: '12px', background: 'white', border: '1.5px solid #cbd5e1', borderRadius: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }}>
                Cancel
              </button>
              <button onClick={handleDeleteSession} style={{ flex: 1, padding: '12px', background: '#e11d48', border: 'none', borderRadius: '12px', fontWeight: 700, color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                Delete Permanently
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SeatingPreview;

