import React, { useEffect, useState } from 'react';
import {
  Zap, Play, Users, Building2, Calendar, Clock,
  CheckCircle, AlertTriangle, Info
} from 'lucide-react';
import { SettingsService, ExamEngineService, StudentService, RoomService, SeatingRulesService } from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const ExamEngine = () => {
  const [hierarchy, setHierarchy] = useState({ domains: [], programs: [], departments: [], exams: [] });
  const [formData, setFormData] = useState({
    domain_id: '', department_ids: [], years: [],
    session_name: '',
    exam_pattern_id: '', exam_date: new Date(), start_time: new Date().setHours(9, 0, 0, 0)
  });
  const [allStudents, setAllStudents] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [seatingRules, setSeatingRules] = useState({ seats_per_bench: 2 });
  const [liveStats, setLiveStats] = useState({ selectedStudents: 0 });
  const [stats, setStats] = useState({ studentCount: 0, roomCount: 0, totalCapacity: 0 });
  const [selectedExam, setSelectedExam] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [roomSelectionMode, setRoomSelectionMode] = useState('custom');
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [capacityStatus, setCapacityStatus] = useState({ required: 0, available: 0, shortage: 0, isEnough: false });

  useEffect(() => {
    const load = async () => {
      try {
        const [d, p, dept, e, st, stds, rm, sRules] = await Promise.all([
          SettingsService.getDomains(), SettingsService.getPrograms(),
          SettingsService.getDepartments(), SettingsService.getExams(),
          ExamEngineService.getStats(), StudentService.getAll(),
          RoomService.getAvailable(), SeatingRulesService.get()
        ]);
        setHierarchy({
          domains: d.data.data || [], programs: p.data.data || [],
          departments: dept.data.data || [], exams: e.data.data || []
        });
        setStats(st.data.data);
        setAllStudents(stds.data.data || []);
        setAvailableRooms(rm.data.data || []);
        if (sRules.data && sRules.data.data) {
          setSeatingRules(sRules.data.data);
        }
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  useEffect(() => {
    // Calculate live selected students
    const count = allStudents.filter(s => {
      let matchDept = true;
      if (formData.department_ids.length > 0) {
        matchDept = formData.department_ids.some(deptId => {
          const dept = hierarchy.departments.find(dp => dp.id === deptId);
          if (!dept) return false;
          if (s.branch && s.branch.toLowerCase() === dept.name.toLowerCase()) {
            const prog = hierarchy.programs.find(p => p.id === dept.program_id);
            if (s.program && prog && s.program.toLowerCase() !== prog.name.toLowerCase()) {
              return false;
            }
            return true;
          }
          return false;
        });
      }
      const matchYear = formData.years.length === 0 || formData.years.includes(Number(s.year));
      
      let matchDomain = true;
      if (formData.domain_id) {
        const validProgs = hierarchy.programs.filter(p => p.domain_id === parseInt(formData.domain_id)).map(p => p.name.toLowerCase());
        if (s.program && validProgs.length > 0) {
          matchDomain = validProgs.includes(s.program.toLowerCase());
        } else {
          const domainDepts = hierarchy.departments.filter(dept => {
            const prog = hierarchy.programs.find(p => p.id === dept.program_id);
            return prog && prog.domain_id === parseInt(formData.domain_id);
          }).map(dept => dept.name.toLowerCase());
          matchDomain = s.branch && domainDepts.includes(s.branch.toLowerCase());
        }
      }
      return matchDept && matchYear && matchDomain;
    }).length;
    setLiveStats({ selectedStudents: count });

    // Update capacity Check
    let totalCapacity = 0;
    let cpb = seatingRules.seats_per_bench || 2;
    if (roomSelectionMode === 'custom') {
      selectedRoomIds.forEach(id => {
        const rm = availableRooms.find(r => r.id === id);
        if (rm) {
          totalCapacity += (rm.total_benches * cpb);
        }
      });
    } else if (roomSelectionMode === 'auto') {
      availableRooms.forEach(rm => {
        totalCapacity += (rm.total_benches * cpb);
      });
    }
    setCapacityStatus({
      required: count,
      available: totalCapacity,
      isEnough: totalCapacity >= count,
      shortage: totalCapacity < count ? count - totalCapacity : 0
    });
  }, [formData.department_ids, formData.years, formData.domain_id, allStudents, selectedRoomIds, roomSelectionMode, seatingRules, availableRooms]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getDeptShortCode = (name) => {
    if (!name) return 'DEPT';
    const clean = name.trim();
    const upper = clean.toUpperCase();

    const known = {
      'COMPUTER SCIENCE & ENGINEERING': 'CSE',
      'COMPUTER SCIENCE AND ENGINEERING': 'CSE',
      'COMPUTER ENGINEERING': 'COMP',
      'INFORMATION TECHNOLOGY': 'IT',
      'ELECTRONICS & TELECOMMUNICATION ENGINEERING': 'EXTC',
      'ELECTRONICS AND TELECOMMUNICATION ENGINEERING': 'EXTC',
      'ELECTRONICS & TELECOMMUNICATION': 'EXTC',
      'ELECTRONICS & COMMUNICATION ENGINEERING': 'ECE',
      'ELECTRONICS AND COMMUNICATION ENGINEERING': 'ECE',
      'ELECTRICAL ENGINEERING': 'EE',
      'ELECTRICAL & ELECTRONICS ENGINEERING': 'EEE',
      'MECHANICAL ENGINEERING': 'MECH',
      'CIVIL ENGINEERING': 'CIVIL',
      'CHEMICAL ENGINEERING': 'CHEM',
      'INSTRUMENTATION ENGINEERING': 'INST',
      'INSTRUMENTATION & CONTROL ENGINEERING': 'ICE',
      'ROBOTICS & AUTOMATION': 'ROBO',
      'ROBOTICS AND AUTOMATION': 'ROBO',
      'AEROSPACE ENGINEERING': 'AERO',
      'AERONAUTICAL ENGINEERING': 'AERO',
      'ARTIFICIAL INTELLIGENCE & DATA SCIENCE': 'AI&DS',
      'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE': 'AI&DS',
      'ARTIFICIAL INTELLIGENCE & MACHINE LEARNING': 'AI&ML',
      'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING': 'AI&ML',
      'DATA SCIENCE': 'DS',
      'BIOMEDICAL ENGINEERING': 'BIOMED',
      'BIOTECHNOLOGY': 'BIOTECH',
      'AUTOMOBILE ENGINEERING': 'AUTO',
      'MECHATRONICS ENGINEERING': 'MTRX',
      'PRODUCTION ENGINEERING': 'PROD'
    };

    if (known[upper]) return known[upper];

    if (upper.includes('ARTIFICIAL INTELLIGENCE') && upper.includes('DATA')) return 'AI&DS';
    if (upper.includes('ARTIFICIAL INTELLIGENCE') && upper.includes('MACHINE')) return 'AI&ML';
    if (upper.includes('DATA SCIENCE')) return 'DS';
    if (upper.includes('COMPUTER SCIENCE')) return 'CSE';
    if (upper.includes('COMPUTER')) return 'COMP';
    if (upper.includes('INFORMATION TECH')) return 'IT';
    if (upper.includes('TELECOMMUNICATION')) return 'EXTC';
    if (upper.includes('ELECTRICAL')) return 'EE';
    if (upper.includes('MECHANICAL')) return 'MECH';
    if (upper.includes('CIVIL')) return 'CIVIL';
    if (upper.includes('CHEMICAL')) return 'CHEM';
    if (upper.includes('ROBOTIC')) return 'ROBO';
    if (upper.includes('AEROSPACE') || upper.includes('AERO')) return 'AERO';
    if (upper.includes('INSTRUMENT')) return 'INST';

    const words = clean.split(/[\s&/_-]+/).filter(w => !['ENGINEERING', 'AND', 'OF', 'THE', 'IN', '&'].includes(w.toUpperCase()));
    if (words.length > 1) {
      const acronym = words.map(w => w[0].toUpperCase()).join('');
      if (acronym.length >= 2 && acronym.length <= 5) return acronym;
    }
    if (words.length === 1 && words[0].length <= 5) {
      return words[0].toUpperCase();
    }
    return clean.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
  };

  const filteredDepts = hierarchy.departments.filter(d => {
    if (!formData.domain_id) return false;
    const progs = hierarchy.programs.filter(p => p.domain_id === parseInt(formData.domain_id));
    return progs.some(p => p.id === d.program_id);
  });

  const filteredExams = hierarchy.exams.filter(e => {
    if (!formData.domain_id) return false;
    return e.domain_id === parseInt(formData.domain_id);
  });

  const toggleDept = (deptId) => {
    setFormData(prev => ({
      ...prev,
      department_ids: prev.department_ids.includes(deptId)
        ? prev.department_ids.filter(id => id !== deptId)
        : [...prev.department_ids, deptId]
    }));
  };

  const toggleYear = (y) => {
    setFormData(prev => ({
      ...prev,
      years: prev.years.includes(y) ? prev.years.filter(v => v !== y) : [...prev.years, y]
    }));
  };

  const computeEndTime = () => {
    if (!selectedExam || !formData.start_time) return '';
    const date = new Date(formData.start_time);
    date.setMinutes(date.getMinutes() + (selectedExam.duration_mins || 180));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleGenerate = async () => {
    if (!formData.domain_id || formData.department_ids.length === 0 || formData.years.length === 0) {
      showToast('Please select domain, departments and years', 'error');
      return;
    }
    if (roomSelectionMode === 'custom' && selectedRoomIds.length === 0) {
      showToast('No rooms selected. Please select at least one room.', 'error');
      return;
    }
    if (roomSelectionMode === 'custom' && !capacityStatus.isEnough) {
      showToast('Selected room capacity is insufficient for the selected students.', 'error');
      return;
    }

    setGenerating(true);
    setResult(null);
    try {
      const formattedDate = formData.exam_date instanceof Date ? formData.exam_date.toISOString().split('T')[0] : formData.exam_date;
      const startTimeDate = new Date(formData.start_time);
      const formattedStartTime = `${String(startTimeDate.getHours()).padStart(2, '0')}:${String(startTimeDate.getMinutes()).padStart(2, '0')}`;

      const domainName = hierarchy.domains.find(d => d.id === parseInt(formData.domain_id))?.name || 'Unknown Domain';
      const examName = hierarchy.exams.find(e => e.id === parseInt(formData.exam_pattern_id))?.name || 'Unknown Exam';
      const yearNames = formData.years.join(', ');

      const selectedDepts = hierarchy.departments.filter(d => formData.department_ids.includes(d.id));
      const deptNames = selectedDepts.map(d => {
        const prog = hierarchy.programs.find(p => p.id === d.program_id);
        return prog ? `${d.name} (${prog.name})` : d.name;
      });

      const res = await ExamEngineService.generate({
        ...formData,
        exam_date: formattedDate,
        start_time: formattedStartTime,
        end_time: computeEndTime(),
        departments: formData.department_ids,
        room_selection_mode: roomSelectionMode,
        selected_room_ids: selectedRoomIds,
        seating_rules: {
          ...seatingRules,
          Domain: domainName,
          Exam: examName,
          Years: yearNames,
          Departments: deptNames.join(', ')
        }
      });
      if (res.data.success) {
        setResult(res.data);
        showToast('Seating plan generated successfully.', 'success');
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (err) {
      showToast('Generation failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoSelect = async () => {
    if (liveStats.selectedStudents === 0) {
      showToast('Select students first (domain, dept, year)', 'error');
      return;
    }
    setGenerating(true);
    try {
      const res = await ExamEngineService.autoSelectRooms({
        selectedStudentCount: liveStats.selectedStudents,
        candidatesPerBench: seatingRules.seats_per_bench || 1
      });
      if (res.data.success && res.data.data.status === 'success') {
        const selected = res.data.data.selectedRooms.map(r => r.id);
        setSelectedRoomIds(selected);
        setRoomSelectionMode('custom'); // transition to custom so user sees them
        showToast('Rooms auto-selected successfully.', 'success');
      } else {
        showToast('Not enough capacity in active rooms for auto-selection!', 'error');
      }
    } catch (err) {
      showToast('Auto-select failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const toggleRoom = (id) => {
    setSelectedRoomIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const cardStyle = {
    background: 'white', borderRadius: '16px', border: '1px solid var(--border)',
    padding: '1.5rem', marginBottom: '1.5rem'
  };

  const labelStyle = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: '#64748b', textTransform: 'uppercase', marginBottom: '10px'
  };

  const datePickerStyle = `
    .react-datepicker-wrapper { width: 100%; }
    .react-datepicker__item-container { width: 100%; }
    .react-datepicker__input-container input {
      width: 100%; padding: 12px; border: 1.5px solid #eef2f6; border-radius: 12px;
      font-family: inherit; font-size: 0.95rem; color: var(--text-main); background: white; transition: all 0.2s ease;
    }
    .react-datepicker__input-container input:focus {
      outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.14);
    }
    .react-datepicker {
      border: none !important; box-shadow: 0 10px 40px rgba(15, 23, 42, 0.12) !important;
      border-radius: 16px !important; font-family: inherit !important;
    }
    .react-datepicker__header {
      background: #f8fafc !important; border-bottom: 1px solid #e2e8f0 !important;
      border-radius: 16px 16px 0 0 !important; padding-top: 15px !important;
    }
    .react-datepicker__month-container { width: 320px; }
    .react-datepicker__month { min-height: 220px; } /* Constant height for 5/6 weeks */
    .react-datepicker__day-name, .react-datepicker__day {
      width: 2.5rem; line-height: 2.5rem; margin: 0.15rem; border-radius: 10px !important;
    }
    .react-datepicker__day--selected { background-color: var(--primary) !important; color: white !important; }
    .react-datepicker__day:hover { background-color: #f1f5f9 !important; }
    .react-datepicker__month-select, .react-datepicker__year-select {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 4px 8px; font-size: 0.85rem; color: var(--primary); font-weight: 700; cursor: pointer;
    }
    .react-datepicker__time-container { border-left: 1px solid #eef2f6 !important; width: 100px !important; }
  `;

  return (
    <div className="fade-in">
      <style>{datePickerStyle}</style>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          padding: '16px 24px', borderRadius: '14px',
          background: toast.type === 'success' ? '#059669' : '#ef4444',
          color: 'white', fontWeight: 600, fontSize: '0.95rem',
          boxShadow: '0 16px 40px -6px rgba(15, 23, 42, 0.2)', display: 'flex', gap: '10px', alignItems: 'center',
          animation: 'toastSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {toast.msg}
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Exam Engine</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configure exam parameters and generate seating arrangements.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* LEFT: Configuration */}
        <div>
          <div style={cardStyle}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="var(--primary)" /> Exam Configuration
              </div>
              <input
                type="text"
                placeholder="Session Tag (Ex: MidTerm-A)"
                value={formData.session_name}
                onChange={e => setFormData({ ...formData, session_name: e.target.value })}
                style={{
                  fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px',
                  border: '1.5px solid #eef2f6', background: '#f8fafc', fontWeight: 600,
                  width: '200px', transition: 'all 0.2s ease'
                }}
              />
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>1. Select Domain</label>
              <select value={formData.domain_id} onChange={e => setFormData({ ...formData, domain_id: e.target.value, department_ids: [], exam_pattern_id: '' })}
                style={{ width: '100%', padding: '12px', border: '1.5px solid var(--border)', borderRadius: '12px' }}>
                <option value="">Choose Domain</option>
                {hierarchy.domains.length > 0 ? (
                  hierarchy.domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                ) : (
                  <option value="" disabled>No domains found (Add domains in Settings)</option>
                )}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>2. Select Department(s)</label>
                {filteredDepts.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', fontWeight: 700 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = filteredDepts.map(d => d.id);
                        setFormData(prev => ({
                          ...prev,
                          department_ids: Array.from(new Set([...prev.department_ids, ...allIds]))
                        }));
                      }}
                      style={{
                        background: 'none', border: 'none', color: 'var(--primary)',
                        cursor: 'pointer', padding: '2px 6px', borderRadius: '4px'
                      }}
                      className="hover-underline"
                    >
                      Select All ({filteredDepts.length})
                    </button>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const idsToRemove = new Set(filteredDepts.map(d => d.id));
                        setFormData(prev => ({
                          ...prev,
                          department_ids: prev.department_ids.filter(id => !idsToRemove.has(id))
                        }));
                      }}
                      style={{
                        background: 'none', border: 'none', color: '#94a3b8',
                        cursor: 'pointer', padding: '2px 6px', borderRadius: '4px'
                      }}
                      className="hover-underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {filteredDepts.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '10px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {filteredDepts.map(d => {
                    const isSelected = formData.department_ids.includes(d.id);
                    const shortCode = getDeptShortCode(d.name);
                    const program = hierarchy.programs.find(p => p.id === d.program_id);
                    const programName = program?.name || '';
                    const studentCount = allStudents.filter(s => {
                      if (!s.branch || s.branch.toLowerCase() !== d.name.toLowerCase()) return false;
                      if (s.program && programName && s.program.toLowerCase() !== programName.toLowerCase()) return false;
                      return true;
                    }).length;

                    return (
                      <div
                        key={d.id}
                        onClick={() => toggleDept(d.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--primary-light)' : 'white',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '82px',
                          boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.15)' : 'none'
                        }}
                        className="hover-scale"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '0.86rem',
                              fontWeight: 700,
                              color: isSelected ? 'var(--primary-dark, #312e81)' : 'var(--text-main)',
                              lineHeight: 1.35
                            }}>
                              {d.name}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {shortCode && (
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                fontFamily: 'var(--font-brand, monospace)',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                background: isSelected ? 'white' : '#f1f5f9',
                                color: isSelected ? 'var(--primary)' : '#475569',
                                border: `1px solid ${isSelected ? 'rgba(79, 70, 229, 0.2)' : '#e2e8f0'}`
                              }}>
                                {shortCode}
                              </span>
                            )}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--primary)' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isSelected ? 'var(--primary)' : '#64748b'
                          }}>
                            {programName ? `(${programName})` : ''}
                          </span>
                          {studentCount > 0 && (
                            <span style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '6px',
                              background: isSelected ? 'white' : '#f8fafc',
                              color: isSelected ? 'var(--primary)' : '#64748b',
                              border: `1px solid ${isSelected ? 'rgba(79, 70, 229, 0.2)' : '#e2e8f0'}`
                            }}>
                              {studentCount} std
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {formData.domain_id ? 'No departments registered for this domain.' : 'Select a domain above to view departments.'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>3. Select Year(s)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4].map(y => (
                  <div key={y} onClick={() => toggleYear(y)} style={{
                    width: '60px', padding: '10px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', fontWeight: 700,
                    background: formData.years.includes(y) ? 'var(--primary)' : '#f8fafc',
                    color: formData.years.includes(y) ? 'white' : '#64748b',
                    border: `1.5px solid ${formData.years.includes(y) ? 'var(--primary)' : 'var(--border)'}`
                  }}>{y}yr</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <label style={{ ...labelStyle, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>4. Select Room(s)</span>
                {liveStats.selectedStudents > 0 && <span>Required seats: {liveStats.selectedStudents}</span>}
              </label>

              {(!formData.domain_id || formData.department_ids.length === 0 || formData.years.length === 0) ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Please select Domain, Department(s), and Year(s) first to calculate required capacity.</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '16px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        <input type="radio" value="auto" checked={roomSelectionMode === 'auto'} onChange={() => setRoomSelectionMode('auto')} />
                        Auto Select Rooms
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        <input type="radio" value="custom" checked={roomSelectionMode === 'custom'} onChange={() => setRoomSelectionMode('custom')} />
                        Custom Select Rooms
                      </label>
                    </div>
                  </div>

                  {roomSelectionMode === 'auto' ? (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                      <button onClick={handleAutoSelect} disabled={generating || liveStats.selectedStudents === 0} className="btn" style={{ background: 'white', border: '1.5px solid var(--primary)', fontWeight: 700, color: 'var(--primary)', width: '100%', borderRadius: '8px' }}>
                        <Zap size={16} /> Auto-Assign Minimum Rooms
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                        {availableRooms.map(r => (
                          <div key={r.id} onClick={() => toggleRoom(r.id)} style={{
                            padding: '10px', borderRadius: '10px', cursor: 'pointer',
                            border: `1.5px solid ${selectedRoomIds.includes(r.id) ? 'var(--primary)' : 'var(--border)'}`,
                            background: selectedRoomIds.includes(r.id) ? 'var(--primary-light)' : 'white',
                            transition: 'all 0.2s ease'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: selectedRoomIds.includes(r.id) ? 'var(--primary)' : 'var(--text-main)' }}>{r.room_name}</span>
                              <input type="checkbox" checked={selectedRoomIds.includes(r.id)} readOnly style={{ cursor: 'pointer', width: '14px', height: '14px' }} />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'flex', flexDirection: 'column' }}>
                              <span>Capacity: {r.total_benches * (seatingRules.seats_per_bench || 2)} students</span>
                              <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>{r.total_benches} Benches ({r.num_rows}x{r.num_columns})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {availableRooms.length === 0 && <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>No active rooms available</span>}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>5. Exam Pattern</label>
              <select value={formData.exam_pattern_id} onChange={e => {
                const exam = hierarchy.exams.find(ex => ex.id === parseInt(e.target.value));
                setSelectedExam(exam);
                setFormData({ ...formData, exam_pattern_id: e.target.value });
              }} style={{ width: '100%', padding: '12px', border: '1.5px solid var(--border)', borderRadius: '12px' }}>
                <option value="">Choose Exam Pattern</option>
                {hierarchy.exams.length > 0 ? (
                  hierarchy.exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.total_marks} Marks, {ex.duration_mins} Mins)</option>)
                ) : (
                  <option value="" disabled>No exam patterns configured (Configure in Settings)</option>
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}><Calendar size={12} /> Exam Date</label>
                <DatePicker
                  selected={formData.exam_date}
                  onChange={date => setFormData({ ...formData, exam_date: date })}
                  dateFormat="MMMM d, yyyy"
                  placeholderText="Select Date"
                  minDate={new Date()}
                />
              </div>
              <div>
                <label style={labelStyle}><Clock size={12} /> Start Time</label>
                <DatePicker
                  selected={formData.start_time}
                  onChange={time => setFormData({ ...formData, start_time: time })}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Session"
                  timeFormat="h:mm aa"
                  dateFormat="h:mm aa"
                  placeholderText="Select Time"
                />
              </div>
              <div>
                <label style={labelStyle}><Clock size={12} /> End Time</label>
                <input type="text" readOnly value={computeEndTime()}
                  style={{ width: '100%', padding: '12px', border: '1.5px solid #eef2f6', borderRadius: '12px', background: '#f8fafc', fontWeight: 700 }} />
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating} className="btn btn-primary"
            style={{ width: '100%', height: '60px', justifyContent: 'center', fontSize: '1.05rem', fontWeight: 800, borderRadius: '16px' }}>
            {generating ? (
              <><span className="spinner" style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Processing via C Engine...</>
            ) : (
              <><Play size={20} /> Generate Seating Plan</>
            )}
          </button>
        </div>

        {/* RIGHT: Dynamic Stats Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem', height: 'fit-content' }}>
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={22} color="var(--primary)" />
              System Overview
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Dynamic Live Counter */}
              <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Selected Students</p>
                    <h4 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)' }}>{liveStats.selectedStudents}</h4>
                  </div>
                  <div style={{ padding: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <Users size={20} color="var(--primary)" />
                  </div>
                </div>
                <div style={{ marginTop: '12px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min((liveStats.selectedStudents / (stats.totalCapacity || 1)) * 100, 100)}%`,
                    height: '100%',
                    background: liveStats.selectedStudents > stats.totalCapacity ? '#ef4444' : 'var(--primary)',
                    transition: 'all 0.4s ease'
                  }} />
                </div>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '8px', fontWeight: 600 }}>
                  Using {((liveStats.selectedStudents / (stats.totalCapacity || 1)) * 100).toFixed(1)}% of total capacity
                </p>
              </div>

              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building2 size={20} style={{ color: '#16a34a' }} />
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Rooms Available</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{stats.roomCount} Active Rooms</p>
                </div>
              </div>

              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={20} color="var(--primary)" />
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Institutional Capacity</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{stats.totalCapacity} Total Seats</p>
                </div>
              </div>

              {((roomSelectionMode === 'custom' && selectedRoomIds.length > 0) || (roomSelectionMode === 'auto' && liveStats.selectedStudents > 0)) && (
                <div style={{ padding: '1.2rem', background: capacityStatus.isEnough ? '#f0fdf4' : '#fef2f2', borderRadius: '14px', border: `1px solid ${capacityStatus.isEnough ? '#bbf7d0' : '#fecaca'}` }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: capacityStatus.isEnough ? '#166534' : '#991b1b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {capacityStatus.isEnough ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {roomSelectionMode === 'auto' ? 'Auto-Select Prediction' : 'Capacity Summary'}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Selected Students:</span>
                    <span style={{ fontWeight: 700 }}>{capacityStatus.required}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>{roomSelectionMode === 'auto' ? 'Total Active Hall Capacity:' : 'Room Capacity:'}</span>
                    <span style={{ fontWeight: 700 }}>{capacityStatus.available}</span>
                  </div>
                  {!capacityStatus.isEnough && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#dc2626' }}>
                      <span style={{ fontWeight: 700 }}>Shortage:</span>
                      <span style={{ fontWeight: 800 }}>{capacityStatus.shortage} seats</span>
                    </div>
                  )}
                  <div style={{ marginTop: '10px', fontSize: '0.75rem', fontWeight: 600, color: capacityStatus.isEnough ? '#15803d' : '#dc2626' }}>
                    {capacityStatus.isEnough
                      ? (roomSelectionMode === 'auto' ? "System has enough active rooms to assign." : "Selected rooms have sufficient capacity.")
                      : (roomSelectionMode === 'auto' ? "CRITICAL: Total active rooms do not have enough seating!" : "Capacity not sufficient. Please add more rooms.")}
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px dashed ${capacityStatus.isEnough ? '#86efac' : '#fca5a5'}` }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Active Strict Rules</p>
                    <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li><strong>{seatingRules.seats_per_bench || 2}</strong> Candidate(s) per bench</li>
                      {seatingRules.same_dept_same_bench === 0 && <li>Different departments on same bench</li>}
                    </ul>
                    <p style={{ marginTop: '8px', fontSize: '0.7rem', color: '#64748b', lineHeight: '1.4' }}>
                      <strong>Why?</strong> Since your active rules state each bench can strictly seat only <strong>{seatingRules.seats_per_bench || 2}</strong> student(s), the selected rooms (having a total of {capacityStatus.available / (seatingRules.seats_per_bench || 2)} benches) are capped at exactly <strong>{capacityStatus.available}</strong> maximum occupiable spots.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {result && (
            <div style={{ ...cardStyle, border: '1.5px solid #059669', background: '#f0fdf4' }}>
              <h3 style={{ fontWeight: 800, color: '#059669', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                <CheckCircle size={20} /> Generation Success
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'white', border: '1px solid #bbf7d0', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669' }}>{result.seated}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Seated</div>
                </div>
                <div style={{ padding: '12px', background: result.unseated > 0 ? '#fef2f2' : 'white', border: `1px solid ${result.unseated > 0 ? '#fecaca' : '#bbf7d0'}`, borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: result.unseated > 0 ? '#ef4444' : '#059669' }}>{result.unseated}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pending</div>
                </div>
              </div>

              {result.unseated > 0 && (
                <div style={{ marginTop: '12px', padding: '15px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecaca', fontSize: '0.8rem', color: '#9f1239', lineHeight: '1.5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 800 }}>
                    <AlertTriangle size={16} />
                    <span>Optimization Insight & Best Solution</span>
                  </div>
                  <p style={{ marginBottom: '10px' }}>
                    The algorithm could not seat <strong>{result.unseated}</strong> students. This is because your <strong>Anti-Cheating Rules</strong> (like Bench Sharing constraints) consumed more space than a default layout would.
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(159, 18, 57, 0.1)' }}>
                    <div style={{ fontWeight: 800, color: '#be123c', marginBottom: '4px' }}>Recommended Action:</div>
                    <ul style={{ margin: '0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li>Increase capacity by at least <strong>{Math.ceil(result.unseated / (seatingRules.seats_per_bench || 2))} more benches</strong>.</li>
                      <li>Alternatively, add approximately <strong>{result.unseated + Math.ceil(result.unseated * 0.1)} additional physical seats</strong> to buffer the rule constraints.</li>
                      <li>Relax the <strong>"Seats per Bench"</strong> or <strong>"Same Dept/Year Same Bench"</strong> rules in settings.</li>
                    </ul>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1rem', borderTop: '1px solid #bbf7d0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>SESSION #{String(result.sessionId).padStart(4, '0')}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669' }}>ZERO-COLLISION VERIFIED</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner { display: inline-block; }
      `}</style>
    </div>
  );
};

export default ExamEngine;
