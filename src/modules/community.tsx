import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Hash, MessageSquare, Share2, Mic, HelpCircle, Send, Smile, Shield, Award, Flame, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { authService, UserProfile } from '../services/authService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userRole: string;
  streakCount: number;
  content: string;
  timestamp: number;
  reactions: { emoji: string; count: number; users: string[] }[];
}

interface User {
  id: string;
  name: string;
  role: 'Student' | 'Peer Mentor' | 'Admin';
  status: 'online' | 'offline';
  streak: number;
  badges: string[];
}

const CHANNELS = [
  { id: 'general', name: 'general-lobby', icon: Hash, description: 'Casual study talk and introductions' },
  { id: 'resources', name: 'resource-share', icon: Share2, description: 'PDFs, notes, and study links' },
  { id: 'voice', name: 'voice-study-room', icon: Mic, description: 'Active audio study sessions' },
  { id: 'help', name: 'help-desk', icon: HelpCircle, description: 'Homework questions' },
];

const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Rivera', role: 'Peer Mentor', status: 'online', streak: 12, badges: ['Daily Scholar'] },
  { id: '2', name: 'Sarah Chen', role: 'Student', status: 'online', streak: 5, badges: ['Daily Scholar'] },
  { id: '3', name: 'Jordan Smith', role: 'Student', status: 'offline', streak: 2, badges: [] },
];

