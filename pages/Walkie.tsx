import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { store } from '../store';
import { User, WalkieSession } from '../types';

export const Walkie: React.FC = () => {
  const { t } = useLanguage();
  const [active, setActive] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string>(''); // uid
  const [friends, setFriends] = useState<User[]>([]);
  const [status, setStatus] = useState<'idle' | 'transmitting'>('idle');
  const [sessions, setSessions] = useState<WalkieSession[]>([]);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
      setFriends(store.getFriendsList());
      setSessions(store.getActiveWalkieSessions());
  }, []);

  const handleInvite = async (uid: string) => {
      try {
          await store.sendInvitation('walkie', uid);
          alert(t('walkie_invite_sent'));
          setShowInvite(false);
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handlePress = async () => {
      if (!selectedTarget) {
          setShowError(true);
          setTimeout(() => setShowError(false), 3000);
          return;
      }
      startTransmission();
  };

  const startTransmission = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setActive(true);
          setStatus('transmitting');
          if ('vibrate' in navigator) navigator.vibrate(50);
      } catch (e) {
          alert(t('mic_permission'));
      }
  };

  const stopTransmission = () => {
      if (!active) return;
      setActive(false);
      setStatus('idle');
      if ('vibrate' in navigator) navigator.vibrate(20);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 pb-20 relative overflow-hidden font-sans theme-transition">
      
      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 z-20 flex gap-3">
          <div className="relative flex-1">
              <select 
                 className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white p-3.5 pl-4 pr-10 rounded-2xl border border-zinc-200 dark:border-zinc-700 outline-none appearance-none font-medium text-sm focus:border-blue-500 transition-colors shadow-sm"
                 value={selectedTarget}
                 onChange={e => setSelectedTarget(e.target.value)}
              >
                  <option value="">{t('select_friend')}</option>
                  {friends.map(f => (
                      <option key={f.uid} value={f.uid}>{f.displayName || f.username}</option>
                  ))}
              </select>
              <div className="absolute right-4 top-4 pointer-events-none text-zinc-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
          </div>
          <button 
             onClick={() => setShowInvite(true)}
             className="bg-blue-600 w-12 h-[50px] rounded-2xl flex items-center justify-center text-white font-bold shadow-lg active:scale-95 transition"
          >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
      </div>

      <div className="text-center z-10 mb-10 mt-20">
         <h2 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white tracking-tight">{t('walkie_title')}</h2>
         <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{t('hold_to_talk')}</p>
      </div>

      <div className="flex flex-col items-center">
          <button
            className={`w-72 h-72 rounded-full border-8 transition-all duration-200 flex items-center justify-center relative shadow-2xl
            ${active 
                ? 'bg-orange-600 border-orange-400 scale-95 shadow-orange-500/50' 
                : 'bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750'}`}
            onMouseDown={handlePress}
            onMouseUp={stopTransmission}
            onTouchStart={handlePress}
            onTouchEnd={stopTransmission}
          >
            <div className={`absolute inset-0 rounded-full border-2 border-white/20 animate-ping ${active ? 'opacity-100' : 'opacity-0'}`}></div>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform duration-300 ${active ? 'scale-110 text-white' : 'scale-100 text-zinc-300 dark:text-zinc-600'} ${!selectedTarget && !active ? 'opacity-30' : ''}`}>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          
          {/* Inline Error Feedback */}
          <div className="h-6 mt-4 flex items-center justify-center">
              {showError && (
                  <p className="text-orange-500 dark:text-orange-400 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full animate-fade-in-up">
                      Please select a friend or group first.
                  </p>
              )}
          </div>
      </div>

      <div className="mt-8 h-8 text-orange-500 font-mono text-lg font-bold tracking-widest uppercase">
        {status === 'transmitting' ? t('transmitting') : ''}
      </div>
      
      {/* Visualizer rings background */}
      {active && (
         <>
            <div className="absolute w-[450px] h-[450px] border border-orange-500/20 rounded-full animate-[ping_2s_linear_infinite]" />
            <div className="absolute w-[550px] h-[550px] border border-orange-500/10 rounded-full animate-[ping_2s_linear_infinite_0.5s]" />
         </>
      )}

      {/* Invite Modal */}
      {showInvite && (
          <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                  <h3 className="text-zinc-900 dark:text-white text-xl font-bold mb-4">{t('invite_friend')}</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {friends.map(f => (
                          <div key={f.uid} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                              <span className="text-zinc-900 dark:text-white ml-2 font-medium text-sm">{f.displayName || f.username}</span>
                              <button 
                                 onClick={() => handleInvite(f.uid)}
                                 className="bg-blue-600 text-xs px-4 py-2 rounded-lg text-white font-semibold active:scale-95 transition"
                              >
                                  {t('invite')}
                              </button>
                          </div>
                      ))}
                      {friends.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">Add friends first.</p>}
                  </div>
                  <button onClick={() => setShowInvite(false)} className="mt-6 w-full py-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-semibold transition">{t('cancel')}</button>
              </div>
          </div>
      )}
    </div>
  );
};