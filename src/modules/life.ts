
import { SettingsManager } from '../utils/settings';

interface ModuleInstance {
  unmount: () => void;
  undo?: () => void;
  redo?: () => void;
}

export function initLife(container: HTMLElement, settings: SettingsManager): ModuleInstance {
  const cellSize = 10;
  let speed = settings.get('defaultLifeSpeed') || 30;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  container.appendChild(canvas);

  const controls = document.createElement('div');
  controls.className = 'absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl z-20';
  controls.innerHTML = `
    <button id="playPause" class="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    </button>
    <button id="resetLife" class="p-2 text-slate-400 hover:text-white transition-colors" title="Randomize">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
    </button>
    <button id="clearLife" class="p-2 text-slate-400 hover:text-white transition-colors" title="Clear">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
    </button>
    <div class="w-px h-6 bg-white/10 mx-2"></div>
    <div class="flex flex-col gap-1">
      <span class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Evolution Speed</span>
      <input type="range" id="speedLife" min="1" max="60" value="${speed}" class="w-24 accent-cyan-500">
    </div>
  `;
  container.appendChild(controls);

  const stats = document.createElement('div');
  stats.className = 'absolute top-4 left-4 font-mono text-xs text-slate-500 bg-slate-900/40 backdrop-blur-sm p-2 rounded border border-white/5';
  stats.innerHTML = `Generation: <span id="genCount" class="text-cyan-400">0</span> | Population: <span id="popCount" class="text-emerald-400">0</span>`;
  container.appendChild(stats);

  let cols: number, rows: number;
  let grid: number[][];
  let isPlaying = false;
  let generation = 0;
  let animationId: number;
  let lastTime = 0;

  function resize() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    cols = Math.floor(canvas.width / cellSize);
    rows = Math.floor(canvas.height / cellSize);
    initGrid();
  }

  function initGrid() {
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    randomize();
  }

  function randomize() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid[r][c] = Math.random() > 0.85 ? 1 : 0;
      }
    }
    generation = 0;
    updateStats();
    draw();
  }

  function clear() {
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    generation = 0;
    updateStats();
    draw();
  }

  function updateStats() {
    const pop = grid.flat().reduce((a, b) => a + b, 0);
    document.getElementById('genCount')!.textContent = generation.toString();
    document.getElementById('popCount')!.textContent = pop.toString();
  }

  function getNeighbors(r: number, c: number) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const row = (r + i + rows) % rows;
        const col = (c + j + cols) % cols;
        count += grid[row][col];
      }
    }
    return count;
  }

  function nextGen() {
    const next = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const neighbors = getNeighbors(r, c);
        const state = grid[r][c];
        if (state === 0 && neighbors === 3) {
          next[r][c] = 1;
        } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
          next[r][c] = 0;
        } else {
          next[r][c] = state;
        }
      }
    }
    grid = next;
    generation++;
    updateStats();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines subtly
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    ctx.fillStyle = '#22d3ee'; // cyan-400
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 1) {
          ctx.fillRect(c * cellSize + 1, r * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
  }

  function loop(time: number) {
    if (!isPlaying) return;
    
    const delta = time - lastTime;
    const interval = 1000 / speed;

    if (delta > interval) {
      nextGen();
      draw();
      lastTime = time;
    }
    animationId = requestAnimationFrame(loop);
  }

  // Interactivity
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      grid[r][c] = grid[r][c] === 1 ? 0 : 1;
      draw();
      updateStats();
    }
  });

  const playPauseBtn = document.getElementById('playPause')!;
  playPauseBtn.onclick = () => {
    isPlaying = !isPlaying;
    playPauseBtn.innerHTML = isPlaying 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    
    if (isPlaying) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animationId);
    }
  };

  document.getElementById('resetLife')!.onclick = randomize;
  document.getElementById('clearLife')!.onclick = clear;
  
  const speedInput = document.getElementById('speedLife') as HTMLInputElement;
  speedInput.oninput = () => {
    speed = parseInt(speedInput.value);
  };

  window.addEventListener('resize', resize);
  resize();

  return {
    unmount: () => {
      isPlaying = false;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    }
  };
}
