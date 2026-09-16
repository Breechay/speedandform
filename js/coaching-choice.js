/* Progressive, select-only combobox. The original select remains the inquiry's
   source of truth and fallback. No pricing, delivery or tracking logic here.
   Keyboard model: WAI-ARIA APG select-only combobox. */
(function () {
  'use strict';
  var select = document.getElementById('coachingChoice');
  if (!select || document.getElementById('coachingChoiceTrigger')) return;
  var label = document.querySelector('label[for="coachingChoice"]');
  if (!label || !select.options.length) return;
  var options = Array.from(select.options);
  var control = document.createElement('div');
  control.className = 'coaching-choice';
  var trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = 'coachingChoiceTrigger';
  trigger.className = 'coaching-choice__trigger';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'coachingChoiceList');
  var list = document.createElement('ul');
  list.id = 'coachingChoiceList';
  list.className = 'coaching-choice__list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  // Touch taps also synthesize mousedown; cancel its focus transfer, not touch scrolling.
  list.addEventListener('mousedown', function (event) { event.preventDefault(); });
  var open = false, active = Math.max(select.selectedIndex, 0), buffer = '', lastType = 0;

  function icon(path, className) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', path); svg.appendChild(line); return svg;
  }
  function copy(option) {
    var bits = option.textContent.split('·');
    return { name: option.value === 'run' ? 'Run Development' : bits.shift().trim(),
      fee: option.value === 'remote' ? 'Discuss coaching' : option.textContent.split('·').slice(1).join('·').trim().replace(' / ', ' · ') };
  }
  function valueNode(option) {
    var value = copy(option), box = document.createElement('span');
    box.className = 'coaching-choice__value';
    var name = document.createElement('span'), fee = document.createElement('span');
    name.className = 'coaching-choice__name'; name.textContent = value.name;
    fee.className = 'coaching-choice__fee'; fee.textContent = value.fee;
    box.append(name, fee); return box;
  }
  var rows = options.map(function (option, index) {
    var row = document.createElement('li');
    row.id = 'coachingChoiceOption-' + index;
    row.className = 'coaching-choice__option';
    row.setAttribute('role', 'option');
    row.append(valueNode(option), icon('M5 12l4 4L19 6', 'coaching-choice__check'));
    // Keep DOM focus on the combobox while interacting with its popup.
    row.addEventListener('pointerdown', function (event) { if (event.pointerType !== 'touch') event.preventDefault(); });
    row.addEventListener('click', function () { active = index; close(true); trigger.focus({preventScroll:true}); });
    list.appendChild(row); return row;
  });
  trigger.appendChild(icon('M6 9l6 6 6-6', 'coaching-choice__arrow'));
  control.append(trigger, list);

  function render() {
    var current = Math.max(0, select.selectedIndex), old = trigger.querySelector('.coaching-choice__value');
    if (old) old.remove();
    trigger.prepend(valueNode(options[current]));
    rows.forEach(function (row, index) { row.setAttribute('aria-selected', String(index === current)); });
  }
  function position() {
    if (!open) return;
    var box = trigger.getBoundingClientRect(), viewport = window.visualViewport;
    var top = viewport ? viewport.offsetTop : 0;
    var bottom = top + (viewport ? viewport.height : window.innerHeight);
    var below = bottom - box.bottom - 14, above = box.top - top - 14;
    var up = below < 240 && above > below;
    control.classList.toggle('coaching-choice--up', up);
    list.style.maxHeight = Math.max(96, Math.min(300, up ? above : below)) + 'px';
  }
  function highlight(index) {
    active = Math.max(0, Math.min(options.length - 1, index));
    rows.forEach(function (row, i) { row.classList.toggle('is-active', i === active); });
    trigger.setAttribute('aria-activedescendant', rows[active].id);
    var row = rows[active], top = row.offsetTop, bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }
  function show() {
    open = true; list.hidden = false; trigger.setAttribute('aria-expanded', 'true');
    position(); highlight(Math.max(0, select.selectedIndex));
  }
  function close(commit) {
    if (!open) return;
    open = false; list.hidden = true; buffer = '';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    if (commit && select.selectedIndex !== active) {
      select.selectedIndex = active;
      select.dispatchEvent(new Event('input', {bubbles:true}));
      select.dispatchEvent(new Event('change', {bubbles:true}));
    }
    render();
  }
  function search(key) {
    var now = Date.now(); buffer = now - lastType > 700 ? key : buffer + key; lastType = now;
    var term = buffer.toLowerCase();
    if (Array.from(term).every(function (c) { return c === term[0]; })) term = term[0];
    var start = term.length === 1 ? active + 1 : active;
    for (var step = 0; step < options.length; step++) {
      var index = (start + step) % options.length;
      if (copy(options[index]).name.toLowerCase().startsWith(term)) { highlight(index); break; }
    }
  }
  trigger.addEventListener('click', function () {
    control.classList.remove('is-keyboard'); if (open) close(false); else show();
  });
  trigger.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.metaKey) return;
    control.classList.add('is-keyboard');
    var key = event.key;
    if (key === 'Tab') { close(true); return; }
    if (key === 'Escape') { if (open) { event.preventDefault(); close(false); } return; }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault(); if (open) close(true); else show(); return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(key)) {
      event.preventDefault();
      if (event.altKey && key === 'ArrowUp') { close(true); return; }
      if (!open) { show(); if (key === 'Home' || key === 'PageUp') highlight(0); else if (key === 'End' || key === 'PageDown') highlight(options.length - 1); }
      else if (!event.altKey) highlight(key === 'Home' || key === 'PageUp' ? 0 : key === 'End' || key === 'PageDown' ? options.length - 1 : active + (key === 'ArrowDown' ? 1 : -1));
      return;
    }
    if (key.length === 1 && !event.altKey) { event.preventDefault(); if (!open) show(); search(key); }
  });
  trigger.addEventListener('blur', function () { close(true); });
  document.addEventListener('pointerdown', function (event) { if (!control.contains(event.target)) close(false); });
  select.addEventListener('change', function () { active = Math.max(select.selectedIndex, 0); close(false); render(); });
  window.addEventListener('resize', position, {passive:true});
  window.addEventListener('scroll', position, {passive:true});
  if (window.visualViewport) window.visualViewport.addEventListener('resize', position, {passive:true});

  // Only hide the working native field after every part of its replacement is ready.
  label.id = label.id || 'coachingChoiceLabel';
  trigger.setAttribute('aria-labelledby', label.id);
  list.setAttribute('aria-labelledby', label.id);
  render(); select.insertAdjacentElement('afterend', control);
  label.htmlFor = trigger.id;
  select.hidden = true;
})();
