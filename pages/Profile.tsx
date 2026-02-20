import React, { useState, useMemo, useEffect } from 'react';
import { store } from '../store';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import countries from 'i18n-iso-countries';

interface SettingsProps {
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const [user, setUser] = useState(store.getCurrentUser());
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  // Edit States
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Country Selector State
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [localesLoaded, setLocalesLoaded] = useState(false);

  // Initialize Countries Library
  useEffect(() => {
    const loadLocales = async () => {
        try {
            const enRes = await fetch('https://unpkg.com/i18n-iso-countries@7.5.0/langs/en.json');
            const enData = await enRes.json();
            countries.registerLocale(enData);

            const zhRes = await fetch('https://unpkg.com/i18n-iso-countries@7.5.0/langs/zh.json');
            const zhData = await zhRes.json();
            countries.registerLocale(zhData);

            const zhtRes = await fetch('https://unpkg.com/i18n-iso-countries@7.5.0/langs/zh-Hant.json');
            const zhtData = await zhtRes.json();
            countries.registerLocale(zhtData);

            setLocalesLoaded(true);
        } catch (e) {
            console.error("Failed to load country locales", e);
        }
    };
    loadLocales();
  }, []);

  const countryList = useMemo(() => {
      if (!localesLoaded) return [];
      const langCode = language === 'yue' ? 'zh-Hant' : 'en';
      const namesObj = countries.getNames(langCode, { select: 'official' });

      const list = Object.entries(namesObj).map(([code, name]) => {
          const nameStr = name as string;
          let displayName = nameStr;
          if (code === 'HK') {
              displayName = language === 'yue' ? '香港' : 'Hong Kong';
          }
          return { code, name: displayName, originalName: nameStr };
      });

      return list.sort((a, b) => a.name.localeCompare(b.name, language === 'yue' ? 'zh' : 'en'));
  }, [language, localesLoaded]);

  const filteredCountries = useMemo(() => {
      if (!countrySearch) return countryList;
      const searchLower = countrySearch.toLowerCase();
      return countryList.filter(c => {
          const matchesName = c.name.toLowerCase().includes(searchLower);
          let matchesEnglish = false;
          if (language === 'yue') {
              const enName = countries.getName(c.code, 'en');
              matchesEnglish = enName ? enName.toLowerCase().includes(searchLower) : false;
          }
          return matchesName || matchesEnglish;
      });
  }, [countryList, countrySearch, language]);

  if (!user) return null;

  const handleEdit = (field: string, value: string) => {
      setEditingField(field);
      setTempValue(value);
  };

