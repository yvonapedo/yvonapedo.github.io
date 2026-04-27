function toggleTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('themeBtn');
  if (html.getAttribute('data-theme') === 'light') {
    html.setAttribute('data-theme', 'dark');
    btn.textContent = '☀ light';
  } else {
    html.setAttribute('data-theme', 'light');
    btn.textContent = '☽ dark';
  }
}

// ── VLM TOKEN PRUNING VISUALIZATION ──────────────────────────────
const VLM_GRID = 24; // 24×24 = 576 tokens
const VLM_N    = VLM_GRID * VLM_GRID;

// Per-model metadata
const VLM_MODELS = [
  { name:'LLaVA-1.5 7B',  enc:'CLIP ViT-L/14', llm:'Vicuna-7B',  seed:42 },
  { name:'LLaVA-1.5 13B', enc:'CLIP ViT-L/14', llm:'Vicuna-13B', seed:77 },
  { name:'Qwen-VL',       enc:'ViT-bigG',       llm:'Qwen-7B',    seed:13 },
];

// Benchmarks: [name, retention curve] - retention(n) returns 0-1
// Derived from observed trend: easy benchmarks ~lossless, hard ones drop at low n
const VLM_BENCHMARKS = [
  { name:'POPE',       easy:true,  drop:0.008 },
  { name:'GQA',        easy:true,  drop:0.018 },
  { name:'ScienceQA',  easy:false, drop:0.035 },
  { name:'MMStar',     easy:false, drop:0.12  },
  { name:'TextVQA',    easy:false, drop:0.095 },
  { name:'AI2D',       easy:false, drop:0.07  },
];

function retentionAt(n, drop) {
  // Smooth decay: full at 576, drops as tokens decrease, non-linear
  if (n >= 576) return 1.0;
  const t = Math.log(576 / Math.max(n, 1)) / Math.log(576 / 16);
  return Math.max(0, 1 - drop * t * t * 5.2);
}

// Seeded pseudo-random
function seededRng(s) {
  let x = s;
  return () => { x = (x*16807 + 0) % 2147483647; return (x-1)/2147483646; };
}

// Generate importance scores (realistic Gaussian blob map)
function makeScores(seed) {
  const rng = seededRng(seed);
  const scores = new Float32Array(VLM_N);
  // 4-7 object blobs at random positions
  const blobs = 4 + Math.floor(rng() * 4);
  for (let b = 0; b < blobs; b++) {
    const cy = rng() * VLM_GRID;
    const cx = rng() * VLM_GRID;
    const sigma = 1.8 + rng() * 3.5;
    const strength = 0.5 + rng() * 0.5;
    for (let r = 0; r < VLM_GRID; r++) {
      for (let c = 0; c < VLM_GRID; c++) {
        const d2 = ((r-cy)**2 + (c-cx)**2) / (2*sigma**2);
        scores[r*VLM_GRID+c] += strength * Math.exp(-d2);
      }
    }
  }
  // Edge/gradient importance
  for (let r = 0; r < VLM_GRID; r++) {
    for (let c = 0; c < VLM_GRID; c++) {
      const edge = Math.abs(r - VLM_GRID/2) + Math.abs(c - VLM_GRID/2);
      scores[r*VLM_GRID+c] += 0.05 * rng();
    }
  }
  // Normalise to [0,1]
  let mx = 0;
  for (let i = 0; i < VLM_N; i++) mx = Math.max(mx, scores[i]);
  for (let i = 0; i < VLM_N; i++) scores[i] /= mx;
  return scores;
}

let vlmScores = makeScores(VLM_MODELS[0].seed);
let vlmCurrentN = 576;
let vlmModelIdx = 0;
// Pre-sort indices by descending importance (stable across slider moves)
let vlmRanked = Array.from({length:VLM_N},(_,i)=>i).sort((a,b)=>vlmScores[b]-vlmScores[a]);

function renderVlmCanvas(keepN) {
  const canvas = document.getElementById('vlmCanvas');
  if (!canvas) return;
  const SIZE = 480;
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const cell = SIZE / VLM_GRID;

  // Build a set of kept indices
  const kept = new Set(vlmRanked.slice(0, keepN));

  // Background
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg3').trim() || '#eef0f6';
  ctx.fillRect(0,0,SIZE,SIZE);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const accentColor = isDark ? '#60a5fa' : '#2563eb';
  const prunedColor = isDark ? '#252a3a' : '#d6dae8';
  const borderColor = isDark ? '#1a1e2e' : '#f7f8fc';

  for (let i = 0; i < VLM_N; i++) {
    const row = Math.floor(i / VLM_GRID);
    const col = i % VLM_GRID;
    const x = col * cell;
    const y = row * cell;
    const score = vlmScores[i];

    if (kept.has(i)) {
      // Kept: blue, intensity = score
      const alpha = 0.25 + score * 0.75;
      // Parse accent as rgb and apply alpha
      ctx.globalAlpha = alpha;
      ctx.fillStyle = accentColor;
      ctx.fillRect(x+0.5, y+0.5, cell-1, cell-1);
      ctx.globalAlpha = 1;
      // Border for high-importance tokens
      if (score > 0.7) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x+1, y+1, cell-2, cell-2);
      }
    } else {
      // Pruned: muted
      ctx.fillStyle = prunedColor;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x+0.5, y+0.5, cell-1, cell-1);
      ctx.globalAlpha = 1;
    }
  }

  // Grid lines
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= VLM_GRID; r++) {
    ctx.beginPath(); ctx.moveTo(0, r*cell); ctx.lineTo(SIZE, r*cell); ctx.stroke();
  }
  for (let c = 0; c <= VLM_GRID; c++) {
    ctx.beginPath(); ctx.moveTo(c*cell, 0); ctx.lineTo(c*cell, SIZE); ctx.stroke();
  }
}

