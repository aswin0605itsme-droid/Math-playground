import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsManager } from './utils/settings';
import { VigilStreak } from './components/VigilStreak';

// SVG Icons
const icons = {
  fractal: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-network"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>`,
  sorting: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart-2"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>`,
  monty: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-door-open"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1a2 2 0 0 1 2.485 1.94Z"/></svg>`,
  unit: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-dashed"><path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0"/><path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7"/><path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8"/><path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69"/><path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0"/><path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7"/><path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8"/><path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69"/></svg>`,
  primes: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grid-3x3"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`,
  projectile: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rocket"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  life: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-microscope"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 1 1-2-2V6h6v4a2 2 0 1 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>`,
  community: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  guardian: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  undo: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-undo-2"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>`,
  redo: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-redo-2"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
};

// Module Interface
interface ModuleInstance {
  unmount: () => void;
  undo?: () => void;
  redo?: () => void;
}

interface Module {
  id: string;
  name: string;
  icon: string;
  mount: (container: HTMLElement, settings: SettingsManager) => Promise<ModuleInstance>;
}

// State
const settingsManager = new SettingsManager();
let currentModuleId = settingsManager.get('lastModule') || 'fractal';
let activeModule: ModuleInstance | null = null;

// Global WebSocket for tracking
let globalWs: WebSocket | null = null;
const USER_ID = 'me'; // In a real app, this would be from auth
const USER_NAME = 'You';

function setupGlobalWs() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  globalWs = new WebSocket(`${protocol}//${window.location.host}`);
  globalWs.onopen = () => {
    globalWs?.send(JSON.stringify({ type: 'join', userId: USER_ID, userName: USER_NAME }));
    globalWs?.send(JSON.stringify({ type: 'navigate', module: currentModuleId }));
  };
}
setupGlobalWs();

// DOM Elements
const app = document.getElementById('app')!;
const nav = document.createElement('nav');
const main = document.createElement('main');

// Setup Layout
app.className = 'flex h-screen space-bg radar-grid text-slate-100 font-mono overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-300';
nav.className = 'w-20 md:w-64 flex-shrink-0 border-r border-white/10 bg-slate-900/20 backdrop-blur-md flex flex-col items-center md:items-stretch py-6 gap-2 z-10';
main.className = 'flex-1 relative overflow-hidden flex flex-col';

app.appendChild(nav);
app.appendChild(main);

// Header inside main
const header = document.createElement('header');
header.className = 'h-16 border-b border-white/10 bg-slate-900/20 backdrop-blur-md flex items-center px-6 justify-between';
header.innerHTML = `
  <div class="flex items-center gap-4">
    <h1 class="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent tracking-tight glitch-text" data-text="MathLogic Lab">MathLogic Lab</h1>
    <div id="architectTrigger" class="text-xs text-slate-500 font-mono hidden md:block cursor-pointer select-none">v1.1.0 • Scientific Mode</div>
  </div>
  <div class="flex items-center gap-2">
    <div id="streak-root"></div>
    <div class="w-px h-6 bg-white/10 mx-2"></div>
    <button id="undoBtn" class="p-2 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors" title="Undo">
      ${icons.undo}
    </button>
    <button id="redoBtn" class="p-2 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors" title="Redo">
      ${icons.redo}
    </button>
    <div class="w-px h-6 bg-white/10 mx-2"></div>
    <button id="settingsBtn" class="p-2 text-slate-400 hover:text-white transition-colors" title="Settings">
      ${icons.settings}
    </button>
  </div>
`;
main.appendChild(header);

const contentContainer = document.createElement('div');
contentContainer.className = 'flex-1 relative overflow-hidden p-4 md:p-6';
main.appendChild(contentContainer);

// Settings Modal
const modal = document.createElement('div');
modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300';
modal.innerHTML = `
  <div class="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-95 transition-transform duration-300 dark:bg-slate-900 dark:border-white/10 bg-white border-slate-200 text-slate-900 dark:text-slate-100">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold">Settings</h2>
      <button id="closeSettings" class="text-slate-400 hover:text-white transition-colors">${icons.close}</button>
    </div>
    
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <label class="font-medium">Dark Mode</label>
        <button id="themeToggle" class="w-12 h-6 rounded-full bg-slate-700 relative transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
          <div class="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200"></div>
        </button>
      </div>
      
      <div class="space-y-2">
        <div class="flex justify-between">
          <label class="text-sm font-medium text-slate-400">Default Sort Speed</label>
          <span id="sortSpeedVal" class="text-sm font-mono text-cyan-500">50</span>
        </div>
        <input type="range" id="sortSpeedInput" min="1" max="100" class="w-full accent-cyan-500">
      </div>
      
      <div class="space-y-2">
        <div class="flex justify-between">
          <label class="text-sm font-medium text-slate-400">Default Projectile Velocity</label>
          <span id="projVelVal" class="text-sm font-mono text-emerald-500">80</span>
        </div>
        <input type="range" id="projVelInput" min="10" max="150" class="w-full accent-emerald-500">
      </div>

      <div class="space-y-2">
        <div class="flex justify-between">
          <label class="text-sm font-medium text-slate-400">Default Life Speed</label>
          <span id="lifeSpeedVal" class="text-sm font-mono text-cyan-500">30</span>
        </div>
        <input type="range" id="lifeSpeedInput" min="1" max="60" class="w-full accent-cyan-500">
      </div>
    </div>
    
    <div class="mt-8 pt-6 border-t border-white/10 text-xs text-center text-slate-500">
      Changes are saved automatically.
    </div>
  </div>
`;
document.body.appendChild(modal);

