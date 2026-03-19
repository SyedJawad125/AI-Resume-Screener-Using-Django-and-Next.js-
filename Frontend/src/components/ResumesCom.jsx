'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import AxiosInstance from '@/components/AxiosInstance';

/* ══════════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --bg:       #07090f;
    --surface:  #0c0f18;
    --card:     #111520;
    --card-alt: #161b28;
    --border:   #1c2235;
    --border-hi:#2a3350;
    --text:     #e8edf8;
    --text-2:   #8892aa;
    --text-3:   #4a5470;
    --accent:   #f5a623;
    --accent-hi:#ffc04d;
    --cyan:     #22d3ee;
    --emerald:  #10b981;
    --rose:     #f43f5e;
    --violet:   #a78bfa;
    --amber-s:  #fb923c;
  }

  .f-serif  { font-family: 'DM Serif Display', serif; }
  .f-mono   { font-family: 'IBM Plex Mono', monospace; }
  .f-sans   { font-family: 'DM Sans', sans-serif; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes slideIn   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
  @keyframes shimmer   { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes progressFill { from{width:0} to{width:var(--target-w)} }

  .anim-fade-up  { animation: fadeUp .35s cubic-bezier(.16,1,.3,1) forwards; }
  .anim-fade-in  { animation: fadeIn .2s ease forwards; }
  .anim-slide-in { animation: slideIn .3s cubic-bezier(.16,1,.3,1) forwards; }
  .anim-spin     { animation: spin .65s linear infinite; }
  .anim-live     { animation: livePulse 1.8s ease infinite; }

  .noise-overlay {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    background-size:200px 200px; opacity:.025;
  }

  .shimmer-skeleton {
    background: linear-gradient(90deg, var(--card) 0%, var(--card-alt) 50%, var(--card) 100%);
    background-size: 400px 100%;
    animation: shimmer 1.8s infinite;
  }

  input, textarea, select {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    color: var(--text) !important;
    font-family: 'IBM Plex Mono', monospace !important;
    font-size: 12px !important;
    outline: none !important;
    transition: border-color .15s !important;
    border-radius: 0 !important;
  }
  input:focus, textarea:focus, select:focus { border-color: var(--accent) !important; }
  input::placeholder, textarea::placeholder { color: var(--text-3) !important; opacity:1 !important; }
  select option { background: #0c0f18; color: var(--text); }
  textarea { resize: vertical; }

  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border-hi); border-radius:2px; }

  .drop-zone {
    border: 2px dashed var(--border-hi);
    transition: all .2s;
  }
  .drop-zone.drag-over {
    border-color: var(--accent);
    background: rgba(245,166,35,.04);
  }
  .drop-zone:hover {
    border-color: var(--border-hi);
    background: rgba(255,255,255,.01);
  }
`;

/* ══════════════════════════════════════════════════════════
   STATUS / EDUCATION CONFIG
══════════════════════════════════════════════════════════ */
const RESUME_STATUS_CFG = {
  uploaded: { bar:'#3d4a6b', dot:'#4a5470', bg:'rgba(61,74,107,.1)',  border:'#2a3350', color:'#6b7394',  label:'Uploaded'  },
  parsing:  { bar:'#fb923c', dot:'#fb923c', bg:'rgba(251,146,60,.1)', border:'#c2410c', color:'#fb923c',  label:'Parsing', live:true },
  parsed:   { bar:'#22d3ee', dot:'#22d3ee', bg:'rgba(34,211,238,.08)',border:'#0e7490', color:'#22d3ee',  label:'Parsed'    },
  indexed:  { bar:'#10b981', dot:'#10b981', bg:'rgba(16,185,129,.1)', border:'#065f46', color:'#34d399',  label:'Indexed', live:true },
  failed:   { bar:'#f43f5e', dot:'#f43f5e', bg:'rgba(244,63,94,.1)',  border:'#9f1239', color:'#f43f5e',  label:'Failed'    },
};

const EDU_COLORS = {
  high_school: { color:'#6b7394', bg:'rgba(107,115,148,.1)', border:'#2a3350' },
  associate:   { color:'#67e8f9', bg:'rgba(34,211,238,.07)', border:'#0e7490' },
  bachelor:    { color:'#fbbf24', bg:'rgba(245,158,11,.1)',  border:'#92400e' },
  master:      { color:'#c4b5fd', bg:'rgba(167,139,250,.1)', border:'#5b21b6' },
  mba:         { color:'#fb923c', bg:'rgba(251,146,60,.1)',  border:'#c2410c' },
  phd:         { color:'#f43f5e', bg:'rgba(244,63,94,.1)',   border:'#9f1239' },
  other:       { color:'#4a5470', bg:'rgba(74,84,112,.1)',   border:'#1c2235' },
};

const SKILL_PROFICIENCY_CFG = {
  beginner:     { color:'#6b7394', bg:'rgba(107,115,148,.1)', border:'#2a3350' },
  intermediate: { color:'#fbbf24', bg:'rgba(245,158,11,.1)',  border:'#92400e' },
  expert:       { color:'#34d399', bg:'rgba(16,185,129,.1)',  border:'#065f46' },
};

const SKILL_CATEGORY_COLORS = {
  technical: { color:'#67e8f9', bg:'rgba(34,211,238,.07)', border:'#0e7490' },
  soft:      { color:'#c4b5fd', bg:'rgba(167,139,250,.07)', border:'#5b21b6' },
  domain:    { color:'#fb923c', bg:'rgba(251,146,60,.07)',  border:'#c2410c' },
};

const FILE_TYPE_CFG = {
  pdf:  { color:'#f43f5e', bg:'rgba(244,63,94,.1)',   border:'#9f1239', icon:'⬡' },
  docx: { color:'#22d3ee', bg:'rgba(34,211,238,.08)', border:'#0e7490', icon:'◈' },
  doc:  { color:'#a78bfa', bg:'rgba(167,139,250,.08)',border:'#5b21b6', icon:'◈' },
};

const EXP_THRESHOLDS = [
  { max:2,  color:'#6b7394', label:'Junior'  },
  { max:5,  color:'#fbbf24', label:'Mid'     },
  { max:10, color:'#22d3ee', label:'Senior'  },
  { max:Infinity, color:'#10b981', label:'Expert' },
];

const fmt = {
  label:  s => s ? s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : '—',
  date:   d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—',
  dateTime: d => d ? new Date(d).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—',
  kb:     n => n >= 1024 ? `${(n/1024).toFixed(1)} MB` : `${n} KB`,
  exp:    n => {
    const t = EXP_THRESHOLDS.find(e => n <= e.max);
    return { color: t?.color||'#6b7394', label: t?.label||'Expert', years: n };
  },
};

/* ══════════════════════════════════════════════════════════
   TOAST SYSTEM
══════════════════════════════════════════════════════════ */
let _setToasts = null;
const toast = {
  _p(type,msg){ const id=Date.now()+Math.random(); _setToasts?.(p=>[...p,{id,type,msg}]); setTimeout(()=>_setToasts?.(p=>p.filter(t=>t.id!==id)),4200); },
  success:m=>toast._p('success',m), error:m=>toast._p('error',m),
  warn:m=>toast._p('warn',m), info:m=>toast._p('info',m),
};
const T_CFG = {
  success:{ bg:'#07130e', border:'#065f46', color:'#34d399', icon:'✓' },
  error:  { bg:'#12060a', border:'#881337', color:'#fb7185', icon:'✗' },
  warn:   { bg:'#120c04', border:'#78350f', color:'#fbbf24', icon:'!' },
  info:   { bg:'#04101a', border:'#075985', color:'#38bdf8', icon:'i' },
};
function Toasts() {
  const [toasts,setToasts] = useState([]);
  useEffect(()=>{ _setToasts=setToasts; },[]);
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:8,pointerEvents:'none'}}>
      {toasts.map(t=>{
        const c=T_CFG[t.type];
        return (
          <div key={t.id} className="anim-fade-up f-mono" style={{
            background:c.bg, border:`1px solid ${c.border}`, color:c.color,
            padding:'10px 16px', display:'flex', alignItems:'center', gap:12,
            minWidth:260, maxWidth:380, pointerEvents:'auto', fontSize:11,
          }}>
            <span style={{fontWeight:600,width:16,textAlign:'center'}}>[{c.icon}]</span>
            <span style={{lineHeight:1.5}}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRIMITIVE COMPONENTS
══════════════════════════════════════════════════════════ */
function Spinner({ size=14, color='var(--accent)' }) {
  return <span className="anim-spin" style={{display:'inline-block',width:size,height:size,border:`2px solid rgba(255,255,255,.08)`,borderTopColor:color,borderRadius:'50%'}} />;
}

function StatusDot({ status, size=6, cfg=RESUME_STATUS_CFG }) {
  const c = cfg[status];
  return (
    <span style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',width:size+6,height:size+6}}>
      {c?.live && <span className="anim-live" style={{position:'absolute',width:size+4,height:size+4,borderRadius:'50%',background:c.dot,opacity:.3}} />}
      <span style={{width:size,height:size,borderRadius:'50%',background:c?.dot||'#4a5470'}} />
    </span>
  );
}

function SPill({ status }) {
  const c = RESUME_STATUS_CFG[status] || RESUME_STATUS_CFG.uploaded;
  return (
    <span className="f-mono" style={{
      fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase',
      padding:'3px 8px', display:'inline-flex', alignItems:'center', gap:6, flexShrink:0,
      background:c.bg, border:`1px solid ${c.border}`, color:c.color,
    }}>
      <StatusDot status={status} size={5} />{c.label}
    </span>
  );
}

function EduTag({ level }) {
  const c = EDU_COLORS[level] || EDU_COLORS.other;
  return (
    <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 8px',background:c.bg,border:`1px solid ${c.border}`,color:c.color}}>
      {fmt.label(level||'—')}
    </span>
  );
}

function FileTag({ type }) {
  const c = FILE_TYPE_CFG[type] || { color:'var(--text-3)', bg:'transparent', border:'var(--border)', icon:'◻' };
  return (
    <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 8px',background:c.bg,border:`1px solid ${c.border}`,color:c.color,display:'inline-flex',alignItems:'center',gap:5}}>
      {c.icon} {type?.toUpperCase()||'—'}
    </span>
  );
}

function Chip({ children, color='var(--text-3)', bg='rgba(74,84,112,.1)', border='var(--border)' }) {
  return (
    <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 8px',background:bg,border:`1px solid ${border}`,color}}>
      {children}
    </span>
  );
}

function SLabel({ children }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
      <span className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',flexShrink:0}}>{children}</span>
      <span style={{flex:1,height:1,background:'var(--border)'}} />
    </div>
  );
}

function Card({ children, className='', style={} }) {
  return (
    <div className={`anim-fade-up ${className}`} style={{background:'var(--card)',border:'1px solid var(--border)',...style}}>
      {children}
    </div>
  );
}

function PrimaryBtn({ children, loading, loadingText='Processing…', disabled, style={}, ...p }) {
  const dis = disabled||loading;
  return (
    <button disabled={dis} style={{
      background: dis ? 'var(--card-alt)' : 'var(--accent)',
      color: dis ? 'var(--text-3)' : '#07090f',
      border:'none', cursor: dis ? 'not-allowed' : 'pointer',
      fontFamily:'IBM Plex Mono,monospace', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase',
      padding:'10px 16px', fontWeight:600,
      display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s', ...style,
    }} {...p}>
      {loading ? <><Spinner size={12} color='#07090f'/>{loadingText}</> : children}
    </button>
  );
}

function GhostBtn({ children, active=false, style={}, ...p }) {
  const [hov,setHov] = useState(false);
  return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:'transparent', border:`1px solid ${active||hov?'var(--border-hi)':'var(--border)'}`,
      color: active ? 'var(--accent)' : hov ? 'var(--text-2)' : 'var(--text-3)',
      fontFamily:'IBM Plex Mono,monospace', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase',
      padding:'6px 12px', cursor:'pointer', transition:'all .15s', ...style,
    }} {...p}>
      {children}
    </button>
  );
}

