
export interface User {
  uid: string;
  username: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  country?: string;
  avatar: string; // ProfilePicURL
  language: 'en' | 'yue';
  appearance: 'light' | 'dark';
  createdAt: number;
  friends: string[]; // List of UIDs
  deviceTokens?: string[];
}

export type InvitationType = 'friend' | 'walkie' | 'location' | 'group';

export interface Invitation {
  id: string;
  type: InvitationType;
  senderId: string;
  receiverId: string; // or groupId
  status: 'pending' | 'accepted' | 'declined';
  timestamp: number;
  metadata?: any; 
}

export interface CallHistory {
  id: string;
  participants: string[];
  type: 'audio' | 'video';
  status: 'missed' | 'incoming' | 'outgoing';
  timestamp: number;
  duration?: number;
}

export interface Message {
  id: string;
  senderId: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'sticker';
  content: string; // Text content or Base64 URL
  timestamp: number;
  read: boolean;
  transcript?: string;
  summary?: string;
}

export interface Chat {
  id: string;
  participants: string[]; // UIDs
  messages: Message[];
  updatedAt: number;
  unreadCount: Record<string, number>;
}

export interface WalkieSession {
  id: string;
  participants: string[];
  active: boolean;
  createdAt: number;
}

export enum AppRoute {
  AUTH = 'auth',
  CHATS = 'chats',
  CONTACTS = 'contacts',
  CHAT_DETAIL = 'chat_detail',
  WALKIE = 'walkie',
  CALLS = 'calls',
  MAP = 'map',
  SETTINGS = 'settings',
}

export interface LocationMarker {
  uid: string;
  lat: number;
  lng: number;
  timestamp: number;
}
