import { SettingsManager } from '../utils/settings';
import { HistoryManager } from '../utils/history';

interface MontyStats {
  switch: { wins: number, total: number };
  stay: { wins: number, total: number };
}

export function initMonty(container: HTMLElement, settings: SettingsManager) {
  container.innerHTML = `
    <div class="flex flex-col h-full gap-4">
      <div class="flex flex-wrap gap-4 items-center p-4 bg-slate-900/30 rounded-xl border border-white/10 backdrop-blur-md justify-between">
        <div class="flex gap-8 font-mono text-sm">
          <div class="flex flex-col">
            <span class="text-slate-500 text-xs uppercase">Total Games</span>
            <span class="text-xl font-bold text-white" id="totalGames">0</span>
          </div>
          <div class="flex flex-col">
            <span class="text-emerald-500/80 text-xs uppercase">Switch Wins</span>
            <span class="text-xl font-bold text-emerald-400" id="switchWins">0</span>
          </div>
          <div class="flex flex-col">
            <span class="text-rose-500/80 text-xs uppercase">Stay Wins</span>
            <span class="text-xl font-bold text-rose-400" id="stayWins">0</span>
          </div>
        </div>
        <button id="reset" class="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600/30 rounded-lg font-mono text-sm transition-all hover:text-white">
          Reset Stats
        </button>
      </div>
      
      <div class="flex-1 relative bg-slate-950/50 rounded-xl border border-white/10 overflow-y-auto shadow-inner flex flex-col items-center justify-center gap-8 backdrop-blur-sm">
        <div class="text-2xl font-mono font-bold text-cyan-400 animate-pulse" id="instruction">
          Choose a door to begin
        </div>
        
        <div class="flex gap-4 md:gap-8">
          ${[1, 2, 3].map(i => `
            <div class="door-container group relative w-24 h-40 md:w-32 md:h-56 perspective-1000 cursor-pointer" data-door="${i}">
              <div class="door-inner relative w-full h-full transition-transform duration-700 transform-style-3d">
                <!-- Front -->
                <div class="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-lg flex items-center justify-center backface-hidden group-hover:border-cyan-500/50 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <span class="text-4xl font-mono font-bold text-slate-600 group-hover:text-cyan-500/50 transition-colors">${i}</span>
                </div>
                <!-- Back -->
                <div class="door-content absolute inset-0 bg-slate-900 border-2 border-slate-700 rounded-lg flex items-center justify-center backface-hidden rotate-y-180">
                  <!-- Content injected via JS -->
                </div>
              </div>
              <!-- Selection Indicator -->
              <div class="selection-indicator absolute -bottom-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4] opacity-0 transition-opacity duration-300"></div>
            </div>
          `).join('')}
        </div>
        
        <div id="controls" class="hidden flex gap-4">
          <button id="stayBtn" class="px-6 py-3 bg-slate-700/80 hover:bg-slate-600 text-white rounded-xl font-mono font-bold shadow-lg transition-all border border-slate-500/30">STAY</button>
          <button id="switchBtn" class="px-6 py-3 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-xl font-mono font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all border border-emerald-500/30">SWITCH</button>
        </div>
      </div>
    </div>
  `;

  let state: 'PICK' | 'REVEAL' | 'DECIDE' | 'RESULT' = 'PICK';
  let prizeDoor = 0;
  let pickedDoor = 0;
  let revealedDoor = 0;
  
  let stats: MontyStats = {
    switch: { wins: 0, total: 0 },
    stay: { wins: 0, total: 0 }
  };
  
  const history = new HistoryManager<MontyStats>(stats);

  const instruction = container.querySelector('#instruction')!;
  const controls = container.querySelector('#controls')!;
  
  function initGame() {
    state = 'PICK';
    prizeDoor = Math.floor(Math.random() * 3) + 1;
    pickedDoor = 0;
    revealedDoor = 0;
    
    instruction.textContent = "Choose a door to begin";
    controls.classList.add('hidden');
    
    [1, 2, 3].forEach(i => {
      const doorContainer = container.querySelector(`.door-container[data-door="${i}"]`) as HTMLElement;
      const doorInner = doorContainer.querySelector('.door-inner') as HTMLElement;
      const indicator = doorContainer.querySelector('.selection-indicator') as HTMLElement;
      const content = doorContainer.querySelector('.door-content') as HTMLElement;
      
      // Reset styles
      doorInner.style.transform = 'rotateY(0deg)';
      indicator.classList.remove('opacity-100');
      indicator.classList.add('opacity-0');
      content.innerHTML = '';
      
      // Reset click handler
      doorContainer.onclick = () => handleDoorClick(i);
    });
  }

  function handleDoorClick(doorNum: number) {
    if (state !== 'PICK') return;
    
    pickedDoor = doorNum;
    state = 'REVEAL';
    
    // Highlight picked
    const indicator = container.querySelector(`.door-container[data-door="${pickedDoor}"] .selection-indicator`) as HTMLElement;
    indicator.classList.remove('opacity-0');
    indicator.classList.add('opacity-100');
    
    // Reveal a goat
    do {
      revealedDoor = Math.floor(Math.random() * 3) + 1;
    } while (revealedDoor === prizeDoor || revealedDoor === pickedDoor);
    
    setTimeout(() => {
      const goatDoorInner = container.querySelector(`.door-container[data-door="${revealedDoor}"] .door-inner`) as HTMLElement;
      const content = goatDoorInner.querySelector('.door-content')!;
      content.innerHTML = '<span class="text-4xl">🐐</span>'; // Goat
      goatDoorInner.style.transform = 'rotateY(180deg)';
      
      instruction.textContent = `Door ${revealedDoor} has a goat! Switch or Stay?`;
      state = 'DECIDE';
      controls.classList.remove('hidden');
    }, 500);
  }

  function handleDecision(switchDoor: boolean) {
    if (state !== 'DECIDE') return;
    
    const finalDoor = switchDoor 
      ? [1, 2, 3].find(d => d !== pickedDoor && d !== revealedDoor)!
      : pickedDoor;
      
    const win = finalDoor === prizeDoor;
    
    // Update stats
    if (switchDoor) {
      stats.switch.total++;
      if (win) stats.switch.wins++;
    } else {
      stats.stay.total++;
      if (win) stats.stay.wins++;
    }
    
    history.push(stats);
    updateStats();
    
    // Reveal all
    state = 'RESULT';
    controls.classList.add('hidden');
    instruction.textContent = win ? "YOU WON! 🎉" : "You lost... 🐐";
    
    [1, 2, 3].forEach(i => {
      const doorInner = container.querySelector(`.door-container[data-door="${i}"] .door-inner`) as HTMLElement;
      const content = doorInner.querySelector('.door-content')!;
      
      if (i === prizeDoor) {
        content.innerHTML = '<span class="text-4xl">🚗</span>'; // Car
      } else {
        content.innerHTML = '<span class="text-4xl">🐐</span>';
      }
      
      // Open all doors
      doorInner.style.transform = 'rotateY(180deg)';
    });
    
    setTimeout(initGame, 3000);
  }

  function updateStats() {
    const switchPct = stats.switch.total ? Math.round((stats.switch.wins / stats.switch.total) * 100) : 0;
    const stayPct = stats.stay.total ? Math.round((stats.stay.wins / stats.stay.total) * 100) : 0;
    
    container.querySelector('#switchWins')!.textContent = `${switchPct}% (${stats.switch.wins}/${stats.switch.total})`;
    container.querySelector('#stayWins')!.textContent = `${stayPct}% (${stats.stay.wins}/${stats.stay.total})`;
  }

  container.querySelector('#stayBtn')!.addEventListener('click', () => handleDecision(false));
  container.querySelector('#switchBtn')!.addEventListener('click', () => handleDecision(true));
  container.querySelector('#reset')!.addEventListener('click', () => {
    stats = { switch: { wins: 0, total: 0 }, stay: { wins: 0, total: 0 } };
    history.push(stats);
    updateStats();
    initGame();
  });

  initGame();

  return {
    unmount: () => {},
    undo: () => {
      const prev = history.undo();
      if (prev) {
        stats = prev;
        updateStats();
      }
    },
    redo: () => {
      const next = history.redo();
      if (next) {
        stats = next;
        updateStats();
      }
    }
  };
}
