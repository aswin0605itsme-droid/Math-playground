import { SettingsManager } from '../utils/settings';
import { HistoryManager } from '../utils/history';

export function initSorting(container: HTMLElement, settings: SettingsManager) {
  container.innerHTML = `
    <div class="flex flex-col h-full gap-4">
      <div class="flex flex-wrap gap-4 items-center p-4 bg-slate-900/30 rounded-xl border border-white/10 backdrop-blur-md justify-between">
        <div class="flex gap-2">
          <button id="bubbleSort" class="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 rounded-lg font-mono text-sm transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]">Bubble Sort</button>
          <button id="quickSort" class="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg font-mono text-sm transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]">Quick Sort</button>
        </div>
        
        <div class="flex gap-4 text-xs font-mono uppercase text-slate-400">
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-emerald-500 rounded-sm shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div> Compare</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-rose-500 rounded-sm shadow-[0_0_5px_rgba(244,63,94,0.5)]"></div> Swap</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-yellow-500 rounded-sm shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div> Pivot</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 bg-indigo-500 rounded-sm shadow-[0_0_5px_rgba(99,102,241,0.5)]"></div> Sorted</div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs text-cyan-400 font-mono uppercase">Speed</label>
          <input type="range" id="speed" min="1" max="100" value="${settings.get('defaultSortSpeed')}" class="accent-cyan-500 w-32">
        </div>
        <button id="reset" class="px-4 py-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg font-mono text-sm transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] border border-rose-400/30">
          Reset
        </button>
      </div>
      <div class="flex-1 relative bg-slate-950/50 rounded-xl border border-white/10 overflow-hidden shadow-inner flex items-end justify-center px-4 pb-4 backdrop-blur-sm" id="barsContainer">
        <!-- Bars injected here -->
      </div>
    </div>
  `;

  const barsContainer = container.querySelector('#barsContainer') as HTMLElement;
  const speedInput = container.querySelector('#speed') as HTMLInputElement;
  
  let array: number[] = [];
  let isSorting = false;
  const numBars = 50;
  
  // History stores the array state
  const history = new HistoryManager<number[]>([], 20);

  function renderBars(arr: number[]) {
    barsContainer.innerHTML = '';
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      const bar = document.createElement('div');
      bar.style.height = `${val}%`;
      bar.style.width = `${100 / numBars}%`;
      bar.className = 'bg-cyan-500/80 mx-[1px] rounded-t-sm transition-all duration-75';
      barsContainer.appendChild(bar);
    }
  }

  function generateArray(saveToHistory = true) {
    if (isSorting) return;
    const newArray = [];
    for (let i = 0; i < numBars; i++) {
      newArray.push(Math.floor(Math.random() * 95) + 5);
    }
    array = [...newArray];
    renderBars(array);
    if (saveToHistory) history.push([...array]);
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getDelay() {
    return 101 - parseInt(speedInput.value);
  }

  async function swap(i: number, j: number, bars: NodeListOf<HTMLElement>) {
    if (!isSorting) return;
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    
    bars[i].style.height = `${array[i]}%`;
    bars[j].style.height = `${array[j]}%`;
    
    bars[i].classList.remove('bg-emerald-500');
    bars[j].classList.remove('bg-emerald-500');
    bars[i].classList.add('bg-rose-500');
    bars[j].classList.add('bg-rose-500');
    
    await sleep(getDelay());
    if (!isSorting) return;
    
    bars[i].classList.remove('bg-rose-500');
    bars[j].classList.remove('bg-rose-500');
  }

  async function bubbleSort() {
    if (isSorting) return;
    isSorting = true;
    const bars = barsContainer.querySelectorAll('div');
    
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < array.length - i - 1; j++) {
        if (!isSorting) return;
        
        bars[j].classList.add('bg-emerald-500');
        bars[j+1].classList.add('bg-emerald-500');
        
        await sleep(getDelay() / 2);
        if (!isSorting) return;

        if (array[j] > array[j + 1]) {
          await swap(j, j + 1, bars);
        } else {
            bars[j].classList.remove('bg-emerald-500');
            bars[j+1].classList.remove('bg-emerald-500');
        }
      }
      if (!isSorting) return;
      bars[array.length - i - 1].classList.add('bg-indigo-500');
    }
    bars.forEach(b => b.classList.add('bg-indigo-500'));
    isSorting = false;
  }

  async function quickSort(start = 0, end = array.length - 1) {
    if (!isSorting && start === 0 && end === array.length - 1) isSorting = true;
    if (start >= end || !isSorting) {
        if (start === end && isSorting) {
             const bars = barsContainer.querySelectorAll('div');
             bars[start].classList.add('bg-indigo-500');
        }
        return;
    }

    const bars = barsContainer.querySelectorAll('div');
    const pivotValue = array[end];
    let pivotIndex = start;
    
    bars[end].classList.add('bg-yellow-500');

    for (let i = start; i < end; i++) {
      if (!isSorting) return;
      bars[i].classList.add('bg-emerald-500');
      await sleep(getDelay() / 4);
      if (!isSorting) return;
      
      if (array[i] < pivotValue) {
        await swap(i, pivotIndex, bars);
        pivotIndex++;
      }
      
      bars[i].classList.remove('bg-emerald-500');
    }
    
    if (!isSorting) return;
    await swap(pivotIndex, end, bars);
    bars[end].classList.remove('bg-yellow-500');
    bars[pivotIndex].classList.add('bg-indigo-500');
    
    await Promise.all([
      quickSort(start, pivotIndex - 1),
      quickSort(pivotIndex + 1, end)
    ]);
    
    if (start === 0 && end === array.length - 1 && isSorting) {
        isSorting = false;
        bars.forEach(b => b.classList.add('bg-indigo-500'));
    }
  }

  // Listeners
  container.querySelector('#reset')!.addEventListener('click', () => {
    isSorting = false;
    setTimeout(() => generateArray(true), 100);
  });
  
  container.querySelector('#bubbleSort')!.addEventListener('click', () => {
    if (!isSorting) bubbleSort();
  });

  container.querySelector('#quickSort')!.addEventListener('click', () => {
    if (!isSorting) quickSort();
  });

  generateArray(true);

  return {
    unmount: () => {
      isSorting = false;
    },
    undo: () => {
      isSorting = false; // Stop any active sort
      const prev = history.undo();
      if (prev) {
        array = [...prev];
        renderBars(array);
      }
    },
    redo: () => {
      isSorting = false;
      const next = history.redo();
      if (next) {
        array = [...next];
        renderBars(array);
      }
    }
  };
}
