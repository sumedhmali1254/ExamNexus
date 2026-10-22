import React, { useEffect, useState } from 'react';
import { Plus, MapPin, Trash2, Edit2, LayoutGrid, Eye, Building2, CheckCircle2 } from 'lucide-react';
import { RoomService } from '../services/api';
import Modal from '../components/Modal';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewRoom, setPreviewRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [formData, setFormData] = useState({
    room_number: '',
    num_rows: 5,
    num_columns: 4
  });

  const fetchRooms = async () => {
    try {
      const res = await RoomService.getAll();
      setRooms(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch rooms');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await RoomService.update(editingRoom.id, formData);
      } else {
        await RoomService.create(formData);
      }
      setIsModalOpen(false);
      setEditingRoom(null);
      setFormData({ room_number: '', num_rows: 5, num_columns: 4 });
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const confirmDelete = async () => {
    if (roomToDelete) {
      try {
        await RoomService.delete(roomToDelete);
        setIsDeleteModalOpen(false);
        setRoomToDelete(null);
        fetchRooms();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const totalPages = Math.ceil(rooms.length / pageSize);
  const paginatedRooms = rooms.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const calculatedBenches = (parseInt(formData.num_rows) || 0) * (parseInt(formData.num_columns) || 0);
  const calculatedCapacity = calculatedBenches * 2;

  return (
    <div className="fade-in">
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
            Infrastructure & Halls
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
            Configure examination venues, row-column bench layouts, and seating capacities.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { 
            setEditingRoom(null); 
            setFormData({ room_number: '', num_rows: 5, num_columns: 4 });
            setIsModalOpen(true); 
          }}
        >
          <Plus size={18} />
          <span>Add New Hall</span>
        </button>
      </header>

      {/* Grid of Halls */}
      {paginatedRooms.length > 0 ? (
        <>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {paginatedRooms.map((room) => (
              <div key={room.id} className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ background: 'var(--primary-gradient)', padding: '1.4rem 1.5rem', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={20} />
                      </div>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-brand)', letterSpacing: '-0.02em' }}>{room.room_number}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          setPreviewRoom(room);
                          setIsPreviewModalOpen(true);
                        }}
                        className="btn btn-icon" 
                        title="View Layout"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingRoom(room);
                          setFormData({
                            room_number: room.room_number,
                            num_rows: room.num_rows,
                            num_columns: room.num_columns
                          });
                          setIsModalOpen(true);
                        }}
                        className="btn btn-icon" 
                        title="Edit Hall"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => { setRoomToDelete(room.id); setIsDeleteModalOpen(true); }} 
                        className="btn btn-icon" 
                        title="Delete Hall"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.85rem 0.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Rows</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{room.num_rows}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.85rem 0.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Columns</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{room.num_columns}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.85rem 0.5rem', background: 'var(--primary-light)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>Benches</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{room.num_rows * room.num_columns}</div>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    paddingTop: '12px', 
                    borderTop: '1px solid var(--border-light)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      <LayoutGrid size={16} color="var(--primary)" />
                      <span style={{ fontSize: '0.86rem' }}>Capacity: <strong>{room.num_rows * room.num_columns * 2} Candidates</strong></span>
                    </div>
                    <span className="badge badge-success">Ready</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container" style={{ marginTop: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div className="pagination-info">
                Showing <b>{(currentPage - 1) * pageSize + 1}</b> to <b>{Math.min(currentPage * pageSize, rooms.length)}</b> of <b>{rooms.length}</b> examination halls
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
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '5rem 2rem', 
          background: '#ffffff', 
          borderRadius: '20px', 
          border: '1px dashed var(--border)' 
        }}>
          <Building2 size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>No Examination Halls Added</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Register your halls with rows and columns so the optimization engine can allocate student seating.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => { 
              setEditingRoom(null); 
              setFormData({ room_number: '', num_rows: 5, num_columns: 4 });
              setIsModalOpen(true); 
            }}
          >
            <Plus size={16} /> Add First Hall
          </button>
        </div>
      )}

      {/* Hall Layout Preview Modal */}
      <Modal 
        isOpen={isPreviewModalOpen} 
        onClose={() => setIsPreviewModalOpen(false)} 
        title={previewRoom ? `Hall Layout: ${previewRoom.room_number}` : 'Hall Preview'}
        subtitle={`Column-first sequential grid with ${previewRoom ? previewRoom.num_rows * previewRoom.num_columns : 0} total benches`}
        maxWidth="820px"
      >
        <div style={{ paddingBottom: '0.5rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${previewRoom?.num_columns || 1}, minmax(42px, 1fr))`, 
            gap: '8px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '16px',
            maxHeight: '65vh',
            overflowY: 'auto',
            border: '1px solid var(--border)'
          }}>
            {previewRoom && Array.from({ length: previewRoom.num_rows }).map((_, r) => (
              Array.from({ length: previewRoom.num_columns }).map((_, c) => {
                const benchIndex = (c * previewRoom.num_rows) + r + 1;
                return (
                  <div key={`${r}-${c}`} style={{ 
                    background: '#ffffff', 
                    border: '1.5px solid var(--border)', 
                    borderRadius: '8px',
                    padding: '8px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minWidth: '42px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 800, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      B{benchIndex}
                    </div>
                    <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                      <div 
                        title={`Bench B${benchIndex} (Row ${r+1}, Col ${c+1}) - Seat 1`}
                        style={{ width: '12px', height: '10px', background: 'var(--primary-light)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '3px', cursor: 'help' }}
                      />
                      <div 
                        title={`Bench B${benchIndex} (Row ${r+1}, Col ${c+1}) - Seat 2`}
                        style={{ width: '12px', height: '10px', background: 'var(--primary-light)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '3px', cursor: 'help' }}
                      />
                    </div>
                  </div>
                );
              })
            ))}
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Column-First Sequential Matrix View • Two Seats Per Physical Bench
          </div>
        </div>
      </Modal>

      {/* Add / Edit Hall Configuration Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingRoom ? 'Modify Hall Configuration' : 'Configure New Examination Hall'}
        subtitle="Specify room number and grid dimensions for algorithmic seat distribution."
        maxWidth="520px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Hall / Room Identifier <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Hall 101 or Audi-B"
              style={{ width: '100%', fontFamily: 'var(--font-brand)' }}
              value={formData.room_number}
              onChange={(e) => setFormData({...formData, room_number: e.target.value})}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Grid Rows (Depth) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="number" 
                min={1}
                max={50}
                required 
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                value={formData.num_rows}
                onChange={(e) => setFormData({...formData, num_rows: Math.max(1, parseInt(e.target.value) || 1)})}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Grid Columns (Width) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="number" 
                min={1}
                max={50}
                required 
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                value={formData.num_columns}
                onChange={(e) => setFormData({...formData, num_columns: Math.max(1, parseInt(e.target.value) || 1)})}
              />
            </div>
          </div>

          {/* Computed Capacity Card */}
          <div style={{ 
            padding: '1rem 1.25rem', 
            borderRadius: '12px', 
            background: 'var(--primary-lighter)', 
            border: '1.5px solid rgba(79, 70, 229, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Calculated Capacity</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {calculatedBenches} Benches
              </span>
              <span style={{ color: 'var(--border)' }}>•</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                {calculatedCapacity} Candidates
              </span>
            </div>
          </div>
          
          {/* Modal Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px', 
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)' 
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
              {editingRoom ? 'Update Hall Configuration' : 'Save Hall Configuration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Examination Hall"
        subtitle="This action will permanently delete this hall layout."
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
            Are you sure you want to delete this hall? This will remove it from future exam engine allocations.
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
              onClick={confirmDelete}
            >
              Delete Hall
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Rooms;