function updateVlmStats(n) {
  const speedup = (576 / n).toFixed(1);
  const pruned  = Math.round((1 - n/576)*100);
  document.getElementById('vlmCount').textContent   = n;
  document.getElementById('vlmSpeedup').textContent = speedup + '×';
  document.getElementById('vlmPruned').textContent  = pruned + '%';
  document.getElementById('vlmPruneSub').textContent = `576 → ${n}`;

  // Benchmark bars
  const barsEl = document.getElementById('vlmBars');
  if (!barsEl) return;
  barsEl.innerHTML = VLM_BENCHMARKS.map(b => {
    const ret  = retentionAt(n, b.drop);
    const pct  = (ret * 100).toFixed(1);
    const cls  = ret > 0.97 ? '' : ret > 0.90 ? ' vlm-bar-warn' : ' vlm-bar-danger';
    return `<div class="vlm-bar-row">
      <div class="vlm-bar-name">${b.name}</div>
      <div class="vlm-bar-track"><div class="vlm-bar-fill${cls}" style="width:${pct}%"></div></div>
      <div class="vlm-bar-pct">${pct}%</div>
    </div>`;
  }).join('');
}

function vlmSetModel(idx) {
  vlmModelIdx = idx;
  const m = VLM_MODELS[idx];
  vlmScores  = makeScores(m.seed);
  vlmRanked  = Array.from({length:VLM_N},(_,i)=>i).sort((a,b)=>vlmScores[b]-vlmScores[a]);
  document.querySelectorAll('.vlm-mtab').forEach((t,i)=>t.classList.toggle('active',i===idx));
  const encEl = document.getElementById('vlmEncSub');
  const llmEl = document.getElementById('vlmLLMSub');
  if (encEl) encEl.textContent = m.enc;
  if (llmEl) llmEl.textContent = m.llm;
  renderVlmCanvas(vlmCurrentN);
}

function vlmSetN(n) {
  vlmCurrentN = n;
  document.getElementById('vlmSlider').value = n;
  document.querySelectorAll('.vlm-preset').forEach(b => {
    b.classList.toggle('active', +b.dataset.n === n);
  });
  renderVlmCanvas(n);
  updateVlmStats(n);
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('vlmSlider');
  if (!slider) return;
  renderVlmCanvas(576);
  updateVlmStats(576);

  slider.addEventListener('input', () => {
    const n = +slider.value;
    vlmCurrentN = n;
    document.querySelectorAll('.vlm-preset').forEach(b=>b.classList.remove('active'));
    renderVlmCanvas(n);
    updateVlmStats(n);
  });

  document.querySelectorAll('.vlm-preset').forEach(btn => {
    btn.addEventListener('click', () => vlmSetN(+btn.dataset.n));
  });

  document.querySelectorAll('.vlm-mtab').forEach((btn, i) => {
    btn.addEventListener('click', () => vlmSetModel(i));
  });
});

// Re-render on theme toggle to match colors
const _origToggle = window.toggleTheme;
window.toggleTheme = function() {
  _origToggle();
  setTimeout(() => renderVlmCanvas(vlmCurrentN), 50);
};


const robots = [
  { name: 'UR5e',             type: 'Single Arm · 6-DOF',  img: 'https://www.pi.website/_next/image?url=%2Fimages%2Frobots%2Frobot-1.png&w=384&q=75' },
  { name: 'Bimanual UR5e',    type: 'Dual Arm · 12-DOF',   img: 'https://www.pi.website/_next/image?url=%2Fimages%2Frobots%2Frobot-2.png&w=384&q=75' },
  { name: 'Franka',           type: 'Single Arm · 7-DOF',  img: 'https://www.pi.website/_next/image?url=%2Fimages%2Frobots%2Frobot-3.png&w=384&q=75' },
  { name: 'Bimanual Trossen', type: 'Dual Arm · 14-DOF',   img: 'https://www.pi.website/_next/image?url=%2Fimages%2Frobots%2Frobot-4.png&w=384&q=75' },
  { name: 'Bimanual ARX',     type: 'Dual Arm · 12-DOF',   img: 'https://www.pi.website/_next/image?url=%2Fimages%2Frobots%2Frobot-5.png&w=384&q=75' },
  { name: 'Mobile Trossen',   type: 'Mobile Manipulator',  img: 'https://www.pi.website/_next/image?url=%2Fimages%2Frobots%2Frobot-6.png&w=384&q=75' },
  { name: 'Mobile Fibocom',   type: 'Mobile Manipulator',  img: 'https://www.pi.website/_next/image?url=%2Fimages%2Frobots%2Frobot-7.png&w=384&q=75' },
];

