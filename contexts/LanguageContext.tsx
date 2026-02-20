
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'yue';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

// Comprehensive Translation Keys
const translations = {
  en: {
    // Auth & Setup
    login: "Login",
    create: "Create",
    username: "Username",
    password: "Password",
    signin: "Sign In",
    create_account: "Create Account",
    fill_fields: "Please fill in all fields",
    auth_failed: "Authentication failed",
    setup_title: "Set-Up",
    display_name: "Display Name",
    email: "Email",
    bio: "Bio",
    upload_photo: "Upload",
    confirm: "Confirm",
    skip: "Skip",

    // Navigation
    chats: "Chats",
    contacts: "Contacts",
    walkie: "Walkie",
    calls: "Calls",
    map: "Map",
    settings: "Settings",

    // Chats & Invitations
    search_convos: "Search conversations",
    new_chat_placeholder: "Enter username...",
    go: "Go",
    no_chats: "No chats yet.",
    tap_to_start: "Tap + to start a conversation.",
    start_chatting: "Start chatting",
    unknown_user: "Unknown User",
    typing: "Typing...",
    message_placeholder: "Message...",
    invitations: "Invitations",
    pending_invites: "Pending Invitations",
    wants_to_be_friends: "wants to be friends",
    sent_walkie_invite: "sent walkie invite",
    wants_share_location: "wants to share location",
    accept: "Accept",
    decline: "Decline",
    add_friend: "Add Friend",
    search_placeholder: "Search username, email...",
    request_sent: "Request sent!",
    no_users_found: "No users found",
    
    // Contacts Page
    friends: "Friends",
    requests: "Requests",
    no_friends: "No friends yet",
    no_requests: "No pending requests",
    start_conversation: "Message",

    // AI
    transcribing: "Transcribing...",
    analyzing: "Analyzing...",
    transcript: "Transcript",
    summary: "Summary",
    full_transcript: "Full Transcript",

    // Walkie
    walkie_title: "Walkie Talkie",
    select_friend: "Select Friend / Group",
    hold_to_talk: "Hold to Talk",
    release_to_listen: "Release to Listen",
    transmitting: "TRANSMITTING...",
    invite: "Invite",
    invite_friend: "Invite Friend",
    walkie_invite_sent: "Walkie invite sent!",
    mic_permission: "Microphone permission required",
    mic_denied: "Microphone access denied",
    stop_session: "Stop Session",
    no_active_channel: "No active channel. Invite a friend first.",

    // Calls
    start_call: "Start Call",
    audio_call: "Audio Call",
    video_call: "Video Call",
    select_contact: "Select Contact",
    no_recent_calls: "No recent calls",
    tap_plus_call: "Tap + to start a call",
    calls_encrypted: "Calls are encrypted end-to-end",
    missed_call: "Missed Call",
    incoming_call: "Incoming Call",
    outgoing_call: "Outgoing Call",

    // Map
    location_sharing: "Location Sharing",
    active_users: "Active Users",
    share_location: "Share Location",
    you: "You",
    location_invite_sent: "Location invite sent",
    add_friends_map: "Add friends to share location!",

    // Settings
    personal_info: "Personal Info",
    phone_number: "Phone Number",
    country: "Country",
    app_settings: "App Settings",
    appearance: "Appearance",
    language: "Language",
    english: "English",
    cantonese: "廣東話",
    dark: "Dark",
    light: "Light",
    change_photo: "Change Profile Picture",
    change: "Change",
    edit_bio: "Edit Bio",
    logout: "Log Out",
    delete_account: "Delete Account",
    delete_confirm_title: "Delete Account?",
    delete_confirm_msg: "This action cannot be undone. All your data will be permanently removed.",
    confirm_password: "Confirm Password",
    cancel: "Cancel",
    save: "Save",
    production_build: "Chatter v1.0.0 • Production Build",
    search_country: "Search Country",
    select_country: "Select Country",
    no_country_found: "No country found"
  },
  yue: {
    // Auth & Setup
    login: "登入",
    create: "註冊",
    username: "用戶名稱",
    password: "密碼",
    signin: "登入",
    create_account: "建立帳戶",
    fill_fields: "請填寫所有欄位",
    auth_failed: "認證失敗",
    setup_title: "設定",
    display_name: "顯示名稱",
    email: "電郵",
    bio: "個人簡介",
    upload_photo: "上傳",
    confirm: "確認",
    skip: "略過",

    // Navigation
    chats: "聊天",
    contacts: "聯絡人",
    walkie: "對講",
    calls: "通話",
    map: "地圖",
    settings: "設定",

    // Chats & Invitations
    search_convos: "搜尋對話",
    new_chat_placeholder: "輸入用戶名稱...",
    go: "前往",
    no_chats: "暫無聊天",
    tap_to_start: "點擊 + 開始對話",
    start_chatting: "開始聊天",
    unknown_user: "未知用戶",
    typing: "輸入中...",
    message_placeholder: "訊息...",
    invitations: "邀請",
    pending_invites: "待處理邀請",
    wants_to_be_friends: "想新增您為好友",
    sent_walkie_invite: "發送了對講邀請",
    wants_share_location: "想分享位置",
    accept: "接受",
    decline: "拒絕",
    add_friend: "新增好友",
    search_placeholder: "搜尋用戶名稱、電郵...",
    request_sent: "請求已發送！",
    no_users_found: "找不到用戶",

    // Contacts Page
    friends: "好友",
    requests: "邀請",
    no_friends: "暫無好友",
    no_requests: "暫無邀請",
    start_conversation: "發送訊息",

    // AI
    transcribing: "轉錄中...",
    analyzing: "分析中...",
    transcript: "文字記錄",
    summary: "摘要",
    full_transcript: "完整文字記錄",

    // Walkie
    walkie_title: "對講機",
    select_friend: "選擇好友 / 群組",
    hold_to_talk: "按住說話",
    release_to_listen: "鬆開收聽",
    transmitting: "傳送中...",
    invite: "邀請",
    invite_friend: "邀請好友",
    walkie_invite_sent: "對講邀請已發送！",
    mic_permission: "需要麥克風權限",
    mic_denied: "麥克風存取被拒絕",
    stop_session: "停止會話",
    no_active_channel: "沒有活動頻道。請先邀請好友。",

    // Calls
    start_call: "開始通話",
    audio_call: "語音通話",
    video_call: "視訊通話",
    select_contact: "選擇聯絡人",
    no_recent_calls: "沒有最近通話",
    tap_plus_call: "點擊 + 開始通話",
    calls_encrypted: "通話已進行端對端加密",
    missed_call: "未接來電",
    incoming_call: "來電",
    outgoing_call: "撥出",

    // Map
    location_sharing: "位置分享",
    active_users: "在線用戶",
    share_location: "分享位置",
    you: "你",
    location_invite_sent: "位置邀請已發送",
    add_friends_map: "新增好友以分享位置！",

    // Settings
    personal_info: "個人資料",
    phone_number: "電話號碼",
    country: "國家",
    app_settings: "應用程式設定",
    appearance: "外觀",
    language: "語言",
    english: "English",
    cantonese: "廣東話",
    dark: "深色",
    light: "淺色",
    change_photo: "更改頭像",
    change: "更改",
    edit_bio: "編輯簡介",
    logout: "登出",
    delete_account: "刪除帳戶",
    delete_confirm_title: "刪除帳戶？",
    delete_confirm_msg: "此操作無法撤銷。您的所有數據將被永久刪除。",
    confirm_password: "確認密碼",
    cancel: "取消",
    save: "儲存",
    production_build: "Chatter v1.0.0 • 正式版本",
    search_country: "搜尋國家",
    select_country: "選擇國家",
    no_country_found: "找不到國家"
  }
};

type TranslationKey = keyof typeof translations['en'];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
      // Persist language on load
      const saved = localStorage.getItem('chatter_language');
      return (saved as Language) || 'en';
  });

  useEffect(() => {
      localStorage.setItem('chatter_language', language);
  }, [language]);

  const t = (key: TranslationKey) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