  const saveField = async () => {
      if (!editingField) return;
      await store.updateUser({ [editingField]: tempValue });
      setUser(store.getCurrentUser());
      setEditingField(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await store.updateUser({ avatar: base64 });
        setUser(store.getCurrentUser());
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
      if (!deletePassword) return alert("Password required");
      await store.deleteAccount(deletePassword);
      onLogout();
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'yue' : 'en';
    setLanguage(newLang);
    await store.updateUser({ language: newLang });
    setUser(store.getCurrentUser());
  };

  const selectCountry = async (code: string) => {
      await store.updateUser({ country: code });
      setUser(store.getCurrentUser());
      setShowCountryModal(false);
      setCountrySearch('');
  };

  const getCountryDisplayName = (code: string) => {
      if (!code) return t('country');
      if (!localesLoaded) return code;
      if (code === 'HK') return language === 'yue' ? '香港' : 'Hong Kong';
      const langCode = language === 'yue' ? 'zh-Hant' : 'en';
      return countries.getName(code, langCode) || code;
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 mt-8 pl-1">{children}</h3>
  );

  const InfoRow = ({ label, value, field }: { label: string, value: string, field: string }) => (
      <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 mb-3 flex justify-between items-center shadow-sm dark:shadow-none theme-transition">
          <div className="flex-1 overflow-hidden mr-4">
              <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1 tracking-wide">{label}</p>
              {editingField === field ? (
                  <input 
                      autoFocus
                      className="bg-transparent text-blue-500 dark:text-blue-400 text-lg font-semibold w-full outline-none border-b border-blue-500"
                      value={tempValue}
                      onChange={e => setTempValue(e.target.value)}
                      onBlur={saveField}
                      onKeyDown={e => e.key === 'Enter' && saveField()}
                  />
              ) : (
                  <p className="text-zinc-900 dark:text-white text-lg font-semibold truncate">{value || 'Not set'}</p>
              )}
          </div>
          <button 
              onClick={() => handleEdit(field, value)} 
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-medium px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg whitespace-nowrap transition"
          >
              {t('change')}
          </button>
      </div>
  );

  return (
    <div className="h-full bg-zinc-50 dark:bg-black p-5 pb-24 flex flex-col overflow-y-auto no-scrollbar font-sans theme-transition">
      
      {/* Top Profile Pic */}
      <div className="flex flex-col items-center mt-6 mb-8">
          <div className="relative group">
              <img 
                  src={user.avatar} 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 shadow-xl"
              />
              <label className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full cursor-pointer border-4 border-zinc-50 dark:border-black hover:bg-blue-500 transition shadow-lg text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
          </div>
          <button className="text-blue-600 dark:text-blue-500 text-sm font-semibold mt-4 hover:text-blue-500 transition">{t('change_photo')}</button>
      </div>

      <div className="max-w-md mx-auto w-full">
          <SectionTitle>{t('personal_info')}</SectionTitle>
          
          <InfoRow label={t('display_name')} value={user.displayName || ''} field="displayName" />
          <InfoRow label={t('email')} value={user.email || ''} field="email" />
          <InfoRow label={t('phone_number')} value={user.phoneNumber || ''} field="phoneNumber" />
          <InfoRow label={t('username')} value={user.username} field="username" />
          
          <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 mb-3 shadow-sm dark:shadow-none theme-transition">
              <div className="flex justify-between items-center mb-2">
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide">{t('bio')}</p>
                  <button onClick={() => handleEdit('bio', user.bio || '')} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-medium">{t('edit_bio')}</button>
              </div>
              {editingField === 'bio' ? (
                  <textarea 
                      autoFocus
                      className="w-full bg-transparent text-zinc-900 dark:text-white outline-none border-b border-blue-500 h-20 text-base"
                      value={tempValue}
                      onChange={e => setTempValue(e.target.value)}
                      onBlur={saveField}
                  />
              ) : (
                  <p className="text-zinc-900 dark:text-white text-base font-medium leading-relaxed">{user.bio || 'No bio set'}</p>
              )}
          </div>

          <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 mb-3 flex justify-between items-center shadow-sm dark:shadow-none theme-transition">
             <div>
                 <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1 tracking-wide">{t('country')}</p>
                 <p className="text-zinc-900 dark:text-white text-lg font-semibold">{getCountryDisplayName(user.country || 'HK')}</p>
             </div>
             <button 
                 onClick={() => setShowCountryModal(true)}
                 className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-medium px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg whitespace-nowrap transition"
             >
                 {t('change')}
             </button>
          </div>

          <SectionTitle>{t('app_settings')}</SectionTitle>

          <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 mb-3 flex justify-between items-center shadow-sm dark:shadow-none theme-transition">
             <span className="text-zinc-900 dark:text-white font-medium">{t('language')}</span>
             <button onClick={toggleLanguage} className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl text-sm text-zinc-900 dark:text-white font-semibold shadow-sm active:scale-95 transition">
                 {language === 'en' ? t('english') : t('cantonese')}
             </button>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 mb-3 flex flex-col shadow-sm dark:shadow-none theme-transition">
             <div className="flex justify-between items-center w-full mb-4">
                 <span className="text-zinc-900 dark:text-white font-medium">{t('appearance')}</span>
             </div>
             <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full">
                 {(['light', 'dark', 'system'] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setTheme(mode)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${theme === mode ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >
                        {mode}
                    </button>
                 ))}
             </div>
          </div>

          <div className="mt-10 space-y-4">
              <Button variant="danger" onClick={onLogout}>{t('logout')}</Button>
              <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-4 text-red-500 text-sm font-semibold hover:text-red-600 transition"
              >
                  {t('delete_account')}
              </button>
          </div>
          
          <p className="text-center text-zinc-400 text-[10px] mt-8 font-medium">{t('production_build')}</p>
      </div>

      {/* Country Selector Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/95 flex items-center justify-center p-6 z-50 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[80vh]">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-zinc-900 dark:text-white text-lg font-bold">{t('select_country')}</h3>
                     <button onClick={() => setShowCountryModal(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">✕</button>
                 </div>
                 
                 <Input 
                    placeholder={t('search_country')} 
                    value={countrySearch} 
                    onChange={e => setCountrySearch(e.target.value)}
                    className="mb-4"
                    autoFocus
                 />

                 <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
                     {filteredCountries.map(c => (
                         <button 
                             key={c.code}
                             onClick={() => selectCountry(c.code)}
                             className={`w-full text-left p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center justify-between ${user.country === c.code ? 'bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30' : ''}`}
                         >
                             <span className={`font-medium ${user.country === c.code ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                 {c.name}
                             </span>
                             {user.country === c.code && <span className="text-blue-500">✓</span>}
                         </button>
                     ))}
                     {filteredCountries.length === 0 && (
                         <p className="text-zinc-500 text-center py-8">{t('no_country_found')}</p>
                     )}
                 </div>
             </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/90 flex items-center justify-center p-6 z-50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-8 border border-red-100 dark:border-red-900/30 shadow-2xl">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 text-center">{t('delete_confirm_title')}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 text-center leading-relaxed">{t('delete_confirm_msg')}</p>
                  
                  <Input 
                      type="password" 
                      placeholder={t('confirm_password')} 
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      className="mb-6"
                  />
                  
                  <div className="flex gap-3">
                      <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>{t('cancel')}</Button>
                      <Button variant="danger" onClick={handleDeleteAccount}>{t('delete_account')}</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};