/* =====================================================
   © 2026 Joshua Setiawan. All rights reserved.

   TASKTIVITY — Gamification (XP / Level / Streak)
   ===================================================== */
'use strict';

var Gamification = {
  KEY: 'tv_gam',

  defaults: function () {
    return {
      xp:0, level:1, streak:0, bestStreak:0,
      lastDate:null, todayDone:0, todayXP:0, todayDate:null,
      total:0, history:[]
    };
  },

  /* ---- persistence ---- */
  get: function () {
    try {
      var s = JSON.parse(localStorage.getItem(this.KEY));
      if (s) {
        var td = API.getToday();
        if (s.todayDate !== td) { s.todayDone = 0; s.todayXP = 0; s.todayDate = td; this.save(s); }
        var d = this.defaults(); for (var k in d) { if (!(k in s)) s[k] = d[k]; }
        return s;
      }
    } catch (e) {}
    return this.defaults();
  },
  save: function (s) { try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch(e){} },

  /* ---- xp / level math ---- */
  xpForLevel: function (lv) { return Math.floor(CONFIG.LVL_BASE * Math.pow(CONFIG.LVL_MULT, lv - 1)); },
  totalXPFor: function (lv) { var t=0; for(var i=1;i<=lv;i++) t+=this.xpForLevel(i); return t; },
  progress: function (s) {
    var need = this.xpForLevel(s.level);
    var cur  = s.xp - this.totalXPFor(s.level - 1);
    return { cur: Math.max(0,cur), need: need, pct: Math.min(100, Math.max(0, cur/need*100)) };
  },

  /* ---- actions ---- */
  addXP: function (amt) {
    var s = this.get();
    var oldLv = s.level;
    s.xp += amt;
    s.todayXP += amt;
    while (s.xp >= this.totalXPFor(s.level)) s.level++;
    this.save(s);
    this._showXP(amt);
    if (s.level > oldLv) setTimeout(function(){ Gamification._showLevelUp(s.level); }, 700);
    this.updateUI(s);
    return s;
  },

  updateStreak: function () {
    var s = this.get();
    var td = API.getToday();
    var yd = new Date(Date.now()-864e5).toISOString().split('T')[0];
    if (s.lastDate === td) return s;
    if (s.lastDate === yd) { s.streak++; } else if (s.lastDate !== td) { s.streak = 1; }
    s.lastDate = td;
    if (s.streak > s.bestStreak) s.bestStreak = s.streak;
    if (s.streak > 1) { var b = CONFIG.XP_STREAK * Math.min(s.streak,10); s.xp+=b; s.todayXP+=b; }
    this.save(s); this.updateUI(s);
    return s;
  },

  onTaskDone: function () {
    var s = this.get();
    s.total++; s.todayDone++;
    var td = API.getToday();
    var h = s.history.find(function(x){return x.d===td;});
    if (h) { h.t++; h.x+=CONFIG.XP_TASK; } else { s.history.push({d:td,t:1,x:CONFIG.XP_TASK}); }
    if (s.history.length > 30) s.history = s.history.slice(-30);
    this.save(s);
    this.addXP(CONFIG.XP_TASK);
    this.updateStreak();
    return s;
  },

  onAISched: function (count) { this.addXP(CONFIG.XP_AI_SCHED * count); },

  /* ---- UI ---- */
  updateUI: function (s) {
    if (!s) s = this.get();
    var p = this.progress(s);
    _txt('sidebarLevel', 'Lv ' + s.level);
    _txt('sidebarStreak', s.streak);
    _txt('statXP', _fnum(s.xp));
    _txt('statStreak', s.streak);
    _txt('statLevel', s.level);
    _txt('sidebarName', API.getUserName());
    var bar = document.getElementById('sidebarXPBar');
    if (bar) bar.style.width = p.pct + '%';
  },

  weeklyXP: function () {
    var s = this.get();
    var out = [];
    for (var i=6; i>=0; i--) {
      var d = new Date(); d.setDate(d.getDate()-i);
      var ds = d.toISOString().split('T')[0];
      var h = s.history.find(function(x){return x.d===ds;});
      out.push({ date:ds, label:d.toLocaleDateString('id-ID',{weekday:'short'}), xp:h?h.x:0, tasks:h?h.t:0 });
    }
    return out;
  },

  /* ---- popups ---- */
  _showXP: function (amt) {
    var el = document.getElementById('xpPopup');
    var txt = document.getElementById('xpPopupText');
    if (!el||!txt) return;
    txt.textContent = '+' + amt + ' XP';
    el.style.display = 'flex';
    el.classList.remove('go');
    void el.offsetWidth;
    el.classList.add('go');
    setTimeout(function(){ el.style.display='none'; el.classList.remove('go'); }, 900);
  },

  _showLevelUp: function (lv) {
    _txt('levelUpNum', 'Level ' + lv);
    _openModal('modalLevelUp');
  }
};

/* tiny helpers (used by gamification & ui) */
function _txt (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
function _fnum (n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n); }
function _esc (s) { var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function _openModal (id) { var m=document.getElementById(id); if(m) m.classList.add('open'); }
function _closeModal (id) { var m=document.getElementById(id); if(m) m.classList.remove('open'); }
