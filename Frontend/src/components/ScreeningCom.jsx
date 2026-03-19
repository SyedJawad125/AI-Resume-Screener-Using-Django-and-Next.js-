// 'use client';
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import AxiosInstance from '@/components/AxiosInstance';

// /* ══════════════════════════════════════════════════════════
//    GLOBAL STYLES
// ══════════════════════════════════════════════════════════ */
// const GLOBAL_CSS = `
//   @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

//   :root {
//     --bg:       #07090f;
//     --surface:  #0c0f18;
//     --card:     #111520;
//     --card-alt: #161b28;
//     --border:   #1c2235;
//     --border-hi:#2a3350;
//     --text:     #e8edf8;
//     --text-2:   #8892aa;
//     --text-3:   #4a5470;
//     --accent:   #f5a623;
//     --accent-hi:#ffc04d;
//     --cyan:     #22d3ee;
//     --emerald:  #10b981;
//     --rose:     #f43f5e;
//     --violet:   #a78bfa;
//     --amber-s:  #fb923c;
//   }

//   .f-serif  { font-family: 'DM Serif Display', serif; }
//   .f-mono   { font-family: 'IBM Plex Mono', monospace; }
//   .f-sans   { font-family: 'DM Sans', sans-serif; }

//   @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
//   @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
//   @keyframes slideIn   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
//   @keyframes spin      { to{transform:rotate(360deg)} }
//   @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
//   @keyframes shimmer   { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
//   @keyframes scoreRise { from{stroke-dashoffset:100} to{stroke-dashoffset:var(--dash-target)} }

//   .anim-fade-up  { animation: fadeUp .35s cubic-bezier(.16,1,.3,1) forwards; }
//   .anim-fade-in  { animation: fadeIn .2s ease forwards; }
//   .anim-slide-in { animation: slideIn .3s cubic-bezier(.16,1,.3,1) forwards; }
//   .anim-spin     { animation: spin .65s linear infinite; }
//   .anim-live     { animation: livePulse 1.8s ease infinite; }

//   .noise-overlay {
//     position:fixed; inset:0; z-index:0; pointer-events:none;
//     background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
//     background-size:200px 200px; opacity:.025;
//   }

//   .shimmer-skeleton {
//     background: linear-gradient(90deg, var(--card) 0%, var(--card-alt) 50%, var(--card) 100%);
//     background-size: 400px 100%;
//     animation: shimmer 1.8s infinite;
//   }

//   input, textarea, select {
//     background: var(--surface) !important;
//     border: 1px solid var(--border) !important;
//     color: var(--text) !important;
//     font-family: 'IBM Plex Mono', monospace !important;
//     font-size: 12px !important;
//     outline: none !important;
//     transition: border-color .15s !important;
//     border-radius: 0 !important;
//   }
//   input:focus, textarea:focus, select:focus { border-color: var(--accent) !important; }
//   input::placeholder, textarea::placeholder { color: var(--text-3) !important; opacity:1 !important; }
//   select option { background: #0c0f18; color: var(--text); }
//   textarea { resize: vertical; }
//   input[type=range] { accent-color: var(--accent); cursor: pointer; }
//   input[type=checkbox] { width:14px; height:14px; cursor:pointer; accent-color: var(--accent); }

//   ::-webkit-scrollbar { width:3px; height:3px; }
//   ::-webkit-scrollbar-track { background:transparent; }
//   ::-webkit-scrollbar-thumb { background:var(--border-hi); border-radius:2px; }
// `;

// /* ══════════════════════════════════════════════════════════
//    CONFIG MAPS
// ══════════════════════════════════════════════════════════ */
// const SESSION_STATUS_CFG = {
//   pending:    { bar:'#3d4a6b', dot:'#4a5470', bg:'rgba(61,74,107,.1)',  border:'#2a3350', color:'#6b7394',  label:'Pending'    },
//   processing: { bar:'#fb923c', dot:'#fb923c', bg:'rgba(251,146,60,.1)', border:'#c2410c', color:'#fb923c',  label:'Processing', live:true },
//   completed:  { bar:'#10b981', dot:'#10b981', bg:'rgba(16,185,129,.1)', border:'#065f46', color:'#34d399',  label:'Completed'  },
//   failed:     { bar:'#f43f5e', dot:'#f43f5e', bg:'rgba(244,63,94,.1)',  border:'#9f1239', color:'#f43f5e',  label:'Failed'     },
// };

// const DECISION_CFG = {
//   shortlisted: { bg:'rgba(16,185,129,.1)',  border:'#065f46', color:'#34d399',  icon:'★' },
//   interview:   { bg:'rgba(34,211,238,.08)', border:'#0e7490', color:'#22d3ee',  icon:'◆' },
//   maybe:       { bg:'rgba(245,166,35,.1)',  border:'#92400e', color:'#fbbf24',  icon:'◈' },
//   hold:        { bg:'rgba(251,146,60,.1)',  border:'#c2410c', color:'#fb923c',  icon:'⏸' },
//   rejected:    { bg:'rgba(244,63,94,.1)',   border:'#9f1239', color:'#f43f5e',  icon:'✗' },
//   '':          { bg:'rgba(74,84,112,.1)',   border:'#2a3350', color:'#4a5470',  icon:'○' },
// };

// const AGENT_CFG = {
//   orchestrator:      { color:'var(--accent)',  icon:'⬡' },
//   resume_parser:     { color:'var(--cyan)',    icon:'◈' },
//   jd_analyzer:       { color:'var(--violet)', icon:'◆' },
//   skill_matcher:     { color:'#34d399',       icon:'◎' },
//   experience_scorer: { color:'var(--amber-s)',icon:'◱' },
//   education_scorer:  { color:'#67e8f9',       icon:'◲' },
//   rag_retriever:     { color:'#c4b5fd',       icon:'◧' },
//   explanation:       { color:'#fbbf24',       icon:'◻' },
// };

// const SCORE_COLOR = s =>
//   s >= 80 ? '#10b981' :
//   s >= 60 ? '#22d3ee' :
//   s >= 40 ? '#f5a623' : '#f43f5e';

// const DECISIONS = ['shortlisted','interview','maybe','hold','rejected'];

// const fmt = {
//   label:    s => s ? s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : '—',
//   date:     d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—',
//   dateTime: d => d ? new Date(d).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—',
//   score:    n => (n ?? 0).toFixed(1),
//   pct:      n => `${(n ?? 0).toFixed(1)}%`,
//   duration: s => s ? (s >= 60 ? `${(s/60).toFixed(1)}m` : `${s}s`) : '—',
//   usd:      n => `$${Number(n||0).toFixed(4)}`,
// };

// /* ══════════════════════════════════════════════════════════
//    TOAST SYSTEM
// ══════════════════════════════════════════════════════════ */
// let _setToasts = null;
// const toast = {
//   _p(type,msg){ const id=Date.now()+Math.random(); _setToasts?.(p=>[...p,{id,type,msg}]); setTimeout(()=>_setToasts?.(p=>p.filter(t=>t.id!==id)),4200); },
//   success:m=>toast._p('success',m), error:m=>toast._p('error',m),
//   warn:m=>toast._p('warn',m),       info:m=>toast._p('info',m),
// };
// const T_CFG = {
//   success:{ bg:'#07130e', border:'#065f46', color:'#34d399', icon:'✓' },
//   error:  { bg:'#12060a', border:'#881337', color:'#fb7185', icon:'✗' },
//   warn:   { bg:'#120c04', border:'#78350f', color:'#fbbf24', icon:'!' },
//   info:   { bg:'#04101a', border:'#075985', color:'#38bdf8', icon:'i' },
// };
// function Toasts() {
//   const [toasts,setToasts] = useState([]);
//   useEffect(()=>{ _setToasts = setToasts; },[]);
//   return (
//     <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:8,pointerEvents:'none'}}>
//       {toasts.map(t=>{ const c=T_CFG[t.type]; return (
//         <div key={t.id} className="anim-fade-up f-mono" style={{background:c.bg,border:`1px solid ${c.border}`,color:c.color,padding:'10px 16px',display:'flex',alignItems:'center',gap:12,minWidth:260,maxWidth:380,pointerEvents:'auto',fontSize:11}}>
//           <span style={{fontWeight:600,width:16,textAlign:'center'}}>[{c.icon}]</span>
//           <span style={{lineHeight:1.5}}>{t.msg}</span>
//         </div>
//       );})}
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    PRIMITIVES
// ══════════════════════════════════════════════════════════ */
// function Spinner({ size=14, color='var(--accent)' }) {
//   return <span className="anim-spin" style={{display:'inline-block',width:size,height:size,border:`2px solid rgba(255,255,255,.08)`,borderTopColor:color,borderRadius:'50%'}} />;
// }

// function SLabel({ children }) {
//   return (
//     <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
//       <span className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',flexShrink:0}}>{children}</span>
//       <span style={{flex:1,height:1,background:'var(--border)'}} />
//     </div>
//   );
// }

// function Card({ children, style={}, className='' }) {
//   return <div className={`anim-fade-up ${className}`} style={{background:'var(--card)',border:'1px solid var(--border)',...style}}>{children}</div>;
// }

// function Chip({ children, color='var(--text-3)', bg='rgba(74,84,112,.1)', border='var(--border)' }) {
//   return <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',padding:'3px 8px',background:bg,border:`1px solid ${border}`,color,display:'inline-flex',alignItems:'center',gap:4}}>{children}</span>;
// }

// function ProgBar({ pct=0, color='var(--accent)', height=2 }) {
//   return <div style={{height,background:'var(--border)',overflow:'hidden'}}><div style={{width:`${Math.min(100,Math.max(0,pct))}%`,height:'100%',background:color,transition:'width .6s ease'}} /></div>;
// }

// function Skel({ width='100%', height=14 }) {
//   return <div className="shimmer-skeleton" style={{width,height,flexShrink:0}} />;
// }

// function EmptyState({ icon='◌', title, sub, action }) {
//   return (
//     <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'64px 24px',gap:16,textAlign:'center'}}>
//       <div className="f-serif" style={{fontSize:56,color:'var(--border-hi)',lineHeight:1,fontStyle:'italic'}}>{icon}</div>
//       <div>
//         <p className="f-sans" style={{fontSize:14,fontWeight:500,color:'var(--text-2)',marginBottom:6}}>{title}</p>
//         {sub && <p className="f-mono" style={{fontSize:11,color:'var(--text-3)',lineHeight:1.6,maxWidth:300,margin:'0 auto'}}>{sub}</p>}
//       </div>
//       {action && <div style={{marginTop:8}}>{action}</div>}
//     </div>
//   );
// }

// function PrimaryBtn({ children, loading, loadingText='Processing…', disabled, style={}, ...p }) {
//   const dis = disabled||loading;
//   return (
//     <button disabled={dis} style={{background:dis?'var(--card-alt)':'var(--accent)',color:dis?'var(--text-3)':'#07090f',border:'none',cursor:dis?'not-allowed':'pointer',fontFamily:'IBM Plex Mono,monospace',fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',padding:'10px 16px',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .15s',...style}} {...p}>
//       {loading ? <><Spinner size={12} color='#07090f'/>{loadingText}</> : children}
//     </button>
//   );
// }

// function GhostBtn({ children, active=false, style={}, ...p }) {
//   const [hov,setHov] = useState(false);
//   return (
//     <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:'transparent',border:`1px solid ${active||hov?'var(--border-hi)':'var(--border)'}`,color:active?'var(--accent)':hov?'var(--text-2)':'var(--text-3)',fontFamily:'IBM Plex Mono,monospace',fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',padding:'6px 12px',cursor:'pointer',transition:'all .15s',...style}} {...p}>
//       {children}
//     </button>
//   );
// }

// function DangerBtn({ children, style={}, ...p }) {
//   const [hov,setHov] = useState(false);
//   return (
//     <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:hov?'rgba(244,63,94,.08)':'transparent',border:'1px solid rgba(244,63,94,.35)',color:'#f43f5e',fontFamily:'IBM Plex Mono,monospace',fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',padding:'6px 12px',cursor:'pointer',transition:'all .15s',...style}} {...p}>
//       {children}
//     </button>
//   );
// }

// function TxtInput({ label, required, ...p }) {
//   return (
//     <div>
//       {label && <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>{label}{required&&<span style={{color:'var(--accent)',marginLeft:3}}>*</span>}</label>}
//       <input style={{width:'100%',padding:'10px 12px',display:'block',boxSizing:'border-box'}} {...p} />
//     </div>
//   );
// }

// function TxtArea({ label, ...p }) {
//   return (
//     <div>
//       {label && <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>{label}</label>}
//       <textarea style={{width:'100%',padding:'10px 12px',display:'block',boxSizing:'border-box',minHeight:80}} {...p} />
//     </div>
//   );
// }

// function SelInput({ label, options=[], ...p }) {
//   return (
//     <div>
//       {label && <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>{label}</label>}
//       <select style={{width:'100%',padding:'10px 12px',display:'block',boxSizing:'border-box',cursor:'pointer'}} {...p}>
//         {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??fmt.label(o)}</option>)}
//       </select>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    STATUS PILL / DOT
// ══════════════════════════════════════════════════════════ */
// function SessionStatusPill({ status }) {
//   const c = SESSION_STATUS_CFG[status] || SESSION_STATUS_CFG.pending;
//   return (
//     <span className="f-mono" style={{fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',padding:'3px 8px',display:'inline-flex',alignItems:'center',gap:6,flexShrink:0,background:c.bg,border:`1px solid ${c.border}`,color:c.color}}>
//       <span style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',width:11,height:11}}>
//         {c.live && <span className="anim-live" style={{position:'absolute',width:9,height:9,borderRadius:'50%',background:c.dot,opacity:.3}} />}
//         <span style={{width:5,height:5,borderRadius:'50%',background:c.dot}} />
//       </span>
//       {c.label}
//     </span>
//   );
// }

// function DecisionPill({ decision, size='sm' }) {
//   const c = DECISION_CFG[decision||''] || DECISION_CFG[''];
//   const pad = size==='lg' ? '5px 12px' : '3px 8px';
//   return (
//     <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',padding:pad,background:c.bg,border:`1px solid ${c.border}`,color:c.color,display:'inline-flex',alignItems:'center',gap:5}}>
//       <span style={{fontSize:10}}>{c.icon}</span>
//       {decision ? fmt.label(decision) : 'Undecided'}
//     </span>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    CIRCULAR SCORE GAUGE
// ══════════════════════════════════════════════════════════ */
// function ScoreGauge({ score=0, size=80, label='Score' }) {
//   const color = SCORE_COLOR(score);
//   const r = (size/2) - 6;
//   const circ = 2 * Math.PI * r;
//   const offset = circ - (score/100) * circ;
//   return (
//     <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
//       <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
//         <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
//         <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
//           strokeDasharray={circ} strokeDashoffset={offset}
//           strokeLinecap="butt" style={{transition:'stroke-dashoffset .8s ease, stroke .3s'}} />
//         <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
//           style={{fill:color,fontFamily:'DM Serif Display,serif',fontSize:size*0.26,fontStyle:'italic',transform:'rotate(90deg)',transformOrigin:'center'}}>
//           {fmt.score(score)}
//         </text>
//       </svg>
//       <span className="f-mono" style={{fontSize:8,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)'}}>{label}</span>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    SCORE BAR ROW
// ══════════════════════════════════════════════════════════ */
// function ScoreRow({ label, score, color }) {
//   const c = color || SCORE_COLOR(score);
//   return (
//     <div>
//       <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
//         <span className="f-mono" style={{fontSize:10,color:'var(--text-2)'}}>{label}</span>
//         <span className="f-serif" style={{fontSize:16,color:c,fontStyle:'italic',lineHeight:1}}>{fmt.score(score)}</span>
//       </div>
//       <ProgBar pct={score} color={c} height={3} />
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    CANDIDATE AVATAR
// ══════════════════════════════════════════════════════════ */
// function CandidateAvatar({ name, size=38 }) {
//   const initials = name ? name.trim().split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('') : '?';
//   const colors = ['#f5a623','#22d3ee','#10b981','#a78bfa','#fb923c','#f43f5e'];
//   const idx = name ? [...name].reduce((a,c)=>a+c.charCodeAt(0),0) % colors.length : 0;
//   return (
//     <div style={{width:size,height:size,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:`${colors[idx]}14`,border:`1px solid ${colors[idx]}40`}}>
//       <span className="f-serif" style={{fontSize:size*0.35,color:colors[idx],fontStyle:'italic',lineHeight:1}}>{initials}</span>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    CONFIRM MODAL
// ══════════════════════════════════════════════════════════ */
// function ConfirmModal({ open, title, message, confirmLabel='Confirm Delete', onConfirm, onCancel }) {
//   if (!open) return null;
//   return (
//     <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(7,9,15,.88)',backdropFilter:'blur(16px)'}}>
//       <div className="anim-fade-up" style={{background:'var(--card)',border:'1px solid var(--border-hi)',padding:24,maxWidth:400,width:'100%'}}>
//         <div style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16,background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.3)'}}>
//           <span style={{color:'#f43f5e',fontSize:14,fontWeight:700}}>!</span>
//         </div>
//         <p className="f-serif" style={{fontSize:18,color:'var(--text)',marginBottom:8}}>{title}</p>
//         <p className="f-mono" style={{fontSize:11,color:'var(--text-2)',lineHeight:1.6,marginBottom:24}}>{message}</p>
//         <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
//           <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
//           <DangerBtn onClick={onConfirm}>{confirmLabel}</DangerBtn>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    SESSION PROGRESS CARD  (live-polling)
// ══════════════════════════════════════════════════════════ */
// function SessionProgressBanner({ sessionId, onComplete }) {
//   const [session,setSession] = useState(null);
//   const iv = useRef(null);

//   const poll = useCallback(async () => {
//     try {
//       const r = await AxiosInstance.get(`/api/screening/v1/session/?id=${sessionId}`);
//       const d = r.data?.data || r.data;
//       setSession(d);
//       if (d.status === 'completed' || d.status === 'failed') {
//         clearInterval(iv.current);
//         if (d.status === 'completed') { toast.success('Screening completed!'); onComplete?.(); }
//         else toast.error('Screening session failed');
//       }
//     } catch { clearInterval(iv.current); }
//   }, [sessionId, onComplete]);

//   useEffect(() => {
//     poll();
//     iv.current = setInterval(poll, 3500);
//     return () => clearInterval(iv.current);
//   }, [poll]);

//   if (!session || (session.status !== 'processing' && session.status !== 'pending')) return null;
//   const pct = session.progress_pct || 0;

//   return (
//     <div className="anim-fade-in" style={{padding:16,background:'var(--surface)',border:'1px solid rgba(251,146,60,.3)',borderLeft:'2px solid #fb923c',marginBottom:20}}>
//       <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
//         <div style={{display:'flex',alignItems:'center',gap:10}}>
//           <Spinner size={12} color='#fb923c' />
//           <span className="f-mono" style={{fontSize:10,color:'#fb923c',letterSpacing:'0.15em',textTransform:'uppercase'}}>Screening in Progress</span>
//           <span className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{session.job_title}</span>
//         </div>
//         <span className="f-serif" style={{fontSize:22,color:'#fb923c',fontStyle:'italic',lineHeight:1}}>{pct}%</span>
//       </div>
//       <ProgBar pct={pct} color='#fb923c' height={3} />
//       <div style={{display:'flex',gap:20,marginTop:8}}>
//         {[['Processed',session.processed_count,'#34d399'],['Failed',session.failed_count,'#f43f5e'],['Total',session.total_resumes,'var(--text-2)']].map(([l,v,c])=>(
//           <span key={l} className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{l}: <span style={{color:c,fontWeight:600}}>{v}</span></span>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    START SCREENING FORM  (modal)
// ══════════════════════════════════════════════════════════ */
// function StartScreeningModal({ open, onClose, onStarted }) {
//   const [jobs,setJobs]           = useState([]);
//   const [resumes,setResumes]     = useState([]);
//   const [jobsLoading,setJobsL]   = useState(false);
//   const [resumesLoading,setResL] = useState(false);
//   const [form,setForm]           = useState({ job_id:'', pass_threshold:70, top_n_candidates:10 });
//   const [selectedResumes,setSel] = useState([]);
//   const [search,setSearch]       = useState('');
//   const [starting,setStarting]   = useState(false);

//   useEffect(() => {
//     if (!open) return;
//     setForm({ job_id:'', pass_threshold:70, top_n_candidates:10 });
//     setSel([]); setSearch('');
//     // Load active/draft jobs
//     const loadJobs = async () => {
//       setJobsL(true);
//       try {
//         const r = await AxiosInstance.get('/api/jobs/v1/job/', { params:{ status:'active', limit:200 } });
//         const list = r.data?.results || r.data?.data || r.data || [];
//         // also get drafts
//         const r2 = await AxiosInstance.get('/api/jobs/v1/job/', { params:{ status:'draft', limit:200 } });
//         const list2 = r2.data?.results || r2.data?.data || r2.data || [];
//         setJobs([...list, ...list2]);
//       } catch { toast.warn('Could not load jobs'); } finally { setJobsL(false); }
//     };
//     // Load parsed/indexed resumes
//     const loadResumes = async () => {
//       setResL(true);
//       try {
//         const r = await AxiosInstance.get('/api/resumes/v1/resume/list/', { params:{ status:'parsed', is_active:'true', limit:500 } });
//         const list1 = r.data?.results || r.data?.data || r.data || [];
//         const r2 = await AxiosInstance.get('/api/resumes/v1/resume/list/', { params:{ status:'indexed', is_active:'true', limit:500 } });
//         const list2 = r2.data?.results || r2.data?.data || r2.data || [];
//         // Deduplicate by id
//         const map = {};
//         [...list1, ...list2].forEach(x => { map[x.id] = x; });
//         setResumes(Object.values(map));
//       } catch { toast.warn('Could not load resumes'); } finally { setResL(false); }
//     };
//     loadJobs(); loadResumes();
//   }, [open]);

//   if (!open) return null;

//   const filtered = resumes.filter(r => {
//     const q = search.toLowerCase();
//     return !q || (r.candidate_name||'').toLowerCase().includes(q) || (r.candidate_email||'').toLowerCase().includes(q);
//   });

//   const toggleResume = id => setSel(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
//   const toggleAll    = () => setSel(p => p.length === filtered.length ? [] : filtered.map(r=>r.id));

//   const submit = async () => {
//     if (!form.job_id) { toast.warn('Select a job'); return; }
//     if (!selectedResumes.length) { toast.warn('Select at least one resume'); return; }
//     setStarting(true);
//     try {
//       const r = await AxiosInstance.post('/api/screening/v1/session/start/', {
//         job_id:           form.job_id,
//         resume_ids:       selectedResumes,
//         pass_threshold:   form.pass_threshold,
//         top_n_candidates: form.top_n_candidates,
//       });
//       const d = r.data?.data || r.data;
//       toast.success(`Screening started — ${selectedResumes.length} resumes`);
//       onStarted?.(d.session_id);
//       onClose();
//     } catch(e) {
//       const err = e.response?.data;
//       if (typeof err === 'object' && err !== null) {
//         const msg = err.message || Object.values(err).flat().join(' · ') || 'Failed';
//         toast.error(msg);
//       } else { toast.error('Failed to start screening'); }
//     } finally { setStarting(false); }
//   };

