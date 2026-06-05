/* =====================================================
   © 2026 Joshua Setiawan. All rights reserved.

   TASKTIVITY — API Layer with Demo Fallback
   ===================================================== */
'use strict';

/* ---------- Supabase init ---------- */
var _sb = null;
function _initSB () {
  if (_sb) return true;
  try {
    if (window.supabase && window.supabase.createClient) {
      _sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
      console.log('%c✓ Supabase connected','color:#22c55e');
      return true;
    }
  } catch (e) { console.warn('Supabase init fail:', e); }
  return false;
}

/* ---------- Demo data ---------- */
var _today = function () { return new Date().toISOString().split('T')[0]; };

var _demoSchedules = [
  { id:1, chat_id:YOUR_CHAT_ID_HERE, task:'Meeting tim project',    time:'09:00', date:_today(), status:'done',    source:'web' },
  { id:2, chat_id:YOUR_CHAT_ID_HERE, task:'Coding feature baru',    time:'10:30', date:_today(), status:'pending', source:'web' },
  { id:3, chat_id:YOUR_CHAT_ID_HERE, task:'Review pull request',    time:'13:00', date:_today(), status:'pending', source:'web' },
  { id:4, chat_id:YOUR_CHAT_ID_HERE, task:'Diskusi dengan client',  time:'15:00', date:_today(), status:'pending', source:'web' },
  { id:5, chat_id:YOUR_CHAT_ID_HERE, task:'Update dokumentasi',     time:'16:30', date:_today(), status:'pending', source:'web' }
];
var _demoTasks = [
  { id:1, title:'Design sistem database',      deadline:'2026-04-15', priority:'high',   status:'pending', created_at:'2026-04-08' },
  { id:2, title:'Buat API endpoint users',     deadline:'2026-04-12', priority:'high',   status:'done',    created_at:'2026-04-05' },
  { id:3, title:'Testing authentication',       deadline:'2026-04-20', priority:'medium', status:'pending', created_at:'2026-04-08' },
  { id:4, title:'Deploy ke production',         deadline:'2026-04-25', priority:'high',   status:'pending', created_at:'2026-04-01' },
  { id:5, title:'Dokumentasi lengkap',          deadline:'2026-04-18', priority:'low',    status:'pending', created_at:'2026-04-07' }
];
var _nextId = 100;
function _wait (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ---------- Unified API ---------- */
var API = {

  /* ---- helpers ---- */
  isDemo: function () { return !_sb; },
  getToday: _today,
  getChatId: function () { return localStorage.getItem('tv_chatid') || CONFIG.CHAT_ID; },
  setChatId: function (v) { localStorage.setItem('tv_chatid', v); },
  getUserName: function () { return localStorage.getItem('tv_name') || 'User'; },
  setUserName: function (v) { localStorage.setItem('tv_name', v); },

  /* ===== SCHEDULE ===== */

  getScheduleByDate: async function (date) {
    if (!_sb) {
      await _wait(200);
      return _demoSchedules.filter(function (s) { return s.date === date; });
    }
    try {
      var r = await _sb.from('schedule').select('*')
        .eq('chat_id', API.getChatId()).eq('date', date).order('time');
      return (r.data || []);
    } catch (e) { console.error(e); return []; }
  },

  getScheduleRange: async function (from, to) {
    if (!_sb) {
      await _wait(150);
      return _demoSchedules.filter(function (s) { return s.date >= from && s.date <= to; });
    }
    try {
      var r = await _sb.from('schedule').select('*')
        .eq('chat_id', API.getChatId()).gte('date', from).lte('date', to)
        .order('date').order('time');
      return (r.data || []);
    } catch (e) { console.error(e); return []; }
  },

  addSchedule: async function (task, time, date, source, status) {
    source = source || 'web'; status = status || 'pending';
    if (!_sb) {
      await _wait(300);
      var n = { id: ++_nextId, chat_id:YOUR_CHAT_ID_HERE, task:task, time:time, date:date, source:source, status:status };
      _demoSchedules.push(n);
      return n;
    }
    var r = await _sb.from('schedule').insert({ task:task, time:time, date:date, source:source, status:status, chat_id:API.getChatId() }).select();
    if (r.error) throw r.error;
    return r.data[0];
  },

  updateScheduleStatus: async function (id, status) {
    if (!_sb) {
      await _wait(200);
      var it = _demoSchedules.find(function (s) { return s.id === id; });
      if (it) it.status = status;
      return it;
    }
    var r = await _sb.from('schedule').update({ status:status }).eq('id', id).select();
    if (r.error) throw r.error;
    return r.data[0];
  },

  deleteSchedule: async function (id) {
    if (!_sb) {
      await _wait(200);
      _demoSchedules = _demoSchedules.filter(function (s) { return s.id !== id; });
      return;
    }
    var r = await _sb.from('schedule').delete().eq('id', id);
    if (r.error) throw r.error;
  },

  /* ===== TASKS ===== */

  getTasks: async function () {
    if (!_sb) { await _wait(200); return _demoTasks.slice(); }
    try {
      var r = await _sb.from('tasks').select('*').order('created_at', { ascending: false });
      return (r.data || []);
    } catch (e) { console.error(e); return []; }
  },

  addTask: async function (title, deadline, priority, notes) {
    priority = priority || 'medium'; notes = notes || '';
    if (!_sb) {
      await _wait(300);
      var n = { id: ++_nextId, title:title, deadline:deadline, priority:priority, status:'pending', notes:notes, created_at:new Date().toISOString() };
      _demoTasks.unshift(n);
      return n;
    }
    var r = await _sb.from('tasks').insert({ title:title, deadline:deadline, priority:priority, notes:notes, status:'pending',chat_id: API.getChatId()}).select();
    if (r.error) throw r.error;
    return r.data[0];
  },

  updateTaskStatus: async function (id, status) {
    if (!_sb) {
      await _wait(200);
      var it = _demoTasks.find(function (t) { return t.id === id; });
      if (it) it.status = status;
      return it;
    }
    var r = await _sb.from('tasks').update({ status:status }).eq('id', id).select();
    if (r.error) throw r.error;
    return r.data[0];
  },

  deleteTask: async function (id) {
    if (!_sb) {
      await _wait(200);
      _demoTasks = _demoTasks.filter(function (t) { return t.id !== id; });
      return;
    }
    var r = await _sb.from('tasks').delete().eq('id', id);
    if (r.error) throw r.error;
  },

  /* ===== AI ===== */

  aiChat: async function (msg, ctx) {
    ctx = ctx || [];
    var sys = 'Kamu adalah "Tasktivity AI", asisten produktivitas pribadi yang cerdas dan memotivasi. '
      + 'Jawab dalam Bahasa Indonesia, singkat & actionable. Hari ini: '
      + new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) + '.';
    var msgs = [{ role:'system', content:sys }].concat(ctx.slice(-8)).concat([{ role:'user', content:msg }]);

    try {
      var res = await fetch(CONFIG.AI_URL, {
        method:'POST',
        headers:{ 'Authorization':'Bearer '+CONFIG.AI_KEY, 'Content-Type':'application/json' },
        body: JSON.stringify({ model:CONFIG.AI_MODEL, messages:msgs, max_tokens:600, temperature:0.7 })
      });
      if (!res.ok) throw new Error('AI ' + res.status);
      var d = await res.json();
      return d.choices[0].message.content;
    } catch (e) {
      console.warn('AI error:', e);
      var fallback = [
        'Bagus! Tetap konsisten dan selesaikan satu tugas pada satu waktu. Kamu pasti bisa!',
        'Tips: Mulai dari tugas terkecil dulu untuk membangun momentum.',
        'Jangan lupa istirahat! Produktivitas butuh energi yang cukup.',
        'Fokus pada progres, bukan kesempurnaan. Setiap langkah kecil berarti!'
      ];
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
  },

  aiGenerateSchedule: async function (input) {
    var today = _today();
    var sys = 'Buat jadwal harian. Return HANYA JSON array: [{"task":"...","time":"HH:MM","date":"YYYY-MM-DD"}]. '
      + 'Jam 06:00-23:00, tidak overlap, beri jeda istirahat. Hari ini: ' + today;
    try {
      var res = await fetch(CONFIG.AI_URL, {
        method:'POST',
        headers:{ 'Authorization':'Bearer '+CONFIG.AI_KEY, 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:CONFIG.AI_MODEL,
          messages:[{ role:'system',content:sys },{ role:'user',content:input }],
          max_tokens:500, temperature:0.3
        })
      });
      if (!res.ok) throw new Error(res.status);
      var d = await res.json();
      var txt = (d.choices[0].message.content || '[]').replace(/```json/g,'').replace(/```/g,'').trim();
      return JSON.parse(txt);
    } catch (e) {
      console.warn('AI schedule error, using fallback:', e);
      return [
        { task:'Deep work session', time:'08:00', date:today },
        { task:'Standup meeting',   time:'09:30', date:today },
        { task:'Focus coding',      time:'10:00', date:today },
        { task:'Lunch break',       time:'12:00', date:today },
        { task:'Review & emails',   time:'13:30', date:today },
        { task:'Afternoon tasks',   time:'14:30', date:today },
        { task:'Wrap up & plan',    time:'16:30', date:today }
      ];
    }
  },

  aiInsight: async function () {
    var today = _today();
    var week = new Date(Date.now() - 7*864e5).toISOString().split('T')[0];
    var scheds = await API.getScheduleRange(week, today);
    var total = scheds.length, done = scheds.filter(function(s){return s.status==='done'}).length;
    var pct = total ? Math.round(done/total*100) : 0;
    var g = Gamification.get();
    var prompt = 'Data 7 hari: '+total+' tugas, '+done+' selesai ('+pct+'%), streak '+g.streak+' hari, level '+g.level+', XP '+g.xp+'. Beri 1 insight singkat (2-3 kalimat) yang memotivasi. Bahasa Indonesia santai.';
    return API.aiChat(prompt);
  },

  /* ===== ANALYTICS ===== */

  getWeeklyData: async function () {
    var days = [], i;
    for (i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate()-i);
      days.push(d.toISOString().split('T')[0]);
    }
    var all = await API.getScheduleRange(days[0], days[6]);
    return days.map(function (dt) {
      var ds = all.filter(function(s){return s.date===dt});
      return {
        date: dt,
        label: new Date(dt).toLocaleDateString('id-ID',{weekday:'short'}),
        total: ds.length,
        done: ds.filter(function(s){return s.status==='done'}).length
      };
    });
  },

  getMonthlyData: async function () {
    var now = new Date();
    var s = new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];
    var e = new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split('T')[0];
    return API.getScheduleRange(s,e);
  },

  getTimeDistribution: async function () {
    var today = _today();
    var ago = new Date(Date.now()-30*864e5).toISOString().split('T')[0];
    var all = await API.getScheduleRange(ago, today);
    var hrs = {};
    all.forEach(function(s){
      if(s.time){var h=parseInt(s.time.split(':')[0]);var k=String(h).padStart(2,'0')+':00';hrs[k]=(hrs[k]||0)+1;}
    });
    return Object.keys(hrs).sort().map(function(k){return{hour:k,count:hrs[k]};});
  }
};

/* Init on load */
_initSB();
