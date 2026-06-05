/* =====================================================
   © 2026 Joshua Setiawan. All rights reserved.

   TASKTIVITY — UI Rendering Components
   ===================================================== */
'use strict';

var UI = {

  /* ========== TOAST ========== */
  toast: function (msg, type) {
    type = type || 'info';
    var box = document.getElementById('toastBox'); if (!box) return;
    var icons = { success:'check_circle', error:'error', warn:'warning', info:'info' };
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<span class="material-icons-round toast-icon">' + (icons[type]||'info') + '</span>'
      + '<span class="toast-text">' + msg + '</span>'
      + '<button class="toast-x" onclick="this.parentElement.classList.add(\'out\');setTimeout(function(){this.parentElement.remove()}.bind(this),250)">'
      + '<span class="material-icons-round">close</span></button>';
    box.appendChild(t);
    setTimeout(function () { if (t.parentElement) { t.classList.add('out'); setTimeout(function(){t.remove();},250); } }, 4000);
  },

  /* ========== SCHEDULE LIST ========== */
  renderSchedule: function (list, containerId) {
    var c = document.getElementById(containerId); if (!c) return;
    if (!list || !list.length) {
      c.innerHTML = '<div class="empty"><span class="material-icons-round">event_available</span><p>Belum ada jadwal</p></div>';
      return;
    }
    c.innerHTML = list.map(function (s) {
      var isDone = s.status === 'done';
      return '<div class="sched-item" data-id="' + s.id + '">'
        + '<span class="sched-time">' + (s.time||'--:--') + '</span>'
        + '<span class="sched-task' + (isDone?' is-done':'') + '">' + _esc(s.task) + '</span>'
        + '<span class="sched-badge ' + (isDone?'done':'pending') + '">' + (isDone?'Selesai':'Belum') + '</span>'
        + '<div class="sched-actions">'
        + (isDone ? '' : '<button class="act-done" onclick="App.completeSched(\''+s.id+'\')" title="Selesai"><span class="material-icons-round">check</span></button>')
        + '<button class="act-del" onclick="App.deleteSched(\''+s.id+'\')" title="Hapus"><span class="material-icons-round">delete_outline</span></button>'
        + '</div></div>';
    }).join('');
  },

  /* ========== TASK LIST ========== */
  renderTasks: function (tasks, filter) {
    filter = filter || 'all';
    var c = document.getElementById('taskList'); if (!c) return;
    var f = tasks;
    if (filter === 'pending') f = tasks.filter(function(t){return t.status!=='done';});
    else if (filter === 'done') f = tasks.filter(function(t){return t.status==='done';});
    else if (filter === 'high') f = tasks.filter(function(t){return t.priority==='high';});

    if (!f.length) {
      c.innerHTML = '<div class="empty"><span class="material-icons-round">checklist</span><p>' +
        (filter==='all'?'Belum ada tugas':'Tidak ada tugas untuk filter ini') + '</p></div>';
      return;
    }
    c.innerHTML = f.map(function (t) {
      var isDone = t.status === 'done';
      var prioCls = t.priority === 'high' ? 'high' : (t.priority === 'low' ? 'low' : 'med');
      return '<div class="task-item' + (isDone?' is-done':'') + '" data-id="' + t.id + '">'
        + '<div class="task-check' + (isDone?' checked':'') + '" onclick="App.toggleTask(\''+t.id+'\',\''+t.status+'\')">'
        + (isDone ? '<span class="material-icons-round">check</span>' : '') + '</div>'
        + '<div class="task-body"><div class="task-title">' + _esc(t.title) + '</div>'
        + '<div class="task-meta">'
        + (t.deadline ? '<span><span class="material-icons-round">schedule</span>' + UI.fmtDate(t.deadline) + '</span>' : '')
        + '<span><span class="prio-dot '+prioCls+'"></span>' + UI.cap(t.priority||'medium') + '</span>'
        + '</div></div>'
        + '<div class="task-actions"><button class="icon-btn-sm act-del" onclick="App.deleteTaskItem(\''+t.id+'\')" title="Hapus"><span class="material-icons-round">delete_outline</span></button></div>'
        + '</div>';
    }).join('');
  },

  /* ========== CALENDAR ========== */
  calState: { cur: new Date(), sel: null },

  renderCalendar: async function () {
    var st = this.calState;
    var y = st.cur.getFullYear(), m = st.cur.getMonth();
    var mn = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    _txt('calTitle', mn[m] + ' ' + y);

    var first = new Date(y,m,1).getDay();
    var days = new Date(y,m+1,0).getDate();
    var prevDays = new Date(y,m,0).getDate();
    var start = first === 0 ? 6 : first - 1;

    // fetch month data
    var sd = new Date(y,m,1).toISOString().split('T')[0];
    var ed = new Date(y,m+1,0).toISOString().split('T')[0];
    var scheds = await API.getScheduleRange(sd, ed);
    var counts = {};
    scheds.forEach(function(s){ counts[s.date] = (counts[s.date]||0)+1; });

    var grid = document.getElementById('calGrid'); if (!grid) return;
    var hdrs = '<div class="cal-hdr">Sen</div><div class="cal-hdr">Sel</div><div class="cal-hdr">Rab</div>'
      + '<div class="cal-hdr">Kam</div><div class="cal-hdr">Jum</div><div class="cal-hdr">Sab</div><div class="cal-hdr">Min</div>';

    var cells = '';
    var today = API.getToday();

    // prev month
    for (var p = start-1; p >= 0; p--) {
      cells += '<div class="cal-cell dim"><span>' + (prevDays-p) + '</span></div>';
    }
    // current month
    for (var d = 1; d <= days; d++) {
      var ds = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      var cls = 'cal-cell';
      if (ds === today) cls += ' today';
      if (ds === st.sel) cls += ' sel';
      var cnt = counts[ds] || 0;
      var dots = cnt > 0 ? '<div class="cal-dots">' + Array(Math.min(cnt,3)).fill('<span class="cal-dot-i"></span>').join('') + '</div>' : '';
      cells += '<div class="'+cls+'" data-date="'+ds+'" onclick="UI.selectDate(\''+ds+'\')"><span>'+d+'</span>'+dots+'</div>';
    }
    // next month
    var total = start + days;
    var rem = total % 7 === 0 ? 0 : 7 - total % 7;
    for (var n = 1; n <= rem; n++) {
      cells += '<div class="cal-cell dim"><span>' + n + '</span></div>';
    }

    grid.innerHTML = hdrs + cells;
  },

  selectDate: async function (ds) {
    this.calState.sel = ds;
    await this.renderCalendar();
    var scheds = await API.getScheduleByDate(ds);
    var dt = new Date(ds).toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    _txt('calDetailTitle', dt);
    var list = document.getElementById('calDetailList');
    if (!scheds.length) {
      list.innerHTML = '<div class="empty" style="padding:16px 0"><p>Tidak ada jadwal</p></div>';
    } else {
      this.renderSchedule(scheds, 'calDetailList');
    }
  },

  calNav: function (dir) { this.calState.cur.setMonth(this.calState.cur.getMonth()+dir); this.renderCalendar(); },
  calToday: function () { this.calState.cur = new Date(); this.calState.sel = API.getToday(); this.renderCalendar(); this.selectDate(API.getToday()); },

  /* ========== CHARTS ========== */
  charts: {},

  renderWeeklyChart: async function (type) {
    type = type || 'tasks';
    var ctx = document.getElementById('weeklyChart'); if (!ctx) return;
    if (this.charts.weekly) this.charts.weekly.destroy();

    var chartOpts = {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'top', align:'end', labels:{ color:'#9ca3af', font:{family:'Inter',size:11}, usePointStyle:true, pointStyle:'circle', padding:14 } } },
      scales:{
        x:{ grid:{color:'rgba(255,255,255,.03)',drawBorder:false}, ticks:{color:'#636a80',font:{family:'Inter',size:11}} },
        y:{ grid:{color:'rgba(255,255,255,.03)',drawBorder:false}, ticks:{color:'#636a80',font:{family:'Inter',size:11}}, beginAtZero:true }
      }
    };

    if (type === 'tasks') {
      var data = await API.getWeeklyData();
      this.charts.weekly = new Chart(ctx, {
        type:'bar',
        data:{
          labels: data.map(function(d){return d.label;}),
          datasets:[
            { label:'Selesai', data:data.map(function(d){return d.done;}), backgroundColor:'rgba(124,92,252,.8)', borderRadius:5, borderSkipped:false },
            { label:'Total',   data:data.map(function(d){return d.total;}), backgroundColor:'rgba(124,92,252,.2)', borderRadius:5, borderSkipped:false }
          ]
        },
        options: chartOpts
      });
    } else {
      var xpData = Gamification.weeklyXP();
      this.charts.weekly = new Chart(ctx, {
        type:'line',
        data:{
          labels: xpData.map(function(d){return d.label;}),
          datasets:[{
            label:'XP', data:xpData.map(function(d){return d.xp;}),
            borderColor:'#7c5cfc', backgroundColor:'rgba(124,92,252,.1)',
            fill:true, tension:.4, pointBackgroundColor:'#7c5cfc', pointBorderWidth:0, pointRadius:4
          }]
        },
        options: chartOpts
      });
    }
  },

  renderAnalyticsCharts: async function () {
    var chartOpts = {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'top', align:'end', labels:{ color:'#9ca3af', font:{family:'Inter',size:11}, usePointStyle:true, padding:14 } } },
      scales:{
        x:{ grid:{color:'rgba(255,255,255,.03)',drawBorder:false}, ticks:{color:'#636a80',font:{family:'Inter',size:11}} },
        y:{ grid:{color:'rgba(255,255,255,.03)',drawBorder:false}, ticks:{color:'#636a80',font:{family:'Inter',size:11}}, beginAtZero:true }
      }
    };

    // Productivity
    var ctx1 = document.getElementById('prodChart');
    if (ctx1) {
      if (this.charts.prod) this.charts.prod.destroy();
      var wd = await API.getWeeklyData();
      this.charts.prod = new Chart(ctx1, {
        type:'line',
        data:{
          labels:wd.map(function(d){return d.label;}),
          datasets:[{ label:'Completion %', data:wd.map(function(d){return d.total?Math.round(d.done/d.total*100):0;}),
            borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,.1)',fill:true,tension:.4,pointBackgroundColor:'#22c55e',pointBorderWidth:0,pointRadius:4 }]
        },
        options:chartOpts
      });
    }

    // Distribution
    var ctx2 = document.getElementById('distChart');
    if (ctx2) {
      if (this.charts.dist) this.charts.dist.destroy();
      var md = await API.getMonthlyData();
      var doneC = md.filter(function(s){return s.status==='done';}).length;
      var pendC = md.length - doneC;
      this.charts.dist = new Chart(ctx2, {
        type:'doughnut',
        data:{
          labels:['Selesai','Belum'],
          datasets:[{ data:[doneC,pendC], backgroundColor:['#22c55e','rgba(255,255,255,.08)'], borderWidth:0, cutout:'72%' }]
        },
        options:{ responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#9ca3af',font:{family:'Inter',size:11},padding:18}}} }
      });
    }

    // Time distribution
    var ctx3 = document.getElementById('timeChart');
    if (ctx3) {
      if (this.charts.time) this.charts.time.destroy();
      var td = await API.getTimeDistribution();
      this.charts.time = new Chart(ctx3, {
        type:'bar',
        data:{
          labels:td.map(function(d){return d.hour;}),
          datasets:[{ label:'Tugas', data:td.map(function(d){return d.count;}), backgroundColor:'rgba(59,130,246,.6)', borderRadius:4, borderSkipped:false }]
        },
        options:chartOpts
      });
    }
  },

  /* ========== AI CHAT ========== */
  chatHistory: [],

  addChatMsg: function (text, type) {
    var c = document.getElementById('chatMessages'); if (!c) return;
    var w = document.getElementById('chatWelcome'); if (w) w.remove();
    var div = document.createElement('div');
    div.className = 'chat-msg ' + type;
    var icon = type === 'ai' ? 'smart_toy' : 'person';
    var content = type === 'ai' ? UI.fmtAI(text) : _esc(text);
    div.innerHTML = '<div class="chat-ava"><span class="material-icons-round">' + icon + '</span></div>'
      + '<div class="chat-bubble">' + content + '</div>';
    c.appendChild(div);
    c.scrollTop = c.scrollHeight;
  },

  showTyping: function () {
    var c = document.getElementById('chatMessages'); if (!c) return;
    var div = document.createElement('div');
    div.className = 'chat-msg ai'; div.id = 'typingMsg';
    div.innerHTML = '<div class="chat-ava"><span class="material-icons-round">smart_toy</span></div>'
      + '<div class="chat-bubble"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>';
    c.appendChild(div);
    c.scrollTop = c.scrollHeight;
  },

  hideTyping: function () {
    var el = document.getElementById('typingMsg'); if (el) el.remove();
  },

  sendChat: async function (msg) {
    if (!msg.trim()) return;
    this.addChatMsg(msg, 'user');
    this.chatHistory.push({ role:'user', content:msg });
    this.showTyping();
    var reply = await API.aiChat(msg, this.chatHistory);
    this.hideTyping();
    this.addChatMsg(reply, 'ai');
    this.chatHistory.push({ role:'assistant', content:reply });
    if (this.chatHistory.length > 16) this.chatHistory = this.chatHistory.slice(-16);
  },

  /* ========== HELPERS ========== */
  fmtDate: function (d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
  },
  cap: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); },
  fmtAI: function (t) {
    var s = _esc(t);
    s = s.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
    s = s.replace(/\*(.*?)\*/g,'<em>$1</em>');
    s = s.replace(/\n/g,'<br>');
    return s;
  },
  greeting: function () {
    var h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  },
  greetEmoji: function () {
    var h = new Date().getHours();
    if (h < 6) return '\u{1F303}';
    if (h < 12) return '\u{2600}\u{FE0F}';
    if (h < 18) return '\u{1F324}\u{FE0F}';
    return '\u{1F319}';
  }
};