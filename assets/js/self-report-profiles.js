// Interactive line-chart visualization for the LLM self-report blog post.
// Renders 25-model × 5-factor z-score profiles into #self-report-profiles-viz.
// Vanilla SVG, no dependencies.
(function () {
  const MOUNT_ID = 'self-report-profiles-viz';
  const DATA_URL = '/assets/data/factor_scores.csv';
  const FACTORS = [
    { key: 'RE', label: 'Responsiveness', highPole: 'more responsive' },
    { key: 'DE', label: 'Deference', highPole: 'more deferential' },
    { key: 'BO', label: 'Boldness', highPole: 'more bold' },
    { key: 'GU', label: 'Guardedness', highPole: 'more guarded' },
    { key: 'VB', label: 'Verbosity', highPole: 'more verbose' }
  ];
  const DEFAULTS = ['Claude Opus 4.6', 'GPT-5.4', 'Gemini 3.1 Pro'];
  // Okabe-Ito colorblind-safe palette × 4 dash styles = 32 distinct combos before repeating.
  const PALETTE = ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#E69F00', '#56B4E9', '#F0E442', '#000000'];
  const DASH_STYLES = ['none', '6 3', '2 3', '6 3 2 3'];
  const Y_MIN = -3.5;
  const Y_MAX = 3.5;

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const cells = line.split(',');
      const row = {};
      headers.forEach((h, i) => { row[h.trim()] = cells[i].trim(); });
      // Coerce factor columns to numbers.
      FACTORS.forEach(f => { row[f.key] = parseFloat(row[f.key]); });
      return row;
    });
  }

  function colorFor(index) { return PALETTE[index % PALETTE.length]; }
  function dashFor(index) { return DASH_STYLES[Math.floor(index / PALETTE.length) % DASH_STYLES.length]; }

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function renderChart(state) {
    const { mount, data, selected } = state;
    const chartHost = mount.querySelector('.srp-chart');
    chartHost.innerHTML = '';

    const W = chartHost.clientWidth || 600;
    const H = Math.max(360, Math.min(480, W * 0.7));
    const M = { top: 24, right: 24, bottom: 60, left: 56 };
    const innerW = W - M.left - M.right;
    const innerH = H - M.top - M.bottom;

    const svg = svgEl('svg', {
      viewBox: `0 0 ${W} ${H}`,
      width: '100%',
      height: H,
      role: 'img',
      'aria-label': 'Line chart of self-report z-scores across five factors for selected models'
    });

    const x = (i) => M.left + (FACTORS.length === 1 ? innerW / 2 : (i / (FACTORS.length - 1)) * innerW);
    const y = (z) => M.top + ((Y_MAX - z) / (Y_MAX - Y_MIN)) * innerH;

    // Y-axis gridlines + labels at integer ticks.
    for (let z = -3; z <= 3; z++) {
      const yy = y(z);
      svg.appendChild(svgEl('line', {
        x1: M.left, x2: M.left + innerW, y1: yy, y2: yy,
        stroke: z === 0 ? '#9ca3af' : '#eef0f3',
        'stroke-width': z === 0 ? 1 : 1,
        'stroke-dasharray': z === 0 ? '4 3' : ''
      }));
      const tick = svgEl('text', {
        x: M.left - 8, y: yy + 4,
        'text-anchor': 'end',
        'font-size': '11',
        fill: '#6b7280'
      });
      tick.textContent = (z > 0 ? '+' : '') + z + 'σ';
      svg.appendChild(tick);
    }

    // Y-axis label.
    const ylab = svgEl('text', {
      x: 16, y: M.top + innerH / 2,
      'font-size': '11',
      fill: '#6b7280',
      transform: `rotate(-90 16 ${M.top + innerH / 2})`,
      'text-anchor': 'middle'
    });
    ylab.textContent = 'Z-score (pool-relative)';
    svg.appendChild(ylab);

    // X-axis category labels — rotated -35° around their midpoint so they fan without overlapping.
    FACTORS.forEach((f, i) => {
      const xx = x(i);
      const yy = M.top + innerH + 16;
      const lbl = svgEl('text', {
        x: xx, y: yy,
        'text-anchor': 'middle',
        'font-size': '11',
        'font-weight': '600',
        fill: '#1f2937',
        transform: `rotate(-35 ${xx} ${yy})`
      });
      lbl.textContent = f.label;
      svg.appendChild(lbl);
    });

    // Lines + points for each selected model.
    const tooltip = mount.querySelector('.srp-tooltip');
    selected.forEach((modelName, idx) => {
      const row = data.find(r => r.model === modelName);
      if (!row) return;
      const color = colorFor(idx);
      const dash = dashFor(idx);
      const pts = FACTORS.map((f, i) => ({ x: x(i), y: y(row[f.key]), z: row[f.key], factor: f.label }));
      const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');

      svg.appendChild(svgEl('path', {
        d, fill: 'none', stroke: color, 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'stroke-dasharray': dash
      }));

      pts.forEach(p => {
        const dot = svgEl('circle', {
          cx: p.x, cy: p.y, r: '4.5',
          fill: '#fff', stroke: color, 'stroke-width': '2',
          tabindex: '0',
          role: 'button',
          'aria-label': `${modelName}, ${p.factor}: ${p.z >= 0 ? '+' : ''}${p.z.toFixed(2)} sigma`
        });
        const showTip = (clientX, clientY) => {
          const rect = mount.getBoundingClientRect();
          tooltip.style.left = (clientX - rect.left + 12) + 'px';
          tooltip.style.top = (clientY - rect.top + 12) + 'px';
          tooltip.innerHTML = `<strong>${modelName}</strong><br>${p.factor}: ${p.z >= 0 ? '+' : ''}${p.z.toFixed(2)}σ`;
          tooltip.style.opacity = '1';
        };
        dot.addEventListener('mouseenter', (e) => showTip(e.clientX, e.clientY));
        dot.addEventListener('mousemove', (e) => showTip(e.clientX, e.clientY));
        dot.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
        dot.addEventListener('focus', () => {
          const r = dot.getBoundingClientRect();
          showTip(r.left + r.width / 2, r.top + r.height / 2);
        });
        dot.addEventListener('blur', () => { tooltip.style.opacity = '0'; });
        dot.addEventListener('click', (e) => { e.stopPropagation(); showTip(e.clientX, e.clientY); });
        svg.appendChild(dot);
      });
    });

    chartHost.appendChild(svg);

    // Legend.
    const legend = mount.querySelector('.srp-legend');
    if (legend) {
      legend.innerHTML = selected.length === 0
        ? '<span class="srp-legend-empty">No models selected.</span>'
        : selected.map((m, i) => {
            const c = colorFor(i);
            const da = dashFor(i);
            const daAttr = da !== 'none' ? `stroke-dasharray="${da}"` : '';
            return `<span class="srp-legend-item"><svg class="srp-swatch-line" width="22" height="10" aria-hidden="true"><line x1="1" y1="5" x2="21" y2="5" stroke="${c}" stroke-width="2" stroke-linecap="round" ${daAttr}/></svg>${m}</span>`;
          }).join('');
    }
  }

  function renderControls(state) {
    const { mount, data, selected } = state;
    const list = mount.querySelector('.srp-models');
    list.innerHTML = data.map(r => {
      const checked = selected.includes(r.model) ? 'checked' : '';
      const safeId = 'srp-' + r.model.replace(/[^a-zA-Z0-9]+/g, '-');
      return `<label class="srp-model" for="${safeId}">
        <input type="checkbox" id="${safeId}" data-model="${r.model.replace(/"/g, '&quot;')}" ${checked}>
        <span>${r.model}</span>
      </label>`;
    }).join('');
    list.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        const m = e.target.getAttribute('data-model');
        if (e.target.checked && !state.selected.includes(m)) state.selected.push(m);
        else if (!e.target.checked) state.selected = state.selected.filter(x => x !== m);
        renderChart(state);
      }
    });

    const clearBtn = mount.querySelector('.srp-clear');
    clearBtn.addEventListener('click', () => {
      state.selected = [];
      list.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
      renderChart(state);
    });
  }

  function buildScaffold(mount) {
    mount.innerHTML = `
      <div class="srp-root">
        <div class="srp-chart-col">
          <div class="srp-chart" aria-live="polite"></div>
          <div class="srp-tooltip" role="status" aria-live="polite"></div>
          <p class="srp-legend"></p>
          <p class="srp-caption">Self-report profiles across five LLM-native factors. Z-scores are relative to the 25-model pool. Data from Contreras (2026).</p>
        </div>
        <aside class="srp-controls" aria-label="Model selection">
          <div class="srp-controls-head">
            <h4>Models</h4>
            <button type="button" class="srp-clear">Clear all</button>
          </div>
          <div class="srp-models-wrap"><div class="srp-models" role="group" aria-label="Toggle models to compare"></div></div>
        </aside>
      </div>
    `;
  }

  async function init() {
    const mount = document.getElementById(MOUNT_ID);
    if (!mount) return;
    let csv;
    try {
      const resp = await fetch(DATA_URL);
      if (!resp.ok) throw new Error('Failed to load factor scores');
      csv = await resp.text();
    } catch (err) {
      mount.innerHTML = '<p class="srp-error">Could not load visualization data.</p>';
      console.error(err);
      return;
    }

    const data = parseCSV(csv).sort((a, b) => a.model.localeCompare(b.model));
    const state = { mount, data, selected: DEFAULTS.filter(d => data.some(r => r.model === d)) };

    buildScaffold(mount);
    renderControls(state);
    renderChart(state);

    let raf;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => renderChart(state));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
