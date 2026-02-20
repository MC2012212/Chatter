import { User, Chat, Message, Invitation, InvitationType, CallHistory, WalkieSession } from './types';

const USERS_KEY = 'chatter_users';
const CHATS_KEY = 'chatter_chats';
const INVITES_KEY = 'chatter_invites';
const CALLS_KEY = 'chatter_calls';
const WALKIE_KEY = 'chatter_walkie';
const SESSION_KEY = 'chatter_session';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class StoreService {
  private users: User[] = [];
  private chats: Chat[] = [];
  private invitations: Invitation[] = [];
  private calls: CallHistory[] = [];
  private walkieSessions: WalkieSession[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.load();
  }

  private load() {
    try {
      const u = localStorage.getItem(USERS_KEY);
      const c = localStorage.getItem(CHATS_KEY);
      const i = localStorage.getItem(INVITES_KEY);
      const cl = localStorage.getItem(CALLS_KEY);
      const w = localStorage.getItem(WALKIE_KEY);
      const s = localStorage.getItem(SESSION_KEY);
      
      if (u) this.users = JSON.parse(u);
      if (c) this.chats = JSON.parse(c);
      if (i) this.invitations = JSON.parse(i);
      if (cl) this.calls = JSON.parse(cl);
      if (w) this.walkieSessions = JSON.parse(w);
      
      if (s) {
        const uid = JSON.parse(s);
        this.currentUser = this.users.find(user => user.uid === uid) || null;
      }
    } catch (e) {
      console.error("Failed to load store", e);
    }
  }

  private save() {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    localStorage.setItem(CHATS_KEY, JSON.stringify(this.chats));
    localStorage.setItem(INVITES_KEY, JSON.stringify(this.invitations));
    localStorage.setItem(CALLS_KEY, JSON.stringify(this.calls));
    localStorage.setItem(WALKIE_KEY, JSON.stringify(this.walkieSessions));
    if (this.currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser.uid));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  // --- Auth ---

  async login(username: string): Promise<User> {
    await delay(600);
    const user = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) throw new Error("User not found");
    this.currentUser = user;
    this.save();
    return user;
  }

  async register(username: string, language: 'en' | 'yue' = 'en'): Promise<User> {
    await delay(800);
    if (this.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Username already taken");
    }
    const newUser: User = {
      uid: 'user_' + Date.now() + Math.random().toString(36).substr(2, 5),
      username,
      avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
      bio: "",
      displayName: username,
      email: "",
      phoneNumber: "",
      country: "Hong Kong",
      language: language,
      appearance: 'dark',
      createdAt: Date.now(),
      friends: []
    };
    this.users.push(newUser);
    this.currentUser = newUser;
    this.save();
    return newUser;
  }

  async logout() {
    await delay(300);
    this.currentUser = null;
    this.save();
  }

  async deleteAccount(password: string) {
      // In a real app, verify password. Here just delete.
      if (!this.currentUser) return;
      await delay(1000);
      this.users = this.users.filter(u => u.uid !== this.currentUser?.uid);
      this.chats = this.chats.filter(c => !c.participants.includes(this.currentUser!.uid));
      this.invitations = this.invitations.filter(i => i.senderId !== this.currentUser!.uid && i.receiverId !== this.currentUser!.uid);
      this.calls = this.calls.filter(c => !c.participants.includes(this.currentUser!.uid));
      this.currentUser = null;
      this.save();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) throw new Error("Not logged in");
    this.currentUser = { ...this.currentUser, ...updates };
    this.users = this.users.map(u => u.uid === this.currentUser!.uid ? this.currentUser! : u);
    this.save();
    return this.currentUser;
  }

  async searchUsers(query: string): Promise<User[]> {
      await delay(300);
      if (!query) return [];
      const q = query.toLowerCase();
      return this.users.filter(u => 
          u.uid !== this.currentUser?.uid &&
          (u.username.toLowerCase().includes(q) || 
           (u.displayName && u.displayName.toLowerCase().includes(q)) ||
           (u.email && u.email.toLowerCase().includes(q)) ||
           (u.phoneNumber && u.phoneNumber.includes(q)))
      );
  }

  // --- Invitations ---

  async sendInvitation(type: InvitationType, receiverId: string) {
      if (!this.currentUser) throw new Error("Not logged in");
      
      const existing = this.invitations.find(i => 
          i.type === type && 
          i.senderId === this.currentUser!.uid && 
          i.receiverId === receiverId &&
          i.status === 'pending'
      );
      if (existing) throw new Error("Invitation already sent");

      const invite: Invitation = {
          id: 'inv_' + Date.now(),
          type,
          senderId: this.currentUser.uid,
          receiverId,
          status: 'pending',
          timestamp: Date.now()
      };
      this.invitations.push(invite);
      this.save();
  }

  async getInvitations(): Promise<Invitation[]> {
      if (!this.currentUser) return [];
      return this.invitations.filter(i => 
          (i.receiverId === this.currentUser!.uid || i.senderId === this.currentUser!.uid) &&
          i.status === 'pending'
      );
  }

  async respondToInvitation(inviteId: string, accept: boolean) {
      if (!this.currentUser) throw new Error("Not logged in");
      const idx = this.invitations.findIndex(i => i.id === inviteId);
      if (idx === -1) return;

      const invite = this.invitations[idx];
      invite.status = accept ? 'accepted' : 'declined';
      
      // Handle Friend Logic
      if (accept && invite.type === 'friend') {
          const sender = this.users.find(u => u.uid === invite.senderId);
          const receiver = this.users.find(u => u.uid === invite.receiverId);
          
          if (sender && !sender.friends.includes(invite.receiverId)) sender.friends.push(invite.receiverId);
          if (receiver && !receiver.friends.includes(invite.senderId)) receiver.friends.push(invite.senderId);
      }
      
      // Handle Walkie Logic
      if (accept && invite.type === 'walkie') {
          const session: WalkieSession = {
              id: 'ws_' + Date.now(),
              participants: [invite.senderId, invite.receiverId],
              active: true,
              createdAt: Date.now()
          };
          this.walkieSessions.push(session);
      }

      this.invitations[idx] = invite;
      this.save();
  }

  // --- Calls ---
  
  async addCallHistory(type: 'audio' | 'video', participantId: string, status: 'missed' | 'incoming' | 'outgoing') {
      if (!this.currentUser) return;
      const call: CallHistory = {
          id: 'call_' + Date.now(),
          participants: [this.currentUser.uid, participantId],
          type,
          status,
          timestamp: Date.now()
      };
      this.calls.unshift(call);
      this.save();
  }

  async getCallHistory(): Promise<CallHistory[]> {
      if (!this.currentUser) return [];
      return this.calls.filter(c => c.participants.includes(this.currentUser!.uid));
  }

  // --- Chats ---

  async getChats(): Promise<Chat[]> {
    if (!this.currentUser) return [];
    return this.chats
      .filter(c => c.participants.includes(this.currentUser!.uid))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getChat(chatId: string): Promise<Chat | undefined> {
    return this.chats.find(c => c.id === chatId);
  }

  async createChat(targetUid: string): Promise<Chat> {
    await delay(500);
    if (!this.currentUser) throw new Error("Not logged in");
    
    const existing = this.chats.find(c => 
      c.participants.includes(this.currentUser!.uid) && 
      c.participants.includes(targetUid) &&
      c.participants.length === 2
    );
    if (existing) return existing;

    const newChat: Chat = {
      id: 'chat_' + Date.now(),
      participants: [this.currentUser.uid, targetUid],
      messages: [],
      updatedAt: Date.now(),
      unreadCount: { [this.currentUser.uid]: 0, [targetUid]: 0 }
    };
    this.chats.push(newChat);
    this.save();
    return newChat;
  }

  async sendMessage(chatId: string, message: Omit<Message, 'id' | 'timestamp' | 'read' | 'senderId'>): Promise<Message> {
    if (!this.currentUser) throw new Error("Not logged in");
    const chatIndex = this.chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) throw new Error("Chat not found");

    const newMessage: Message = {
      ...message,
      id: 'msg_' + Date.now() + Math.random().toString(36).substr(2, 5),
      senderId: this.currentUser.uid,
      timestamp: Date.now(),
      read: false
    };

    const chat = this.chats[chatIndex];
    chat.messages.push(newMessage);
    chat.updatedAt = Date.now();
    
    chat.participants.forEach(pid => {
      if (pid !== this.currentUser!.uid) {
        chat.unreadCount[pid] = (chat.unreadCount[pid] || 0) + 1;
      }
    });

    this.chats[chatIndex] = chat;
    this.save();
    return newMessage;
  }

  async updateMessage(chatId: string, messageId: string, updates: Partial<Message>) {
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) return;
    const msg = chat.messages.find(m => m.id === messageId);
    if (msg) {
      Object.assign(msg, updates);
      this.save();
    }
  }

  getUser(uid: string): User | undefined {
    return this.users.find(u => u.uid === uid);
  }
  
  getFriendsList(): User[] {
      if (!this.currentUser) return [];
      return this.users.filter(u => this.currentUser!.friends.includes(u.uid));
  }

  // Walkie Session Helper
  getActiveWalkieSessions(): WalkieSession[] {
      if (!this.currentUser) return [];
      return this.walkieSessions.filter(s => s.active && s.participants.includes(this.currentUser!.uid));
  }
}

export const store = new StoreService();
