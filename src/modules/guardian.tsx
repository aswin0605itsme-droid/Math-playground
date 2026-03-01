import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Shield, Lock, Activity, Users, MessageSquare, 
  Flame, Settings, LogOut, Search, AlertTriangle,
  CheckCircle, XCircle, ToggleLeft, ToggleRight,
  BarChart3, Clock, Eye
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { authService, UserProfile } from '../services/authService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Log {
  id: number;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: number;
}

interface Config {
  key: string;
  value: string;
}

interface Streak {
  userId: string;
  count: number;
  lastTimestamp: number;
}

interface ActiveUser {
  userId: string;
  userName: string;
  currentModule: string;
}

export const GuardianDashboard: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(profile.role === 'admin');
  const [token, setToken] = useState(localStorage.getItem('guardian_token') || '');
  const [error, setError] = useState('');
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [config, setConfig] = useState<Config[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'safeguards' | 'streaks'>('overview');

  const fetchData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json() as { logs: Log[], config: Config[], streaks: Streak[], activeUsers: ActiveUser[] };
        setLogs(data.logs);
        setConfig(data.config);
        setStreaks(data.streaks);
        setActiveUsers(data.activeUsers);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setToken('');
        localStorage.removeItem('guardian_token');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
    else setLoading(false);
  }, [token]);

  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      const res = await fetch('/api/admin/toggle-feature', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key, value: newValue })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setToken('');
    setIsAuthenticated(false);
    localStorage.removeItem('guardian_token');
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="text-red-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-slate-500 text-sm mt-2">You do not have Guardian privileges.</p>
        </div>
      </div>
    );
  }

  const chartData = logs.slice(0, 20).reverse().map(l => ({
    time: new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    count: 1
  }));

  return (
    <div className="h-full flex bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-900 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Shield className="text-indigo-400" size={24} />
          <h2 className="font-bold text-lg tracking-tight">Guardian</h2>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeTab === 'overview' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-white/5 text-slate-400")}
          >
            <Activity size={18} />
            <span className="font-medium">Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeTab === 'logs' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-white/5 text-slate-400")}
          >
            <Clock size={18} />
            <span className="font-medium">Activity Logs</span>
          </button>
          <button 
            onClick={() => setActiveTab('safeguards')}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeTab === 'safeguards' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-white/5 text-slate-400")}
          >
            <Shield size={18} />
            <span className="font-medium">Safeguards</span>
          </button>
          <button 
            onClick={() => setActiveTab('streaks')}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", activeTab === 'streaks' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-white/5 text-slate-400")}
          >
            <Flame size={18} />
            <span className="font-medium">Streak Manager</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium">Lock Vault</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white capitalize">{activeTab}</h1>
            <p className="text-slate-500 mt-1">Real-time monitoring and control center</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ONLINE
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <Users className="text-indigo-400" size={20} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Now</span>
                </div>
                <div className="text-3xl font-bold text-white">{activeUsers.length}</div>
                <p className="text-xs text-slate-500 mt-1">Users on platform</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="text-emerald-400" size={20} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Messages</span>
                </div>
                <div className="text-3xl font-bold text-white">{logs.filter(l => l.action === 'CHAT').length}</div>
                <p className="text-xs text-slate-500 mt-1">Sent today</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <Flame className="text-orange-400" size={20} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Streak</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b.count, 0) / streaks.length) : 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">Days consistency</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="text-red-400" size={20} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alerts</span>
                </div>
                <div className="text-3xl font-bold text-white">0</div>
                <p className="text-xs text-slate-500 mt-1">Moderation flags</p>
              </div>
            </div>

            {/* Real-time Movement Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Eye size={20} className="text-indigo-400" />
                  Real-time Movement
                </h3>
                <div className="space-y-4">
                  {activeUsers.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">No active users currently.</p>
                  ) : (
                    activeUsers.map(user => (
                      <div key={user.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                            {user.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{user.userName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">ID: {user.userId}</p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          IN: {user.currentModule}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-emerald-400" />
                  Activity Heatmap
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">System History</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search logs..." 
                  className="bg-slate-800 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                            {log.userName.charAt(0)}
                          </div>
                          {log.userName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                          log.action === 'CHAT' ? "bg-emerald-500/10 text-emerald-400" :
                          log.action === 'NAVIGATE' ? "bg-indigo-500/10 text-indigo-400" :
                          "bg-slate-500/10 text-slate-400"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'safeguards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-white/5">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <Shield size={24} className="text-indigo-400" />
                Master Switches
              </h3>
              <div className="space-y-6">
                {config.filter(c => c.key.endsWith('_enabled')).map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <h4 className="font-bold text-white capitalize">{item.key.replace('_', ' ')}</h4>
                      <p className="text-xs text-slate-500">Enable or disable this feature globally</p>
                    </div>
                    <button 
                      onClick={() => handleToggle(item.key, item.value)}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {item.value === 'true' ? <ToggleRight size={40} /> : <ToggleLeft size={40} className="text-slate-600" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-white/5">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <Clock size={24} className="text-emerald-400" />
                Study Goals
              </h3>
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Daily Goal (Minutes)</label>
                  <div className="flex gap-4">
                    <input 
                      type="number" 
                      defaultValue={config.find(c => c.key === 'study_goal_minutes')?.value || 30}
                      className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                    />
                    <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 rounded-lg transition-colors">
                      Update
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 italic">Games will remain locked until this daily goal is met.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'streaks' && (
          <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Manual Streak Overrides</h3>
              <p className="text-xs text-slate-500 mt-1">Adjust user streaks for technical errors or special cases.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">User ID</th>
                    <th className="px-6 py-4">Current Streak</th>
                    <th className="px-6 py-4">Last Activity</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {streaks.map(streak => (
                    <tr key={streak.userId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-400">{streak.userId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-orange-400 font-bold">
                          <Flame size={16} fill="currentColor" />
                          {streak.count}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(streak.lastTimestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">Freeze</button>
                          <button className="px-3 py-1 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Reset</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function initGuardian(container: HTMLElement, profile: UserProfile) {
  const root = createRoot(container);
  root.render(<GuardianDashboard profile={profile} />);
  return {
    unmount: () => root.unmount()
  };
}
