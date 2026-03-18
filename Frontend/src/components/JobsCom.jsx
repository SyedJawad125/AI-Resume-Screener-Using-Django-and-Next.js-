'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import AxiosInstance from '@/components/AxiosInstance';

/* ══════════════════════════════════════════════════════════
   GLOBAL STYLES — fonts, keyframes, CSS vars, utilities
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

  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes livePulse{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
  @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

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
  input[type=range] { accent-color: var(--accent); cursor:pointer; }

  ::-webkit-scrollbar { width:3px; height:3px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border-hi); border-radius:2px; }
`;

/* ══════════════════════════════════════════════════════════
   STATUS CONFIG
══════════════════════════════════════════════════════════ */
const STATUS_CFG = {
  draft:    { bar:'#3d4a6b', dot:'#4a5470', bg:'rgba(61,74,107,.1)',  border:'#2a3350', color:'#6b7394',  label:'Draft'    },
  active:   { bar:'#22d3ee', dot:'#22d3ee', bg:'rgba(34,211,238,.08)',border:'#0e7490', color:'#22d3ee',  label:'Active', live:true },
  paused:   { bar:'#fb923c', dot:'#fb923c', bg:'rgba(251,146,60,.1)', border:'#c2410c', color:'#fb923c',  label:'Paused'   },
  closed:   { bar:'#f43f5e', dot:'#f43f5e', bg:'rgba(244,63,94,.1)',  border:'#9f1239', color:'#f43f5e',  label:'Closed'   },
  archived: { bar:'#1e2535', dot:'#2a3350', bg:'rgba(28,34,53,.4)',   border:'#1e2535', color:'#2a3350',  label:'Archived' },
};

const IMP_CFG = {
  nice_to_have: { bg:'rgba(74,84,112,.12)',  border:'#2a3350', color:'#6b7394' },
  preferred:    { bg:'rgba(34,211,238,.07)', border:'#0e7490', color:'#67e8f9' },
  required:     { bg:'rgba(245,166,35,.1)',  border:'#92400e', color:'#fbbf24' },
  must_have:    { bg:'rgba(244,63,94,.1)',   border:'#9f1239', color:'#fb7185' },
};

const JOB_STATUS = ['draft','active','paused','closed','archived'];
const EXP_LEVELS = ['intern','junior','mid','senior','lead','executive'];
const EMP_TYPES  = ['full_time','part_time','contract','freelance','internship'];
const SKILL_IMP  = ['nice_to_have','preferred','required','must_have'];