//   return (
//     <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(7,9,15,.92)',backdropFilter:'blur(20px)'}}>
//       <div className="anim-fade-up" style={{background:'var(--card)',border:'1px solid var(--border-hi)',width:'100%',maxWidth:680,maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
//         {/* Header */}
//         <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
//           <div>
//             <p className="f-serif" style={{fontSize:20,color:'var(--text)',marginBottom:2}}>Start AI Screening</p>
//             <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>Select a job and resumes to screen against it</p>
//           </div>
//           <GhostBtn onClick={onClose} style={{padding:'6px 10px'}}>✕</GhostBtn>
//         </div>

//         <div style={{overflowY:'auto',flex:1,padding:24,display:'flex',flexDirection:'column',gap:20}}>
//           {/* Job selector */}
//           <div>
//             <SLabel>Target Job *</SLabel>
//             {jobsLoading ? <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',border:'1px solid var(--border)',background:'var(--surface)'}}><Spinner size={12}/><span className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>Loading jobs…</span></div> : (
//               <select style={{width:'100%',padding:'10px 12px',cursor:'pointer'}} value={form.job_id} onChange={e=>setForm(p=>({...p,job_id:e.target.value}))}>
//                 <option value="">— Select job —</option>
//                 {jobs.map(j=><option key={j.id} value={j.id}>[{(j.status||'').toUpperCase()}] {j.title}{j.department?` · ${j.department}`:''}</option>)}
//               </select>
//             )}
//           </div>

//           {/* Config */}
//           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
//             <div>
//               <label className="f-mono" style={{display:'block',fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:8}}>
//                 Pass Threshold — <span style={{color:'var(--accent)'}}>{form.pass_threshold}%</span>
//               </label>
//               <input type="range" min={0} max={100} step={5} value={form.pass_threshold} onChange={e=>setForm(p=>({...p,pass_threshold:+e.target.value}))} style={{width:'100%',marginBottom:6}} />
//               <ProgBar pct={form.pass_threshold} color='var(--accent)' height={2} />
//             </div>
//             <TxtInput label="Top N Candidates" type="number" min={1} max={200} value={form.top_n_candidates} onChange={e=>setForm(p=>({...p,top_n_candidates:+e.target.value}))} />
//           </div>

//           {/* Resume picker */}
//           <div style={{flex:1}}>
//             <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
//               <SLabel>Resumes ({selectedResumes.length} selected)</SLabel>
//               <div style={{display:'flex',gap:8}}>
//                 {selectedResumes.length > 0 && <GhostBtn onClick={()=>setSel([])} style={{padding:'3px 8px',fontSize:9}}>Clear</GhostBtn>}
//                 <GhostBtn onClick={toggleAll} style={{padding:'3px 8px',fontSize:9}}>
//                   {selectedResumes.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
//                 </GhostBtn>
//               </div>
//             </div>
//             <input style={{width:'100%',padding:'9px 12px',boxSizing:'border-box',marginBottom:10}} placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)} />
//             {resumesLoading ? (
//               <div style={{display:'flex',justifyContent:'center',padding:20}}><Spinner size={20}/></div>
//             ) : (
//               <div style={{border:'1px solid var(--border)',maxHeight:260,overflowY:'auto'}}>
//                 {filtered.length === 0 ? (
//                   <div style={{padding:20,textAlign:'center'}}><span className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>No parsed/indexed resumes found</span></div>
//                 ) : filtered.map((r,i) => {
//                   const isSel = selectedResumes.includes(r.id);
//                   return (
//                     <label key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'9px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isSel?'rgba(245,166,35,.04)':i%2===0?'transparent':'rgba(255,255,255,.01)',transition:'background .1s'}}>
//                       <input type="checkbox" checked={isSel} onChange={()=>toggleResume(r.id)} style={{flexShrink:0}} />
//                       <CandidateAvatar name={r.candidate_name} size={28} />
//                       <div style={{flex:1,minWidth:0}}>
//                         <span className="f-sans" style={{fontSize:12,fontWeight:500,color:isSel?'var(--accent)':'var(--text)',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.candidate_name||'Unnamed'}</span>
//                         <span className="f-mono" style={{fontSize:9,color:'var(--text-3)'}}>{r.candidate_email||r.original_filename}</span>
//                       </div>
//                       <div style={{display:'flex',gap:6,flexShrink:0}}>
//                         <Chip>{r.total_experience_years}y</Chip>
//                         <span className="f-mono" style={{fontSize:9,padding:'2px 6px',background:r.status==='indexed'?'rgba(16,185,129,.1)':'rgba(34,211,238,.07)',border:`1px solid ${r.status==='indexed'?'#065f46':'#0e7490'}`,color:r.status==='indexed'?'#34d399':'#22d3ee'}}>{r.status}</span>
//                       </div>
//                     </label>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer */}
//         <div style={{padding:'16px 24px',borderTop:'1px solid var(--border)',display:'flex',gap:8,justifyContent:'flex-end',flexShrink:0}}>
//           <GhostBtn onClick={onClose}>Cancel</GhostBtn>
//           <PrimaryBtn loading={starting} loadingText="Launching…" disabled={!form.job_id||!selectedResumes.length} onClick={submit} style={{padding:'10px 28px'}}>
//             ⚡ Start Screening ({selectedResumes.length})
//           </PrimaryBtn>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    SESSION CARD
// ══════════════════════════════════════════════════════════ */
// function SessionCard({ session, onSelect, onDelete }) {
//   const [hov,setHov] = useState(false);
//   const sc = SESSION_STATUS_CFG[session.status] || SESSION_STATUS_CFG.pending;
//   const pct = session.progress_pct || 0;

//   return (
//     <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
//       onClick={()=>onSelect(session.id)}
//       className="anim-fade-up"
//       style={{display:'flex',overflow:'hidden',cursor:'pointer',background:'var(--card)',border:`1px solid ${hov?'var(--border-hi)':'var(--border)'}`,transform:hov?'translateY(-2px)':'none',boxShadow:hov?'0 8px 32px rgba(0,0,0,.45)':'none',transition:'all .2s ease'}}>
//       <div style={{width:3,background:sc.bar,flexShrink:0}} />
//       <div style={{flex:1,minWidth:0,padding:16}}>
//         {/* Top */}
//         <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:10}}>
//           <div style={{flex:1,minWidth:0}}>
//             <h3 className="f-serif" style={{fontSize:15,color:hov?'var(--accent)':'var(--text)',marginBottom:3,lineHeight:1.25,transition:'color .2s',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
//               {session.job_title||'—'}
//             </h3>
//             <p className="f-mono" style={{fontSize:9,letterSpacing:'0.12em',color:'var(--text-3)'}}>
//               by {session.initiated_by_name||session.created_by_name||'—'} · {fmt.date(session.created_at)}
//             </p>
//           </div>
//           <SessionStatusPill status={session.status} />
//         </div>

//         {/* Progress */}
//         {session.status === 'processing' && (
//           <div style={{marginBottom:10}}>
//             <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
//               <span className="f-mono" style={{fontSize:9,color:'var(--text-3)'}}>Processing…</span>
//               <span className="f-mono" style={{fontSize:9,color:'#fb923c'}}>{pct}%</span>
//             </div>
//             <ProgBar pct={pct} color='#fb923c' height={2} />
//           </div>
//         )}

//         {/* Stats row */}
//         <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
//           <Chip>{session.total_resumes} resumes</Chip>
//           <Chip color='var(--accent)' bg='rgba(245,166,35,.06)' border='rgba(245,166,35,.2)'>threshold {session.pass_threshold}%</Chip>
//           <Chip color='var(--violet)' bg='rgba(167,139,250,.06)' border='rgba(167,139,250,.2)'>top {session.top_n_candidates}</Chip>
//           {session.failed_count > 0 && <Chip color='#f43f5e' bg='rgba(244,63,94,.08)' border='rgba(244,63,94,.2)'>{session.failed_count} failed</Chip>}
//         </div>

//         {/* Footer */}
//         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:12,borderTop:'1px solid var(--border)'}}>
//           <div className="f-mono" style={{display:'flex',gap:16}}>
//             <span style={{fontSize:10,color:'var(--text-3)'}}>
//               <span style={{color:'#34d399',fontWeight:600}}>{session.processed_count}</span>/{session.total_resumes} done
//             </span>
//             {session.completed_at && <span style={{fontSize:9,color:'var(--text-3)'}}>✓ {fmt.date(session.completed_at)}</span>}
//           </div>
//           <div style={{display:'flex',gap:6,opacity:hov?1:0,transition:'opacity .2s'}} onClick={e=>e.stopPropagation()}>
//             {session.status !== 'processing' && (
//               <DangerBtn onClick={()=>onDelete(session)} style={{padding:'4px 10px',fontSize:9}}>✕</DangerBtn>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    RESULT ROW  (inside session detail)
// ══════════════════════════════════════════════════════════ */
// function ResultRow({ result, onSelect, onDecision, isSelected, onToggleCompare }) {
//   const [hov,setHov]   = useState(false);
//   const scoreCol = SCORE_COLOR(result.overall_score);

//   return (
//     <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
//       style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',borderBottom:'1px solid var(--border)',background:hov?'var(--card-alt)':'transparent',transition:'background .15s',cursor:'pointer'}}
//       onClick={()=>onSelect(result.id)}>
//       {/* Compare checkbox */}
//       <input type="checkbox" checked={isSelected} onChange={e=>{ e.stopPropagation(); onToggleCompare(result.id); }}
//         onClick={e=>e.stopPropagation()} style={{flexShrink:0}} title="Add to compare" />

//       {/* Rank */}
//       {result.rank && (
//         <span className="f-serif" style={{fontSize:18,color:result.rank<=3?'var(--accent)':'var(--text-3)',width:28,textAlign:'center',flexShrink:0,fontStyle:'italic',lineHeight:1}}>#{result.rank}</span>
//       )}

//       {/* Avatar + name */}
//       <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
//         <CandidateAvatar name={result.candidate_name} size={32} />
//         <div style={{flex:1,minWidth:0}}>
//           <p className="f-sans" style={{fontSize:13,fontWeight:500,color:hov?'var(--accent)':'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:2,transition:'color .15s'}}>
//             {result.candidate_name||'Unnamed'}
//           </p>
//           <p className="f-mono" style={{fontSize:9,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{result.candidate_email||'—'}</p>
//         </div>
//       </div>

//       {/* Score bars (compact) */}
//       <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
//         <div style={{textAlign:'center',minWidth:44}}>
//           <span className="f-serif" style={{fontSize:20,color:scoreCol,lineHeight:1,fontStyle:'italic',display:'block'}}>{fmt.score(result.overall_score)}</span>
//           <span className="f-mono" style={{fontSize:8,color:'var(--text-3)',letterSpacing:'0.1em'}}>SCORE</span>
//         </div>
//         <div style={{width:80,display:'flex',flexDirection:'column',gap:4}}>
//           {[['Skills',result.skill_score,'var(--cyan)'],['Exp',result.experience_score,'var(--violet)'],['Edu',result.education_score,'var(--accent)']].map(([l,v,c])=>(
//             <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
//               <span className="f-mono" style={{fontSize:7,color:'var(--text-3)',width:20,flexShrink:0}}>{l}</span>
//               <div style={{flex:1,height:2,background:'var(--border)',overflow:'hidden'}}><div style={{width:`${Math.min(100,v||0)}%`,height:'100%',background:c,transition:'width .4s'}} /></div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Decisions + must-have */}
//       <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
//         {result.must_have_skills_met
//           ? <Chip color='#34d399' bg='rgba(16,185,129,.07)' border='#065f46'>✓ Must-Have</Chip>
//           : <Chip color='#f43f5e' bg='rgba(244,63,94,.07)' border='#9f1239'>✗ Must-Have</Chip>}
//         <DecisionPill decision={result.ai_decision} />
//         <span onClick={e=>{e.stopPropagation(); onDecision(result);}} title="Set HR decision">
//           <DecisionPill decision={result.human_decision} />
//         </span>
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    HUMAN DECISION MODAL
// ══════════════════════════════════════════════════════════ */
// function HumanDecisionModal({ open, result, onClose, onSaved }) {
//   const [decision,setDecision] = useState('');
//   const [notes,setNotes]       = useState('');
//   const [saving,setSaving]     = useState(false);

//   useEffect(() => {
//     if (result) { setDecision(result.human_decision||''); setNotes(result.human_notes||''); }
//   }, [result]);

//   if (!open||!result) return null;

//   const submit = async () => {
//     if (!decision) { toast.warn('Select a decision'); return; }
//     setSaving(true);
//     try {
//       await AxiosInstance.patch(`/api/screening/v1/result/decision/?id=${result.id}`, { human_decision:decision, human_notes:notes });
//       toast.success('Decision saved'); onSaved();
//     } catch(e) { toast.error(e.response?.data?.message||'Save failed'); } finally { setSaving(false); }
//   };

//   return (
//     <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(7,9,15,.88)',backdropFilter:'blur(16px)'}}>
//       <div className="anim-fade-up" style={{background:'var(--card)',border:'1px solid var(--border-hi)',width:'100%',maxWidth:420}}>
//         <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border)'}}>
//           <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
//             <CandidateAvatar name={result.candidate_name} size={32} />
//             <div>
//               <p className="f-serif" style={{fontSize:16,color:'var(--text)',lineHeight:1.2}}>{result.candidate_name}</p>
//               <p className="f-mono" style={{fontSize:9,color:'var(--text-3)'}}>{result.job_title}</p>
//             </div>
//           </div>
//         </div>
//         <div style={{padding:20}}>
//           <SLabel>HR Decision</SLabel>
//           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
//             {DECISIONS.map(d => {
//               const c = DECISION_CFG[d]; const isSel = decision===d;
//               return (
//                 <button key={d} onClick={()=>setDecision(d)} style={{
//                   display:'flex',alignItems:'center',gap:8,padding:'9px 12px',cursor:'pointer',
//                   background:isSel?c.bg:'var(--surface)', border:`1px solid ${isSel?c.border:'var(--border)'}`,
//                   boxShadow:isSel?`0 0 14px ${c.color}18`:'none', transition:'all .15s',
//                 }}>
//                   <span style={{color:c.color,fontSize:12}}>{c.icon}</span>
//                   <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:isSel?c.color:'var(--text-2)'}}>{fmt.label(d)}</span>
//                 </button>
//               );
//             })}
//           </div>
//           <TxtArea label="Notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Recruiter notes…" style={{minHeight:70}} />
//         </div>
//         <div style={{padding:'0 20px 20px',display:'flex',gap:8,justifyContent:'flex-end'}}>
//           <GhostBtn onClick={onClose}>Cancel</GhostBtn>
//           <PrimaryBtn loading={saving} onClick={submit} style={{padding:'8px 24px'}}>Save Decision</PrimaryBtn>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    COMPARE VIEW  (side-by-side modal)
// ══════════════════════════════════════════════════════════ */
// function CompareModal({ open, resultIds, onClose }) {
//   const [data,setData]     = useState(null);
//   const [loading,setLoading] = useState(false);

//   useEffect(() => {
//     if (!open || resultIds.length < 2) return;
//     const run = async () => {
//       setLoading(true);
//       try {
//         const r = await AxiosInstance.post('/api/screening/v1/compare/', { result_ids: resultIds });
//         setData(r.data?.data || r.data);
//       } catch(e) { toast.error(e.response?.data?.message||'Compare failed'); onClose(); } finally { setLoading(false); }
//     };
//     run();
//   }, [open, resultIds]);

//   if (!open) return null;

//   return (
//     <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(7,9,15,.92)',backdropFilter:'blur(20px)'}}>
//       <div className="anim-fade-up" style={{background:'var(--card)',border:'1px solid var(--border-hi)',width:'100%',maxWidth:900,maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
//         {/* Header */}
//         <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
//           <div>
//             <p className="f-serif" style={{fontSize:20,color:'var(--text)',marginBottom:2}}>Candidate Comparison</p>
//             {data && <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{data.job?.title} · Winner: <span style={{color:'var(--accent)'}}>{data.winner}</span></p>}
//           </div>
//           <GhostBtn onClick={onClose} style={{padding:'6px 10px'}}>✕</GhostBtn>
//         </div>

//         <div style={{overflowX:'auto',overflowY:'auto',flex:1,padding:24}}>
//           {loading ? (
//             <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:48}}><Spinner size={28}/></div>
//           ) : data?.candidates ? (
//             <div style={{display:'grid',gridTemplateColumns:`repeat(${data.candidates.length},minmax(200px,1fr))`,gap:16,minWidth:400}}>
//               {data.candidates.map((c,i) => {
//                 const dc = DECISION_CFG[c.ai_decision||''] || DECISION_CFG[''];
//                 const isWinner = i===0;
//                 return (
//                   <div key={c.result_id} style={{border:`1px solid ${isWinner?'rgba(245,166,35,.4)':'var(--border)'}`,background:isWinner?'rgba(245,166,35,.03)':'var(--surface)',display:'flex',flexDirection:'column',gap:0}}>
//                     {/* Hero */}
//                     <div style={{padding:16,borderBottom:'1px solid var(--border)',textAlign:'center',background:isWinner?'rgba(245,166,35,.04)':'transparent'}}>
//                       {isWinner && <p className="f-mono" style={{fontSize:8,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--accent)',marginBottom:8}}>★ Top Candidate</p>}
//                       <CandidateAvatar name={c.candidate_name} size={44} />
//                       <p className="f-sans" style={{fontSize:13,fontWeight:600,color:'var(--text)',marginTop:8,marginBottom:2}}>{c.candidate_name}</p>
//                       <p className="f-mono" style={{fontSize:9,color:'var(--text-3)'}}>{c.candidate_email}</p>
//                       {c.rank && <p className="f-mono" style={{fontSize:9,color:'var(--text-3)',marginTop:4}}>Rank #{c.rank}</p>}
//                     </div>
//                     {/* Overall */}
//                     <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
//                       <ScoreGauge score={c.overall_score} size={72} label="Overall" />
//                     </div>
//                     {/* Score breakdown */}
//                     <div style={{padding:16,borderBottom:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:10}}>
//                       <SLabel>Scores</SLabel>
//                       {[['Skills',c.score_breakdown?.skill_score,'var(--cyan)'],['Exp',c.score_breakdown?.experience_score,'var(--violet)'],['Edu',c.score_breakdown?.education_score,'var(--accent)'],['Fit',c.score_breakdown?.fit_score,'#34d399']].map(([l,v,col])=>(
//                         <ScoreRow key={l} label={l} score={v||0} color={col} />
//                       ))}
//                     </div>
//                     {/* Decision */}
//                     <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'center'}}>
//                       <DecisionPill decision={c.ai_decision} size='lg' />
//                     </div>
//                     {/* Skills */}
//                     <div style={{padding:16,borderBottom:'1px solid var(--border)'}}>
//                       <SLabel>Matched Skills</SLabel>
//                       <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
//                         {(c.matched_skills||[]).slice(0,8).map((s,j)=><Chip key={j} color='#34d399' bg='rgba(16,185,129,.07)' border='#065f46'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}
//                         {!c.matched_skills?.length && <span className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>None</span>}
//                       </div>
//                     </div>
//                     {/* Missing */}
//                     <div style={{padding:16,borderBottom:'1px solid var(--border)'}}>
//                       <SLabel>Missing Skills</SLabel>
//                       <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
//                         {(c.missing_skills||[]).slice(0,8).map((s,j)=><Chip key={j} color='#f43f5e' bg='rgba(244,63,94,.07)' border='#9f1239'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}
//                         {!c.missing_skills?.length && <span className="f-mono" style={{fontSize:10,color:'#34d399'}}>None missing</span>}
//                       </div>
//                     </div>
//                     {/* Strengths */}
//                     {c.strengths?.length > 0 && (
//                       <div style={{padding:16}}>
//                         <SLabel>Strengths</SLabel>
//                         {c.strengths.map((s,j)=>(
//                           <p key={j} className="f-sans" style={{fontSize:11,color:'var(--text-2)',lineHeight:1.6,marginBottom:4}}><span style={{color:'#34d399'}}>+</span> {s}</p>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           ) : null}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    AGENT LOG PANEL
// ══════════════════════════════════════════════════════════ */
// function AgentLogPanel({ resultId }) {
//   const [logs,setLogs]     = useState([]);
//   const [loading,setLoading] = useState(true);
//   const [expanded,setExpanded] = useState(null);

//   useEffect(() => {
//     const load = async () => {
//       setLoading(true);
//       try {
//         const r = await AxiosInstance.get(`/api/screening/v1/result/agent-logs/?id=${resultId}`);
//         setLogs(r.data?.data || r.data || []);
//       } catch {} finally { setLoading(false); }
//     };
//     load();
//   }, [resultId]);

//   if (loading) return <div style={{display:'flex',justifyContent:'center',padding:20}}><Spinner size={16}/></div>;
//   if (!logs.length) return <EmptyState icon="◻" title="No agent logs" sub="Logs appear once AI agents have processed this candidate" />;

//   const totalTime = logs.reduce((a,l)=>a+(l.processing_time_ms||0),0);
//   const totalTok  = logs.reduce((a,l)=>a+(l.tokens_used||0),0);

//   return (
//     <div style={{display:'flex',flexDirection:'column',gap:12}}>
//       {/* Summary strip */}
//       <div style={{display:'flex',gap:16,padding:'10px 16px',background:'var(--surface)',border:'1px solid var(--border)'}}>
//         {[['Agents Run',logs.length,'var(--text-2)'],['Total Time',`${totalTime}ms`,'var(--cyan)'],['Tokens',totalTok.toLocaleString(),'var(--violet)'],['Success',logs.filter(l=>l.status==='success').length,'#34d399'],['Error',logs.filter(l=>l.status!=='success').length,'#f43f5e']].map(([l,v,c])=>(
//           <span key={l} className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{l}: <span style={{color:c,fontWeight:600}}>{v}</span></span>
//         ))}
//       </div>
//       {/* Log rows */}
//       {logs.map(log => {
//         const cfg = AGENT_CFG[log.agent_type] || { color:'var(--text-3)', icon:'◻' };
//         const isExp = expanded === log.id;
//         const ok = log.status === 'success';
//         return (
//           <div key={log.id} style={{border:`1px solid ${ok?'var(--border)':'rgba(244,63,94,.2)'}`,background:'var(--surface)'}}>
//             <div style={{display:'flex',alignItems:'center',gap:14,padding:'11px 16px',cursor:'pointer'}}
//               onClick={()=>setExpanded(p=>p===log.id?null:log.id)}>
//               <span style={{fontSize:16,color:cfg.color,flexShrink:0}}>{cfg.icon}</span>
//               <div style={{flex:1,minWidth:0}}>
//                 <span className="f-sans" style={{fontSize:12,fontWeight:500,color:'var(--text)',display:'block'}}>{fmt.label(log.agent_type)}</span>
//                 <span className="f-mono" style={{fontSize:9,color:'var(--text-3)'}}>v{log.agent_version} · {log.model_used||'—'}</span>
//               </div>
//               <div style={{display:'flex',gap:10,alignItems:'center',flexShrink:0}}>
//                 <Chip color='var(--text-3)'>{log.processing_time_ms}ms</Chip>
//                 <Chip color='var(--violet)' bg='rgba(167,139,250,.06)' border='rgba(167,139,250,.2)'>{log.tokens_used} tok</Chip>
//                 <span className="f-mono" style={{fontSize:9,padding:'2px 7px',background:ok?'rgba(16,185,129,.08)':'rgba(244,63,94,.08)',border:`1px solid ${ok?'#065f46':'#9f1239'}`,color:ok?'#34d399':'#f43f5e'}}>{log.status}</span>
//                 <span style={{color:'var(--text-3)',fontSize:10}}>{isExp?'▲':'▼'}</span>
//               </div>
//             </div>
//             {isExp && (
//               <div className="anim-slide-in" style={{padding:'0 16px 14px',borderTop:'1px solid var(--border)'}}>
//                 {log.error_message && (
//                   <p className="f-mono" style={{fontSize:10,color:'#fb7185',padding:'8px 12px',background:'rgba(244,63,94,.06)',border:'1px solid rgba(244,63,94,.2)',marginTop:10,lineHeight:1.6}}>{log.error_message}</p>
//                 )}
//                 {log.input_summary && Object.keys(log.input_summary).length > 0 && (
//                   <div style={{marginTop:12}}>
//                     <p className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>Input</p>
//                     <pre className="f-mono" style={{fontSize:10,color:'var(--text-2)',whiteSpace:'pre-wrap',wordBreak:'break-all',lineHeight:1.7}}>{JSON.stringify(log.input_summary,null,2)}</pre>
//                   </div>
//                 )}
//                 {log.output_summary && Object.keys(log.output_summary).length > 0 && (
//                   <div style={{marginTop:12}}>
//                     <p className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:6}}>Output</p>
//                     <pre className="f-mono" style={{fontSize:10,color:'var(--text-2)',whiteSpace:'pre-wrap',wordBreak:'break-all',lineHeight:1.7}}>{JSON.stringify(log.output_summary,null,2)}</pre>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    RESULT DETAIL VIEW
// ══════════════════════════════════════════════════════════ */
// function ResultDetail({ resultId, onBack, onDecision }) {
//   const [result,setResult]   = useState(null);
//   const [loading,setLoading] = useState(true);
//   const [section,setSection] = useState('scores');
//   const [decisionModal,setDecisionModal] = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const r = await AxiosInstance.get(`/api/screening/v1/result/?id=${resultId}`);
//       setResult(r.data?.data || r.data);
//     } catch { toast.error('Failed to load result'); } finally { setLoading(false); }
//   }, [resultId]);

