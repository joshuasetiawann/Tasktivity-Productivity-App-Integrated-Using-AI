/* =====================================================
   © 2026 Joshua Setiawan. All rights reserved.

   TASKTIVITY — Main Application Controller
   ===================================================== */
'use strict';

var App = {
  page: 'dashboard',
  filter: 'all',
  tasks: [],
  todayScheds: [],
  selPrio: 'medium',
  aiScheds: [],

  /* ========================================
     INIT
     ======================================== */
  init: async function () {
    console.log('%c' + CONFIG.APP_NAME + ' v' + CONFIG.VERSION, 'color:#7c5cfc;font-size:16px;font-weight:bold');
    console.log('%c' + (API.isDemo() ? 'DEMO MODE (offline)' : 'Supabase connected'), 'color:#22c55e');

    if (API.isDemo()) {
      var db = document.getElementById('dbStatus');
      if (db) { db.textContent = 'Demo'; db.className = 'integ-badge'; db.style.background = 'var(--warn-10)'; db.style.color = 'var(--warn)'; }
    }

    try {
      this.loadTheme();
      this.bind();
      this.updateDate();

      await this.loadDashboard().catch(function(e){ console.warn('Dashboard load err:', e); });

      Gamification.updateStreak();
      Gamification.updateUI();

      // Hide loader, show app
      setTimeout(function () {
        var ls = document.getElementById('loadingScreen');
        var app = document.getElementById('app');
        if (ls) ls.classList.add('out');
        if (app) app.style.display = 'flex';
        setTimeout(function () { if (ls) ls.style.display = 'none'; }, 500);
      }, 1600);

      // Non-blocking AI insight
      this.loadInsight();

    } catch (err) {
      console.error('Init error:', err);
      var ls2 = document.getElementById('loadingScreen');
      var app2 = document.getElementById('app');
      if (ls2) { ls2.classList.add('out'); setTimeout(function(){ls2.style.display='none';},500); }
      if (app2) app2.style.display = 'flex';
      UI.toast('Terjadi kesalahan, tapi app tetap berjalan.', 'warn');
    }
  },

  /* ========================================
     EVENT BINDING
     ======================================== */
  bind: function () {
    var self = this;

    /* ---- Navigation ---- */
    document.querySelectorAll('[data-page]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        self.navigate(el.getAttribute('data-page'));
      });
    });

    /* ---- Mobile menu ---- */
    var btnMenu = document.getElementById('btnMobileMenu');
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('sidebarBackdrop');
    if (btnMenu) btnMenu.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('show');
    });
    if (backdrop) backdrop.addEventListener('click', function () {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    });

    /* ---- Quick Add ---- */
    var qa = document.getElementById('btnQuickAdd');
    if (qa) qa.addEventListener('click', function () { self.openTaskModal(); });

    /* ---- Dashboard buttons ---- */
    var addSch = document.getElementById('btnAddSchedule');
    if (addSch) addSch.addEventListener('click', function () { _openModal('modalAISchedule'); });

    var refIns = document.getElementById('btnRefreshInsight');
    if (refIns) refIns.addEventListener('click', function () { self.loadInsight(); });

    /* ---- Chart tabs ---- */
    document.querySelectorAll('.tab[data-chart]').forEach(function (t) {
      t.addEventListener('click', function () {
        document.querySelectorAll('.tab[data-chart]').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        UI.renderWeeklyChart(t.getAttribute('data-chart'));
      });
    });

    /* ---- Tasks ---- */
    var btnNew = document.getElementById('btnNewTask');
    if (btnNew) btnNew.addEventListener('click', function () { self.openTaskModal(); });

    document.querySelectorAll('.filter-chip').forEach(function (f) {
      f.addEventListener('click', function () {
        document.querySelectorAll('.filter-chip').forEach(function (x) { x.classList.remove('active'); });
        f.classList.add('active');
        self.filter = f.getAttribute('data-filter');
        UI.renderTasks(self.tasks, self.filter);
      });
    });

    /* ---- Calendar ---- */
    var cp = document.getElementById('calPrev');
    var cn = document.getElementById('calNext');
    var ct = document.getElementById('calToday');
    if (cp) cp.addEventListener('click', function () { UI.calNav(-1); });
    if (cn) cn.addEventListener('click', function () { UI.calNav(1); });
    if (ct) ct.addEventListener('click', function () { UI.calToday(); });

    /* ---- AI Chat ---- */
    var chatSend = document.getElementById('btnChatSend');
    var chatIn = document.getElementById('chatInput');
    if (chatSend) chatSend.addEventListener('click', function () { self.handleChat(); });
    if (chatIn) {
      chatIn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.handleChat(); }
      });
      chatIn.addEventListener('input', function () {
        chatIn.style.height = 'auto';
        chatIn.style.height = Math.min(chatIn.scrollHeight, 110) + 'px';
      });
    }
    document.querySelectorAll('.chip[data-msg]').forEach(function (ch) {
      ch.addEventListener('click', function () {
        if (chatIn) chatIn.value = ch.getAttribute('data-msg');
        self.handleChat();
      });
    });

    /* ---- AI Schedule modal ---- */
    var btnGen = document.getElementById('btnGenerate');
    var btnApply = document.getElementById('btnApplySchedule');
    if (btnGen) btnGen.addEventListener('click', function () { self.generateAISched(); });
    if (btnApply) btnApply.addEventListener('click', function () { self.applyAISched(); });

    /* ---- Task modal ---- */
    var btnSave = document.getElementById('btnSaveTask');
    if (btnSave) btnSave.addEventListener('click', function () { self.saveTask(); });

    document.querySelectorAll('.prio-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.prio-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        self.selPrio = b.getAttribute('data-p');
      });
    });

    /* ---- Settings ---- */
    var btnProf = document.getElementById('btnSaveProfile');
    if (btnProf) btnProf.addEventListener('click', function () { self.saveProfile(); });

    document.querySelectorAll('.theme-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.theme-opt').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        self.setTheme(b.getAttribute('data-theme'));
      });
    });

    document.querySelectorAll('.color-dot').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.color-dot').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        self.setColor(b.getAttribute('data-color'));
      });
    });

    /* ---- Modal close ---- */
    document.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () {
        _closeModal(b.getAttribute('data-close'));
      });
    });
    document.querySelectorAll('.modal-overlay').forEach(function (ov) {
      ov.addEventListener('click', function (e) {
        if (e.target === ov) ov.classList.remove('open');
      });
    });

    /* ---- Keyboard ---- */
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); self.navigate('ai'); setTimeout(function(){ var ci=document.getElementById('chatInput'); if(ci) ci.focus(); },100); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); self.openTaskModal(); }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(function (m) { m.classList.remove('open'); });
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      }
    });

    /* ---- Set default date ---- */
    var fd = document.getElementById('fldTaskDate');
    if (fd) fd.value = API.getToday();
  },

  /* ========================================
     NAVIGATION
     ======================================== */
  navigate: function (pg) {
    this.page = pg;

    /* update nav links */
    document.querySelectorAll('[data-page]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-page') === pg);
    });

    /* show page */
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    var target = document.getElementById('page' + pg.charAt(0).toUpperCase() + pg.slice(1).replace(/-./g,function(m){return m[1].toUpperCase();}));
    if (!target) {
      // try simple mapping
      var map = { dashboard:'pageDashboard', tasks:'pageTasks', calendar:'pageCalendar', analytics:'pageAnalytics', ai:'pageAi', settings:'pageSettings' };
      target = document.getElementById(map[pg]);
    }
    if (target) target.classList.add('active');

    /* update topbar */
    var titles = { dashboard:'Dashboard', tasks:'Tugas', calendar:'Kalender', analytics:'Analitik', ai:'AI Assistant', settings:'Pengaturan' };
    _txt('topbarTitle', titles[pg] || pg);

    /* load page data */
    this.loadPage(pg);

    /* close mobile */
    var sb = document.getElementById('sidebar');
    var bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.remove('open');
    if (bd) bd.classList.remove('show');
  },

  loadPage: async function (pg) {
    switch (pg) {
      case 'dashboard':
        await this.loadDashboard();
        UI.renderWeeklyChart('tasks');
        break;
      case 'tasks':
        await this.loadTasks();
        break;
      case 'calendar':
        await UI.renderCalendar();
        UI.selectDate(API.getToday());
        break;
      case 'analytics':
        await this.loadAnalytics();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  },

  /* ========================================
     DASHBOARD
     ======================================== */
  loadDashboard: async function () {
    this.todayScheds = await API.getScheduleByDate(API.getToday());

    _txt('heroGreeting', UI.greeting() + ' ' + UI.greetEmoji());
    _txt('heroSub', 'Siap produktif hari ini, ' + API.getUserName() + '?');

    var total = this.todayScheds.length;
    var done = this.todayScheds.filter(function(s){return s.status==='done';}).length;
    var pend = total - done;

    _txt('heroTotal', total);
    _txt('heroDone', done);
    _txt('heroPending', pend);
    _txt('statRate', (total ? Math.round(done/total*100) : 0) + '%');

    var badge = document.getElementById('navTaskCount');
    if (badge) {
      if (pend > 0) { badge.textContent = pend; badge.style.display = 'block'; }
      else { badge.style.display = 'none'; }
    }

    UI.renderSchedule(this.todayScheds, 'todayScheduleList');
  },

  loadInsight: async function () {
    var box = document.getElementById('aiInsightBox');
    if (!box) return;
    box.innerHTML = '<div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><p class="typing-text">AI sedang menganalisis...</p>';
    try {
      var insight = await API.aiInsight();
      box.innerHTML = '<p style="font-size:.88rem;line-height:1.7;color:var(--tx-2)">' + _esc(insight) + '</p>';
    } catch (e) {
      box.innerHTML = '<p style="font-size:.88rem;color:var(--tx-2)">Tetap konsisten! Setiap tugas yang selesai membawamu lebih dekat ke tujuan.</p>';
    }
  },

  /* ========================================
     TASKS
     ======================================== */
  loadTasks: async function () {
    this.tasks = await API.getTasks();
    UI.renderTasks(this.tasks, this.filter);
  },

  openTaskModal: function () {
    var fd = document.getElementById('fldTaskDate');
    var ft = document.getElementById('fldTaskTime');
    var fn = document.getElementById('fldTaskTitle');
    var fno = document.getElementById('fldTaskNotes');
    if (fn) fn.value = '';
    if (fd) fd.value = API.getToday();
    if (ft) ft.value = '';
    if (fno) fno.value = '';
    this.selPrio = 'medium';
    document.querySelectorAll('.prio-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-p') === 'medium'); });
    _openModal('modalTask');
    setTimeout(function () { if (fn) fn.focus(); }, 200);
  },

  saveTask: async function () {
    var title = (document.getElementById('fldTaskTitle').value || '').trim();
    var date = document.getElementById('fldTaskDate').value;
    var time = document.getElementById('fldTaskTime').value;
    if (!title) { UI.toast('Nama tugas wajib diisi!', 'warn'); return; }
    try {
      var dl = date + (time ? 'T'+time : '');
      await API.addTask(title, dl, this.selPrio);
      if (date && time) await API.addSchedule(title, time, date, 'web', 'pending');
      _closeModal('modalTask');
      UI.toast('Tugas ditambahkan!', 'success');
      await this.loadTasks();
      await this.loadDashboard();
    } catch (e) { UI.toast('Gagal menambah tugas.', 'error'); }
  },

  toggleTask: async function (id, cur) {
    var ns = cur === 'done' ? 'pending' : 'done';
    try {
      await API.updateTaskStatus(id, ns);
      if (ns === 'done') { Gamification.onTaskDone(); UI.toast('Tugas selesai! +10 XP', 'success'); }
      await this.loadTasks();
      await this.loadDashboard();
    } catch (e) { UI.toast('Gagal update tugas.', 'error'); }
  },

  deleteTaskItem: async function (id) {
    if (!confirm('Hapus tugas ini?')) return;
    try { await API.deleteTask(id); UI.toast('Tugas dihapus.', 'info'); await this.loadTasks(); }
    catch (e) { UI.toast('Gagal hapus.', 'error'); }
  },

  /* ========================================
     SCHEDULE
     ======================================== */
  completeSched: async function (id) {
    try {
      await API.updateScheduleStatus(id, 'done');
      Gamification.onTaskDone();
      UI.toast('Selesai! +10 XP', 'success');
      await this.loadDashboard();
    } catch (e) { UI.toast('Gagal update.', 'error'); }
  },

  deleteSched: async function (id) {
    if (!confirm('Hapus jadwal ini?')) return;
    try { await API.deleteSchedule(id); UI.toast('Jadwal dihapus.', 'info'); await this.loadDashboard(); }
    catch (e) { UI.toast('Gagal hapus.', 'error'); }
  },

  generateAISched: async function () {
    var input = (document.getElementById('fldAIInput').value || '').trim();
    if (!input) { UI.toast('Tulis rencana kamu dulu!', 'warn'); return; }
    var btn = document.getElementById('btnGenerate');
    btn.innerHTML = '<span class="material-icons-round" style="animation:lspin 1s linear infinite">autorenew</span>Generating...';
    btn.disabled = true;
    try {
      var scheds = await API.aiGenerateSchedule(input);
      if (!scheds.length) { UI.toast('AI tidak bisa membuat jadwal. Coba lebih detail.', 'warn'); return; }
      this.aiScheds = scheds;
      var res = document.getElementById('aiScheduleResult');
      res.style.display = 'block';
      res.innerHTML = '<h4>Jadwal yang disarankan:</h4>' + scheds.map(function(s){
        return '<div class="sched-item"><span class="sched-time">' + s.time + '</span><span class="sched-task">' + _esc(s.task) + '</span></div>';
      }).join('');
      document.getElementById('btnApplySchedule').style.display = 'inline-flex';
    } catch (e) { UI.toast('Gagal generate.', 'error'); }
    finally { btn.innerHTML = '<span class="material-icons-round">auto_awesome</span>Generate'; btn.disabled = false; }
  },

  applyAISched: async function () {
    if (!this.aiScheds.length) return;
    var btn = document.getElementById('btnApplySchedule');
    btn.innerHTML = '<span class="material-icons-round" style="animation:lspin 1s linear infinite">autorenew</span>Menyimpan...';
    btn.disabled = true;
    try {
      for (var i = 0; i < this.aiScheds.length; i++) {
        var s = this.aiScheds[i];
        await API.addSchedule(s.task, s.time, s.date || API.getToday(), 'ai', 'pending');
      }
      Gamification.onAISched(this.aiScheds.length);
      UI.toast(this.aiScheds.length + ' jadwal diterapkan!', 'success');
      _closeModal('modalAISchedule');
      await this.loadDashboard();
      UI.renderWeeklyChart('tasks');
    } catch (e) { UI.toast('Gagal simpan.', 'error'); }
    finally { btn.innerHTML = '<span class="material-icons-round">check</span>Terapkan'; btn.disabled = false; }
  },

  /* ========================================
     AI CHAT
     ======================================== */
  handleChat: function () {
    var inp = document.getElementById('chatInput');
    var msg = (inp.value || '').trim();
    if (!msg) return;
    inp.value = '';
    inp.style.height = 'auto';
    UI.sendChat(msg);
  },

  /* ========================================
     ANALYTICS
     ======================================== */
  loadAnalytics: async function () {
    await UI.renderAnalyticsCharts();
    var wd = await API.getWeeklyData();
    var total = wd.reduce(function(a,d){return a+d.total;},0);
    var done = wd.reduce(function(a,d){return a+d.done;},0);
    var pct = total ? Math.round(done/total*100) : 0;
    var g = Gamification.get();
    _txt('sumTotal', total);
    _txt('sumRate', pct + '%');
    _txt('sumAvg', (total/7).toFixed(1));
    _txt('sumStreak', g.bestStreak + ' hari');
  },

  /* ========================================
     SETTINGS
     ======================================== */
  loadSettings: function () {
    var n = document.getElementById('setName');
    var c = document.getElementById('setChatId');
    if (n) n.value = API.getUserName();
    if (c) c.value = API.getChatId();
    var theme = localStorage.getItem('tv_theme') || 'dark';
    document.querySelectorAll('.theme-opt').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-theme') === theme); });
    var color = localStorage.getItem('tv_color') || '#7c5cfc';
    document.querySelectorAll('.color-dot').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-color') === color); });
  },

  saveProfile: function () {
    var n = (document.getElementById('setName').value || '').trim();
    var c = (document.getElementById('setChatId').value || '').trim();
    if (n) API.setUserName(n);
    if (c) API.setChatId(c);
    Gamification.updateUI();
    UI.toast('Profil disimpan!', 'success');
  },

  setTheme: function (t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('tv_theme', t);
  },

  loadTheme: function () {
    var t = localStorage.getItem('tv_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    var c = localStorage.getItem('tv_color');
    if (c) this.setColor(c);
  },

  setColor: function (hex) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    document.documentElement.style.setProperty('--accent', hex);
    document.documentElement.style.setProperty('--accent-10', 'rgba('+r+','+g+','+b+',.10)');
    document.documentElement.style.setProperty('--accent-20', 'rgba('+r+','+g+','+b+',.20)');
    document.documentElement.style.setProperty('--accent-glow', '0 0 24px rgba('+r+','+g+','+b+',.35)');
    // darker hover
    var rh=Math.max(0,r-20),gh=Math.max(0,g-20),bh=Math.max(0,b-20);
    document.documentElement.style.setProperty('--accent-h', 'rgb('+rh+','+gh+','+bh+')');
    localStorage.setItem('tv_color', hex);
  },

  /* ========================================
     HELPERS
     ======================================== */
  updateDate: function () {
    _txt('topbarDate', new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
  }
};

/* ========================================
   BOOT
   ======================================== */
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