// Settings Logic
const settingsBtn = document.getElementById('settingsBtn')!;
const closeSettings = document.getElementById('closeSettings')!;
const themeToggle = document.getElementById('themeToggle')!;
const sortSpeedInput = document.getElementById('sortSpeedInput') as HTMLInputElement;
const projVelInput = document.getElementById('projVelInput') as HTMLInputElement;
const lifeSpeedInput = document.getElementById('lifeSpeedInput') as HTMLInputElement;

function openSettings() {
  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.querySelector('div')!.classList.remove('scale-95');
  modal.querySelector('div')!.classList.add('scale-100');
  
  // Populate values
  const s = settingsManager;
  const isDark = s.get('theme') === 'dark';
  updateThemeToggle(isDark);
  
  sortSpeedInput.value = s.get('defaultSortSpeed').toString();
  document.getElementById('sortSpeedVal')!.textContent = sortSpeedInput.value;
  
  projVelInput.value = s.get('defaultProjectileVelocity').toString();
  document.getElementById('projVelVal')!.textContent = projVelInput.value;

  lifeSpeedInput.value = s.get('defaultLifeSpeed').toString();
  document.getElementById('lifeSpeedVal')!.textContent = lifeSpeedInput.value;
}

function closeSettingsModal() {
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.querySelector('div')!.classList.add('scale-95');
  modal.querySelector('div')!.classList.remove('scale-100');
}

function updateThemeToggle(isDark: boolean) {
  const knob = themeToggle.querySelector('div')!;
  if (isDark) {
    themeToggle.classList.add('bg-cyan-600');
    themeToggle.classList.remove('bg-slate-700');
    knob.classList.add('translate-x-6');
  } else {
    themeToggle.classList.remove('bg-cyan-600');
    themeToggle.classList.add('bg-slate-700');
    knob.classList.remove('translate-x-6');
  }
}

settingsBtn.onclick = openSettings;
closeSettings.onclick = closeSettingsModal;

themeToggle.onclick = () => {
  const current = settingsManager.get('theme');
  const next = current === 'dark' ? 'light' : 'dark';
  settingsManager.set('theme', next);
  updateThemeToggle(next === 'dark');
};

sortSpeedInput.oninput = () => {
  const val = parseInt(sortSpeedInput.value);
  document.getElementById('sortSpeedVal')!.textContent = val.toString();
  settingsManager.set('defaultSortSpeed', val);
};

projVelInput.oninput = () => {
  const val = parseInt(projVelInput.value);
  document.getElementById('projVelVal')!.textContent = val.toString();
  settingsManager.set('defaultProjectileVelocity', val);
};

lifeSpeedInput.oninput = () => {
  const val = parseInt(lifeSpeedInput.value);
  document.getElementById('lifeSpeedVal')!.textContent = val.toString();
  settingsManager.set('defaultLifeSpeed', val);
};


// Module Registry
const modules: Record<string, Module> = {
  fractal: {
    id: 'fractal',
    name: 'Fractal Tree',
    icon: icons.fractal,
    mount: async (container, settings) => {
      const { initFractal } = await import('./modules/fractal');
      return initFractal(container, settings);
    }
  },
  sorting: {
    id: 'sorting',
    name: 'Sorting Viz',
    icon: icons.sorting,
    mount: async (container, settings) => {
      const { initSorting } = await import('./modules/sorting');
      return initSorting(container, settings);
    }
  },
  monty: {
    id: 'monty',
    name: 'Monty Hall',
    icon: icons.monty,
    mount: async (container, settings) => {
      const { initMonty } = await import('./modules/monty');
      return initMonty(container, settings);
    }
  },
  unit: {
    id: 'unit',
    name: 'Unit Circle',
    icon: icons.unit,
    mount: async (container, settings) => {
      const { initUnitCircle } = await import('./modules/unitCircle');
      return initUnitCircle(container, settings);
    }
  },
  primes: {
    id: 'primes',
    name: 'Prime Sieve',
    icon: icons.primes,
    mount: async (container, settings) => {
      const { initPrimes } = await import('./modules/primes');
      return initPrimes(container, settings);
    }
  },
  projectile: {
    id: 'projectile',
    name: 'Projectile Lab',
    icon: icons.projectile,
    mount: async (container, settings) => {
      const { initProjectile } = await import('./modules/projectile');
      return initProjectile(container, settings);
    }
  },
  life: {
    id: 'life',
    name: 'Game of Life',
    icon: icons.life,
    mount: async (container, settings) => {
      const { initLife } = await import('./modules/life');
      return initLife(container, settings);
    }
  },
  community: {
    id: 'community',
    name: 'Community',
    icon: icons.community,
    mount: async (container) => {
      const { initCommunity } = await import('./modules/community');
      return initCommunity(container);
    }
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    icon: icons.guardian,
    mount: async (container) => {
      const { initGuardian } = await import('./modules/guardian');
      return initGuardian(container);
    }
  },
  architect: {
    id: 'architect',
    name: 'Architect',
    icon: icons.guardian,
    mount: async (container) => {
      const { initArchitect } = await import('./modules/architect');
      return initArchitect(container);
    }
  }
};

