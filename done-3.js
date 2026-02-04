function createParticles() {
  const body = document.body;
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.position = "fixed";
    particle.style.width = "8px";
    particle.style.height = "8px";
    particle.style.borderRadius = "50%";
    particle.style.background = "rgba(255,255,255,0.3)";
    particle.style.top = Math.random() * window.innerHeight + "px";
    particle.style.left = Math.random() * window.innerWidth + "px";
    particle.style.animation = `floatParticle ${5 + Math.random() * 5}s infinite ease-in-out`;
    body.appendChild(particle);
  }

  const style = document.createElement("style");
  style.textContent = `
    @keyframes floatParticle {
      0% { transform: translateY(0px) scale(1); opacity: 0.8; }
      50% { transform: translateY(-30px) scale(1.3); opacity: 0.5; }
      100% { transform: translateY(0px) scale(1); opacity: 0.8; }
    }
  `;
  document.head.appendChild(style);
}
createParticles();

/* ===========================
   SMOOTH SCROLL BETWEEN INFO PAGES
   =========================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});
/* ========= Utilities ========= */
const STORE_KEY = 'rt_store_v5';
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const modalRoot = $('#modalRoot') || document.body;

const genId = (pref='id') => `${pref}_${Date.now()}_${Math.floor(Math.random()*9000)+1000}`;
const formatDate = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const todayKey = ()=>{ const d=new Date(); d.setHours(0,0,0,0); return formatDate(d); };
const addDaysKey = (n)=>{ const d=new Date(); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return formatDate(d); };

function parseJSON(s){ try{ return JSON.parse(s); } catch(e){ return null; } }
function saveStore(){ localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); }
function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style = 'position:fixed;right:20px;bottom:24px;padding:10px 14px;background:#111;color:#fff;border-radius:10px;z-index:99999;opacity:0;transform:translateY(8px);transition:all .28s';
  document.body.appendChild(t);
  requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateY(0)'; });
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(8px)'; setTimeout(()=>t.remove(),300); }, 2000);
}

/* ========= Store (seed/demo) ========= */
let STORE = {
  users: [],
  current: null,
  data: {
    routines: {},
    deadlines: {},
    quizzes: [],
    assignments: [],
    files: [],
    anns: [],
    messages: []
  }
};

function seedDemo(){
  STORE = {
    users: [
      { username:'teacher1', name:'Ms Ada', email:'teacher1@demo.edu', role:'teacher', id:'T100', password:'Teacher@123!' },
      { username:'student1', name:'Sam Student', email:'student1@demo.edu', role:'student', id:'S100', password:'Student@123!' },
      { username:'student2', name:'Alex Learner', email:'alex@demo.edu', role:'student', id:'S101', password:'Student@123!' }
    ],
    current: null,
    data: {
      routines: {
        teacher1: { dates: [] },
        student1: { dates: [ addDaysKey(-3), addDaysKey(-2), addDaysKey(-1) ] },
        student2: { dates: [] }
      },
      deadlines: {
        teacher1: [{ id: genId('d'), date: addDaysKey(2), title:'Grade submissions' }],
        student1: [{ id: genId('d'), date: addDaysKey(5), title:'Math assignment due' }],
        student2: []
      },
      quizzes: [
        {
          id: genId('q'),
          title: 'Algebra Quick Check',
          author: 'teacher1',
          to: ['student1','student2'],
          questions: [
            { q:'What is 2+2?', opts:['3','4','5'], correctIndex:1 },
            { q:'What is 5*3?', opts:['15','8','10'], correctIndex:0 }
          ],
          results: [ { student:'student1', score:100, answers:[1,0], date: new Date().toISOString() } ]
        }
      ],
      assignments: [
        { id: genId('ass'), title:'Essay: My Favorite Book', desc:'Write 500 words', author:'teacher1', to:['student1','student2'], submissions: [] }
      ],
      files: [],
      anns: [ { id: genId('ann'), title:'Welcome!', msg:'Welcome to the demo Routine Tracker', from:'teacher1', to:['all'], date:new Date().toISOString() } ],
      messages: []
    }
  };
  saveStore();
}

function loadStore(){
  const raw = localStorage.getItem(STORE_KEY);
  if(!raw){ seedDemo(); return; }
  const obj = parseJSON(raw);
  if(!obj){ seedDemo(); return; }
  STORE = obj;
}
loadStore();

/* ========= Small helpers ========= */
function currentUser(){ return STORE.users.find(u=>u.username === STORE.current) || null; }
function ensureSignedIn(){ if(!STORE.current){ toast('Please sign in'); showView('authView'); return false; } return true; }