function DangerBtn({ children, style={}, ...p }) {
  const [hov,setHov] = useState(false);
  return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background: hov ? 'rgba(244,63,94,.08)' : 'transparent',
      border:'1px solid rgba(244,63,94,.35)', color:'#f43f5e',
      fontFamily:'IBM Plex Mono,monospace', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase',
      padding:'6px 12px', cursor:'pointer', transition:'all .15s', ...style,
    }} {...p}>
      {children}
    </button>
  );
}

function TxtInput({ label, required, ...p }) {
  return (
    <div>
      {label && <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>{label}{required&&<span style={{color:'var(--accent)',marginLeft:3}}>*</span>}</label>}
      <input style={{width:'100%',padding:'10px 12px',display:'block',boxSizing:'border-box'}} {...p} />
    </div>
  );
}

function TxtArea({ label, ...p }) {
  return (
    <div>
      {label && <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>{label}</label>}
      <textarea style={{width:'100%',padding:'10px 12px',display:'block',boxSizing:'border-box',minHeight:90}} {...p} />
    </div>
  );
}

function SelInput({ label, options=[], ...p }) {
  return (
    <div>
      {label && <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>{label}</label>}
      <select style={{width:'100%',padding:'10px 12px',display:'block',boxSizing:'border-box',cursor:'pointer'}} {...p}>
        {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??fmt.label(o)}</option>)}
      </select>
    </div>
  );
}

function ProgBar({ pct=0, color='var(--accent)', height=2 }) {
  return (
    <div style={{height,background:'var(--border)',overflow:'hidden'}}>
      <div style={{width:`${Math.min(100,pct)}%`,height:'100%',background:color,transition:'width .6s ease'}} />
    </div>
  );
}

function Skel({ width='100%', height=14 }) {
  return <div className="shimmer-skeleton" style={{width,height,flexShrink:0}} />;
}

