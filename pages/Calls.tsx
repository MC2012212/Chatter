import React, { useState, useEffect } from 'react';
import { store } from '../store';
import { User, CallHistory } from '../types';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

export const Calls: React.FC = () => {
  const { t } = useLanguage();
  const [showNewCall, setShowNewCall] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [friends, setFriends] = useState<User[]>(store.getFriendsList());
  const [history, setHistory] = useState<CallHistory[]>([]);

  useEffect(() => {
      const load = async () => {
          setHistory(await store.getCallHistory());
      };
      load();
  }, []);

  const handleStartCall = async (friendId: string) => {
      alert(`Starting ${callType} call...`);
      if(callType) await store.addCallHistory(callType, friendId, 'outgoing');
      setHistory(await store.getCallHistory());
      setShowNewCall(false);
      setCallType(null);
  };

  const getParticipantName = (uid: string) => {
      const u = store.getUser(uid);
      return u ? (u.displayName || u.username) : t('unknown_user');
  };

  return (
    <div className="h-full bg-zinc-50 dark:bg-black pb-24 pt-6 px-4 flex flex-col relative font-sans theme-transition">
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{t('calls')}</h1>
        <button 
            onClick={() => setShowNewCall(true)}
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-green-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95 border border-zinc-200 dark:border-zinc-700 shadow-sm"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 opacity-60">
              <svg className="w-16 h-16 mb-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <p className="font-medium">{t('no_recent_calls')}</p>
              <p className="text-xs mt-2">{t('tap_plus_call')}</p>
          </div>
      ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              {history.map(call => {
                  const otherId = call.participants.find(p => p !== store.getCurrentUser()?.uid) || '';
                  return (
                      <div key={call.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-transparent shadow-sm dark:shadow-none">
                          <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 mr-4`}>
                                  {call.type === 'video' ? 
                                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> :
                                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                  }
                              </div>
                              <div>
                                  <h3 className={`font-semibold text-base ${call.status === 'missed' ? 'text-red-500 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>{getParticipantName(otherId)}</h3>
                                  <p className="text-xs text-zinc-500 mt-1">
                                      {call.status === 'missed' && t('missed_call')}
                                      {call.status === 'incoming' && t('incoming_call')}
                                      {call.status === 'outgoing' && t('outgoing_call')}
                                      {' • '}
                                      {new Date(call.timestamp).toLocaleDateString()}
                                  </p>
                              </div>
                          </div>
                      </div>
                  );
              })}
              <div className="pt-8 text-center px-8">
                <p className="text-zinc-500 dark:text-zinc-600 text-xs flex items-center justify-center opacity-50">
                    <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    {t('calls_encrypted')}
                </p>
              </div>
          </div>
      )}

      {/* New Call Modal */}
      {showNewCall && (
          <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 text-center">{t('start_call')}</h3>
                  
                  {!callType ? (
                      <div className="space-y-3">
                          <button onClick={() => setCallType('audio')} className="w-full p-5 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl flex items-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95 group border border-zinc-100 dark:border-transparent">
                              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mr-4 group-hover:bg-green-500/20">
                                  <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                              </div>
                              <span className="text-zinc-900 dark:text-white font-semibold text-lg">{t('audio_call')}</span>
                          </button>
                          <button onClick={() => setCallType('video')} className="w-full p-5 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl flex items-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95 group border border-zinc-100 dark:border-transparent">
                              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 group-hover:bg-blue-500/20">
                                  <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                              </div>
                              <span className="text-zinc-900 dark:text-white font-semibold text-lg">{t('video_call')}</span>
                          </button>
                          <Button variant="ghost" onClick={() => setShowNewCall(false)} className="mt-4">{t('cancel')}</Button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider">{t('select_contact')}</p>
                          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                              {friends.map(friend => (
                                  <button key={friend.uid} onClick={() => handleStartCall(friend.uid)} className="w-full flex items-center p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition group">
                                      <img src={friend.avatar} className="w-10 h-10 rounded-full mr-3 bg-zinc-200 dark:bg-zinc-700 object-cover" />
                                      <span className="text-zinc-900 dark:text-white font-medium group-hover:text-blue-500 transition">{friend.displayName || friend.username}</span>
                                  </button>
                              ))}
                              {friends.length === 0 && <p className="text-zinc-500 text-center py-6 text-sm">Add friends first.</p>}
                          </div>
                          <Button variant="secondary" onClick={() => setCallType(null)} className="mt-4">{t('cancel')}</Button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};