/* ========= View management ========= */
const ALL_VIEWS = $$('.view');
function hideAllViews(){ ALL_VIEWS.forEach(v=>{ v.classList.add('hidden'); v.classList.remove('active'); }); }
function showView(id){
  hideAllViews();
  const v = document.getElementById(id);
  if(!v) return;
  v.classList.remove('hidden');
  // animate in
  requestAnimationFrame(()=> v.classList.add('active'));
  // nav active toggle
  $$('.nav-item').forEach(n=> n.classList.toggle('active', n.dataset.view === id));
}
function setupNav(){
  $$('.nav-item').forEach(item=>{
    item.tabIndex = 0;
    item.addEventListener('click', ()=>{
      const view = item.dataset.view;
      // access control
      if(view === 'teacherView' && (!ensureSignedIn() || currentUser().role !== 'teacher')){ toast('Teacher only'); return; }
      if(view === 'studentView' && (!ensureSignedIn() || currentUser().role !== 'student')){ toast('Student only'); return; }
      if((view === 'routineView' || view === 'eduPick') && !ensureSignedIn()){ toast('Please sign in'); showView('authView'); return; }
      showView(view);
      if(view === 'routineView'){ renderCalendar(); renderDeadlines(); loadStreakAndChart(); }
      if(view === 'teacherView'){ renderTeacherUI(); }
      if(view === 'studentView'){ renderStudentUI(); }
      if(view === 'messagesView'){ renderMessages(); }
    });
    item.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') item.click(); });
  });
}
setupNav();

/* 3-dot popup click handlers (links hold data-page exactly matching view ids) */
$$('#morePopup .popup-link').forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    const pageId = a.dataset.page; // e.g. aboutPage
    if(pageId) showView(pageId);
  });
});
// toggle more popup
$('#moreBtn')?.addEventListener('click', (e)=>{
  e.stopPropagation();
  const popup = $('#morePopup');
  if(!popup) return;
  popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
  popup.style.flexDirection = 'column';
});
window.addEventListener('click', ()=> { const p = $('#morePopup'); if(p) p.style.display = 'none'; });

/* Home / left edu button */
$('#btnHome')?.addEventListener('click', ()=> { if(STORE.current) showView('routineView'); else showView('authView'); });
$('#btnEduLeft')?.addEventListener('click', ()=> { if(!ensureSignedIn()) return; showView('eduPick'); });

/* import/export/reset */
$('#btnExportStore')?.addEventListener('click', ()=> {
  const json = JSON.stringify(STORE, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'routine-tracker.json'; a.click(); URL.revokeObjectURL(url);
});
$('#btnImportStore')?.addEventListener('click', ()=> $('#importFileInput')?.click());
$('#importFileInput')?.addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = (ev)=> {
    try{ const obj = JSON.parse(ev.target.result); localStorage.setItem(STORE_KEY, JSON.stringify(obj)); toast('Imported — reloading'); setTimeout(()=> location.reload(), 700); }
    catch(err){ alert('Import failed: '+err.message); }
  };
  r.readAsText(f);
});
$('#btnReset')?.addEventListener('click', ()=> { if(confirm('Reset demo data?')){ localStorage.removeItem(STORE_KEY); location.reload(); } });

/* ========= Auth: strict signup/signin ========= */
function passwordError(p){
  if(!p) return 'Password required';
  if(p.length < 10) return 'At least 10 characters';
  if(!/[A-Z]/.test(p)) return 'At least one uppercase letter';
  if(!/[0-9]/.test(p)) return 'At least one number';
  if(!/[^A-Za-z0-9]/.test(p)) return 'At least one special character';
  return null;
}

// Signup
$('#btnSignUp')?.addEventListener('click', ()=>{
  const name = $('#su_name')?.value.trim() || '';
  const username = $('#su_username')?.value.trim() || '';
  const email = $('#su_email')?.value.trim() || '';
  const password = $('#su_password')?.value || '';
  const role = $('#su_role')?.value || '';
  const id = $('#su_id')?.value.trim() || '';
  if(!name||!username||!email||!password||!role||!id){ $('#signupError').textContent = 'All fields required'; return; }
  if(!/^\S+@\S+\.\S+$/.test(email)){ $('#signupError').textContent = 'Invalid email'; return; }
  const perr = passwordError(password);
  if(perr){ $('#signupError').textContent = perr; return; }
  if(STORE.users.some(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase())){ $('#signupError').textContent = 'Username or email taken'; return; }
  STORE.users.push({ username, name, email, role, id, password });
  STORE.data.routines[username] = { dates: [] };
  STORE.data.deadlines[username] = [];
  saveStore();
  toast('Account created — sign in');
  $('#su_name').value=''; $('#su_username').value=''; $('#su_email').value=''; $('#su_password').value=''; $('#su_role').value=''; $('#su_id').value='';
});

// Signin
$('#btnSignIn')?.addEventListener('click', ()=>{
  const who = $('#si_user')?.value.trim() || '';
  const pw = $('#si_pass')?.value || '';
  $('#signinError').textContent = '';
  if(!who||!pw){ $('#signinError').textContent = 'Enter username/email and password'; return; }
  const found = STORE.users.find(u => u.username.toLowerCase() === who.toLowerCase() || u.email.toLowerCase() === who.toLowerCase());
  if(!found || found.password !== pw){ $('#signinError').textContent = 'Invalid credentials'; return; }
  STORE.current = found.username;
  if(!STORE.data.routines[found.username]) STORE.data.routines[found.username] = { dates: [] };
  if(!STORE.data.deadlines[found.username]) STORE.data.deadlines[found.username] = [];
  saveStore();
  afterSignIn();
});

