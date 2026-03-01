import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Zap, Eye, Activity, Database, Send, Lock, Unlock, RefreshCw, AlertTriangle, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ArchitectData {
  logs: any[];
  intelligence: any[];
  streaks: any[];
  messages: any[];
}

export const ArchitectConsole: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [data, setData] = useState<ArchitectData | null>(null);
  const [command, setCommand] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Vigil Divine Architect Protocol v1.0.0', 'Awaiting Divine Signature...']);
  const [activeTab, setActiveTab] = useState<'terminal' | 'omniscience' | 'intelligence'>('terminal');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/architect/omniscience', {
        headers: { 'x-divine-signature': token }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json as ArchitectData);
      } else {
        setIsAuthenticated(false);
        setTerminalOutput(prev => [...prev, 'ERROR: Divine Signature Expired or Invalid.']);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      setIsAuthenticated(true);
      setTerminalOutput(prev => [...prev, 'SIGNATURE VERIFIED.', 'ESTABLISHING DIRECT LINK TO VIGIL ENGINE...', 'ACCESS GRANTED.']);
    }
  };

  const executeCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command) return;

    const cmd = command.trim();
    setTerminalOutput(prev => [...prev, `> ${cmd}`]);
    setCommand('');

    if (cmd.startsWith('snap ')) {
      const action = cmd.split(' ')[1].toUpperCase();
      await handleSnap(action);
    } else if (cmd === 'clear') {
      setTerminalOutput(['Vigil Divine Architect Protocol v1.0.0']);
    } else {
      // Vigil Direct Link
      try {
        const res = await fetch('/api/architect/vigil-direct', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-divine-signature': token 
          },
          body: JSON.stringify({ prompt: cmd })
        });
        const json = await res.json() as { response: string };
        setTerminalOutput(prev => [...prev, json.response]);
      } catch (err) {
        setTerminalOutput(prev => [...prev, 'ERROR: Failed to communicate with Vigil Engine.']);
      }
    }
  };

  const handleSnap = async (action: string) => {
    try {
      const res = await fetch('/api/architect/snap', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-divine-signature': token 
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setTerminalOutput(prev => [...prev, `SNAP EXECUTED: ${action}`]);
        fetchData();
      }
    } catch (err) {
      setTerminalOutput(prev => [...prev, `SNAP FAILED: ${action}`]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-lg shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8 text-emerald-500">
            <Shield size={32} />
            <h1 className="text-xl font-bold tracking-widest uppercase">Divine Architect</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs text-zinc-500 uppercase mb-2">Divine Signature</label>
              <input 
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded p-3 text-emerald-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                placeholder="ENTER SECRET TOKEN..."
              />
            </div>
            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded transition-colors flex items-center justify-center gap-2">
              <Zap size={18} />
              INITIALIZE PROTOCOL
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <Cpu size={24} className="animate-pulse" />
            <span className="font-bold tracking-tighter text-lg">VIGIL ENGINE</span>
          </div>
          <div className="h-4 w-px bg-zinc-800 mx-2" />
          <nav className="flex gap-6">
            <button 
              onClick={() => setActiveTab('terminal')}
              className={`text-xs uppercase tracking-widest transition-colors ${activeTab === 'terminal' ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Terminal
            </button>
            <button 
              onClick={() => setActiveTab('omniscience')}
              className={`text-xs uppercase tracking-widest transition-colors ${activeTab === 'omniscience' ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Omniscience
            </button>
            <button 
              onClick={() => setActiveTab('intelligence')}
              className={`text-xs uppercase tracking-widest transition-colors ${activeTab === 'intelligence' ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Intelligence
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            System Online
          </div>
          <div>Lat: 0.00ms</div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex">
        {activeTab === 'terminal' && (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 bg-black/50 border border-zinc-800 rounded-lg p-4 overflow-y-auto space-y-2 scrollbar-hide">
              {terminalOutput.map((line, i) => (
                <div key={i} className={`text-sm ${line.startsWith('>') ? 'text-emerald-500' : line.startsWith('ERROR') ? 'text-red-500' : 'text-zinc-400'}`}>
                  {line}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
            <form onSubmit={executeCommand} className="mt-4 relative">
              <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
              <input 
                autoFocus
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-4 pl-12 pr-4 text-emerald-500 focus:outline-none focus:border-emerald-500/30 transition-colors"
                placeholder="ISSUE DIVINE COMMAND..."
              />
            </form>
          </div>
        )}

        {activeTab === 'omniscience' && (
          <div className="flex-1 grid grid-cols-2 gap-4 p-4 overflow-y-auto">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                <Eye size={14} /> Live Activity Stream
              </h3>
              <div className="space-y-3">
                {data?.logs.map((log: any) => (
                  <div key={log.id} className="text-[10px] border-l border-emerald-500/30 pl-3 py-1">
                    <div className="flex justify-between text-zinc-500 mb-1">
                      <span>{log.userName}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-zinc-300">{log.action}: {log.details}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                <Database size={14} /> Universal State
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {data?.streaks.map((s: any) => (
                  <div key={s.userId} className="bg-black/30 p-3 rounded border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 mb-1">{s.userId}</div>
                    <div className="flex items-end justify-between">
                      <div className="text-xl font-bold text-emerald-500">{s.count}</div>
                      <div className="text-[10px] text-zinc-600">Streak</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'intelligence' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <div className="text-zinc-500 text-xs uppercase mb-2">Total Observations</div>
                <div className="text-4xl font-bold text-emerald-500">{data?.intelligence.length || 0}</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <div className="text-zinc-500 text-xs uppercase mb-2">Autonomous Actions</div>
                <div className="text-4xl font-bold text-emerald-500">
                  {data?.intelligence.filter((i: any) => i.action_taken !== 'NONE').length || 0}
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <div className="text-zinc-500 text-xs uppercase mb-2">System Health</div>
                <div className="text-4xl font-bold text-emerald-500">100%</div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                <Activity size={14} /> Vigil Intelligence Logs
              </h3>
              <div className="space-y-4">
                {data?.intelligence.map((intel: any) => (
                  <div key={intel.id} className="bg-black/30 p-4 rounded border border-zinc-800 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${
                          intel.type === 'STREAK_WARNING' ? 'bg-amber-500/20 text-amber-500' :
                          intel.type === 'SENTIMENT' ? 'bg-purple-500/20 text-purple-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          {intel.type}
                        </span>
                        <span className="text-[10px] text-zinc-500">{new Date(intel.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-zinc-300 mb-2">{intel.observation}</div>
                      <div className="text-xs text-emerald-500 flex items-center gap-2">
                        <Zap size={12} /> Action: {intel.action_taken}
                      </div>
                    </div>
                    <AlertTriangle size={16} className="text-zinc-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Quick Actions Bar */}
      <footer className="border-t border-zinc-800 p-2 bg-zinc-900/50 flex gap-2">
        <button 
          onClick={() => handleSnap('FREEZE_ALL')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] uppercase tracking-widest rounded transition-colors flex items-center gap-2"
        >
          <Lock size={12} /> Freeze All
        </button>
        <button 
          onClick={() => handleSnap('UNFREEZE_ALL')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] uppercase tracking-widest rounded transition-colors flex items-center gap-2"
        >
          <Unlock size={12} /> Unfreeze All
        </button>
        <button 
          onClick={() => handleSnap('MAX_STREAKS')}
          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] uppercase tracking-widest rounded transition-colors flex items-center gap-2"
        >
          <Zap size={12} /> Max All
        </button>
        <button 
          onClick={() => handleSnap('RESET_STREAKS')}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] uppercase tracking-widest rounded transition-colors flex items-center gap-2 ml-auto"
        >
          <RefreshCw size={12} /> Reset System
        </button>
      </footer>
    </div>
  );
};
