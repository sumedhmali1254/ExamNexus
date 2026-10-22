import React, { useEffect, useState } from 'react';
import {
  Shield, Save, ToggleLeft, ToggleRight,
  CheckCircle, AlertTriangle, Info, HelpCircle,
  XCircle, CheckCircle2, Users
} from 'lucide-react';
import { SeatingRulesService } from '../services/api';

const RuleDiagram = ({ type, active, value }) => {
  const cellStyle = (isX) => ({
    width: '30px', height: '30px', borderRadius: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: isX ? (active ? '#fee2e2' : '#f1f5f9') : '#ecfdf5',
    border: `1.5px solid ${isX ? (active ? '#ef4444' : '#cbd5e1') : '#10b981'}`,
    color: isX ? (active ? '#ef4444' : '#94a3b8') : '#10b981',
    fontSize: '0.7rem', fontWeight: 800
  });

  const wrapperStyle = {
    marginTop: '12px', background: 'white', padding: '16px',
    borderRadius: '16px', border: '1.5px solid #f1f5f9',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    animation: 'fadeIn 0.2s ease'
  };

  const explainText = { fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, marginBottom: '10px' };

  if (type === 'adjacent') {
    return (
      <div style={wrapperStyle}>
        <p style={explainText}>Checks neighbors. If red (X), it means two students from the SAME department cannot sit side-by-side.</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={cellStyle(false)}>S1</div>
              <div style={cellStyle(true)}>X</div>
            </div>
            <div style={{ fontSize: '0.6rem', marginTop: '4px', fontWeight: 700 }}>RESTRICTED</div>
          </div>
          <div style={{ borderLeft: '1px solid #f1f5f9', margin: '0 8px' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={cellStyle(false)}>S1</div>
              <div style={cellStyle(false)}>S2</div>
            </div>
            <div style={{ fontSize: '0.6rem', marginTop: '4px', fontWeight: 700 }}>ALLOWED</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'same_bench') {
    return (
      <div style={wrapperStyle}>
        <p style={explainText}>Limits who sits on the SAME physical bench. {active ? "Current Rule: Prevent same type sitting together." : "Allowed: Students of same type can share a bench."}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ border: '2.5px solid #f1f5f9', borderRadius: '10px', padding: '8px', background: 'var(--primary-lighter)' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={cellStyle(false)}>S1</div>
              <div style={cellStyle(active)}> {active ? 'X' : 'S1'} </div>
            </div>
            <div style={{ fontSize: '0.6rem', textAlign: 'center', marginTop: '6px', fontWeight: 800, color: 'var(--primary)' }}>BENCH VIEW</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'strategy') {
    return (
      <div style={wrapperStyle}>
        <p style={explainText}>
          {value === 'no_preference'
            ? "MAX RANDOMIZED: Students are shuffled like a deck of cards. Even close friends will likely end up in different rooms or far apart."
            : "SEQUENTIAL: Students are seated one-by-one according to their roll numbers (101, 102, 103...). Good for discipline, weaker for anti-cheating."}
        </p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {value === 'no_preference'
            ? [12, 45, 2, 89].map(n => <div key={n} style={{ ...cellStyle(false), width: '40px' }}>{n}</div>)
            : [101, 102, 103, 104].map(n => <div key={n} style={{ ...cellStyle(false), width: '40px', background: '#f8fafc' }}>{n}</div>)
          }
        </div>
      </div>
    );
  }

  if (type === 'diversity') {
    return (
      <div style={wrapperStyle}>
        <p style={explainText}>
          Limits how many different {type === 'diversity_dept' ? 'Departments' : 'Batches/Years'} are matched per hall.
          Current limit: <strong>{value}</strong>.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Array.from({ length: value }).map((_, i) => (
            <div key={i} style={{ padding: '4px 10px', background: '#f0f9ff', color: '#0369a1', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
              {type === 'diversity_dept' ? `DEPT ${String.fromCharCode(65 + i)}` : `${2024 - i} Batch`}
            </div>
          ))}
          {value < 3 && <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>+ Reduced probability of cheating</div>}
        </div>
      </div>
    );
  }

  return null;
};

const SeatingRules = () => {
  const [rules, setRules] = useState({
    seats_per_bench: 2,
    same_dept_same_bench: 0,
    same_year_same_bench: 0,
    same_div_same_bench: 0,
    same_dept_adjacent: 0,
    same_year_adjacent: 0,
    max_depts_per_room: 4,
    max_years_per_room: 2,
    roll_preference: 'no_preference',
    room_alloc_mode: 'fill_full',
    room_priority: 'no_preference'
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [hoveredRule, setHoveredRule] = useState(null);
  const [savedRules, setSavedRules] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await SeatingRulesService.get();
        if (res.data.data) {
           setRules(res.data.data);
           setSavedRules(res.data.data);
        }
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await SeatingRulesService.update(rules);
      setSavedRules(rules);
      showToast('Optimization constraints updated');
    } catch (err) {
      showToast('Failed to save rules', 'error');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ value, onChange, label, desc, ruleKey, diagramType }) => (
    <div
      style={{
        padding: '16px 20px', background: hoveredRule === ruleKey ? 'var(--primary-lighter)' : '#f8fafc',
        borderRadius: '14px', marginBottom: '10px', border: hoveredRule === ruleKey ? '1.5px solid rgba(79, 70, 229, 0.2)' : '1.5px solid transparent',
        transition: 'all 0.2s ease', position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{label}</div>
          {desc && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{desc}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            onMouseEnter={() => setHoveredRule(ruleKey)}
            onMouseLeave={() => setHoveredRule(null)}
            style={{ cursor: 'help', color: hoveredRule === ruleKey ? 'var(--primary)' : '#cbd5e1' }}
          >
            <HelpCircle size={18} />
          </div>
          <div onClick={() => onChange(!value)} style={{ cursor: 'pointer', color: value ? 'var(--primary)' : '#cbd5e1' }}>
            {value ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </div>
        </div>
      </div>
      {hoveredRule === ruleKey && diagramType && (
        <RuleDiagram type={diagramType} active={!value} value={value} />
      )}
    </div>
  );

  const OptionSelect = ({ label, desc, options, value, onChange, ruleKey, diagramType }) => (
    <div
      style={{
        padding: '16px 20px', background: hoveredRule === ruleKey ? 'var(--primary-lighter)' : '#f8fafc',
        borderRadius: '14px', marginBottom: '10px', border: hoveredRule === ruleKey ? '1.5px solid rgba(79, 70, 229, 0.2)' : '1.5px solid transparent',
        transition: 'all 0.2s ease', position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{label}</div>
          {desc && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{desc}</div>}
        </div>
        <div
          onMouseEnter={() => setHoveredRule(ruleKey)}
          onMouseLeave={() => setHoveredRule(null)}
          style={{ cursor: 'help', color: hoveredRule === ruleKey ? 'var(--primary)' : '#cbd5e1' }}
        >
          <Info size={18} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map(opt => (
          <div key={opt.value} onClick={() => onChange(opt.value)} style={{
            padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800,
            background: value === opt.value ? 'var(--primary)' : 'white',
            color: value === opt.value ? 'white' : '#64748b',
            border: `1.5px solid ${value === opt.value ? 'var(--primary)' : '#eef2f6'}`,
            boxShadow: value === opt.value ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
          }}>{opt.label}</div>
        ))}
      </div>
      {hoveredRule === ruleKey && diagramType && (
        <RuleDiagram type={diagramType} value={value} />
      )}
    </div>
  );

  const cardStyle = {
    background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem'
  };

  return (
    <div className="fade-in">
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          padding: '16px 24px', borderRadius: '14px',
          background: toast.type === 'success' ? '#059669' : '#ef4444',
          color: 'white', fontWeight: 700, boxShadow: '0 16px 40px -6px rgba(15, 23, 42, 0.2)',
          display: 'flex', gap: '10px', alignItems: 'center', animation: 'toastSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {toast.msg}
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Seating Rules</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configure anti-cheating constraints and institutional seating policies.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding: '12px 24px', height: 'auto' }}>
          <Save size={18} /> {saving ? 'Saving...' : 'Deploy Rules'}
        </button>
      </header>

      {savedRules && (
        <div style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(6, 182, 212, 0.04) 100%)', border: '1.5px solid rgba(79, 70, 229, 0.15)', borderRadius: '16px', padding: '1.2rem 1.6rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-brand)', letterSpacing: '0.04em' }}>
            <CheckCircle2 size={16} /> Currently Active Database Rules
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '1rem', listStyleType: 'none', marginLeft: '-20px' }}>
            <li style={{ background: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}><strong>{savedRules.seats_per_bench}</strong> Candidate(s) per bench</li>
            {savedRules.same_dept_same_bench === 0 && <li style={{ background: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>Diff Depts on Bench</li>}
            {savedRules.same_year_same_bench === 0 && <li style={{ background: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>Diff Years on Bench</li>}
            {savedRules.same_dept_adjacent === 0 && <li style={{ background: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>Diff Depts across Benches</li>}
            <li style={{ background: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>Strategy: <strong>{savedRules.roll_preference === 'no_preference' ? 'Randomized' : 'Sequential'}</strong></li>
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Bench Rules */}
        <div style={cardStyle}>
          <h3 style={{ fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
            <Shield size={20} /> Bench Constraints
          </h3>

          <OptionSelect label="Candidates per Bench"
            desc="Controls how many candidates can sit on one bench."
            options={[{ label: '1 Candidate', value: 1 }, { label: '2 Candidates', value: 2 }]}
            value={rules.seats_per_bench} onChange={v => setRules({ ...rules, seats_per_bench: v })} />

          <Toggle label="Prevent Same Department on Same Bench"
            desc="Students from the same department should not sit on the same bench."
            ruleKey="dept_mix" diagramType="same_bench"
            value={!rules.same_dept_same_bench} onChange={v => setRules({ ...rules, same_dept_same_bench: v ? 0 : 1 })} />

          <Toggle label="Prevent Same Year on Same Bench"
            desc="Students from the same year should not sit together on one bench."
            ruleKey="year_mix" diagramType="same_bench"
            value={!rules.same_year_same_bench} onChange={v => setRules({ ...rules, same_year_same_bench: v ? 0 : 1 })} />
        </div>

        {/* Room Rules */}
        <div style={cardStyle}>
          <h3 style={{ fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#8b5cf6' }}>
            <Users size={20} /> Anti-Cheating Preferences
          </h3>

          <OptionSelect label="Student Arrangement Strategy"
            ruleKey="arrangement" diagramType="strategy"
            options={[
              { label: 'Sequential Roll Number', value: 'same_div_order' },
              { label: 'Randomized Seating (Anti-Cheating)', value: 'no_preference' }
            ]}
            value={rules.roll_preference} onChange={v => setRules({ ...rules, roll_preference: v })} />

          <OptionSelect label="Department Diversity per Room" desc="Maximum number of unique departments allowed inside one exam hall."
            ruleKey="diversity_dept" diagramType="diversity"
            options={[1, 2, 3, 4].map(n => ({ label: String(n), value: n }))}
            value={rules.max_depts_per_room} onChange={v => setRules({ ...rules, max_depts_per_room: v })} />

          <OptionSelect label="Year Diversity per Room" desc="Maximum number of unique years/batches allowed inside one exam hall."
            ruleKey="diversity_batch" diagramType="diversity"
            options={[1, 2, 3, 4].map(n => ({ label: String(n), value: n }))}
            value={rules.max_years_per_room} onChange={v => setRules({ ...rules, max_years_per_room: v })} />

          <div style={{ padding: '16px', borderRadius: '14px', background: '#f0f9ff', color: '#0369a1', fontSize: '0.85rem', display: 'flex', gap: '10px' }}>
            <Info size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Hint:</strong> 1 candidate per bench gives maximum anti-cheating protection but needs more rooms.<br />
              Randomized seating with department and year restrictions gives better anti-cheating control.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingRules;