// Enter key accessibility for auth
$('#si_user')?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') $('#btnSignIn').click(); });
$('#si_pass')?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') $('#btnSignIn').click(); });
['#su_name','#su_username','#su_email','#su_password','#su_id'].forEach(sel => {
  $(sel)?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') $('#btnSignUp').click(); });
});

// After sign in
function afterSignIn(){
  const u = currentUser();
  if(!u) return;
  $('#currentUserLabel').textContent = `${u.name} (${u.role})`;
  $('#btnLogout').style.display = 'inline-flex';
  showView('routineView');
  renderCalendar(); renderDeadlines(); loadStreakAndChart();
  renderTeacherUI(); renderStudentUI(); renderMessages();
  toast(`Signed in as ${u.name}`);
}

/* logout */
$('#btnLogout')?.addEventListener('click', ()=> {
  if(confirm('Log out?')){ STORE.current = null; saveStore(); location.reload(); }
});

/* ========= Calendar, Deadlines, Mark Today, Streak ========= */
let calDate = new Date(); calDate.setDate(1);

function renderCalendar(){
  const grid = $('#calendarGrid');
  if(!grid) return;
  grid.innerHTML = '';
  $('#monthYear').textContent = calDate.toLocaleString(undefined,{month:'long', year:'numeric'});
  const first = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
  const days = new Date(calDate.getFullYear(), calDate.getMonth()+1, 0).getDate();
  for(let i=0;i<first;i++){ const e = document.createElement('div'); e.className='cal-day'; grid.appendChild(e); }
  const u = currentUser(); const uname = u ? u.username : null;
  for(let d=1; d<=days; d++){
    const date = new Date(calDate.getFullYear(), calDate.getMonth(), d);
    const key = formatDate(date);
    const box = document.createElement('div'); box.className='cal-day'; box.textContent = d;
    if(key === todayKey()) box.classList.add('today');
    if(uname && (STORE.data.deadlines[uname]||[]).some(x=>x.date===key)){ box.classList.add('deadline'); box.title = (STORE.data.deadlines[uname]||[]).filter(x=>x.date===key).map(x=>x.title).join(', '); }
    box.addEventListener('click', ()=>{
      if(!ensureSignedIn()) return;
      const title = prompt(`Add deadline for ${key} (leave blank to cancel):`);
      if(!title) return;
      const id = genId('d');
      STORE.data.deadlines[uname] = STORE.data.deadlines[uname] || [];
      STORE.data.deadlines[uname].push({ id, date:key, title });
      saveStore(); renderDeadlines(); renderCalendar(); toast('Deadline added');
    });
    grid.appendChild(box);
  }
}
$('#calPrev')?.addEventListener('click', ()=>{ calDate.setMonth(calDate.getMonth()-1); renderCalendar(); });
$('#calNext')?.addEventListener('click', ()=>{ calDate.setMonth(calDate.getMonth()+1); renderCalendar(); });

function renderDeadlines(){
  const out = $('#deadlinesList'); if(!out) return;
  out.innerHTML = '';
  const u = currentUser(); if(!u){ out.innerHTML = '<div class="tiny-muted">Sign in to see deadlines</div>'; return; }
  const list = STORE.data.deadlines[u.username] || [];
  if(!list.length){ out.innerHTML = '<div class="tiny-muted">No deadlines</div>'; return; }
  list.sort((a,b)=> a.date.localeCompare(b.date));
  list.forEach(it=>{
    const row = document.createElement('div'); row.className='item';
    row.innerHTML = `<div><strong>${it.title}</strong><div class="tiny-muted">${it.date}</div></div><div style="display:flex;gap:6px"><button class="btn small">Delete</button></div>`;
    row.querySelector('button').addEventListener('click', ()=>{
      if(!confirm('Delete this deadline?')) return;
      STORE.data.deadlines[u.username] = STORE.data.deadlines[u.username].filter(x=>x.id !== it.id);
      saveStore(); renderDeadlines(); renderCalendar();
    });
    out.appendChild(row);
  });
}

/* Mark today's routine */
$('#btnMarkToday')?.addEventListener('click', ()=>{
  if(!ensureSignedIn()) return;
  const u = currentUser();
  const key = todayKey();
  STORE.data.routines[u.username] = STORE.data.routines[u.username] || { dates: [] };
  if(!STORE.data.routines[u.username].dates.includes(key)){
    STORE.data.routines[u.username].dates.push(key);
    saveStore(); loadStreakAndChart(); toast('Marked today done');
  } else toast('Already marked today');
});

function calcStreak(username){
  const set = new Set((STORE.data.routines[username] && STORE.data.routines[username].dates) || []);
  let count = 0; const d = new Date(); d.setHours(0,0,0,0);
  while(true){ const k = formatDate(d); if(set.has(k)){ count++; d.setDate(d.getDate()-1); } else break; }
  return count;
}