export const Community: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isEnabled, setIsEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);

  // Get current streak from localStorage
  const getStreak = () => {
    const saved = localStorage.getItem(`vigil_streak_data_${profile.uid}`);
    return saved ? JSON.parse(saved).count : 0;
  };

  useEffect(() => {
    // Check if enabled
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        const communityEnabled = config.find((c: any) => c.key === 'community_enabled')?.value === 'true';
        setIsEnabled(communityEnabled);
      });

    // Fetch initial messages
    fetch(`/api/messages/${activeChannel}`)
      .then(res => res.json())
      .then(setMessages);

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${protocol}//${window.location.host}`);

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({
        type: 'join',
        userId: profile.uid,
        userName: profile.displayName || 'Anonymous'
      }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat' && data.channelId === activeChannel) {
        setMessages(prev => [...prev, data]);
      }
      if (data.type === 'presence') {
        setUsers(prev => prev.map(u => u.id === data.userId ? { ...u, status: data.status } : u));
      }
    };

    return () => ws.current?.close();
  }, [activeChannel, profile.uid, profile.displayName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    ws.current?.send(JSON.stringify({
      type: 'chat',
      channelId: activeChannel,
      userId: profile.uid,
      userName: profile.displayName || 'Anonymous',
      userRole: profile.role === 'admin' ? 'Admin' : 'Student',
      streakCount: getStreak(),
      content: inputText
    }));

    setInputText('');
  };

  const handleReport = async (id: string) => {
    try {
      await fetch(`/api/messages/${id}/flag`, { method: 'POST' });
      alert('Message reported for moderation.');
    } catch (err) {
      console.error(err);
    }
  };

  if (!isEnabled) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-red-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">Community Locked</h2>
          <p className="text-slate-500 max-w-xs mx-auto">
            The Student Community is currently disabled by a Guardian. Please check back later or contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Left Sidebar: Channels */}
      <div className="w-64 bg-slate-900/50 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">S</div>
          <h2 className="font-bold text-slate-100">Student Hub</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {CHANNELS.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                activeChannel === channel.id 
                  ? "bg-white/10 text-white" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <channel.icon size={18} className={cn(activeChannel === channel.id ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="text-sm font-medium">{channel.name}</span>
              {channel.id === 'help' && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500" />}
            </button>
          ))}
        </div>

        <div className="p-4 bg-slate-900/80 border-t border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/10" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{profile.displayName || 'Anonymous'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">#{profile.uid.slice(-4)}</p>
          </div>
          <div className="flex items-center gap-1 text-orange-400">
            <Flame size={14} fill="currentColor" />
            <span className="text-xs font-bold">{getStreak()}</span>
          </div>
        </div>
      </div>

      {/* Center: Chat Feed */}
      <div className="flex-1 flex flex-col bg-slate-950">
        <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between bg-slate-900/20">
          <div className="flex items-center gap-2">
            <Hash size={20} className="text-slate-500" />
            <h3 className="font-bold text-slate-100">{CHANNELS.find(c => c.id === activeChannel)?.name}</h3>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <p className="text-xs text-slate-500">{CHANNELS.find(c => c.id === activeChannel)?.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-white transition-colors"><HelpCircle size={18} /></button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, idx) => {
            const isSameUserAsPrev = idx > 0 && messages[idx-1].userId === msg.userId && (msg.timestamp - messages[idx-1].timestamp < 300000);
            
            return (
              <div key={msg.id} className={cn("group flex gap-4", isSameUserAsPrev ? "mt-[-1.25rem]" : "")}>
                {!isSameUserAsPrev ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex-shrink-0 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-400">
                    {msg.userName.charAt(0)}
                  </div>
                ) : (
                  <div className="w-10 flex-shrink-0 flex justify-end pr-2 opacity-0 group-hover:opacity-100">
                    <span className="text-[10px] text-slate-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {!isSameUserAsPrev && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "font-bold text-sm hover:underline cursor-pointer",
                        msg.userRole === 'Peer Mentor' ? "text-emerald-400" : "text-white"
                      )}>
                        {msg.userName}
                      </span>
                      {msg.userRole === 'Peer Mentor' && <Shield size={12} className="text-emerald-400" />}
                      <div className="flex items-center gap-0.5 text-orange-400/80 bg-orange-400/10 px-1.5 rounded text-[10px] font-bold">
                        <Flame size={10} fill="currentColor" />
                        {msg.streakCount}
                      </div>
                      <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                  
                  <div className="text-slate-300 text-sm leading-relaxed break-words markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"><Smile size={14} /></button>
                    <button 
                      onClick={() => handleReport(msg.id)}
                      className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors" 
                      title="Report"
                    >
                      <Shield size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4">
          <form onSubmit={handleSendMessage} className="bg-slate-900/50 border border-white/10 rounded-xl flex items-center px-4 py-2 focus-within:border-indigo-500/50 transition-colors">
            <button type="button" className="p-2 text-slate-500 hover:text-slate-300 transition-colors"><Share2 size={20} /></button>
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Message #${CHANNELS.find(c => c.id === activeChannel)?.name}`}
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 text-sm px-4 py-2"
            />
            <div className="flex items-center gap-2">
              <button type="button" className="p-2 text-slate-500 hover:text-slate-300 transition-colors"><Award size={20} /></button>
              <button type="submit" className="p-2 text-indigo-400 hover:text-indigo-300 transition-colors"><Send size={20} /></button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Sidebar: Members */}
      <div className="w-64 bg-slate-900/50 border-l border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Members — {users.filter(u => u.status === 'online').length}</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {['Peer Mentor', 'Student'].map(role => {
            const roleUsers = users.filter(u => u.role === role);
            if (roleUsers.length === 0) return null;
            
            return (
              <div key={role} className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">{role} — {roleUsers.length}</h4>
                {roleUsers.map(user => (
                  <div key={user.id} className={cn(
                    "flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group",
                    user.status === 'offline' && "opacity-50"
                  )}>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-400">
                        {user.name.charAt(0)}
                      </div>
                      <div className={cn(
                        "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900",
                        user.status === 'online' ? "bg-emerald-500" : "bg-slate-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        user.role === 'Peer Mentor' ? "text-emerald-400" : "text-slate-300"
                      )}>{user.name}</p>
                      <div className="flex items-center gap-1">
                        {user.badges.includes('Daily Scholar') && <Award size={10} className="text-yellow-500" />}
                        <span className="text-[10px] text-slate-500 truncate">Studying Math</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-orange-400/60 group-hover:text-orange-400 transition-colors">
                      <Flame size={12} fill="currentColor" />
                      <span className="text-xs font-bold">{user.streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export function initCommunity(container: HTMLElement, profile: UserProfile) {
  const root = createRoot(container);
  root.render(<Community profile={profile} />);
  return {
    unmount: () => root.unmount()
  };
}