//   useEffect(() => { load(); }, [load]);

//   if (loading) return (
//     <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:900}}>
//       {[...Array(3)].map((_,i)=>(
//         <div key={i} style={{padding:20,background:'var(--card)',border:'1px solid var(--border)'}}>
//           <Skel width='40%' height={18}/><div style={{height:10}}/><Skel width='100%' height={12}/><div style={{height:6}}/><Skel width='65%' height={12}/>
//         </div>
//       ))}
//     </div>
//   );
//   if (!result) return null;

//   const scoreColor = SCORE_COLOR(result.overall_score);
//   const SECS = [
//     { id:'scores',    l:'Scores'                                      },
//     { id:'skills',    l:'Skills'                                      },
//     { id:'ai',        l:'AI Analysis'                                 },
//     { id:'questions', l:`Questions (${result.interview_questions?.length||0})` },
//     { id:'logs',      l:'Agent Logs'                                  },
//   ];

//   return (
//     <div className="anim-fade-up" style={{maxWidth:900}}>
//       {/* Breadcrumb */}
//       <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:24}}>
//         <button onClick={onBack} className="f-mono" style={{fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',background:'none',border:'none',color:'var(--text-3)',cursor:'pointer'}}
//           onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'}
//           onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>← Session</button>
//         <span className="f-mono" style={{fontSize:10,color:'var(--border-hi)'}}>/</span>
//         <span className="f-mono" style={{fontSize:10,color:'var(--text-2)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:220,whiteSpace:'nowrap'}}>{result.candidate_name}</span>
//         <div style={{flex:1}}/>
//         <PrimaryBtn onClick={()=>setDecisionModal(true)} style={{padding:'8px 18px'}}>⚖ HR Decision</PrimaryBtn>
//       </div>

//       {/* Hero */}
//       <div style={{padding:24,marginBottom:2,background:'var(--card)',border:'1px solid var(--border)',borderLeft:`3px solid ${scoreColor}`}}>
//         <div style={{display:'flex',alignItems:'flex-start',gap:20,flexWrap:'wrap'}}>
//           <ScoreGauge score={result.overall_score} size={90} label="Overall" />
//           <div style={{flex:1,minWidth:200}}>
//             <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:10}}>
//               <div>
//                 <h1 className="f-serif" style={{fontSize:24,color:'var(--text)',marginBottom:4,lineHeight:1.15}}>{result.candidate_name||'Unnamed'}</h1>
//                 <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
//                   {result.candidate_email && <span className="f-mono" style={{fontSize:11,color:'var(--cyan)'}}>{result.candidate_email}</span>}
//                   {result.candidate_location && <span className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>📍 {result.candidate_location}</span>}
//                   {result.candidate_phone && <span className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>{result.candidate_phone}</span>}
//                 </div>
//               </div>
//               <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
//                 <DecisionPill decision={result.ai_decision} size='lg' />
//                 <DecisionPill decision={result.human_decision} size='lg' />
//               </div>
//             </div>
//             <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
//               {result.rank && <Chip color='var(--accent)' bg='rgba(245,166,35,.07)' border='rgba(245,166,35,.25)'>Rank #{result.rank}</Chip>}
//               <Chip color={result.passed?'#34d399':'#f43f5e'} bg={result.passed?'rgba(16,185,129,.08)':'rgba(244,63,94,.08)'} border={result.passed?'#065f46':'#9f1239'}>
//                 {result.passed?'✓ Passed':'✗ Below Threshold'}
//               </Chip>
//               {result.must_have_skills_met
//                 ? <Chip color='#34d399' bg='rgba(16,185,129,.07)' border='#065f46'>✓ Must-Have Met</Chip>
//                 : <Chip color='#f43f5e' bg='rgba(244,63,94,.07)' border='#9f1239'>✗ Must-Have Missing</Chip>}
//               {result.years_of_experience > 0 && <Chip>{result.years_of_experience}y experience</Chip>}
//               {result.education_level && <Chip color='var(--violet)' bg='rgba(167,139,250,.07)' border='#5b21b6'>{fmt.label(result.education_level)}</Chip>}
//               {result.education_match && <Chip color='#34d399' bg='rgba(16,185,129,.07)' border='#065f46'>✓ Edu Match</Chip>}
//               {result.model_used && <Chip>{result.model_used}</Chip>}
//               {result.tokens_used > 0 && <Chip>{result.tokens_used.toLocaleString()} tokens</Chip>}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Section nav */}
//       <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',marginBottom:24}}>
//         {SECS.map(s=>(
//           <button key={s.id} onClick={()=>setSection(s.id)} className="f-mono"
//             style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',padding:'12px 20px',background:'none',border:'none',borderBottom:`2px solid ${section===s.id?'var(--accent)':'transparent'}`,color:section===s.id?'var(--accent)':'var(--text-3)',cursor:'pointer',transition:'color .15s',whiteSpace:'nowrap'}}>
//             {s.l}
//           </button>
//         ))}
//       </div>

//       {/* ── SCORES ── */}
//       {section==='scores' && (
//         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
//           <Card style={{padding:20}}>
//             <SLabel>Score Breakdown</SLabel>
//             <div style={{display:'flex',flexDirection:'column',gap:18}}>
//               {[['Skills Match',result.skill_score,'var(--cyan)'],['Experience',result.experience_score,'var(--violet)'],['Education',result.education_score,'var(--accent)'],['Overall Fit',result.fit_score,'#34d399'],['Semantic Similarity',result.semantic_similarity*100,'var(--text-2)']].map(([l,v,c])=>(
//                 <ScoreRow key={l} label={l} score={v||0} color={c} />
//               ))}
//             </div>
//           </Card>
//           <Card style={{padding:20}}>
//             <SLabel>Experience Details</SLabel>
//             <dl style={{display:'flex',flexDirection:'column',gap:10}}>
//               {[
//                 ['Years of Experience', `${result.years_of_experience}y`],
//                 ['Experience Gap',      result.experience_gap_years > 0 ? `${result.experience_gap_years}y short` : 'None'],
//                 ['Relevant Experience', fmt.pct(result.relevant_experience_pct)],
//                 ['Education Level',     fmt.label(result.education_level)||'—'],
//                 ['Education Match',     result.education_match ? '✓ Yes' : '✗ No'],
//                 ['Processing Time',     `${result.processing_time_ms}ms`],
//                 ['Reviewed At',         fmt.dateTime(result.reviewed_at)],
//               ].map(([k,v])=>(
//                 <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
//                   <dt className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{k}</dt>
//                   <dd className="f-mono" style={{fontSize:11,color:'var(--text-2)'}}>{v}</dd>
//                 </div>
//               ))}
//             </dl>
//             {result.reviewed_by_name && (
//               <p className="f-mono" style={{fontSize:10,color:'var(--text-3)',marginTop:10}}>Reviewed by: <span style={{color:'var(--accent)'}}>{result.reviewed_by_name}</span></p>
//             )}
//           </Card>
//           {result.human_notes && (
//             <Card style={{padding:20,gridColumn:'1/-1',borderLeft:'2px solid var(--accent)'}}>
//               <SLabel>HR Notes</SLabel>
//               <p className="f-sans" style={{fontSize:13,lineHeight:1.7,color:'var(--text-2)'}}>{result.human_notes}</p>
//             </Card>
//           )}
//         </div>
//       )}

//       {/* ── SKILLS ── */}
//       {section==='skills' && (
//         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
//           <Card style={{padding:20}}>
//             <SLabel>Matched Skills ({result.matched_skills?.length||0})</SLabel>
//             {result.matched_skills?.length > 0 ? (
//               <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
//                 {result.matched_skills.map((s,i)=><Chip key={i} color='#34d399' bg='rgba(16,185,129,.07)' border='#065f46'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}
//               </div>
//             ) : <p className="f-mono" style={{fontSize:11,color:'var(--text-3)'}}>None matched</p>}
//           </Card>
//           <Card style={{padding:20}}>
//             <SLabel>Missing Skills ({result.missing_skills?.length||0})</SLabel>
//             {result.missing_skills?.length > 0 ? (
//               <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
//                 {result.missing_skills.map((s,i)=><Chip key={i} color='#f43f5e' bg='rgba(244,63,94,.07)' border='#9f1239'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}
//               </div>
//             ) : <p className="f-mono" style={{fontSize:11,color:'#34d399'}}>No missing skills</p>}
//           </Card>
//           {result.bonus_skills?.length > 0 && (
//             <Card style={{padding:20}}>
//               <SLabel>Bonus Skills ({result.bonus_skills.length})</SLabel>
//               <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
//                 {result.bonus_skills.map((s,i)=><Chip key={i} color='var(--accent)' bg='rgba(245,166,35,.07)' border='rgba(245,166,35,.25)'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}
//               </div>
//             </Card>
//           )}
//         </div>
//       )}

//       {/* ── AI ANALYSIS ── */}
//       {section==='ai' && (
//         <div style={{display:'flex',flexDirection:'column',gap:16}}>
//           {result.explanation && (
//             <Card style={{padding:20,borderLeft:'2px solid var(--accent)'}}>
//               <SLabel>AI Explanation</SLabel>
//               <p className="f-sans" style={{fontSize:13,lineHeight:1.75,color:'var(--text-2)'}}>{result.explanation}</p>
//             </Card>
//           )}
//           {result.recommendation && (
//             <Card style={{padding:20,borderLeft:'2px solid var(--cyan)'}}>
//               <SLabel>Recommendation</SLabel>
//               <p className="f-sans" style={{fontSize:13,lineHeight:1.75,color:'var(--text-2)'}}>{result.recommendation}</p>
//             </Card>
//           )}
//           {result.growth_potential && (
//             <Card style={{padding:20,borderLeft:'2px solid var(--emerald)'}}>
//               <SLabel>Growth Potential</SLabel>
//               <p className="f-sans" style={{fontSize:13,lineHeight:1.75,color:'var(--text-2)'}}>{result.growth_potential}</p>
//             </Card>
//           )}
//           <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
//             {[
//               { label:'Strengths',  data:result.strengths,  color:'#34d399', bg:'rgba(16,185,129,.07)', border:'#065f46' },
//               { label:'Weaknesses', data:result.weaknesses, color:'#fb7185', bg:'rgba(244,63,94,.07)',  border:'#9f1239' },
//               { label:'Red Flags',  data:result.red_flags,  color:'#fb923c', bg:'rgba(251,146,60,.07)', border:'#c2410c' },
//             ].filter(g=>g.data?.length>0).map(g=>(
//               <Card key={g.label} style={{padding:16}}>
//                 <SLabel>{g.label}</SLabel>
//                 <div style={{display:'flex',flexDirection:'column',gap:6}}>
//                   {g.data.map((item,i)=>(
//                     <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
//                       <span style={{color:g.color,flexShrink:0,fontSize:10,marginTop:3}}>{g.label==='Strengths'?'+':g.label==='Red Flags'?'!':'−'}</span>
//                       <p className="f-sans" style={{fontSize:12,color:'var(--text-2)',lineHeight:1.6}}>{item}</p>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* ── INTERVIEW QUESTIONS ── */}
//       {section==='questions' && (
//         <div style={{display:'flex',flexDirection:'column',gap:10}}>
//           {result.interview_questions?.length > 0 ? result.interview_questions.map((q,i)=>(
//             <Card key={i} style={{padding:20,borderLeft:'2px solid var(--violet)'}}>
//               <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
//                 <span className="f-serif" style={{fontSize:24,color:'var(--violet)',fontStyle:'italic',lineHeight:1,flexShrink:0}}>Q{i+1}</span>
//                 <p className="f-sans" style={{fontSize:13,lineHeight:1.7,color:'var(--text-2)'}}>{typeof q==='object'?q.question||JSON.stringify(q):q}</p>
//               </div>
//             </Card>
//           )) : (
//             <Card style={{padding:8}}>
//               <EmptyState icon="◱" title="No interview questions" sub="AI-generated questions appear after screening completes" />
//             </Card>
//           )}
//         </div>
//       )}

//       {/* ── AGENT LOGS ── */}
//       {section==='logs' && <AgentLogPanel resultId={resultId} />}

//       <HumanDecisionModal open={decisionModal} result={result} onClose={()=>setDecisionModal(false)} onSaved={()=>{ setDecisionModal(false); load(); onDecision?.(); }} />
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    SESSION DETAIL VIEW  (shows result list)
// ══════════════════════════════════════════════════════════ */
// const EMPTY_RESULT_FILTERS = {
//   candidate_name:'', ai_decision:'', human_decision:'', status:'',
//   min_score:'', max_score:'', must_have_met:'', passed:'', has_human_decision:'',
// };

// function SessionDetail({ sessionId, onBack, onOpenResult }) {
//   const [session,setSession]   = useState(null);
//   const [results,setResults]   = useState([]);
//   const [loading,setLoading]   = useState(true);
//   const [filters,setFilters]   = useState({...EMPTY_RESULT_FILTERS});
//   const [showFilters,setShowFilters] = useState(false);
//   const [section,setSection]   = useState('results');
//   const [decisionTarget,setDecisionTarget] = useState(null);
//   const [compareIds,setCompareIds]         = useState([]);
//   const [compareOpen,setCompareOpen]       = useState(false);
//   const [sortBy,setSortBy]     = useState('overall_score');

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const r = await AxiosInstance.get(`/api/screening/v1/session/?id=${sessionId}`);
//       const d = r.data?.data || r.data;
//       setSession(d);
//     } catch { toast.error('Failed to load session'); } finally { setLoading(false); }
//   }, [sessionId]);

//   const loadResults = useCallback(async () => {
//     try {
//       const params = { session: sessionId };
//       Object.entries(filters).forEach(([k,v]) => { if (v!=='') params[k] = v; });
//       const r = await AxiosInstance.get('/api/screening/v1/result/', { params });
//       let list = r.data?.results || r.data?.data || r.data || [];
//       // client-side sort
//       list = [...list].sort((a,b) => {
//         if (sortBy==='rank') return (a.rank||999)-(b.rank||999);
//         return (b[sortBy]||0)-(a[sortBy]||0);
//       });
//       setResults(list);
//     } catch { toast.error('Failed to load results'); }
//   }, [sessionId, filters, sortBy]);

//   useEffect(() => { load(); }, [load]);
//   useEffect(() => { if (session) loadResults(); }, [loadResults, session]);

//   const toggleCompare = id => setCompareIds(p => p.includes(id) ? p.filter(x=>x!==id) : p.length<5 ? [...p,id] : (toast.warn('Max 5 for compare'), p));

//   if (loading && !session) return (
//     <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:1100}}>
//       {[...Array(4)].map((_,i)=><div key={i} style={{padding:20,background:'var(--card)',border:'1px solid var(--border)'}}><Skel width='40%' height={16}/><div style={{height:8}}/><Skel width='100%' height={10}/></div>)}
//     </div>
//   );
//   if (!session) return null;

//   const sc = SESSION_STATUS_CFG[session.status] || SESSION_STATUS_CFG.pending;
//   const SECS = [
//     { id:'results',  l:`Results (${results.length})` },
//     { id:'overview', l:'Session Overview'             },
//   ];
//   const activeFilterCount = Object.values(filters).filter(v=>v!=='').length;

//   return (
//     <div className="anim-fade-up" style={{maxWidth:1100}}>
//       {/* Breadcrumb */}
//       <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:24}}>
//         <button onClick={onBack} className="f-mono" style={{fontSize:10,letterSpacing:'0.18em',textTransform:'uppercase',background:'none',border:'none',color:'var(--text-3)',cursor:'pointer'}}
//           onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'}
//           onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>← All Sessions</button>
//         <span className="f-mono" style={{fontSize:10,color:'var(--border-hi)'}}>/</span>
//         <span className="f-mono" style={{fontSize:10,color:'var(--text-2)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:240,whiteSpace:'nowrap'}}>{session.job_title}</span>
//         <div style={{flex:1}}/>
//         <div style={{display:'flex',gap:8}}>
//           {compareIds.length >= 2 && (
//             <PrimaryBtn onClick={()=>setCompareOpen(true)} style={{padding:'8px 16px'}}>
//               ⬡ Compare ({compareIds.length})
//             </PrimaryBtn>
//           )}
//           <GhostBtn onClick={()=>{ load(); loadResults(); }}>↻</GhostBtn>
//         </div>
//       </div>

//       {/* Live progress banner */}
//       {session.status === 'processing' && (
//         <SessionProgressBanner sessionId={sessionId} onComplete={()=>{ load(); loadResults(); }} />
//       )}

//       {/* Hero */}
//       <div style={{padding:24,marginBottom:2,background:'var(--card)',border:'1px solid var(--border)',borderLeft:`3px solid ${sc.bar}`}}>
//         <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:16}}>
//           <div>
//             <h1 className="f-serif" style={{fontSize:26,color:'var(--text)',marginBottom:5,lineHeight:1.15}}>{session.job_title}</h1>
//             <p className="f-mono" style={{fontSize:10,color:'var(--text-3)',letterSpacing:'0.15em',textTransform:'uppercase'}}>
//               by {session.initiated_by_name||'—'} · {fmt.dateTime(session.created_at)}
//             </p>
//           </div>
//           <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
//             <SessionStatusPill status={session.status} />
//             {session.pass_rate_pct !== null && session.pass_rate_pct !== undefined && (
//               <span className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>Pass rate: <span style={{color:'#34d399',fontWeight:600}}>{session.pass_rate_pct}%</span></span>
//             )}
//           </div>
//         </div>
//         <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
//           <Chip>{session.total_resumes} resumes</Chip>
//           <Chip color='var(--accent)' bg='rgba(245,166,35,.07)' border='rgba(245,166,35,.25)'>threshold {session.pass_threshold}%</Chip>
//           <Chip color='var(--violet)' bg='rgba(167,139,250,.07)' border='rgba(167,139,250,.25)'>top {session.top_n_candidates}</Chip>
//           {session.total_cost_usd && parseFloat(session.total_cost_usd)>0 && <Chip color='#34d399'>{fmt.usd(session.total_cost_usd)}</Chip>}
//           {session.total_tokens_used > 0 && <Chip>{session.total_tokens_used.toLocaleString()} tokens</Chip>}
//           {session.duration_seconds && <Chip>⏱ {fmt.duration(session.duration_seconds)}</Chip>}
//           {session.completed_at && <Chip>✓ {fmt.date(session.completed_at)}</Chip>}
//         </div>
//         {session.status==='processing' && (
//           <div style={{marginTop:16}}>
//             <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
//               <span className="f-mono" style={{fontSize:9,color:'var(--text-3)'}}>Progress</span>
//               <span className="f-mono" style={{fontSize:9,color:'#fb923c'}}>{session.progress_pct}%</span>
//             </div>
//             <ProgBar pct={session.progress_pct} color='#fb923c' height={3} />
//           </div>
//         )}
//       </div>

//       {/* Section nav */}
//       <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',marginBottom:24}}>
//         {SECS.map(s=>(
//           <button key={s.id} onClick={()=>setSection(s.id)} className="f-mono"
//             style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',padding:'12px 20px',background:'none',border:'none',borderBottom:`2px solid ${section===s.id?'var(--accent)':'transparent'}`,color:section===s.id?'var(--accent)':'var(--text-3)',cursor:'pointer',transition:'color .15s',whiteSpace:'nowrap'}}>
//             {s.l}
//           </button>
//         ))}
//       </div>

//       {/* ── RESULTS ── */}
//       {section==='results' && (
//         <div style={{display:'flex',flexDirection:'column',gap:14}}>
//           {/* Toolbar */}
//           <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,justifyContent:'space-between'}}>
//             <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
//               <GhostBtn onClick={()=>setShowFilters(p=>!p)} active={showFilters}>
//                 ⊟ Filters{activeFilterCount>0?` · ${activeFilterCount}`:''}
//               </GhostBtn>
//               {activeFilterCount>0 && <GhostBtn onClick={()=>setFilters({...EMPTY_RESULT_FILTERS})}>✕ Clear</GhostBtn>}
//             </div>
//             <div style={{display:'flex',gap:8,alignItems:'center'}}>
//               {compareIds.length>0 && <span className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{compareIds.length} selected</span>}
//               <select style={{padding:'6px 10px',width:'auto',cursor:'pointer'}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
//                 {[['overall_score','Overall Score'],['skill_score','Skill Score'],['experience_score','Exp Score'],['education_score','Edu Score'],['rank','Rank']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
//               </select>
//             </div>
//           </div>