/* ========= Charts: Chart.js main + sparkline ========= */
let mainChart = null, sparkChart = null;
function loadStreakAndChart(){
  const u = currentUser(); if(!u) return;
  const s = calcStreak(u.username);
  $('#streakMain').textContent = s;
  $('#streakChip').textContent = s;

  // weekly (7 days) and monthly (30 days) arrays
  const weeklyLabels = [], weeklyVals = [];
  for(let i=6;i>=0;i--){ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i); weeklyLabels.push(d.toLocaleDateString(undefined,{month:'short',day:'numeric'})); weeklyVals.push( (STORE.data.routines[u.username] && STORE.data.routines[u.username].dates.includes(formatDate(d))) ? 1 : 0 ); }

  const monthlyLabels = [], monthlyVals = [];
  for(let i=29;i>=0;i--){ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i); monthlyLabels.push(d.toLocaleDateString(undefined,{month:'short',day:'numeric'})); monthlyVals.push( (STORE.data.routines[u.username] && STORE.data.routines[u.username].dates.includes(formatDate(d))) ? 1 : 0 ); }

  const mode = $('#chartToggleMonth')?.classList.contains('active') ? 'month' : 'week';
  const labels = mode === 'week' ? weeklyLabels : monthlyLabels;
  const data = mode === 'week' ? weeklyVals : monthlyVals;

  // main line chart
  const ctx = $('#mainChart')?.getContext('2d');
  if(!ctx) return;
  if(mainChart) mainChart.destroy();
  mainChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets:[ { label:'Completion', data, borderColor:'#60a5fa', backgroundColor:'rgba(96,165,250,0.14)', fill:true, tension:0.25, pointRadius:4 } ] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ min:0, max:1, ticks:{ stepSize:1 } } } }
  });

  // sparkline: last 7 days
  const spCtx = $('#sparkChart')?.getContext('2d');
  if(spCtx){
    if(sparkChart) sparkChart.destroy();
    sparkChart = new Chart(spCtx, {
      type:'bar', data:{ labels: weeklyLabels, datasets:[ { data: weeklyVals, backgroundColor:'#60a5fa' } ] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ x:{ display:false }, y:{ display:false } } }
    });
  }
}

// toggles
$('#chartToggleWeek')?.addEventListener('click', ()=>{
  $('#chartToggleWeek')?.classList.add('active'); $('#chartToggleMonth')?.classList.remove('active'); loadStreakAndChart();
});
$('#chartToggleMonth')?.addEventListener('click', ()=>{
  $('#chartToggleMonth')?.classList.add('active'); $('#chartToggleWeek')?.classList.remove('active'); loadStreakAndChart();
});

/* ========= Visual Quiz Editor (teacher) ========= */
let editorState = { questions: [] };

function renderQuizEditor(){
  const area = $('#quizEditorArea'); if(!area) return;
  area.innerHTML = '';
  if(editorState.questions.length === 0){ area.innerHTML = '<div class="tiny-muted">No questions yet — add one.</div>'; return; }
  editorState.questions.forEach((q, qi)=>{
    const wrap = document.createElement('div'); wrap.className='card'; wrap.style.marginBottom='8px';
    // question text
    const qtxt = document.createElement('div'); qtxt.style.marginBottom='8px';
    qtxt.innerHTML = `<strong>Q${qi+1}:</strong> `;
    const qinput = document.createElement('input'); qinput.type='text'; qinput.value = q.q; qinput.style.width='calc(100% - 90px)'; qinput.addEventListener('input', ()=> q.q = qinput.value);
    qtxt.appendChild(qinput);
    // options
    const optsWrap = document.createElement('div'); optsWrap.style.marginTop='8px';
    q.opts.forEach((opt, oi)=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.marginTop='6px';
      const radio = document.createElement('input'); radio.type='radio'; radio.name = `correct_${qi}`; radio.checked = (q.correctIndex === oi);
      radio.addEventListener('change', ()=> q.correctIndex = oi);
      const optInput = document.createElement('input'); optInput.type='text'; optInput.value = opt; optInput.style.flex = '1'; optInput.addEventListener('input', ()=> q.opts[oi] = optInput.value);
      const rmBtn = document.createElement('button'); rmBtn.className='btn small ghost'; rmBtn.textContent='Remove'; rmBtn.addEventListener('click', ()=> { q.opts.splice(oi,1); if(q.correctIndex >= q.opts.length) q.correctIndex = 0; renderQuizEditor(); });
      row.appendChild(radio); row.appendChild(optInput); row.appendChild(rmBtn);
      optsWrap.appendChild(row);
    });
    const addOptBtn = document.createElement('button'); addOptBtn.className='btn small'; addOptBtn.textContent='Add Option'; addOptBtn.style.marginTop='8px'; addOptBtn.addEventListener('click', ()=> { q.opts.push('New option'); renderQuizEditor(); });
    const rmQBtn = document.createElement('button'); rmQBtn.className='btn small ghost'; rmQBtn.textContent='Remove Q'; rmQBtn.style.marginLeft='8px'; rmQBtn.addEventListener('click', ()=> { editorState.questions.splice(qi,1); renderQuizEditor(); });
    wrap.appendChild(qtxt); wrap.appendChild(optsWrap); wrap.appendChild(addOptBtn); wrap.appendChild(rmQBtn);
    area.appendChild(wrap);
  });
}
$('#btnAddQuestion')?.addEventListener('click', ()=>{
  editorState.questions.push({ q:'New question', opts:['Option 1','Option 2'], correctIndex:0 });
  renderQuizEditor();
});

