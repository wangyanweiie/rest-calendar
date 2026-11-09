/**
 * <rest-calendar> —— 「上二休三」排班日历 Web Component
 * 无依赖、Shadow DOM 隔离、可配置循环规则 / 日期范围 / 法定节假日。
 *
 * 属性：
 *   start        起始日期 YYYY-MM-DD
 *   end          截止日期 YYYY-MM-DD
 *   cycle-start  循环第一天（默认 = start）
 *   work-days    每周期上班天数（默认 2）
 *   rest-days    每周期休息天数（默认 3）
 *   week-start   一周起始 0=周日 1=周一（默认 1）
 *   show-holidays 是否标注法定节假日 true/false（默认 true）
 *   month        初始显示月份 YYYY-MM（可选）
 *
 * 事件：
 *   calendar-ready  组件渲染完成
 *   month-change    月份切换 {year, month}
 *   day-click       点击某天   {iso, ...dayInfo}
 *
 * 方法：
 *   getDayInfo(iso)  单日信息
 *   getDays()        范围内逐日信息数组
 *   getSummary()     统计
 *   setHolidays(map) 注入自定义节假日
 *   getNote(iso) / setNote(iso, text) / removeNote(iso) / getNotes()  日期备注（localStorage）
 *   setRange(start, end)
 *   goToMonth(y, m)
 *   buildICS()       生成 .ics 文本
 */