// Undo/Redo Global Handlers
const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;

function updateUndoRedoUI() {
  // We can't easily check 'canUndo' without exposing it on the interface or polling
  // For now, we'll just enable them if the method exists, or maybe we can add a callback mechanism
  // Let's assume modules will trigger a UI update event or we just keep them enabled if supported
  
  // Better approach: Modules dispatch a custom event 'history-change' when stack changes
  // But for simplicity, we'll just enable them if the module supports the feature
  const supportsUndo = !!activeModule?.undo;
  undoBtn.disabled = !supportsUndo;
  redoBtn.disabled = !supportsUndo;
}

undoBtn.onclick = () => {
  if (activeModule?.undo) {
    activeModule.undo();
    // Trigger a refresh of UI state if needed?
  }
};

redoBtn.onclick = () => {
  if (activeModule?.redo) {
    activeModule.redo();
  }
};

// Navigation Logic
function renderNav() {
  nav.innerHTML = '';
  
  // Logo area for mobile
  const logo = document.createElement('div');
  logo.className = 'mb-6 px-4 md:hidden';
  logo.innerHTML = `<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">M</div>`;
  nav.appendChild(logo);

  Object.values(modules).forEach(mod => {
    if (mod.id === 'architect') return; // Hide architect from sidebar
    const btn = document.createElement('button');
    const isActive = mod.id === currentModuleId;
    
    btn.className = `
      group relative w-full px-4 py-3 flex items-center gap-3 transition-all duration-300 ease-out
      ${isActive ? 'text-cyan-400 dark:text-cyan-400 text-cyan-600' : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 text-slate-500 hover:text-slate-800'}
    `;
    
    btn.innerHTML = `
      <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mx-2 rounded-xl dark:bg-white/5 bg-black/5"></div>
      ${isActive ? '<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>' : ''}
      <div class="relative z-10 flex items-center justify-center w-6 h-6 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'scale-110' : ''}">
        ${mod.icon}
      </div>
      <span class="relative z-10 text-sm font-medium hidden md:block transition-transform duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}">
        ${mod.name}
      </span>
    `;
    
    btn.onclick = () => switchModule(mod.id);
    nav.appendChild(btn);
  });
}

async function switchModule(id: string) {
  if (currentModuleId === id && activeModule) return;
  
  // Update state
  currentModuleId = id;
  settingsManager.set('lastModule', id);
  renderNav();

  // Track movement
  if (globalWs && globalWs.readyState === WebSocket.OPEN) {
    globalWs.send(JSON.stringify({ type: 'navigate', module: id }));
  }
  
  // Cleanup previous
  if (activeModule) {
    activeModule.unmount();
    activeModule = null;
  }
  
  // Clear container with fade out
  contentContainer.style.opacity = '0';
  
  setTimeout(async () => {
    contentContainer.innerHTML = '';
    
    // Mount new
    const mod = modules[id];
    if (mod) {
      // Show loading state
      contentContainer.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      `;
      contentContainer.style.opacity = '1';
      
      try {
        // Clear loading
        contentContainer.innerHTML = '';
        const instance = await mod.mount(contentContainer, settingsManager);
        activeModule = instance || { unmount: () => {} };
        updateUndoRedoUI();
      } catch (e) {
        console.error(e);
        contentContainer.innerHTML = `<div class="text-red-400">Error loading module: ${e}</div>`;
      }
    }
  }, 200); // Wait for fade out
}

// Initial Render
function startApp() {
  renderNav();
  switchModule(currentModuleId);
  
  // Hidden Trigger for Architect Console
  let clickCount = 0;
  const trigger = document.getElementById('architectTrigger');
  if (trigger) {
    trigger.onclick = () => {
      clickCount++;
      if (clickCount >= 5) {
        switchModule('architect');
        clickCount = 0;
      }
    };
  }

  // Mount React components
  const streakRoot = document.getElementById('streak-root');
  if (streakRoot) {
    createRoot(streakRoot).render(React.createElement(VigilStreak));
  }
}

// Check if we should show intro
const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
if (!hasSeenIntro) {
  import('./modules/intro').then(({ initIntro }) => {
    initIntro(() => {
      sessionStorage.setItem('hasSeenIntro', 'true');
      startApp();
    });
  });
} else {
  startApp();
}
