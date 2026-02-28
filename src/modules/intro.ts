
export function initIntro(onComplete: () => void) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-mono';
  
  overlay.innerHTML = `
    <!-- Background Grid -->
    <div class="absolute inset-0 radar-grid opacity-20 pointer-events-none"></div>
    
    <!-- Radar Scan Line -->
    <div class="absolute inset-0 w-full h-20 scan-line pointer-events-none z-0"></div>
    
    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center gap-12 max-w-2xl px-6 text-center">
      
      <!-- Holographic Planet -->
      <div class="relative w-48 h-48 md:w-64 md:h-64">
        <div class="absolute inset-0 rounded-full border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] bg-slate-950/50 backdrop-blur-sm"></div>
        <!-- Rings -->
        <svg class="absolute inset-0 w-full h-full text-cyan-500/40 animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100">
          <ellipse cx="50" cy="50" rx="48" ry="10" fill="none" stroke="currentColor" stroke-width="0.5" transform="rotate(0 50 50)" />
          <ellipse cx="50" cy="50" rx="48" ry="10" fill="none" stroke="currentColor" stroke-width="0.5" transform="rotate(45 50 50)" />
          <ellipse cx="50" cy="50" rx="48" ry="10" fill="none" stroke="currentColor" stroke-width="0.5" transform="rotate(90 50 50)" />
          <ellipse cx="50" cy="50" rx="48" ry="10" fill="none" stroke="currentColor" stroke-width="0.5" transform="rotate(135 50 50)" />
        </svg>
        <!-- Core -->
        <div class="absolute inset-0 m-auto w-32 h-32 rounded-full bg-gradient-to-br from-cyan-900/50 to-slate-900/50 border border-cyan-400/20 flex items-center justify-center">
           <div class="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] animate-pulse"></div>
        </div>
      </div>

      <!-- Glitch Headline -->
      <h1 class="text-4xl md:text-6xl font-bold text-white tracking-tighter glitch-text" data-text="MATHLOGIC LAB">
        MATHLOGIC LAB
      </h1>

      <!-- Typewriter Text -->
      <div class="h-24 flex items-center justify-center">
        <p id="typewriter" class="text-cyan-400/80 text-lg md:text-xl leading-relaxed max-w-lg"></p>
        <span class="w-2 h-6 bg-cyan-500 ml-1 cursor-blink"></span>
      </div>

      <!-- Console Switch Button -->
      <button id="enterBtn" class="group relative px-8 py-4 bg-transparent overflow-hidden rounded-sm transition-all duration-300 hover:scale-105 active:scale-95 opacity-0 translate-y-4 transition-all duration-700 delay-1000">
        <!-- Button Borders -->
        <div class="absolute inset-0 border-2 border-slate-700 group-hover:border-emerald-500 transition-colors duration-300"></div>
        <div class="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <!-- Background Fill -->
        <div class="absolute inset-0 bg-emerald-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
        
        <!-- Text -->
        <span class="relative z-10 font-mono font-bold text-slate-300 group-hover:text-emerald-400 tracking-widest uppercase">
          [ Return To Earth ]
        </span>
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);

  // Typewriter Logic
  const text = "Initializing scientific dashboard... \nLoading modules... \nSystem ready.";
  const typeEl = overlay.querySelector('#typewriter')!;
  const btn = overlay.querySelector('#enterBtn') as HTMLElement;
  let i = 0;

  function type() {
    if (i < text.length) {
      const char = text.charAt(i);
      typeEl.innerHTML += char === '\n' ? '<br/>' : char;
      i++;
      setTimeout(type, Math.random() * 50 + 30);
    } else {
      // Show button after typing
      setTimeout(() => {
        btn.classList.remove('opacity-0', 'translate-y-4');
      }, 500);
    }
  }

  // Start typing after a short delay
  setTimeout(type, 800);

  // Button Interaction
  btn.addEventListener('click', () => {
    // Sound effect could go here
    
    // Animate out
    overlay.style.transition = 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out';
    overlay.style.opacity = '0';
    overlay.style.transform = 'scale(1.1)';
    
    setTimeout(() => {
      overlay.remove();
      onComplete();
    }, 800);
  });
}