// Create quiz from editor
$('#btnCreateQuizVisual')?.addEventListener('click', ()=>{
  if(!ensureSignedIn()) return;
  const user = currentUser(); if(user.role !== 'teacher'){ toast('Teacher only'); return; }
  const title = $('#editorQuizTitle')?.value.trim() || '';
  const toRaw = $('#editorQuizTo')?.value.trim() || '';
  if(!title || editorState.questions.length === 0){ toast('Provide title and at least one question'); return; }
  const to = toRaw.toLowerCase()==='all' ? ['all'] : (toRaw ? toRaw.split(',').map(s=>s.trim()).filter(Boolean) : []);
  const quiz = { id: genId('quiz'), title, author: user.username, to, questions: editorState.questions.map(q=>({ q:q.q, opts:q.opts.slice(), correctIndex:q.correctIndex })), results: [] };
  STORE.data.quizzes.push(quiz); saveStore();
  editorState.questions = []; $('#editorQuizTitle').value=''; $('#editorQuizTo').value=''; renderQuizEditor(); renderTeacherQuizzesList(); renderStudentAssignedQuizzes();
  toast('Quiz created');
});
$('#btnClearQuizEditor')?.addEventListener('click', ()=> { editorState.questions = []; renderQuizEditor(); });

/* ========= Assignments ========= */
$('#btnCreateAssignVisual')?.addEventListener('click', ()=>{
  if(!ensureSignedIn()) return;
  const user = currentUser(); if(user.role !== 'teacher'){ toast('Teacher only'); return; }
  const title = $('#editorAssignTitle')?.value.trim() || '';
  const desc = $('#editorAssignDesc')?.value.trim() || '';
  const toRaw = $('#editorAssignTo')?.value.trim() || '';
  if(!title || !desc){ toast('Provide title & description'); return; }
  const to = toRaw.toLowerCase()==='all' ? ['all'] : (toRaw ? toRaw.split(',').map(s=>s.trim()).filter(Boolean) : []);
  const obj = { id: genId('ass'), title, desc, author: user.username, to, submissions: [] };
  STORE.data.assignments.push(obj); saveStore(); $('#editorAssignTitle').value=''; $('#editorAssignDesc').value=''; $('#editorAssignTo').value=''; renderTeacherQuizzesList(); renderStudentUI(); toast('Assignment created');
});

/* ========= File upload (base64 stored locally) ========= */
$('#btnUploadFiles')?.addEventListener('click', ()=>{
  if(!ensureSignedIn()) return;
  const user = currentUser(); if(user.role !== 'teacher'){ toast('Teacher only'); return; }
  const input = $('#teacherFileInput'); const files = input?.files;
  if(!files || files.length === 0){ toast('Select files'); return; }
  const toRaw = $('#teacherFileTo')?.value.trim() || '';
  const to = toRaw.toLowerCase()==='all' ? ['all'] : (toRaw ? toRaw.split(',').map(s=>s.trim()).filter(Boolean) : []);
  const readers = Array.from(files).map(f => new Promise((res, rej)=>{
    const r = new FileReader();
    r.onload = (ev)=> {
      STORE.data.files.push({ id: genId('f'), title: f.name, filename: f.name, mime: f.type, dataUrl: ev.target.result, from: user.username, to });
      res();
    };
    r.onerror = rej;
    r.readAsDataURL(f);
  }));
  Promise.all(readers).then(()=>{ saveStore(); input.value=''; $('#teacherFileTo').value=''; renderTeacherFilesList(); renderStudentUI(); toast('Files uploaded'); }).catch(err=> alert('Failed to read files: '+err));
});

function renderTeacherFilesList(){
  const wrap = $('#teacherFilesList'); if(!wrap) return; wrap.innerHTML = '';
  const user = currentUser(); if(!user) return;
  const mine = STORE.data.files.filter(f => f.from === user.username);
  if(!mine.length) { wrap.innerHTML = '<div class="tiny-muted">No files</div>'; return; }
  mine.forEach(f=> {
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div><strong>${f.title}</strong><div class="tiny-muted">${f.filename}</div></div>
      <div style="display:flex;gap:8px"><a class="btn small" href="${f.dataUrl}" download="${f.filename}">Download</a></div>`;
    wrap.appendChild(el);
  });
}

/* ========= Announcements ========= */
$('#btnSendAnnouncement')?.addEventListener('click', ()=>{
  if(!ensureSignedIn()) return;
  const user = currentUser(); if(user.role !== 'teacher'){ toast('Teacher only'); return; }
  const title = $('#annTitle')?.value.trim() || ''; const msg = $('#annMsg')?.value.trim() || ''; const toRaw = $('#annTo')?.value.trim() || '';
  if(!title || !msg){ toast('Title & message required'); return; }
  const to = toRaw.toLowerCase()==='all' ? ['all'] : (toRaw ? toRaw.split(',').map(s=>s.trim()).filter(Boolean) : []);
  STORE.data.anns.push({ id: genId('ann'), title, msg, from: user.username, to, date: new Date().toISOString() });
  saveStore(); $('#annTitle').value=''; $('#annMsg').value=''; $('#annTo').value=''; renderTeacherAnnsList(); renderStudentUI(); toast('Announcement sent');
});
function renderTeacherAnnsList(){
  const wrap = $('#annList'); if(!wrap) return; wrap.innerHTML = '';
  const user = currentUser(); if(!user) return;
  const mine = STORE.data.anns.filter(a => a.from === user.username);
  if(!mine.length){ wrap.innerHTML = '<div class="tiny-muted">No announcements</div>'; return; }
  mine.forEach(a=>{
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div><strong>${a.title}</strong><div class="tiny-muted">${a.msg}</div></div><div class="tiny-muted">${new Date(a.date).toLocaleString()}</div>`;
    wrap.appendChild(el);
  });
}