//           {/* Filters */}
//           {showFilters && (
//             <div className="anim-slide-in" style={{padding:14,background:'var(--surface)',border:'1px solid var(--border)'}}>
//               <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
//                 <input style={{padding:'9px 12px'}} placeholder="Candidate name…" value={filters.candidate_name} onChange={e=>setFilters(p=>({...p,candidate_name:e.target.value}))} />
//                 <input type="number" style={{padding:'9px 12px'}} placeholder="Min score" value={filters.min_score} onChange={e=>setFilters(p=>({...p,min_score:e.target.value}))} />
//                 <input type="number" style={{padding:'9px 12px'}} placeholder="Max score" value={filters.max_score} onChange={e=>setFilters(p=>({...p,max_score:e.target.value}))} />
//                 <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.ai_decision} onChange={e=>setFilters(p=>({...p,ai_decision:e.target.value}))}>
//                   <option value="">AI Decision</option>
//                   {DECISIONS.map(d=><option key={d} value={d}>{fmt.label(d)}</option>)}
//                 </select>
//                 <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.human_decision} onChange={e=>setFilters(p=>({...p,human_decision:e.target.value}))}>
//                   <option value="">HR Decision</option>
//                   {DECISIONS.map(d=><option key={d} value={d}>{fmt.label(d)}</option>)}
//                 </select>
//                 <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.must_have_met} onChange={e=>setFilters(p=>({...p,must_have_met:e.target.value}))}>
//                   <option value="">Must-Have</option>
//                   <option value="true">Met ✓</option>
//                   <option value="false">Not Met ✗</option>
//                 </select>
//                 <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.passed} onChange={e=>setFilters(p=>({...p,passed:e.target.value}))}>
//                   <option value="">All Candidates</option>
//                   <option value="true">Passed Only</option>
//                   <option value="false">Failed Only</option>
//                 </select>
//                 <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.has_human_decision} onChange={e=>setFilters(p=>({...p,has_human_decision:e.target.value}))}>
//                   <option value="">All Decisions</option>
//                   <option value="true">HR Reviewed</option>
//                   <option value="false">Awaiting HR</option>
//                 </select>
//                 <GhostBtn onClick={()=>setFilters({...EMPTY_RESULT_FILTERS})} style={{padding:'9px',width:'100%',justifyContent:'center'}}>✕ Clear</GhostBtn>
//               </div>
//             </div>
//           )}

//           {/* Table header */}
//           {results.length > 0 && (
//             <div className="f-mono" style={{display:'grid',gridTemplateColumns:'30px 40px 1fr 180px 260px',gap:12,padding:'8px 16px',fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)',background:'var(--surface)',border:'1px solid var(--border)'}}>
//               <span/>
//               <span>Rank</span>
//               <span>Candidate</span>
//               <span style={{textAlign:'right'}}>Scores</span>
//               <span>Decisions</span>
//             </div>
//           )}

//           {/* Rows */}
//           {results.length > 0 ? (
//             <Card style={{overflow:'hidden',padding:0}}>
//               {results.map(r=>(
//                 <ResultRow key={r.id} result={r}
//                   onSelect={onOpenResult}
//                   onDecision={r=>setDecisionTarget(r)}
//                   isSelected={compareIds.includes(r.id)}
//                   onToggleCompare={toggleCompare} />
//               ))}
//             </Card>
//           ) : (
//             <Card style={{padding:8}}>
//               <EmptyState icon={session.status==='completed'?'◎':'◱'}
//                 title={session.status==='completed'?'No results match filters':'Waiting for results'}
//                 sub={session.status==='completed'?'Try adjusting filter criteria':'Results appear as AI agents complete processing'} />
//             </Card>
//           )}
//         </div>
//       )}

//       {/* ── OVERVIEW ── */}
//       {section==='overview' && (
//         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
//           <Card style={{padding:20}}>
//             <SLabel>Session Progress</SLabel>
//             <div style={{display:'flex',flexDirection:'column',gap:14}}>
//               {[
//                 ['Total Resumes',  session.total_resumes,   'var(--text-2)'],
//                 ['Processed',      session.processed_count, '#34d399'      ],
//                 ['Failed',         session.failed_count,    '#f43f5e'      ],
//                 ['Duration',       fmt.duration(session.duration_seconds), 'var(--cyan)'],
//                 ['Cost',           fmt.usd(session.total_cost_usd), '#34d399'],
//                 ['Tokens',         session.total_tokens_used?.toLocaleString()||'0', 'var(--violet)'],
//               ].map(([k,v,c])=>(
//                 <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
//                   <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{k}</span>
//                   <span className="f-mono" style={{fontSize:12,color:c,fontWeight:500}}>{v}</span>
//                 </div>
//               ))}
//             </div>
//           </Card>
//           {session.top_candidates?.length > 0 && (
//             <Card style={{padding:20}}>
//               <SLabel>Top 5 Candidates</SLabel>
//               <div style={{display:'flex',flexDirection:'column',gap:10}}>
//                 {session.top_candidates.map((c,i)=>{
//                   const scoreCol = SCORE_COLOR(c.overall_score);
//                   return (
//                     <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,paddingBottom:10,borderBottom:'1px solid var(--border)',cursor:'pointer'}}
//                       onClick={()=>onOpenResult(c.id)}>
//                       <span className="f-serif" style={{fontSize:18,color:i===0?'var(--accent)':'var(--text-3)',fontStyle:'italic',width:28,textAlign:'center'}}>#{i+1}</span>
//                       <CandidateAvatar name={c.candidate_name} size={30} />
//                       <div style={{flex:1,minWidth:0}}>
//                         <p className="f-sans" style={{fontSize:12,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.candidate_name||'—'}</p>
//                         <p className="f-mono" style={{fontSize:9,color:'var(--text-3)'}}>{c.candidate_email||'—'}</p>
//                       </div>
//                       <span className="f-serif" style={{fontSize:18,color:scoreCol,fontStyle:'italic',lineHeight:1}}>{fmt.score(c.overall_score)}</span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </Card>
//           )}
//         </div>
//       )}

//       {/* Modals */}
//       <HumanDecisionModal open={!!decisionTarget} result={decisionTarget} onClose={()=>setDecisionTarget(null)} onSaved={()=>{ setDecisionTarget(null); loadResults(); }} />
//       <CompareModal open={compareOpen} resultIds={compareIds} onClose={()=>setCompareOpen(false)} />
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    SESSION FILTERS
// ══════════════════════════════════════════════════════════ */
// function SessionFiltersPanel({ filters, onChange, onClear }) {
//   return (
//     <div className="anim-slide-in" style={{padding:14,marginBottom:20,background:'var(--surface)',border:'1px solid var(--border)'}}>
//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
//         <select style={{padding:'9px 12px',cursor:'pointer'}} value={filters.status} onChange={e=>onChange('status',e.target.value)}>
//           <option value="">All Statuses</option>
//           {['pending','processing','completed','failed'].map(s=><option key={s} value={s}>{fmt.label(s)}</option>)}
//         </select>
//         <input style={{padding:'9px 12px'}} placeholder="Min resumes" type="number" value={filters.min_resumes} onChange={e=>onChange('min_resumes',e.target.value)} />
//         <GhostBtn onClick={onClear} style={{padding:'9px',justifyContent:'center',width:'100%'}}>✕ Clear</GhostBtn>
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    ANALYTICS VIEW
// ══════════════════════════════════════════════════════════ */
// function AnalyticsView({ onRefresh }) {
//   const [data,setData]     = useState(null);
//   const [loading,setLoading] = useState(true);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const r = await AxiosInstance.get('/api/screening/v1/analytics/');
//       setData(r.data?.data || r.data);
//     } catch { toast.error('Failed to load analytics'); } finally { setLoading(false); }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   if (loading) return (
//     <div style={{display:'flex',flexDirection:'column',gap:16}}>
//       {[...Array(4)].map((_,i)=><div key={i} style={{padding:20,background:'var(--card)',border:'1px solid var(--border)'}}><Skel width='40%' height={18}/><div style={{height:10}}/><Skel width='100%' height={32}/></div>)}
//     </div>
//   );
//   if (!data) return null;

//   const { sessions, candidates, human_decisions, cost, top_jobs_by_screenings } = data;
//   const totalCandidates = candidates?.total_screened || 1;

//   return (
//     <div className="anim-fade-up" style={{display:'flex',flexDirection:'column',gap:20}}>
//       <div style={{display:'flex',justifyContent:'flex-end'}}>
//         <GhostBtn onClick={()=>{ load(); onRefresh?.(); }}>↻ Refresh</GhostBtn>
//       </div>

//       {/* Big numbers */}
//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12}}>
//         {[
//           { label:'Total Sessions',  val:sessions?.total||0,            color:'var(--text)',    sub:'all time'              },
//           { label:'Completed',       val:sessions?.completed||0,        color:'var(--emerald)', sub:'fully processed'       },
//           { label:'Screened',        val:candidates?.total_screened||0, color:'var(--cyan)',    sub:'candidates evaluated'  },
//           { label:'Avg Score',       val:`${candidates?.avg_score||0}`, color:'var(--accent)',  sub:'overall average'       },
//           { label:'HR Reviewed',     val:human_decisions?.total_reviewed||0, color:'var(--violet)', sub:'decisions made'    },
//           { label:'Total Cost',      val:fmt.usd(cost?.total_cost_usd||0), color:'#34d399',    sub:'API spend'             },
//         ].map(s=>(
//           <Card key={s.label} style={{padding:20}}>
//             <p className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:12}}>{s.label}</p>
//             <p className="f-serif" style={{fontSize:36,color:s.color,lineHeight:1,marginBottom:4,fontStyle:'italic'}}>{s.val}</p>
//             <p className="f-mono" style={{fontSize:10,color:'var(--text-3)'}}>{s.sub}</p>
//           </Card>
//         ))}
//       </div>

//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
//         {/* Session status breakdown */}
//         <Card style={{padding:20}}>
//           <SLabel>Session Status</SLabel>
//           <div style={{display:'flex',flexDirection:'column',gap:14}}>
//             {[['completed','#34d399'],['in_progress','#fb923c'],['pending','#4a5470'],['failed','#f43f5e']].map(([k,color])=>{
//               const v = sessions?.[k]||0;
//               const pct = sessions?.total>0 ? v/sessions.total*100 : 0;
//               return (
//                 <div key={k}>
//                   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
//                     <span className="f-mono" style={{fontSize:11,color:'var(--text-2)'}}>{fmt.label(k)}</span>
//                     <span><span className="f-serif" style={{fontSize:18,color,fontStyle:'italic'}}>{v}</span><span className="f-mono" style={{fontSize:10,color:'var(--text-3)',marginLeft:6}}>({pct.toFixed(1)}%)</span></span>
//                   </div>
//                   <ProgBar pct={pct} color={color} height={3} />
//                 </div>
//               );
//             })}
//           </div>
//         </Card>

//         {/* AI decisions */}
//         <Card style={{padding:20}}>
//           <SLabel>AI Decisions</SLabel>
//           <div style={{display:'flex',flexDirection:'column',gap:12}}>
//             {DECISIONS.map(d => {
//               const c = DECISION_CFG[d];
//               const v = candidates?.by_ai_decision?.[d]||0;
//               const pct = totalCandidates > 0 ? v/totalCandidates*100 : 0;
//               return (
//                 <div key={d}>
//                   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
//                     <span style={{display:'flex',alignItems:'center',gap:7}}>
//                       <span style={{fontSize:10,color:c.color}}>{c.icon}</span>
//                       <span className="f-mono" style={{fontSize:11,color:'var(--text-2)'}}>{fmt.label(d)}</span>
//                     </span>
//                     <span><span className="f-serif" style={{fontSize:16,color:c.color,fontStyle:'italic'}}>{v}</span><span className="f-mono" style={{fontSize:9,color:'var(--text-3)',marginLeft:5}}>({pct.toFixed(1)}%)</span></span>
//                   </div>
//                   <ProgBar pct={pct} color={c.color} height={2} />
//                 </div>
//               );
//             })}
//           </div>
//         </Card>

//         {/* HR decisions */}
//         <Card style={{padding:20}}>
//           <SLabel>HR Decisions</SLabel>
//           <div style={{display:'flex',flexDirection:'column',gap:12}}>
//             {DECISIONS.map(d => {
//               const c = DECISION_CFG[d];
//               const v = human_decisions?.by_decision?.[d]||0;
//               const total = human_decisions?.total_reviewed||1;
//               const pct = total>0 ? v/total*100 : 0;
//               return (
//                 <div key={d}>
//                   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
//                     <span style={{display:'flex',alignItems:'center',gap:7}}>
//                       <span style={{fontSize:10,color:c.color}}>{c.icon}</span>
//                       <span className="f-mono" style={{fontSize:11,color:'var(--text-2)'}}>{fmt.label(d)}</span>
//                     </span>
//                     <span><span className="f-serif" style={{fontSize:16,color:c.color,fontStyle:'italic'}}>{v}</span></span>
//                   </div>
//                   <ProgBar pct={pct} color={c.color} height={2} />
//                 </div>
//               );
//             })}
//           </div>
//         </Card>

//         {/* Score averages */}
//         <Card style={{padding:20}}>
//           <SLabel>Average Scores</SLabel>
//           <div style={{display:'flex',flexDirection:'column',gap:16}}>
//             {[
//               ['Overall',  candidates?.avg_score||0,       'var(--text-2)'],
//               ['Skills',   candidates?.avg_skill_score||0, 'var(--cyan)'],
//               ['Exp',      candidates?.avg_exp_score||0,   'var(--violet)'],
//             ].map(([l,v,c])=><ScoreRow key={l} label={l} score={v} color={c} />)}
//           </div>
//         </Card>

//         {/* Top jobs */}
//         {top_jobs_by_screenings?.length > 0 && (
//           <Card style={{padding:20,gridColumn:'1/-1'}}>
//             <SLabel>Most Screened Jobs</SLabel>
//             <div style={{display:'flex',flexDirection:'column',gap:10}}>
//               {top_jobs_by_screenings.map((j,i)=>(
//                 <div key={i} style={{display:'flex',alignItems:'center',gap:14,paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
//                   <span className="f-serif" style={{fontSize:20,color:i<3?'var(--accent)':'var(--text-3)',fontStyle:'italic',width:32,textAlign:'center',flexShrink:0}}>#{i+1}</span>
//                   <span className="f-sans" style={{flex:1,fontSize:13,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.job__title}</span>
//                   <Chip color='var(--cyan)' bg='rgba(34,211,238,.07)' border='#0e7490'>{j.count} sessions</Chip>
//                 </div>
//               ))}
//             </div>
//           </Card>
//         )}

//         {/* Cost breakdown */}
//         <Card style={{padding:20}}>
//           <SLabel>Cost Tracking</SLabel>
//           <dl style={{display:'flex',flexDirection:'column',gap:12}}>
//             {[['Total Tokens', (cost?.total_tokens_used||0).toLocaleString(),'var(--violet)'],['Total Cost USD', fmt.usd(cost?.total_cost_usd||0),'#34d399']].map(([k,v,c])=>(
//               <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
//                 <dt className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{k}</dt>
//                 <dd className="f-mono" style={{fontSize:14,color:c,fontWeight:600}}>{v}</dd>
//               </div>
//             ))}
//           </dl>
//         </Card>
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════════
//    ROOT PAGE
// ══════════════════════════════════════════════════════════ */
// const EMPTY_SESSION_FILTERS = { status:'', min_resumes:'' };

// export default function ScreeningPage() {
//   const [view,setView]       = useState('list');   // list | session | result | analytics
//   const [tab,setTab]         = useState('sessions');
//   const [sessions,setSessions]   = useState([]);
//   const [stats,setStats]         = useState({});
//   const [loading,setLoading]     = useState(false);
//   const [filters,setFilters]     = useState({...EMPTY_SESSION_FILTERS});
//   const [showFilters,setShowFilters]   = useState(false);
//   const [selectedSession,setSelectedSession] = useState(null);
//   const [selectedResult,setSelectedResult]   = useState(null);
//   const [startModal,setStartModal]   = useState(false);
//   const [deleteTarget,setDeleteTarget] = useState(null);
//   const [liveSessionId,setLiveSessionId] = useState(null);

//   const loadSessions = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = {};
//       Object.entries(filters).forEach(([k,v]) => { if (v!=='') params[k] = v; });
//       const r = await AxiosInstance.get('/api/screening/v1/session/', { params });
//       setSessions(r.data?.results || r.data?.data || r.data || []);
//     } catch { toast.error('Failed to load sessions'); } finally { setLoading(false); }
//   }, [filters]);

//   const loadStats = useCallback(async () => {
//     try { const r = await AxiosInstance.get('/api/screening/v1/stats/'); setStats(r.data?.data||r.data||{}); } catch {}
//   }, []);

//   useEffect(() => { loadSessions(); loadStats(); }, [loadSessions, loadStats]);

//   const openSession = id => { setSelectedSession(id); setView('session'); };
//   const openResult  = id => { setSelectedResult(id);  setView('result');  };
//   const backToList  = ()  => { setView('list'); setSelectedSession(null); setSelectedResult(null); };
//   const backToSession = () => { setView('session'); setSelectedResult(null); };

//   const doDelete = async () => {
//     if (!deleteTarget) return;
//     try {
//       await AxiosInstance.delete(`/api/screening/v1/session/?id=${deleteTarget.id}`);
//       toast.success('Session deleted'); setDeleteTarget(null); loadSessions(); loadStats();
//     } catch(e) { toast.error(e.response?.data?.message||'Delete failed'); }
//   };

//   const handleStarted = sessionId => {
//     setLiveSessionId(sessionId);
//     loadSessions(); loadStats();
//     openSession(sessionId);
//   };

//   const activeFilterCount = Object.values(filters).filter(v=>v!=='').length;

//   return (
//     <>
//       <style>{GLOBAL_CSS}</style>
//       <div className="noise-overlay" />
//       <Toasts />

//       <div className="f-sans" style={{background:'var(--bg)',color:'var(--text)',minHeight:'100vh',position:'relative',zIndex:1}}>

//         {/* ══ HEADER ══ */}
//         <header style={{position:'sticky',top:0,zIndex:40,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',height:56,background:'rgba(7,9,15,.94)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)'}}>
//           <div style={{display:'flex',alignItems:'center',gap:20}}>
//             <div style={{display:'flex',alignItems:'baseline',gap:3}}>
//               <span className="f-serif" style={{fontSize:20,color:'var(--text)',lineHeight:1}}>Screening</span>
//               <span className="f-serif" style={{fontSize:20,color:'var(--accent)',lineHeight:1}}>.</span>
//             </div>
//             {view==='list' && (
//               <>
//                 <span style={{width:1,height:16,background:'var(--border)'}} />
//                 <span className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)'}}>
//                   {tab==='sessions' ? (loading?'…':`${sessions.length} sessions`) : 'Analytics'}
//                 </span>
//               </>
//             )}
//           </div>
//           {view==='list' && tab==='sessions' && (
//             <PrimaryBtn onClick={()=>setStartModal(true)} style={{padding:'8px 20px'}}>⚡ Start Screening</PrimaryBtn>
//           )}
//         </header>

//         {/* ══ STATS STRIP ══ */}
//         {view==='list' && (
//           <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
//             {[
//               { label:'Sessions',   val:stats.total_sessions??sessions.length, color:'var(--text)',    bar:'var(--border-hi)' },
//               { label:'Completed',  val:stats.by_session_status?.completed??'—', color:'var(--emerald)', bar:'var(--emerald)'   },
//               { label:'Processing', val:stats.by_session_status?.processing??'—', color:'#fb923c',      bar:'#fb923c'          },
//               { label:'Screened',   val:stats.total_results??'—',              color:'var(--cyan)',    bar:'var(--cyan)'      },
//               { label:'Failed',     val:stats.by_session_status?.failed??'—',  color:'var(--rose)',    bar:'var(--rose)'      },
//             ].map(s=>(
//               <div key={s.label} style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'10px 24px',minWidth:96,flexShrink:0,overflow:'hidden',borderRight:'1px solid var(--border)'}}>
//                 <span className="f-serif" style={{fontSize:24,color:s.color,lineHeight:1,marginBottom:4,fontStyle:'italic'}}>{s.val}</span>
//                 <span className="f-mono" style={{fontSize:9,letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-3)'}}>{s.label}</span>
//                 <span style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:s.bar,opacity:.4}} />
//               </div>
//             ))}
//           </div>
//         )}

//         {/* ══ TABS ══ */}
//         {view==='list' && (
//           <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>
//             {[{id:'sessions',l:'All Sessions'},{id:'analytics',l:'Analytics'}].map(n=>(
//               <button key={n.id} onClick={()=>setTab(n.id)} className="f-mono"
//                 style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',padding:'12px 24px',background:'none',border:'none',borderBottom:`2px solid ${tab===n.id?'var(--accent)':'transparent'}`,color:tab===n.id?'var(--accent)':'var(--text-3)',cursor:'pointer',transition:'color .15s'}}>
//                 {n.l}
//               </button>
//             ))}
//           </div>
//         )}

//         {/* ══ CONTENT ══ */}
//         <main style={{maxWidth:1200,margin:'0 auto',padding:'28px 24px'}}>

//           {/* ── List ── */}
//           {view==='list' && tab==='sessions' && (
//             <div>
//               <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:20}}>
//                 <div style={{display:'flex',gap:8}}>
//                   <GhostBtn onClick={()=>setShowFilters(p=>!p)} active={showFilters}>
//                     ⊟ Filters{activeFilterCount>0?` · ${activeFilterCount}`:''}
//                   </GhostBtn>
//                   {activeFilterCount>0 && <GhostBtn onClick={()=>setFilters({...EMPTY_SESSION_FILTERS})}>✕ Clear</GhostBtn>}
//                   <GhostBtn onClick={()=>{ loadSessions(); loadStats(); }}>↻</GhostBtn>
//                 </div>
//                 <span className="f-mono" style={{fontSize:10,color:'var(--text-3)',display:'flex',alignItems:'center',gap:8}}>
//                   {loading ? <><Spinner size={10}/> Loading…</> : `${sessions.length} session${sessions.length!==1?'s':''}`}
//                 </span>
//               </div>

//               {showFilters && <SessionFiltersPanel filters={filters} onChange={(k,v)=>setFilters(p=>({...p,[k]:v}))} onClear={()=>setFilters({...EMPTY_SESSION_FILTERS})} />}

//               {loading ? (
//                 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
//                   {[...Array(6)].map((_,i)=>(
//                     <div key={i} style={{display:'flex',overflow:'hidden',background:'var(--card)',border:'1px solid var(--border)'}}>
//                       <div style={{width:3,background:'var(--border-hi)',flexShrink:0}} />
//                       <div style={{flex:1,padding:16,display:'flex',flexDirection:'column',gap:12}}>
//                         <Skel width='60%' height={16}/><Skel width='35%' height={10}/>
//                         <div style={{display:'flex',gap:6}}><Skel width={70} height={18}/><Skel width={90} height={18}/><Skel width={60} height={18}/></div>
//                         <Skel width='100%' height={2}/><Skel width='40%' height={10}/>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : sessions.length > 0 ? (
//                 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
//                   {sessions.map(s=>(
//                     <SessionCard key={s.id} session={s}
//                       onSelect={openSession}
//                       onDelete={s=>setDeleteTarget(s)} />
//                   ))}
//                 </div>
//               ) : (
//                 <div style={{background:'var(--card)',border:'1px solid var(--border)'}}>
//                   <EmptyState
//                     icon={activeFilterCount>0?'◎':'⊡'}
//                     title={activeFilterCount>0?'No sessions match filters':'No screening sessions yet'}
//                     sub={activeFilterCount>0?'Try adjusting your filters':'Start your first AI screening session to rank and evaluate candidates against a job'}
//                     action={activeFilterCount>0
//                       ? <GhostBtn onClick={()=>setFilters({...EMPTY_SESSION_FILTERS})}>Clear Filters</GhostBtn>
//                       : <PrimaryBtn onClick={()=>setStartModal(true)} style={{padding:'10px 32px'}}>⚡ Start First Screening</PrimaryBtn>} />
//                 </div>
//               )}
//             </div>
//           )}

//           {/* ── Analytics ── */}
//           {view==='list' && tab==='analytics' && (
//             <AnalyticsView onRefresh={()=>{ loadSessions(); loadStats(); }} />
//           )}

