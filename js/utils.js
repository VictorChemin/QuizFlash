// ── TOAST SYSTEM ──
function toast(msg, type = '', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', '': 'ℹ️' };
  t.innerHTML = `<span>${icons[type] || icons['']}</span>${msg}`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, duration);
}

// ── CONFETTI BACKGROUND ──
function createConfettiBg() {
  const shapes = ['circle', 'rect', 'star'];
  const colors = ['#6C3FC5', '#FFD43B', '#3ECFAA', '#FF6B6B', '#8B5CF6'];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1440 900');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  
  for (let i = 0; i < 38; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = Math.random() * 1440;
    const y = Math.random() * 900;
    const size = 6 + Math.random() * 18;
    const opacity = 0.06 + Math.random() * 0.1;
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    let el;
    if (shape === 'circle') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      el.setAttribute('cx', x); el.setAttribute('cy', y); el.setAttribute('r', size / 2);
    } else if (shape === 'rect') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      el.setAttribute('x', x); el.setAttribute('y', y);
      el.setAttribute('width', size); el.setAttribute('height', size);
      el.setAttribute('rx', 3);
      el.setAttribute('transform', `rotate(${Math.random()*60-30} ${x+size/2} ${y+size/2})`);
    } else {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const pts = [];
      for (let j = 0; j < 5; j++) {
        const a = (j * 72 - 90) * Math.PI / 180;
        const r2 = j % 2 === 0 ? size/2 : size/4;
        pts.push(`${x + r2*Math.cos(a)},${y + r2*Math.sin(a)}`);
      }
      el.setAttribute('points', pts.join(' '));
    }
    el.setAttribute('fill', color);
    el.setAttribute('opacity', opacity);
    svg.appendChild(el);
  }
  const wrapper = document.querySelector('.confetti-bg');
  if (wrapper) wrapper.appendChild(svg);
}

// ── CLIPBOARD ──
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copié dans le presse-papier !', 'success');
  } catch {
    toast('Impossible de copier', 'error');
  }
}

// ── FILE DOWNLOAD ──
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith('.quiz') ? filename : filename + '.quiz';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── FILE READ ──
function readQuizFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try { resolve(JSON.parse(e.target.result)); }
      catch { reject(new Error('Fichier .quiz invalide')); }
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
    reader.readAsText(file);
  });
}

// ── RANDOM PICK ──
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── SHUFFLE ──
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── GENERATE ROOM CODE ──
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── AVATAR COLOR from name ──
function avatarColor(name) {
  const colors = ['#6C3FC5','#FF6B6B','#3ECFAA','#F59E0B','#8B5CF6','#EC4899'];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

// ── TIMER ──
class QuizTimer {
  constructor(seconds, onTick, onEnd) {
    this.total = seconds;
    this.remaining = seconds;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.interval = null;
  }
  start() {
    this.onTick(this.remaining, this.total);
    this.interval = setInterval(() => {
      this.remaining--;
      this.onTick(this.remaining, this.total);
      if (this.remaining <= 0) { this.stop(); this.onEnd(); }
    }, 1000);
  }
  stop() { clearInterval(this.interval); this.interval = null; }
  reset(seconds) { this.stop(); this.remaining = seconds ?? this.total; }
}

// ── QUESTION PREPARE ──
// Takes a question definition and prepares it for play:
// - picks N answers from the pool
// - includes the correct answer(s)
// - shuffles
function prepareQuestion(q) {
  const correct = q.answers.filter(a => a.correct);
  const wrong = q.answers.filter(a => !a.correct);
  const numChoices = Math.min(q.numChoices || 4, q.answers.length);
  const numCorrectNeeded = Math.min(correct.length, Math.floor(numChoices / 2)) || 1;
  const pickedCorrect = pickRandom(correct, numCorrectNeeded);
  const pickedWrong = pickRandom(wrong, numChoices - numCorrectNeeded);
  const choices = shuffle([...pickedCorrect, ...pickedWrong]);
  return {
    ...q,
    choices,
    correctIds: pickedCorrect.map(a => a.id),
  };
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  createConfettiBg();
  // mark active nav link
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(l => {
    if (l.href === location.href || location.pathname.includes(l.getAttribute('href')?.replace('.html','') || '__none__')) {
      l.classList.add('active');
    }
  });
});
