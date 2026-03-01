import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Database, WifiOff } from 'lucide-react';

export const FirestoreStatus: React.FC = () => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    if (!db) {
      setStatus('disconnected');
      return;
    }

    // Listen to a dummy document to check connection
    // We use includeMetadataChanges to detect if the data is coming from cache (offline)
    const unsub = onSnapshot(
      doc(db, '_connection_test_', 'ping'),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) {
          setStatus('disconnected');
        } else {
          setStatus('connected');
        }
      },
      (error) => {
        // If we get a permission-denied error, it means we successfully reached the Firestore backend!
        if (error.code === 'permission-denied') {
          setStatus('connected');
        } else {
          console.warn("Firestore connection test error:", error);
          setStatus('disconnected');
        }
      }
    );

    const handleOnline = () => {
      setStatus('connecting');
      setIsOffline(false);
    };
    const handleOffline = () => {
      setStatus('disconnected');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500/90 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 backdrop-blur-sm shadow-lg">
          <WifiOff size={14} />
          <span>You are currently offline. Changes will be saved locally and synced when you reconnect.</span>
        </div>
      )}
      <div 
        className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-900/50 border border-white/10" 
        title={`Firestore: ${status}`}
      >
        <Database 
          size={14} 
          className={
            status === 'connected' ? 'text-emerald-400' : 
            status === 'connecting' ? 'text-yellow-400' : 
            'text-red-400'
          } 
        />
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden md:block">
          {status}
        </span>
      </div>
    </>
  );
};