function updatePi0Info(idx) {
  const nameEl = document.getElementById('pi0ActiveName');
  const typeEl = document.getElementById('pi0ActiveType');
  const idxEl  = document.getElementById('pi0ActiveIdx');
  if (nameEl) nameEl.textContent = robots[idx].name;
  if (typeEl) typeEl.textContent = robots[idx].type;
  if (idxEl)  idxEl.textContent  = String(idx + 1).padStart(2, '0');
}

let pi0AutoIdx = 0;
let pi0AutoTimer = null;

function startPi0Auto() {
  clearInterval(pi0AutoTimer);
  pi0AutoTimer = setInterval(() => {
    const cards = document.querySelectorAll('.pi0-robot-card');
    if (!cards.length) return;
    cards.forEach((c, i) => {
      c.style.transition = 'transform 0.7s ease, filter 0.5s ease';
      const nameTag = c.querySelector('.pi0-robot-name-tag');
      if (i === pi0AutoIdx) {
        c.style.transform = 'translateY(-10px) scale(1.05)';
        c.style.filter    = 'grayscale(0%) brightness(1)';
        c.style.zIndex    = '5';
        if (nameTag) nameTag.style.color = 'var(--accent)';
      } else {
        c.style.transform = 'scale(0.96) translateY(2px)';
        c.style.filter    = 'grayscale(35%) brightness(0.8)';
        c.style.zIndex    = '';
        if (nameTag) nameTag.style.color = '';
      }
      const glow = c.querySelector('.pi0-robot-glow');
      if (glow) glow.style.opacity = i === pi0AutoIdx ? '0.5' : '0';
    });
    updatePi0Info(pi0AutoIdx);
    pi0AutoIdx = (pi0AutoIdx + 1) % robots.length;
  }, 2200);
}

// Robot lineup hover + 3D tilt interaction
(function () {
  const cards = document.querySelectorAll('.pi0-robot-card');
  if (!cards.length) return;

  const LIFT  = -26;    // px upward on hover
  const SCALE = 1.13;
  const TILTX = 11;     // max rotateX degrees
  const TILTY = 11;     // max rotateY degrees

  cards.forEach((card, idx) => {
    const glow    = card.querySelector('.pi0-robot-glow');
    const nameTag = card.querySelector('.pi0-robot-name-tag');

    card.addEventListener('mouseenter', () => {
      clearInterval(pi0AutoTimer);
      updatePi0Info(idx);

      // Dim and push down siblings
      cards.forEach((c, i) => {
        if (i === idx) return;
        c.style.transition = 'transform 0.45s cubic-bezier(.34,1.56,.64,1), filter 0.35s ease';
        c.style.transform  = 'scale(0.9) translateY(8px)';
        c.style.filter     = 'grayscale(60%) brightness(0.58)';
        c.style.zIndex     = '';
        const nt = c.querySelector('.pi0-robot-name-tag');
        if (nt) nt.style.color = '';
        const gl = c.querySelector('.pi0-robot-glow');
        if (gl) gl.style.opacity = '0';
      });

      if (nameTag) nameTag.style.color = 'var(--accent)';
      if (glow)    glow.style.opacity  = '0.9';
      card.style.zIndex = '10';
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;
      const dx   = (e.clientX - rect.left - cx) / cx; // -1..1
      const dy   = (e.clientY - rect.top  - cy) / cy; // -1..1

      card.style.transition = 'filter 0.12s ease';
      card.style.transform  =
        `translateY(${LIFT}px) scale(${SCALE}) perspective(600px) rotateX(${-dy * TILTX}deg) rotateY(${dx * TILTY}deg)`;
      card.style.filter = 'grayscale(0%) brightness(1.06)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.55s cubic-bezier(.34,1.56,.64,1), filter 0.4s ease';
      card.style.transform  = '';
      card.style.filter     = '';
      card.style.zIndex     = '';
      if (nameTag) nameTag.style.color = '';
      if (glow)    glow.style.opacity  = '0';

      // Restore all siblings
      cards.forEach(c => {
        c.style.transition = 'transform 0.55s cubic-bezier(.34,1.56,.64,1), filter 0.4s ease';
        c.style.transform  = '';
        c.style.filter     = '';
      });

      // Restart auto-cycle after a pause
      setTimeout(startPi0Auto, 2800);
    });
  });

  startPi0Auto();
})();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.research-card, .pub-card, .cert-card, .proj-card, .stack-group').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(16px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
