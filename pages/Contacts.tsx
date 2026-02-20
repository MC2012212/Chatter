import React, { useEffect, useState } from 'react';
import { store } from '../store';
import { User, Invitation, AppRoute } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLanguage } from '../contexts/LanguageContext';

interface ContactsProps {
  onNavigate: (route: AppRoute, chatId?: string) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  
  // Search State
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const loadData = async () => {
    setFriends(store.getFriendsList());
    setInvitations(await store.getInvitations());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    const res = await store.searchUsers(searchQuery);
    setSearchResults(res);
  };

  const sendFriendRequest = async (uid: string) => {
    try {
      await store.sendInvitation('friend', uid);
      alert(t('request_sent'));
      setShowAddFriend(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleInvitation = async (id: string, accept: boolean) => {
      await store.respondToInvitation(id, accept);
      loadData();
  };

  const handleStartChat = async (uid: string) => {
      const chat = await store.createChat(uid);
      onNavigate(AppRoute.CHAT_DETAIL, chat.id);
  };

  const getSenderName = (uid: string) => {
      const u = store.getUser(uid);
      return u ? (u.displayName || u.username) : t('unknown_user');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-black pb-24 pt-6 px-4 font-sans theme-transition">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{t('contacts')}</h1>
        <button 
          onClick={() => setShowAddFriend(true)} 
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95 shadow-md border border-zinc-200 dark:border-zinc-700"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-200 dark:bg-zinc-900 rounded-2xl mb-6">
          <button 
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${activeTab === 'friends' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'}`}
          >
              {t('friends')} ({friends.length})
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'}`}
          >
              {t('requests')} 
              {invitations.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">{invitations.length}</span>
              )}
          </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
          {activeTab === 'friends' ? (
              <div className="space-y-2">
                  {friends.length === 0 && (
                      <div className="text-center text-zinc-500 mt-20">
                          <p>{t('no_friends')}</p>
                      </div>
                  )}
                  {friends.map(friend => (
                      <div key={friend.uid} className="flex items-center p-4 rounded-3xl bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-transparent hover:border-zinc-200 dark:hover:border-zinc-800/50 shadow-sm dark:shadow-none">
                          <img src={friend.avatar} className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover" />
                          <div className="ml-4 flex-1">
                              <h3 className="font-semibold text-zinc-900 dark:text-white text-base">{friend.displayName || friend.username}</h3>
                              <p className="text-xs text-zinc-500 truncate">{friend.bio || `@${friend.username}`}</p>
                          </div>
                          <button 
                              onClick={() => handleStartChat(friend.uid)}
                              className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition"
                          >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          </button>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="space-y-3">
                  {invitations.length === 0 && (
                      <div className="text-center text-zinc-500 mt-20">
                          <p>{t('no_requests')}</p>
                      </div>
                  )}
                  {invitations.map(inv => (
                      <div key={inv.id} className="flex flex-col bg-white dark:bg-zinc-900/80 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          <div className="mb-3">
                              <p className="text-sm text-zinc-800 dark:text-white leading-relaxed">
                                  <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">{getSenderName(inv.senderId)}</span>
                                  <span className="text-zinc-500 dark:text-zinc-400">
                                      {inv.type === 'friend' && t('wants_to_be_friends')}
                                      {inv.type === 'walkie' && t('sent_walkie_invite')}
                                      {inv.type === 'location' && t('wants_share_location')}
                                  </span>
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">{new Date(inv.timestamp).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-3">
                              <button onClick={() => handleInvitation(inv.id, true)} className="flex-1 py-2.5 bg-blue-600 rounded-xl text-white text-sm font-semibold active:scale-95 transition shadow-lg shadow-blue-500/20">{t('accept')}</button>
                              <button onClick={() => handleInvitation(inv.id, false)} className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white text-sm font-semibold active:scale-95 transition">{t('decline')}</button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-zinc-900 dark:text-white text-xl font-bold">{t('add_friend')}</h3>
                    <button onClick={() => setShowAddFriend(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition">✕</button>
                </div>
                <div className="flex gap-2 mb-6">
                    <Input 
                        placeholder={t('search_placeholder')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <Button onClick={handleSearch} className="!w-auto !py-3">{t('go')}</Button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                    {searchResults.map(user => (
                        <div key={user.uid} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/50">
                            <div className="flex items-center overflow-hidden">
                                <img src={user.avatar} className="w-10 h-10 rounded-full mr-3 object-cover bg-zinc-200 dark:bg-zinc-700" />
                                <div className="overflow-hidden">
                                    <p className="text-zinc-900 dark:text-white text-sm font-medium truncate max-w-[120px]">{user.displayName || user.username}</p>
                                    <p className="text-zinc-500 text-xs truncate">@{user.username}</p>
                                </div>
                            </div>
                            <Button variant="secondary" className="!w-auto !py-1.5 !px-4 !text-xs !rounded-lg" onClick={() => sendFriendRequest(user.uid)}>{t('add_friend')}</Button>
                        </div>
                    ))}
                    {searchResults.length === 0 && searchQuery && <p className="text-zinc-500 text-center text-sm py-4">{t('no_users_found')}</p>}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};