function EmptyState({ icon='◌', title, sub, action }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'64px 24px',gap:16,textAlign:'center'}}>
      <div className="f-serif" style={{fontSize:56,color:'var(--border-hi)',lineHeight:1,fontStyle:'italic'}}>{icon}</div>
      <div>
        <p className="f-sans" style={{fontSize:14,fontWeight:500,color:'var(--text-2)',marginBottom:6}}>{title}</p>
        {sub && <p className="f-mono" style={{fontSize:11,color:'var(--text-3)',lineHeight:1.6,maxWidth:300,margin:'0 auto'}}>{sub}</p>}
      </div>
      {action && <div style={{marginTop:8}}>{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONFIRM MODAL
══════════════════════════════════════════════════════════ */
function ConfirmModal({ open, title, message, confirmLabel='Confirm Delete', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(7,9,15,.88)',backdropFilter:'blur(16px)'}}>
      <div className="anim-fade-up" style={{background:'var(--card)',border:'1px solid var(--border-hi)',padding:24,maxWidth:400,width:'100%'}}>
        <div style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16,background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.3)'}}>
          <span style={{color:'#f43f5e',fontSize:14,fontWeight:700}}>!</span>
        </div>
        <p className="f-serif" style={{fontSize:18,color:'var(--text)',marginBottom:8}}>{title}</p>
        <p className="f-mono" style={{fontSize:11,color:'var(--text-2)',lineHeight:1.6,marginBottom:24}}>{message}</p>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
          <DangerBtn onClick={onConfirm}>{confirmLabel}</DangerBtn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AVATAR / INITIALS
══════════════════════════════════════════════════════════ */
function CandidateAvatar({ name, size=40 }) {
  const initials = name
    ? name.trim().split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('')
    : '?';
  // Deterministic color from name
  const colors = ['#f5a623','#22d3ee','#10b981','#a78bfa','#fb923c','#f43f5e'];
  const idx = name ? [...name].reduce((a,c)=>a+c.charCodeAt(0),0) % colors.length : 0;
  return (
    <div style={{
      width:size, height:size, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:`${colors[idx]}14`, border:`1px solid ${colors[idx]}40`,
    }}>
      <span className="f-serif" style={{fontSize:size*0.35,color:colors[idx],fontStyle:'italic',lineHeight:1}}>{initials}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   EXPERIENCE BADGE
══════════════════════════════════════════════════════════ */
function ExpBadge({ years }) {
  const info = fmt.exp(years||0);
  return (
    <span className="f-mono" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:10,color:info.color}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:info.color,flexShrink:0}} />
      {info.years}y · {info.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   RESUME SKILL ROW (detail view)
══════════════════════════════════════════════════════════ */
function ResumeSkillRow({ skill, resumeId, onRefresh }) {
  const [editing,setEditing] = useState(false);
  const [form,setForm]       = useState({ name:skill.name, category:skill.category||'', proficiency:skill.proficiency||'', years_used:skill.years_used||0 });
  const [saving,setSaving]   = useState(false);
  const [hov,setHov]         = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await AxiosInstance.patch(`/api/resumes/v1/resume/skills/?resume_id=${resumeId}&id=${skill.id}`, form);
      toast.success('Skill updated'); setEditing(false); onRefresh();
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };
  const remove = async () => {
    try {
      await AxiosInstance.delete(`/api/resumes/v1/resume/skills/?resume_id=${resumeId}&id=${skill.id}`);
      toast.info(`Removed "${skill.name}"`); onRefresh();
    } catch { toast.error('Delete failed'); }
  };

  const catCfg  = SKILL_CATEGORY_COLORS[skill.category?.toLowerCase()] || {};
  const profCfg = SKILL_PROFICIENCY_CFG[skill.proficiency?.toLowerCase()] || {};

  if (editing) return (
    <div style={{padding:14,background:'var(--card-alt)',borderLeft:'2px solid var(--accent)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        <input style={{padding:'8px 10px',gridColumn:'1/-1'}} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Skill name" />
        <select style={{padding:'8px 10px',cursor:'pointer'}} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
          <option value="">Category</option>
          {['technical','soft','domain'].map(c=><option key={c} value={c}>{fmt.label(c)}</option>)}
        </select>
        <select style={{padding:'8px 10px',cursor:'pointer'}} value={form.proficiency} onChange={e=>setForm(p=>({...p,proficiency:e.target.value}))}>
          <option value="">Proficiency</option>
          {['beginner','intermediate','expert'].map(c=><option key={c} value={c}>{fmt.label(c)}</option>)}
        </select>
        <input type="number" min={0} step={0.5} style={{padding:'8px 10px',gridColumn:'1/-1'}} value={form.years_used} onChange={e=>setForm(p=>({...p,years_used:+e.target.value}))} placeholder="Years used" />
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <GhostBtn onClick={()=>setEditing(false)}>Cancel</GhostBtn>
        <PrimaryBtn loading={saving} onClick={save} style={{padding:'7px 18px'}}>Save</PrimaryBtn>
      </div>
    </div>
  );

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
      borderBottom:'1px solid var(--border)',
      background: hov ? 'var(--card-alt)' : 'transparent',
      transition:'background .15s',
    }}>
      <div style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <span className="f-sans" style={{fontSize:13,fontWeight:500,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:180}}>{skill.name}</span>
        {skill.category && (
          <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',padding:'2px 7px',background:catCfg.bg||'rgba(74,84,112,.1)',border:`1px solid ${catCfg.border||'var(--border)'}`,color:catCfg.color||'var(--text-3)'}}>
            {skill.category}
          </span>
        )}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        {skill.proficiency && (
          <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',padding:'2px 7px',background:profCfg.bg||'rgba(74,84,112,.1)',border:`1px solid ${profCfg.border||'var(--border)'}`,color:profCfg.color||'var(--text-3)'}}>
            {skill.proficiency}
          </span>
        )}
        {skill.years_used > 0 && <span className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{skill.years_used}y</span>}
        <div style={{display:'flex',gap:6,opacity:hov?1:0,transition:'opacity .15s'}}>
          {[['✎','var(--accent)',()=>setEditing(true)],['✕','#f43f5e',remove]].map(([icon,hc,fn])=>(
            <IBtn key={icon} icon={icon} hoverColor={hc} onClick={fn} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IBtn({ icon, hoverColor='var(--accent)', onClick }) {
  const [hov,setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:'none',border:'none',cursor:'pointer',color:hov?hoverColor:'var(--text-3)',fontSize:12,transition:'color .15s',padding:0}}>
      {icon}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   ADD SKILL FORM
══════════════════════════════════════════════════════════ */
function AddSkillForm({ resumeId, onRefresh, onClose }) {
  const [form,setForm]  = useState({ name:'', category:'', proficiency:'', years_used:0 });
  const [saving,setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) { toast.warn('Skill name required'); return; }
    setSaving(true);
    try {
      await AxiosInstance.post(`/api/resumes/v1/resume/skills/?resume_id=${resumeId}`, form);
      toast.success(`Added "${form.name}"`);
      setForm({ name:'', category:'', proficiency:'', years_used:0 });
      onRefresh(); onClose?.();
    } catch(e) { toast.error(e.response?.data?.message||'Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="anim-slide-in" style={{padding:16,background:'var(--surface)',border:'1px solid var(--border-hi)',borderLeft:'2px solid var(--accent)'}}>
      <SLabel>Add New Skill</SLabel>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        <input style={{padding:'9px 12px',gridColumn:'1/-1'}} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Skill name (e.g. Python, React, SQL)" />
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
          <option value="">Category</option>
          {['technical','soft','domain'].map(c=><option key={c} value={c}>{fmt.label(c)}</option>)}
        </select>
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={form.proficiency} onChange={e=>setForm(p=>({...p,proficiency:e.target.value}))}>
          <option value="">Proficiency</option>
          {['beginner','intermediate','expert'].map(c=><option key={c} value={c}>{fmt.label(c)}</option>)}
        </select>
        <input type="number" min={0} step={0.5} style={{padding:'9px 12px',gridColumn:'1/-1'}} value={form.years_used} onChange={e=>setForm(p=>({...p,years_used:+e.target.value}))} placeholder="Years used" />
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        {onClose && <GhostBtn onClick={onClose}>Cancel</GhostBtn>}
        <PrimaryBtn loading={saving} onClick={submit} style={{padding:'8px 20px'}}>+ Add Skill</PrimaryBtn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BULK UPLOAD PROGRESS TRACKER
══════════════════════════════════════════════════════════ */
function BulkProgressCard({ sessionId, onDone }) {
  const [session,setSession] = useState(null);
  const intervalRef = useRef(null);

  const poll = useCallback(async () => {
    try {
      const r = await AxiosInstance.get(`/api/resumes/v1/resume/bulk-upload/status/?session_id=${sessionId}`);
      const d = r.data?.data || r.data;
      setSession(d);
      if (d.status === 'completed' || d.status === 'failed') {
        clearInterval(intervalRef.current);
        if (d.status === 'completed') { toast.success(`Bulk upload complete — ${d.processed_files} parsed`); onDone?.(); }
        else toast.error('Bulk upload finished with errors');
      }
    } catch { clearInterval(intervalRef.current); }
  }, [sessionId, onDone]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current);
  }, [poll]);

  if (!session) return null;

  const pct = session.progress_pct || 0;
  const statusColor = session.status === 'completed' ? 'var(--emerald)' : session.status === 'failed' ? 'var(--rose)' : 'var(--accent)';

  return (
    <div className="anim-fade-in" style={{padding:16,background:'var(--surface)',border:'1px solid var(--border-hi)',borderLeft:`2px solid ${statusColor}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div>
          <span className="f-mono" style={{fontSize:10,color:'var(--text-2)',letterSpacing:'0.15em',textTransform:'uppercase'}}>
            {session.status === 'processing' && <><Spinner size={10} color='var(--accent)' /> &nbsp;</>}
            Bulk Upload · {fmt.label(session.status)}
          </span>
        </div>
        <span className="f-serif" style={{fontSize:22,color:statusColor,fontStyle:'italic',lineHeight:1}}>{pct}%</span>
      </div>
      <ProgBar pct={pct} color={statusColor} height={3} />
      <div style={{display:'flex',gap:24,marginTop:10}}>
        {[['Total',session.total_files,'var(--text-2)'],['Processed',session.processed_files,'var(--emerald)'],['Failed',session.failed_files,'var(--rose)']].map(([l,v,c])=>(
          <span key={l} className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>
            {l}: <span style={{color:c,fontWeight:600}}>{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SINGLE UPLOAD FORM
══════════════════════════════════════════════════════════ */
function UploadDropZone({ onUploaded }) {
  const [dragging,setDragging] = useState(false);
  const [file,setFile]         = useState(null);
  const [tags,setTags]         = useState('');
  const [notes,setNotes]       = useState('');
  const [uploading,setUploading] = useState(false);
  const inputRef = useRef(null);

  const MAX_MB = 10;
  const ALLOWED = ['pdf','docx','doc'];

  const validateFile = f => {
    if (!f) return false;
    const ext = f.name.rsplit?.('.',1)?.[1]?.toLowerCase() || f.name.split('.').pop().toLowerCase();
    if (!ALLOWED.includes(ext)) { toast.error(`Unsupported type: .${ext}`); return false; }
    if (f.size > MAX_MB * 1024 * 1024) { toast.error(`File exceeds ${MAX_MB} MB limit`); return false; }
    return true;
  };

  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) setFile(f);
  };

  const onPick = e => {
    const f = e.target.files[0];
    if (f && validateFile(f)) setFile(f);
  };

  const submit = async () => {
    if (!file) { toast.warn('Please select a file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (tags) tags.split(',').forEach(t => fd.append('tags', t.trim()));
      if (notes) fd.append('notes', notes);
      const r = await AxiosInstance.post('/api/resumes/v1/resume/', fd, { headers:{'Content-Type':'multipart/form-data'} });
      toast.success('Resume uploaded — parsing in progress');
      setFile(null); setTags(''); setNotes('');
      onUploaded?.(r.data?.data || r.data);
    } catch(e) {
      const err = e.response?.data;
      toast.error(typeof err==='string' ? err : err?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {/* Drop zone */}
      <div
        className={`drop-zone${dragging?' drag-over':''}`}
        onDragOver={e=>{ e.preventDefault(); setDragging(true); }}
        onDragLeave={()=>setDragging(false)}
        onDrop={onDrop}
        onClick={()=>!file && inputRef.current?.click()}
        style={{padding:32,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,cursor:file?'default':'pointer',minHeight:160,textAlign:'center'}}>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" onChange={onPick} style={{display:'none'}} />
        {file ? (
          <>
            <FileTag type={file.name.split('.').pop().toLowerCase()} />
            <div>
              <p className="f-sans" style={{fontSize:14,fontWeight:500,color:'var(--text)',marginBottom:4}}>{file.name}</p>
              <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{fmt.kb(Math.round(file.size/1024))}</p>
            </div>
            <GhostBtn onClick={e=>{ e.stopPropagation(); setFile(null); }}>✕ Remove</GhostBtn>
          </>
        ) : (
          <>
            <span className="f-serif" style={{fontSize:40,color:'var(--border-hi)',fontStyle:'italic'}}>{dragging?'⊕':'⊡'}</span>
            <div>
              <p className="f-sans" style={{fontSize:13,color:'var(--text-2)',marginBottom:4}}>{dragging?'Drop it here':'Drag & drop or click to browse'}</p>
              <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>PDF · DOCX · DOC · max {MAX_MB} MB</p>
            </div>
          </>
        )}
      </div>

      {/* Metadata */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={{gridColumn:'1/-1'}}>
          <TxtInput label="Tags (comma-separated)" value={tags} onChange={e=>setTags(e.target.value)} placeholder="senior, backend, python…" />
        </div>
        <div style={{gridColumn:'1/-1'}}>
          <TxtArea label="Notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Internal recruiter notes…" style={{minHeight:70}} />
        </div>
      </div>

      <PrimaryBtn loading={uploading} loadingText="Uploading…" disabled={!file} onClick={submit} style={{padding:'11px 24px',alignSelf:'flex-end'}}>
        ⇡ Upload Resume
      </PrimaryBtn>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BULK UPLOAD FORM
══════════════════════════════════════════════════════════ */
function BulkUploadForm({ onBulkStarted }) {
  const [files,setFiles]       = useState([]);
  const [tags,setTags]         = useState('');
  const [dragging,setDragging] = useState(false);
  const [uploading,setUploading] = useState(false);
  const inputRef = useRef(null);

  const ALLOWED = ['pdf','docx','doc'];
  const MAX_MB  = 10;

  const addFiles = fs => {
    const valid = [...fs].filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      if (!ALLOWED.includes(ext)) { toast.warn(`Skipped "${f.name}": unsupported type`); return false; }
      if (f.size > MAX_MB*1024*1024) { toast.warn(`Skipped "${f.name}": too large`); return false; }
      return true;
    });
    setFiles(p => {
      const combined = [...p, ...valid];
      if (combined.length > 100) { toast.warn('Max 100 files'); return combined.slice(0,100); }
      return combined;
    });
  };

  const onDrop = e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const submit = async () => {
    if (!files.length) { toast.warn('Add at least one file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      if (tags) tags.split(',').forEach(t => { const s=t.trim(); if(s) fd.append('tags', s); });
      const r = await AxiosInstance.post('/api/resumes/v1/resume/bulk/upload/', fd, { headers:{'Content-Type':'multipart/form-data'} });
      const d = r.data?.data || r.data;
      toast.success(`${files.length} files queued for parsing`);
      setFiles([]); setTags('');
      onBulkStarted?.(d.bulk_session_id);
    } catch(e) {
      const err = e.response?.data;
      toast.error(typeof err==='string' ? err : err?.message || 'Bulk upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {/* Drop */}
      <div
        className={`drop-zone${dragging?' drag-over':''}`}
        onDragOver={e=>{ e.preventDefault(); setDragging(true); }}
        onDragLeave={()=>setDragging(false)}
        onDrop={onDrop}
        onClick={()=>inputRef.current?.click()}
        style={{padding:24,display:'flex',flexDirection:'column',alignItems:'center',gap:10,cursor:'pointer',textAlign:'center'}}>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" multiple onChange={e=>addFiles(e.target.files)} style={{display:'none'}} />
        <span className="f-serif" style={{fontSize:36,color:'var(--border-hi)',fontStyle:'italic'}}>{dragging?'⊕':'⊠'}</span>
        <div>
          <p className="f-sans" style={{fontSize:13,color:'var(--text-2)',marginBottom:4}}>{dragging?'Drop all files':'Drop multiple files or click to browse'}</p>
          <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>Up to 100 files · PDF, DOCX, DOC · max {MAX_MB} MB each</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',maxHeight:200,overflowY:'auto'}}>
          <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span className="f-mono" style={{fontSize:10,color:'var(--text-3)',letterSpacing:'0.15em',textTransform:'uppercase'}}>{files.length} file{files.length!==1?'s':''} selected</span>
            <GhostBtn onClick={()=>setFiles([])} style={{padding:'3px 8px',fontSize:9}}>Clear All</GhostBtn>
          </div>
          {files.map((f,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderBottom:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,.01)'}}>
              <FileTag type={f.name.split('.').pop().toLowerCase()} />
              <span className="f-sans" style={{fontSize:12,color:'var(--text-2)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
              <span className="f-mono" style={{fontSize:10,color:'var(--text-3)',flexShrink:0}}>{fmt.kb(Math.round(f.size/1024))}</span>
              <IBtn icon="✕" hoverColor="#f43f5e" onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} />
            </div>
          ))}
        </div>
      )}

      <TxtInput label="Tags (comma-separated)" value={tags} onChange={e=>setTags(e.target.value)} placeholder="batch-2024, engineering…" />

      <PrimaryBtn loading={uploading} loadingText={`Uploading ${files.length} files…`} disabled={!files.length} onClick={submit} style={{padding:'11px 24px',alignSelf:'flex-end'}}>
        ⇡ Bulk Upload {files.length > 0 ? `(${files.length})` : ''}
      </PrimaryBtn>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RESUME DETAIL
══════════════════════════════════════════════════════════ */
function ResumeDetail({ resumeId, onBack, onEdit, onDelete }) {
  const [resume,setResume]   = useState(null);
  const [skills,setSkills]   = useState([]);
  const [loading,setLoading] = useState(true);
  const [addSkill,setAddSkill] = useState(false);
  const [section,setSection] = useState('overview');
  const [retrying,setRetrying] = useState(false);
  const [rawExpanded,setRawExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await AxiosInstance.get(`/api/resumes/v1/resume/?id=${resumeId}`);
      const d = r.data?.data || r.data;
      setResume(d);
      setSkills(d.skills || []);
    } catch { toast.error('Failed to load resume'); } finally { setLoading(false); }
  }, [resumeId]);

  const refreshSkills = async () => {
    try {
      const r = await AxiosInstance.get(`/api/resumes/v1/resume/skills/?resume_id=${resumeId}`);
      setSkills(r.data?.data || r.data || []);
    } catch {}
  };

  const retryParse = async () => {
    setRetrying(true);
    try {
      await AxiosInstance.post('/api/resumes/v1/resume/retry-parse/', { resume_ids:[resumeId] });
      toast.success('Retry parse queued'); load();
    } catch(e) { toast.error(e.response?.data?.message || 'Retry failed'); } finally { setRetrying(false); }
  };

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:900}}>
      {[...Array(3)].map((_,i)=>(
        <div key={i} style={{padding:20,background:'var(--card)',border:'1px solid var(--border)'}}>
          <Skel width='40%' height={20} /><div style={{height:10}}/><Skel width='100%' height={12}/><div style={{height:6}}/><Skel width='65%' height={12}/>
        </div>
      ))}
    </div>
  );
  if (!resume) return null;

  const sc = RESUME_STATUS_CFG[resume.status] || RESUME_STATUS_CFG.uploaded;
  const expInfo = fmt.exp(resume.total_experience_years || 0);
  const SECS = [
    { id:'overview',    l:'Overview'                                },
    { id:'experience',  l:`Experience (${resume.experience_details?.length||0})` },
    { id:'education',   l:'Education'                               },
    { id:'skills',      l:`Skills (${skills.length})`               },
    { id:'raw',         l:'Raw Text'                                 },
  ];

  return (
    <div className="anim-fade-up" style={{maxWidth:900}}>
      {/* Breadcrumb + actions */}
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:24}}>
        <button onClick={onBack} className="f-mono"
          style={{fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',background:'none',border:'none',color:'var(--text-3)',cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>← All Resumes</button>
        <span className="f-mono" style={{fontSize:10,color:'var(--border-hi)'}}>/</span>
        <span className="f-mono" style={{fontSize:10,color:'var(--text-2)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:220,whiteSpace:'nowrap'}}>
          {resume.candidate_name || resume.original_filename}
        </span>
        <div style={{flex:1}}/>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {resume.status === 'failed' && (
            <PrimaryBtn onClick={retryParse} loading={retrying} loadingText="Queuing…" style={{padding:'8px 16px',background:'rgba(244,63,94,.15)',color:'#f43f5e',border:'1px solid rgba(244,63,94,.3)'}}>
              ↻ Retry Parse
            </PrimaryBtn>
          )}
          <GhostBtn onClick={()=>onEdit(resume)}>✎ Edit</GhostBtn>
          <DangerBtn onClick={()=>onDelete(resume)}>Delete</DangerBtn>
        </div>
      </div>

      {/* Hero */}
      <div style={{padding:24,marginBottom:2,background:'var(--card)',border:'1px solid var(--border)',borderLeft:`3px solid ${sc.bar}`}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:16,flexWrap:'wrap'}}>
          <CandidateAvatar name={resume.candidate_name} size={52} />
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
              <div>
                <h1 className="f-serif" style={{fontSize:26,color:'var(--text)',marginBottom:5,lineHeight:1.15}}>
                  {resume.candidate_name || <span style={{color:'var(--text-3)',fontStyle:'italic'}}>Unnamed Candidate</span>}
                </h1>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
                  {resume.candidate_email && <span className="f-mono" style={{fontSize:11,color:'var(--cyan)'}}>{resume.candidate_email}</span>}
                  {resume.candidate_location && <span className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>📍 {resume.candidate_location}</span>}
                  {resume.candidate_phone && <span className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>{resume.candidate_phone}</span>}
                </div>
              </div>
              <SPill status={resume.status} />
            </div>
          </div>
        </div>

        {/* Links */}
        {(resume.candidate_linkedin || resume.candidate_github || resume.candidate_website) && (
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
            {resume.candidate_linkedin && <a href={resume.candidate_linkedin} target="_blank" rel="noreferrer" className="f-mono" style={{fontSize:10,color:'var(--cyan)',textDecoration:'none',letterSpacing:'0.1em'}}>↗ LinkedIn</a>}
            {resume.candidate_github   && <a href={resume.candidate_github}   target="_blank" rel="noreferrer" className="f-mono" style={{fontSize:10,color:'var(--text-3)',textDecoration:'none',letterSpacing:'0.1em'}}>↗ GitHub</a>}
            {resume.candidate_website  && <a href={resume.candidate_website}  target="_blank" rel="noreferrer" className="f-mono" style={{fontSize:10,color:'var(--text-3)',textDecoration:'none',letterSpacing:'0.1em'}}>↗ Website</a>}
          </div>
        )}

        {/* Stat chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          <FileTag type={resume.file_type} />
          <EduTag level={resume.highest_education} />
          <Chip color={expInfo.color} bg={`${expInfo.color}14`} border={`${expInfo.color}40`}>
            {resume.total_experience_years}y · {expInfo.label}
          </Chip>
          {resume.is_indexed && <Chip color='#34d399' bg='rgba(16,185,129,.07)' border='#065f46'>⬡ Indexed</Chip>}
          {resume.file_size_kb > 0 && <Chip>{fmt.kb(resume.file_size_kb)}</Chip>}
          {resume.parsed_at && <Chip>Parsed {fmt.date(resume.parsed_at)}</Chip>}
        </div>

        {/* Failed parse error */}
        {resume.status === 'failed' && resume.parse_error && (
          <div style={{marginTop:14,padding:'10px 14px',background:'rgba(244,63,94,.06)',border:'1px solid rgba(244,63,94,.25)',borderLeft:'2px solid #f43f5e'}}>
            <p className="f-mono" style={{fontSize:10,color:'#fb7185',lineHeight:1.6}}><span style={{fontWeight:600}}>Parse Error:</span> {resume.parse_error}</p>
          </div>
        )}
      </div>

      {/* Section nav */}
      <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',marginBottom:24}}>
        {SECS.map(s=>(
          <button key={s.id} onClick={()=>setSection(s.id)} className="f-mono"
            style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',padding:'12px 20px',background:'none',border:'none',borderBottom:`2px solid ${section===s.id?'var(--accent)':'transparent'}`,color:section===s.id?'var(--accent)':'var(--text-3)',cursor:'pointer',transition:'color .15s',whiteSpace:'nowrap'}}>
            {s.l}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {section === 'overview' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          {/* Extracted skills summary */}
          {resume.skills_list?.length > 0 && (
            <Card style={{padding:20,gridColumn:'1/-1'}}>
              <SLabel>AI-Extracted Skills ({resume.skills_list.length})</SLabel>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {resume.skills_list.slice(0,50).map((sk,i)=><Chip key={i}>{sk}</Chip>)}
                {resume.skills_list.length > 50 && <Chip color='var(--text-3)'>+{resume.skills_list.length-50} more</Chip>}
              </div>
            </Card>
          )}

          {/* Certifications */}
          {resume.certifications?.length > 0 && (
            <Card style={{padding:20}}>
              <SLabel>Certifications ({resume.certifications.length})</SLabel>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {resume.certifications.map((c,i)=>(
                  <div key={i} style={{padding:'8px 12px',background:'var(--surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',flexShrink:0}} />
                    <span className="f-sans" style={{fontSize:12,color:'var(--text-2)'}}>{typeof c==='object'?c.name||JSON.stringify(c):c}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Languages */}
          {resume.languages?.length > 0 && (
            <Card style={{padding:20}}>
              <SLabel>Languages</SLabel>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {resume.languages.map((l,i)=>(
                  <Chip key={i} color='var(--violet)' bg='rgba(167,139,250,.07)' border='#5b21b6'>
                    {typeof l==='object'?`${l.language||l.name}${l.level?` · ${l.level}`:''}`:l}
                  </Chip>
                ))}
              </div>
            </Card>
          )}

          {/* Tags + Notes */}
          <Card style={{padding:20}}>
            <SLabel>Metadata</SLabel>
            <dl style={{display:'flex',flexDirection:'column',gap:10}}>
              {[
                ['Uploaded by', resume.uploaded_by_name || '—'],
                ['Created',     fmt.dateTime(resume.created_at)],
                ['Updated',     fmt.dateTime(resume.updated_at)],
                ['File',        resume.original_filename],
                ['Active',      resume.is_active ? 'Yes' : 'No'],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
                  <dt className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{k}</dt>
                  <dd className="f-mono" style={{fontSize:11,color:'var(--text-2)',textAlign:'right',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</dd>
                </div>
              ))}
            </dl>
            {resume.tags?.length > 0 && (
              <div style={{marginTop:12}}>
                <p className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:8}}>Tags</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {resume.tags.map((t,i)=><Chip key={i} color='var(--accent)' bg='rgba(245,166,35,.06)' border='rgba(245,166,35,.2)'>{t}</Chip>)}
                </div>
              </div>
            )}
            {resume.notes && (
              <div style={{marginTop:12,padding:'10px 12px',background:'var(--surface)',border:'1px solid var(--border)'}}>
                <p className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>Notes</p>
                <p className="f-sans" style={{fontSize:12,color:'var(--text-2)',lineHeight:1.6}}>{resume.notes}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── EXPERIENCE ── */}
      {section === 'experience' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Card style={{padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <SLabel>Total Experience</SLabel>
              <span className="f-serif" style={{fontSize:28,color:expInfo.color,fontStyle:'italic',lineHeight:1}}>
                {resume.total_experience_years}y
              </span>
            </div>
            <ProgBar pct={Math.min(100,(resume.total_experience_years/15)*100)} color={expInfo.color} height={3} />
          </Card>
          {resume.experience_details?.length > 0 ? resume.experience_details.map((exp,i)=>(
            <Card key={i} style={{padding:20,borderLeft:`2px solid ${expInfo.color}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10,flexWrap:'wrap'}}>
                <div>
                  <p className="f-sans" style={{fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:3}}>{exp.title||exp.position||'—'}</p>
                  <p className="f-mono" style={{fontSize:11,color:'var(--cyan)'}}>{exp.company||exp.organization||'—'}</p>
                </div>
                <div style={{textAlign:'right'}}>
                  {(exp.start_date||exp.from) && (
                    <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>
                      {exp.start_date||exp.from} → {exp.end_date||exp.to||'Present'}
                    </p>
                  )}
                  {exp.location && <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>📍 {exp.location}</p>}
                </div>
              </div>
              {(exp.description||exp.responsibilities) && (
                <p className="f-sans" style={{fontSize:12,lineHeight:1.7,color:'var(--text-2)',whiteSpace:'pre-wrap'}}>{exp.description||exp.responsibilities}</p>
              )}
              {exp.skills?.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:12}}>
                  {exp.skills.map((s,j)=><Chip key={j}>{s}</Chip>)}
                </div>
              )}
            </Card>
          )) : (
            <Card style={{padding:8}}>
              <EmptyState icon="◱" title="No experience details" sub="Experience details will appear here after AI parsing is complete" />
            </Card>
          )}
        </div>
      )}

      {/* ── EDUCATION ── */}
      {section === 'education' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Card style={{padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
              <SLabel>Highest Qualification</SLabel>
              <EduTag level={resume.highest_education} />
            </div>
          </Card>
          {resume.education_details?.length > 0 ? resume.education_details.map((edu,i)=>{
            const eduColor = EDU_COLORS[edu.degree?.toLowerCase()?.replace(/[^a-z]/g,'')] || EDU_COLORS.other;
            return (
              <Card key={i} style={{padding:20,borderLeft:`2px solid ${eduColor.color}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                  <div>
                    <p className="f-sans" style={{fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:3}}>{edu.degree||edu.qualification||'—'}</p>
                    <p className="f-mono" style={{fontSize:11,color:'var(--violet)'}}>{edu.institution||edu.school||edu.university||'—'}</p>
                    {edu.field_of_study && <p className="f-mono" style={{fontSize:10,color:'var(--text-3)',marginTop:3}}>{edu.field_of_study}</p>}
                  </div>
                  <div style={{textAlign:'right'}}>
                    {(edu.start_year||edu.year||edu.graduation_year) && (
                      <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{edu.start_year||''}{edu.end_year?` → ${edu.end_year}`:edu.graduation_year?` → ${edu.graduation_year}`:edu.year?` (${edu.year})`:''}</p>
                    )}
                    {edu.grade && <p className="f-mono" style={{fontSize:10,color:'var(--accent)',marginTop:4}}>GPA / Grade: {edu.grade}</p>}
                  </div>
                </div>
              </Card>
            );
          }) : (
            <Card style={{padding:8}}>
              <EmptyState icon="◲" title="No education details" sub="Education details will appear here after AI parsing is complete" />
            </Card>
          )}
        </div>
      )}

      {/* ── SKILLS ── */}
      {section === 'skills' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <GhostBtn onClick={()=>setAddSkill(p=>!p)} active={addSkill}>{addSkill?'✕ Cancel':'+ Add Skill'}</GhostBtn>
          </div>
          {addSkill && <AddSkillForm resumeId={resumeId} onRefresh={refreshSkills} onClose={()=>setAddSkill(false)} />}
          {skills.length > 0 ? (
            <Card>
              <div className="f-mono" style={{display:'grid',gridTemplateColumns:'1fr 90px 110px 60px 50px',gap:12,padding:'10px 16px',borderBottom:'1px solid var(--border)',fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-3)'}}>
                <span>Name</span><span>Category</span><span>Proficiency</span><span>Yrs</span><span/>
              </div>
              {skills.map(s=><ResumeSkillRow key={s.id} skill={s} resumeId={resumeId} onRefresh={refreshSkills} />)}
            </Card>
          ) : (
            <Card style={{padding:8}}>
              <EmptyState icon="◇" title="No skills added" sub="Add skills manually or wait for AI parsing to extract them" />
            </Card>
          )}
        </div>
      )}

      {/* ── RAW TEXT ── */}
      {section === 'raw' && (
        <Card style={{padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
            <SLabel>Raw Extracted Text</SLabel>
            <GhostBtn onClick={()=>setRawExpanded(p=>!p)}>{rawExpanded?'Collapse':'Expand'}</GhostBtn>
          </div>
          {resume.raw_text ? (
            <div style={{
              maxHeight: rawExpanded ? 'none' : 320,
              overflow: rawExpanded ? 'visible' : 'hidden',
              position:'relative',
            }}>
              <pre className="f-mono" style={{fontSize:10,lineHeight:1.8,color:'var(--text-2)',whiteSpace:'pre-wrap',wordBreak:'break-word',margin:0}}>
                {resume.raw_text}
              </pre>
              {!rawExpanded && (
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:80,background:'linear-gradient(transparent,var(--card))',display:'flex',alignItems:'flex-end',justifyContent:'center',paddingBottom:12}}>
                  <GhostBtn onClick={()=>setRawExpanded(true)}>Show Full Text</GhostBtn>
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon="◻" title="No raw text" sub="Raw text will be extracted during AI parsing" />
          )}
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   EDIT FORM (metadata only)
══════════════════════════════════════════════════════════ */
function ResumeEditForm({ resume, onBack, onSaved }) {
  const [form,setForm] = useState({
    candidate_name:     resume.candidate_name||'',
    candidate_email:    resume.candidate_email||'',
    candidate_phone:    resume.candidate_phone||'',
    candidate_location: resume.candidate_location||'',
    candidate_linkedin: resume.candidate_linkedin||'',
    candidate_github:   resume.candidate_github||'',
    candidate_website:  resume.candidate_website||'',
    tags:  (resume.tags||[]).join(', '),
    notes: resume.notes||'',
    is_active: resume.is_active,
  });
  const [saving,setSaving] = useState(false);

  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      };
      await AxiosInstance.patch(`/api/resumes/v1/resume/?id=${resume.id}`, payload);
      toast.success('Resume updated'); onSaved?.();
    } catch(e) {
      const err = e.response?.data;
      toast.error(typeof err==='string' ? err : err?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="anim-fade-up" style={{maxWidth:680}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24,paddingBottom:20,borderBottom:'1px solid var(--border)',flexWrap:'wrap'}}>
        <button onClick={onBack} className="f-mono" style={{background:'none',border:'none',fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-3)',cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>← Back</button>
        <div style={{flex:1}}>
          <h1 className="f-serif" style={{fontSize:22,color:'var(--text)',lineHeight:1.2}}>Edit Resume</h1>
          <p className="f-mono" style={{fontSize:10,color:'var(--text-3)',marginTop:4}}>{resume.original_filename}</p>
        </div>
        <PrimaryBtn loading={saving} onClick={submit} style={{padding:'10px 28px'}}>✓ Update</PrimaryBtn>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <Card style={{padding:20}}>
          <SLabel>Candidate Info</SLabel>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
            <TxtInput label="Full Name" value={form.candidate_name} onChange={e=>upd('candidate_name',e.target.value)} placeholder="Jane Doe" />
            <TxtInput label="Email" type="email" value={form.candidate_email} onChange={e=>upd('candidate_email',e.target.value)} placeholder="jane@example.com" />
            <TxtInput label="Phone" value={form.candidate_phone} onChange={e=>upd('candidate_phone',e.target.value)} placeholder="+1 555 0000" />
            <TxtInput label="Location" value={form.candidate_location} onChange={e=>upd('candidate_location',e.target.value)} placeholder="New York, NY" />
          </div>
        </Card>

        <Card style={{padding:20}}>
          <SLabel>Online Profiles</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <TxtInput label="LinkedIn URL" value={form.candidate_linkedin} onChange={e=>upd('candidate_linkedin',e.target.value)} placeholder="https://linkedin.com/in/…" />
            <TxtInput label="GitHub URL"   value={form.candidate_github}   onChange={e=>upd('candidate_github',e.target.value)}   placeholder="https://github.com/…" />
            <TxtInput label="Website URL"  value={form.candidate_website}  onChange={e=>upd('candidate_website',e.target.value)}  placeholder="https://…" />
          </div>
        </Card>

        <Card style={{padding:20}}>
          <SLabel>Management</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <TxtInput label="Tags (comma-separated)" value={form.tags} onChange={e=>upd('tags',e.target.value)} placeholder="senior, python, remote…" />
            <TxtArea  label="Internal Notes"          value={form.notes} onChange={e=>upd('notes',e.target.value)} placeholder="Recruiter notes…" style={{minHeight:80}} />
            <label style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',userSelect:'none'}}>
              <span onClick={()=>upd('is_active',!form.is_active)} style={{position:'relative',display:'inline-block',width:38,height:20,flexShrink:0}}>
                <span style={{position:'absolute',inset:0,borderRadius:10,background:form.is_active?'var(--accent)':'var(--border-hi)',transition:'background .2s'}} />
                <span style={{position:'absolute',top:2,width:16,height:16,borderRadius:'50%',background:'white',transition:'left .2s',left:form.is_active?'20px':'2px',boxShadow:'0 1px 4px rgba(0,0,0,.4)'}} />
              </span>
              <span className="f-mono" style={{fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-2)'}}>Active resume</span>
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RESUME CARD (list view)
══════════════════════════════════════════════════════════ */
function ResumeCard({ resume, onSelect, onEdit, onRetry }) {
  const [hov,setHov] = useState(false);
  const sc = RESUME_STATUS_CFG[resume.status] || RESUME_STATUS_CFG.uploaded;
  const expInfo = fmt.exp(resume.total_experience_years || 0);

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>onSelect(resume.id)}
      className="anim-fade-up"
      style={{
        display:'flex', overflow:'hidden', cursor:'pointer',
        background:'var(--card)', border:`1px solid ${hov?'var(--border-hi)':'var(--border)'}`,
        transform:hov?'translateY(-2px)':'none',
        boxShadow:hov?'0 8px 32px rgba(0,0,0,.45)':'none',
        transition:'all .2s ease',
      }}>
      {/* Status bar */}
      <div style={{width:3,background:sc.bar,flexShrink:0}} />

      <div style={{flex:1,minWidth:0,padding:16}}>
        {/* Top row */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:12}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:12,flex:1,minWidth:0}}>
            <CandidateAvatar name={resume.candidate_name} size={36} />
            <div style={{flex:1,minWidth:0}}>
              <h3 className="f-serif" style={{fontSize:14,color:hov?'var(--accent)':'var(--text)',marginBottom:3,lineHeight:1.25,transition:'color .2s',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {resume.candidate_name || <span style={{fontStyle:'italic',color:'var(--text-3)'}}>Unnamed</span>}
              </h3>
              <p className="f-mono" style={{fontSize:9,letterSpacing:'0.1em',color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {resume.candidate_email || resume.original_filename}
              </p>
            </div>
          </div>
          <SPill status={resume.status} />
        </div>

        {/* Location + exp */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
          {resume.candidate_location && <Chip>📍 {resume.candidate_location}</Chip>}
          <Chip color={expInfo.color} bg={`${expInfo.color}12`} border={`${expInfo.color}35`}>
            {resume.total_experience_years}y
          </Chip>
          <EduTag level={resume.highest_education} />
          <FileTag type={resume.file_type} />
          {resume.is_indexed && <Chip color='#34d399' bg='rgba(16,185,129,.06)' border='#065f46'>⬡ Indexed</Chip>}
        </div>

        {/* Tags */}
        {resume.tags?.length > 0 && (
          <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:12}}>
            {resume.tags.slice(0,4).map((t,i)=><Chip key={i} color='var(--accent)' bg='rgba(245,166,35,.06)' border='rgba(245,166,35,.15)'>{t}</Chip>)}
            {resume.tags.length > 4 && <Chip color='var(--text-3)'>+{resume.tags.length-4}</Chip>}
          </div>
        )}

        {/* Footer */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:12,borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',gap:16}} className="f-mono">
            <span style={{fontSize:10,color:'var(--text-3)'}}>
              <span style={{color:'var(--cyan)',fontWeight:600}}>{resume.skills_count||0}</span> skills
            </span>
            {resume.file_size_kb > 0 && <span style={{fontSize:10,color:'var(--text-3)'}}>{fmt.kb(resume.file_size_kb)}</span>}
            <span style={{fontSize:9,color:'var(--text-3)'}}>{fmt.date(resume.created_at)}</span>
          </div>
          <div style={{display:'flex',gap:6,opacity:hov?1:0,transition:'opacity .2s'}} onClick={e=>e.stopPropagation()}>
            {resume.status === 'failed' && (
              <GhostBtn onClick={()=>onRetry(resume)} style={{padding:'4px 10px',fontSize:9,color:'#fb7185',borderColor:'rgba(244,63,94,.3)'}}>↻</GhostBtn>
            )}
            <GhostBtn onClick={()=>onEdit(resume)} style={{padding:'4px 10px'}}>✎</GhostBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FILTERS PANEL
══════════════════════════════════════════════════════════ */
function FiltersPanel({ filters, onChange, onClear }) {
  const STATUS_OPTS  = ['uploaded','parsing','parsed','indexed','failed'];
  const EDU_OPTS     = ['high_school','associate','bachelor','master','mba','phd','other'];
  const FILETYPE_OPTS = ['pdf','docx','doc'];

  return (
    <div className="anim-slide-in" style={{padding:16,marginBottom:20,background:'var(--surface)',border:'1px solid var(--border)'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10}}>
        <input style={{padding:'9px 12px'}} placeholder="Candidate name…" value={filters.candidate_name} onChange={e=>onChange('candidate_name',e.target.value)} />
        <input style={{padding:'9px 12px'}} placeholder="Email…"          value={filters.candidate_email} onChange={e=>onChange('candidate_email',e.target.value)} />
        <input style={{padding:'9px 12px'}} placeholder="Location…"       value={filters.candidate_location} onChange={e=>onChange('candidate_location',e.target.value)} />
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.status} onChange={e=>onChange('status',e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTS.map(s=><option key={s} value={s}>{fmt.label(s)}</option>)}
        </select>
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.highest_education} onChange={e=>onChange('highest_education',e.target.value)}>
          <option value="">All Education</option>
          {EDU_OPTS.map(e=><option key={e} value={e}>{fmt.label(e)}</option>)}
        </select>
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.file_type} onChange={e=>onChange('file_type',e.target.value)}>
          <option value="">All Types</option>
          {FILETYPE_OPTS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
        <input type="number" style={{padding:'9px 12px'}} placeholder="Min exp (yrs)" value={filters.min_experience} onChange={e=>onChange('min_experience',e.target.value)} />
        <input type="number" style={{padding:'9px 12px'}} placeholder="Max exp (yrs)" value={filters.max_experience} onChange={e=>onChange('max_experience',e.target.value)} />
        <input style={{padding:'9px 12px'}} placeholder="Has skill…" value={filters.has_skill} onChange={e=>onChange('has_skill',e.target.value)} />
        <input style={{padding:'9px 12px'}} placeholder="Tag…"       value={filters.tag} onChange={e=>onChange('tag',e.target.value)} />
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.is_active} onChange={e=>onChange('is_active',e.target.value)}>
          <option value="">All Active States</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.is_indexed} onChange={e=>onChange('is_indexed',e.target.value)}>
          <option value="">All Index States</option>
          <option value="true">Indexed Only</option>
          <option value="false">Not Indexed</option>
        </select>
        <GhostBtn onClick={onClear} style={{width:'100%',justifyContent:'center',padding:'9px'}}>✕ Clear</GhostBtn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STATS VIEW
══════════════════════════════════════════════════════════ */
function StatsView({ stats, onRefresh }) {
  const total = stats.total || 1;
  const statusBars = [
    { s:'parsed',   label:'Parsed',   color:'var(--cyan)',     val:stats.by_status?.parsed||0  },
    { s:'indexed',  label:'Indexed',  color:'var(--emerald)',  val:stats.by_status?.indexed||0  },
    { s:'uploaded', label:'Uploaded', color:'var(--text-3)',   val:stats.by_status?.uploaded||0 },
    { s:'parsing',  label:'Parsing',  color:'var(--amber-s)',  val:stats.by_status?.parsing||0  },
    { s:'failed',   label:'Failed',   color:'var(--rose)',     val:stats.by_status?.failed||0   },
  ];
  const eduBars = [
    { key:'bachelor', label:'Bachelor',    color:'var(--accent)',  val:stats.by_education?.bachelor||0 },
    { key:'master',   label:'Master',      color:'var(--violet)',  val:stats.by_education?.master||0   },
    { key:'phd',      label:'PhD',         color:'var(--rose)',    val:stats.by_education?.phd||0      },
    { key:'mba',      label:'MBA',         color:'var(--amber-s)', val:stats.by_education?.mba||0      },
    { key:'associate',label:'Associate',   color:'var(--cyan)',    val:stats.by_education?.associate||0},
    { key:'high_school',label:'High Sch.', color:'var(--text-3)', val:stats.by_education?.high_school||0},
    { key:'other',    label:'Other',       color:'var(--border-hi)',val:stats.by_education?.other||0   },
  ];

  return (
    <div className="anim-fade-up" style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <GhostBtn onClick={onRefresh}>↻ Refresh</GhostBtn>
      </div>

      {/* Big numbers */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
        {[
          { label:'Total Resumes',    val:stats.total||0,          color:'var(--text)',    sub:'uploaded to date'       },
          { label:'Indexed',          val:stats.indexed||0,        color:'var(--emerald)', sub:'in vector store'        },
          { label:'Active',           val:stats.active||0,         color:'var(--cyan)',    sub:'not soft-deleted'       },
          { label:'Avg Experience',   val:`${stats.avg_experience||0}y`, color:'var(--accent)',  sub:'years per candidate' },
        ].map(s=>(
          <Card key={s.label} style={{padding:20}}>
            <p className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:12}}>{s.label}</p>
            <p className="f-serif" style={{fontSize:38,color:s.color,lineHeight:1,marginBottom:4,fontStyle:'italic'}}>{s.val}</p>
            <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Status + Education breakdown */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
        <Card style={{padding:20}}>
          <SLabel>By Parse Status</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {statusBars.map(b=>{
              const pct = total > 0 ? (b.val/total*100) : 0;
              return (
                <div key={b.s}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{display:'flex',alignItems:'center',gap:8}}>
                      <StatusDot status={b.s} size={8} />
                      <span className="f-mono" style={{fontSize:11,color:'var(--text-2)'}}>{b.label}</span>
                    </span>
                    <span>
                      <span className="f-serif" style={{fontSize:18,color:b.color,fontStyle:'italic'}}>{b.val}</span>
                      <span className="f-mono" style={{fontSize:10,color:'var(--text-3)',marginLeft:6}}>({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <ProgBar pct={pct} color={b.color} height={3} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{padding:20}}>
          <SLabel>By Education Level</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {eduBars.map(b=>{
              const pct = total > 0 ? (b.val/total*100) : 0;
              return (
                <div key={b.key}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span className="f-mono" style={{fontSize:11,color:'var(--text-2)'}}>{b.label}</span>
                    <span>
                      <span className="f-serif" style={{fontSize:16,color:b.color,fontStyle:'italic'}}>{b.val}</span>
                      <span className="f-mono" style={{fontSize:9,color:'var(--text-3)',marginLeft:5}}>({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <ProgBar pct={pct} color={b.color} height={2} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   UPLOAD MODAL
══════════════════════════════════════════════════════════ */
function UploadModal({ open, onClose, onDone }) {
  const [mode,setMode]           = useState('single');
  const [bulkSessionId,setBulkSessionId] = useState(null);

  if (!open) return null;

  const handleBulkStarted = (sessionId) => {
    setBulkSessionId(sessionId);
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(7,9,15,.92)',backdropFilter:'blur(20px)'}}>
      <div className="anim-fade-up" style={{background:'var(--card)',border:'1px solid var(--border-hi)',width:'100%',maxWidth:600,maxHeight:'90vh',overflowY:'auto'}}>
        {/* Header */}
        <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <p className="f-serif" style={{fontSize:20,color:'var(--text)',marginBottom:2}}>Upload Resumes</p>
            <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>AI parsing starts automatically after upload</p>
          </div>
          <GhostBtn onClick={onClose} style={{padding:'6px 10px'}}>✕</GhostBtn>
        </div>

        {/* Mode toggle */}
        <div style={{display:'flex',borderBottom:'1px solid var(--border)'}}>
          {[{id:'single',l:'Single File'},{id:'bulk',l:'Bulk Upload'}].map(m=>(
            <button key={m.id} onClick={()=>{ setMode(m.id); setBulkSessionId(null); }} className="f-mono"
              style={{flex:1,fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',padding:'12px 20px',background:'none',border:'none',borderBottom:`2px solid ${mode===m.id?'var(--accent)':'transparent'}`,color:mode===m.id?'var(--accent)':'var(--text-3)',cursor:'pointer',transition:'color .15s'}}>
              {m.l}
            </button>
          ))}
        </div>

        <div style={{padding:24}}>
          {mode === 'single' && <UploadDropZone onUploaded={()=>{ onDone(); onClose(); }} />}
          {mode === 'bulk' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {bulkSessionId ? (
                <BulkProgressCard sessionId={bulkSessionId} onDone={onDone} />
              ) : (
                <BulkUploadForm onBulkStarted={handleBulkStarted} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RETRY MODAL
══════════════════════════════════════════════════════════ */
function RetryModal({ open, resume, onClose, onDone }) {
  const [loading,setLoading] = useState(false);
  if (!open||!resume) return null;

  const submit = async () => {
    setLoading(true);
    try {
      await AxiosInstance.post('/api/resumes/v1/resume/retry-parse/', { resume_ids:[resume.id] });
      toast.success('Retry queued'); onDone();
    } catch(e) { toast.error(e.response?.data?.message||'Retry failed'); } finally { setLoading(false); }
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(7,9,15,.88)',backdropFilter:'blur(16px)'}}>
      <div className="anim-fade-up" style={{background:'var(--card)',border:'1px solid var(--border-hi)',padding:24,maxWidth:380,width:'100%'}}>
        <p className="f-serif" style={{fontSize:18,color:'var(--text)',marginBottom:8}}>Retry Parse</p>
        <p className="f-mono" style={{fontSize:11,color:'var(--text-2)',lineHeight:1.6,marginBottom:24}}>
          Re-queue AI parsing for <span style={{color:'var(--accent)'}}>{resume.candidate_name||resume.original_filename}</span>?
          The previous parse error will be cleared.
        </p>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn loading={loading} onClick={submit} style={{padding:'8px 24px'}}>↻ Retry</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════════════════════ */
const EMPTY_FILTERS = {
  candidate_name:'', candidate_email:'', candidate_location:'',
  status:'', highest_education:'', file_type:'',
  min_experience:'', max_experience:'',
  has_skill:'', tag:'', is_active:'', is_indexed:'',
};

export default function ResumePage() {
  const [view,setView]         = useState('list');   // list | detail | edit
  const [tab,setTab]           = useState('resumes'); // resumes | stats
  const [resumes,setResumes]   = useState([]);
  const [stats,setStats]       = useState({});
  const [loading,setLoading]   = useState(false);
  const [filters,setFilters]   = useState({...EMPTY_FILTERS});
  const [showFilters,setShowFilters] = useState(false);
  const [selectedId,setSelectedId]   = useState(null);
  const [editResume,setEditResume]   = useState(null);
  const [uploadModal,setUploadModal] = useState(false);
  const [deleteTarget,setDeleteTarget] = useState(null);
  const [retryTarget,setRetryTarget]   = useState(null);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k,v])=>{ if(v!=='') params[k]=v; });
      const r = await AxiosInstance.get('/api/resumes/v1/resume/list/', { params });
      setResumes(r.data?.results || r.data?.data || r.data || []);
    } catch { toast.error('Failed to load resumes'); } finally { setLoading(false); }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try { const r = await AxiosInstance.get('/api/resumes/v1/resume/stats/'); setStats(r.data?.data||r.data||{}); } catch {}
  }, []);

  useEffect(() => { loadResumes(); }, [loadResumes]);
  useEffect(() => { if (tab==='stats') loadStats(); }, [tab, loadStats]);

  const openDetail = id => { setSelectedId(id); setView('detail'); };
  const openEdit   = r  => { setEditResume(r);  setView('edit');   };
  const backToList = () => { setView('list'); setSelectedId(null); setEditResume(null); };
  const handleSaved = () => { backToList(); loadResumes(); loadStats(); };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await AxiosInstance.delete(`/api/resumes/v1/resume/?id=${deleteTarget.id}`);
      toast.success(`"${deleteTarget.candidate_name||deleteTarget.original_filename}" removed`);
      setDeleteTarget(null); backToList(); loadResumes(); loadStats();
    } catch { toast.error('Delete failed'); }
  };

  const activeFilterCount = Object.values(filters).filter(v=>v!=='').length;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="noise-overlay" />
      <Toasts />

      <div className="f-sans" style={{background:'var(--bg)',color:'var(--text)',minHeight:'100vh',position:'relative',zIndex:1}}>

        {/* ══ HEADER ══ */}
        <header style={{
          position:'sticky', top:0, zIndex:40,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 24px', height:56,
          background:'rgba(7,9,15,.94)', backdropFilter:'blur(20px)',
          borderBottom:'1px solid var(--border)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:20}}>
            <div style={{display:'flex',alignItems:'baseline',gap:3}}>
              <span className="f-serif" style={{fontSize:20,color:'var(--text)',lineHeight:1}}>Resumes</span>
              <span className="f-serif" style={{fontSize:20,color:'var(--accent)',lineHeight:1}}>.</span>
            </div>
            {view === 'list' && (
              <>
                <span style={{width:1,height:16,background:'var(--border)'}} />
                <span className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)'}}>
                  {tab==='resumes' ? (loading ? '…' : `${resumes.length} candidates`) : 'Analytics'}
                </span>
              </>
            )}
          </div>
          {view === 'list' && tab === 'resumes' && (
            <PrimaryBtn onClick={()=>setUploadModal(true)} style={{padding:'8px 20px'}}>⇡ Upload</PrimaryBtn>
          )}
        </header>

        {/* ══ STATS STRIP ══ */}
        {view === 'list' && (
          <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
            {[
              { label:'Total',   val:stats.total??resumes.length,     color:'var(--text)',    bar:'var(--border-hi)' },
              { label:'Indexed', val:stats.indexed??'—',              color:'var(--emerald)', bar:'var(--emerald)'   },
              { label:'Parsed',  val:stats.by_status?.parsed??'—',    color:'var(--cyan)',    bar:'var(--cyan)'      },
              { label:'Failed',  val:stats.by_status?.failed??'—',    color:'var(--rose)',    bar:'var(--rose)'      },
              { label:'Avg Exp', val:stats.avg_experience ? `${stats.avg_experience}y` : '—', color:'var(--accent)', bar:'var(--accent)' },
            ].map(s=>(
              <div key={s.label} style={{
                position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                padding:'10px 24px', minWidth:96, flexShrink:0, overflow:'hidden',
                borderRight:'1px solid var(--border)',
              }}>
                <span className="f-serif" style={{fontSize:24,color:s.color,lineHeight:1,marginBottom:4,fontStyle:'italic'}}>{s.val}</span>
                <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{s.label}</span>
                <span style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:s.bar,opacity:.4}} />
              </div>
            ))}
          </div>
        )}

        {/* ══ TABS ══ */}
        {view === 'list' && (
          <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>
            {[{id:'resumes',l:'All Resumes'},{id:'stats',l:'Analytics'}].map(n=>(
              <button key={n.id} onClick={()=>setTab(n.id)} className="f-mono"
                style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',padding:'12px 24px',background:'none',border:'none',borderBottom:`2px solid ${tab===n.id?'var(--accent)':'transparent'}`,color:tab===n.id?'var(--accent)':'var(--text-3)',cursor:'pointer',transition:'color .15s'}}>
                {n.l}
              </button>
            ))}
          </div>
        )}

        {/* ══ CONTENT ══ */}
        <main style={{maxWidth:1200,margin:'0 auto',padding:'28px 24px'}}>

          {/* ── Resume List ── */}
          {view === 'list' && tab === 'resumes' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:20}}>
                <div style={{display:'flex',gap:8}}>
                  <GhostBtn onClick={()=>setShowFilters(p=>!p)} active={showFilters}>
                    ⊟ Filters{activeFilterCount>0?` · ${activeFilterCount}`:''}
                  </GhostBtn>
                  {activeFilterCount > 0 && <GhostBtn onClick={()=>setFilters({...EMPTY_FILTERS})}>✕ Clear</GhostBtn>}
                  <GhostBtn onClick={loadResumes}>↻</GhostBtn>
                </div>
                <span className="f-mono" style={{fontSize:10,color:'var(--text-3)',display:'flex',alignItems:'center',gap:8}}>
                  {loading ? <><Spinner size={10}/> Loading…</> : `${resumes.length} resume${resumes.length!==1?'s':''}`}
                </span>
              </div>

              {showFilters && <FiltersPanel filters={filters} onChange={(k,v)=>setFilters(p=>({...p,[k]:v}))} onClear={()=>setFilters({...EMPTY_FILTERS})} />}

              {loading ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
                  {[...Array(6)].map((_,i)=>(
                    <div key={i} style={{display:'flex',overflow:'hidden',background:'var(--card)',border:'1px solid var(--border)'}}>
                      <div style={{width:3,background:'var(--border-hi)',flexShrink:0}} />
                      <div style={{flex:1,padding:16,display:'flex',flexDirection:'column',gap:12}}>
                        <div style={{display:'flex',gap:12,alignItems:'center'}}><Skel width={36} height={36}/><div style={{flex:1}}><Skel width='60%' height={14}/><div style={{height:5}}/><Skel width='35%' height={10}/></div></div>
                        <div style={{display:'flex',gap:6}}><Skel width={60} height={18}/><Skel width={75} height={18}/><Skel width={55} height={18}/></div>
                        <Skel width='100%' height={1} /><Skel width='40%' height={10} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : resumes.length > 0 ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
                  {resumes.map(r=>(
                    <ResumeCard key={r.id} resume={r}
                      onSelect={openDetail}
                      onEdit={openEdit}
                      onRetry={r=>setRetryTarget(r)} />
                  ))}
                </div>
              ) : (
                <div style={{background:'var(--card)',border:'1px solid var(--border)'}}>
                  <EmptyState
                    icon={activeFilterCount>0?'◎':'◧'}
                    title={activeFilterCount>0?'No resumes match filters':'No resumes uploaded yet'}
                    sub={activeFilterCount>0?'Try adjusting or clearing your filter criteria':'Upload candidate resumes to start AI-powered parsing and screening'}
                    action={activeFilterCount>0
                      ? <GhostBtn onClick={()=>setFilters({...EMPTY_FILTERS})}>Clear Filters</GhostBtn>
                      : <PrimaryBtn onClick={()=>setUploadModal(true)} style={{padding:'10px 32px'}}>⇡ Upload First Resume</PrimaryBtn>}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Stats ── */}
          {view === 'list' && tab === 'stats' && (
            <StatsView stats={stats} onRefresh={()=>{ loadStats(); loadResumes(); }} />
          )}

          {/* ── Detail ── */}
          {view === 'detail' && selectedId && (
            <ResumeDetail
              resumeId={selectedId}
              onBack={backToList}
              onEdit={openEdit}
              onDelete={r=>setDeleteTarget(r)} />
          )}

          {/* ── Edit ── */}
          {view === 'edit' && editResume && (
            <ResumeEditForm resume={editResume} onBack={backToList} onSaved={handleSaved} />
          )}
        </main>

        <footer style={{borderTop:'1px solid var(--border)',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:40}}>
          <span className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)'}}>Resumes · Recruitment Platform</span>
          <span className="f-serif" style={{fontSize:14,color:'var(--border-hi)',fontStyle:'italic'}}>◈</span>
        </footer>
      </div>

      {/* ══ MODALS ══ */}
      <UploadModal
        open={uploadModal}
        onClose={()=>setUploadModal(false)}
        onDone={()=>{ loadResumes(); loadStats(); }} />

      <RetryModal
        open={!!retryTarget}
        resume={retryTarget}
        onClose={()=>setRetryTarget(null)}
        onDone={()=>{ setRetryTarget(null); loadResumes(); }} />

      <ConfirmModal
        open={!!deleteTarget}
        title="Remove this resume?"
        confirmLabel="Confirm Delete"
        message={`"${deleteTarget?.candidate_name||deleteTarget?.original_filename}" will be soft-deleted and removed from active views.`}
        onConfirm={doDelete}
        onCancel={()=>setDeleteTarget(null)} />
    </>
  );
}