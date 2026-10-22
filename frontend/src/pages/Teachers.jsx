import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  AlertCircle, 
  CheckCircle,
  Info,
  CheckSquare, 
  Square,
  Globe,
  BookOpen,
  UserCheck,
  UserCircle
} from 'lucide-react';
import { TeacherService, SettingsService } from '../services/api';
import Modal from '../components/Modal';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [hierarchy, setHierarchy] = useState({
    domains: [],
    programs: [],
    departments: []
  });
  
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  
  const [selectedDomain, setSelectedDomain] = useState(null);

  const [formData, setFormData] = useState({ name: '', department: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      const [resT, resD, resP, resDept] = await Promise.all([
        TeacherService.getAll(),
        SettingsService.getDomains(),
        SettingsService.getPrograms(),
        SettingsService.getDepartments()
      ]);
      setTeachers(resT.data.data);
      setHierarchy({
        domains: resD.data.data || [],
        programs: resP.data.data || [],
        departments: resDept.data.data || []
      });
    } catch (err) {
      console.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setFilterDept('All');
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDept === 'All' || (t.department && t.department.includes(filterDept));
    return matchesSearch && matchesDept;
  });

  const totalPages = Math.ceil(filteredTeachers.length / pageSize);
  const paginatedTeachers = filteredTeachers.slice(
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
      if (formData.department.length === 0) {
        showToast("Select at least one department", 'error');
        return;
      }
      const payload = {
        name: formData.name,
        department: formData.department.join(', '),
        domain: selectedDomain ? selectedDomain.name : 'Unknown'
      };
      if (editingTeacher) {
        await TeacherService.update(editingTeacher.id, payload);
        showToast('Faculty profile updated successfully');
      } else {
        await TeacherService.create(payload);
        showToast('New faculty member registered');
      }
      setIsModalOpen(false);
      setEditingTeacher(null);
      setFormData({ name: '', department: [] });
      fetchData();
    } catch (err) {
      showToast('Action failed: Institutional policy conflict', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await TeacherService.delete(teacherToDelete);
      showToast('Faculty member records archived', 'info');
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Failed to remove faculty member', 'error');
    }
  };

  const toggleDept = (deptName) => {
    setFormData(prev => ({
      ...prev,
      department: prev.department.includes(deptName) 
        ? prev.department.filter(d => d !== deptName)
        : [...prev.department, deptName]
    }));
  };

  // Departments belonging to selected domain
  const availableDeptsTable = hierarchy.departments.filter(d => {
    if (!selectedDomain) return true;
    const prog = hierarchy.programs.find(p => p.id === d.program_id);
    return prog && prog.domain_id === selectedDomain.id;
  });

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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Faculty Registry</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage faculty profiles and cross-departmental assignments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { 
          setEditingTeacher(null); 
          setSelectedDomain(hierarchy.domains[0] || null);
          setFormData({ name: '', department: [] });
          setIsModalOpen(true); 
        }}>
          <Plus size={18} />
          Register Faculty
        </button>
      </header>

      {/* Primary Action Bar */}
      <div style={{ 
        display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'white', padding: '1rem', 
        borderRadius: '16px', border: '1px solid var(--border)', alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" placeholder="Search by faculty name..." 
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
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="filter-row">
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Department Filter</label>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <option value="All">All Departments</option>
              {hierarchy.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
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

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '100px' }}>ID</th>
              <th>Faculty Name</th>
              <th>Domain</th>
              <th>Assigned Departments</th>
              <th style={{ textAlign: 'right', width: '110px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTeachers.map((t) => (
              <tr key={t.id}>
                <td className="cell-mono">T{2000 + t.id}</td>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td><span className="badge" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #e0f2fe' }}>{t.domain || 'N/A'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {t.department ? t.department.split(', ').map(d => (
                       <span key={d} className="badge badge-branch">{d}</span>
                    )) : 'Unassigned'}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { 
                      setEditingTeacher(t); 
                      setFormData({ name: t.name, department: t.department.split(', ') }); 
                      const dom = hierarchy.domains.find(d => d.name === t.domain);
                      if (dom) setSelectedDomain(dom);
                      setIsModalOpen(true); 
                    }} className="btn btn-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><Edit2 size={14} /></button>
                    <button onClick={() => { setTeacherToDelete(t.id); setIsDeleteModalOpen(true); }} className="btn btn-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTeachers.length === 0 && (
              <tr>
                <td colSpan="5" className="table-empty-td">
                  <div className="table-empty-content">
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <UserCheck size={28} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', fontFamily: 'var(--font-brand)' }}>No Faculty Registered</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.6 }}>
                      No faculty members match your active filter. Click <strong>+ Register Faculty</strong> to onboard new invigilators into the institutional roster.
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
              Showing <b>{(currentPage - 1) * pageSize + 1}</b> to <b>{Math.min(currentPage * pageSize, filteredTeachers.length)}</b> of <b>{filteredTeachers.length}</b> records
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

      {/* Registration Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTeacher ? 'Modify Faculty Details' : 'Register Faculty Member'}
        subtitle="Manage professor profile and assigned invigilation departments."
        maxWidth="580px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Name Field */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Faculty Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span className="badge badge-branch" style={{ fontSize: '0.7rem' }}>
                ID: {editingTeacher ? `T${2000 + editingTeacher.id}` : `T${2000 + (teachers.length + 1)}`}
              </span>
            </div>
            <input 
              type="text" 
              required 
              placeholder="e.g. Dr. Alan Turing"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%' }}
            />
          </div>

          {/* Domain Selection */}
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Academic Domain <span style={{ color: '#ef4444' }}>*</span>
            </label>
            {hierarchy.domains.length > 0 ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {hierarchy.domains.map(dom => (
                  <button 
                    type="button"
                    key={dom.id} 
                    onClick={() => setSelectedDomain(dom)}
                    style={{ 
                      padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700,
                      background: selectedDomain?.id === dom.id ? 'var(--primary-gradient)' : '#ffffff',
                      color: selectedDomain?.id === dom.id ? '#ffffff' : 'var(--text-secondary)',
                      border: `1.5px solid ${selectedDomain?.id === dom.id ? 'transparent' : 'var(--border)'}`,
                      transition: 'all 0.2s ease',
                      boxShadow: selectedDomain?.id === dom.id ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
                    }}
                  >
                    {dom.name}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No domains found. Please configure domains in Institutional Control (Settings).
              </div>
            )}
          </div>

          {/* Department Selection */}
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Department Assignments <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ 
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '180px', overflowY: 'auto',
              padding: '12px', border: '1.5px solid var(--border)', borderRadius: '14px', background: '#f8fafc'
            }}>
              {(() => {
                const availableDepts = hierarchy.departments.filter(d => {
                  if (!selectedDomain) return true;
                  const prog = hierarchy.programs.find(p => p.id === d.program_id);
                  return prog && prog.domain_id === selectedDomain.id;
                });

                if (availableDepts.length === 0) {
                  return (
                    <div style={{ gridColumn: 'span 2', padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      No departments available for this domain.
                    </div>
                  );
                }

                return availableDepts.map(dept => {
                  const isChecked = formData.department.includes(dept.name);
                  return (
                    <div 
                      key={dept.id} 
                      onClick={() => toggleDept(dept.name)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                        background: isChecked ? 'var(--primary-light)' : '#ffffff',
                        border: `1.5px solid ${isChecked ? 'rgba(79, 70, 229, 0.3)' : 'var(--border)'}`,
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.15s ease'
                      }}>
                      {isChecked ? <CheckSquare size={16} color="var(--primary)" /> : <Square size={16} color="#cbd5e1" />}
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isChecked ? 'var(--primary)' : 'var(--text-main)' }}>
                        {dept.name}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Action Buttons */}
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
              {editingTeacher ? <Edit2 size={16} /> : <Plus size={16} />}
              <span>{editingTeacher ? 'Save Changes' : 'Confirm Registration'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Remove Faculty Member"
        subtitle="This profile will be marked as inactive and unassigned from halls."
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
            Are you sure you want to remove this faculty record?
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
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Teachers;
