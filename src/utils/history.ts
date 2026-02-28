
export class HistoryManager<T> {
  private past: T[] = [];
  private future: T[] = [];
  private current: T;
  private limit: number;

  constructor(initialState: T, limit = 50) {
    this.current = JSON.parse(JSON.stringify(initialState));
    this.limit = limit;
  }

  push(newState: T) {
    // If new state is same as current, ignore (deep comparison simplified)
    if (JSON.stringify(newState) === JSON.stringify(this.current)) return;

    this.past.push(this.current);
    if (this.past.length > this.limit) this.past.shift();
    
    this.current = JSON.parse(JSON.stringify(newState));
    this.future = []; // Clear redo stack
  }

  undo(): T | null {
    if (this.past.length === 0) return null;

    this.future.push(this.current);
    const previous = this.past.pop()!;
    this.current = previous;
    return JSON.parse(JSON.stringify(previous));
  }

  redo(): T | null {
    if (this.future.length === 0) return null;

    this.past.push(this.current);
    const next = this.future.pop()!;
    this.current = next;
    return JSON.parse(JSON.stringify(next));
  }

  getCurrent(): T {
    return JSON.parse(JSON.stringify(this.current));
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }
}