/* ========= Search & Messaging ========= */
// teacher searching students
$('#btnSearchStudent')?.addEventListener('click', ()=>{
  if(!ensureSignedIn()) return;
  const user = currentUser(); if(user.role !== 'teacher'){ toast('Teacher only'); return; }
  const q = $('#searchStudentInput')?.value.trim().toLowerCase() || ''; const wrap = $('#searchResults'); if(!wrap) return; wrap.innerHTML = '';
  if(!q) { wrap.innerHTML = '<div class="tiny-muted">Enter search</div>'; return; }
  const results = STORE.users.filter(u => u.role === 'student' && (u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)));
  if(!results.length){ wrap.innerHTML = '<div class="tiny-muted">No students found</div>'; return; }
  results.forEach(r=>{
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div><strong>${r.name}</strong><div class="tiny-muted">${r.username}</div></div><div style="display:flex;gap:8px"><button class="btn small">Message</button></div>`;
    el.querySelector('button').addEventListener('click', ()=>{
      const text = prompt(`Message to ${r.name}:`); if(!text) return;
      STORE.data.messages.push({ id:genId('msg'), from: currentUser().username, to: r.username, msg: text, date: new Date().toISOString() });
      saveStore(); toast('Message sent'); renderMessages();
    });
    wrap.appendChild(el);
  });
});

// student searching teachers
$('#btnSearchTeacher')?.addEventListener('click', ()=>{
  if(!ensureSignedIn()) return;
  const q = $('#searchTeacherInput')?.value.trim().toLowerCase() || ''; const wrap = $('#teacherSearchResults'); if(!wrap) return; wrap.innerHTML = '';
  if(!q) { wrap.innerHTML = '<div class="tiny-muted">Enter search</div>'; return; }
  const results = STORE.users.filter(u => u.role === 'teacher' && (u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)));
  if(!results.length){ wrap.innerHTML = '<div class="tiny-muted">No teachers found</div>'; return; }
  results.forEach(r=>{
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div><strong>${r.name}</strong><div class="tiny-muted">${r.username}</div></div><div style="display:flex;gap:8px"><button class="btn small">Message</button></div>`;
    el.querySelector('button').addEventListener('click', ()=>{
      const text = prompt(`Message to ${r.name}:`); if(!text) return;
      STORE.data.messages.push({ id:genId('msg'), from: currentUser().username, to: r.username, msg: text, date: new Date().toISOString() });
      saveStore(); toast('Message sent'); renderMessages();
    });
    wrap.appendChild(el);
  });
});

// render messages
function renderMessages(){
  const wrap = $('#messagesList'); if(!wrap) return; wrap.innerHTML = '';
  if(!STORE.current){ wrap.innerHTML = '<div class="tiny-muted">Sign in to view messages</div>'; return; }
  const arr = STORE.data.messages.filter(m => m.from === STORE.current || m.to === STORE.current).sort((a,b)=> new Date(b.date)-new Date(a.date));
  if(!arr.length){ wrap.innerHTML = '<div class="tiny-muted">No messages</div>'; return; }
  arr.forEach(m=>{
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div><strong>${m.from} → ${m.to}</strong><div class="tiny-muted">${m.msg}</div></div><div class="tiny-muted">${new Date(m.date).toLocaleString()}</div>`;
    wrap.appendChild(el);
  });
}

/* ========= Student: view & take quizzes, assignments submissions ========= */
function renderStudentAssignedQuizzes(){
  const wrap = $('#studentQuizzesList'); if(!wrap) return; wrap.innerHTML = '';
  const u = currentUser(); if(!u){ wrap.innerHTML = '<div class="tiny-muted">Sign in to view</div>'; return; }
  const assigned = STORE.data.quizzes.filter(q => q.to.includes('all') || (q.to && q.to.includes(u.username)) || q.author === u.username);
  if(!assigned.length){ wrap.innerHTML = '<div class="tiny-muted">No quizzes assigned</div>'; return; }
  assigned.forEach(q=>{
    const done = q.results && q.results.some(r=> r.student === u.username);
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div><strong>${q.title}</strong><div class="tiny-muted">From: ${q.author}</div></div><div><button class="btn small">${done ? 'View' : 'Take'}</button></div>`;
    el.querySelector('button').addEventListener('click', ()=>{
      if(done){ const r = q.results.find(r=> r.student === u.username); alert(`${q.title} — Score: ${r.score}%`); return; }
      openQuizModal(q);
    });
    wrap.appendChild(el);
  });
}

