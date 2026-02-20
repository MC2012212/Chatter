import React, { useEffect, useState, useRef } from 'react';
import { store } from '../store';
import { Chat, Message, User } from '../types';
import { transcribeAudio, analyzeVideo } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatScreenProps {
  chatId: string;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ chatId, onBack }) => {
  const [chat, setChat] = useState<Chat | undefined>();
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = store.getCurrentUser();
  const { t } = useLanguage();

  const loadChat = async () => {
    const c = await store.getChat(chatId);
    setChat(c);
  };

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 2000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    await store.sendMessage(chatId, { type: 'text', content: message });
    setMessage('');
    loadChat();
  };

  const getOtherUser = () => {
    if (!chat || !currentUser) return null;
    const uid = chat.participants.find(p => p !== currentUser.uid);
    return uid ? store.getUser(uid) : null;
  };

  const otherUser = getOtherUser();

  // --- File Handling ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
        const base64 = reader.result as string;
        let type: Message['type'] = 'text'; 
        
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('video/')) type = 'video';
        
        const msg = await store.sendMessage(chatId, {
            type,
            content: base64
        });

        // Trigger AI processing
        if (type === 'video') {
            processVideoAI(msg.id, base64, file.type);
        } else if (type === 'audio') {
            processAudioAI(msg.id, base64, file.type);
        }
    };
    reader.readAsDataURL(file);
  };

  const processAudioAI = async (msgId: string, base64: string, mime: string) => {
      setLoadingAI(true);
      const transcript = await transcribeAudio(base64, mime);
      await store.updateMessage(chatId, msgId, { transcript });
      setLoadingAI(false);
      loadChat();
  };

  const processVideoAI = async (msgId: string, base64: string, mime: string) => {
      setLoadingAI(true);
      const { transcript, summary } = await analyzeVideo(base64, mime);
      await store.updateMessage(chatId, msgId, { transcript, summary });
      setLoadingAI(false);
      loadChat();
  };

  // --- Voice Recording ---

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const reader = new FileReader();
        reader.onloadend = async () => {
           const base64 = reader.result as string;
           const msg = await store.sendMessage(chatId, { type: 'audio', content: base64 });
           processAudioAI(msg.id, base64, 'audio/mp3');
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (e) {
      console.error("Mic error", e);
      alert(t('mic_denied'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black relative theme-transition font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center">
           <button onClick={onBack} className="mr-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
           </button>
           <div className="flex items-center">
             <img src={otherUser?.avatar} className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 mr-3 object-cover" alt="Avatar"/>
             <span className="font-semibold text-zinc-900 dark:text-white">{otherUser?.username}</span>
           </div>
        </div>
        <div className="flex space-x-4 text-blue-600 dark:text-blue-500">
           {loadingAI && <span className="text-xs text-blue-400 animate-pulse">{t('analyzing')}</span>}
           <button><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></button>
           <button><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-zinc-50 dark:bg-black theme-transition">
         {chat?.messages.map((msg) => {
             const isMe = msg.senderId === currentUser?.uid;
             return (
                 <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'}`}>
                        {msg.type === 'text' && <p>{msg.content}</p>}
                        
                        {msg.type === 'image' && (
                            <img src={msg.content} className="rounded-lg max-h-48 object-cover" alt="attachment" />
                        )}

                        {msg.type === 'audio' && (
                            <div className="flex flex-col min-w-[200px]">
                                <audio controls src={msg.content} className="w-full h-8 mb-2" />
                                {msg.transcript ? (
                                    <div className={`text-xs p-2 rounded mt-1 border ${isMe ? 'bg-blue-700/50 border-blue-500' : 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700'}`}>
                                        <p className="font-bold opacity-70 mb-1">{t('transcript')}:</p>
                                        <p>{msg.transcript}</p>
                                    </div>
                                ) : (
                                    <span className="text-[10px] opacity-60 italic">{t('transcribing')}</span>
                                )}
                            </div>
                        )}

                        {msg.type === 'video' && (
                            <div className="flex flex-col min-w-[240px]">
                                <video controls src={msg.content} className="w-full rounded-lg mb-2 max-h-48 bg-black" />
                                {msg.summary ? (
                                    <div className={`text-xs p-2 rounded mt-1 border space-y-2 ${isMe ? 'bg-blue-700/50 border-blue-500' : 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700'}`}>
                                        <div>
                                            <p className="font-bold opacity-70">{t('summary')}:</p>
                                            <p>{msg.summary}</p>
                                        </div>
                                        {msg.transcript && msg.transcript !== "No transcript available." && (
                                           <details>
                                              <summary className="cursor-pointer font-bold opacity-70">{t('full_transcript')}</summary>
                                              <p className="mt-1">{msg.transcript}</p>
                                           </details>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-[10px] opacity-60 italic">{t('analyzing')}</span>
                                )}
                            </div>
                        )}

                        <span className="text-[10px] opacity-50 block text-right mt-1 font-medium">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                 </div>
             )
         })}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3 theme-transition">
         <button onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-2">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
         </button>
         <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
         />
         
         <div className="flex-1 relative">
             <input 
                type="text" 
                className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full pl-4 pr-10 py-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-400 dark:placeholder-zinc-500"
                placeholder={t('message_placeholder')}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
             />
         </div>

         {message ? (
             <button onClick={handleSend} className="bg-blue-600 text-white rounded-full p-2.5 transition active:scale-95 shadow-md">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
             </button>
         ) : (
            <button 
                className={`rounded-full p-2.5 transition active:scale-90 shadow-md ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </button>
         )}
      </div>
    </div>
  );
};