(function () {
  'use strict';

  var DAY = 86400000;
  var WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];
  var WEEK_LABEL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  /* ---------------- 法定节假日数据 ---------------- */
  /* 依据《国务院办公厅关于 2027 年部分节假日安排的通知》（2026-11-05）
     法定节假日共 13 天（《全国年节及纪念日放假办法》口径） */
  var DEFAULT_HOLIDAYS = {
    /* ===== 2026 年（《国务院办公厅关于 2026 年部分节假日安排的通知》国办发明电〔2025〕7 号）===== */
    /* 中秋：9/25（周五）–9/27（周日），9/25 为法定节假日 */
    '2026-09-25': { name: '中秋', festival: '中秋', type: 'statutory' },
    /* 国庆：10/1（周四）–10/7（周三）7 天，法定 3 天（10/1–10/3），10/10（周六）上班 */
    '2026-10-01': { name: '国庆', festival: '国庆', type: 'statutory' },
    '2026-10-02': { name: '国庆', festival: '国庆', type: 'statutory' },
    '2026-10-03': { name: '国庆', festival: '国庆', type: 'statutory' },
    '2026-10-05': { name: '假期', festival: '国庆', type: 'adjusted' },
    '2026-10-06': { name: '假期', festival: '国庆', type: 'adjusted' },
    '2026-10-07': { name: '假期', festival: '国庆', type: 'adjusted' },
    /* ===== 2027 年（《国务院办公厅关于 2027 年部分节假日安排的通知》2026-11-05）===== */
    /* —— 元旦：1/1（周五）–1/3（周日），仅 1/1 为法定节假日 —— */
    '2027-01-01': { name: '元旦', festival: '元旦', type: 'statutory' },
    /* —— 春节：2/5（除夕）–2/13（初八）9 天，法定 4 天（除夕~初三）—— */
    '2027-02-05': { name: '除夕', festival: '春节', type: 'statutory' },
    '2027-02-06': { name: '春节', festival: '春节', type: 'statutory' },
    '2027-02-07': { name: '初二', festival: '春节', type: 'statutory' },
    '2027-02-08': { name: '初三', festival: '春节', type: 'statutory' },
    '2027-02-09': { name: '初四', festival: '春节', type: 'adjusted' },
    '2027-02-10': { name: '初五', festival: '春节', type: 'adjusted' },
    '2027-02-11': { name: '初六', festival: '春节', type: 'adjusted' },
    '2027-02-12': { name: '初七', festival: '春节', type: 'adjusted' },
    '2027-02-13': { name: '初八', festival: '春节', type: 'adjusted' },
    /* —— 清明：4/3（周六）–4/5（周一），清明当日 4/5 为法定节假日 —— */
    '2027-04-05': { name: '清明', festival: '清明', type: 'statutory' },
    /* —— 劳动节：5/1（周六）–5/5（周三）5 天，法定 2 天（5/1、5/2）—— */
    '2027-05-01': { name: '劳动节', festival: '劳动节', type: 'statutory' },
    '2027-05-02': { name: '劳动节', festival: '劳动节', type: 'statutory' },
    '2027-05-03': { name: '假期', festival: '劳动节', type: 'adjusted' },
    '2027-05-04': { name: '假期', festival: '劳动节', type: 'adjusted' },
    '2027-05-05': { name: '假期', festival: '劳动节', type: 'adjusted' },
    /* —— 端午：6/9（周三）—— */
    '2027-06-09': { name: '端午', festival: '端午', type: 'statutory' },
    /* —— 中秋：9/15（周三）—— */
    '2027-09-15': { name: '中秋', festival: '中秋', type: 'statutory' },
    /* —— 国庆：10/1（周五）–10/7（周四）7 天，法定 3 天（10/1–10/3）—— */
    '2027-10-01': { name: '国庆', festival: '国庆', type: 'statutory' },
    '2027-10-02': { name: '国庆', festival: '国庆', type: 'statutory' },
    '2027-10-03': { name: '国庆', festival: '国庆', type: 'statutory' },
    '2027-10-04': { name: '假期', festival: '国庆', type: 'adjusted' },
    '2027-10-05': { name: '假期', festival: '国庆', type: 'adjusted' },
    '2027-10-06': { name: '假期', festival: '国庆', type: 'adjusted' },
    '2027-10-07': { name: '假期', festival: '国庆', type: 'adjusted' }
  };
  /* 官方假期区间（含周末，用于统计「假期共 N 天」与节假日总览） */
  var DEFAULT_SPANS = [
    { festival: '中秋', start: '2026-09-25', end: '2026-09-27' },
    { festival: '国庆', start: '2026-10-01', end: '2026-10-07' },
    { festival: '元旦', start: '2027-01-01', end: '2027-01-03' },
    { festival: '春节', start: '2027-02-05', end: '2027-02-13' },
    { festival: '清明', start: '2027-04-03', end: '2027-04-05' },
    { festival: '劳动节', start: '2027-05-01', end: '2027-05-05' },
    { festival: '端午', start: '2027-06-09', end: '2027-06-09' },
    { festival: '中秋', start: '2027-09-15', end: '2027-09-15' },
    { festival: '国庆', start: '2027-10-01', end: '2027-10-07' }
  ];

  /* 调休上班日 */
  var DEFAULT_MAKEUP = {
    '2026-09-20': '国庆调休',
    '2026-10-10': '国庆调休',
    '2027-01-31': '春节调休',
    '2027-02-14': '春节调休',
    '2027-05-08': '劳动节调休',
    '2027-09-26': '国庆调休',
    '2027-10-09': '国庆调休'
  };

  /* ---------------- 日期工具（UTC 计算，避免时区偏移） ---------------- */
  function parseISO(s) {
    var p = String(s).split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  }
  function toISO(dt) {
    var m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
    return dt.getUTCFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d);
  }
  function addDays(dt, n) { return new Date(dt.getTime() + n * DAY); }
  function diffDays(a, b) { return Math.round((a - b) / DAY); }
  function isWeekend(dt) { var w = dt.getUTCDay(); return w === 0 || w === 6; }
  function clampISO(s, fallback) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(s)) ? s : fallback;
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var STYLE = `
    :host {
      display: block;
      --rc-brand: #1e3a8a;
      --rc-rest: #e8f1fe;
      --rc-rest-text: #1d4ed8;
      --rc-red: #ef4444;
      --rc-gold: #b45309;
      --rc-gold-soft: #fef3c7;
      --rc-line: #e7ecf3;
      --rc-ink: #0f172a;
      --rc-muted: #94a3b8;
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, -apple-system, sans-serif;
      color: var(--rc-ink);
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
    * { box-sizing: border-box; }
    .wrap {
      background: #fff;
      border: 1px solid var(--rc-line);
      border-radius: 20px;
      padding: 18px 18px 14px;
      box-shadow: 0 18px 40px -24px rgba(15, 23, 42, .35);
    }
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 14px;
    }
    .title { font-size: 17px; font-weight: 700; letter-spacing: .01em; }
    .title small { display: block; font-size: 11px; font-weight: 500; color: var(--rc-muted); margin-top: 3px; }
    .nav { display: flex; gap: 8px; }
    .nav-btn {
      width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--rc-line);
      background: #fff; color: #475569; cursor: pointer; font-size: 14px; line-height: 1;
      transition: background .15s, color .15s, border-color .15s;
    }
    .nav-btn:hover:not(:disabled) { background: #f1f5f9; color: var(--rc-brand); border-color: #cbd5e1; }
    .nav-btn:disabled { opacity: .3; cursor: not-allowed; }

    .weekhead {
      display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px;
    }
    .weekhead span {
      text-align: center; font-size: 12px; font-weight: 600; color: #94a3b8;
      padding: 2px 0; letter-spacing: .08em;
    }
    .weekhead span.we { color: #f87171; }

    .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }

    .cell {
      position: relative; min-height: 88px; min-width: 0; padding: 7px 8px 6px;
      border: 1px solid var(--rc-line); border-radius: 12px; background: #fff;
      display: flex; flex-direction: column; gap: 2px;
      font: inherit; text-align: left; cursor: pointer; overflow: hidden; touch-action: manipulation;
      transition: transform .12s ease, box-shadow .12s ease;
    }
    .cell:hover { transform: translateY(-1px); box-shadow: 0 8px 18px -10px rgba(15, 23, 42, .45); }
    .cell:focus-visible { outline: 2px solid var(--rc-brand); outline-offset: 2px; }

    .row-top {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 4px; min-width: 0;
    }
    .num {
      font-size: 15px; font-weight: 700; line-height: 1.1;
      font-variant-numeric: tabular-nums; flex: 0 0 auto;
    }
    .tag {
      font-size: 10px; font-weight: 700; line-height: 1; padding: 3px 5px; border-radius: 6px;
      letter-spacing: .04em; white-space: nowrap; flex: 0 1 auto;
      overflow: hidden; text-overflow: ellipsis;
    }
    .tag-holiday { background: var(--rc-gold-soft); color: var(--rc-gold); border: 1px solid #fcd34d; }
    .tag-holiday .tag-s { display: none; }
    .tag-makeup { background: #1e293b; color: #fff; }

    .row-bot {
      margin-top: auto; display: flex; align-items: center;
      justify-content: space-between; gap: 4px; min-width: 0;
    }
    .chip {
      font-size: 10px; font-weight: 700; line-height: 1; padding: 3px 6px; border-radius: 999px;
      background: #f1f5f9; color: #64748b; white-space: nowrap; flex: 0 0 auto;
    }
    .hol-name {
      font-size: 10px; font-weight: 700; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }

    /* --- 状态配色 --- */
    .cell.is-work { background: #fff; }
    .cell.is-work .num { color: #475569; }
    .cell.is-work .chip { background: #eef2f7; color: #64748b; }

    .cell.is-rest { background: var(--rc-rest); border-color: #cfdffb; }
    .cell.is-rest .num { color: var(--rc-rest-text); }
    .cell.is-rest .chip { background: #dbeafe; color: #1d4ed8; }

    .cell.is-rest.is-weekend {
      background: linear-gradient(160deg, #f43f5e 0%, #ef4444 55%, #dc2626 100%);
      border-color: #dc2626;
      box-shadow: 0 10px 20px -14px rgba(220, 38, 38, .9);
    }
    .cell.is-rest.is-weekend .num { color: #fff; }
    .cell.is-rest.is-weekend .chip { background: rgba(255, 255, 255, .92); color: #b91c1c; }
    .cell.is-rest.is-weekend .hol-name { color: #fff; }
    .cell.is-rest.is-weekend .tag-holiday { background: #fff7ed; color: #b91c1c; border-color: #fecaca; }

    .cell .hol-name { color: var(--rc-gold); }
    .cell.is-weekend:not(.is-rest) .hol-name { color: var(--rc-gold); }

    .cell.is-today { outline: 2px solid var(--rc-brand); outline-offset: -2px; }
    .cell.is-out { background: #f8fafc; border-style: dashed; border-color: #eef2f7; cursor: default; }
    .cell.is-out:hover { transform: none; box-shadow: none; }
    .cell.is-out .num, .cell.is-out .chip, .cell.is-out .hol-name { color: #cbd5e1; }
    .cell.is-out .chip { background: transparent; }

    .legend {
      display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 14px; padding-top: 12px;
      border-top: 1px dashed var(--rc-line);
    }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #64748b; }
    .swatch { width: 14px; height: 14px; border-radius: 4px; border: 1px solid var(--rc-line); }
    .sw-rest { background: var(--rc-rest); border-color: #cfdffb; }
    .sw-red { background: linear-gradient(160deg, #f43f5e, #dc2626); border-color: #dc2626; }
    .sw-work { background: #fff; }
    .sw-holiday { background: var(--rc-gold-soft); border-color: #fcd34d; }
    .sw-makeup { background: #1e293b; border-color: #1e293b; }
    .sw-note { background: #ecfdf5; border-color: #22c55e; }

    /* ---- 备注 ---- */
    .cell.has-note { box-shadow: inset 0 0 0 2px #22c55e; }
    .cell.is-rest.is-weekend.has-note {
      box-shadow: inset 0 0 0 2px #bbf7d0, 0 10px 20px -14px rgba(220, 38, 38, .9);
    }
    .note-text {
      flex: 1 1 auto; min-width: 0; margin-left: 4px;
      font-size: 9.5px; line-height: 1.25; font-weight: 700; text-align: left;
      color: #15803d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .cell.is-rest.is-weekend .note-text { color: #fff; opacity: .95; }

    /* ---- 备注弹层 ---- */
    .note-mask {
      position: fixed; inset: 0; z-index: 9999; padding: 20px; overscroll-behavior: contain;
      background: rgba(15, 23, 42, .42);
      display: flex; align-items: center; justify-content: center;
    }
    .note-mask[hidden] { display: none; }
    .note-card {
      width: min(420px, 100%); background: #fff; border-radius: 16px; padding: 18px;
      box-shadow: 0 24px 60px -20px rgba(15, 23, 42, .5);
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif;
    }
    .note-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
    .note-title { font-size: 14px; font-weight: 700; color: #0f172a; }
    .note-sub { font-size: 11.5px; color: #94a3b8; white-space: nowrap; }
    .note-input {
      width: 100%; min-height: 88px; resize: vertical; box-sizing: border-box;
      border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;
      font: inherit; font-size: 16px; color: #0f172a; outline: none;
    }
    .note-input:focus { border-color: #86efac; box-shadow: 0 0 0 3px #dcfce7; }
    .note-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
    .note-btn {
      font: inherit; font-size: 12.5px; font-weight: 600; padding: 8px 14px;
      border-radius: 9px; border: 1px solid #e2e8f0; background: #fff; color: #334155;
      cursor: pointer; transition: background .15s, border-color .15s, color .15s;
    }
    .note-btn:hover { background: #f8fafc; }
    .note-btn.primary { background: #16a34a; border-color: #16a34a; color: #fff; }
    .note-btn.primary:hover { background: #15803d; }
    .note-btn.danger { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
    .note-btn.danger.confirming { background: #dc2626; border-color: #dc2626; color: #fff; }
    .note-btn[hidden] { display: none; }

    @media (max-width: 640px) {
      .wrap { padding: 14px 10px 10px; border-radius: 16px; }
      .cell { min-height: 64px; padding: 5px 5px 4px; border-radius: 10px; }
      .grid, .weekhead { gap: 4px; }
      .num { font-size: 13px; }
      .tag { font-size: 9px; padding: 2px 4px; }
      .chip { font-size: 9px; padding: 2px 5px; }
      .hol-name { font-size: 9px; }
      .title { font-size: 15px; }
      .tag-holiday .tag-l { display: none; }
      .tag-holiday .tag-s { display: inline; }
      /* 窄屏：底色已表达上班/休息，隐藏冗余 chip，把空间让给节日名 */
      .cell .chip { display: none; }
      .cell .hol-name { font-size: 10px; }
    }
  `;

  class RestCalendar extends HTMLElement {
    static get observedAttributes() {
      return ['start', 'end', 'cycle-start', 'work-days', 'rest-days', 'week-start',
              'show-holidays', 'month', 'notes-enabled', 'storage-key'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.holidays = Object.assign({}, DEFAULT_HOLIDAYS);
      this.makeup = Object.assign({}, DEFAULT_MAKEUP);
      this.spans = DEFAULT_SPANS.map(function (x) { return Object.assign({}, x); });
      this._month = null;
      this._ready = false;
      this._notes = {};
      this._notesLoaded = false;
      this._activeNote = null;
    }

    /* ---------- 配置 ---------- */
    get start() { return clampISO(this.getAttribute('start'), this._todayISO()); }
    get end() { return clampISO(this.getAttribute('end'), '2027-12-31'); }
    get cycleStart() { return clampISO(this.getAttribute('cycle-start'), this.start); }
    get workDays() { var n = parseInt(this.getAttribute('work-days'), 10); return isFinite(n) && n > 0 ? n : 2; }
    get restDays() { var n = parseInt(this.getAttribute('rest-days'), 10); return isFinite(n) && n >= 0 ? n : 3; }
    get weekStart() { return this.getAttribute('week-start') === '0' ? 0 : 1; }
    get showHolidays() { return this.getAttribute('show-holidays') !== 'false'; }
    get period() { return this.workDays + this.restDays; }
    get notesEnabled() { return this.getAttribute('notes-enabled') !== 'false'; }

    /* 窄屏（手机）判定：备注在格子里只保留前 2 个字 */
    _isNarrow() {
      try { return window.matchMedia('(max-width: 640px)').matches; } catch (e) { return false; }
    }
    get storageKey() { return this.getAttribute('storage-key') || 'rest-calendar-notes-v1'; }

    _todayISO() {
      var n = new Date();
      return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
    }

    /* ---------- 生命周期 ---------- */
    connectedCallback() {
      this._narrow = this._isNarrow();
      if (!this._resizeBound) {
        this._resizeBound = true;
        var self0 = this;
        window.addEventListener('resize', function () {
          var n = self0._isNarrow();
          if (n !== self0._narrow) { self0._narrow = n; self0._render(); }
        });
      }
      this._loadNotes();
      /* 多标签页同步：其它标签页改动备注时刷新本页 */
      if (!this._storageBound) {
        this._storageBound = true;
        var self = this;
        window.addEventListener('storage', function (e) {
          if (e.key && e.key === self.storageKey) {
            self._notesLoaded = false;
            self._loadNotes();
            self._render();
          }
        });
      }
      this._render();
      if (!this._ready) {
        this._ready = true;
        this.dispatchEvent(new CustomEvent('calendar-ready', { bubbles: true, composed: true }));
      }
    }

    attributeChangedCallback(name, oldV, newV) {
      if (oldV === newV || !this.shadowRoot) return;
      if (name === 'month') this._month = null;
      if (this.isConnected) this._render();
    }

    /* ---------- 备注（localStorage）---------- */
    _loadNotes() {
      if (this._notesLoaded) return;
      this._notesLoaded = true;
      try {
        var raw = localStorage.getItem(this.storageKey);
        var data = raw ? JSON.parse(raw) : {};
        this._notes = (data && typeof data === 'object') ? data : {};
      } catch (e) { this._notes = {}; }
    }

    _saveNotes() {
      try { localStorage.setItem(this.storageKey, JSON.stringify(this._notes)); } catch (e) {}
    }

    getNote(iso) { this._loadNotes(); return this._notes[iso] || ''; }
    getNotes() { this._loadNotes(); return Object.assign({}, this._notes); }

    setNote(iso, text) {
      var v = String(text == null ? '' : text).trim();
      if (!v) { this.removeNote(iso); return ''; }
      this._loadNotes();
      this._notes[iso] = v;
      this._saveNotes();
      this._render();
      this.dispatchEvent(new CustomEvent('notes-changed', {
        detail: { iso: iso, note: v, notes: this.getNotes() }, bubbles: true, composed: true
      }));
      return v;
    }

    removeNote(iso) {
      this._loadNotes();
      if (!this._notes[iso]) return;
      delete this._notes[iso];
      this._saveNotes();
      this._render();
      this.dispatchEvent(new CustomEvent('notes-changed', {
        detail: { iso: iso, note: '', notes: this.getNotes() }, bubbles: true, composed: true
      }));
    }

    /* ---------- 数据 ---------- */
    getDayInfo(iso) {
      var dt = parseISO(iso);
      var cycleStart = parseISO(this.cycleStart);
      var pos = ((diffDays(dt, cycleStart) % this.period) + this.period) % this.period;
      var cycle = pos < this.workDays ? 'work' : 'rest';
      var weekend = isWeekend(dt);
      var holiday = (this.showHolidays && this.holidays[iso]) || null;
      var makeup = (this.showHolidays && this.makeup[iso]) || null;
      var startDt = parseISO(this.start), endDt = parseISO(this.end);
      return {
        iso: iso,
        date: dt,
        year: dt.getUTCFullYear(),
        month: dt.getUTCMonth() + 1,
        day: dt.getUTCDate(),
        weekday: dt.getUTCDay(),
        weekdayLabel: WEEK_LABEL[dt.getUTCDay()],
        weekend: weekend,
        cycle: cycle,
        cycleIndex: pos + 1,
        isWork: cycle === 'work',
        isRest: cycle === 'rest',
        restOnWeekend: cycle === 'rest' && weekend,
        holiday: holiday,
        isStatutory: !!holiday && holiday.type === 'statutory',
        makeup: makeup,
        note: this.getNote(iso),
        inRange: dt >= startDt && dt <= endDt
      };
    }

    getDays() {
      var out = [], d = parseISO(this.start), endDt = parseISO(this.end);
      var guard = 0;
      while (d <= endDt && guard++ < 4000) {
        out.push(this.getDayInfo(toISO(d)));
        d = addDays(d, 1);
      }
      return out;
    }

    getSummary() {
      var days = this.getDays();
      var s = {
        total: days.length,
        work: 0,
        rest: 0,
        redOnWeekend: 0,
        weekendWork: 0,
        statutoryDays: 0,
        holidayDays: 0,
        holidayPeriodDays: 0,
        makeupDays: 0,
        redDates: []
      };
      days.forEach(function (d) {
        if (d.isWork) { s.work++; if (d.weekend) s.weekendWork++; } else { s.rest++; }
        if (d.restOnWeekend) { s.redOnWeekend++; s.redDates.push(d.iso); }
        if (d.isStatutory) s.statutoryDays++;
        if (d.holiday) s.holidayDays++;
        if (d.makeup) s.makeupDays++;
      });
      s.holidayPeriodDays = this.getHolidayPeriods().reduce(function (n, p) { return n + p.days; }, 0);
      return s;
    }

    /** 官方假期区间（按当前显示范围裁剪） */
    getHolidayPeriods() {
      var self = this;
      var rangeStart = parseISO(this.start), rangeEnd = parseISO(this.end);
      var out = [];
      this.spans.forEach(function (sp) {
        var a = parseISO(sp.start), b = parseISO(sp.end);
        var cs = a < rangeStart ? rangeStart : a;
        var ce = b > rangeEnd ? rangeEnd : b;
        if (ce < cs) return;
        var days = 0, stat = 0, d = cs;
        while (d <= ce) {
          days++;
          var h = self.holidays[toISO(d)];
          if (h && h.type === 'statutory') stat++;
          d = addDays(d, 1);
        }
        out.push({
          festival: sp.festival,
          start: toISO(cs), end: toISO(ce),
          days: days, statutory: stat
        });
      });
      return out;
    }

    setHolidayPeriods(list) {
      if (Array.isArray(list)) this.spans = list.map(function (x) { return Object.assign({}, x); });
      this._render();
    }

    setHolidays(map) { this.holidays = Object.assign({}, map || {}); this._render(); }
    setMakeupDays(map) { this.makeup = Object.assign({}, map || {}); this._render(); }
    setRange(start, end) {
      if (start) this.setAttribute('start', start);
      if (end) this.setAttribute('end', end);
      this._month = null;
      this._render();
    }
    goToMonth(y, m) { this._month = { y: y, m: m }; this._render(); }

    /* ---------- 渲染 ---------- */
    _monthBounds() {
      var s = parseISO(this.start), e = parseISO(this.end);
      return { first: { y: s.getUTCFullYear(), m: s.getUTCMonth() + 1 }, last: { y: e.getUTCFullYear(), m: e.getUTCMonth() + 1 } };
    }

    _ensureMonth() {
      var b = this._monthBounds();
      if (!this._month) {
        var attr = this.getAttribute('month');
        if (attr && /^\d{4}-\d{2}$/.test(attr)) {
          var p = attr.split('-');
          this._month = { y: +p[0], m: +p[1] };
        } else {
          /* 默认定位到「今天」所在月份，下面再钳制到 [首月, 末月] 区间 */
          var t = new Date();
          this._month = { y: t.getFullYear(), m: t.getMonth() + 1 };
        }
      }
      /* 范围变化后把当前月钳制回有效区间 */
      var before = this._month.y < b.first.y || (this._month.y === b.first.y && this._month.m < b.first.m);
      var after = this._month.y > b.last.y || (this._month.y === b.last.y && this._month.m > b.last.m);
      if (before) this._month = { y: b.first.y, m: b.first.m };
      if (after) this._month = { y: b.last.y, m: b.last.m };
      return this._month;
    }

    _cells(y, m) {
      var offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() - this.weekStart + 7) % 7;
      var daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
      var cells = [];
      var i;
      for (i = 0; i < offset; i++) cells.push(null);
      for (i = 1; i <= daysInMonth; i++) cells.push(toISO(new Date(Date.UTC(y, m - 1, i))));
      while (cells.length % 7 !== 0) cells.push(null);
      return cells;
    }

    _render() {
      var b = this._monthBounds();
      var cur = this._ensureMonth();
      var prevDisabled = !(cur.y > b.first.y || (cur.y === b.first.y && cur.m > b.first.m));
      var nextDisabled = !(cur.y < b.last.y || (cur.y === b.last.y && cur.m < b.last.m));

      var weekOrder = [];
      for (var i = 0; i < 7; i++) weekOrder.push((this.weekStart + i) % 7);

      var head = weekOrder.map(function (w) {
        return '<span class="' + (w === 0 || w === 6 ? 'we' : '') + '">周' + WEEK_CN[w] + '</span>';
      }).join('');

      var todayISO = this._todayISO();
      var self = this;
      var cells = this._cells(cur.y, cur.m).map(function (iso) {
        if (!iso) return '<div class="cell is-out" aria-hidden="true"></div>';
        var info = self.getDayInfo(iso);
        var cls = ['cell'];
        if (!info.inRange) cls.push('is-out');
        else cls.push(info.isWork ? 'is-work' : 'is-rest');
        if (info.isRest && info.weekend && info.inRange) cls.push('is-weekend');
        if (iso === todayISO) cls.push('is-today');
        if (info.inRange && info.note) cls.push('has-note');

        var tag = '';
        if (info.inRange) {
          if (info.makeup) tag = '<span class="tag tag-makeup">调</span>';
          else if (info.holiday) tag = '<span class="tag tag-holiday"><span class="tag-l">' +
            (info.isStatutory ? '法定' : '假日') + '</span><span class="tag-s">' +
            (info.isStatutory ? '节' : '假') + '</span></span>';
        }
        var state = !info.inRange ? '' : (info.isWork ? '班' : '休');
        /* 移动端格子内不展示备注文字（保留绿色描边标记，内容看下方详情条） */
        var noteRaw = info.inRange && info.note && !self._narrow ? info.note : '';
        var noteText = noteRaw ? escapeHTML(noteRaw) : '';
        var holName = info.inRange && info.holiday ? info.holiday.name : '';
        var label = info.weekdayLabel + ' ' + iso + ' · ' + (info.inRange ? (info.isWork ? '上班' : '休息') : '超出范围') +
          (info.holiday ? ' · ' + info.holiday.name + (info.isStatutory ? '（法定节假日）' : '（假期）') : '') +
          (info.makeup ? ' · ' + info.makeup + ' 上班' : '') +
          (info.restOnWeekend ? ' · 与周末重合' : '') +
          (info.note ? ' · 备注：' + info.note : '');

        return '<button class="' + cls.join(' ') + '" data-iso="' + iso + '" type="button" aria-label="' + label + '" title="' + label + '">' +
          '<div class="row-top"><span class="num">' + info.day + '</span>' + tag + '</div>' +
          '<div class="row-bot">' + (state ? '<span class="chip">' + state + '</span>' : '') +
          (noteText ? '<span class="note-text">' + noteText + '</span>' : '') +
          (holName ? '<span class="hol-name">' + holName + '</span>' : '') + '</div>' +
          '</button>';
      }).join('');

      this.shadowRoot.innerHTML =
        '<style>' + STYLE + '</style>' +
        '<div class="wrap">' +
          '<div class="topbar">' +
            '<div class="title">' + cur.y + ' 年 ' + cur.m + ' 月' +
              '<small>上' + this.workDays + '休' + this.restDays + ' · ' + this.start + ' → ' + this.end + '</small>' +
            '</div>' +
            '<div class="nav">' +
              '<button class="nav-btn" data-nav="-1" type="button" aria-label="上个月"' + (prevDisabled ? ' disabled' : '') + '>‹</button>' +
              '<button class="nav-btn" data-nav="1" type="button" aria-label="下个月"' + (nextDisabled ? ' disabled' : '') + '>›</button>' +
            '</div>' +
          '</div>' +
          '<div class="weekhead">' + head + '</div>' +
          '<div class="grid">' + cells + '</div>' +
          '<div class="legend">' +
            '<span class="legend-item"><span class="swatch sw-work"></span>上班</span>' +
            '<span class="legend-item"><span class="swatch sw-rest"></span>休息（工作日）</span>' +
            '<span class="legend-item"><span class="swatch sw-red"></span>休息日与周末重合（标红）</span>' +
            '<span class="legend-item"><span class="swatch sw-holiday"></span>法定节假日</span>' +
            '<span class="legend-item"><span class="swatch sw-makeup"></span>调休上班</span>' +
            '<span class="legend-item"><span class="swatch sw-note"></span>有备注</span>' +
          '</div>' +
          '<div class="note-mask" hidden>' +
            '<div class="note-card" role="dialog" aria-modal="true">' +
              '<div class="note-head"><span class="note-title"></span><span class="note-sub"></span></div>' +
              '<textarea class="note-input" rows="3" placeholder="例如：调休、换班、请假…"></textarea>' +
              '<div class="note-actions">' +
                '<button class="note-btn danger" type="button" data-act="del" hidden>删除</button>' +
                '<button class="note-btn" type="button" data-act="cancel">取消</button>' +
                '<button class="note-btn primary" type="button" data-act="save">保存</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      var root = this.shadowRoot;
      root.querySelectorAll('.nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var step = +btn.getAttribute('data-nav');
          var m = self._month.m + step, y = self._month.y;
          if (m < 1) { m = 12; y--; }
          if (m > 12) { m = 1; y++; }
          self._month = { y: y, m: m };
          self._render();
          self.dispatchEvent(new CustomEvent('month-change', { detail: self._month, bubbles: true, composed: true }));
        });
      });
      /* ---- 备注弹层 ---- */
      var mask = root.querySelector('.note-mask');
      var noteInput = root.querySelector('.note-input');
      var noteTitle = root.querySelector('.note-title');
      var noteSub = root.querySelector('.note-sub');
      var delBtn = root.querySelector('[data-act="del"]');
      var confirming = false;

      function resetDelete() {
        confirming = false;
        delBtn.textContent = '删除';
        delBtn.classList.remove('confirming');
      }

      function closeNote() {
        try {
          if (noteInput && document.activeElement === noteInput) noteInput.blur();
          noteInput.blur();
        } catch (e) {}
        mask.hidden = true;
        self._activeNote = null;
        resetDelete();
      }

      function openNote(iso) {
        if (!self.notesEnabled) return;
        var info = self.getDayInfo(iso);
        if (!info.inRange) return;
        self._activeNote = iso;
        noteTitle.textContent = iso + ' · ' + info.weekdayLabel;
        noteSub.textContent = info.isWork ? '上班日' : '休息日';
        noteInput.value = info.note || '';
        delBtn.hidden = !info.note;
        resetDelete();
        mask.hidden = false;
        setTimeout(function () { try { noteInput.focus(); } catch (e) {} }, 30);
      }

      if (mask) {
        root.querySelector('[data-act="cancel"]').addEventListener('click', closeNote);
        mask.addEventListener('click', function (e) { if (e.target === mask) closeNote(); });
        document.addEventListener('keydown', function (e) {
          if (!mask.hidden && e.key === 'Escape') closeNote();
        });

        delBtn.addEventListener('click', function () {
          var iso = self._activeNote;
          if (!iso) return;
          if (!confirming) {
            confirming = true;
            delBtn.textContent = '确认删除？';
            delBtn.classList.add('confirming');
            return;
          }
          closeNote();
          self.removeNote(iso);
        });

        root.querySelector('[data-act="save"]').addEventListener('click', function () {
          var iso = self._activeNote;
          if (!iso) return;
          var val = noteInput.value.trim();
          if (!val && self.getNote(iso)) {   /* 清空已有备注 = 删除，需二次确认 */
            if (!confirming) {
              confirming = true;
              delBtn.hidden = false;
              delBtn.textContent = '确认删除？';
              delBtn.classList.add('confirming');
              return;
            }
            closeNote();
            self.removeNote(iso);
            return;
          }
          if (!val) { closeNote(); return; }
          closeNote();
          self.setNote(iso, val);
        });
      }

      /* ---- 长按 550ms 打开备注；右键同样打开 ---- */
      root.querySelectorAll('.cell[data-iso]').forEach(function (cell) {
        var iso = cell.getAttribute('data-iso');
        var pressTimer = null;
        var suppressClick = false;

        function startPress(e) {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          if (!self.notesEnabled) return;
          clearTimeout(pressTimer);
          pressTimer = setTimeout(function () {
            pressTimer = null;
            suppressClick = true;
            openNote(iso);
          }, 550);
        }
        function cancelPress() {
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        }

        cell.addEventListener('pointerdown', startPress);
        cell.addEventListener('pointerup', cancelPress);
        cell.addEventListener('pointerleave', cancelPress);
        cell.addEventListener('pointercancel', cancelPress);
        cell.addEventListener('contextmenu', function (e) {
          if (!self.notesEnabled) return;
          e.preventDefault();
          openNote(iso);
        });

        cell.addEventListener('click', function () {
          if (suppressClick) { suppressClick = false; return; }
          var info = self.getDayInfo(iso);
          if (!info.inRange) return;
          self.dispatchEvent(new CustomEvent('day-click', { detail: info, bubbles: true, composed: true }));
        });
      });
    }

    /* ---------- 导出 ICS ---------- */
    buildICS() {
      var lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DSH//RestCalendar//CN',
        'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'X-WR-CALNAME:上' + this.workDays + '休' + this.restDays + ' · 休息日历',
        'X-WR-TIMEZONE:Asia/Shanghai'
      ];
      var stamp = '20261109T010000Z';
      this.getDays().forEach(function (d) {
        var summary = null;
        if (d.isRest) summary = d.restOnWeekend ? '休息（与周末重合）' : '休息';
        if (d.holiday) summary = (summary ? summary : '上班') + ' · ' + d.holiday.name;
        if (d.makeup) summary = '调休上班 · ' + d.makeup;
        if (!summary) return;
        var s = d.iso.replace(/-/g, '');
        var e = toISO(addDays(parseISO(d.iso), 1)).replace(/-/g, '');
        lines.push('BEGIN:VEVENT', 'UID:day-' + s + '@rest-calendar', 'DTSTAMP:' + stamp,
          'DTSTART;VALUE=DATE:' + s, 'DTEND;VALUE=DATE:' + e, 'SUMMARY:' + summary,
          'TRANSP:TRANSPARENT', 'END:VEVENT');
      });
      lines.push('END:VCALENDAR');
      return lines.join('\r\n') + '\r\n';
    }
  }

  customElements.define('rest-calendar', RestCalendar);

  if (typeof window !== 'undefined') {
    window.RestCalendarData = { holidays: DEFAULT_HOLIDAYS, makeup: DEFAULT_MAKEUP, spans: DEFAULT_SPANS };
  }
})();
