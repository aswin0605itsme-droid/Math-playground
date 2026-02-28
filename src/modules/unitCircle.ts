import { SettingsManager } from '../utils/settings';

export function initUnitCircle(container: HTMLElement, settings: SettingsManager) {
  container.innerHTML = `
    <div class="flex flex-col h-full gap-4">
      <div class="flex flex-wrap gap-4 items-center p-4 bg-slate-900/30 rounded-xl border border-white/10 backdrop-blur-md justify-between">
        <div class="flex gap-8 font-mono text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]"></div>
            <span class="text-slate-400">Sin(θ) = </span>
            <span id="sinVal" class="text-rose-400 font-bold">0.00</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></div>
            <span class="text-slate-400">Cos(θ) = </span>
            <span id="cosVal" class="text-cyan-400 font-bold">1.00</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-400">θ = </span>
            <span id="angleVal" class="text-white font-bold">0°</span>
          </div>
        </div>
      </div>
      <div class="flex-1 relative bg-slate-950/50 rounded-xl border border-white/10 overflow-hidden shadow-inner cursor-crosshair backdrop-blur-sm">
        <canvas id="unitCanvas" class="absolute inset-0 w-full h-full"></canvas>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#unitCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  
  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let radius = 0;
  let angle = 0; // Radians
  let isDragging = false;

  function resize() {
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    width = rect.width;
    height = rect.height;
    centerX = width / 2;
    centerY = height / 2;
    radius = Math.min(width, height) / 3;
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical lines
    for (let x = centerX % 50; x < width; x += 50) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    // Horizontal lines
    for (let y = centerY % 50; y < height; y += 50) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
    ctx.stroke();

    // Circle
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Point on circle
    const px = centerX + Math.cos(angle) * radius;
    const py = centerY - Math.sin(angle) * radius; // Canvas Y is inverted

    // Cosine Line (Horizontal)
    ctx.strokeStyle = '#06b6d4'; // Cyan
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, py);
    ctx.lineTo(px, py);
    ctx.stroke();
    
    // Sine Line (Vertical)
    ctx.strokeStyle = '#f43f5e'; // Rose
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, centerY);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Radius Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Angle Arc
    ctx.strokeStyle = '#fbbf24'; // Amber
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, -angle, angle > 0); // Counter clockwise for positive angle visually
    ctx.stroke();

    // Point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Update Text
    const deg = (angle * 180 / Math.PI + 360) % 360;
    container.querySelector('#sinVal')!.textContent = Math.sin(angle).toFixed(2);
    container.querySelector('#cosVal')!.textContent = Math.cos(angle).toFixed(2);
    container.querySelector('#angleVal')!.textContent = `${deg.toFixed(0)}°`;
  }

  function handleInput(e: MouseEvent | TouchEvent) {
    if (!isDragging && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    
    // Atan2 returns angle from X axis. Canvas Y is down, so we invert Y for math
    angle = Math.atan2(-y, x);
    draw();
  }

  canvas.addEventListener('mousedown', (e) => { isDragging = true; handleInput(e); });
  canvas.addEventListener('mousemove', handleInput);
  
  canvas.addEventListener('touchstart', (e) => { isDragging = true; handleInput(e); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleInput(e); }, { passive: false });

  const stopDragging = () => isDragging = false;
  window.addEventListener('mouseup', stopDragging);
  window.addEventListener('touchend', stopDragging);

  window.addEventListener('resize', resize);
  setTimeout(resize, 0);

  return {
    unmount: () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchend', stopDragging);
    }
  };
}
