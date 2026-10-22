import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Rooms from './pages/Rooms';
import ExamEngine from './pages/ExamEngine';
import SeatingRules from './pages/SeatingRules';
import SeatingPreview from './pages/SeatingPreview';
import TeacherAllocation from './pages/TeacherAllocation';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`sidebar-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      
      <main className={`main-wrapper ${collapsed ? 'collapsed' : ''}`}>
        <Header 
          mobileOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        />
        
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/exam-engine" element={<ExamEngine />} />
            <Route path="/seating-rules" element={<SeatingRules />} />
            <Route path="/seating-preview" element={<SeatingPreview />} />
            <Route path="/teacher-allocation" element={<TeacherAllocation />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>

        <footer className="footer">
          <p>© 2026 AdminNexus — Smart Exam Seating Optimizer. Developed for Institutional Excellence.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
