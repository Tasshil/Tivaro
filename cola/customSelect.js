/**
 * CustomSelect — قائمة منسدلة احترافية مع بحث فوري
 * الاستخدام: new CustomSelect(element, { placeholder, onChange })
 */
class CustomSelect {
  constructor(el, { placeholder = '-- اختر --', onChange = null } = {}) {
    this.el = el;
    this.placeholder = placeholder;
    this.onChange = onChange;
    this.value = '';
    this.label = '';
    this.options = [];
    this.open = false;
    this._build();
    this._outsideClick();
  }

  _build() {
    this.el.classList.add('cs-wrap');
    this.el.innerHTML = `
      <div class="cs-trigger" tabindex="0">
        <span class="cs-val cs-ph">${this.placeholder}</span>
        <svg class="cs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="cs-panel">
        <div class="cs-search-row">
          <input class="cs-search" type="text" placeholder="🔍 ابحث بالاسم أو الرقم..." autocomplete="off">
        </div>
        <ul class="cs-list"></ul>
        <div class="cs-no-result">لا توجد نتائج</div>
      </div>`;

    this._trigger = this.el.querySelector('.cs-trigger');
    this._panel   = this.el.querySelector('.cs-panel');
    this._search  = this.el.querySelector('.cs-search');
    this._list    = this.el.querySelector('.cs-list');
    this._noRes   = this.el.querySelector('.cs-no-result');

    this._trigger.addEventListener('click', () => this.toggle());
    this._trigger.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); this.toggle(); }});
    this._search.addEventListener('input', () => this._filter());
  }

  _outsideClick() {
    document.addEventListener('click', e => {
      if (!this.el.contains(e.target)) this._close();
    }, true);
  }

  setOptions(opts) {
    // opts: [{value, label}] or ['string']
    this.options = opts.map(o =>
      typeof o === 'string' ? { value: o, label: o } : o
    );
    this._render(this.options);
  }

  _render(opts) {
    this._list.innerHTML = '';
    this._noRes.style.display = opts.length ? 'none' : 'block';
    opts.forEach(o => {
      const li = document.createElement('li');
      li.className = 'cs-item' + (o.value === this.value ? ' cs-selected' : '');
      li.innerHTML = `<span>${o.label}</span>${o.value === this.value ? '<span class="cs-check">✓</span>' : ''}`;
      li.addEventListener('click', () => this._pick(o));
      this._list.appendChild(li);
    });
  }

  _filter() {
    const q = this._search.value.trim().toLowerCase();
    this._render(q ? this.options.filter(o => o.label.toLowerCase().includes(q)) : this.options);
  }

  _pick(o) {
    this.value = o.value;
    this.label = o.label;
    const v = this._trigger.querySelector('.cs-val');
    v.textContent = o.label;
    v.classList.remove('cs-ph');
    // add active ring
    this.el.classList.add('cs-has-value');
    this._render(this.options);
    this._close();
    if (this.onChange) this.onChange(o.value, o.label);
  }

  toggle() { this.open ? this._close() : this._open(); }

  _open() {
    // close others
    document.querySelectorAll('.cs-wrap.cs-open').forEach(w => {
      if (w !== this.el) w.__cs && w.__cs._close();
    });
    this.open = true;
    this.el.classList.add('cs-open');
    this._search.value = '';
    this._render(this.options);
    setTimeout(() => this._search.focus(), 60);
  }

  _close() {
    this.open = false;
    this.el.classList.remove('cs-open');
  }

  reset(ph) {
    this.value = '';
    this.label = '';
    this.options = [];
    this._list.innerHTML = '';
    this._noRes.style.display = 'none';
    this._search.value = '';
    const v = this._trigger.querySelector('.cs-val');
    v.textContent = ph || this.placeholder;
    v.classList.add('cs-ph');
    this.el.classList.remove('cs-has-value');
    this._close();
  }

  getValue()  { return this.value; }
  getLabel()  { return this.label; }
  hasError()  { return !this.value; }
  setError(b) { this.el.querySelector('.cs-trigger').classList.toggle('cs-error', b); }
  shakeError() {
    const t = this._trigger;
    t.classList.add('cs-error', 'cs-shake');
    t.addEventListener('animationend', () => t.classList.remove('cs-shake'), {once:true});
  }
}