//           {/* ── Session detail ── */}
//           {view==='session' && selectedSession && (
//             <SessionDetail
//               sessionId={selectedSession}
//               onBack={backToList}
//               onOpenResult={id=>{ setSelectedResult(id); setView('result'); }} />
//           )}

//           {/* ── Result detail ── */}
//           {view==='result' && selectedResult && (
//             <ResultDetail
//               resultId={selectedResult}
//               onBack={selectedSession ? backToSession : backToList}
//               onDecision={()=>{}} />
//           )}
//         </main>

//         <footer style={{borderTop:'1px solid var(--border)',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:40}}>
//           <span className="f-mono" style={{fontSize:9,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-3)'}}>Screening · Recruitment Platform</span>
//           <span className="f-serif" style={{fontSize:14,color:'var(--border-hi)',fontStyle:'italic'}}>◈</span>
//         </footer>
//       </div>

//       {/* ══ MODALS ══ */}
//       <StartScreeningModal open={startModal} onClose={()=>setStartModal(false)} onStarted={handleStarted} />
//       <ConfirmModal
//         open={!!deleteTarget}
//         title="Delete this session?"
//         confirmLabel="Confirm Delete"
//         message={`Session for "${deleteTarget?.job_title}" will be soft-deleted. This cannot be undone.`}
//         onConfirm={doDelete}
//         onCancel={()=>setDeleteTarget(null)} />
//     </>
//   );
// }



'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import AxiosInstance from '@/components/AxiosInstance';

/* ══════════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

  :root {
    --bg:          #f5f7fa;
    --surface:     #ffffff;
    --card:        #ffffff;
    --card-alt:    #f8fafc;
    --border:      #e2e8f0;
    --border-hi:   #cbd5e1;
    --text:        #0f172a;
    --text-2:      #475569;
    --text-3:      #94a3b8;
    --text-4:      #cbd5e1;

    --black:       #0f172a;
    --black-hi:    #1e293b;
    --blue:        #2563eb;
    --blue-hi:     #1d4ed8;
    --blue-light:  #eff6ff;
    --blue-mid:    #dbeafe;

    --cyan:        #0891b2;
    --emerald:     #059669;
    --rose:        #e11d48;
    --violet:      #7c3aed;
    --amber:       #d97706;
    --orange:      #ea580c;
    --teal:        #0d9488;

    --shadow-sm:   0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04);
    --shadow-md:   0 4px 16px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.05);
    --shadow-lg:   0 12px 40px rgba(15,23,42,.12), 0 4px 12px rgba(15,23,42,.06);
    --shadow-xl:   0 24px 64px rgba(15,23,42,.16);
    --shadow-blue: 0 4px 20px rgba(37,99,235,.2);
  }

  .f-display { font-family: 'Playfair Display', serif; }
  .f-body    { font-family: 'Plus Jakarta Sans', sans-serif; }
  .f-mono    { font-family: 'JetBrains Mono', monospace; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideRight{ from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.6)} }
  @keyframes shimmer   { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes toastIn   { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }

  .anim-fade-up    { animation: fadeUp .3s cubic-bezier(.16,1,.3,1) forwards; }
  .anim-fade-in    { animation: fadeIn .2s ease forwards; }
  .anim-slide-down { animation: slideDown .25s cubic-bezier(.16,1,.3,1) forwards; }
  .anim-slide-right{ animation: slideRight .3s cubic-bezier(.16,1,.3,1) forwards; }
  .anim-spin       { animation: spin .6s linear infinite; }
  .anim-live       { animation: livePulse 2s ease infinite; }

  .shimmer-skeleton {
    background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
    background-size: 600px 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 6px;
  }

  input, textarea, select {
    background: var(--surface) !important;
    border: 1.5px solid var(--border) !important;
    color: var(--text) !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    outline: none !important;
    border-radius: 8px !important;
    transition: border-color .15s, box-shadow .15s !important;
  }
  input:focus, textarea:focus, select:focus {
    border-color: var(--blue) !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,.1) !important;
  }
  input::placeholder, textarea::placeholder { color: var(--text-3) !important; font-weight: 400 !important; }
  select { cursor: pointer; }
  select option { background: #fff; color: var(--text); }
  textarea { resize: vertical; }
  input[type=range] { accent-color: var(--blue); cursor:pointer; border:none !important; box-shadow:none !important; background:transparent !important; }
  input[type=checkbox] { width:15px; height:15px; cursor:pointer; accent-color: var(--blue); border-radius: 4px !important; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-3); }

  * { box-sizing: border-box; margin: 0; padding: 0; }
`;

/* ══════════════════════════════════════════════════════════
   CONFIG MAPS
══════════════════════════════════════════════════════════ */
const SESSION_STATUS_CFG = {
  pending:    { bar:'#94a3b8', dot:'#94a3b8', bg:'#f8fafc',  border:'#e2e8f0', color:'#64748b', label:'Pending'    },
  processing: { bar:'#ea580c', dot:'#ea580c', bg:'#fff7ed',  border:'#fed7aa', color:'#c2410c', label:'Processing', live:true },
  completed:  { bar:'#059669', dot:'#059669', bg:'#f0fdf4',  border:'#86efac', color:'#16a34a', label:'Completed'  },
  failed:     { bar:'#e11d48', dot:'#e11d48', bg:'#fff1f2',  border:'#fecdd3', color:'#be123c', label:'Failed'     },
};

const DECISION_CFG = {
  shortlisted: { bg:'#f0fdf4',  border:'#86efac', color:'#16a34a', icon:'★', accent:'#059669' },
  interview:   { bg:'#eff6ff',  border:'#bfdbfe', color:'#2563eb', icon:'◆', accent:'#2563eb' },
  maybe:       { bg:'#fffbeb',  border:'#fde68a', color:'#b45309', icon:'◈', accent:'#d97706' },
  hold:        { bg:'#fff7ed',  border:'#fed7aa', color:'#c2410c', icon:'⏸', accent:'#ea580c' },
  rejected:    { bg:'#fff1f2',  border:'#fecdd3', color:'#be123c', icon:'✗', accent:'#e11d48' },
  '':          { bg:'#f8fafc',  border:'#e2e8f0', color:'#94a3b8', icon:'○', accent:'#94a3b8' },
};

const AGENT_CFG = {
  orchestrator:      { color:'var(--amber)',   icon:'🎯', bg:'rgba(217,119,6,.06)',  border:'rgba(217,119,6,.2)'  },
  resume_parser:     { color:'var(--blue)',    icon:'📄', bg:'var(--blue-light)',    border:'var(--blue-mid)'     },
  jd_analyzer:       { color:'var(--violet)',  icon:'🔍', bg:'rgba(124,58,237,.06)', border:'rgba(124,58,237,.2)' },
  skill_matcher:     { color:'var(--emerald)', icon:'⚡', bg:'rgba(5,150,105,.06)',  border:'rgba(5,150,105,.2)'  },
  experience_scorer: { color:'var(--orange)',  icon:'📊', bg:'#fff7ed',              border:'#fed7aa'             },
  education_scorer:  { color:'var(--cyan)',    icon:'🎓', bg:'#ecfeff',              border:'#a5f3fc'             },
  rag_retriever:     { color:'var(--violet)',  icon:'🔗', bg:'rgba(124,58,237,.06)', border:'rgba(124,58,237,.2)' },
  explanation:       { color:'var(--amber)',   icon:'💡', bg:'rgba(217,119,6,.06)',  border:'rgba(217,119,6,.2)'  },
};

const SCORE_COLOR = s =>
  s >= 80 ? '#059669' :
  s >= 60 ? '#0891b2' :
  s >= 40 ? '#d97706' : '#e11d48';

const DECISIONS = ['shortlisted','interview','maybe','hold','rejected'];

const fmt = {
  label:    s => s ? s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : '—',
  date:     d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—',
  dateTime: d => d ? new Date(d).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—',
  score:    n => (n ?? 0).toFixed(1),
  pct:      n => `${(n ?? 0).toFixed(1)}%`,
  duration: s => s ? (s >= 60 ? `${(s/60).toFixed(1)}m` : `${s}s`) : '—',
  usd:      n => `$${Number(n||0).toFixed(4)}`,
};

/* ══════════════════════════════════════════════════════════
   TOAST SYSTEM
══════════════════════════════════════════════════════════ */
let _setToasts = null;
const toast = {
  _p(type,msg){ const id=Date.now()+Math.random(); _setToasts?.(p=>[...p,{id,type,msg}]); setTimeout(()=>_setToasts?.(p=>p.filter(t=>t.id!==id)),4000); },
  success:m=>toast._p('success',m), error:m=>toast._p('error',m),
  warn:m=>toast._p('warn',m), info:m=>toast._p('info',m),
};
const T_CFG = {
  success:{ bg:'#f0fdf4', border:'#86efac', color:'#166534', icon:'✓', iconBg:'#dcfce7' },
  error:  { bg:'#fff1f2', border:'#fca5a5', color:'#991b1b', icon:'✕', iconBg:'#fee2e2' },
  warn:   { bg:'#fffbeb', border:'#fcd34d', color:'#92400e', icon:'!', iconBg:'#fef3c7' },
  info:   { bg:'#eff6ff', border:'#93c5fd', color:'#1e40af', icon:'i', iconBg:'#dbeafe' },
};
function Toasts() {
  const [toasts,setToasts]=useState([]);
  useEffect(()=>{ _setToasts=setToasts; },[]);
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:10,pointerEvents:'none'}}>
      {toasts.map(t=>{ const c=T_CFG[t.type]; return (
        <div key={t.id} className="f-body" style={{background:c.bg,border:`1px solid ${c.border}`,color:c.color,padding:'12px 16px',display:'flex',alignItems:'center',gap:12,minWidth:280,maxWidth:380,borderRadius:12,pointerEvents:'auto',fontSize:13,fontWeight:500,boxShadow:'0 8px 24px rgba(0,0,0,.1)',animation:'toastIn .3s cubic-bezier(.16,1,.3,1) forwards'}}>
          <span style={{width:24,height:24,borderRadius:6,background:c.iconBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{c.icon}</span>
          <span style={{lineHeight:1.5}}>{t.msg}</span>
        </div>
      );})}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRIMITIVES
══════════════════════════════════════════════════════════ */
function Spinner({ size=14, color='#fff' }) {
  return <span className="anim-spin" style={{display:'inline-block',width:size,height:size,border:`2px solid rgba(0,0,0,.1)`,borderTopColor:color,borderRadius:'50%'}} />;
}

function SLabel({ children }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
      <span className="f-body" style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-3)',flexShrink:0}}>{children}</span>
      <span style={{flex:1,height:1.5,background:'var(--border)',borderRadius:2}} />
    </div>
  );
}

function Card({ children, style={}, className='' }) {
  return <div className={`anim-fade-up ${className}`} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,boxShadow:'var(--shadow-sm)',...style}}>{children}</div>;
}

function Chip({ children, color='var(--text-2)', bg='var(--card-alt)', border='var(--border)', style={} }) {
  return <span className="f-body" style={{fontSize:12,fontWeight:500,padding:'4px 10px',background:bg,border:`1px solid ${border}`,color,borderRadius:6,display:'inline-flex',alignItems:'center',gap:4,...style}}>{children}</span>;
}

function ProgBar({ pct=0, color='var(--blue)', height=4, radius=4 }) {
  return <div style={{height,background:'var(--border)',overflow:'hidden',borderRadius:radius}}><div style={{width:`${Math.min(100,Math.max(0,pct))}%`,height:'100%',background:color,transition:'width .6s ease',borderRadius:radius}} /></div>;
}

function Skel({ width='100%', height=14, radius=6 }) {
  return <div className="shimmer-skeleton" style={{width,height,borderRadius:radius,flexShrink:0}} />;
}

function EmptyState({ icon='📂', title, sub, action }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'72px 24px',gap:16,textAlign:'center'}}>
      <div style={{width:72,height:72,borderRadius:20,background:'var(--blue-light)',border:'2px solid var(--blue-mid)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,marginBottom:8}}>{icon}</div>
      <div>
        <p className="f-display" style={{fontSize:18,fontWeight:600,color:'var(--text)',marginBottom:8}}>{title}</p>
        {sub && <p className="f-body" style={{fontSize:13,color:'var(--text-3)',lineHeight:1.7,maxWidth:320,margin:'0 auto'}}>{sub}</p>}
      </div>
      {action && <div style={{marginTop:12}}>{action}</div>}
    </div>
  );
}

function PrimaryBtn({ children, loading, loadingText='Processing…', disabled, style={}, ...p }) {
  const [hov,setHov]=useState(false);
  const dis=disabled||loading;
  return (
    <button disabled={dis} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:dis?'#e2e8f0':hov?'var(--black-hi)':'var(--black)',color:dis?'#94a3b8':'#fff',border:'none',cursor:dis?'not-allowed':'pointer',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:700,padding:'10px 20px',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .15s',boxShadow:!dis&&hov?'0 4px 14px rgba(15,23,42,.25)':'none',transform:!dis&&hov?'translateY(-1px)':'none',...style}} {...p}>
      {loading?<><Spinner size={13} color={dis?'#94a3b8':'#fff'}/><span>{loadingText}</span></>:children}
    </button>
  );
}

function BlueBtn({ children, loading, loadingText='Processing…', disabled, style={}, ...p }) {
  const [hov,setHov]=useState(false);
  const dis=disabled||loading;
  return (
    <button disabled={dis} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:dis?'#e2e8f0':hov?'var(--blue-hi)':'var(--blue)',color:dis?'#94a3b8':'#fff',border:'none',cursor:dis?'not-allowed':'pointer',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:700,padding:'10px 20px',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .15s',boxShadow:!dis&&hov?'var(--shadow-blue)':'none',transform:!dis&&hov?'translateY(-1px)':'none',...style}} {...p}>
      {loading?<><Spinner size={13} color={dis?'#94a3b8':'#fff'}/><span>{loadingText}</span></>:children}
    </button>
  );
}

function GhostBtn({ children, active=false, style={}, ...p }) {
  const [hov,setHov]=useState(false);
  return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:active?'var(--blue-light)':hov?'var(--card-alt)':'var(--surface)',border:`1.5px solid ${active?'var(--blue)':hov?'var(--border-hi)':'var(--border)'}`,color:active?'var(--blue)':hov?'var(--text)':'var(--text-2)',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:600,padding:'8px 14px',cursor:'pointer',borderRadius:8,transition:'all .15s',display:'flex',alignItems:'center',gap:6,...style}} {...p}>
      {children}
    </button>
  );
}

function DangerBtn({ children, style={}, ...p }) {
  const [hov,setHov]=useState(false);
  return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?'#fff1f2':'var(--surface)',border:`1.5px solid ${hov?'#fca5a5':'#fecdd3'}`,color:'#e11d48',fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:600,padding:'8px 14px',cursor:'pointer',borderRadius:8,transition:'all .15s',...style}} {...p}>
      {children}
    </button>
  );
}

function TxtInput({ label, required, ...p }) {
  return (
    <div>
      {label&&<label className="f-body" style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text-2)',marginBottom:6}}>{label}{required&&<span style={{color:'var(--rose)',marginLeft:3}}>*</span>}</label>}
      <input style={{width:'100%',padding:'10px 14px',display:'block'}} {...p} />
    </div>
  );
}

function TxtArea({ label, ...p }) {
  return (
    <div>
      {label&&<label className="f-body" style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text-2)',marginBottom:6}}>{label}</label>}
      <textarea style={{width:'100%',padding:'10px 14px',display:'block',minHeight:80,lineHeight:1.6}} {...p} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STATUS PILLS
══════════════════════════════════════════════════════════ */
function SessionStatusPill({ status }) {
  const c = SESSION_STATUS_CFG[status] || SESSION_STATUS_CFG.pending;
  return (
    <span className="f-body" style={{fontSize:11,fontWeight:600,padding:'4px 10px',display:'inline-flex',alignItems:'center',gap:6,flexShrink:0,background:c.bg,border:`1px solid ${c.border}`,color:c.color,borderRadius:20}}>
      <span style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',width:12,height:12}}>
        {c.live&&<span className="anim-live" style={{position:'absolute',width:10,height:10,borderRadius:'50%',background:c.dot,opacity:.25}} />}
        <span style={{width:6,height:6,borderRadius:'50%',background:c.dot}} />
      </span>
      {c.label}
    </span>
  );
}

function DecisionPill({ decision, size='sm' }) {
  const c = DECISION_CFG[decision||''] || DECISION_CFG[''];
  const pad = size==='lg' ? '5px 12px' : '4px 10px';
  const fs = size==='lg' ? 12 : 11;
  return (
    <span className="f-body" style={{fontSize:fs,fontWeight:600,padding:pad,background:c.bg,border:`1px solid ${c.border}`,color:c.color,borderRadius:20,display:'inline-flex',alignItems:'center',gap:5}}>
      <span style={{fontSize:11}}>{c.icon}</span>
      {decision ? fmt.label(decision) : 'Undecided'}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   CIRCULAR SCORE GAUGE
══════════════════════════════════════════════════════════ */
function ScoreGauge({ score=0, size=80, label='Score' }) {
  const color = SCORE_COLOR(score);
  const r = (size/2) - 7;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score/100) * circ;
  const bgColor = color + '18';

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <div style={{position:'relative',width:size,height:size}}>
        <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'absolute',top:0,left:0}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bgColor} strokeWidth={6} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{transition:'stroke-dashoffset .8s ease, stroke .3s'}} />
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
          <span className="f-display" style={{fontSize:size*0.24,color,fontWeight:700,lineHeight:1}}>{fmt.score(score)}</span>
        </div>
      </div>
      <span className="f-body" style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-3)'}}>{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SCORE BAR ROW
