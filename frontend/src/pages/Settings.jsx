import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2,
  ChevronRight, 
  Globe, 
  BookOpen, 
  Layers, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { SettingsService } from '../services/api';
import Modal from '../components/Modal';

const Settings = () => {
  const [hierarchy, setHierarchy] = useState({
    domains: [],
    programs: [],
    departments: [],
    exams: []
  });

  const [selection, setSelection] = useState({
    domain: null,
    program: null
  });

  const [modal, setModal] = useState({
    isOpen: false,
    type: '', // domain, program, dept, exam
    title: ''
  });
  const [editingItem, setEditingItem] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: '',
    id: null,
    name: ''
  });

  const [formData, setFormData] = useState({});

  const refreshData = async () => {
    try {
      const fetchDomains = async () => {
        try { const d = await SettingsService.getDomains(); return d.data.data || []; } catch { return []; }
      };
      const fetchPrograms = async () => {
        try { const p = await SettingsService.getPrograms(); return p.data.data || []; } catch { return []; }
      };
      const fetchDepts = async () => {
        try { const dept = await SettingsService.getDepartments(); return dept.data.data || []; } catch { return []; }
      };
      const fetchExams = async () => {
        try { const e = await SettingsService.getExams(); return e.data.data || []; } catch { return []; }
      };

      const [domains, programs, departments, exams] = await Promise.all([
        fetchDomains(), fetchPrograms(), fetchDepts(), fetchExams()
      ]);
      
      setHierarchy({ domains, programs, departments, exams });
    } catch (err) {
      console.error('API connection failed');
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Auto-select first domain on load
  useEffect(() => {
    if (hierarchy.domains.length > 0 && !selection.domain) {
      const firstDomain = hierarchy.domains[0];
      const items = { domain: firstDomain, program: null };
      
      const firstProg = hierarchy.programs.find(p => p.domain_id === firstDomain.id);
      if (firstProg) items.program = firstProg;
      
      setSelection(items);
    }
  }, [hierarchy.domains, hierarchy.programs]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        if (modal.type === 'domain') await SettingsService.updateDomain(editingItem.id, formData);
        if (modal.type === 'program') await SettingsService.updateProgram(editingItem.id, { ...formData, domain_id: selection.domain.id });
        if (modal.type === 'dept') await SettingsService.updateDepartment(editingItem.id, { ...formData, program_id: selection.program.id });
        if (modal.type === 'exam') await SettingsService.updateExam(editingItem.id, { ...formData, domain_id: selection.domain.id });
      } else {
        if (modal.type === 'domain') await SettingsService.createDomain(formData);
        if (modal.type === 'program') await SettingsService.createProgram({ ...formData, domain_id: selection.domain.id });
        if (modal.type === 'dept') await SettingsService.createDepartment({ ...formData, program_id: selection.program.id });
        if (modal.type === 'exam') await SettingsService.createExam({ ...formData, domain_id: selection.domain.id });
      }
      
      setModal({ ...modal, isOpen: false });
      setEditingItem(null);
      setFormData({});
      refreshData();
    } catch (err) {
      alert(editingItem ? 'Failed to update item' : 'Action failed');
    }
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === 'domain') await SettingsService.deleteDomain(deleteModal.id);
      if (deleteModal.type === 'program') await SettingsService.deleteProgram(deleteModal.id);
      if (deleteModal.type === 'dept') await SettingsService.deleteDepartment(deleteModal.id);
      if (deleteModal.type === 'exam') await SettingsService.deleteExam(deleteModal.id);
      
      setDeleteModal({ ...deleteModal, isOpen: false });
      refreshData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredPrograms = hierarchy.programs.filter(p => selection.domain && p.domain_id === selection.domain.id);
  const filteredDepts = hierarchy.departments.filter(d => selection.program && d.program_id === selection.program.id);
  const filteredExams = hierarchy.exams.filter(e => selection.domain && e.domain_id === selection.domain.id);

  const ColumnHeader = ({ index, title }) => (
    <div style={{ 
      padding: '20px', 
      borderBottom: '1px solid #eef2f6', 
      background: 'white',
      borderRight: '1px solid #eef2f6'
    }}>
       <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
         {index}. {title}
       </span>
    </div>
  );

  const Item = ({ active, label, subtitle, onClick, onEdit, onDelete }) => (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', margin: '4px 10px', borderRadius: '14px', cursor: 'pointer',
        background: active ? 'var(--primary-lighter)' : 'transparent',
        border: active ? '1.5px solid rgba(79, 70, 229, 0.25)' : '1.5px solid transparent',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? '0 4px 12px rgba(79, 70, 229, 0.08)' : 'none',
        position: 'relative'
      }}
      className="item-row"
    >
      {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: 'var(--primary)', borderRadius: '0 4px 4px 0' }} />}
      <div style={{ flex: 1, paddingRight: '8px' }}>
        <div style={{ fontWeight: active ? 700 : 600, fontSize: '0.92rem', color: active ? 'var(--primary)' : 'var(--text-primary)' }}>{label}</div>
        {subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
          style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          className="edit-btn"
          title="Edit item"
        >
          <Edit2 size={15} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}
          style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          className="trash-btn"
          title="Delete item"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ 
        flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', 
        background: 'white', borderRadius: '24px', border: '1px solid #eef2f6', overflow: 'hidden',
        boxShadow: 'var(--shadow-md)'
      }}>
        
        {/* COLUMN 1: DOMAINS */}
        <div style={{ borderRight: '1px solid #eef2f6', display: 'flex', flexDirection: 'column' }}>
          <ColumnHeader index={1} title="Domains" />
          <div className="scroll-custom" style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {hierarchy.domains.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No domains defined yet.</div>
            ) : (
              hierarchy.domains.map(d => (
                <Item 
                  key={d.id} 
                  active={selection.domain?.id === d.id}
                  label={d.name}
                  onClick={() => setSelection({ domain: d, program: null })}
                  onEdit={() => {
                    setEditingItem(d);
                    setFormData({ name: d.name });
                    setModal({ isOpen: true, type: 'domain', title: 'Edit Domain' });
                  }}
                  onDelete={() => setDeleteModal({ isOpen: true, type: 'domain', id: d.id, name: d.name })}
                />
              ))
            )}
            <div style={{ padding: '12px 20px' }}>
              <button className="add-link" onClick={() => { setEditingItem(null); setFormData({}); setModal({ isOpen: true, type: 'domain', title: 'Add New Domain' }); }}>
                <Plus size={16} /> Add Domain
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: PROGRAMS */}
        <div style={{ borderRight: '1px solid #eef2f6', display: 'flex', flexDirection: 'column', background: !selection.domain ? '#fafafa' : 'white' }}>
          <ColumnHeader index={2} title="Programs" />
          <div className="scroll-custom" style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {!selection.domain ? (
               <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Select a domain to view programs</div>
            ) : (
              <>
                {filteredPrograms.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No programs in this domain.</div>
                ) : (
                  filteredPrograms.map(p => (
                    <Item 
                      key={p.id} 
                      active={selection.program?.id === p.id}
                      label={p.name}
                      onClick={() => setSelection({ ...selection, program: p })}
                      onEdit={() => {
                        setEditingItem(p);
                        setFormData({ name: p.name, duration_years: p.duration_years || 4 });
                        setModal({ isOpen: true, type: 'program', title: 'Edit Program' });
                      }}
                      onDelete={() => setDeleteModal({ isOpen: true, type: 'program', id: p.id, name: p.name })}
                    />
                  ))
                )}
                <div style={{ padding: '12px 20px' }}>
                  <button className="add-link" onClick={() => { setEditingItem(null); setFormData({}); setModal({ isOpen: true, type: 'program', title: 'Add Program' }); }}>
                    <Plus size={16} /> Add Program
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* COLUMN 3: DEPARTMENTS */}
        <div style={{ borderRight: '1px solid #eef2f6', display: 'flex', flexDirection: 'column', background: !selection.program ? '#fafafa' : 'white' }}>
          <ColumnHeader index={3} title="Departments" />
          <div className="scroll-custom" style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {!selection.program ? (
               <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Select a program to view departments</div>
            ) : (
              <>
                {filteredDepts.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No departments in this program.</div>
                ) : (
                  filteredDepts.map(d => (
                    <Item 
                      key={d.id} 
                      label={d.name} 
                      onEdit={() => {
                        setEditingItem(d);
                        setFormData({ name: d.name });
                        setModal({ isOpen: true, type: 'dept', title: 'Edit Department' });
                      }}
                      onDelete={() => setDeleteModal({ isOpen: true, type: 'dept', id: d.id, name: d.name })} 
                    />
                  ))
                )}
                <div style={{ padding: '12px 20px' }}>
                  <button className="add-link" onClick={() => { setEditingItem(null); setFormData({}); setModal({ isOpen: true, type: 'dept', title: 'Add Department' }); }}>
                    <Plus size={16} /> Add Dept
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* COLUMN 4: EXAM PATTERNS */}
        <div style={{ display: 'flex', flexDirection: 'column', background: !selection.domain ? '#fafafa' : 'white' }}>
          <ColumnHeader index={4} title="Exam Patterns" />
          <div className="scroll-custom" style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {!selection.domain ? (
               <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Select a domain to view exam patterns</div>
            ) : (
              <>
                {filteredExams.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No exam patterns configured yet.</div>
                ) : (
                  filteredExams.map(e => (
                    <Item 
                      key={e.id} 
                      label={e.name} 
                      subtitle={`${e.total_marks} Marks • ${e.duration_mins} Min`} 
                      onEdit={() => {
                        setEditingItem(e);
                        setFormData({ name: e.name, total_marks: e.total_marks, duration_mins: e.duration_mins });
                        setModal({ isOpen: true, type: 'exam', title: 'Edit Exam Pattern' });
                      }}
                      onDelete={() => setDeleteModal({ isOpen: true, type: 'exam', id: e.id, name: e.name })}
                    />
                  ))
                )}
                <div style={{ padding: '12px 20px' }}>
                  <button className="add-link" onClick={() => { setEditingItem(null); setFormData({}); setModal({ isOpen: true, type: 'exam', title: 'Add Exam Pattern' }); }}>
                    <Plus size={16} /> Add Pattern
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .item-row:hover {
          background: var(--primary-lighter) !important;
        }
        .item-row:hover .edit-btn {
          color: var(--primary) !important;
        }
        .item-row:hover .trash-btn {
          color: #ef4444 !important;
        }
        .edit-btn:hover {
          background: var(--primary-light) !important;
          color: var(--primary) !important;
        }
        .trash-btn:hover {
          background: #fee2e2 !important;
          color: #ef4444 !important;
        }
        .add-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          background: var(--primary-lighter);
          border: 1px dashed rgba(79, 70, 229, 0.3);
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 10px 14px;
          width: 100%;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .add-link:hover {
          background: var(--primary-light);
          border-color: var(--primary);
        }
        .scroll-custom::-webkit-scrollbar {
          width: 4px;
        }
        .scroll-custom::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>

      {/* Unified Configuration Modal */}
      <Modal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title}>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Identifier / Name
            </label>
            <input 
              type="text" 
              required 
              placeholder={
                modal.type === 'domain' ? "Ex. School of Engineering, Management..." :
                modal.type === 'program' ? "Ex. B.Tech Computer Science, MBA..." :
                modal.type === 'dept' ? "Ex. CSE, Information Science, AI & DS..." :
                "Ex. Midterm Examination, Semester End Exam..."
              }
              className="form-control"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '0.95rem', fontWeight: 600 }}
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {modal.type === 'program' && (
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Duration (Years)
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1,2,3,4,5].map(y => (
                  <div 
                    key={y} 
                    onClick={() => setFormData({...formData, duration_years: y})}
                    style={{ 
                      flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer',
                      border: `1.5px solid ${(formData.duration_years || 4) === y ? 'var(--primary)' : 'var(--border)'}`,
                      background: (formData.duration_years || 4) === y ? 'var(--primary-lighter)' : 'white',
                      fontWeight: 700, 
                      color: (formData.duration_years || 4) === y ? 'var(--primary)' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {y} {y === 1 ? 'Year' : 'Years'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {modal.type === 'exam' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Marks
                </label>
                <input 
                  type="number" 
                  required 
                  value={formData.total_marks || ''} 
                  placeholder="100"
                  className="form-control"
                  onChange={e => setFormData({ ...formData, total_marks: e.target.value })} 
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: '12px', fontSize: '0.95rem' }} 
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Duration (Mins)
                </label>
                <input 
                  type="number" 
                  required 
                  value={formData.duration_mins || ''} 
                  placeholder="180"
                  className="form-control"
                  onChange={e => setFormData({ ...formData, duration_mins: e.target.value })} 
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: '12px', fontSize: '0.95rem' }} 
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => { setModal({ ...modal, isOpen: false }); setEditingItem(null); }} className="btn btn-outline" style={{ flex: 1, padding: '12px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5, padding: '12px', justifyContent: 'center', fontWeight: 700 }}>
              {editingItem ? 'Save Changes' : 'Confirm & Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} title="Confirm Delete">
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Delete "{deleteModal.name}"?</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
            This action will remove the {deleteModal.type} from the institutional registry.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn" style={{ flex: 1, border: '1.5px solid #eef2f6', background: 'white' }} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>Cancel</button>
            <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white', fontWeight: 700 }} onClick={confirmDelete}>Confirm Delete</button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Settings;
