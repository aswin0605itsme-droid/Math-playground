import { SettingsManager } from '../utils/settings';

export function initPrimes(container: HTMLElement, settings: SettingsManager) {
  container.innerHTML = `
    <div class="flex flex-col h-full gap-4">
      <div class="flex flex-wrap gap-4 items-center p-4 bg-slate-900/50 rounded-xl border border-white/5 backdrop-blur-sm justify-between dark:bg-slate-900/50 bg-white/50 border-slate-200 dark:border-white/5">
        <div class="flex gap-4 items-center">
          <button id="startSieve" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20">
            Start Sieve
          </button>
          <button id="resetSieve" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
            Reset
          </button>
        </div>
        <div class="flex gap-4 text-xs font-mono uppercase text-slate-400">
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-rose-500 rounded-sm shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div> Prime</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-emerald-500/30 rounded-sm border border-emerald-500/50"></div> Composite</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-cyan-400 rounded-sm shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div> Scanning</div>
        </div>
      </div>
      
      <div class="flex-1 relative bg-slate-900/80 rounded-xl border border-white/10 shadow-inner p-4 flex items-start justify-center overflow-auto dark:bg-slate-900/80 bg-slate-950 border-slate-800 dark:border-white/10">
        <!-- Starfield Background -->
        <div class="absolute inset-0 pointer-events-none opacity-30" style="background-image: radial-gradient(white 1px, transparent 1px); background-size: 50px 50px;"></div>
        
        <div id="grid" class="grid grid-cols-10 gap-2 w-full max-w-2xl min-w-[600px] my-auto relative z-10">
          <!-- Cells injected here -->
        </div>
      </div>
    </div>
  `;

  const grid = container.querySelector('#grid')!;
  let isRunning = false;
  let shouldStop = false;

  function createGrid() {
    grid.innerHTML = '';
    for (let i = 1; i <= 100; i++) {
      const cell = document.createElement('div');
      cell.id = `cell-${i}`;
      cell.className = `
        relative flex items-center justify-center bg-slate-800/50 rounded-md text-slate-400 font-mono font-bold text-lg
        transition-all duration-300 border border-white/5 backdrop-blur-sm
      `;
      cell.textContent = i.toString();
      
      if (i === 1) {
        cell.classList.add('opacity-30');
      }
      
      grid.appendChild(cell);
    }
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function runSieve() {
    if (isRunning) return;
    isRunning = true;
    shouldStop = false;
    
    // Reset styles
    createGrid();

    for (let i = 2; i <= 100; i++) {
      if (shouldStop) break;
      
      const cell = grid.querySelector(`#cell-${i}`) as HTMLElement;
      
      // If already marked composite, skip
      if (cell.classList.contains('composite')) continue;
      
      // Mark as Prime (Red/Rose for "Hot" star feel)
      cell.className = `
        relative flex items-center justify-center rounded-md font-mono font-bold text-lg
        transition-all duration-500 border border-rose-500/50 bg-rose-500/20 text-rose-200
        shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-110 z-10 prime
      `;
      
      await sleep(300);
      
      // Mark multiples
      for (let j = i * i; j <= 100; j += i) {
        if (shouldStop) break;
        
        const multiple = grid.querySelector(`#cell-${j}`) as HTMLElement;
        if (!multiple.classList.contains('composite')) {
          // Highlight current processing (Cyan Scan)
          const originalClass = multiple.className;
          multiple.className = `
            relative flex items-center justify-center rounded-md font-mono font-bold text-lg
            bg-cyan-500 text-black scale-105 z-20 shadow-[0_0_20px_rgba(6,182,212,0.8)]
            transition-none
          `;
          
          await sleep(50);
          
          // Mark as Composite (Green/Emerald for "Safe/Done")
          multiple.className = `
            relative flex items-center justify-center rounded-md font-mono font-bold text-lg
            transition-all duration-500 border border-emerald-500/20 bg-emerald-900/20 text-emerald-600/50
            scale-90 opacity-60 composite
          `;
        }
      }
    }
    
    isRunning = false;
  }

  container.querySelector('#startSieve')!.addEventListener('click', runSieve);
  container.querySelector('#resetSieve')!.addEventListener('click', () => {
    shouldStop = true;
    isRunning = false;
    createGrid();
  });

  createGrid();

  return {
    unmount: () => {
      shouldStop = true;
    }
  };
}
