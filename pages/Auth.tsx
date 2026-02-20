import React, { useState } from 'react';
import { store } from '../store';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Setup Form State
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupBio, setSetupBio] = useState('');
  const [setupAvatar, setSetupAvatar] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('fill_fields'));
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await store.login(username);
        onLogin();
      } else {
        await store.register(username, language);
        setShowSetup(true);
      }
    } catch (err: any) {
      setError(err.message || t('auth_failed'));
    } finally {
      if (mode === 'login') setLoading(false);
    }
  };

  const handleSetupComplete = async (skipped: boolean) => {
      if (!skipped) {
          try {
             await store.updateUser({
                 displayName: setupName,
                 email: setupEmail,
                 bio: setupBio,
                 avatar: setupAvatar || undefined
             });
          } catch (e) {
              console.error("Setup failed", e);
          }
      }
      setShowSetup(false);
      onLogin();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = () => setSetupAvatar(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  if (showSetup) {
      return (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-6 z-50 backdrop-blur-sm animate-fade-in font-sans">
             <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                 <h2 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-6">{t('setup_title')}</h2>
                 
                 <div className="flex flex-col items-center mb-6">
                     <label className="relative cursor-pointer group">
                         <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors">
                             {setupAvatar ? <img src={setupAvatar} alt="preview" className="w-full h-full object-cover" /> : <span className="text-zinc-500 text-xs font-medium">{t('upload_photo')}</span>}
                         </div>
                         <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                     </label>
                 </div>

                 <div className="space-y-4 mb-8">
                     <Input placeholder={t('display_name')} value={setupName} onChange={e => setSetupName(e.target.value)} />
                     <Input placeholder={t('email')} value={setupEmail} onChange={e => setSetupEmail(e.target.value)} />
                     <Input placeholder={t('bio')} value={setupBio} onChange={e => setSetupBio(e.target.value)} />
                 </div>

                 <div className="flex gap-4">
                     <Button variant="secondary" onClick={() => handleSetupComplete(true)}>{t('skip')}</Button>
                     <Button onClick={() => handleSetupComplete(false)}>{t('confirm')}</Button>
                 </div>
             </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />

      <div className="w-full max-w-sm z-10 flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
           <div className="mb-6 shadow-2xl rounded-3xl overflow-hidden">
              <img src="/chatter_logo.svg" alt="Chatter Logo" className="w-24 h-24" />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Chatter</h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-1 rounded-full flex w-48 mb-6 relative shadow-lg">
          <div 
             className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-100 dark:bg-zinc-700 rounded-full transition-all duration-300 ease-in-out ${language === 'en' ? 'left-1' : 'left-[50%]'}`}
          />
          <button onClick={() => setLanguage('en')} className={`flex-1 text-xs font-semibold relative z-10 py-2 text-center transition-colors ${language === 'en' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{t('english')}</button>
          <button onClick={() => setLanguage('yue')} className={`flex-1 text-xs font-semibold relative z-10 py-2 text-center transition-colors ${language === 'yue' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{t('cantonese')}</button>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-1 rounded-2xl flex w-full mb-8 relative h-14 shadow-lg border border-zinc-100 dark:border-zinc-800">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-zinc-100 dark:bg-zinc-800 rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${mode === 'login' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
          />
          <button 
            onClick={() => setMode('login')} 
            className={`flex-1 text-sm font-semibold relative z-10 transition-colors ${mode === 'login' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
          >
            {t('login')}
          </button>
          <button 
            onClick={() => setMode('create')} 
            className={`flex-1 text-sm font-semibold relative z-10 transition-colors ${mode === 'create' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
          >
            {t('create')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <Input 
            placeholder={t('username')} 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            label={t('username')}
          />
          <Input 
            type="password" 
            placeholder={t('password')} 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            label={t('password')}
          />
          
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-medium">{error}</div>}

          <Button type="submit" loading={loading} className="mt-4 shadow-xl">
            {mode === 'login' ? t('signin') : t('create_account')}
          </Button>
        </form>
      </div>
    </div>
  );
};