function openQuizModal(q){
  const ov = document.createElement('div'); ov.className='modal-back';
  const modal = document.createElement('div'); modal.className='modal card';
  modal.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h3>${q.title}</h3><div class="tiny-muted">By ${q.author}</div></div><hr/>`;
  const form = document.createElement('div');
  q.questions.forEach((Q,i)=>{
    const block = document.createElement('div'); block.style.marginBottom='10px';
    block.innerHTML = `<div style="font-weight:700">${i+1}. ${Q.q}</div>`;
    Q.opts.forEach((opt, idx)=>{
      const optWrap = document.createElement('div'); optWrap.style.marginLeft='8px';
      optWrap.innerHTML = `<label><input type="radio" name="q${i}" value="${idx}" /> ${opt}</label>`;
      block.appendChild(optWrap);
    });
    form.appendChild(block);
  });
  const ctrl = document.createElement('div'); ctrl.style.display='flex'; ctrl.style.justifyContent='flex-end'; ctrl.style.gap='8px';
  const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='Cancel';
  const submit = document.createElement('button'); submit.className='btn'; submit.textContent='Submit';
  ctrl.appendChild(cancel); ctrl.appendChild(submit); form.appendChild(ctrl);
  modal.appendChild(form); ov.appendChild(modal); modalRoot.appendChild(ov);
  cancel.addEventListener('click', ()=> ov.remove());
  submit.addEventListener('click', ()=>{
    const answers = [];
    for(let i=0;i<q.questions.length;i++){
      const radios = modal.querySelectorAll(`input[name="q${i}"]`);
      let chosen = -1; radios.forEach(r=>{ if(r.checked) chosen = parseInt(r.value); });
      answers.push(chosen);
    }
    let correct = 0; q.questions.forEach((Q,i)=>{ if(answers[i] === Q.correctIndex) correct++; });
    const score = Math.round((correct / q.questions.length) * 100);
    q.results = q.results || []; q.results.push({ student: currentUser().username, score, answers, date: new Date().toISOString() });
    saveStore();
    // message teacher
    STORE.data.messages.push({ id: genId('msg'), from: currentUser().username, to: q.author, msg:`Submitted "${q.title}" — ${score}%`, date: new Date().toISOString() });
    saveStore();
    ov.remove(); toast(`Submitted — Score ${score}%`); renderTeacherQuizzesList(); renderStudentAssignedQuizzes(); renderMessages();
  });
}

// Assignments: student submissions
function renderStudentAssignments(){
  const wrap = $('#studentAssignmentsList'); if(!wrap) return; wrap.innerHTML = '';
  const u = currentUser(); if(!u){ wrap.innerHTML = '<div class="tiny-muted">Sign in to view</div>'; return; }
  const assigned = STORE.data.assignments.filter(a => a.to.includes('all') || (a.to && a.to.includes(u.username)) || a.author === u.username);
  if(!assigned.length){ wrap.innerHTML = '<div class="tiny-muted">No assignments</div>'; return; }
  assigned.forEach(a=>{
    const sub = a.submissions && a.submissions.find(s=> s.student === u.username);
    const el = document.createElement('div'); el.className='item';
    el.innerHTML = `<div><strong>${a.title}</strong><div class="tiny-muted">${a.desc}</div></div><div><button class="btn small">${sub ? 'View' : 'Submit'}</button></div>`;
    el.querySelector('button').addEventListener('click', ()=>{
      if(sub){ alert(`Submitted on ${new Date(sub.date).toLocaleString()}:\n\n${sub.content}`); return; }
      const content = prompt('Submit assignment (text):'); if(!content) return;
      a.submissions = a.submissions || []; a.submissions.push({ student: currentUser().username, content, date: new Date().toISOString() });
      saveStore(); toast('Assignment submitted'); renderStudentAssignments(); renderTeacherQuizzesList();
    });
    wrap.appendChild(el);
  });
}

/* ========= Student files & anns ========= */
function renderStudentFilesAndAnns(){
  const fw = $('#studentFilesList'); const aw = $('#studentAnnouncementsList'); if(!fw || !aw) return;
  fw.innerHTML = ''; aw.innerHTML = '';
  const u = currentUser(); if(!u){ fw.innerHTML='<div class="tiny-muted">Sign in</div>'; aw.innerHTML='<div class="tiny-muted">Sign in</div>'; return; }
  const files = STORE.data.files.filter(f => f.to.includes('all') || (f.to && f.to.includes(u.username)) || f.from === u.username);
  if(!files.length) fw.innerHTML = '<div class="tiny-muted">No files</div>'; else files.forEach(f=>{ const el=document.createElement('div'); el.className='item'; el.innerHTML = `<div><strong>${f.title}</strong><div class="tiny-muted">${f.filename}</div></div><div style="display:flex;gap:8px"><a class="btn small" href="${f.dataUrl}" download="${f.filename}">Download</a></div>`; fw.appendChild(el); });
  const anns = STORE.data.anns.filter(a => a.to.includes('all') || (a.to && a.to.includes(u.username)) || a.from === u.username);
  if(!anns.length) aw.innerHTML = '<div class="tiny-muted">No announcements</div>'; else anns.forEach(a=>{ const el=document.createElement('div'); el.className='item'; el.innerHTML = `<div><strong>${a.title}</strong><div class="tiny-muted">${a.msg}</div></div><div class="tiny-muted">${new Date(a.date).toLocaleString()}</div>`; aw.appendChild(el); });
}

/* ========= Teacher: quizzes list, results, analytics, CSV ========= */
function renderTeacherQuizzesList(){
  const wrap = $('#teacherQuizzesList'); if(!wrap) return; wrap.innerHTML = '';
  const user = currentUser(); if(!user || user.role !== 'teacher'){ wrap.innerHTML = '<div class="tiny-muted">Sign in as teacher</div>'; return; }
  const arr = STORE.data.quizzes.filter(q => q.author === user.username);
  if(!arr.length){ wrap.innerHTML = '<div class="tiny-muted">No quizzes</div>'; return; }
  arr.forEach(q=>{
    const el = document.createElement('div'); el.className='item';
    const toText = q.to && q.to.length ? q.to.join(', ') : 'all';
    const resultsCount = q.results ? q.results.length : 0;
    el.innerHTML = `<div><strong>${q.title}</strong><div class="tiny-muted">To: ${toText} • Results: ${resultsCount}</div></div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn small">View results</button>
        <button class="btn small ghost">Analytics</button>
      </div>`;
    el.querySelectorAll('button')[0].addEventListener('click', ()=>{
      if(!q.results || !q.results.length) return alert('No results yet');
      const text = q.results.map(r=> `${r.student} — ${r.score}% — ${new Date(r.date).toLocaleString()}`).join('\n');
      alert(`Results for "${q.title}":\n\n${text}`);
    });
    el.querySelectorAll('button')[1].addEventListener('click', ()=> openAnalyticsModal(q));
    wrap.appendChild(el);
  });
}

// CSV export (teacher)
$('#btnExportCSV')?.addEventListener('click', ()=>{
  if(!ensureSignedIn()) return;
  const user = currentUser(); if(user.role !== 'teacher'){ toast('Teacher only'); return; }
  const arr = STORE.data.quizzes.filter(q => q.author === user.username);
  let rows = [['Quiz Title','Student','Score','Submitted At']];
  arr.forEach(q=> { (q.results||[]).forEach(r=> rows.push([q.title, r.student, String(r.score), new Date(r.date).toLocaleString()])); });
  if(rows.length === 1){ toast('No results to export'); return; }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'quiz-results.csv'; a.click(); URL.revokeObjectURL(url);
});

// Analytics modal for a quiz
function openAnalyticsModal(q){
  const assigned = q.to.includes('all') ? STORE.users.filter(u=>u.role==='student').map(s=>s.username) : q.to.slice();
  const resultsMap = (q.results || []).reduce((acc,r)=>{ acc[r.student] = r; return acc; }, {});
  const scores = Object.values(resultsMap).map(r=>r.score);
  const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  const completed = Object.keys(resultsMap).length;
  const completionRate = assigned.length ? Math.round((completed / assigned.length) * 100) : 0;

  const ov = document.createElement('div'); ov.className='modal-back';
  const modal = document.createElement('div'); modal.className='modal card';
  modal.innerHTML = `<h3>Analytics — ${q.title}</h3>
    <div class="tiny-muted">Assigned students: ${assigned.length}</div>
    <div style="margin-top:8px"><strong>Average score:</strong> ${avg.toFixed(1)}%</div>
    <div style="margin-top:8px"><strong>Completion rate:</strong> ${completionRate}% (${completed}/${assigned.length})</div>
    <div style="margin-top:12px"><button class="btn">Close</button></div>`;
  modal.querySelector('button').addEventListener('click', ()=> ov.remove());
  ov.appendChild(modal); modalRoot.appendChild(ov);
}

/* ========= UI render helpers: teacher/student generic ========= */
function renderTeacherUI(){
  if(!ensureSignedIn()) return;
  renderTeacherFilesList(); renderTeacherAnnsList(); renderTeacherQuizzesList(); renderMessages();
  renderQuizEditor();
}

function renderStudentUI(){
  if(!ensureSignedIn()) return;
  renderStudentAssignedQuizzes(); renderStudentAssignments(); renderStudentFilesAndAnns(); renderMessages();
}

/* ========= Initial rendering and startup ========= */
function initialRender(){
  renderCalendar(); renderDeadlines(); renderTeacherFilesList(); renderTeacherAnnsList(); renderQuizEditor();
  renderTeacherQuizzesList(); renderStudentAssignedQuizzes(); renderStudentAssignments(); renderStudentFilesAndAnns(); renderMessages();
  // set chart toggle default
  $('#chartToggleWeek')?.classList.add('active');
  // make auth view visible if not signed in
  if(STORE.current){ afterSignIn(); } else showView('authView');
  // attach keyboard accessibility for some buttons
  $$('.btn').forEach(b=> b.tabIndex = 0);
}

initialRender();

/* expose store to console for debugging */
window.RTSTORE = { STORE, saveStore, loadStore, genId, formatDate, todayKey };
