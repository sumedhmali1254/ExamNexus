import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Info,
  BookOpen,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { StudentService, SettingsService } from '../services/api';
import Modal from '../components/Modal';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [hierarchy, setHierarchy] = useState({ domains: [], programs: [], departments: [] });
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterDiv, setFilterDiv] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '', roll_number: '', domain_id: '', program_id: '', branch_id: '', year: '1', division: 'A'
  });

  const getDeptPrefix = (deptName) => {
    if (!deptName) return 'COMP';
    const clean = deptName.trim().toUpperCase();
    
    // Explicit known department keywords
    if (clean.includes('COMPUTER') || clean.includes('COMP')) return 'COMP';
    if (clean.includes('INFORMATION') || clean.includes('IT')) return 'IT';
    if (clean.includes('MECHANICAL') || clean.includes('MECH')) return 'MECH';
    if (clean.includes('CIVIL')) return 'CIVIL';
    if (clean.includes('ELECTRONIC') || clean.includes('ECE') || clean.includes('EXTC')) return 'ECE';
    if (clean.includes('ELECTRICAL') || clean.includes('EEE')) return 'ELEC';
    if (clean.includes('ARTIFICIAL') || clean.includes('AI') || clean.includes('DATA')) return 'AIDS';
    if (clean.includes('BIOMED') || clean.includes('BIO')) return 'BIO';
    if (clean.includes('AEROSPACE') || clean.includes('AERO')) return 'AERO';
    if (clean.includes('MANAGEMENT') || clean.includes('MBA') || clean.includes('BBA')) return 'MGMT';

    // Single token <= 5 chars (e.g. CSE, IT, MECH, AIDS, MCA)
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 1 && words[0].length <= 5) {
      return words[0];
    }
    // Acronym for multi-word
    if (words.length > 1) {
      const acronym = words.map(w => w[0]).filter(c => /[A-Z0-9]/.test(c)).join('');
      if (acronym.length >= 2 && acronym.length <= 5) return acronym;
    }
    // Default fallback: first 4 alphanumeric characters
    return clean.replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'COMP';
  };

  const computeRollNumber = (deptId) => {
    const targetDeptId = deptId || formData.branch_id;
    const selectedDept = hierarchy.departments.find(d => String(d.id) === String(targetDeptId));
    const prefix = getDeptPrefix(selectedDept ? selectedDept.name : '');
    
    // Count existing students matching this department or prefix
    const countInDept = students.filter(s => {
      if (selectedDept && s.branch && s.branch.toLowerCase() === selectedDept.name.toLowerCase()) return true;
      if (s.roll_number && s.roll_number.toUpperCase().startsWith(prefix)) return true;
      return false;
    }).length;

    // Next sequential number formatted as 4 digits, e.g. COMP0001, COMP0064
    const nextNum = String(countInDept + 1).padStart(4, '0');
    return `${prefix}${nextNum}`;
  };

  const fetchHierarchy = async () => {
    try {
      const [resD, resP, resDept] = await Promise.all([
        SettingsService.getDomains(),
        SettingsService.getPrograms(),
        SettingsService.getDepartments()
      ]);
      setHierarchy({
        domains: resD.data.data || [],
        programs: resP.data.data || [],
        departments: resDept.data.data || []
      });
    } catch (err) { console.error(err); }
  };

  const performCSearch = async () => {
    setLoading(true);
    try {
      const res = await StudentService.search({
        query: search,
        program: filterProgram,
        division: filterDiv
      });
      setStudents(res.data.data);
      setCurrentPage(1); // Reset to first page on search
    } catch (err) {
      console.error('C Search Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  // Trigger C-Search on any filter change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performCSearch();
    }, 400); // 400ms debounce
    return () => clearTimeout(delayDebounceFn);
  }, [search, filterProgram, filterDiv]);

  const handleResetFilters = () => {
    setSearch('');
    setFilterProgram('All');
    setFilterDiv('All');
  };

  const totalPages = Math.ceil(students.length / pageSize);
  const paginatedStudents = students.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedDomain = hierarchy.domains.find(d => String(d.id) === String(formData.domain_id));
      const selectedProgram = hierarchy.programs.find(p => String(p.id) === String(formData.program_id));
      const selectedDept = hierarchy.departments.find(d => String(d.id) === String(formData.branch_id));
      
      const payload = { 
        name: formData.name,
        roll_number: formData.roll_number,
        year: formData.year,
        division: formData.division,
        branch: selectedDept ? selectedDept.name : 'Unknown',
        domain: selectedDomain ? selectedDomain.name : 'Unknown',
        program: selectedProgram ? selectedProgram.name : 'Unknown'
      };
      
      if (editingStudent) {
        await StudentService.update(editingStudent.id, payload);
        showToast('Candidate profile updated successfully');
      } else {
        await StudentService.create(payload);
        showToast('New candidate enrolled in registry');
      }
      setIsModalOpen(false);
      performCSearch();
    } catch (err) { 
      showToast('Action failed: Institutional policy conflict', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await StudentService.delete(studentToDelete);
      showToast('Candidate records purged from database', 'info');
      setIsDeleteModalOpen(false);
      performCSearch();
    } catch (err) {
      showToast('Failed to delete candidate', 'error');
    }
  };

  const filteredPrograms = hierarchy.programs.filter(p => formData.domain_id && p.domain_id === parseInt(formData.domain_id));
  const filteredDepts = hierarchy.departments.filter(d => formData.program_id && d.program_id === parseInt(formData.program_id));

  return (
    <div className="fade-in">
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={20} color="#059669" /> : toast.type === 'error' ? <AlertCircle size={20} color="#ef4444" /> : <Info size={20} color="var(--primary)" />}
            {toast.msg}
          </div>
        </div>
      )}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Student Registry</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time institutional candidate search and directory management.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { 
          setEditingStudent(null); 
          setFormData({ name: '', roll_number: '', domain_id: '', program_id: '', branch_id: '', year: '1', division: 'A' });
          setIsModalOpen(true); 
        }}>
          <Plus size={18} /> Register Student
        </button>
      </header>

      <div style={{ 
        display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'white', padding: '1rem', 
        borderRadius: '16px', border: '1px solid var(--border)', alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" placeholder="Search by name or roll..." 
            style={{ width: '100%', padding: '12px 12px 12px 42px', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '0.95rem' }}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn" 
            style={{ 
              background: showFilters ? 'var(--primary)' : 'white', 
              color: showFilters ? 'white' : 'var(--text-main)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Filter size={18} />
            Filters
          </button>
          
          <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />
          
          <select 
            value={pageSize} 
            onChange={e => setPageSize(Number(e.target.value))}
            className="btn"
            style={{ border: '1px solid var(--border)', padding: '0 1rem' }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="filter-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Program</label>
              <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <option value="All">All Programs</option>
                {hierarchy.programs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Division</label>
              <select value={filterDiv} onChange={e => setFilterDiv(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <option value="All">All Divisions</option>
                {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>Div {d}</option>)}
              </select>
            </div>
          </div>
          <button 
            onClick={handleResetFilters}
            className="btn" 
            style={{ alignSelf: 'flex-end', height: '42px', padding: '0 1.5rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      <div className="table-container" style={{ position: 'relative' }}>
        {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, color: 'var(--primary)' }}>Searching candidate registry...</div>}
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th style={{ width: '100px' }}>Roll No</th>
              <th>Full Name</th>
              <th>Domain</th>
              <th>Program</th>
              <th>Department</th>
              <th style={{ width: '60px' }}>Year</th>
              <th style={{ width: '60px' }}>Div</th>
              <th style={{ textAlign: 'right', width: '110px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((s) => (
              <tr key={s.id}>
                <td className="cell-mono">S{1000 + s.id}</td>
                <td className="cell-mono" style={{ color: 'var(--text-main)' }}>{s.roll_number}</td>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td><span className="badge" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #e0f2fe' }}>{s.domain || 'N/A'}</span></td>
                <td><span className="badge" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ede9fe' }}>{s.program || 'N/A'}</span></td>
                <td><span className="badge badge-branch">{s.branch}</span></td>
                <td><span className="badge badge-year">{s.year}yr</span></td>
                <td style={{ fontWeight: 700 }}>{s.division}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { 
                      const dom = hierarchy.domains.find(d => d.name === s.domain);
                      const prog = hierarchy.programs.find(p => p.name === s.program);
                      const dept = hierarchy.departments.find(d => d.name === s.branch);
                      setEditingStudent(s); 
                      setFormData({
                        ...s, 
                        domain_id: dom ? dom.id.toString() : '', 
                        program_id: prog ? prog.id.toString() : '', 
                        branch_id: dept ? dept.id.toString() : ''
                      }); 
                      setIsModalOpen(true); 
                    }} className="btn btn-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><Edit2 size={14} /></button>
                    <button onClick={() => { setStudentToDelete(s.id); setIsDeleteModalOpen(true); }} className="btn btn-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && !loading && (
              <tr>
                <td colSpan="9" className="table-empty-td">
                  <div className="table-empty-content">
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <GraduationCap size={28} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', fontFamily: 'var(--font-brand)' }}>No Candidates Registered</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.6 }}>
                      No student records match your active query or program filter. Click <strong>+ Register Student</strong> to enroll new candidates into the registry.
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer - Only show when records exceed page size */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing <b>{(currentPage - 1) * pageSize + 1}</b> to <b>{Math.min(currentPage * pageSize, students.length)}</b> of <b>{students.length}</b> records
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                &lt;
              </button>
              
              {(() => {
                const pages = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 4) pages.push('...');
                  
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  
                  for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) pages.push(i);
                  }
                  
                  if (currentPage < totalPages - 3) pages.push('...');
                  if (!pages.includes(totalPages)) pages.push(totalPages);
                }
                
                return pages.map((p, i) => (
                  p === '...' ? (
                    <span key={`dots-${i}`} className="pagination-dots">...</span>
                  ) : (
                    <button 
                      key={p}
                      className={`pagination-btn ${currentPage === p ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  )
                ));
              })()}

              <button 
                className="pagination-btn" 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Enrollment / Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingStudent ? 'Modify Candidate' : 'Enroll New Candidate'}
        subtitle="Specify candidate academic details, branch, and division enrollment."
        maxWidth="580px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. Candidate Full Name */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Candidate Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span className="badge badge-branch" style={{ fontSize: '0.7rem' }}>
                System ID: {editingStudent ? `S${1000 + editingStudent.id}` : `S${1000 + (students.length + 1)}`}
              </span>
            </div>
            <input 
              type="text" 
              required 
              placeholder="e.g. Johnathan Smith"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          {/* 2. Row: Domain & Program */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Domain <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                required 
                value={formData.domain_id} 
                onChange={(e) => setFormData({...formData, domain_id: e.target.value, program_id: '', branch_id: '', roll_number: ''})} 
                style={{ width: '100%' }}
              >
                <option value="">Select Domain</option>
                {hierarchy.domains.length > 0 ? (
                  hierarchy.domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                ) : (
                  <option value="" disabled>No domains found (Add in Settings)</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Program <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                required 
                disabled={!formData.domain_id} 
                value={formData.program_id} 
                onChange={(e) => setFormData({...formData, program_id: e.target.value, branch_id: '', roll_number: ''})} 
                style={{ width: '100%' }}
              >
                {!formData.domain_id ? (
                  <option value="" disabled>Select domain first</option>
                ) : filteredPrograms.length > 0 ? (
                  <>
                    <option value="">Select Program</option>
                    {filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </>
                ) : (
                  <option value="" disabled>No programs found for domain</option>
                )}
              </select>
            </div>
          </div>

          {/* 3. Row: Department, Year & Division */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Department <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                required 
                disabled={!formData.program_id} 
                value={formData.branch_id} 
                onChange={(e) => {
                  const deptId = e.target.value;
                  const autoRoll = computeRollNumber(deptId);
                  setFormData(prev => ({
                    ...prev,
                    branch_id: deptId,
                    roll_number: (!editingStudent || !prev.roll_number) ? autoRoll : prev.roll_number
                  }));
                }} 
                style={{ width: '100%' }}
              >
                {!formData.program_id ? (
                  <option value="" disabled>Select program first</option>
                ) : filteredDepts.length > 0 ? (
                  <>
                    <option value="">Select Department</option>
                    {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </>
                ) : (
                  <option value="" disabled>No departments in program</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Year <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                value={formData.year} 
                onChange={(e) => setFormData({...formData, year: e.target.value})} 
                style={{ width: '100%' }}
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Div <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="text" 
                required 
                maxLength={2}
                placeholder="A" 
                value={formData.division} 
                onChange={(e) => setFormData({...formData, division: e.target.value.toUpperCase()})} 
                style={{ width: '100%', textAlign: 'center', fontWeight: 700 }}
              />
            </div>
          </div>

          {/* 4. Academic ID / Roll Number (LAST FIELD IN FORM) */}
          <div className="form-group" style={{ 
            background: 'var(--primary-lighter)', 
            padding: '1rem', 
            borderRadius: '14px', 
            border: '1.5px solid rgba(79, 70, 229, 0.2)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> Academic ID / Roll Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {formData.branch_id && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Dept Prefix: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {getDeptPrefix(hierarchy.departments.find(d => String(d.id) === String(formData.branch_id))?.name)}
                  </strong>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                required 
                placeholder={formData.branch_id ? `e.g. ${getDeptPrefix(hierarchy.departments.find(d => String(d.id) === String(formData.branch_id))?.name)}0064` : "Select department above to auto-generate"}
                value={formData.roll_number} 
                onChange={e => setFormData({...formData, roll_number: e.target.value.toUpperCase()})}
                style={{ 
                  flex: 1, 
                  fontFamily: 'var(--font-mono)', 
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  letterSpacing: '0.04em',
                  background: '#ffffff',
                  borderColor: formData.roll_number ? 'var(--primary)' : 'var(--border)'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const autoRoll = computeRollNumber(formData.branch_id);
                  setFormData({ ...formData, roll_number: autoRoll });
                }}
                className="btn btn-primary"
                style={{
                  padding: '0 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '10px'
                }}
                title="Auto Generate Roll Number with Department Prefix"
              >
                <Sparkles size={14} /> Auto Generate
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Department-based automated roll prefix (e.g. <code>COMP0064</code> for Computer Engineering).
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px', 
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            marginTop: '0.5rem'
          }}>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              {editingStudent ? <Edit2 size={16} /> : <Plus size={16} />}
              <span>{editingStudent ? 'Save Changes' : 'Confirm Enrollment'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Candidate Record"
        subtitle="This action is permanent and will remove the candidate from all exam allocations."
        maxWidth="440px"
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ 
            width: 54, 
            height: 54, 
            background: '#fff1f2', 
            color: '#e11d48', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.25rem' 
          }}>
            <Trash2 size={24} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Are you sure you want to remove this candidate record from the registry?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1 }} 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn" 
              style={{ flex: 1, background: '#e11d48', color: '#ffffff', border: 'none' }} 
              onClick={handleDelete}
            >
              Delete Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Students;
