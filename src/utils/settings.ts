
export interface AppSettings {
  theme: 'dark' | 'light';
  lastModule: string;
  defaultSortSpeed: number;
  defaultProjectileVelocity: number;
  defaultLifeSpeed: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  lastModule: 'fractal',
  defaultSortSpeed: 50,
  defaultProjectileVelocity: 80,
  defaultLifeSpeed: 30,
};

export class SettingsManager {
  private settings: AppSettings;
  private listeners: ((settings: AppSettings) => void)[] = [];

  constructor() {
    const stored = localStorage.getItem('math_playground_settings');
    this.settings = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    this.applyTheme();
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    this.settings[key] = value;
    this.save();
    if (key === 'theme') this.applyTheme();
    this.notify();
  }

  private save() {
    localStorage.setItem('math_playground_settings', JSON.stringify(this.settings));
  }

  private applyTheme() {
    const html = document.documentElement;
    if (this.settings.theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  subscribe(callback: (settings: AppSettings) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.settings));
  }
}
