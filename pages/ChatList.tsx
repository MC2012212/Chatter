import React, { useEffect, useState } from 'react';
import { store } from '../store';
import { Chat, AppRoute } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatListProps {
  onNavigate: (route: AppRoute, chatId?: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onNavigate }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const currentUser = store.getCurrentUser();
  const { t } = useLanguage();

  const loadData = async () => {
    const c = await store.getChats();
    setChats(c);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getOtherParticipant = (chat: Chat): string => {
    const otherId = chat.participants.find(p => p !== currentUser?.uid);
    const user = store.getUser(otherId || '');
    return user ? (user.displayName || user.username) : t('unknown_user');
  };

  const getOtherAvatar = (chat: Chat): string => {
    const otherId = chat.participants.find(p => p !== currentUser?.uid);
    const user = store.getUser(otherId || '');
    return user ? user.avatar : '';
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-black pb-24 pt-6 px-4 font-sans theme-transition">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
             <img src="/chatter_logo.svg" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
             <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{t('chats')}</h1>
        </div>
        
        {/* Add Button with Dropdown */}
        <div className="relative">
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95 shadow-sm border border-zinc-200 dark:border-zinc-700"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            
            {showMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-12 w-48 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 z-20 overflow-hidden animate-fade-in origin-top-right">
                        <button className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 transition flex items-center gap-3" onClick={() => { setShowMenu(false); onNavigate(AppRoute.CONTACTS); }}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                            {t('add_friend')}
                        </button>
                        <button className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 transition flex items-center gap-3">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            New Group
                        </button>
                        <button className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 transition flex items-center gap-3">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            Scan QR
                        </button>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Search Bar for Chats */}
      <div className="mb-6 relative group">
            <input 
                type="text" 
                placeholder={t('search_convos')} 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-transparent rounded-2xl px-5 py-3.5 pl-11 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm" 
            />
            <svg className="absolute left-4 top-4 text-zinc-400 dark:text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
        {chats.length === 0 && (
          <div className="text-center text-zinc-500 mt-20">
            <p className="font-medium">{t('no_chats')}</p>
            <p className="text-sm mt-1 opacity-60">{t('tap_to_start')}</p>
          </div>
        )}
        
        {chats.map(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const unread = chat.unreadCount[currentUser?.uid || ''] || 0;
            return (
                <button 
                  key={chat.id} 
                  onClick={() => onNavigate(AppRoute.CHAT_DETAIL, chat.id)}
                  className="w-full flex items-center p-4 rounded-3xl bg-white dark:bg-zinc-900/20 active:scale-[0.98] transition-all border border-zinc-100 dark:border-transparent hover:border-zinc-200 dark:hover:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 shadow-sm dark:shadow-none"
                >
                  <img src={getOtherAvatar(chat)} alt="Av" className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover shadow-sm" />
                  <div className="ml-4 flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-white text-[17px] truncate pr-2">{getOtherParticipant(chat)}</h3>
                      {lastMsg && (
                        <span className="text-xs text-zinc-500 font-normal whitespace-nowrap">
                          {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-[15px] text-zinc-500 dark:text-zinc-400 truncate pr-4 leading-snug opacity-90">
                         {lastMsg ? (lastMsg.type === 'text' ? lastMsg.content : `Sent a ${lastMsg.type}`) : t('start_chatting')}
                       </p>
                       {unread > 0 && (
                           <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                               {unread}
                           </div>
                       )}
                    </div>
                  </div>
                </button>
            )
        })}
      </div>
    </div>
  );
};