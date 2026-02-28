import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame } from 'lucide-react';

interface StreakData {
  count: number;
  lastTimestamp: number;
}

const STREAK_KEY = 'vigil_streak_data';
const DANGER_THRESHOLD = 20 * 60 * 60 * 1000; // 20 hours

const MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365];

// Helper functions for calendar day logic
const getStartOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const isSameDay = (t1: number, t2: number) => getStartOfDay(t1) === getStartOfDay(t2);
const isYesterday = (t1: number, t2: number) => getStartOfDay(t1) === getStartOfDay(t2) - 86400000;

// SFX URLs (Publicly accessible game-like sounds)
const SFX = {
  LEVEL_UP: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', // Shimmer/Level up
  FANFARE: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Fanfare
};

export const VigilStreak: React.FC = () => {
  const [streak, setStreak] = useState<StreakData>(() => {
    const saved = localStorage.getItem(STREAK_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as StreakData;
      const now = Date.now();
      
      // If we missed yesterday and haven't checked in today, reset
      if (parsed.lastTimestamp > 0 && !isSameDay(now, parsed.lastTimestamp) && !isYesterday(parsed.lastTimestamp, now)) {
        return { count: 0, lastTimestamp: 0 };
      }
      return parsed;
    }
    return { count: 0, lastTimestamp: 0 };
  });

  const [isDanger, setIsDanger] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync with server on mount
  useEffect(() => {
    fetch('/api/user/streak/me')
      .then(res => res.json())
      .then(serverStreak => {
        if (serverStreak && serverStreak.count > streak.count) {
          setStreak({ count: serverStreak.count, lastTimestamp: serverStreak.lastTimestamp });
          localStorage.setItem(STREAK_KEY, JSON.stringify({ count: serverStreak.count, lastTimestamp: serverStreak.lastTimestamp }));
        }
      })
      .catch(err => console.error('Streak sync error:', err));
  }, []);

  // Persistence & Expiry Check
  useEffect(() => {
    const checkExpiry = () => {
      const now = Date.now();
      
      // Reset if missed yesterday
      if (streak.lastTimestamp > 0 && !isSameDay(now, streak.lastTimestamp) && !isYesterday(streak.lastTimestamp, now)) {
        const resetData = { count: 0, lastTimestamp: 0 };
        setStreak(resetData);
        localStorage.setItem(STREAK_KEY, JSON.stringify(resetData));
      }

      // Danger zone: 20 hours have passed since last interaction AND we haven't checked in today
      const timeSinceLast = now - streak.lastTimestamp;
      const needsCheckIn = streak.lastTimestamp > 0 && !isSameDay(now, streak.lastTimestamp);
      setIsDanger(needsCheckIn && timeSinceLast > DANGER_THRESHOLD);
    };

    const interval = setInterval(checkExpiry, 60000); // Check every minute
    checkExpiry();

    return () => clearInterval(interval);
  }, [streak.lastTimestamp]);

  const playSound = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(e => console.log('Audio play blocked', e));
    }
  };

  const handleVigilClick = () => {
    const now = Date.now();
    
    // If already checked in today, do nothing
    if (streak.lastTimestamp > 0 && isSameDay(now, streak.lastTimestamp)) {
      return;
    }

    let newCount = 1;
    if (streak.lastTimestamp > 0 && isYesterday(streak.lastTimestamp, now)) {
      newCount = streak.count + 1;
    }

    const newData = { count: newCount, lastTimestamp: now };
    setStreak(newData);
    localStorage.setItem(STREAK_KEY, JSON.stringify(newData));

    // Push to server
    fetch('/api/user/streak/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'me', count: newCount, timestamp: now })
    }).catch(err => console.error('Streak push error:', err));

    // Milestone Check
    const isMilestone = MILESTONES.includes(newCount) || (newCount > 0 && newCount % 30 === 0);

    // SFX Logic
    if (isMilestone) {
      playSound(SFX.FANFARE);
      setShowMilestone(true);
      setTimeout(() => setShowMilestone(false), 4000);
    } else {
      playSound(SFX.LEVEL_UP);
    }
  };

  const hasCheckedInToday = streak.lastTimestamp > 0 && isSameDay(Date.now(), streak.lastTimestamp);
  const isActive = streak.count > 0; // Streak is "active" if count > 0, but flame visual depends on today's check-in

  return (
    <div className="flex items-center gap-2">
      <audio ref={audioRef} />
      
      <div className="flex flex-col items-end mr-1">
        <span className={`text-[10px] font-bold uppercase tracking-tighter ${hasCheckedInToday ? 'text-orange-400' : 'text-slate-500'}`}>
          Vigil Streak
        </span>
        <span className={`text-sm font-mono font-bold leading-none ${hasCheckedInToday ? 'text-white' : 'text-slate-600'}`}>
          {streak.count}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={showMilestone ? { 
          scale: [1, 1.3, 1],
          rotate: [0, 10, -10, 10, 0],
          boxShadow: [
            '0 0 0px rgba(249,115,22,0)',
            '0 0 30px rgba(249,115,22,0.8)',
            '0 0 0px rgba(249,115,22,0)'
          ]
        } : {}}
        transition={showMilestone ? { duration: 0.8, repeat: 2 } : {}}
        onClick={handleVigilClick}
        className={`
          relative w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500
          ${hasCheckedInToday 
            ? 'bg-orange-500/20 border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
            : isDanger 
              ? 'bg-red-500/10 border-2 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
              : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-500'}
        `}
      >
        {/* Milestone Particles */}
        <AnimatePresence>
          {showMilestone && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100,
                    rotate: Math.random() * 360
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{ filter: 'blur(1px)' }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Pulse effect when in danger */}
        <AnimatePresence>
          {isDanger && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-full bg-red-500/30"
            />
          )}
        </AnimatePresence>

        <Flame 
          size={20} 
          className={`
            transition-all duration-700
            ${hasCheckedInToday ? 'text-orange-400 fill-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]' : 'text-slate-600'}
            ${isDanger ? 'animate-pulse text-red-400' : ''}
          `}
        />

        {/* Floating +1 Animation */}
        <AnimatePresence>
          {hasCheckedInToday && Date.now() - streak.lastTimestamp < 2000 && (
            <motion.span
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -30, opacity: 0 }}
              className="absolute font-bold text-orange-400 pointer-events-none"
            >
              +1
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
