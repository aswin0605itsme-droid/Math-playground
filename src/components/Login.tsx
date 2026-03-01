import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { authService, UserProfile } from '../services/authService';
import { isFirebaseConfigured } from '../utils/firebase';

interface LoginProps {
  onSuccess: (profile: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const profile = await authService.login(email, password);
        onSuccess(profile);
      } else {
        const profile = await authService.signup(email, password, name, role);
        onSuccess(profile);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineMode = () => {
    // Create a mock profile for offline mode
    const offlineProfile: UserProfile = {
      uid: 'offline-user-' + Date.now(),
      email: 'offline@local',
      displayName: 'Offline User',
      role: role
    };
    onSuccess(offlineProfile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-mono">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${role === 'admin' ? 'bg-indigo-500/20' : 'bg-cyan-500/20'}`}
            >
              {role === 'admin' ? <Shield className="text-indigo-400" size={32} /> : <User className="text-cyan-400" size={32} />}
            </motion.div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {role === 'admin' ? 'Guardian Access Portal' : 'Student Learning Hub'}
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex p-1 bg-slate-800 rounded-xl mb-6 border border-white/5">
            <button 
              onClick={() => setRole('student')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'student' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              STUDENT
            </button>
            <button 
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'admin' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              ADMIN
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-500 outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-500 outline-none transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-red-400 text-xs font-medium bg-red-400/10 p-3 rounded-lg border border-red-400/20"
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {!isFirebaseConfigured && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 text-amber-400 text-xs font-medium bg-amber-400/10 p-3 rounded-lg border border-amber-400/20"
              >
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span>Firebase is not configured.</span>
                  <span className="text-amber-400/80">Please add your VITE_FIREBASE_* variables to the environment to enable authentication.</span>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !isFirebaseConfigured}
              className={`w-full font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${role === 'admin' ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleOfflineMode}
              className="w-full font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
            >
              <WifiOff size={20} />
              Continue Offline
            </button>
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
          
          <p className="text-center text-[10px] text-slate-700 mt-8 uppercase tracking-tighter">
            {role === 'admin' ? 'Restricted Access • Guardian Protocol' : 'Student Access • Learning Protocol'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
