import { SettingsManager } from '../utils/settings';
import { HistoryManager } from '../utils/history';

export function initProjectile(container: HTMLElement, settings: SettingsManager) {
  container.innerHTML = `
    <div class="flex flex-col h-full gap-4">
      <div class="flex flex-wrap gap-4 items-center p-4 bg-slate-900/50 rounded-xl border border-white/5 backdrop-blur-sm dark:bg-slate-900/50 bg-white/50 border-slate-200 dark:border-white/5 justify-between">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-slate-400 font-mono uppercase">Angle</label>
          <input type="range" id="angle" min="0" max="90" value="45" class="accent-cyan-500 w-32">
          <span id="angleDisplay" class="text-xs text-right text-cyan-400">45°</span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-slate-400 font-mono uppercase">Velocity</label>
          <input type="range" id="velocity" min="10" max="150" value="${settings.get('defaultProjectileVelocity')}" class="accent-emerald-500 w-32">
          <span id="velocityDisplay" class="text-xs text-right text-emerald-400">${settings.get('defaultProjectileVelocity')} m/s</span>
        </div>
        <button id="fire" class="ml-auto px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-rose-500/20">
          FIRE
        </button>
        <button id="clear" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
          Clear
        </button>
      </div>
      <div class="flex-1 relative bg-slate-950 rounded-xl border border-white/10 overflow-hidden shadow-inner">
        <!-- Starfield -->
        <div class="absolute inset-0 pointer-events-none opacity-40" style="background-image: radial-gradient(white 1px, transparent 1px); background-size: 60px 60px;"></div>
        <!-- Moon Surface -->
        <div class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-900 to-transparent opacity-80"></div>
        
        <canvas id="projCanvas" class="absolute inset-0 w-full h-full"></canvas>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#projCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const angleInput = container.querySelector('#angle') as HTMLInputElement;
  const velocityInput = container.querySelector('#velocity') as HTMLInputElement;
  const angleDisplay = container.querySelector('#angleDisplay')!;
  const velocityDisplay = container.querySelector('#velocityDisplay')!;
  
  let width = 0;
  let height = 0;
  let animationId: number;
  
  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
  }

  interface Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    trail: {x: number, y: number}[];
    active: boolean;
  }
  
  let projectiles: Projectile[] = [];
  let particles: Particle[] = [];
  
  // History stores the array state
  const history = new HistoryManager<number>(0);

  function resize() {
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    width = rect.width;
    height = rect.height;
  }

  function createExplosion(x: number, y: number, color: string, count: number, speed: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed;
      particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1
      });
    }
  }

  function update() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw Ground (Moon Surface)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height - 20);
    // Rough terrain
    for (let i = 0; i <= width; i += 20) {
       ctx.lineTo(i, height - 20 - Math.sin(i * 0.05) * 5);
    }
    ctx.lineTo(width, height);
    ctx.fill();
    
    // Draw Cannon
    const angleRad = parseInt(angleInput.value) * Math.PI / 180;
    ctx.save();
    ctx.translate(50, height - 30);
    ctx.rotate(-angleRad);
    
    // Cannon Body
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, -10, 60, 20);
    
    ctx.restore();
    
    // Cannon Base
    ctx.beginPath();
    ctx.arc(50, height - 30, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();
    
    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.size *= 0.95;
      
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      
      if (p.active) {
        // Physics (Moon Gravity is ~1.62, but let's keep it fun)
        p.x += p.vx * 0.1; 
        p.y += p.vy * 0.1;
        p.vy += 9.8 * 0.1; 
        
        // Trail
        if (p.trail.length === 0 || Math.hypot(p.x - p.trail[p.trail.length-1].x, p.y - p.trail[p.trail.length-1].y) > 5) {
          p.trail.push({x: p.x, y: p.y});
        }
        
        // Collision
        const groundY = height - 20 - Math.sin(p.x * 0.05) * 5;
        
        if (p.y > groundY) {
          p.y = groundY;
          p.vy *= -0.6; // Bounce
          p.vx *= 0.8; // Friction
          
          // Dust Cloud on impact
          if (Math.abs(p.vy) > 2) {
             createExplosion(p.x, p.y, '#94a3b8', 5, 2);
          }
          
          if (Math.abs(p.vy) < 1 && Math.abs(p.vx) < 1) {
            p.active = false;
          }
        }
        
        if (p.x > width) {
            p.active = false;
        }
      }
      
      // Draw Trail (Glowing Plasma)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f43f5e';
      if (p.trail.length > 0) {
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (const pt of p.trail) ctx.lineTo(pt.x, pt.y);
      }
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Draw Ball (Glowing Core)
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.fillStyle = 'rgba(244, 63, 94, 0.8)';
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    animationId = requestAnimationFrame(update);
  }

  function fire() {
    const angleDeg = parseInt(angleInput.value);
    const angleRad = angleDeg * Math.PI / 180;
    const velocity = parseInt(velocityInput.value);
    
    const muzzleX = 50 + Math.cos(angleRad) * 60;
    const muzzleY = height - 30 - Math.sin(angleRad) * 60;
    
    const p: Projectile = {
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(angleRad) * velocity,
      vy: -Math.sin(angleRad) * velocity,
      trail: [],
      active: true
    };
    
    projectiles.push(p);
    
    // Muzzle Flash
    createExplosion(muzzleX, muzzleY, '#fbbf24', 15, 4); // Fire/Gold
    createExplosion(muzzleX, muzzleY, '#f43f5e', 8, 2); // Red core
  }

  // Listeners
  angleInput.addEventListener('input', () => {
    angleDisplay.textContent = `${angleInput.value}°`;
  });
  
  velocityInput.addEventListener('input', () => {
    velocityDisplay.textContent = `${velocityInput.value} m/s`;
  });
  
  container.querySelector('#fire')!.addEventListener('click', fire);
  container.querySelector('#clear')!.addEventListener('click', () => {
    projectiles = [];
    particles = [];
    ctx.clearRect(0, 0, width, height);
  });

  window.addEventListener('resize', resize);
  
  // Initial setup
  setTimeout(() => {
    resize();
    update();
  }, 0);

  return {
    unmount: () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    },
    undo: () => {
      if (projectiles.length > 0) {
        projectiles.pop();
      }
    },
    redo: () => {
      // Not implemented for physics
    }
  };
}