══════════════════════════════════════════════════════════ */
function ScoreRow({ label, score, color }) {
  const c = color || SCORE_COLOR(score);
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
        <span className="f-body" style={{fontSize:13,fontWeight:500,color:'var(--text-2)'}}>{label}</span>
        <span className="f-display" style={{fontSize:20,color:c,fontWeight:700,lineHeight:1}}>{fmt.score(score)}</span>
      </div>
      <ProgBar pct={score} color={c} height={5} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CANDIDATE AVATAR
══════════════════════════════════════════════════════════ */
function CandidateAvatar({ name, size=38 }) {
  const initials = name ? name.trim().split(' ').slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('') : '?';
  const palettes=[
    {bg:'#eff6ff',border:'#bfdbfe',color:'#2563eb'},
    {bg:'#ecfeff',border:'#a5f3fc',color:'#0891b2'},
    {bg:'#f0fdf4',border:'#86efac',color:'#059669'},
    {bg:'rgba(124,58,237,.06)',border:'rgba(124,58,237,.2)',color:'#7c3aed'},
    {bg:'#fffbeb',border:'#fde68a',color:'#d97706'},
    {bg:'#fff1f2',border:'#fecdd3',color:'#e11d48'},
  ];
  const idx=name?[...name].reduce((a,c)=>a+c.charCodeAt(0),0)%palettes.length:0;
  const p=palettes[idx];
  return (
    <div style={{width:size,height:size,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:p.bg,border:`1.5px solid ${p.border}`,borderRadius:size*0.28}}>
      <span className="f-display" style={{fontSize:size*0.36,color:p.color,fontWeight:700,lineHeight:1}}>{initials}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONFIRM MODAL
══════════════════════════════════════════════════════════ */
function ConfirmModal({ open, title, message, confirmLabel='Confirm Delete', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(15,23,42,.6)',backdropFilter:'blur(12px)'}}>
      <div className="anim-fade-up" style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:28,maxWidth:420,width:'100%',boxShadow:'var(--shadow-xl)'}}>
        <div style={{width:44,height:44,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,background:'#fff1f2',border:'1px solid #fecdd3'}}>
          <span style={{color:'#e11d48',fontSize:20}}>⚠</span>
        </div>
        <p className="f-display" style={{fontSize:20,fontWeight:600,color:'var(--text)',marginBottom:10}}>{title}</p>
        <p className="f-body" style={{fontSize:13,color:'var(--text-2)',lineHeight:1.7,marginBottom:24}}>{message}</p>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
          <DangerBtn onClick={onConfirm}>{confirmLabel}</DangerBtn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SESSION PROGRESS BANNER
══════════════════════════════════════════════════════════ */
function SessionProgressBanner({ sessionId, onComplete }) {
  const [session,setSession]=useState(null);
  const iv=useRef(null);

  const poll=useCallback(async()=>{
    try {
      const r=await AxiosInstance.get(`/api/screening/v1/session/?id=${sessionId}`);
      const d=r.data?.data||r.data; setSession(d);
      if (d.status==='completed'||d.status==='failed') {
        clearInterval(iv.current);
        if (d.status==='completed') { toast.success('Screening completed!'); onComplete?.(); }
        else toast.error('Screening session failed');
      }
    } catch { clearInterval(iv.current); }
  },[sessionId,onComplete]);

  useEffect(()=>{ poll(); iv.current=setInterval(poll,3500); return()=>clearInterval(iv.current); },[poll]);
  if (!session||(session.status!=='processing'&&session.status!=='pending')) return null;

  const pct=session.progress_pct||0;
  return (
    <div className="anim-fade-in" style={{padding:18,background:'#fff7ed',border:'1.5px solid #fed7aa',borderLeft:'4px solid #ea580c',borderRadius:12,marginBottom:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Spinner size={14} color='#ea580c'/>
          <span className="f-body" style={{fontSize:13,fontWeight:700,color:'#c2410c'}}>Screening in Progress</span>
          {session.job_title&&<span className="f-body" style={{fontSize:12,color:'#ea580c',fontWeight:500}}>· {session.job_title}</span>}
        </div>
        <span className="f-display" style={{fontSize:28,color:'#ea580c',fontWeight:700,lineHeight:1}}>{pct}%</span>
      </div>
      <ProgBar pct={pct} color='#ea580c' height={7} />
      <div style={{display:'flex',gap:24,marginTop:12}}>
        {[['Processed',session.processed_count,'var(--emerald)'],['Failed',session.failed_count,'var(--rose)'],['Total',session.total_resumes,'var(--text-2)']].map(([l,v,c])=>(
          <span key={l} className="f-body" style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>{l}: <span style={{color:c,fontWeight:700}}>{v}</span></span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   START SCREENING MODAL
══════════════════════════════════════════════════════════ */
function StartScreeningModal({ open, onClose, onStarted }) {
  const [jobs,setJobs]=useState([]);
  const [resumes,setResumes]=useState([]);
  const [jobsLoading,setJobsL]=useState(false);
  const [resumesLoading,setResL]=useState(false);
  const [form,setForm]=useState({job_id:'',pass_threshold:70,top_n_candidates:10});
  const [selectedResumes,setSel]=useState([]);
  const [search,setSearch]=useState('');
  const [starting,setStarting]=useState(false);

  useEffect(()=>{
    if (!open) return;
    setForm({job_id:'',pass_threshold:70,top_n_candidates:10}); setSel([]); setSearch('');
    const loadJobs=async()=>{ setJobsL(true); try { const r=await AxiosInstance.get('/api/jobs/v1/job/',{params:{status:'active',limit:200}}); const list=r.data?.results||r.data?.data||r.data||[]; const r2=await AxiosInstance.get('/api/jobs/v1/job/',{params:{status:'draft',limit:200}}); const list2=r2.data?.results||r2.data?.data||r2.data||[]; setJobs([...list,...list2]); } catch { toast.warn('Could not load jobs'); } finally { setJobsL(false); } };
    const loadResumes=async()=>{ setResL(true); try { const r=await AxiosInstance.get('/api/resumes/v1/resume/list/',{params:{status:'parsed',is_active:'true',limit:500}}); const list1=r.data?.results||r.data?.data||r.data||[]; const r2=await AxiosInstance.get('/api/resumes/v1/resume/list/',{params:{status:'indexed',is_active:'true',limit:500}}); const list2=r2.data?.results||r2.data?.data||r2.data||[]; const map={}; [...list1,...list2].forEach(x=>{ map[x.id]=x; }); setResumes(Object.values(map)); } catch { toast.warn('Could not load resumes'); } finally { setResL(false); } };
    loadJobs(); loadResumes();
  },[open]);

  if (!open) return null;

  const filtered=resumes.filter(r=>{ const q=search.toLowerCase(); return !q||(r.candidate_name||'').toLowerCase().includes(q)||(r.candidate_email||'').toLowerCase().includes(q); });
  const toggleResume=id=>setSel(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleAll=()=>setSel(p=>p.length===filtered.length?[]:filtered.map(r=>r.id));

  const submit=async()=>{
    if (!form.job_id) { toast.warn('Select a job'); return; }
    if (!selectedResumes.length) { toast.warn('Select at least one resume'); return; }
    setStarting(true);
    try {
      const r=await AxiosInstance.post('/api/screening/v1/session/start/',{job_id:form.job_id,resume_ids:selectedResumes,pass_threshold:form.pass_threshold,top_n_candidates:form.top_n_candidates});
      const d=r.data?.data||r.data;
      toast.success(`Screening started — ${selectedResumes.length} resumes`);
      onStarted?.(d.session_id); onClose();
    } catch(e) { const err=e.response?.data; if(typeof err==='object'&&err!==null){ const msg=err.message||Object.values(err).flat().join(' · ')||'Failed'; toast.error(msg); } else { toast.error('Failed to start screening'); } } finally { setStarting(false); }
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(15,23,42,.65)',backdropFilter:'blur(16px)'}}>
      <div className="anim-fade-up" style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,width:'100%',maxWidth:700,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'var(--shadow-xl)'}}>
        {/* Header */}
        <div style={{padding:'22px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <p className="f-display" style={{fontSize:22,fontWeight:700,color:'var(--text)',marginBottom:4}}>Start AI Screening</p>
            <p className="f-body" style={{fontSize:13,color:'var(--text-3)',fontWeight:500}}>Select a job and resumes to evaluate</p>
          </div>
          <button onClick={onClose} style={{background:'var(--card-alt)',border:'1.5px solid var(--border)',borderRadius:8,color:'var(--text-2)',cursor:'pointer',padding:'7px 12px',fontSize:16,transition:'all .15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--blue)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>✕</button>
        </div>

        <div style={{overflowY:'auto',flex:1,padding:24,display:'flex',flexDirection:'column',gap:20}}>
          {/* Job selector */}
          <div>
            <label className="f-body" style={{display:'block',fontSize:12,fontWeight:700,color:'var(--text-2)',marginBottom:8}}>Target Job <span style={{color:'var(--rose)'}}>*</span></label>
            {jobsLoading ? (
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--card-alt)'}}><Spinner size={14} color='var(--blue)'/><span className="f-body" style={{fontSize:13,color:'var(--text-3)'}}>Loading jobs…</span></div>
            ) : (
              <select style={{width:'100%',padding:'10px 14px'}} value={form.job_id} onChange={e=>setForm(p=>({...p,job_id:e.target.value}))}>
                <option value="">— Select a job —</option>
                {jobs.map(j=><option key={j.id} value={j.id}>[{(j.status||'').toUpperCase()}] {j.title}{j.department?` · ${j.department}`:''}</option>)}
              </select>
            )}
          </div>

          {/* Config sliders */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div>
              <label className="f-body" style={{display:'block',fontSize:12,fontWeight:700,color:'var(--text-2)',marginBottom:10}}>
                Pass Threshold — <span style={{color:'var(--blue)',fontWeight:700}}>{form.pass_threshold}%</span>
              </label>
              <input type="range" min={0} max={100} step={5} value={form.pass_threshold} onChange={e=>setForm(p=>({...p,pass_threshold:+e.target.value}))} style={{width:'100%',marginBottom:8}} />
              <ProgBar pct={form.pass_threshold} color='var(--blue)' height={6} />
            </div>
            <TxtInput label="Top N Candidates" type="number" min={1} max={200} value={form.top_n_candidates} onChange={e=>setForm(p=>({...p,top_n_candidates:+e.target.value}))} />
          </div>

          {/* Resume picker */}
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <label className="f-body" style={{fontSize:12,fontWeight:700,color:'var(--text-2)'}}>
                Resumes <span style={{color:'var(--blue)',fontWeight:700}}>({selectedResumes.length} selected)</span>
              </label>
              <div style={{display:'flex',gap:8}}>
                {selectedResumes.length>0&&<GhostBtn onClick={()=>setSel([])} style={{padding:'4px 10px',fontSize:12}}>Clear</GhostBtn>}
                <GhostBtn onClick={toggleAll} style={{padding:'4px 10px',fontSize:12}}>
                  {selectedResumes.length===filtered.length&&filtered.length>0?'Deselect All':'Select All'}
                </GhostBtn>
              </div>
            </div>
            <input style={{width:'100%',padding:'10px 14px',marginBottom:12}} placeholder="🔍 Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)} />
            {resumesLoading ? (
              <div style={{display:'flex',justifyContent:'center',padding:24,border:'1px solid var(--border)',borderRadius:10}}><Spinner size={22} color='var(--blue)'/></div>
            ) : (
              <div style={{border:'1.5px solid var(--border)',borderRadius:10,maxHeight:280,overflowY:'auto'}}>
                {filtered.length===0 ? (
                  <div style={{padding:24,textAlign:'center'}}><span className="f-body" style={{fontSize:13,color:'var(--text-3)'}}>No parsed/indexed resumes found</span></div>
                ) : filtered.map((r,i)=>{
                  const isSel=selectedResumes.includes(r.id);
                  return (
                    <label key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isSel?'var(--blue-light)':i%2===0?'transparent':'var(--card-alt)',transition:'background .1s',borderLeft:`3px solid ${isSel?'var(--blue)':'transparent'}`}}>
                      <input type="checkbox" checked={isSel} onChange={()=>toggleResume(r.id)} style={{flexShrink:0}} />
                      <CandidateAvatar name={r.candidate_name} size={30} />
                      <div style={{flex:1,minWidth:0}}>
                        <span className="f-body" style={{fontSize:13,fontWeight:600,color:isSel?'var(--blue)':'var(--text)',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.candidate_name||'Unnamed'}</span>
                        <span className="f-body" style={{fontSize:11,color:'var(--text-3)',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.candidate_email||r.original_filename}</span>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <Chip>{r.total_experience_years}y</Chip>
                        <span className="f-body" style={{fontSize:11,fontWeight:600,padding:'3px 8px',background:r.status==='indexed'?'#f0fdf4':'#ecfeff',border:`1px solid ${r.status==='indexed'?'#86efac':'#a5f3fc'}`,color:r.status==='indexed'?'#16a34a':'#0e7490',borderRadius:20}}>{r.status}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'16px 24px',borderTop:'1px solid var(--border)',display:'flex',gap:10,justifyContent:'flex-end',flexShrink:0,background:'var(--card-alt)',borderRadius:'0 0 20px 20px'}}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn loading={starting} loadingText="Launching…" disabled={!form.job_id||!selectedResumes.length} onClick={submit} style={{padding:'11px 28px',gap:8}}>
            ⚡ Start Screening ({selectedResumes.length})
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SESSION CARD
══════════════════════════════════════════════════════════ */
function SessionCard({ session, onSelect, onDelete }) {
  const [hov,setHov]=useState(false);
  const sc=SESSION_STATUS_CFG[session.status]||SESSION_STATUS_CFG.pending;
  const pct=session.progress_pct||0;

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>onSelect(session.id)}
      className="anim-fade-up"
      style={{display:'flex',overflow:'hidden',cursor:'pointer',background:'var(--card)',borderRadius:14,border:`1.5px solid ${hov?'var(--blue)':'var(--border)'}`,transform:hov?'translateY(-3px)':'none',boxShadow:hov?'var(--shadow-blue)':'var(--shadow-sm)',transition:'all .2s cubic-bezier(.16,1,.3,1)'}}>
      <div style={{width:4,background:sc.bar,flexShrink:0,borderRadius:'14px 0 0 14px'}} />
      <div style={{flex:1,minWidth:0,padding:18}}>
        {/* Top */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:12}}>
          <div style={{flex:1,minWidth:0}}>
            <h3 className="f-display" style={{fontSize:16,fontWeight:700,color:hov?'var(--blue)':'var(--text)',marginBottom:4,lineHeight:1.25,transition:'color .2s',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{session.job_title||'—'}</h3>
            <p className="f-body" style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>by {session.initiated_by_name||session.created_by_name||'—'} · {fmt.date(session.created_at)}</p>
          </div>
          <SessionStatusPill status={session.status} />
        </div>

        {/* Progress bar for processing */}
        {session.status==='processing'&&(
          <div style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
              <span className="f-body" style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>Processing…</span>
              <span className="f-body" style={{fontSize:12,color:'#ea580c',fontWeight:700}}>{pct}%</span>
            </div>
            <ProgBar pct={pct} color='#ea580c' height={5} />
          </div>
        )}

        {/* Chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
          <Chip>{session.total_resumes} resumes</Chip>
          <Chip color='var(--blue)' bg='var(--blue-light)' border='var(--blue-mid)'>threshold {session.pass_threshold}%</Chip>
          <Chip color='var(--violet)' bg='rgba(124,58,237,.06)' border='rgba(124,58,237,.2)'>top {session.top_n_candidates}</Chip>
          {session.failed_count>0&&<Chip color='#e11d48' bg='#fff1f2' border='#fecdd3'>{session.failed_count} failed</Chip>}
        </div>

        {/* Footer */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:12,borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',gap:16}}>
            <span className="f-body" style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>
              <span style={{color:'var(--emerald)',fontWeight:700}}>{session.processed_count}</span>/{session.total_resumes} done
            </span>
            {session.completed_at&&<span className="f-body" style={{fontSize:12,color:'var(--text-4)'}}>✓ {fmt.date(session.completed_at)}</span>}
          </div>
          <div style={{display:'flex',gap:6,opacity:hov?1:0,transition:'opacity .2s'}} onClick={e=>e.stopPropagation()}>
            {session.status!=='processing'&&(
              <button onClick={()=>onDelete(session)} style={{background:'#fff1f2',border:'1.5px solid #fecdd3',borderRadius:7,color:'#e11d48',cursor:'pointer',padding:'5px 10px',fontSize:13,transition:'all .15s'}}>✕</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RESULT ROW
══════════════════════════════════════════════════════════ */
function ResultRow({ result, onSelect, onDecision, isSelected, onToggleCompare }) {
  const [hov,setHov]=useState(false);
  const scoreCol=SCORE_COLOR(result.overall_score);

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderBottom:'1px solid var(--border)',background:hov?'var(--blue-light)':'transparent',transition:'background .15s',cursor:'pointer'}}
      onClick={()=>onSelect(result.id)}>
      <input type="checkbox" checked={isSelected} onChange={e=>{ e.stopPropagation(); onToggleCompare(result.id); }} onClick={e=>e.stopPropagation()} style={{flexShrink:0}} title="Add to compare" />

      {result.rank&&(
        <span className="f-display" style={{fontSize:18,color:result.rank<=3?'var(--amber)':'var(--text-3)',width:30,textAlign:'center',flexShrink:0,fontWeight:700,lineHeight:1}}>#{result.rank}</span>
      )}

      <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
        <CandidateAvatar name={result.candidate_name} size={34} />
        <div style={{flex:1,minWidth:0}}>
          <p className="f-body" style={{fontSize:13,fontWeight:600,color:hov?'var(--blue)':'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:2,transition:'color .15s'}}>{result.candidate_name||'Unnamed'}</p>
          <p className="f-body" style={{fontSize:11,color:'var(--text-3)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{result.candidate_email||'—'}</p>
        </div>
      </div>

      {/* Mini score bars */}
      <div style={{display:'flex',gap:10,alignItems:'center',flexShrink:0}}>
        <div style={{textAlign:'center',minWidth:48}}>
          <span className="f-display" style={{fontSize:22,color:scoreCol,lineHeight:1,fontWeight:700,display:'block'}}>{fmt.score(result.overall_score)}</span>
          <span className="f-body" style={{fontSize:10,color:'var(--text-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>Score</span>
        </div>
        <div style={{width:80,display:'flex',flexDirection:'column',gap:4}}>
          {[['Skills',result.skill_score,'var(--blue)'],['Exp',result.experience_score,'var(--violet)'],['Edu',result.education_score,'var(--amber)']].map(([l,v,c])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
              <span className="f-body" style={{fontSize:10,color:'var(--text-3)',width:24,flexShrink:0,fontWeight:600}}>{l}</span>
              <div style={{flex:1,height:3,background:'var(--border)',overflow:'hidden',borderRadius:2}}><div style={{width:`${Math.min(100,v||0)}%`,height:'100%',background:c,transition:'width .4s',borderRadius:2}} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision pills */}
      <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0,flexWrap:'wrap',maxWidth:280}}>
        {result.must_have_skills_met
          ? <Chip color='var(--emerald)' bg='rgba(5,150,105,.06)' border='rgba(5,150,105,.2)'>✓ Must-Have</Chip>
          : <Chip color='var(--rose)' bg='rgba(225,29,72,.06)' border='rgba(225,29,72,.2)'>✗ Must-Have</Chip>}
        <DecisionPill decision={result.ai_decision} />
        <span onClick={e=>{ e.stopPropagation(); onDecision(result); }} title="Set HR decision" style={{cursor:'pointer'}}>
          <DecisionPill decision={result.human_decision} />
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HUMAN DECISION MODAL
══════════════════════════════════════════════════════════ */
function HumanDecisionModal({ open, result, onClose, onSaved }) {
  const [decision,setDecision]=useState('');
  const [notes,setNotes]=useState('');
  const [saving,setSaving]=useState(false);

  useEffect(()=>{ if(result){ setDecision(result.human_decision||''); setNotes(result.human_notes||''); } },[result]);
  if (!open||!result) return null;

  const submit=async()=>{
    if (!decision) { toast.warn('Select a decision'); return; }
    setSaving(true);
    try { await AxiosInstance.patch(`/api/screening/v1/result/decision/?id=${result.id}`,{human_decision:decision,human_notes:notes}); toast.success('Decision saved'); onSaved(); }
    catch(e){ toast.error(e.response?.data?.message||'Save failed'); } finally { setSaving(false); }
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(15,23,42,.6)',backdropFilter:'blur(12px)'}}>
      <div className="anim-fade-up" style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,width:'100%',maxWidth:440,boxShadow:'var(--shadow-xl)'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:14}}>
          <CandidateAvatar name={result.candidate_name} size={40} />
          <div>
            <p className="f-display" style={{fontSize:18,fontWeight:600,color:'var(--text)',lineHeight:1.2}}>{result.candidate_name}</p>
            <p className="f-body" style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>{result.job_title}</p>
          </div>
        </div>
        <div style={{padding:22}}>
          <SLabel>HR Decision</SLabel>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
            {DECISIONS.map(d=>{
              const c=DECISION_CFG[d]; const isSel=decision===d;
              return (
                <button key={d} onClick={()=>setDecision(d)} style={{
                  display:'flex',alignItems:'center',gap:9,padding:'11px 14px',cursor:'pointer',borderRadius:10,
                  background:isSel?c.bg:'var(--card-alt)',
                  border:`1.5px solid ${isSel?c.border:'var(--border)'}`,
                  transition:'all .15s',
                }}>
                  <span style={{fontSize:14}}>{c.icon}</span>
                  <span className="f-body" style={{fontSize:13,fontWeight:600,color:isSel?c.color:'var(--text-2)'}}>{fmt.label(d)}</span>
                </button>
              );
            })}
          </div>
          <TxtArea label="Notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Recruiter notes about this candidate…" style={{minHeight:80}} />
        </div>
        <div style={{padding:'0 22px 22px',display:'flex',gap:10,justifyContent:'flex-end'}}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <BlueBtn loading={saving} onClick={submit} style={{padding:'9px 24px'}}>Save Decision</BlueBtn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPARE MODAL
══════════════════════════════════════════════════════════ */
function CompareModal({ open, resultIds, onClose }) {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    if (!open||resultIds.length<2) return;
    const run=async()=>{ setLoading(true); try { const r=await AxiosInstance.post('/api/screening/v1/compare/',{result_ids:resultIds}); setData(r.data?.data||r.data); } catch(e){ toast.error(e.response?.data?.message||'Compare failed'); onClose(); } finally { setLoading(false); } };
    run();
  },[open,resultIds]);

  if (!open) return null;

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(15,23,42,.65)',backdropFilter:'blur(16px)'}}>
      <div className="anim-fade-up" style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,width:'100%',maxWidth:960,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'var(--shadow-xl)'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <p className="f-display" style={{fontSize:22,fontWeight:700,color:'var(--text)',marginBottom:4}}>Candidate Comparison</p>
            {data&&<p className="f-body" style={{fontSize:13,color:'var(--text-3)',fontWeight:500}}>{data.job?.title} · Winner: <span style={{color:'var(--blue)',fontWeight:700}}>{data.winner}</span></p>}
          </div>
          <button onClick={onClose} style={{background:'var(--card-alt)',border:'1.5px solid var(--border)',borderRadius:8,color:'var(--text-2)',cursor:'pointer',padding:'7px 12px',fontSize:16,transition:'all .15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--blue)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>✕</button>
        </div>

        <div style={{overflowX:'auto',overflowY:'auto',flex:1,padding:24}}>
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:60}}><Spinner size={32} color='var(--blue)'/></div>
          ) : data?.candidates ? (
            <div style={{display:'grid',gridTemplateColumns:`repeat(${data.candidates.length},minmax(220px,1fr))`,gap:16,minWidth:440}}>
              {data.candidates.map((c,i)=>{
                const isWinner=i===0;
                return (
                  <div key={c.result_id} style={{border:`1.5px solid ${isWinner?'var(--blue)':'var(--border)'}`,borderRadius:14,background:isWinner?'var(--blue-light)':'var(--card)',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:isWinner?'var(--shadow-blue)':'var(--shadow-sm)'}}>
                    <div style={{padding:18,textAlign:'center',borderBottom:'1px solid var(--border)',background:isWinner?'rgba(37,99,235,.06)':'transparent'}}>
                      {isWinner&&<p className="f-body" style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--blue)',marginBottom:10}}>★ Top Candidate</p>}
                      <CandidateAvatar name={c.candidate_name} size={48} />
                      <p className="f-body" style={{fontSize:14,fontWeight:700,color:isWinner?'var(--blue)':'var(--text)',marginTop:10,marginBottom:3}}>{c.candidate_name}</p>
                      <p className="f-body" style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>{c.candidate_email}</p>
                      {c.rank&&<p className="f-body" style={{fontSize:12,color:'var(--text-3)',marginTop:4}}>Rank #{c.rank}</p>}
                    </div>
                    <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'center'}}><ScoreGauge score={c.overall_score} size={80} label="Overall" /></div>
                    <div style={{padding:'16px 18px',borderBottom:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:12}}>
                      <SLabel>Scores</SLabel>
                      {[['Skills',c.score_breakdown?.skill_score,'var(--blue)'],['Exp',c.score_breakdown?.experience_score,'var(--violet)'],['Edu',c.score_breakdown?.education_score,'var(--amber)'],['Fit',c.score_breakdown?.fit_score,'var(--emerald)']].map(([l,v,col])=>(
                        <ScoreRow key={l} label={l} score={v||0} color={col} />
                      ))}
                    </div>
                    <div style={{padding:'12px 18px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'center'}}><DecisionPill decision={c.ai_decision} size='lg' /></div>
                    <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
                      <SLabel>Matched Skills</SLabel>
                      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                        {(c.matched_skills||[]).slice(0,8).map((s,j)=><Chip key={j} color='var(--emerald)' bg='rgba(5,150,105,.06)' border='rgba(5,150,105,.2)'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}
                        {!c.matched_skills?.length&&<span className="f-body" style={{fontSize:12,color:'var(--text-3)'}}>None</span>}
                      </div>
                    </div>
                    <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
                      <SLabel>Missing Skills</SLabel>
                      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                        {(c.missing_skills||[]).slice(0,8).map((s,j)=><Chip key={j} color='var(--rose)' bg='rgba(225,29,72,.06)' border='rgba(225,29,72,.2)'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}
                        {!c.missing_skills?.length&&<span className="f-body" style={{fontSize:12,color:'var(--emerald)',fontWeight:600}}>None missing</span>}
                      </div>
                    </div>
                    {c.strengths?.length>0&&(
                      <div style={{padding:'14px 18px'}}>
                        <SLabel>Strengths</SLabel>
                        {c.strengths.map((s,j)=>(
                          <p key={j} className="f-body" style={{fontSize:12,color:'var(--text-2)',lineHeight:1.7,marginBottom:4}}><span style={{color:'var(--emerald)',fontWeight:700}}>+</span> {s}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ):null}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AGENT LOG PANEL
══════════════════════════════════════════════════════════ */
function AgentLogPanel({ resultId }) {
  const [logs,setLogs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [expanded,setExpanded]=useState(null);

  useEffect(()=>{
    const load=async()=>{ setLoading(true); try { const r=await AxiosInstance.get(`/api/screening/v1/result/agent-logs/?id=${resultId}`); setLogs(r.data?.data||r.data||[]); } catch {} finally { setLoading(false); } };
    load();
  },[resultId]);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:28}}><Spinner size={20} color='var(--blue)'/></div>;
  if (!logs.length) return <Card><EmptyState icon="📋" title="No agent logs" sub="Logs appear once AI agents have processed this candidate" /></Card>;

  const totalTime=logs.reduce((a,l)=>a+(l.processing_time_ms||0),0);
  const totalTok=logs.reduce((a,l)=>a+(l.tokens_used||0),0);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {/* Summary */}
      <Card style={{padding:18}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:16}}>
          {[['Agents',logs.length,'var(--text)'],['Total Time',`${totalTime}ms`,'var(--cyan)'],['Tokens',totalTok.toLocaleString(),'var(--violet)'],['Success',logs.filter(l=>l.status==='success').length,'var(--emerald)'],['Errors',logs.filter(l=>l.status!=='success').length,'var(--rose)']].map(([l,v,c])=>(
            <div key={l} style={{textAlign:'center'}}>
              <p className="f-display" style={{fontSize:22,color:c,fontWeight:700,lineHeight:1,marginBottom:4}}>{v}</p>
              <p className="f-body" style={{fontSize:11,color:'var(--text-3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Log rows */}
      {logs.map(log=>{
        const cfg=AGENT_CFG[log.agent_type]||{color:'var(--text-3)',icon:'🔧',bg:'var(--card-alt)',border:'var(--border)'};
        const isExp=expanded===log.id;
        const ok=log.status==='success';
        return (
          <Card key={log.id} style={{overflow:'hidden',border:`1.5px solid ${ok?'var(--border)':'rgba(225,29,72,.2)'}`}}>
            <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',cursor:'pointer',background:isExp?'var(--card-alt)':'transparent'}} onClick={()=>setExpanded(p=>p===log.id?null:log.id)}>
              <div style={{width:38,height:38,borderRadius:10,background:cfg.bg,border:`1px solid ${cfg.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{cfg.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <span className="f-body" style={{fontSize:13,fontWeight:700,color:'var(--text)',display:'block'}}>{fmt.label(log.agent_type)}</span>
                <span className="f-body" style={{fontSize:11,color:'var(--text-3)',fontWeight:500}}>v{log.agent_version} · {log.model_used||'—'}</span>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                <Chip>{log.processing_time_ms}ms</Chip>
                <Chip color='var(--violet)' bg='rgba(124,58,237,.06)' border='rgba(124,58,237,.2)'>{log.tokens_used} tok</Chip>
                <span className="f-body" style={{fontSize:11,fontWeight:700,padding:'3px 10px',background:ok?'#f0fdf4':'#fff1f2',border:`1px solid ${ok?'#86efac':'#fecdd3'}`,color:ok?'#16a34a':'#be123c',borderRadius:20}}>{log.status}</span>
                <span style={{color:'var(--text-3)',fontSize:12,marginLeft:4}}>{isExp?'▲':'▼'}</span>
              </div>
            </div>
            {isExp&&(
              <div className="anim-slide-right" style={{padding:'0 18px 16px',borderTop:'1px solid var(--border)'}}>
                {log.error_message&&(
                  <div style={{marginTop:12,padding:'10px 14px',background:'#fff1f2',border:'1.5px solid #fecdd3',borderLeft:'3px solid #e11d48',borderRadius:'0 8px 8px 0'}}>
                    <p className="f-body" style={{fontSize:12,color:'#be123c',lineHeight:1.6,fontWeight:500}}>{log.error_message}</p>
                  </div>
                )}
                {log.input_summary&&Object.keys(log.input_summary).length>0&&(
                  <div style={{marginTop:14}}>
                    <p className="f-body" style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-3)',marginBottom:8}}>Input</p>
                    <pre className="f-mono" style={{fontSize:11,color:'var(--text-2)',whiteSpace:'pre-wrap',wordBreak:'break-all',lineHeight:1.8,background:'var(--card-alt)',padding:14,borderRadius:8,border:'1px solid var(--border)'}}>{JSON.stringify(log.input_summary,null,2)}</pre>
                  </div>
                )}
                {log.output_summary&&Object.keys(log.output_summary).length>0&&(
                  <div style={{marginTop:14}}>
                    <p className="f-body" style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-3)',marginBottom:8}}>Output</p>
                    <pre className="f-mono" style={{fontSize:11,color:'var(--text-2)',whiteSpace:'pre-wrap',wordBreak:'break-all',lineHeight:1.8,background:'var(--card-alt)',padding:14,borderRadius:8,border:'1px solid var(--border)'}}>{JSON.stringify(log.output_summary,null,2)}</pre>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RESULT DETAIL VIEW
══════════════════════════════════════════════════════════ */
function ResultDetail({ resultId, onBack, onDecision }) {
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(true);
  const [section,setSection]=useState('scores');
  const [decisionModal,setDecisionModal]=useState(false);

  const load=useCallback(async()=>{ setLoading(true); try { const r=await AxiosInstance.get(`/api/screening/v1/result/?id=${resultId}`); setResult(r.data?.data||r.data); } catch { toast.error('Failed to load result'); } finally { setLoading(false); } },[resultId]);
  useEffect(()=>{ load(); },[load]);

  if (loading) return <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:920}}>{[...Array(3)].map((_,i)=><div key={i} style={{padding:24,background:'var(--card)',border:'1px solid var(--border)',borderRadius:12}}><Skel width='40%' height={20}/><div style={{height:10}}/><Skel width='100%' height={13}/></div>)}</div>;
  if (!result) return null;

  const scoreColor=SCORE_COLOR(result.overall_score);
  const SECS=[{id:'scores',l:'Scores'},{id:'skills',l:'Skills'},{id:'ai',l:'AI Analysis'},{id:'questions',l:`Questions (${result.interview_questions?.length||0})`},{id:'logs',l:'Agent Logs'}];

  return (
    <div className="anim-fade-up" style={{maxWidth:920}}>
      {/* Breadcrumb */}
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:24}}>
        <button onClick={onBack} className="f-body" style={{fontSize:13,fontWeight:600,background:'none',border:'none',color:'var(--text-2)',cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:8,transition:'all .15s'}}
          onMouseEnter={e=>{ e.currentTarget.style.background='var(--blue-light)'; e.currentTarget.style.color='var(--blue)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-2)'; }}>
          ← Session
        </button>
        <span style={{color:'var(--text-4)',fontSize:16}}>/</span>
        <span className="f-body" style={{fontSize:13,fontWeight:500,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:220,whiteSpace:'nowrap'}}>{result.candidate_name}</span>
        <div style={{flex:1}}/>
        <BlueBtn onClick={()=>setDecisionModal(true)} style={{padding:'9px 20px',gap:8}}>⚖ HR Decision</BlueBtn>
      </div>

      {/* Hero */}
      <div style={{padding:28,marginBottom:4,background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,borderTop:`4px solid ${scoreColor}`,boxShadow:'var(--shadow-md)'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:22,flexWrap:'wrap'}}>
          <ScoreGauge score={result.overall_score} size={96} label="Overall" />
          <div style={{flex:1,minWidth:200}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:12}}>
              <div>
                <h1 className="f-display" style={{fontSize:26,fontWeight:700,color:'var(--text)',marginBottom:8,lineHeight:1.2}}>{result.candidate_name||'Unnamed'}</h1>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
                  {result.candidate_email&&<a href={`mailto:${result.candidate_email}`} className="f-body" style={{fontSize:13,color:'var(--blue)',fontWeight:500,textDecoration:'none'}}>{result.candidate_email}</a>}
                  {result.candidate_location&&<span className="f-body" style={{fontSize:13,color:'var(--text-3)',fontWeight:500}}>📍 {result.candidate_location}</span>}
                  {result.candidate_phone&&<span className="f-body" style={{fontSize:13,color:'var(--text-3)',fontWeight:500}}>{result.candidate_phone}</span>}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
                <DecisionPill decision={result.ai_decision} size='lg' />
                <DecisionPill decision={result.human_decision} size='lg' />
              </div>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {result.rank&&<Chip color='var(--amber)' bg='rgba(217,119,6,.06)' border='rgba(217,119,6,.2)'>Rank #{result.rank}</Chip>}
              <Chip color={result.passed?'var(--emerald)':'var(--rose)'} bg={result.passed?'rgba(5,150,105,.06)':'rgba(225,29,72,.06)'} border={result.passed?'rgba(5,150,105,.2)':'rgba(225,29,72,.2)'}>
                {result.passed?'✓ Passed':'✗ Below Threshold'}
              </Chip>
              {result.must_have_skills_met
                ? <Chip color='var(--emerald)' bg='rgba(5,150,105,.06)' border='rgba(5,150,105,.2)'>✓ Must-Have Met</Chip>
                : <Chip color='var(--rose)' bg='rgba(225,29,72,.06)' border='rgba(225,29,72,.2)'>✗ Must-Have Missing</Chip>}
              {result.years_of_experience>0&&<Chip>{result.years_of_experience}y exp</Chip>}
              {result.education_level&&<Chip color='var(--violet)' bg='rgba(124,58,237,.06)' border='rgba(124,58,237,.2)'>🎓 {fmt.label(result.education_level)}</Chip>}
              {result.model_used&&<Chip>{result.model_used}</Chip>}
              {result.tokens_used>0&&<Chip>{result.tokens_used.toLocaleString()} tokens</Chip>}
            </div>
          </div>
        </div>
      </div>

      {/* Section nav */}
      <div style={{display:'flex',background:'var(--surface)',borderRadius:12,padding:4,gap:2,marginBottom:24,border:'1px solid var(--border)',overflowX:'auto',marginTop:8}}>
        {SECS.map(s=>(
          <button key={s.id} onClick={()=>setSection(s.id)} className="f-body"
            style={{fontSize:13,fontWeight:600,padding:'9px 18px',borderRadius:8,cursor:'pointer',background:section===s.id?'var(--black)':'transparent',color:section===s.id?'#fff':'var(--text-2)',border:'none',transition:'all .15s',whiteSpace:'nowrap'}}>
            {s.l}
          </button>
        ))}
      </div>

      {/* SCORES */}
      {section==='scores'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
          <Card style={{padding:22}}>
            <SLabel>Score Breakdown</SLabel>
            <div style={{display:'flex',flexDirection:'column',gap:18}}>
              {[['Skills Match',result.skill_score,'var(--blue)'],['Experience',result.experience_score,'var(--violet)'],['Education',result.education_score,'var(--amber)'],['Overall Fit',result.fit_score,'var(--emerald)'],['Semantic Similarity',(result.semantic_similarity||0)*100,'var(--cyan)']].map(([l,v,c])=>(
                <ScoreRow key={l} label={l} score={v||0} color={c} />
              ))}
            </div>
          </Card>
          <Card style={{padding:22}}>
            <SLabel>Experience & Education</SLabel>
            <dl style={{display:'flex',flexDirection:'column',gap:0}}>
              {[['Years of Exp',`${result.years_of_experience}y`],['Exp Gap',result.experience_gap_years>0?`${result.experience_gap_years}y short`:'None'],['Relevant Exp',fmt.pct(result.relevant_experience_pct)],['Education',fmt.label(result.education_level)||'—'],['Edu Match',result.education_match?'✓ Yes':'✗ No'],['Processing',`${result.processing_time_ms}ms`],['Reviewed',fmt.dateTime(result.reviewed_at)]].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                  <dt className="f-body" style={{fontSize:12,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{k}</dt>
                  <dd className="f-body" style={{fontSize:13,color:'var(--text)',fontWeight:500}}>{v}</dd>
                </div>
              ))}
            </dl>
            {result.reviewed_by_name&&<p className="f-body" style={{fontSize:12,color:'var(--text-3)',marginTop:12}}>Reviewed by: <span style={{color:'var(--blue)',fontWeight:600}}>{result.reviewed_by_name}</span></p>}
          </Card>
          {result.human_notes&&(
            <Card style={{padding:22,gridColumn:'1/-1',borderLeft:'4px solid var(--blue)'}}>
              <SLabel>HR Notes</SLabel>
              <p className="f-body" style={{fontSize:14,lineHeight:1.8,color:'var(--text-2)'}}>{result.human_notes}</p>
            </Card>
          )}
        </div>
      )}

      {/* SKILLS */}
      {section==='skills'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          <Card style={{padding:22}}>
            <SLabel>Matched Skills ({result.matched_skills?.length||0})</SLabel>
            {result.matched_skills?.length>0 ? <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{result.matched_skills.map((s,i)=><Chip key={i} color='var(--emerald)' bg='rgba(5,150,105,.06)' border='rgba(5,150,105,.2)'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}</div> : <p className="f-body" style={{fontSize:13,color:'var(--text-3)'}}>None matched</p>}
          </Card>
          <Card style={{padding:22}}>
            <SLabel>Missing Skills ({result.missing_skills?.length||0})</SLabel>
            {result.missing_skills?.length>0 ? <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{result.missing_skills.map((s,i)=><Chip key={i} color='var(--rose)' bg='rgba(225,29,72,.06)' border='rgba(225,29,72,.2)'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}</div> : <p className="f-body" style={{fontSize:13,color:'var(--emerald)',fontWeight:600}}>No missing skills 🎉</p>}
          </Card>
          {result.bonus_skills?.length>0&&(
            <Card style={{padding:22}}>
              <SLabel>Bonus Skills ({result.bonus_skills.length})</SLabel>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{result.bonus_skills.map((s,i)=><Chip key={i} color='var(--amber)' bg='rgba(217,119,6,.06)' border='rgba(217,119,6,.2)'>{typeof s==='object'?s.name||JSON.stringify(s):s}</Chip>)}</div>
            </Card>
          )}
        </div>
      )}

      {/* AI ANALYSIS */}
      {section==='ai'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {result.explanation&&<Card style={{padding:22,borderLeft:'4px solid var(--blue)'}}><SLabel>AI Explanation</SLabel><p className="f-body" style={{fontSize:14,lineHeight:1.8,color:'var(--text-2)'}}>{result.explanation}</p></Card>}
          {result.recommendation&&<Card style={{padding:22,borderLeft:'4px solid var(--emerald)'}}><SLabel>Recommendation</SLabel><p className="f-body" style={{fontSize:14,lineHeight:1.8,color:'var(--text-2)'}}>{result.recommendation}</p></Card>}
          {result.growth_potential&&<Card style={{padding:22,borderLeft:'4px solid var(--cyan)'}}><SLabel>Growth Potential</SLabel><p className="f-body" style={{fontSize:14,lineHeight:1.8,color:'var(--text-2)'}}>{result.growth_potential}</p></Card>}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
            {[{label:'Strengths',data:result.strengths,color:'var(--emerald)',sign:'+'},{label:'Weaknesses',data:result.weaknesses,color:'var(--rose)',sign:'−'},{label:'Red Flags',data:result.red_flags,color:'var(--orange)',sign:'!'}].filter(g=>g.data?.length>0).map(g=>(
              <Card key={g.label} style={{padding:18}}>
                <SLabel>{g.label}</SLabel>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {g.data.map((item,i)=>(
                    <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 12px',background:g.color.includes('emerald')?'rgba(5,150,105,.04)':g.color.includes('rose')?'rgba(225,29,72,.04)':'rgba(234,88,12,.04)',borderRadius:8,border:`1px solid ${g.color.includes('emerald')?'rgba(5,150,105,.15)':g.color.includes('rose')?'rgba(225,29,72,.15)':'rgba(234,88,12,.15)'}`}}>
                      <span style={{color:g.color,flexShrink:0,fontSize:12,fontWeight:700,marginTop:2}}>{g.sign}</span>
                      <p className="f-body" style={{fontSize:13,color:'var(--text-2)',lineHeight:1.6}}>{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* INTERVIEW QUESTIONS */}
      {section==='questions'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {result.interview_questions?.length>0 ? result.interview_questions.map((q,i)=>(
            <Card key={i} style={{padding:22,borderLeft:'4px solid var(--violet)'}}>
              <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                <div style={{width:36,height:36,borderRadius:10,background:'rgba(124,58,237,.06)',border:'1px solid rgba(124,58,237,.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span className="f-display" style={{fontSize:16,color:'var(--violet)',fontWeight:700,lineHeight:1}}>Q{i+1}</span>
                </div>
                <p className="f-body" style={{fontSize:14,lineHeight:1.8,color:'var(--text-2)',paddingTop:6}}>{typeof q==='object'?q.question||JSON.stringify(q):q}</p>
              </div>
            </Card>
          )) : <Card><EmptyState icon="❓" title="No interview questions" sub="AI-generated questions appear after screening completes" /></Card>}
        </div>
      )}

      {/* AGENT LOGS */}
      {section==='logs'&&<AgentLogPanel resultId={resultId} />}

      <HumanDecisionModal open={decisionModal} result={result} onClose={()=>setDecisionModal(false)} onSaved={()=>{ setDecisionModal(false); load(); onDecision?.(); }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SESSION DETAIL VIEW
══════════════════════════════════════════════════════════ */
const EMPTY_RESULT_FILTERS={candidate_name:'',ai_decision:'',human_decision:'',status:'',min_score:'',max_score:'',must_have_met:'',passed:'',has_human_decision:''};

function SessionDetail({ sessionId, onBack, onOpenResult }) {
  const [session,setSession]=useState(null);
  const [results,setResults]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filters,setFilters]=useState({...EMPTY_RESULT_FILTERS});
  const [showFilters,setShowFilters]=useState(false);
  const [section,setSection]=useState('results');
  const [decisionTarget,setDecisionTarget]=useState(null);
  const [compareIds,setCompareIds]=useState([]);
  const [compareOpen,setCompareOpen]=useState(false);
  const [sortBy,setSortBy]=useState('overall_score');

  const load=useCallback(async()=>{ setLoading(true); try { const r=await AxiosInstance.get(`/api/screening/v1/session/?id=${sessionId}`); setSession(r.data?.data||r.data); } catch { toast.error('Failed to load session'); } finally { setLoading(false); } },[sessionId]);
  const loadResults=useCallback(async()=>{ try { const params={session:sessionId}; Object.entries(filters).forEach(([k,v])=>{ if(v!=='') params[k]=v; }); const r=await AxiosInstance.get('/api/screening/v1/result/',{params}); let list=r.data?.results||r.data?.data||r.data||[]; list=[...list].sort((a,b)=>{ if(sortBy==='rank') return (a.rank||999)-(b.rank||999); return (b[sortBy]||0)-(a[sortBy]||0); }); setResults(list); } catch { toast.error('Failed to load results'); } },[sessionId,filters,sortBy]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ if(session) loadResults(); },[loadResults,session]);

  const toggleCompare=id=>setCompareIds(p=>p.includes(id)?p.filter(x=>x!==id):p.length<5?[...p,id]:(toast.warn('Max 5 for compare'),p));

  if (loading&&!session) return <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:1100}}>{[...Array(4)].map((_,i)=><div key={i} style={{padding:22,background:'var(--card)',border:'1px solid var(--border)',borderRadius:12}}><Skel width='40%' height={16}/><div style={{height:8}}/><Skel width='100%' height={10}/></div>)}</div>;
  if (!session) return null;

  const sc=SESSION_STATUS_CFG[session.status]||SESSION_STATUS_CFG.pending;
  const SECS=[{id:'results',l:`Results (${results.length})`},{id:'overview',l:'Session Overview'}];
  const activeFilterCount=Object.values(filters).filter(v=>v!=='').length;

  return (
    <div className="anim-fade-up" style={{maxWidth:1100}}>
      {/* Breadcrumb */}
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:24}}>
        <button onClick={onBack} className="f-body" style={{fontSize:13,fontWeight:600,background:'none',border:'none',color:'var(--text-2)',cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:8,transition:'all .15s'}}
          onMouseEnter={e=>{ e.currentTarget.style.background='var(--blue-light)'; e.currentTarget.style.color='var(--blue)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-2)'; }}>
          ← All Sessions
        </button>
        <span style={{color:'var(--text-4)',fontSize:16}}>/</span>
        <span className="f-body" style={{fontSize:13,fontWeight:500,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',maxWidth:260,whiteSpace:'nowrap'}}>{session.job_title}</span>
        <div style={{flex:1}}/>
        <div style={{display:'flex',gap:8}}>
          {compareIds.length>=2&&(
            <BlueBtn onClick={()=>setCompareOpen(true)} style={{padding:'9px 18px',gap:8}}>⬡ Compare ({compareIds.length})</BlueBtn>
          )}
          <GhostBtn onClick={()=>{ load(); loadResults(); }} style={{padding:'8px 12px'}}>↻</GhostBtn>
        </div>
      </div>

      {/* Live banner */}
      {session.status==='processing'&&<SessionProgressBanner sessionId={sessionId} onComplete={()=>{ load(); loadResults(); }} />}

      {/* Hero */}
      <div style={{padding:28,marginBottom:4,background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,borderTop:`4px solid ${sc.bar}`,boxShadow:'var(--shadow-md)'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:18}}>
          <div>
            <h1 className="f-display" style={{fontSize:28,fontWeight:700,color:'var(--text)',marginBottom:8,lineHeight:1.2}}>{session.job_title}</h1>
            <p className="f-body" style={{fontSize:13,color:'var(--text-3)',fontWeight:500}}>by {session.initiated_by_name||'—'} · {fmt.dateTime(session.created_at)}</p>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
            <SessionStatusPill status={session.status} />
            {session.pass_rate_pct!==null&&session.pass_rate_pct!==undefined&&(
              <span className="f-body" style={{fontSize:13,color:'var(--text-3)',fontWeight:500}}>Pass rate: <span style={{color:'var(--emerald)',fontWeight:700}}>{session.pass_rate_pct}%</span></span>
            )}
          </div>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          <Chip>{session.total_resumes} resumes</Chip>
          <Chip color='var(--blue)' bg='var(--blue-light)' border='var(--blue-mid)'>threshold {session.pass_threshold}%</Chip>
          <Chip color='var(--violet)' bg='rgba(124,58,237,.06)' border='rgba(124,58,237,.2)'>top {session.top_n_candidates}</Chip>
          {session.total_cost_usd&&parseFloat(session.total_cost_usd)>0&&<Chip color='var(--emerald)' bg='rgba(5,150,105,.06)' border='rgba(5,150,105,.2)'>{fmt.usd(session.total_cost_usd)}</Chip>}
          {session.total_tokens_used>0&&<Chip>{session.total_tokens_used.toLocaleString()} tokens</Chip>}
          {session.duration_seconds&&<Chip>⏱ {fmt.duration(session.duration_seconds)}</Chip>}
          {session.completed_at&&<Chip color='var(--emerald)' bg='rgba(5,150,105,.06)' border='rgba(5,150,105,.2)'>✓ {fmt.date(session.completed_at)}</Chip>}
        </div>
        {session.status==='processing'&&(
          <div style={{marginTop:18}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span className="f-body" style={{fontSize:13,color:'var(--text-3)',fontWeight:500}}>Progress</span>
              <span className="f-body" style={{fontSize:13,color:'#ea580c',fontWeight:700}}>{session.progress_pct}%</span>
            </div>
            <ProgBar pct={session.progress_pct} color='#ea580c' height={7} />
          </div>
        )}
      </div>

      {/* Section nav */}
      <div style={{display:'flex',background:'var(--surface)',borderRadius:12,padding:4,gap:2,marginBottom:24,border:'1px solid var(--border)',overflowX:'auto',marginTop:8}}>
        {SECS.map(s=>(
          <button key={s.id} onClick={()=>setSection(s.id)} className="f-body"
            style={{fontSize:13,fontWeight:600,padding:'9px 18px',borderRadius:8,cursor:'pointer',background:section===s.id?'var(--black)':'transparent',color:section===s.id?'#fff':'var(--text-2)',border:'none',transition:'all .15s',whiteSpace:'nowrap'}}>
            {s.l}
          </button>
        ))}
      </div>

      {/* RESULTS */}
      {section==='results'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Toolbar */}
          <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,justifyContent:'space-between'}}>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <GhostBtn onClick={()=>setShowFilters(p=>!p)} active={showFilters} style={{gap:8}}>
                <svg width={14} height={14} viewBox="0 0 16 16" fill="currentColor"><path d="M1 3h14v1.5L10 10v5l-4-2v-3L1 4.5V3z"/></svg>
                Filters{activeFilterCount>0?<span style={{background:'var(--blue)',color:'#fff',borderRadius:10,padding:'1px 7px',fontSize:11,fontWeight:700}}>{activeFilterCount}</span>:''}
              </GhostBtn>
              {activeFilterCount>0&&<GhostBtn onClick={()=>setFilters({...EMPTY_RESULT_FILTERS})}>✕ Clear</GhostBtn>}
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              {compareIds.length>0&&<span className="f-body" style={{fontSize:12,color:'var(--blue)',fontWeight:600}}>{compareIds.length} selected for compare</span>}
              <select style={{padding:'8px 12px',width:'auto'}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                {[['overall_score','Overall Score'],['skill_score','Skill Score'],['experience_score','Exp Score'],['education_score','Edu Score'],['rank','Rank']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters&&(
            <div className="anim-slide-down" style={{padding:18,background:'var(--card)',border:'1.5px solid var(--blue)',borderRadius:12,boxShadow:'0 0 0 4px rgba(37,99,235,.06)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <span className="f-body" style={{fontSize:13,fontWeight:700,color:'var(--blue)'}}>Filter Results</span>
                <GhostBtn onClick={()=>setFilters({...EMPTY_RESULT_FILTERS})} style={{padding:'5px 12px',fontSize:12}}>✕ Clear</GhostBtn>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10}}>
                <input style={{padding:'10px 12px'}} placeholder="Candidate name…" value={filters.candidate_name} onChange={e=>setFilters(p=>({...p,candidate_name:e.target.value}))} />
                <input type="number" style={{padding:'10px 12px'}} placeholder="Min score" value={filters.min_score} onChange={e=>setFilters(p=>({...p,min_score:e.target.value}))} />
                <input type="number" style={{padding:'10px 12px'}} placeholder="Max score" value={filters.max_score} onChange={e=>setFilters(p=>({...p,max_score:e.target.value}))} />
                <select style={{padding:'10px 12px'}} value={filters.ai_decision} onChange={e=>setFilters(p=>({...p,ai_decision:e.target.value}))}>
                  <option value="">AI Decision</option>
                  {DECISIONS.map(d=><option key={d} value={d}>{fmt.label(d)}</option>)}
                </select>
                <select style={{padding:'10px 12px'}} value={filters.human_decision} onChange={e=>setFilters(p=>({...p,human_decision:e.target.value}))}>
                  <option value="">HR Decision</option>
                  {DECISIONS.map(d=><option key={d} value={d}>{fmt.label(d)}</option>)}
                </select>
                <select style={{padding:'10px 12px'}} value={filters.must_have_met} onChange={e=>setFilters(p=>({...p,must_have_met:e.target.value}))}>
                  <option value="">Must-Have</option>
                  <option value="true">Met ✓</option>
                  <option value="false">Not Met ✗</option>
                </select>
                <select style={{padding:'10px 12px'}} value={filters.passed} onChange={e=>setFilters(p=>({...p,passed:e.target.value}))}>
                  <option value="">All Candidates</option>
                  <option value="true">Passed Only</option>
                  <option value="false">Failed Only</option>
                </select>
                <select style={{padding:'10px 12px'}} value={filters.has_human_decision} onChange={e=>setFilters(p=>({...p,has_human_decision:e.target.value}))}>
                  <option value="">All Decisions</option>
                  <option value="true">HR Reviewed</option>
                  <option value="false">Awaiting HR</option>
                </select>
              </div>
            </div>
          )}

          {/* Table header */}
          {results.length>0&&(
            <div className="f-body" style={{display:'grid',gridTemplateColumns:'30px 42px 1fr 200px 280px',gap:12,padding:'10px 16px',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-3)',background:'var(--card-alt)',border:'1px solid var(--border)',borderRadius:'10px 10px 0 0'}}>
              <span/><span>Rank</span><span>Candidate</span><span style={{textAlign:'right'}}>Scores</span><span>Decisions</span>
            </div>
          )}

          {/* Result rows */}
          {results.length>0 ? (
            <Card style={{overflow:'hidden',padding:0,borderRadius:'0 0 12px 12px',marginTop:0}}>
              {results.map(r=><ResultRow key={r.id} result={r} onSelect={onOpenResult} onDecision={r=>setDecisionTarget(r)} isSelected={compareIds.includes(r.id)} onToggleCompare={toggleCompare} />)}
            </Card>
          ) : (
            <Card>
              <EmptyState icon={session.status==='completed'?'🔍':'⏳'} title={session.status==='completed'?'No results match filters':'Waiting for results'} sub={session.status==='completed'?'Try adjusting filter criteria':'Results appear as AI agents complete processing'} />
            </Card>
          )}
        </div>
      )}

      {/* OVERVIEW */}
      {section==='overview'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
          <Card style={{padding:22}}>
            <SLabel>Session Metrics</SLabel>
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {[['Total Resumes',session.total_resumes,'var(--text)'],['Processed',session.processed_count,'var(--emerald)'],['Failed',session.failed_count,'var(--rose)'],['Duration',fmt.duration(session.duration_seconds),'var(--cyan)'],['Cost',fmt.usd(session.total_cost_usd),'var(--emerald)'],['Tokens',(session.total_tokens_used||0).toLocaleString(),'var(--violet)']].map(([k,v,c])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 0',borderBottom:'1px solid var(--border)'}}>
                  <span className="f-body" style={{fontSize:12,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{k}</span>
                  <span className="f-body" style={{fontSize:14,color:c,fontWeight:700}}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
          {session.top_candidates?.length>0&&(
            <Card style={{padding:22}}>
              <SLabel>Top 5 Candidates</SLabel>
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {session.top_candidates.map((c,i)=>{
                  const scoreCol=SCORE_COLOR(c.overall_score);
                  return (
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)',cursor:'pointer',transition:'background .15s'}} onClick={()=>onOpenResult(c.id)}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--blue-light)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <span className="f-display" style={{fontSize:20,color:i===0?'var(--amber)':'var(--text-3)',fontWeight:700,width:32,textAlign:'center',flexShrink:0}}>#{i+1}</span>
                      <CandidateAvatar name={c.candidate_name} size={32} />
                      <div style={{flex:1,minWidth:0}}>
                        <p className="f-body" style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.candidate_name||'—'}</p>
                        <p className="f-body" style={{fontSize:11,color:'var(--text-3)',fontWeight:500}}>{c.candidate_email||'—'}</p>
                      </div>
                      <span className="f-display" style={{fontSize:20,color:scoreCol,fontWeight:700,lineHeight:1,flexShrink:0}}>{fmt.score(c.overall_score)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      <HumanDecisionModal open={!!decisionTarget} result={decisionTarget} onClose={()=>setDecisionTarget(null)} onSaved={()=>{ setDecisionTarget(null); loadResults(); }} />
      <CompareModal open={compareOpen} resultIds={compareIds} onClose={()=>setCompareOpen(false)} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SESSION FILTERS PANEL
══════════════════════════════════════════════════════════ */
function SessionFiltersPanel({ filters, onChange, onClear }) {
  return (
    <div className="anim-slide-down" style={{padding:18,marginBottom:20,background:'var(--card)',border:'1.5px solid var(--blue)',borderRadius:12,boxShadow:'0 0 0 4px rgba(37,99,235,.06)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <span className="f-body" style={{fontSize:13,fontWeight:700,color:'var(--blue)'}}>Filter Sessions</span>
        <GhostBtn onClick={onClear} style={{padding:'5px 12px',fontSize:12}}>✕ Clear All</GhostBtn>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
        <select style={{padding:'10px 12px'}} value={filters.status} onChange={e=>onChange('status',e.target.value)}>
          <option value="">All Statuses</option>
          {['pending','processing','completed','failed'].map(s=><option key={s} value={s}>{fmt.label(s)}</option>)}
        </select>
        <input style={{padding:'10px 12px'}} placeholder="Min resumes" type="number" value={filters.min_resumes} onChange={e=>onChange('min_resumes',e.target.value)} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ANALYTICS VIEW
══════════════════════════════════════════════════════════ */
function AnalyticsView({ onRefresh }) {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);

  const load=useCallback(async()=>{ setLoading(true); try { const r=await AxiosInstance.get('/api/screening/v1/analytics/'); setData(r.data?.data||r.data); } catch { toast.error('Failed to load analytics'); } finally { setLoading(false); } },[]);
  useEffect(()=>{ load(); },[load]);

  if (loading) return <div style={{display:'flex',flexDirection:'column',gap:16}}>{[...Array(4)].map((_,i)=><div key={i} style={{padding:22,background:'var(--card)',border:'1px solid var(--border)',borderRadius:12}}><Skel width='40%' height={18}/><div style={{height:10}}/><Skel width='100%' height={32}/></div>)}</div>;
  if (!data) return null;

  const {sessions,candidates,human_decisions,cost,top_jobs_by_screenings}=data;
  const totalCandidates=candidates?.total_screened||1;

  return (
    <div className="anim-fade-up" style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <GhostBtn onClick={()=>{ load(); onRefresh?.(); }}>↻ Refresh Data</GhostBtn>
      </div>

      {/* Big numbers */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>
        {[
          {label:'Total Sessions', val:sessions?.total||0,            color:'var(--black)',   sub:'All time',            top:'var(--black)'   },
          {label:'Completed',      val:sessions?.completed||0,        color:'var(--emerald)', sub:'Fully processed',     top:'var(--emerald)' },
          {label:'Screened',       val:candidates?.total_screened||0, color:'var(--blue)',    sub:'Candidates evaluated',top:'var(--blue)'    },
          {label:'Avg Score',      val:fmt.score(candidates?.avg_score||0), color:'var(--amber)', sub:'Overall average', top:'var(--amber)'   },
          {label:'HR Reviewed',    val:human_decisions?.total_reviewed||0, color:'var(--violet)', sub:'Decisions made', top:'var(--violet)'  },
          {label:'Total Cost',     val:fmt.usd(cost?.total_cost_usd||0),   color:'var(--emerald)', sub:'API spend',     top:'var(--emerald)' },
        ].map(s=>(
          <Card key={s.label} style={{padding:22,borderTop:`3px solid ${s.top}`}}>
            <p className="f-body" style={{fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--text-3)',marginBottom:12}}>{s.label}</p>
            <p className="f-display" style={{fontSize:44,fontWeight:700,color:s.color,lineHeight:1,marginBottom:6}}>{s.val}</p>
            <p className="f-body" style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>{s.sub}</p>
          </Card>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
        {/* Session status */}
        <Card style={{padding:24}}>
          <SLabel>Session Status</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            {[['completed','var(--emerald)'],['in_progress','var(--orange)'],['pending','var(--text-3)'],['failed','var(--rose)']].map(([k,color])=>{
              const v=sessions?.[k]||0; const pct=sessions?.total>0?v/sessions.total*100:0;
              return (
                <div key={k}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span className="f-body" style={{fontSize:13,fontWeight:500,color:'var(--text-2)'}}>{fmt.label(k)}</span>
                    <span><span className="f-display" style={{fontSize:20,color,fontWeight:700}}>{v}</span><span className="f-body" style={{fontSize:12,color:'var(--text-3)',marginLeft:6,fontWeight:500}}>({pct.toFixed(1)}%)</span></span>
                  </div>
                  <ProgBar pct={pct} color={color} height={5} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* AI decisions */}
        <Card style={{padding:24}}>
          <SLabel>AI Decisions</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {DECISIONS.map(d=>{
              const c=DECISION_CFG[d]; const v=candidates?.by_ai_decision?.[d]||0;
              const pct=totalCandidates>0?v/totalCandidates*100:0;
              return (
                <div key={d}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:14}}>{c.icon}</span>
                      <span className="f-body" style={{fontSize:13,fontWeight:500,color:'var(--text-2)'}}>{fmt.label(d)}</span>
                    </span>
                    <span><span className="f-display" style={{fontSize:18,color:c.color,fontWeight:700}}>{v}</span><span className="f-body" style={{fontSize:11,color:'var(--text-3)',marginLeft:5,fontWeight:500}}>({pct.toFixed(1)}%)</span></span>
                  </div>
                  <ProgBar pct={pct} color={c.accent} height={5} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* HR decisions */}
        <Card style={{padding:24}}>
          <SLabel>HR Decisions</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {DECISIONS.map(d=>{
              const c=DECISION_CFG[d]; const v=human_decisions?.by_decision?.[d]||0;
              const total=human_decisions?.total_reviewed||1; const pct=total>0?v/total*100:0;
              return (
                <div key={d}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:14}}>{c.icon}</span><span className="f-body" style={{fontSize:13,fontWeight:500,color:'var(--text-2)'}}>{fmt.label(d)}</span></span>
                    <span className="f-display" style={{fontSize:18,color:c.color,fontWeight:700}}>{v}</span>
                  </div>
                  <ProgBar pct={pct} color={c.accent} height={5} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Average scores */}
        <Card style={{padding:24}}>
          <SLabel>Average Scores</SLabel>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            {[['Overall',candidates?.avg_score||0,'var(--text)'],['Skills',candidates?.avg_skill_score||0,'var(--blue)'],['Experience',candidates?.avg_exp_score||0,'var(--violet)']].map(([l,v,c])=>(
              <ScoreRow key={l} label={l} score={v} color={c} />
            ))}
          </div>
        </Card>

        {/* Top jobs */}
        {top_jobs_by_screenings?.length>0&&(
          <Card style={{padding:24,gridColumn:'1/-1'}}>
            <SLabel>Most Screened Jobs</SLabel>
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {top_jobs_by_screenings.map((j,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:16,padding:'13px 0',borderBottom:'1px solid var(--border)'}}>
                  <span className="f-display" style={{fontSize:22,color:i<3?'var(--amber)':'var(--text-3)',fontWeight:700,width:36,textAlign:'center',flexShrink:0}}>#{i+1}</span>
                  <span className="f-body" style={{flex:1,fontSize:14,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.job__title}</span>
                  <Chip color='var(--blue)' bg='var(--blue-light)' border='var(--blue-mid)'>{j.count} sessions</Chip>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Cost */}
        <Card style={{padding:24}}>
          <SLabel>Cost Tracking</SLabel>
          <dl style={{display:'flex',flexDirection:'column',gap:0}}>
            {[['Total Tokens',(cost?.total_tokens_used||0).toLocaleString(),'var(--violet)'],['Total Cost USD',fmt.usd(cost?.total_cost_usd||0),'var(--emerald)']].map(([k,v,c])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 0',borderBottom:'1px solid var(--border)'}}>
                <dt className="f-body" style={{fontSize:12,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{k}</dt>
                <dd className="f-display" style={{fontSize:22,color:c,fontWeight:700}}>{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════════════════════ */
const EMPTY_SESSION_FILTERS={status:'',min_resumes:''};

export default function ScreeningPage() {
  const [view,setView]=useState('list');
  const [tab,setTab]=useState('sessions');
  const [sessions,setSessions]=useState([]);
  const [stats,setStats]=useState({});
  const [loading,setLoading]=useState(false);
  const [filters,setFilters]=useState({...EMPTY_SESSION_FILTERS});
  const [showFilters,setShowFilters]=useState(false);
  const [selectedSession,setSelectedSession]=useState(null);
  const [selectedResult,setSelectedResult]=useState(null);
  const [startModal,setStartModal]=useState(false);
  const [deleteTarget,setDeleteTarget]=useState(null);

  const loadSessions=useCallback(async()=>{ setLoading(true); try { const params={}; Object.entries(filters).forEach(([k,v])=>{ if(v!=='') params[k]=v; }); const r=await AxiosInstance.get('/api/screening/v1/session/',{params}); setSessions(r.data?.results||r.data?.data||r.data||[]); } catch { toast.error('Failed to load sessions'); } finally { setLoading(false); } },[filters]);
  const loadStats=useCallback(async()=>{ try { const r=await AxiosInstance.get('/api/screening/v1/stats/'); setStats(r.data?.data||r.data||{}); } catch {} },[]);

  useEffect(()=>{ loadSessions(); loadStats(); },[loadSessions,loadStats]);

  const openSession=id=>{ setSelectedSession(id); setView('session'); };
  const openResult=id=>{ setSelectedResult(id); setView('result'); };
  const backToList=()=>{ setView('list'); setSelectedSession(null); setSelectedResult(null); };
  const backToSession=()=>{ setView('session'); setSelectedResult(null); };

  const doDelete=async()=>{ if(!deleteTarget) return; try { await AxiosInstance.delete(`/api/screening/v1/session/?id=${deleteTarget.id}`); toast.success('Session deleted'); setDeleteTarget(null); loadSessions(); loadStats(); } catch(e){ toast.error(e.response?.data?.message||'Delete failed'); } };
  const handleStarted=sessionId=>{ loadSessions(); loadStats(); openSession(sessionId); };

  const activeFilterCount=Object.values(filters).filter(v=>v!=='').length;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Toasts />

      <div className="f-body" style={{background:'var(--bg)',color:'var(--text)',minHeight:'100vh'}}>

        {/* HEADER */}
        <header style={{position:'sticky',top:0,zIndex:40,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',height:60,background:'rgba(255,255,255,.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',boxShadow:'0 1px 8px rgba(15,23,42,.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,background:'var(--black)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>⚡</div>
              <span className="f-display" style={{fontSize:20,fontWeight:700,color:'var(--text)',lineHeight:1}}>Screening</span>
            </div>
            {view==='list'&&(
              <><span style={{width:1,height:20,background:'var(--border)'}}/><span className="f-body" style={{fontSize:12,fontWeight:600,color:'var(--text-3)',letterSpacing:'0.04em'}}>{tab==='sessions'?(loading?'Loading…':`${sessions.length} sessions`):'Analytics'}</span></>
            )}
          </div>
          {view==='list'&&tab==='sessions'&&(
            <PrimaryBtn onClick={()=>setStartModal(true)} style={{padding:'9px 22px',gap:8}}>
              <span style={{fontSize:15,lineHeight:1}}>⚡</span> Start Screening
            </PrimaryBtn>
          )}
        </header>

        {/* STATS STRIP */}
        {view==='list'&&(
          <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
            {[
              {label:'Sessions',   val:stats.total_sessions??sessions.length,             color:'var(--black)',   bg:'var(--black)'  },
              {label:'Completed',  val:stats.by_session_status?.completed??'—',           color:'var(--emerald)',bg:'var(--emerald)'},
              {label:'Processing', val:stats.by_session_status?.processing??'—',          color:'var(--orange)', bg:'var(--orange)' },
              {label:'Screened',   val:stats.total_results??'—',                          color:'var(--blue)',   bg:'var(--blue)'   },
              {label:'Failed',     val:stats.by_session_status?.failed??'—',              color:'var(--rose)',   bg:'var(--rose)'   },
            ].map(s=>(
              <div key={s.label} style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'12px 28px',minWidth:104,flexShrink:0,overflow:'hidden',borderRight:'1px solid var(--border)'}}>
                <span className="f-display" style={{fontSize:26,color:s.color,lineHeight:1,marginBottom:4,fontWeight:700}}>{s.val}</span>
                <span className="f-body" style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-3)'}}>{s.label}</span>
                <span style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:s.bg,opacity:.35,borderRadius:2}} />
              </div>
            ))}
          </div>
        )}

        {/* TABS */}
        {view==='list'&&(
          <div style={{display:'flex',background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 28px'}}>
            {[{id:'sessions',l:'All Sessions'},{id:'analytics',l:'Analytics'}].map(n=>(
              <button key={n.id} onClick={()=>setTab(n.id)} className="f-body"
                style={{fontSize:13,fontWeight:600,padding:'14px 4px',marginRight:24,background:'none',border:'none',borderBottom:`2px solid ${tab===n.id?'var(--black)':'transparent'}`,color:tab===n.id?'var(--text)':'var(--text-3)',cursor:'pointer',transition:'all .15s'}}>
                {n.l}
              </button>
            ))}
          </div>
        )}

        {/* CONTENT */}
        <main style={{maxWidth:1240,margin:'0 auto',padding:'28px 28px'}}>

          {/* List */}
          {view==='list'&&tab==='sessions'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:20}}>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <GhostBtn onClick={()=>setShowFilters(p=>!p)} active={showFilters} style={{gap:8}}>
                    <svg width={14} height={14} viewBox="0 0 16 16" fill="currentColor"><path d="M1 3h14v1.5L10 10v5l-4-2v-3L1 4.5V3z"/></svg>
                    Filters{activeFilterCount>0?<span style={{background:'var(--blue)',color:'#fff',borderRadius:10,padding:'1px 7px',fontSize:11,fontWeight:700}}>{activeFilterCount}</span>:''}
                  </GhostBtn>
                  {activeFilterCount>0&&<GhostBtn onClick={()=>setFilters({...EMPTY_SESSION_FILTERS})}>✕ Clear</GhostBtn>}
                  <GhostBtn onClick={()=>{ loadSessions(); loadStats(); }} style={{padding:'8px 12px'}}>↻</GhostBtn>
                </div>
                <span className="f-body" style={{fontSize:13,color:'var(--text-3)',fontWeight:500,display:'flex',alignItems:'center',gap:8}}>
                  {loading?<><Spinner size={12} color='var(--blue)'/> Loading…</>:`${sessions.length} session${sessions.length!==1?'s':''}`}
                </span>
              </div>

              {showFilters&&<SessionFiltersPanel filters={filters} onChange={(k,v)=>setFilters(p=>({...p,[k]:v}))} onClear={()=>setFilters({...EMPTY_SESSION_FILTERS})} />}

              {loading ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
                  {[...Array(6)].map((_,i)=>(
                    <div key={i} style={{display:'flex',overflow:'hidden',background:'var(--card)',border:'1px solid var(--border)',borderRadius:14}}>
                      <div style={{width:4,background:'var(--border)',flexShrink:0}} />
                      <div style={{flex:1,padding:18,display:'flex',flexDirection:'column',gap:12}}>
                        <Skel width='60%' height={18}/><Skel width='40%' height={12}/>
                        <div style={{display:'flex',gap:6}}><Skel width={80} height={22} radius={12}/><Skel width={100} height={22} radius={12}/></div>
                        <Skel width='100%' height={1}/><Skel width='45%' height={12}/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sessions.length>0 ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
                  {sessions.map(s=><SessionCard key={s.id} session={s} onSelect={openSession} onDelete={s=>setDeleteTarget(s)} />)}
                </div>
              ) : (
                <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16}}>
                  <EmptyState
                    icon={activeFilterCount>0?'🔍':'⚡'}
                    title={activeFilterCount>0?'No sessions match filters':'No screening sessions yet'}
                    sub={activeFilterCount>0?'Try adjusting your filters':'Start your first AI screening session to rank and evaluate candidates'}
                    action={activeFilterCount>0
                      ? <GhostBtn onClick={()=>setFilters({...EMPTY_SESSION_FILTERS})}>Clear Filters</GhostBtn>
                      : <PrimaryBtn onClick={()=>setStartModal(true)} style={{padding:'11px 32px',gap:8}}>⚡ Start First Screening</PrimaryBtn>}
                  />
                </div>
              )}
            </div>
          )}

          {view==='list'&&tab==='analytics'&&<AnalyticsView onRefresh={()=>{ loadSessions(); loadStats(); }} />}
          {view==='session'&&selectedSession&&<SessionDetail sessionId={selectedSession} onBack={backToList} onOpenResult={id=>{ setSelectedResult(id); setView('result'); }} />}
          {view==='result'&&selectedResult&&<ResultDetail resultId={selectedResult} onBack={selectedSession?backToSession:backToList} onDecision={()=>{}} />}
        </main>

        <footer style={{borderTop:'1px solid var(--border)',padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--surface)'}}>
          <span className="f-body" style={{fontSize:12,fontWeight:600,color:'var(--text-3)',letterSpacing:'0.04em'}}>Screening · Recruitment Platform</span>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'var(--blue)'}} />
            <span className="f-body" style={{fontSize:12,color:'var(--text-3)',fontWeight:500}}>AI-Powered Evaluation</span>
          </div>
        </footer>
      </div>

      <StartScreeningModal open={startModal} onClose={()=>setStartModal(false)} onStarted={handleStarted} />
      <ConfirmModal open={!!deleteTarget} title="Delete this session?" confirmLabel="Confirm Delete"
        message={`Session for "${deleteTarget?.job_title}" will be permanently deleted.`}
        onConfirm={doDelete} onCancel={()=>setDeleteTarget(null)} />
    </>
  );
}