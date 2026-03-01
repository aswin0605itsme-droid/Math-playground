import { SettingsManager } from '../utils/settings';
import { HistoryManager } from '../utils/history';

interface FractalState {
  angle: number;
  depth: number;
}

export function initFractal(container: HTMLElement, settings: SettingsManager) {
  container.innerHTML = `
    <div class="flex flex-col h-full gap-4">
      <div class="flex flex-wrap gap-4 items-center p-4 bg-slate-900/30 rounded-xl border border-white/10 backdrop-blur-md justify-between">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-cyan-400 font-mono uppercase">Branch Angle</label>
          <input type="range" id="angle" min="0" max="90" value="30" class="accent-cyan-500 w-32">
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-emerald-400 font-mono uppercase">Depth</label>
          <input type="range" id="depth" min="1" max="12" value="9" class="accent-emerald-500 w-32">
        </div>
        <div class="flex items-center gap-2 ml-auto">
          <button id="resetView" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono text-xs transition-colors border border-white/10" title="Reset View">
            Reset View
          </button>
          <button id="generate" class="px-4 py-2 bg-cyan-600/80 hover:bg-cyan-500 text-white rounded-lg font-mono text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-400/30">
            Generate New
          </button>
        </div>
      </div>
      <div class="flex-1 relative bg-slate-950/50 rounded-xl border border-white/10 overflow-hidden shadow-inner backdrop-blur-sm cursor-grab active:cursor-grabbing">
        <canvas id="fractalCanvas" class="absolute inset-0 w-full h-full"></canvas>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#fractalCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const angleInput = container.querySelector('#angle') as HTMLInputElement;
  const depthInput = container.querySelector('#depth') as HTMLInputElement;
  const generateBtn = container.querySelector('#generate') as HTMLButtonElement;
  const resetViewBtn = container.querySelector('#resetView') as HTMLButtonElement;

  let width = 0;
  let height = 0;
  let seed = Math.random() * 360;
  
  // Pan and Zoom state
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  
  const history = new HistoryManager<FractalState>({ angle: 30, depth: 9 });

  function resize() {
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    width = rect.width;
    height = rect.height;
    draw();
  }

  function drawBranch(x: number, y: number, len: number, angle: number, depth: number, colorStart: number) {
    ctx.beginPath();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI / 180);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    
    // Gradient stroke
    ctx.strokeStyle = `hsl(${colorStart + depth * 10}, 70%, 60%)`;
    // Scale line width inversely to zoom so lines don't get too thick
    ctx.lineWidth = (depth * 0.5 + 0.5) / Math.max(0.5, Math.sqrt(scale));
    ctx.stroke();

    if (depth > 0) {
      const branchAngle = parseInt(angleInput.value);
      drawBranch(0, -len, len * 0.75, branchAngle, depth - 1, colorStart);
      drawBranch(0, -len, len * 0.75, -branchAngle, depth - 1, colorStart);
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    const depth = parseInt(depthInput.value);
    const startX = width / 2;
    const startY = height;
    const len = height / 4;
    
    // Add a glow effect
    ctx.shadowBlur = 10 / scale;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
    
    drawBranch(startX, startY, len, 0, depth, seed);
    
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function updateState() {
    const state = {
      angle: parseInt(angleInput.value),
      depth: parseInt(depthInput.value)
    };
    history.push(state);
    draw();
  }

  function applyState(state: FractalState) {
    angleInput.value = state.angle.toString();
    depthInput.value = state.depth.toString();
    draw();
  }

  // Initial draw
  setTimeout(resize, 0);
  window.addEventListener('resize', resize);

  // Pan and Zoom Event Listeners
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    offsetX += dx;
    offsetY += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    draw();
  };

  const handleMouseUp = () => {
    isDragging = false;
  };

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.max(0.1, Math.min(scale * Math.exp(delta), 10));
    
    // Zoom towards mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new offset to keep mouse point fixed
    offsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
    offsetY = mouseY - (mouseY - offsetY) * (newScale / scale);
    
    scale = newScale;
    draw();
  }, { passive: false });

  resetViewBtn.addEventListener('click', () => {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    draw();
  });

  // Event Listeners
  // We use 'change' for history to avoid spamming stack while dragging
  angleInput.addEventListener('change', updateState);
  depthInput.addEventListener('change', updateState);
  
  // Real-time update
  angleInput.addEventListener('input', draw);
  depthInput.addEventListener('input', draw);
  
  generateBtn.addEventListener('click', () => {
    seed = Math.random() * 360;
    draw();
  });

  return {
    unmount: () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    },
    undo: () => {
      const prev = history.undo();
      if (prev) applyState(prev);
    },
    redo: () => {
      const next = history.redo();
      if (next) applyState(next);
    }
  };
}