const fmt = {
  label: s => s ? s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : '—',
  date:  d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—',
  salary:(min,max,cur='USD') => {
    if (!min && !max) return null;
    const f = n => n ? Number(n).toLocaleString() : null;
    return [f(min),f(max)].filter(Boolean).join(' – ') + ` ${cur}`;
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
  const [toasts,setToasts]=useState([]);
  useEffect(()=>{ _setToasts=setToasts; },[]);
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:8,pointerEvents:'none'}}>
      {toasts.map(t=>{
        const c=T_CFG[t.type];
        return (
          <div key={t.id} className="anim-fade-up f-mono" style={{
            background:c.bg, border:`1px solid ${c.border}`, color:c.color,
            padding:'10px 16px', display:'flex', alignItems:'center', gap:12,
            minWidth:260, maxWidth:360, pointerEvents:'auto', fontSize:11,
          }}>
            <span style={{fontWeight:600, width:16, textAlign:'center'}}>[{c.icon}]</span>
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

function StatusDot({ status, size=6 }) {
  const c = STATUS_CFG[status];
  return (
    <span style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',width:size+6,height:size+6}}>
      {c?.live && <span className="anim-live" style={{position:'absolute',width:size+4,height:size+4,borderRadius:'50%',background:c.dot,opacity:.3}} />}
      <span style={{width:size,height:size,borderRadius:'50%',background:c?.dot||'#4a5470'}} />
    </span>
  );
}

function SPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.draft;
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

function ImpTag({ importance }) {
  const c = IMP_CFG[importance] || IMP_CFG.required;
  return (
    <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 8px',background:c.bg,border:`1px solid ${c.border}`,color:c.color}}>
      {fmt.label(importance)}
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
    <div className={`anim-fade-up ${className}`}
      style={{background:'var(--card)',border:'1px solid var(--border)',...style}}>
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
      display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s',
      ...style,
    }} {...p}>
      {loading ? <><Spinner size={12} color='#07090f'/>{loadingText}</> : children}
    </button>
  );
}

function GhostBtn({ children, active=false, style={}, ...p }) {
  const [hov,setHov]=useState(false);
  return (
    <button
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
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
  const [hov,setHov]=useState(false);
  return (
    <button
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: hov ? 'rgba(244,63,94,.08)' : 'transparent',
        border:'1px solid rgba(244,63,94,.35)', color:'#f43f5e',
        fontFamily:'IBM Plex Mono,monospace', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase',
        padding:'6px 12px', cursor:'pointer', transition:'all .15s', ...style,
      }} {...p}>
      {children}
    </button>
  );
}

function TxtInput({ label, ...p }) {
  return (
    <div>
      {label && <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>{label}</label>}
      <input style={{width:'100%',padding:'10px 12px',display:'block',boxSizing:'border-box'}} {...p} />
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

function TxtArea({ label, ...p }) {
  return (
    <div>
      {label && <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>{label}</label>}
      <textarea style={{width:'100%',padding:'10px 12px',display:'block',boxSizing:'border-box',minHeight:100}} {...p} />
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',userSelect:'none'}}>
      <span onClick={onChange} style={{position:'relative',display:'inline-block',width:38,height:20,flexShrink:0}}>
        <span style={{position:'absolute',inset:0,borderRadius:10,background:checked?'var(--accent)':'var(--border-hi)',transition:'background .2s'}} />
        <span style={{position:'absolute',top:2,width:16,height:16,borderRadius:'50%',background:'white',transition:'left .2s',left:checked?'20px':'2px',boxShadow:'0 1px 4px rgba(0,0,0,.4)'}} />
      </span>
      {label && <span className="f-mono" style={{fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-2)'}}>{label}</span>}
    </label>
  );
}

function ProgBar({ pct=0, color='var(--accent)', height=2 }) {
  return (
    <div style={{height,background:'var(--border)',overflow:'hidden'}}>
      <div style={{width:`${Math.min(100,pct)}%`,height:'100%',background:color,transition:'width .5s ease'}} />
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
        {sub && <p className="f-mono" style={{fontSize:11,color:'var(--text-3)',lineHeight:1.6,maxWidth:280,margin:'0 auto'}}>{sub}</p>}
      </div>
      {action && <div style={{marginTop:8}}>{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONFIRM MODAL
══════════════════════════════════════════════════════════ */
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
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
          <DangerBtn onClick={onConfirm}>Confirm Archive</DangerBtn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STATUS MODAL
══════════════════════════════════════════════════════════ */
function StatusModal({ open, job, onClose, onDone }) {
  const [sel,setSel]=useState('');
  const [loading,setLoading]=useState(false);
  useEffect(()=>{ if(job) setSel(job.status); },[job]);
  if (!open||!job) return null;

  const submit = async () => {
    if (sel===job.status){ onClose(); return; }
    setLoading(true);
    try {
      await AxiosInstance.patch(`/api/jobs/v1/job/toggle/?id=${job.id}`,{status:sel});
      toast.success(`Status → ${sel}`); onDone();
    } catch(e){ toast.error(e.response?.data?.message||'Toggle failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(7,9,15,.88)',backdropFilter:'blur(16px)'}}>
      <div className="anim-fade-up" style={{background:'var(--card)',border:'1px solid var(--border-hi)',width:'100%',maxWidth:380}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)'}}>
          <p className="f-serif" style={{fontSize:18,color:'var(--text)',marginBottom:4}}>Change Status</p>
          <p className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>{job.title}</p>
        </div>
        <div style={{padding:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {JOB_STATUS.filter(s=>s!=='archived').map(s=>{
            const c=STATUS_CFG[s]; const isSel=sel===s;
            return (
              <button key={s} onClick={()=>setSel(s)} style={{
                display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',
                background: isSel ? c.bg : 'var(--surface)',
                border: `1px solid ${isSel ? c.border : 'var(--border)'}`,
                boxShadow: isSel ? `0 0 16px ${c.dot}20` : 'none',
                transition:'all .15s',
              }}>
                <StatusDot status={s} size={8} />
                <span className="f-mono" style={{fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',color:isSel?c.color:'var(--text-2)'}}>{c.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{padding:'0 16px 16px',display:'flex',gap:8,justifyContent:'flex-end'}}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn loading={loading} onClick={submit} style={{padding:'8px 24px'}}>Apply</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SKILL ROW
══════════════════════════════════════════════════════════ */
function SkillRow({ skill, jobId, onRefresh }) {
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({name:skill.name,category:skill.category,importance:skill.importance,years_required:skill.years_required});
  const [saving,setSaving]=useState(false);
  const [hov,setHov]=useState(false);

  const save = async () => {
    setSaving(true);
    try { await AxiosInstance.patch(`/api/jobs/v1/job/skills/?job_id=${jobId}&id=${skill.id}`,form); toast.success('Skill updated'); setEditing(false); onRefresh(); }
    catch { toast.error('Save failed'); } finally { setSaving(false); }
  };
  const remove = async () => {
    try { await AxiosInstance.delete(`/api/jobs/v1/job/skills/?job_id=${jobId}&id=${skill.id}`); toast.info(`Removed "${skill.name}"`); onRefresh(); }
    catch { toast.error('Delete failed'); }
  };

  if (editing) return (
    <div style={{padding:14,background:'var(--card-alt)',borderLeft:'2px solid var(--accent)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        <input style={{padding:'8px 10px',gridColumn:'1/-1'}} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Skill name" />
        <input style={{padding:'8px 10px'}} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} placeholder="Category" />
        <input type="number" min={0} step={0.5} style={{padding:'8px 10px'}} value={form.years_required} onChange={e=>setForm(p=>({...p,years_required:+e.target.value}))} placeholder="Years req." />
        <select style={{padding:'8px 10px',gridColumn:'1/-1',cursor:'pointer'}} value={form.importance} onChange={e=>setForm(p=>({...p,importance:e.target.value}))}>
          {SKILL_IMP.map(i=><option key={i} value={i}>{fmt.label(i)}</option>)}
        </select>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <GhostBtn onClick={()=>setEditing(false)}>Cancel</GhostBtn>
        <PrimaryBtn loading={saving} onClick={save} style={{padding:'7px 18px'}}>Save</PrimaryBtn>
      </div>
    </div>
  );

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        display:'flex',alignItems:'center',gap:12,padding:'10px 16px',
        borderBottom:'1px solid var(--border)',
        background: hov ? 'var(--card-alt)' : 'transparent',
        transition:'background .15s',
      }}>
      <div style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:12}}>
        <span className="f-sans" style={{fontSize:13,fontWeight:500,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{skill.name}</span>
        {skill.category && <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{skill.category}</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <ImpTag importance={skill.importance} />
        {skill.years_required>0 && <span className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{skill.years_required}y</span>}
        <div style={{display:'flex',gap:6,opacity:hov?1:0,transition:'opacity .15s'}}>
          {[['✎','var(--accent)',()=>setEditing(true)],['✕','#f43f5e',remove]].map(([icon,hc,fn])=>{
            const [bh,setBh]=useState(false);
            return <button key={icon} onClick={fn} onMouseEnter={()=>setBh(true)} onMouseLeave={()=>setBh(false)}
              style={{background:'none',border:'none',cursor:'pointer',color:bh?hc:'var(--text-3)',fontSize:12,transition:'color .15s',padding:0}}>{icon}</button>;
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADD SKILL FORM
══════════════════════════════════════════════════════════ */
function AddSkillForm({ jobId, onRefresh, onClose }) {
  const [form,setForm]=useState({name:'',category:'',importance:'required',years_required:0});
  const [saving,setSaving]=useState(false);
  const submit = async () => {
    if (!form.name.trim()){ toast.warn('Skill name required'); return; }
    setSaving(true);
    try { await AxiosInstance.post(`/api/jobs/v1/job/skills/?job_id=${jobId}`,form); toast.success(`Added "${form.name}"`); setForm({name:'',category:'',importance:'required',years_required:0}); onRefresh(); onClose?.(); }
    catch(e){ toast.error(e.response?.data?.message||'Failed'); } finally { setSaving(false); }
  };
  return (
    <div className="anim-slide-in" style={{padding:16,background:'var(--surface)',border:'1px solid var(--border-hi)',borderLeft:'2px solid var(--accent)'}}>
      <SLabel>Add New Skill</SLabel>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        <input style={{padding:'9px 12px',gridColumn:'1/-1'}} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Skill name (e.g. React, Python, SQL)" />
        <input style={{padding:'9px 12px'}} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} placeholder="Category (technical / soft)" />
        <input type="number" min={0} step={0.5} style={{padding:'9px 12px'}} value={form.years_required} onChange={e=>setForm(p=>({...p,years_required:+e.target.value}))} placeholder="Years required" />
        <select style={{padding:'9px 12px',gridColumn:'1/-1',cursor:'pointer'}} value={form.importance} onChange={e=>setForm(p=>({...p,importance:e.target.value}))}>
          {SKILL_IMP.map(i=><option key={i} value={i}>{fmt.label(i)}</option>)}
        </select>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        {onClose && <GhostBtn onClick={onClose}>Cancel</GhostBtn>}
        <PrimaryBtn loading={saving} onClick={submit} style={{padding:'8px 20px'}}>+ Add Skill</PrimaryBtn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   JOB DETAIL
══════════════════════════════════════════════════════════ */
function JobDetail({ jobId, onBack, onEdit, onStatusChange, onDelete }) {
  const [job,setJob]=useState(null);
  const [skills,setSkills]=useState([]);
  const [loading,setLoading]=useState(true);
  const [analyzing,setAnalyzing]=useState(false);
  const [addSkill,setAddSkill]=useState(false);
  const [statusModal,setStatusModal]=useState(false);
  const [section,setSection]=useState('overview');

  const load = useCallback(async()=>{
    setLoading(true);
    try { const r=await AxiosInstance.get(`/api/jobs/v1/job/?id=${jobId}`); const d=r.data?.data||r.data; setJob(d); setSkills(d.skills||[]); }
    catch { toast.error('Failed to load job'); } finally { setLoading(false); }
  },[jobId]);

  const refreshSkills = async()=>{
    try { const r=await AxiosInstance.get(`/api/jobs/v1/job/skills/?job_id=${jobId}`); setSkills(r.data?.data||r.data||[]); } catch {}
  };

  const triggerAnalysis = async()=>{
    setAnalyzing(true);
    try { await AxiosInstance.post(`/api/jobs/v1/job/analyze/?id=${jobId}`); toast.success('AI analysis queued'); }
    catch(e){ toast.error(e.response?.data?.message||'Analysis failed'); } finally { setAnalyzing(false); }
  };

  useEffect(()=>{ load(); },[load]);

  if (loading) return (
    <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:880}}>
      {[...Array(3)].map((_,i)=>(
        <div key={i} style={{padding:20,background:'var(--card)',border:'1px solid var(--border)'}}>
          <Skel width='40%' height={18} /><div style={{height:8}}/><Skel width='100%' height={12} /><div style={{height:6}}/><Skel width='75%' height={12} />
        </div>
      ))}
    </div>
  );
  if (!job) return null;

  const sc = STATUS_CFG[job.status]||STATUS_CFG.draft;
  const SECS=[{id:'overview',l:'Overview'},{id:'description',l:'Description'},{id:'skills',l:`Skills (${skills.length})`},{id:'analysis',l:'AI Analysis'}];

  return (
    <div className="anim-fade-up" style={{maxWidth:880}}>
      {/* Breadcrumb + actions */}
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:24}}>
        <button onClick={onBack} className="f-mono" style={{fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',background:'none',border:'none',color:'var(--text-3)',cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>← All Jobs</button>
        <span className="f-mono" style={{fontSize:10,color:'var(--border-hi)'}}>/</span>
        <span className="f-mono" style={{fontSize:10,color:'var(--text-2)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:200,whiteSpace:'nowrap'}}>{job.title}</span>
        <div style={{flex:1}}/>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          <GhostBtn onClick={()=>setStatusModal(true)}>⇄ Status</GhostBtn>
          <GhostBtn onClick={()=>onEdit(job)}>✎ Edit</GhostBtn>
          <PrimaryBtn onClick={triggerAnalysis} loading={analyzing} loadingText="Queuing…" style={{padding:'8px 16px'}}>⚡ Analyze</PrimaryBtn>
          <DangerBtn onClick={()=>onDelete(job)}>Archive</DangerBtn>
        </div>
      </div>

      {/* Hero */}
      <div style={{padding:24,marginBottom:2,background:'var(--card)',border:'1px solid var(--border)',borderLeft:`3px solid ${sc.bar}`}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:16,flexWrap:'wrap'}}>
          <div>
            <h1 className="f-serif" style={{fontSize:28,color:'var(--text)',marginBottom:6,lineHeight:1.15}}>{job.title}</h1>
            <p className="f-mono" style={{fontSize:10,color:'var(--text-3)',letterSpacing:'0.15em',textTransform:'uppercase'}}>
              {job.company_name}{job.department?` · ${job.department}`:''}
            </p>
          </div>
          <SPill status={job.status} />
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          <Chip color='#67e8f9' bg='rgba(34,211,238,.07)' border='#0e7490'>{fmt.label(job.experience_level)}</Chip>
          <Chip color='var(--violet)' bg='rgba(167,139,250,.07)' border='#5b21b6'>{fmt.label(job.employment_type)}</Chip>
          {job.is_remote && <Chip color='#34d399' bg='rgba(16,185,129,.07)' border='#065f46'>Remote</Chip>}
          {job.location && <Chip>📍 {job.location}</Chip>}
          {fmt.salary(job.salary_min,job.salary_max,job.salary_currency) && <Chip color='var(--accent)' bg='rgba(245,166,35,.08)' border='#92400e'>{fmt.salary(job.salary_min,job.salary_max,job.salary_currency)}</Chip>}
          <Chip>{job.min_experience_years}–{job.max_experience_years??'∞'} yrs exp</Chip>
        </div>
      </div>

      {/* Section nav */}
      <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',marginBottom:24}}>
        {SECS.map(s=>(
          <button key={s.id} onClick={()=>setSection(s.id)} className="f-mono"
            style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',padding:'12px 20px',borderBottom:`2px solid ${section===s.id?'var(--accent)':'transparent'}`,color:section===s.id?'var(--accent)':'var(--text-3)',background:'none',border:`none`,borderBottom:`2px solid ${section===s.id?'var(--accent)':'transparent'}`,cursor:'pointer',transition:'color .15s',whiteSpace:'nowrap'}}>
            {s.l}
          </button>
        ))}
      </div>

      {/* Overview */}
      {section==='overview' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          <Card style={{padding:20}}>
            <SLabel>Scoring Weights</SLabel>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {job.score_weights && Object.entries(job.score_weights).map(([k,v])=>(
                <div key={k}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span className="f-mono" style={{fontSize:11,color:'var(--text-2)'}}>{fmt.label(k)}</span>
                    <span className="f-serif" style={{fontSize:16,color:'var(--accent)',lineHeight:1}}>{(v*100).toFixed(0)}%</span>
                  </div>
                  <ProgBar pct={v*100} />
                </div>
              ))}
            </div>
          </Card>
          <Card style={{padding:20}}>
            <SLabel>Position Details</SLabel>
            <dl style={{display:'flex',flexDirection:'column',gap:10}}>
              {[['Education',fmt.label(job.education_requirement)||'Not specified'],['Screenings',job.screening_count],['Created by',job.created_by_name||'—'],['Updated by',job.updated_by_name||'—'],['Created',fmt.date(job.created_at)],['Updated',fmt.date(job.updated_at)]].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
                  <dt className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{k}</dt>
                  <dd className="f-mono" style={{fontSize:11,color:'var(--text-2)'}}>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          {job.extracted_keywords?.length>0 && (
            <Card style={{padding:20,gridColumn:'1/-1'}}>
              <SLabel>AI-Extracted Keywords</SLabel>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {job.extracted_keywords.map((kw,i)=><Chip key={i}>{kw}</Chip>)}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Description */}
      {section==='description' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {[
            {label:'Job Description',text:job.description,accent:'var(--accent)'},
            {label:'Responsibilities',text:job.responsibilities,accent:'var(--cyan)'},
            {label:'Requirements',text:job.requirements,accent:'var(--violet)'},
            {label:'Nice to Have',text:job.nice_to_have,accent:'var(--emerald)'},
            {label:'Benefits & Perks',text:job.benefits,accent:'var(--amber-s)'},
          ].filter(f=>f.text).map(f=>(
            <Card key={f.label} style={{padding:20,borderLeft:`2px solid ${f.accent}`}}>
              <SLabel>{f.label}</SLabel>
              <p className="f-sans" style={{fontSize:13,lineHeight:1.75,color:'var(--text-2)',whiteSpace:'pre-wrap'}}>{f.text}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Skills */}
      {section==='skills' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <GhostBtn onClick={()=>setAddSkill(p=>!p)} active={addSkill}>{addSkill?'✕ Cancel':'+ Add Skill'}</GhostBtn>
          </div>
          {addSkill && <AddSkillForm jobId={jobId} onRefresh={refreshSkills} onClose={()=>setAddSkill(false)} />}
          {skills.length>0 ? (
            <Card>
              <div className="f-mono" style={{display:'grid',gridTemplateColumns:'1fr 100px 130px 50px',gap:16,padding:'10px 16px',borderBottom:'1px solid var(--border)',fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-3)'}}>
                <span>Name</span><span>Category</span><span>Importance</span><span>Yrs</span>
              </div>
              {skills.map(s=><SkillRow key={s.id} skill={s} jobId={jobId} onRefresh={refreshSkills} />)}
            </Card>
          ) : <EmptyState icon="◇" title="No skills added" sub="Define required skills to power AI-based candidate matching" />}
        </div>
      )}

      {/* Analysis */}
      {section==='analysis' && (
        <div>
          {job.analysis ? (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <Card style={{padding:20}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:16}}>
                  <SLabel>AI Analysis</SLabel>
                  <div style={{display:'flex',gap:6}}>
                    {job.analysis.seniority_level && <Chip color='var(--violet)' bg='rgba(167,139,250,.08)' border='#5b21b6'>{job.analysis.seniority_level}</Chip>}
                    {job.analysis.model_used && <Chip>{job.analysis.model_used}</Chip>}
                  </div>
                </div>
                {job.analysis.summary && <p className="f-sans" style={{fontSize:13,lineHeight:1.75,color:'var(--text-2)',borderLeft:'2px solid var(--accent)',paddingLeft:16,marginBottom:16}}>{job.analysis.summary}</p>}
                {job.analysis.ideal_candidate_profile && <>
                  <SLabel>Ideal Candidate Profile</SLabel>
                  <p className="f-sans" style={{fontSize:13,lineHeight:1.75,color:'var(--text-2)'}}>{job.analysis.ideal_candidate_profile}</p>
                </>}
              </Card>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
                {[
                  {label:'Technical Stack',data:job.analysis.technical_stack,color:'#67e8f9',bg:'rgba(34,211,238,.07)',border:'#0e7490'},
                  {label:'Soft Skills',data:job.analysis.soft_skills,color:'var(--violet)',bg:'rgba(167,139,250,.07)',border:'#5b21b6'},
                  {label:'Domain Knowledge',data:job.analysis.domain_knowledge,color:'#34d399',bg:'rgba(16,185,129,.07)',border:'#065f46'},
                  {label:'Red Flags',data:job.analysis.red_flags,color:'#fb7185',bg:'rgba(244,63,94,.07)',border:'#9f1239'},
                ].filter(g=>g.data?.length>0).map(g=>(
                  <Card key={g.label} style={{padding:16}}>
                    <SLabel>{g.label}</SLabel>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{g.data.map((item,i)=><Chip key={i} color={g.color} bg={g.bg} border={g.border}>{item}</Chip>)}</div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card style={{padding:8}}>
              <EmptyState icon="⊙" title="No analysis yet" sub="Run AI analysis to extract the tech stack, skills, red flags, and build an ideal candidate profile"
                action={<PrimaryBtn onClick={triggerAnalysis} loading={analyzing} loadingText="Queuing…" style={{padding:'10px 32px'}}>⚡ Run AI Analysis</PrimaryBtn>} />
            </Card>
          )}
        </div>
      )}

      <StatusModal open={statusModal} job={job} onClose={()=>setStatusModal(false)} onDone={()=>{ setStatusModal(false); load(); onStatusChange?.(); }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   JOB FORM
══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   COMPANY DROPDOWN
   Matches CompanyCom data shape:
     { id, name, logo, slug, email, is_active, subscription_plan }
   Endpoint: GET /api/user/v1/company/  →  response.data.data
══════════════════════════════════════════════════════════ */
const PLAN_COLORS = {
  free:         { bg:'rgba(100,116,139,.15)', border:'#334155', color:'#94a3b8' },
  starter:      { bg:'rgba(59,130,246,.1)',   border:'#1e40af', color:'#93c5fd' },
  professional: { bg:'rgba(245,158,11,.1)',   border:'#92400e', color:'#fbbf24' },
  enterprise:   { bg:'rgba(167,139,250,.1)',  border:'#5b21b6', color:'#c4b5fd' },
};

function CompanyDropdown({ companies=[], loading, value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = companies.find(c => String(c.id) === String(value));

  // Close on outside click
  useEffect(()=>{
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  },[]);

  const pick = (id) => { onChange(id); setOpen(false); };

  return (
    <div style={{gridColumn:'1/-1'}} ref={ref}>
      <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>
        Company *
      </label>

      {/* Trigger button */}
      <button type="button" onClick={()=>setOpen(p=>!p)} style={{
        width:'100%', display:'flex', alignItems:'center', gap:10,
        padding:'10px 12px', cursor:'pointer', boxSizing:'border-box',
        background:'var(--surface)', border:`1px solid ${error?'rgba(244,63,94,.6)':open?'var(--accent)':'var(--border)'}`,
        transition:'border-color .15s', textAlign:'left',
      }}>
        {loading ? (
          <span style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
            <Spinner size={14}/><span className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>Loading companies…</span>
          </span>
        ) : selected ? (
          <>
            {/* Logo / initial */}
            <span style={{
              width:28,height:28,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',
              background:'rgba(245,166,35,.08)',border:'1px solid rgba(245,166,35,.2)',
            }}>
              {selected.logo
                ? <img src={selected.logo} alt={selected.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <span className="f-serif" style={{fontSize:13,color:'var(--accent)',fontStyle:'italic',fontWeight:700,lineHeight:1}}>
                    {selected.name?.charAt(0)?.toUpperCase()||'C'}
                  </span>
              }
            </span>
            <span style={{flex:1,minWidth:0}}>
              <span className="f-sans" style={{fontSize:13,fontWeight:500,color:'var(--text)',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {selected.name}
              </span>
              {selected.slug && (
                <span className="f-mono" style={{fontSize:9,color:'var(--text-3)',letterSpacing:'0.1em'}}>/{selected.slug}</span>
              )}
            </span>
            {/* Plan badge */}
            {selected.subscription_plan && (()=>{
              const pc = PLAN_COLORS[selected.subscription_plan]||PLAN_COLORS.free;
              return (
                <span className="f-mono" style={{fontSize:8,letterSpacing:'0.15em',textTransform:'uppercase',padding:'2px 6px',background:pc.bg,border:`1px solid ${pc.border}`,color:pc.color,flexShrink:0}}>
                  {selected.subscription_plan}
                </span>
              );
            })()}
            {/* Active dot */}
            <span style={{width:7,height:7,borderRadius:'50%',flexShrink:0,background:selected.is_active?'#22d3ee':'#f43f5e'}} />
          </>
        ) : (
          <span className="f-mono" style={{fontSize:11,color:'var(--text-3)',flex:1}}>— Select company —</span>
        )}
        {/* Chevron */}
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{flexShrink:0,transform:open?'rotate(180deg)':'none',transition:'transform .2s',color:'var(--text-3)'}}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {error && (
        <span className="f-mono" style={{display:'block',fontSize:9,color:'#f43f5e',marginTop:4,letterSpacing:'0.1em'}}>
          Company is required
        </span>
      )}

      {/* Dropdown list */}
      {open && (
        <div className="anim-slide-in" style={{
          position:'absolute', zIndex:200, left:0, right:0, marginTop:2,
          background:'var(--card-alt)', border:'1px solid var(--border-hi)',
          maxHeight:260, overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,.5)',
        }}>
          {companies.length===0 ? (
            <div style={{padding:'20px 16px',textAlign:'center'}}>
              <span className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>No companies found</span>
            </div>
          ) : companies.map(c=>{
            const isSelected = String(c.id)===String(value);
            const pc = PLAN_COLORS[c.subscription_plan]||PLAN_COLORS.free;
            return (
              <button key={c.id} type="button" onClick={()=>pick(c.id)}
                style={{
                  width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',
                  background: isSelected ? 'rgba(245,166,35,.08)' : 'transparent',
                  borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                  border:'none', borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                  borderBottom:'1px solid var(--border)', transition:'background .1s',
                  textAlign:'left',
                }}
                onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background='rgba(255,255,255,.03)'; }}
                onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background='transparent'; }}>
                {/* Logo / initial */}
                <span style={{
                  width:28,height:28,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',
                  background:'rgba(245,166,35,.06)',border:`1px solid ${isSelected?'rgba(245,166,35,.3)':'rgba(245,166,35,.12)'}`,
                }}>
                  {c.logo
                    ? <img src={c.logo} alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <span className="f-serif" style={{fontSize:12,color:'var(--accent)',fontStyle:'italic',fontWeight:700,lineHeight:1}}>
                        {c.name?.charAt(0)?.toUpperCase()||'C'}
                      </span>
                  }
                </span>
                {/* Name + contact */}
                <span style={{flex:1,minWidth:0}}>
                  <span className="f-sans" style={{fontSize:13,fontWeight:500,color:isSelected?'var(--accent)':'var(--text)',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {c.name}
                  </span>
                  <span className="f-mono" style={{fontSize:9,color:'var(--text-3)',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {c.email||c.slug&&`/${c.slug}`||'—'}
                  </span>
                </span>
                {/* Plan */}
                <span className="f-mono" style={{fontSize:8,letterSpacing:'0.12em',textTransform:'uppercase',padding:'2px 6px',background:pc.bg,border:`1px solid ${pc.border}`,color:pc.color,flexShrink:0}}>
                  {c.subscription_plan||'free'}
                </span>
                {/* Active status */}
                <span style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:c.is_active?'#22d3ee':'#f43f5e'}} />
                  <span className="f-mono" style={{fontSize:7,color:c.is_active?'#22d3ee':'#f43f5e',letterSpacing:'0.1em',textTransform:'uppercase'}}>{c.is_active?'on':'off'}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM={title:'',department:'',location:'',is_remote:false,description:'',responsibilities:'',requirements:'',nice_to_have:'',benefits:'',experience_level:'mid',employment_type:'full_time',min_experience_years:0,max_experience_years:'',education_requirement:'',salary_min:'',salary_max:'',salary_currency:'USD',weight_skills:0.35,weight_experience:0.30,weight_education:0.20,weight_fit:0.15,status:'draft',company:''};

function JobForm({ job, onBack, onSaved }) {
  const isEdit=!!job;
  const [form,setForm]=useState(isEdit?{...EMPTY_FORM,...job,company:job.company??''}:{...EMPTY_FORM});
  const [formSkills,setFormSkills]=useState(isEdit?(job.skills||[]):[]);
  const [skillDraft,setSkillDraft]=useState({name:'',category:'',importance:'required',years_required:0});
  const [saving,setSaving]=useState(false);
  const [tab,setTab]=useState('basic');
  const [companies,setCompanies]=useState([]);
  const [companiesLoading,setCompaniesLoading]=useState(false);

  useEffect(()=>{
    const fetchCompanies=async()=>{
      setCompaniesLoading(true);
      try {
        // Same endpoint & response shape as CompanyCom: response.data.data
        const r=await AxiosInstance.get('/api/user/v1/company/',{params:{page:1,limit:100}});
        const list=r.data?.data||r.data?.results||r.data||[];
        setCompanies(list);
        // Auto-select first company if form has none yet
        if (list.length===1) setForm(p=>p.company?p:{...p,company:list[0].id});
      } catch { toast.warn('Could not load companies'); }
      finally { setCompaniesLoading(false); }
    };
    fetchCompanies();
  },[]);

  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));
  const wSum=()=>parseFloat((+form.weight_skills + +form.weight_experience + +form.weight_education + +form.weight_fit).toFixed(3));
  const wOk=()=>Math.abs(wSum()-1.0)<=0.01;

  const addSkill=()=>{
    if (!skillDraft.name.trim()){ toast.warn('Skill name required'); return; }
    setFormSkills(p=>[...p,{...skillDraft,_id:Date.now()}]);
    setSkillDraft({name:'',category:'',importance:'required',years_required:0});
  };

  const submit=async()=>{
    if (!form.title.trim()){ toast.warn('Title is required'); return; }
    if (!form.company){ toast.warn('Company is required'); setTab('basic'); return; }
    if (!wOk()){ toast.error(`Weights sum ${wSum()} ≠ 1.0`); setTab('weights'); return; }
    const payload={...form,company:+form.company,skills:formSkills.map(({_id,...r})=>r),max_experience_years:form.max_experience_years===''?null:+form.max_experience_years,salary_min:form.salary_min===''?null:+form.salary_min,salary_max:form.salary_max===''?null:+form.salary_max};
    setSaving(true);
    try {
      if(isEdit) await AxiosInstance.patch(`/api/jobs/v1/job/?id=${job.id}`,payload);
      else       await AxiosInstance.post('/api/jobs/v1/job/',payload);
      toast.success(isEdit?'Job updated':'Job created'); onSaved?.();
    } catch(e){ const err=e.response?.data; toast.error(typeof err==='string'?err:(err?.message||JSON.stringify(err)||'Save failed')); }
    finally { setSaving(false); }
  };

  const TABS=[{id:'basic',l:'Basic Info'},{id:'content',l:'Content'},{id:'skills',l:`Skills (${formSkills.length})`},{id:'weights',l:'Weights'}];

  return (
    <div className="anim-fade-up" style={{maxWidth:720}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24,paddingBottom:20,borderBottom:'1px solid var(--border)',flexWrap:'wrap'}}>
        <button onClick={onBack} className="f-mono" style={{background:'none',border:'none',fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--text-3)',cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>← Back</button>
        <div style={{flex:1}}>
          <h1 className="f-serif" style={{fontSize:24,color:'var(--text)',lineHeight:1.2}}>{isEdit?'Edit Job Description':'New Job Description'}</h1>
          {isEdit && <p className="f-mono" style={{fontSize:10,color:'var(--text-3)',marginTop:4}}>{job.title}</p>}
        </div>
        <PrimaryBtn loading={saving} onClick={submit} style={{padding:'10px 28px'}}>{isEdit?'✓ Update':'+ Create'}</PrimaryBtn>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',marginBottom:24}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="f-mono"
            style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',padding:'12px 20px',background:'none',border:'none',borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`,color:tab===t.id?'var(--accent)':'var(--text-3)',cursor:'pointer',transition:'color .15s',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6}}>
            {t.l}
            {t.id==='weights' && !wOk() && <span style={{width:6,height:6,borderRadius:'50%',background:'#f43f5e',display:'inline-block'}} />}
          </button>
        ))}
      </div>

      {/* Basic */}
      {tab==='basic' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Card style={{padding:20}}>
            <SLabel>Position Details</SLabel>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14,position:'relative'}}>
              <div style={{gridColumn:'1/-1'}}><TxtInput label="Job Title *" value={form.title} onChange={e=>upd('title',e.target.value)} placeholder="e.g. Senior Full-Stack Engineer" /></div>
              {/* Company dropdown — required, matches CompanyCom data shape */}
              <CompanyDropdown
                companies={companies}
                loading={companiesLoading}
                value={form.company}
                onChange={v=>upd('company',v)}
                error={!form.company && !companiesLoading}
              />
              <TxtInput label="Department" value={form.department} onChange={e=>upd('department',e.target.value)} placeholder="Engineering" />
              <TxtInput label="Location" value={form.location} onChange={e=>upd('location',e.target.value)} placeholder="New York, NY" />
              <SelInput label="Experience Level" value={form.experience_level} onChange={e=>upd('experience_level',e.target.value)} options={EXP_LEVELS.map(v=>({value:v,label:fmt.label(v)}))} />
              <SelInput label="Employment Type" value={form.employment_type} onChange={e=>upd('employment_type',e.target.value)} options={EMP_TYPES.map(v=>({value:v,label:fmt.label(v)}))} />
              <TxtInput label="Min Experience (yrs)" type="number" min={0} step={0.5} value={form.min_experience_years} onChange={e=>upd('min_experience_years',+e.target.value)} />
              <TxtInput label="Max Experience (yrs)" type="number" min={0} step={0.5} value={form.max_experience_years} onChange={e=>upd('max_experience_years',e.target.value)} placeholder="Open" />
              <TxtInput label="Education" value={form.education_requirement} onChange={e=>upd('education_requirement',e.target.value)} placeholder="bachelor, master, any…" />
              <SelInput label="Initial Status" value={form.status} onChange={e=>upd('status',e.target.value)} options={JOB_STATUS.map(v=>({value:v,label:fmt.label(v)}))} />
            </div>
            <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid var(--border)'}}>
              <Toggle checked={form.is_remote} onChange={()=>upd('is_remote',!form.is_remote)} label="Remote position" />
            </div>
          </Card>
          <Card style={{padding:20}}>
            <SLabel>Compensation</SLabel>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 100px',gap:14}}>
              <TxtInput label="Min Salary" type="number" value={form.salary_min} onChange={e=>upd('salary_min',e.target.value)} placeholder="60000" />
              <TxtInput label="Max Salary" type="number" value={form.salary_max} onChange={e=>upd('salary_max',e.target.value)} placeholder="100000" />
              <TxtInput label="Currency" value={form.salary_currency} onChange={e=>upd('salary_currency',e.target.value)} placeholder="USD" />
            </div>
          </Card>
        </div>
      )}

      {/* Content */}
      {tab==='content' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {[{key:'description',label:'Job Description *',rows:8},{key:'responsibilities',label:'Responsibilities',rows:6},{key:'requirements',label:'Requirements',rows:6},{key:'nice_to_have',label:'Nice to Have',rows:4},{key:'benefits',label:'Benefits & Perks',rows:4}].map(f=>(
            <Card key={f.key} style={{padding:20}}>
              <TxtArea label={f.label} rows={f.rows} value={form[f.key]} onChange={e=>upd(f.key,e.target.value)} placeholder={`Enter ${f.label.toLowerCase()}…`} />
            </Card>
          ))}
        </div>
      )}

      {/* Skills */}
      {tab==='skills' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Card style={{padding:20}}>
            <SLabel>Add to List</SLabel>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              <input style={{padding:'9px 12px',gridColumn:'1/-1'}} value={skillDraft.name} onChange={e=>setSkillDraft(p=>({...p,name:e.target.value}))} placeholder="Skill name (e.g. TypeScript, Kubernetes)" />
              <input style={{padding:'9px 12px'}} value={skillDraft.category} onChange={e=>setSkillDraft(p=>({...p,category:e.target.value}))} placeholder="Category (technical / soft)" />
              <input type="number" min={0} step={0.5} style={{padding:'9px 12px'}} value={skillDraft.years_required} onChange={e=>setSkillDraft(p=>({...p,years_required:+e.target.value}))} placeholder="Years required" />
              <select style={{padding:'9px 12px',gridColumn:'1/-1',cursor:'pointer'}} value={skillDraft.importance} onChange={e=>setSkillDraft(p=>({...p,importance:e.target.value}))}>
                {SKILL_IMP.map(i=><option key={i} value={i}>{fmt.label(i)}</option>)}
              </select>
            </div>
            <GhostBtn onClick={addSkill} style={{width:'100%',justifyContent:'center',padding:'9px'}}>+ Add to List</GhostBtn>
          </Card>
          {formSkills.length>0 ? (
            <Card>
              {formSkills.map((s,i)=>{
                const [hov,setHov]=useState(false);
                return (
                  <div key={s._id||i} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
                    style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px',borderBottom:'1px solid var(--border)',background:hov?'var(--card-alt)':'transparent',transition:'background .15s'}}>
                    <div style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:12}}>
                      <span className="f-sans" style={{fontSize:13,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</span>
                      {s.category && <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{s.category}</span>}
                    </div>
                    <ImpTag importance={s.importance} />
                    <button onClick={()=>setFormSkills(p=>p.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',fontSize:12,padding:0}}
                      onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>✕</button>
                  </div>
                );
              })}
            </Card>
          ) : <EmptyState icon="◇" title="No skills added" sub="Skills power AI-based candidate matching accuracy" />}
        </div>
      )}

      {/* Weights */}
      {tab==='weights' && (
        <Card style={{padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <SLabel>Scoring Weights</SLabel>
            <span className="f-mono" style={{fontSize:12,color:wOk()?'var(--emerald)':'#f43f5e',fontWeight:600}}>Σ = {wSum()}</span>
          </div>
          <p className="f-mono" style={{fontSize:10,color:'var(--text-3)',lineHeight:1.6,marginBottom:24}}>All four weights must sum to exactly 1.0. They determine how each factor contributes to the AI candidate match score.</p>
          <div style={{display:'flex',flexDirection:'column',gap:24}}>
            {[
              {key:'weight_skills',label:'Skills Match',color:'var(--accent)',desc:'Skill overlap between candidate and JD'},
              {key:'weight_experience',label:'Experience',color:'var(--cyan)',desc:'Years of relevant experience alignment'},
              {key:'weight_education',label:'Education',color:'var(--violet)',desc:'Educational background and credentials'},
              {key:'weight_fit',label:'Overall Fit',color:'var(--emerald)',desc:'Holistic role and culture fit score'},
            ].map(w=>(
              <div key={w.key}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:8}}>
                  <div>
                    <span className="f-mono" style={{fontSize:11,color:'var(--text-2)',display:'block',marginBottom:2}}>{w.label}</span>
                    <span className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{w.desc}</span>
                  </div>
                  <span className="f-serif" style={{fontSize:24,color:w.color,lineHeight:1,fontStyle:'italic'}}>
                    {((+form[w.key]||0)*100).toFixed(0)}%
                  </span>
                </div>
                <input type="range" min={0} max={1} step={0.05} value={form[w.key]} onChange={e=>upd(w.key,parseFloat(e.target.value))} style={{width:'100%',marginBottom:6}} />
                <ProgBar pct={(+form[w.key]||0)*100} color={w.color} height={3} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   JOB CARD
══════════════════════════════════════════════════════════ */
function JobCard({ job, onSelect, onEdit, onStatus }) {
  const [hov,setHov]=useState(false);
  const sc=STATUS_CFG[job.status]||STATUS_CFG.draft;

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onSelect(job.id)}
      className="anim-fade-up" style={{
        display:'flex', overflow:'hidden', cursor:'pointer',
        background:'var(--card)',
        border:`1px solid ${hov?'var(--border-hi)':'var(--border)'}`,
        transform:hov?'translateY(-2px)':'none',
        boxShadow:hov?'0 8px 32px rgba(0,0,0,.45)':'none',
        transition:'all .2s ease',
      }}>
      {/* Status bar */}
      <div style={{width:3,background:sc.bar,flexShrink:0}} />

      <div style={{flex:1,minWidth:0,padding:16}}>
        {/* Title */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:10}}>
          <div style={{flex:1,minWidth:0}}>
            <h3 className="f-serif" style={{fontSize:15,color:hov?'var(--accent)':'var(--text)',marginBottom:4,lineHeight:1.25,transition:'color .2s',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{job.title}</h3>
            <p className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{job.company_name}{job.department?` · ${job.department}`:''}</p>
          </div>
          <SPill status={job.status} />
        </div>

        {/* Chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:12}}>
          <Chip>{fmt.label(job.experience_level)}</Chip>
          <Chip>{fmt.label(job.employment_type)}</Chip>
          {job.is_remote && <Chip color='#34d399' bg='rgba(16,185,129,.07)' border='#065f46'>Remote</Chip>}
          {job.location && <Chip>📍 {job.location}</Chip>}
        </div>

        {/* Footer */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:12,borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',gap:16}} className="f-mono">
            <span style={{fontSize:10,color:'var(--text-3)'}}>
              <span style={{color:'var(--cyan)',fontWeight:600}}>{job.skills_count}</span> skills
            </span>
            <span style={{fontSize:10,color:'var(--text-3)'}}>
              <span style={{color:'var(--violet)',fontWeight:600}}>{job.screening_count}</span> screens
            </span>
            <span style={{fontSize:9,color:'var(--text-3)'}}>{fmt.date(job.updated_at)}</span>
          </div>
          <div style={{display:'flex',gap:6,opacity:hov?1:0,transition:'opacity .2s'}} onClick={e=>e.stopPropagation()}>
            <GhostBtn onClick={()=>onStatus(job)} style={{padding:'4px 10px'}}>⇄</GhostBtn>
            <GhostBtn onClick={()=>onEdit(job)} style={{padding:'4px 10px'}}>✎</GhostBtn>
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
  return (
    <div className="anim-slide-in" style={{padding:16,marginBottom:20,background:'var(--surface)',border:'1px solid var(--border)'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10}}>
        <input style={{padding:'9px 12px'}} placeholder="Title search…" value={filters.title} onChange={e=>onChange('title',e.target.value)} />
        <input style={{padding:'9px 12px'}} placeholder="Department…" value={filters.department} onChange={e=>onChange('department',e.target.value)} />
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.status} onChange={e=>onChange('status',e.target.value)}>
          <option value="">All Statuses</option>
          {JOB_STATUS.map(s=><option key={s} value={s}>{fmt.label(s)}</option>)}
        </select>
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.experience_level} onChange={e=>onChange('experience_level',e.target.value)}>
          <option value="">All Levels</option>
          {EXP_LEVELS.map(l=><option key={l} value={l}>{fmt.label(l)}</option>)}
        </select>
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.employment_type} onChange={e=>onChange('employment_type',e.target.value)}>
          <option value="">All Types</option>
          {EMP_TYPES.map(t=><option key={t} value={t}>{fmt.label(t)}</option>)}
        </select>
        <input style={{padding:'9px 12px'}} placeholder="Skill name…" value={filters.skill_name} onChange={e=>onChange('skill_name',e.target.value)} />
        <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.is_remote} onChange={e=>onChange('is_remote',e.target.value)}>
          <option value="">All Locations</option>
          <option value="true">Remote Only</option>
          <option value="false">On-site Only</option>
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
  const total=stats.total||1;
  const bars=[
    {s:'active',  label:'Active',   color:'var(--cyan)',   val:stats.active||0 },
    {s:'draft',   label:'Draft',    color:'var(--accent)', val:stats.draft||0  },
    {s:'paused',  label:'Paused',   color:'var(--amber-s)',val:stats.paused||0 },
    {s:'closed',  label:'Closed',   color:'#f43f5e',       val:stats.closed||0 },
    {s:'archived',label:'Archived', color:'var(--text-3)', val:stats.archived||0},
  ];

  return (
    <div className="anim-fade-up" style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <GhostBtn onClick={onRefresh}>↻ Refresh</GhostBtn>
      </div>

      {/* Big numbers */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
        {[
          {label:'Total Positions',val:stats.total||0,color:'var(--text)',sub:'across all statuses'},
          {label:'Active Hiring',val:stats.active||0,color:'var(--cyan)',sub:'currently open'},
          {label:'In Draft',val:stats.draft||0,color:'var(--accent)',sub:'being prepared'},
          {label:'Screenings Done',val:stats.total_screenings||0,color:'var(--violet)',sub:'candidates reviewed'},
        ].map(s=>(
          <Card key={s.label} style={{padding:20}}>
            <p className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:12}}>{s.label}</p>
            <p className="f-serif" style={{fontSize:40,color:s.color,lineHeight:1,marginBottom:4,fontStyle:'italic'}}>{s.val}</p>
            <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Status breakdown chart */}
      {stats.by_status && (
        <Card style={{padding:20}}>
          <SLabel>Status Breakdown</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            {bars.map(b=>{
              const pct=total>0?(b.val/total*100):0;
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
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════════════════════ */
const EMPTY_FILTERS={title:'',department:'',status:'',experience_level:'',employment_type:'',is_remote:'',skill_name:''};

export default function JobsPage() {
  const [view,setView]   = useState('list');
  const [tab,setTab]     = useState('jobs');
  const [jobs,setJobs]   = useState([]);
  const [stats,setStats] = useState({});
  const [loading,setLoading] = useState(false);
  const [filters,setFilters] = useState({...EMPTY_FILTERS});
  const [showFilters,setShowFilters] = useState(false);
  const [selectedId,setSelectedId] = useState(null);
  const [editJob,setEditJob] = useState(null);
  const [statusTarget,setStatusTarget] = useState(null);
  const [deleteTarget,setDeleteTarget] = useState(null);

  const loadJobs = useCallback(async()=>{
    setLoading(true);
    try {
      const params={};
      Object.entries(filters).forEach(([k,v])=>{ if(v!=='') params[k]=v; });
      const r=await AxiosInstance.get('/api/jobs/v1/job/',{params});
      setJobs(r.data?.results||r.data?.data||r.data||[]);
    } catch { toast.error('Failed to load jobs'); } finally { setLoading(false); }
  },[filters]);

  const loadStats = useCallback(async()=>{
    try { const r=await AxiosInstance.get('/api/jobs/v1/job/stats/'); setStats(r.data?.data||r.data||{}); } catch {}
  },[]);

  useEffect(()=>{ loadJobs(); },[loadJobs]);
  useEffect(()=>{ if(tab==='stats') loadStats(); },[tab,loadStats]);

  const openDetail=id=>{ setSelectedId(id); setView('detail'); };
  const openCreate=()=>{ setEditJob(null); setView('form'); };
  const openEdit=j=>{ setEditJob(j); setView('form'); };
  const backToList=()=>{ setView('list'); setSelectedId(null); setEditJob(null); };
  const handleSaved=()=>{ backToList(); loadJobs(); loadStats(); };

  const doDelete=async()=>{
    if (!deleteTarget) return;
    try { await AxiosInstance.delete(`/api/jobs/v1/job/?id=${deleteTarget.id}`); toast.success(`"${deleteTarget.title}" archived`); setDeleteTarget(null); backToList(); loadJobs(); loadStats(); }
    catch { toast.error('Archive failed'); }
  };

  const activeFilterCount=Object.values(filters).filter(v=>v!=='').length;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="noise-overlay" />
      <Toasts />

      <div className="f-sans" style={{background:'var(--bg)',color:'var(--text)',minHeight:'100vh',position:'relative',zIndex:1}}>

        {/* ══ HEADER ══ */}
        <header style={{
          position:'sticky',top:0,zIndex:40,
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'0 24px',height:56,
          background:'rgba(7,9,15,.94)',
          backdropFilter:'blur(20px)',
          borderBottom:'1px solid var(--border)',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:20}}>
            <div style={{display:'flex',alignItems:'baseline',gap:3}}>
              <span className="f-serif" style={{fontSize:20,color:'var(--text)',lineHeight:1}}>Jobs</span>
              <span className="f-serif" style={{fontSize:20,color:'var(--accent)',lineHeight:1}}>.</span>
            </div>
            {view==='list' && (
              <>
                <span style={{width:1,height:16,background:'var(--border)'}} />
                <span className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)'}}>
                  {tab==='jobs' ? (loading ? '…' : `${jobs.length} positions`) : 'Analytics'}
                </span>
              </>
            )}
          </div>
          {view==='list' && tab==='jobs' && (
            <PrimaryBtn onClick={openCreate} style={{padding:'8px 20px'}}>+ New Position</PrimaryBtn>
          )}
        </header>

        {/* ══ STATS STRIP ══ */}
        {view==='list' && (
          <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
            {[
              {label:'Total',val:stats.total??jobs.length,color:'var(--text)',bar:'var(--border-hi)'},
              {label:'Active',val:stats.active??'—',color:'var(--cyan)',bar:'var(--cyan)'},
              {label:'Draft',val:stats.draft??'—',color:'var(--accent)',bar:'var(--accent)'},
              {label:'Paused',val:stats.paused??'—',color:'var(--amber-s)',bar:'var(--amber-s)'},
              {label:'Screenings',val:stats.total_screenings??'—',color:'var(--violet)',bar:'var(--violet)'},
            ].map((s,i)=>(
              <div key={s.label} style={{
                position:'relative',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                padding:'10px 24px',minWidth:96,flexShrink:0,overflow:'hidden',
                borderRight:'1px solid var(--border)',
              }}>
                <span className="f-serif" style={{fontSize:24,color:s.color,lineHeight:1,marginBottom:4,fontStyle:'italic'}}>{s.val}</span>
                <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{s.label}</span>
                <span style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:s.bar,opacity:.5}} />
              </div>
            ))}
          </div>
        )}

        {/* ══ TABS ══ */}
        {view==='list' && (
          <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>
            {[{id:'jobs',l:'All Jobs'},{id:'stats',l:'Analytics'}].map(n=>(
              <button key={n.id} onClick={()=>setTab(n.id)} className="f-mono"
                style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',padding:'12px 24px',background:'none',border:'none',borderBottom:`2px solid ${tab===n.id?'var(--accent)':'transparent'}`,color:tab===n.id?'var(--accent)':'var(--text-3)',cursor:'pointer',transition:'color .15s'}}>
                {n.l}
              </button>
            ))}
          </div>
        )}

        {/* ══ CONTENT ══ */}
        <main style={{maxWidth:1200,margin:'0 auto',padding:'28px 24px'}}>

          {/* List */}
          {view==='list' && tab==='jobs' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:20}}>
                <div style={{display:'flex',gap:8}}>
                  <GhostBtn onClick={()=>setShowFilters(p=>!p)} active={showFilters}>
                    ⊟ Filters{activeFilterCount>0?` · ${activeFilterCount}`:''}
                  </GhostBtn>
                  {activeFilterCount>0 && <GhostBtn onClick={()=>setFilters({...EMPTY_FILTERS})}>✕ Clear</GhostBtn>}
                  <GhostBtn onClick={loadJobs}>↻</GhostBtn>
                </div>
                <span className="f-mono" style={{fontSize:10,color:'var(--text-3)',display:'flex',alignItems:'center',gap:8}}>
                  {loading ? <><Spinner size={10}/> Loading…</> : `${jobs.length} job${jobs.length!==1?'s':''}`}
                </span>
              </div>

              {showFilters && <FiltersPanel filters={filters} onChange={(k,v)=>setFilters(p=>({...p,[k]:v}))} onClear={()=>setFilters({...EMPTY_FILTERS})} />}

              {loading ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
                  {[...Array(6)].map((_,i)=>(
                    <div key={i} style={{display:'flex',overflow:'hidden',background:'var(--card)',border:'1px solid var(--border)'}}>
                      <div style={{width:3,background:'var(--border-hi)',flexShrink:0}} />
                      <div style={{flex:1,padding:16,display:'flex',flexDirection:'column',gap:12}}>
                        <Skel width='60%' height={18} /><Skel width='35%' height={10} />
                        <div style={{display:'flex',gap:6}}><Skel width={60} height={18}/><Skel width={75} height={18}/></div>
                        <Skel width='100%' height={1} /><Skel width='50%' height={10} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobs.length>0 ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
                  {jobs.map(j=><JobCard key={j.id} job={j} onSelect={openDetail} onEdit={openEdit} onStatus={j=>setStatusTarget(j)} />)}
                </div>
              ) : (
                <div style={{background:'var(--card)',border:'1px solid var(--border)'}}>
                  <EmptyState
                    icon={activeFilterCount>0?'◎':'◫'}
                    title={activeFilterCount>0?'No positions match filters':'No job descriptions yet'}
                    sub={activeFilterCount>0?'Try adjusting or clearing your filter criteria':'Create your first job description to begin AI-powered candidate screening'}
                    action={activeFilterCount>0
                      ? <GhostBtn onClick={()=>setFilters({...EMPTY_FILTERS})}>Clear Filters</GhostBtn>
                      : <PrimaryBtn onClick={openCreate} style={{padding:'10px 32px'}}>+ Create First Position</PrimaryBtn>}
                  />
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {view==='list' && tab==='stats' && (
            <StatsView stats={stats} onRefresh={()=>{ loadStats(); loadJobs(); }} />
          )}

          {/* Detail */}
          {view==='detail' && selectedId && (
            <JobDetail jobId={selectedId} onBack={backToList} onEdit={openEdit}
              onStatusChange={()=>{ loadJobs(); loadStats(); }}
              onDelete={j=>setDeleteTarget(j)} />
          )}

          {/* Form */}
          {view==='form' && <JobForm job={editJob} onBack={backToList} onSaved={handleSaved} />}
        </main>

        <footer style={{borderTop:'1px solid var(--border)',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:40}}>
          <span className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)'}}>Jobs · Recruitment Platform</span>
          <span className="f-serif" style={{fontSize:14,color:'var(--border-hi)',fontStyle:'italic'}}>◈</span>
        </footer>
      </div>

      <StatusModal open={!!statusTarget} job={statusTarget} onClose={()=>setStatusTarget(null)} onDone={()=>{ setStatusTarget(null); loadJobs(); loadStats(); }} />
      <ConfirmModal open={!!deleteTarget} title="Archive this position?"
        message={`"${deleteTarget?.title}" will be soft-deleted and removed from active views.`}
        onConfirm={doDelete} onCancel={()=>setDeleteTarget(null)} />
    </>
  );
}