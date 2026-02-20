import React, { useEffect, useState } from 'react';
import { store } from './store';
import { AppRoute, User } from './types';
import { Auth } from './pages/Auth';
import { ChatList } from './pages/ChatList';
import { Contacts } from './pages/Contacts';
import { ChatScreen } from './pages/ChatScreen';
import { Walkie } from './pages/Walkie';
import { MapPage } from './pages/MapPage';
import { Settings } from './pages/Profile';
import { Calls } from './pages/Calls';
import { BottomNav } from './components/BottomNav';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.AUTH);
  const [activeChatId, setActiveChatId] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const { setLanguage } = useLanguage();
  const { setTheme } = useTheme();

  // Initialize auth with splash delay
  useEffect(() => {
    const init = async () => {
        // Simulate splash delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        const user = store.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setLanguage(user.language);
          
          // Sync stored user preference if it exists, otherwise use local setting
          if (user.appearance) {
              // Map old specific types to new theme types if needed, or just cast
              // Assuming user.appearance matches 'light' | 'dark' | 'system' logic broadly
              // or default to system
          }
          
          setCurrentRoute(AppRoute.CHATS);
        }
        setInitializing(false);
    };
    init();
  }, []);

  // Poll for unread messages globally
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
       const chats = await store.getChats();
       let count = 0;
       chats.forEach(c => {
         count += c.unreadCount[currentUser.uid] || 0;
       });
       setUnreadCount(count);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogin = () => {
    const user = store.getCurrentUser();
    setCurrentUser(user);
    if (user) setLanguage(user.language);
    setCurrentRoute(AppRoute.CHATS);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRoute(AppRoute.AUTH);
  };

  const handleNavigate = (route: AppRoute, chatId?: string) => {
    if (chatId) {
      setActiveChatId(chatId);
    }
    setCurrentRoute(route);
  };

  if (initializing) {
      return (
          <div className="h-screen w-full bg-white dark:bg-black flex items-center justify-center theme-transition">
              <div className="animate-pulse">
                  <img src="/chatter_logo.svg" alt="Chatter" className="w-32 h-32 rounded-3xl shadow-2xl" />
              </div>
          </div>
      )
  }

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white flex flex-col overflow-hidden theme-transition font-sans">
      <div className="flex-1 relative overflow-hidden">
        {currentRoute === AppRoute.CHATS && (
          <ChatList onNavigate={handleNavigate} />
        )}

        {currentRoute === AppRoute.CONTACTS && (
          <Contacts onNavigate={handleNavigate} />
        )}
        
        {currentRoute === AppRoute.CHAT_DETAIL && activeChatId && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-black animate-slide-in-right">
             <ChatScreen 
                chatId={activeChatId} 
                onBack={() => setCurrentRoute(AppRoute.CHATS)} 
             />
          </div>
        )}

        {currentRoute === AppRoute.WALKIE && <Walkie />}
        
        {currentRoute === AppRoute.CALLS && <Calls />}
        
        {currentRoute === AppRoute.MAP && <MapPage />}
        
        {currentRoute === AppRoute.SETTINGS && (
          <Settings onLogout={handleLogout} />
        )}
      </div>

      {/* Hide bottom nav when inside a chat detail view */}
      {currentRoute !== AppRoute.CHAT_DETAIL && (
        <BottomNav 
          currentRoute={currentRoute} 
          onNavigate={(r) => handleNavigate(r)} 
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
}