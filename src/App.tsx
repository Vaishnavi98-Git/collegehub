import React, { useState, useEffect, createContext, useContext, FormEvent, useRef, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, where, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, Project, Resource, Experience, PortfolioItem, Chat, Message, Team, TeamRequest, AppNotification, WallQuestion, WallAnswer, AppStats } from './types';
import { ProjectCard, ResourceCard, StudentCard } from './components/Cards';
import { 
  LayoutDashboard,
  Users,
  Rocket,
  Library,
  Mail,
  Bell,
  UserCircle,
  LogOut,
  Github,
  ExternalLink,
  Award,
  Briefcase,
  Map,
  Edit,
  Linkedin,
  Globe,
  X,
  ChevronRight,
  Send,
  UserPlus,
  UserCheck,
  BriefcaseBusiness,
  FolderKanban,
  Plus,
  Code,
  BookOpen,
  MoreHorizontal,
  Search,
  Check,
  MessageSquare,
  MessageCircle,
  Bookmark,
  MessageSquareQuote,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { cn } from './lib/utils';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from './firebase';

const sendNotification = async (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
  const newNotifRef = doc(collection(db, 'notifications'));
  await setDoc(newNotifRef, {
    ...notif,
    id: newNotifRef.id,
    read: false,
    createdAt: new Date().toISOString()
  }).catch(e => handleFirestoreError(e, OperationType.CREATE, `notifications/${newNotifRef.id}`));
};

// --- Contexts ---
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

const useAuth = () => useContext(AuthContext);

// --- Components ---

const Sidebar = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, color: 'text-blue-500' },
    { name: 'Students', path: '/explore', icon: Globe, color: 'text-emerald-500' },
    { name: 'Wall', path: '/wall', icon: MessageSquareQuote, color: 'text-orange-500' },
    { name: 'Teams', path: '/teams', icon: Users, color: 'text-cyan-500' },
    { name: 'Projects', path: '/projects', icon: Rocket, color: 'text-orange-500' },
    { name: 'Resources', path: '/resources', icon: Library, color: 'text-purple-500' },
    { name: 'Messages', path: '/messages', icon: Mail, color: 'text-pink-500' },
    { name: 'Notifications', path: '/notifications', icon: Bell, color: 'text-yellow-500' },
    { name: 'Profile', path: '/profile', icon: UserCircle, color: 'text-indigo-500' },
  ];

  if (profile?.role === 'admin') {
    navItems.splice(1, 0, { name: 'Admin', path: '/admin', icon: ShieldCheck, color: 'text-red-500' });
  }

  const handleSwitchAccount = async () => {
    if (!user || !profile) return;
    try {
      const newIsGuest = !profile.isGuest;
      await updateDoc(doc(db, 'profiles', user.uid), {
        isGuest: newIsGuest
      });
      window.location.reload();
    } catch (error) {
      console.error("Error switching account:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed left-0 top-0 h-screen w-64 border-r border-neutral-200 bg-white flex flex-col z-50 hidden md:flex">
      <div className="p-6 border-b border-neutral-50 bg-gradient-to-r from-indigo-50 to-purple-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Award size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">CampusHub</h1>
        </Link>
      </div>

      <nav className="flex-grow overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative",
              location.pathname === item.path 
                ? "bg-indigo-50 text-indigo-700 font-bold" 
                : "text-neutral-600 hover:bg-neutral-50"
            )}
          >
            <div className={cn(
              "transition-transform duration-200 group-hover:scale-110",
              location.pathname === item.path ? item.color : "text-neutral-400 group-hover:text-neutral-600"
            )}>
              <item.icon size={22} />
            </div>
            <span className="text-sm font-medium">{item.name}</span>
            {location.pathname === item.path && (
              <motion.div 
                layoutId="sidebar-indicator"
                className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full"
              />
            )}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 space-y-2">
        <button 
          onClick={handleSwitchAccount}
          className="flex items-center gap-4 p-3 w-full rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors group"
        >
          <RefreshCw size={22} className="transition-transform group-hover:rotate-180 duration-500" />
          <span className="text-sm font-bold">{profile?.isGuest ? 'Switch to Student' : 'Switch to Guest'}</span>
        </button>
        <button 
          onClick={logout}
          className="flex items-center gap-4 p-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
        >
          <LogOut size={22} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-bold">Logout</span>
        </button>
      </div>
    </div>
  );
};

const MobileNavbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/explore', icon: Globe },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Messages', path: '/messages', icon: Mail },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-neutral-200 flex items-center justify-around md:hidden z-50 px-2">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            location.pathname === item.path ? "text-indigo-600" : "text-neutral-400"
          )}
        >
          <item.icon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

const MessagesPage = () => {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUsers, setChatUsers] = useState<Record<string, UserProfile>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snap) => {
      const chatList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(chatList);

      // Fetch user profiles for chats
      const uids = new Set<string>();
      chatList.forEach(c => c.participants.forEach(p => p !== user.uid && uids.add(p)));
      
      for (const uid of uids) {
        if (!chatUsers[uid]) {
          try {
            const uDoc = await getDoc(doc(db, 'profiles', uid));
            if (uDoc.exists()) {
              setChatUsers(prev => ({ ...prev, [uid]: uDoc.data() as UserProfile }));
            }
          } catch (error) {
            console.error("Error fetching chat user:", error);
          }
        }
      }
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, `chats/${activeChat.id}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });

    return () => unsub();
  }, [activeChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChat || !newMessage.trim()) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      const msgData = {
        chatId: activeChat.id,
        senderId: user.uid,
        text: msgText,
        createdAt: new Date().toISOString()
      };

      const msgPath = `chats/${activeChat.id}/messages`;
      await setDoc(doc(collection(db, msgPath)), msgData).catch(e => handleFirestoreError(e, OperationType.CREATE, msgPath));
      
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: msgText,
        lastMessageAt: msgData.createdAt,
        updatedAt: msgData.createdAt
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `chats/${activeChat.id}`));
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Chat List */}
      <div className={cn(
        "w-full md:w-80 border-r border-neutral-200 flex flex-col",
        activeChat && "hidden md:flex"
      )}>
        <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
          <h1 className="text-xl font-bold">{profile?.displayName}</h1>
          <Edit size={20} className="cursor-pointer" />
        </div>
        <div className="flex-grow overflow-y-auto">
          {chats.length > 0 ? (
            chats.map(chat => {
              const otherId = chat.participants.find(p => p !== user?.uid);
              const otherUser = otherId ? chatUsers[otherId] : null;
              const chatName = chat.isGroup ? chat.name : (otherUser?.displayName || 'Loading...');
              const chatPhoto = chat.isGroup 
                ? `https://ui-avatars.com/api/?name=${chat.name}&background=6366f1&color=fff`
                : (otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName}`);

              return (
                <div 
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={cn(
                    "flex items-center gap-3 p-4 cursor-pointer hover:bg-neutral-50 transition-colors",
                    activeChat?.id === chat.id && "bg-neutral-50"
                  )}
                >
                  <img 
                    src={chatPhoto} 
                    className="w-14 h-14 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-grow overflow-hidden">
                    <h3 className="font-medium truncate">{chatName}</h3>
                    <p className="text-sm text-neutral-500 truncate">
                      {chat.lastMessage || 'Start a conversation'}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-neutral-500">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>No messages yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Chat */}
      <div className={cn(
        "flex-grow flex flex-col",
        !activeChat && "hidden md:flex items-center justify-center bg-white"
      )}>
        {activeChat ? (
          <>
            <div className="p-4 border-b border-neutral-200 flex items-center gap-3">
              <button 
                onClick={() => setActiveChat(null)}
                className="md:hidden p-2"
              >
                <X size={24} />
              </button>
              {(() => {
                const otherId = activeChat.participants.find(p => p !== user?.uid);
                const otherUser = otherId ? chatUsers[otherId] : null;
                const chatName = activeChat.isGroup ? activeChat.name : otherUser?.displayName;
                const chatPhoto = activeChat.isGroup 
                  ? `https://ui-avatars.com/api/?name=${activeChat.name}&background=6366f1&color=fff`
                  : (otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName}`);

                return (
                  <>
                    <img 
                      src={chatPhoto} 
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <h2 className="font-bold">{chatName}</h2>
                  </>
                );
              })()}
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex flex-col",
                      isMe ? "items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[70%] p-3 rounded-2xl text-sm",
                      isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-neutral-100 text-neutral-900 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200">
              <div className="flex items-center gap-3 bg-neutral-50 rounded-full px-4 py-2">
                <input 
                  type="text"
                  placeholder="Message..."
                  className="flex-grow bg-transparent outline-none text-sm"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="text-indigo-600 font-bold text-sm disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 border-2 border-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={48} />
            </div>
            <h2 className="text-2xl font-light">Your Messages</h2>
            <p className="text-neutral-500 mt-2">Send private photos and messages to a friend.</p>
            <button className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
              Send Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ExperienceSection = ({ experiences, isOwner, onUpdate }: { experiences?: Experience[], isOwner: boolean, onUpdate: (exps: Experience[]) => void }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newExp, setNewExp] = useState<Partial<Experience>>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const handleAdd = () => {
    const exp: Experience = {
      id: Math.random().toString(36).substr(2, 9),
      company: newExp.company || '',
      position: newExp.position || '',
      startDate: newExp.startDate || '',
      endDate: newExp.endDate,
      description: newExp.description
    };
    onUpdate([...(experiences || []), exp]);
    setShowAdd(false);
    setNewExp({ company: '', position: '', startDate: '', endDate: '', description: '' });
  };

  const handleDelete = (id: string) => {
    onUpdate((experiences || []).filter(e => e.id !== id));
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BriefcaseBusiness size={24} className="text-indigo-600" />
          Experience
        </h2>
        {isOwner && (
          <button 
            onClick={() => setShowAdd(true)}
            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {experiences?.map(exp => (
          <div key={exp.id} className="relative p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50 group">
            {isOwner && (
              <button 
                onClick={() => handleDelete(exp.id)}
                className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            )}
            <h3 className="font-bold text-neutral-900">{exp.position}</h3>
            <p className="text-indigo-600 font-medium text-sm">{exp.company}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {exp.startDate} — {exp.endDate || 'Present'}
            </p>
            {exp.description && <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{exp.description}</p>}
          </div>
        ))}
        {(!experiences || experiences.length === 0) && !showAdd && (
          <p className="text-neutral-400 text-sm italic">No work experience added yet.</p>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border border-indigo-100 rounded-2xl bg-indigo-50/30 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Company"
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newExp.company}
                onChange={e => setNewExp({...newExp, company: e.target.value})}
              />
              <input 
                placeholder="Position"
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newExp.position}
                onChange={e => setNewExp({...newExp, position: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="date"
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newExp.startDate}
                onChange={e => setNewExp({...newExp, startDate: e.target.value})}
              />
              <input 
                type="date"
                placeholder="End Date (Optional)"
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newExp.endDate}
                onChange={e => setNewExp({...newExp, endDate: e.target.value})}
              />
            </div>
            <textarea 
              placeholder="Description"
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              value={newExp.description}
              onChange={e => setNewExp({...newExp, description: e.target.value})}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-neutral-500 font-bold">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Add</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const ProvidedResourcesSection = ({ uid }: { uid: string }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'resources'),
      where('ownerUid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setResources(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  if (loading) return <div className="animate-pulse h-20 bg-neutral-100 rounded-2xl"></div>;
  if (resources.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Library size={24} className="text-indigo-600" />
        Shared Resources
      </h2>
      <div className="grid gap-4">
        {resources.map(resource => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
};

const PortfolioSection = ({ items, isOwner, onUpdate }: { items?: PortfolioItem[], isOwner: boolean, onUpdate: (items: PortfolioItem[]) => void }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PortfolioItem>>({
    title: '',
    description: '',
    url: '',
    imageUrl: ''
  });

  const handleAdd = () => {
    const item: PortfolioItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newItem.title || '',
      description: newItem.description || '',
      url: newItem.url,
      imageUrl: newItem.imageUrl || `https://picsum.photos/seed/${Math.random()}/800/600`
    };
    onUpdate([...(items || []), item]);
    setShowAdd(false);
    setNewItem({ title: '', description: '', url: '', imageUrl: '' });
  };

  const handleDelete = (id: string) => {
    onUpdate((items || []).filter(i => i.id !== id));
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FolderKanban size={24} className="text-indigo-600" />
          Portfolio
        </h2>
        {isOwner && (
          <button 
            onClick={() => setShowAdd(true)}
            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {items?.map(item => (
          <div key={item.id} className="group relative bg-white border border-neutral-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="aspect-video overflow-hidden">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-500 line-clamp-2 mb-4">{item.description}</p>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
                >
                  View Project <ExternalLink size={14} />
                </a>
              )}
            </div>
            {isOwner && (
              <button 
                onClick={() => handleDelete(item.id)}
                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        {(!items || items.length === 0) && !showAdd && (
          <div className="sm:col-span-2 text-center py-12 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
            <FolderKanban size={40} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-neutral-400 text-sm italic">No portfolio items added yet.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 border border-indigo-100 rounded-3xl bg-indigo-50/30 space-y-4"
          >
            <input 
              placeholder="Project Title"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={newItem.title}
              onChange={e => setNewItem({...newItem, title: e.target.value})}
            />
            <textarea 
              placeholder="Description"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              value={newItem.description}
              onChange={e => setNewItem({...newItem, description: e.target.value})}
            />
            <input 
              placeholder="Project URL (Optional)"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={newItem.url}
              onChange={e => setNewItem({...newItem, url: e.target.value})}
            />
            <input 
              placeholder="Image URL (Optional)"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={newItem.imageUrl}
              onChange={e => setNewItem({...newItem, imageUrl: e.target.value})}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-6 py-2 text-neutral-500 font-bold">Cancel</button>
              <button onClick={handleAdd} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Add to Portfolio</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white z-[100]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-medium animate-pulse">Loading CampusHub...</p>
    </div>
  </div>
);

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'experience' | 'saved'>('portfolio');
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [savedResources, setSavedResources] = useState<Resource[]>([]);

  useEffect(() => {
    if (profile) {
      setEditForm(profile);
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'saved' && profile) {
      const fetchSaved = async () => {
        if (profile.savedProjects?.length) {
          const q = query(collection(db, 'projects'), where('id', 'in', profile.savedProjects));
          const snap = await getDocs(q);
          setSavedProjects(snap.docs.map(doc => doc.data() as Project));
        }
        if (profile.savedResources?.length) {
          const q = query(collection(db, 'resources'), where('id', 'in', profile.savedResources));
          const snap = await getDocs(q);
          setSavedResources(snap.docs.map(doc => doc.data() as Resource));
        }
      };
      fetchSaved();
    }
  }, [activeTab, profile]);

  const handleSave = async () => {
    if (!user) return;
    try {
      const path = `profiles/${user.uid}`;
      await updateDoc(doc(db, 'profiles', user.uid), editForm).catch(e => handleFirestoreError(e, OperationType.UPDATE, path));
      setIsEditing(false);
      refreshProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const updateExperience = async (experiences: Experience[]) => {
    if (!user) return;
    try {
      const path = `profiles/${user.uid}`;
      await updateDoc(doc(db, 'profiles', user.uid), { experiences }).catch(e => handleFirestoreError(e, OperationType.UPDATE, path));
      refreshProfile();
    } catch (error) {
      console.error("Error updating experiences:", error);
    }
  };

  const updatePortfolio = async (portfolioItems: PortfolioItem[]) => {
    if (!user) return;
    try {
      const path = `profiles/${user.uid}`;
      await updateDoc(doc(db, 'profiles', user.uid), { portfolioItems }).catch(e => handleFirestoreError(e, OperationType.UPDATE, path));
      refreshProfile();
    } catch (error) {
      console.error("Error updating portfolio:", error);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <div className="relative group">
          <img 
            src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}`} 
            alt={profile.displayName} 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl object-cover"
            referrerPolicy="no-referrer"
          />
          {!profile.isGuest && (
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            >
              <Edit size={16} />
            </button>
          )}
        </div>
        
        <div className="flex-grow space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
                {profile.displayName}
                {profile.isVerified && <ShieldCheck size={24} className="text-indigo-600" />}
              </h1>
              <p className="text-neutral-500 font-medium">{profile.branch} • {profile.year}</p>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="font-black text-xl text-neutral-900">{profile.followersCount || 0}</p>
                <p className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-black text-xl text-neutral-900">{profile.followingCount || 0}</p>
                <p className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Following</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-neutral-600 leading-relaxed max-w-xl">{profile.bio || 'No bio yet.'}</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.map(skill => (
                <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer" className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors text-neutral-600">
                <Github size={20} />
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors text-neutral-600">
                <Linkedin size={20} />
              </a>
            )}
            {profile.portfolio && (
              <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors text-neutral-600">
                <Globe size={20} />
              </a>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Display Name</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editForm.displayName || ''}
                  onChange={e => setEditForm({...editForm, displayName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Branch</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editForm.branch || ''}
                    onChange={e => setEditForm({...editForm, branch: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Year</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={editForm.year || ''}
                    onChange={e => setEditForm({...editForm, year: e.target.value})}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Bio</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  value={editForm.bio || ''}
                  onChange={e => setEditForm({...editForm, bio: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Skills (comma separated)</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editForm.skills?.join(', ') || ''}
                  onChange={e => setEditForm({...editForm, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                />
              </div>
              <button 
                onClick={handleSave}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="border-b border-neutral-100 mb-8">
        <div className="flex gap-8">
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={cn(
              "pb-4 text-sm font-bold transition-all relative",
              activeTab === 'portfolio' ? "text-indigo-600" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Portfolio
            {activeTab === 'portfolio' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('experience')}
            className={cn(
              "pb-4 text-sm font-bold transition-all relative",
              activeTab === 'experience' ? "text-indigo-600" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Experience
            {activeTab === 'experience' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={cn(
              "pb-4 text-sm font-bold transition-all relative",
              activeTab === 'saved' ? "text-indigo-600" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Saved
            {activeTab === 'saved' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {activeTab === 'portfolio' && (
          <PortfolioSection items={profile.portfolioItems} isOwner={!profile.isGuest} onUpdate={updatePortfolio} />
        )}
        {activeTab === 'experience' && (
          <ExperienceSection experiences={profile.experiences} isOwner={!profile.isGuest} onUpdate={updateExperience} />
        )}
        {activeTab === 'saved' && (
          <div className="space-y-12">
            <section>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Rocket size={20} className="text-orange-500" />
                Saved Projects
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedProjects.length > 0 ? (
                  savedProjects.map(project => <ProjectCard key={project.id} project={project} />)
                ) : (
                  <p className="text-neutral-500 italic">No projects saved yet.</p>
                )}
              </div>
            </section>
            <section>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Library size={20} className="text-purple-500" />
                Saved Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedResources.length > 0 ? (
                  savedResources.map(resource => <ResourceCard key={resource.id} resource={resource} />)
                ) : (
                  <p className="text-neutral-500 italic">No resources saved yet.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const UserProfileView = () => {
  const { uid } = useParams();
  const { user, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'teams'), where('ownerId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setMyTeams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
    });
    return () => unsub();
  }, [user]);

  const handleInvite = async (team: Team) => {
    if (!user || !uid || !profile) return;
    try {
      const requestId = doc(collection(db, 'teamRequests')).id;
      await setDoc(doc(db, 'teamRequests', requestId), {
        id: requestId,
        teamId: team.id,
        teamName: team.name,
        senderId: user.uid,
        senderName: myProfile?.displayName || 'Someone',
        receiverId: uid,
        status: 'pending',
        message: `Join my team: ${team.name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, `teamRequests/${requestId}`));

      await sendNotification({
        recipientId: uid,
        type: 'team_invite',
        title: 'Team Invitation',
        message: `${myProfile?.displayName} invited you to join ${team.name}`,
        link: `/teams`,
        senderId: user.uid,
        senderName: myProfile?.displayName || 'Someone'
      });

      setShowInviteModal(false);
      alert(`Invitation sent to ${profile.displayName}!`);
    } catch (error) {
      console.error("Error sending invitation:", error);
    }
  };

  useEffect(() => {
    if (!uid) return;
    
    const unsub = onSnapshot(doc(db, 'profiles', uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      }
      setLoading(false);
    });

    if (user && uid) {
      const followQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', user.uid),
        where('followingId', '==', uid)
      );
      const unsubFollow = onSnapshot(followQuery, (snap) => {
        setIsFollowing(!snap.empty);
      });
      return () => {
        unsub();
        unsubFollow();
      };
    }

    return () => unsub();
  }, [uid, user]);

  const handleFollow = async () => {
    if (!user || !uid || !profile || !myProfile) return;

    try {
      const followRef = doc(db, 'follows', `${user.uid}_${uid}`);
      
      if (isFollowing) {
        await deleteDoc(followRef).catch(e => handleFirestoreError(e, OperationType.DELETE, `follows/${user.uid}_${uid}`));
        
        await updateDoc(doc(db, 'profiles', uid), { followersCount: Math.max(0, (profile.followersCount || 1) - 1) })
          .catch(e => handleFirestoreError(e, OperationType.UPDATE, `profiles/${uid}`));
        await updateDoc(doc(db, 'profiles', user.uid), { followingCount: Math.max(0, (myProfile.followingCount || 1) - 1) })
          .catch(e => handleFirestoreError(e, OperationType.UPDATE, `profiles/${user.uid}`));
      } else {
        await setDoc(followRef, {
          followerId: user.uid,
          followingId: uid,
          createdAt: new Date().toISOString()
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, `follows/${user.uid}_${uid}`));
        
        await updateDoc(doc(db, 'profiles', uid), { followersCount: (profile.followersCount || 0) + 1 })
          .catch(e => handleFirestoreError(e, OperationType.UPDATE, `profiles/${uid}`));
        await updateDoc(doc(db, 'profiles', user.uid), { followingCount: (myProfile.followingCount || 0) + 1 })
          .catch(e => handleFirestoreError(e, OperationType.UPDATE, `profiles/${user.uid}`));

        await sendNotification({
          recipientId: uid,
          type: 'follow',
          title: 'New Follower',
          message: `${myProfile.displayName} started following you`,
          link: `/user/${user.uid}`,
          senderId: user.uid,
          senderName: myProfile.displayName
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleMessage = async () => {
    if (!user || !uid) return;

    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const snap = await getDocs(q);
      let existingChat = snap.docs.find(d => (d.data() as Chat).participants.includes(uid));

      if (existingChat) {
        navigate('/messages');
      } else {
        const newChatRef = doc(collection(db, 'chats'));
        await setDoc(newChatRef, {
          participants: [user.uid, uid],
          updatedAt: new Date().toISOString()
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'chats'));
        navigate('/messages');
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!profile) return <div className="p-12 text-center">User not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <img 
          src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}`} 
          alt={profile.displayName} 
          className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl object-cover"
          referrerPolicy="no-referrer"
        />
        
        <div className="flex-grow space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold">{profile.displayName}</h1>
            {user && user.uid !== uid && (
              <div className="flex gap-2">
                <button 
                  onClick={handleFollow}
                  className={cn(
                    "px-6 py-2 rounded-lg font-bold text-sm transition-all",
                    isFollowing ? "bg-neutral-100 text-neutral-900" : "bg-indigo-600 text-white hover:bg-indigo-700"
                  )}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button 
                  onClick={handleMessage}
                  className="px-6 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-bold text-sm transition-colors"
                >
                  Message
                </button>
                {myTeams.length > 0 && (
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="px-6 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    Invite
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-6 text-sm">
            <span><strong>{profile.followersCount || 0}</strong> followers</span>
            <span><strong>{profile.followingCount || 0}</strong> following</span>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-neutral-700">{profile.branch} • {profile.year}</p>
            <p className="text-neutral-600 leading-relaxed max-w-xl">{profile.bio || 'No bio yet.'}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {profile.skills?.map(skill => (
                <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-12 border-t border-neutral-100 pt-12">
        <ProvidedResourcesSection uid={uid!} />
        <ExperienceSection experiences={profile.experiences} isOwner={false} onUpdate={() => {}} />
        <PortfolioSection items={profile.portfolioItems} isOwner={false} onUpdate={() => {}} />
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Invite to Team</h2>
                  <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <p className="text-neutral-500 mb-6">Select a team to invite <strong>{profile.displayName}</strong> to join.</p>
                <div className="space-y-3">
                  {myTeams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => handleInvite(team)}
                      className="w-full p-4 text-left bg-neutral-50 hover:bg-indigo-50 border border-neutral-100 hover:border-indigo-200 rounded-2xl transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">{team.name}</p>
                        <p className="text-xs text-neutral-500">{team.members.length} members</p>
                      </div>
                      <ChevronRight size={20} className="text-neutral-300 group-hover:text-indigo-600 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<any, any> {
  state = { hasError: false, errorInfo: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.errorInfo || "");
        if (parsed.error && parsed.error.includes("Missing or insufficient permissions")) {
          displayMessage = "You don't have permission to perform this action. Please check if you are logged in correctly.";
        }
      } catch (e) {
        // Not JSON
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <X size={40} />
            </div>
            <h2 className="text-2xl font-bold">Application Error</h2>
            <p className="text-neutral-600">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'profiles', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Create initial profile (Public)
        const newProfile: UserProfile = {
          uid,
          displayName: auth.currentUser?.displayName || 'Student',
          photoURL: auth.currentUser?.photoURL || '',
          createdAt: new Date().toISOString(),
          isVerified: false,
          isGuest: false
        };
        await setDoc(docRef, newProfile).catch(e => handleFirestoreError(e, OperationType.CREATE, `profiles/${uid}`));
        
        // Create private user data
        await setDoc(doc(db, 'users', uid), {
          email: auth.currentUser?.email || '',
          createdAt: new Date().toISOString()
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${uid}`));
        
        setProfile(newProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ 
        user, 
        profile, 
        loading, 
        refreshProfile: () => fetchProfile(user?.uid || '') 
      }}>
        <Router>
          <div className="min-h-screen flex bg-white">
            <Sidebar />
            <div className="flex-grow md:ml-64 pb-16 md:pb-0">
              <main className="min-h-screen">
                <Routes>
                  <Route path="/" element={user ? <Dashboard /> : <AuthPage />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/wall" element={user ? <WallPage /> : <AuthPage />} />
                  <Route path="/admin" element={profile?.role === 'admin' ? <AdminDashboard /> : <Dashboard />} />
                  <Route path="/teams" element={user ? <TeamsPage /> : <AuthPage />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/messages" element={user ? <MessagesPage /> : <AuthPage />} />
                  <Route path="/notifications" element={user ? <NotificationsPage /> : <AuthPage />} />
                  <Route path="/profile" element={user ? <ProfilePage /> : <AuthPage />} />
                  <Route path="/user/:uid" element={<UserProfileView />} />
                </Routes>
              </main>
            </div>
            <MobileNavbar />
          </div>
        </Router>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

// --- Main Pages ---

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [collegeId, setCollegeId] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!collegeId) {
          setError('Please upload your college ID for verification.');
          setLoading(false);
          return;
        }
        // In a real app, we would upload the ID to storage and have an admin verify it.
        // For this demo, we'll simulate the process.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'profiles', user.uid), {
          uid: user.uid,
          displayName,
          email,
          createdAt: new Date().toISOString(),
          isVerified: false, // Pending verification
          role: 'student',
          isGuest: false
        });

        await setDoc(doc(db, 'users', user.uid), {
          email,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-200">
              <Award size={32} />
            </div>
            <h2 className="text-3xl font-black text-neutral-900">CampusHub</h2>
            <p className="text-neutral-500 mt-2">{isLogin ? 'Welcome back!' : 'Create your account'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Full Name</label>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Email</label>
              <input 
                required
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="email@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Password</label>
              <input 
                required
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">College ID Verification</label>
                <div className="relative">
                  <input 
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="college-id"
                    onChange={e => setCollegeId(e.target.files?.[0] || null)}
                  />
                  <label 
                    htmlFor="college-id"
                    className="w-full px-4 py-3 rounded-xl border border-dashed border-neutral-300 hover:border-indigo-500 flex items-center justify-center gap-2 cursor-pointer transition-colors text-neutral-500"
                  >
                    {collegeId ? collegeId.name : 'Upload ID Card'}
                  </label>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

            <button 
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-bold hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-neutral-100">
            <button 
              onClick={signInWithGoogle}
              className="w-full py-3 border border-neutral-200 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-neutral-50 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const Dashboard = () => {
  const { profile } = useAuth();
  const [seniors, setSeniors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch seniors (e.g., year 3 or 4)
    const q = query(
      collection(db, 'profiles'),
      where('year', 'in', ['3rd Year', '4th Year', 'Final Year']),
      limit(6)
    );
    const unsub = onSnapshot(q, (snap) => {
      setSeniors(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-neutral-900 mb-2">Welcome back, {profile?.displayName?.split(' ')[0]}! 👋</h1>
        <p className="text-neutral-500 text-lg">Check out what's happening in your campus today.</p>
      </header>

      {profile && !profile.isVerified && !profile.isGuest && (
        <div className="mb-12 p-6 bg-amber-50 border border-amber-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Verification Pending</h3>
              <p className="text-sm text-amber-700">Your college ID is being reviewed by our team. You'll get a verified badge once approved.</p>
            </div>
          </div>
          <Link to="/profile" className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all whitespace-nowrap">
            Check Profile
          </Link>
        </div>
      )}

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Featured Seniors</h2>
          <Link to="/explore" className="text-indigo-600 font-bold hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-64 bg-neutral-100 animate-pulse rounded-3xl" />)
          ) : seniors.length > 0 ? (
            seniors.map(senior => <StudentCard key={senior.uid} profile={senior} />)
          ) : (
            <div className="col-span-full p-12 text-center bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
              <p className="text-neutral-500">No seniors found yet. Be the first to join!</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-12">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Trending Projects</h2>
            <Link to="/projects" className="text-indigo-600 font-bold hover:underline">Explore</Link>
          </div>
          <div className="space-y-4">
            <p className="text-neutral-500 italic">Explore the projects tab to see the latest innovations.</p>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Latest Resources</h2>
            <Link to="/resources" className="text-indigo-600 font-bold hover:underline">Browse</Link>
          </div>
          <div className="space-y-4">
            <p className="text-neutral-500 italic">Check the resources wall for helpful study materials.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

const WallPage = () => {
  const { user, profile } = useAuth();
  const [questions, setQuestions] = useState<WallQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [type, setType] = useState<'doubt' | 'resource_request'>('doubt');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'wall'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WallQuestion)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !newQuestion.trim()) return;

    try {
      const qId = doc(collection(db, 'wall')).id;
      await setDoc(doc(db, 'wall', qId), {
        id: qId,
        authorId: user.uid,
        authorName: profile.displayName,
        authorPhoto: profile.photoURL,
        text: newQuestion,
        type,
        createdAt: new Date().toISOString(),
        answerCount: 0
      });
      setNewQuestion('');
    } catch (error) {
      console.error("Error posting to wall:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-neutral-900 mb-2">Question & Resource Wall</h1>
        <p className="text-neutral-500">Ask questions, request resources, and help your peers.</p>
      </header>

      {!profile?.isGuest && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm mb-8 space-y-4">
          <textarea
            placeholder="What's on your mind?"
            className="w-full p-4 rounded-2xl bg-neutral-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('doubt')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  type === 'doubt' ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                )}
              >
                Doubt
              </button>
              <button
                type="button"
                onClick={() => setType('resource_request')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  type === 'resource_request' ? "bg-purple-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                )}
              >
                Resource Request
              </button>
            </div>
            <button
              type="submit"
              disabled={!newQuestion.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={18} />
              Post
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 bg-neutral-100 animate-pulse rounded-3xl" />)
        ) : questions.length > 0 ? (
          questions.map(q => (
            <div key={q.id} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Link to={`/user/${q.authorId}`}>
                  <img src={q.authorPhoto || `https://ui-avatars.com/api/?name=${q.authorName}`} className="w-10 h-10 rounded-full" />
                </Link>
                <div>
                  <Link to={`/user/${q.authorId}`} className="font-bold text-neutral-900 hover:text-indigo-600">{q.authorName}</Link>
                  <p className="text-xs text-neutral-500">{new Date(q.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={cn(
                  "ml-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  q.type === 'doubt' ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"
                )}>
                  {q.type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-neutral-700 mb-6 whitespace-pre-wrap">{q.text}</p>
              <div className="flex items-center gap-4 pt-4 border-t border-neutral-50">
                <button className="flex items-center gap-2 text-neutral-500 hover:text-indigo-600 font-bold text-sm transition-colors">
                  <MessageCircle size={18} />
                  {q.answerCount} Answers
                </button>
                <button className="flex items-center gap-2 text-neutral-500 hover:text-indigo-600 font-bold text-sm transition-colors">
                  <Bookmark size={18} />
                  Save
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
            <p className="text-neutral-500">The wall is empty. Start a conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AppStats>({ totalStudents: 0, totalProjects: 0, totalResources: 0 });
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'verification'>('stats');

  const fetchData = async () => {
    try {
      const studentsSnap = await getDocs(collection(db, 'profiles'));
      const projectsSnap = await getDocs(collection(db, 'projects'));
      const resourcesSnap = await getDocs(collection(db, 'resources'));
      
      setStats({
        totalStudents: studentsSnap.size,
        totalProjects: projectsSnap.size,
        totalResources: resourcesSnap.size
      });

      const pendingQ = query(collection(db, 'profiles'), where('isVerified', '==', false));
      const pendingSnap = await getDocs(pendingQ);
      setPendingUsers(pendingSnap.docs.map(doc => doc.data() as UserProfile));

      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'profiles', uid), { isVerified: true });
      setPendingUsers(prev => prev.filter(u => u.uid !== uid));
      setStats(prev => ({ ...prev, totalStudents: prev.totalStudents })); // Refresh stats if needed
    } catch (error) {
      console.error("Error verifying user:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-neutral-900 mb-2">Admin Dashboard</h1>
          <p className="text-neutral-500">Overview of the campus platform activity.</p>
        </div>
        <div className="flex gap-2 bg-neutral-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('stats')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'stats' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Stats
          </button>
          <button 
            onClick={() => setActiveTab('verification')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all relative",
              activeTab === 'verification' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Verification
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {activeTab === 'stats' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <p className="text-neutral-500 font-bold text-sm uppercase tracking-wider mb-1">Total Students</p>
              <p className="text-4xl font-black text-neutral-900">{loading ? '...' : stats.totalStudents}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                <Rocket size={24} />
              </div>
              <p className="text-neutral-500 font-bold text-sm uppercase tracking-wider mb-1">Total Projects</p>
              <p className="text-4xl font-black text-neutral-900">{loading ? '...' : stats.totalProjects}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <Library size={24} />
              </div>
              <p className="text-neutral-500 font-bold text-sm uppercase tracking-wider mb-1">Total Resources</p>
              <p className="text-4xl font-black text-neutral-900">{loading ? '...' : stats.totalResources}</p>
            </div>
          </div>

          <section className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <p className="text-neutral-500 italic">Activity logs will appear here as the platform grows.</p>
          </section>
        </>
      ) : (
        <section className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-neutral-100">
            <h2 className="text-2xl font-bold">Pending Verifications</h2>
            <p className="text-neutral-500">Review and verify student identities.</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {loading ? (
              <div className="p-8 text-center text-neutral-500">Loading requests...</div>
            ) : pendingUsers.length > 0 ? (
              pendingUsers.map(user => (
                <div key={user.uid} className="p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm" 
                    />
                    <div>
                      <h3 className="font-bold text-neutral-900">{user.displayName}</h3>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-yellow-100">
                      ID Uploaded
                    </div>
                    <button 
                      onClick={() => handleVerify(user.uid)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      Verify Student
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <ShieldCheck size={48} className="mx-auto mb-4 text-neutral-200" />
                <p className="text-neutral-500 font-medium">No pending verification requests.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

const Explore = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'profiles'), orderBy('displayName'));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(doc => doc.data() as UserProfile));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.displayName.toLowerCase().includes(search.toLowerCase()) || 
                         s.skills?.some(sk => sk.toLowerCase().includes(search.toLowerCase()));
    const matchesBranch = filterBranch === 'All' || s.branch === filterBranch;
    return matchesSearch && matchesBranch;
  });

  const branches = ['All', ...Array.from(new Set(students.map(s => s.branch).filter(Boolean)))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 text-center max-w-2xl mx-auto">
        <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest">
          Community Directory
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4 tracking-tight">
          Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Dream Team</span>
        </h1>
        <p className="text-neutral-500 text-lg">Connect with talented students, find mentors, or discover collaborators based on their unique skills.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-12 p-2 bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-neutral-100">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or skills (e.g. React, Python, UI Design)..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-neutral-50/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-6 py-4 bg-neutral-50/50 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-neutral-700 appearance-none border border-transparent hover:border-neutral-200"
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <button className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="glass rounded-3xl p-6 h-64 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredStudents.map(s => (
            <Link key={s.uid} to={`/user/${s.uid}`}>
              <StudentCard profile={s} />
            </Link>
          ))}
        </div>
      )}
      
      {!loading && filteredStudents.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-neutral-300" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900">No students found</h3>
          <p className="text-neutral-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

const Projects = () => {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    githubUrl: '',
    demoUrl: '',
    tags: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      const projectRef = doc(collection(db, 'projects'));
      const projectData = {
        id: projectRef.id,
        ownerUid: user.uid,
        ownerName: profile.displayName,
        title: newProject.title,
        description: newProject.description,
        githubUrl: newProject.githubUrl,
        demoUrl: newProject.demoUrl,
        tags: newProject.tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString()
      };
      
      await setDoc(projectRef, projectData).catch(e => handleFirestoreError(e, OperationType.CREATE, 'projects'));
      setShowAddModal(false);
      setNewProject({ title: '', description: '', githubUrl: '', demoUrl: '', tags: '' });
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteDoc(doc(db, 'projects', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `projects/${id}`));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-neutral-900 mb-2">Project Showcase</h1>
          <p className="text-neutral-500">Discover what your peers are building and get inspired.</p>
        </div>
        {user && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            Add Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass rounded-2xl p-6 h-64 animate-pulse bg-neutral-100/50"></div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(p => (
            <ProjectCard 
              key={p.id} 
              project={p} 
              isOwner={user?.uid === p.ownerUid}
              onDelete={() => handleDeleteProject(p.id)}
            />
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Add New Project</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleAddProject} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-700">Project Title *</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="e.g. AI Study Planner"
                        value={newProject.title}
                        onChange={e => setNewProject({...newProject, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-700">Tags (comma separated)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="React, Firebase, Tailwind"
                        value={newProject.tags}
                        onChange={e => setNewProject({...newProject, tags: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-700">Description *</label>
                    <textarea 
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      placeholder="What does your project do? What technologies did you use?"
                      value={newProject.description}
                      onChange={e => setNewProject({...newProject, description: e.target.value})}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-700 flex items-center gap-2">
                        <Github size={16} /> GitHub URL
                      </label>
                      <input 
                        type="url" 
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="https://github.com/..."
                        value={newProject.githubUrl}
                        onChange={e => setNewProject({...newProject, githubUrl: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-700 flex items-center gap-2">
                        <ExternalLink size={16} /> Demo URL
                      </label>
                      <input 
                        type="url" 
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="https://..."
                        value={newProject.demoUrl}
                        onChange={e => setNewProject({...newProject, demoUrl: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Publish Project
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Resources = () => {
  const { user, profile } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    url: '',
    type: 'link' as const,
    tags: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setResources(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      const resourceRef = doc(collection(db, 'resources'));
      const resourceData = {
        id: resourceRef.id,
        ownerUid: user.uid,
        ownerName: profile.displayName,
        title: newResource.title,
        description: newResource.description,
        url: newResource.url,
        type: newResource.type,
        tags: newResource.tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString()
      };
      
      await setDoc(resourceRef, resourceData).catch(e => handleFirestoreError(e, OperationType.CREATE, 'resources'));
      setShowAddModal(false);
      setNewResource({ title: '', description: '', url: '', type: 'link', tags: '' });
    } catch (error) {
      console.error("Error adding resource:", error);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deleteDoc(doc(db, 'resources', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `resources/${id}`));
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-neutral-900 mb-2">Learning Resources</h1>
          <p className="text-neutral-500">Curated roadmaps, links, and study materials shared by the community.</p>
        </div>
        {user && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            Share Resource
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass rounded-2xl p-6 h-24 animate-pulse bg-neutral-100/50"></div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {resources.map(r => (
            <ResourceCard 
              key={r.id} 
              resource={r} 
              isOwner={user?.uid === r.ownerUid}
              onDelete={() => handleDeleteResource(r.id)}
            />
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Share Resource</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleAddResource} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-700">Title *</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. Fullstack Web Dev Roadmap 2026"
                      value={newResource.title}
                      onChange={e => setNewResource({...newResource, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-700">Type *</label>
                      <select 
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={newResource.type}
                        onChange={e => setNewResource({...newResource, type: e.target.value as any})}
                      >
                        <option value="link">Link</option>
                        <option value="roadmap">Roadmap</option>
                        <option value="pdf">PDF / Document</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-neutral-700">Tags</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Frontend, Career, DSA"
                        value={newResource.tags}
                        onChange={e => setNewResource({...newResource, tags: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-700">URL *</label>
                    <input 
                      required
                      type="url" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="https://..."
                      value={newResource.url}
                      onChange={e => setNewResource({...newResource, url: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-700">Description</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      placeholder="Briefly describe what this resource is about..."
                      value={newResource.description}
                      onChange={e => setNewResource({...newResource, description: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Share with Community
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TeamsPage = () => {
  const { user, profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    requiredSkills: ''
  });

  useEffect(() => {
    if (!user) return;

    // Fetch my teams
    const qTeams = query(
      collection(db, 'teams'),
      where('members', 'array-contains', user.uid)
    );
    const unsubTeams = onSnapshot(qTeams, (snap) => {
      setTeams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
      setLoading(false);
    });

    // Fetch incoming requests
    const qReqs = query(
      collection(db, 'teamRequests'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubReqs = onSnapshot(qReqs, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamRequest)));
    });

    return () => {
      unsubTeams();
      unsubReqs();
    };
  }, [user]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      const teamId = doc(collection(db, 'teams')).id;
      const teamData: Team = {
        id: teamId,
        name: newTeam.name,
        description: newTeam.description,
        ownerUid: user.uid,
        members: [user.uid],
        requiredSkills: newTeam.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Team;

      await setDoc(doc(db, 'teams', teamId), teamData).catch(e => handleFirestoreError(e, OperationType.CREATE, `teams/${teamId}`));
      
      // Create a group chat for the team
      const chatId = doc(collection(db, 'chats')).id;
      const chatData: Chat = {
        id: chatId,
        participants: [user.uid],
        isGroup: true,
        name: newTeam.name,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'chats', chatId), chatData).catch(e => handleFirestoreError(e, OperationType.CREATE, `chats/${chatId}`));
      
      // Update team with chatId
      await updateDoc(doc(db, 'teams', teamId), { chatId }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `teams/${teamId}`));

      setShowCreateModal(false);
      setNewTeam({ name: '', description: '', requiredSkills: '' });
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const handleAcceptRequest = async (req: TeamRequest) => {
    try {
      // Add member to team
      const teamRef = doc(db, 'teams', req.teamId);
      const teamDoc = await getDoc(teamRef);
      if (teamDoc.exists()) {
        const team = teamDoc.data() as Team;
        await updateDoc(teamRef, {
          members: [...team.members, user!.uid],
          updatedAt: new Date().toISOString()
        }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `teams/${req.teamId}`));

        // Update group chat participants
        if (team.chatId) {
          const chatRef = doc(db, 'chats', team.chatId);
          const chatDoc = await getDoc(chatRef);
          if (chatDoc.exists()) {
            const chat = chatDoc.data() as Chat;
            await updateDoc(chatRef, {
              participants: [...chat.participants, user!.uid],
              updatedAt: new Date().toISOString()
            }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `chats/${team.chatId}`));
          }
        }
      }

      // Update request status
      await updateDoc(doc(db, 'teamRequests', req.id), {
        status: 'accepted',
        updatedAt: new Date().toISOString()
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `teamRequests/${req.id}`));

      // Notify sender
      await sendNotification({
        recipientId: req.senderId,
        type: 'team_accepted',
        title: 'Team Request Accepted',
        message: `${profile?.displayName} joined your team!`,
        link: `/teams`,
        senderId: user!.uid,
        senderName: profile?.displayName || 'Someone'
      });

    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleRejectRequest = async (req: TeamRequest) => {
    try {
      await updateDoc(doc(db, 'teamRequests', req.id), {
        status: 'rejected',
        updatedAt: new Date().toISOString()
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `teamRequests/${req.id}`));
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!user || teams.length === 0) return;

    const fetchSuggestions = async () => {
      // Get all required skills from all teams
      const allRequiredSkills = Array.from(new Set(teams.flatMap(t => t.requiredSkills)));
      if (allRequiredSkills.length === 0) return;

      try {
        // This is a simple implementation. Firestore doesn't support complex array intersections well.
        // We'll fetch users who have at least one of the required skills.
        const q = query(
          collection(db, 'profiles'),
          where('skills', 'array-contains-any', allRequiredSkills.slice(0, 10)), // Firestore limit
          limit(5)
        );
        const snap = await getDocs(q);
        const suggestedUsers = snap.docs
          .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
          .filter(u => u.uid !== user.uid && !teams.some(t => t.members.includes(u.uid)));
        
        setSuggestions(suggestedUsers);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    fetchSuggestions();
  }, [user, teams]);

  const handleInvite = async (targetUser: UserProfile, team: Team) => {
    try {
      const requestId = doc(collection(db, 'teamRequests')).id;
      const requestData: TeamRequest = {
        id: requestId,
        teamId: team.id,
        teamName: team.name,
        senderId: user!.uid,
        senderName: profile?.displayName || 'Someone',
        receiverId: targetUser.uid,
        status: 'pending',
        message: `Join our team: ${team.name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'teamRequests', requestId), requestData).catch(e => handleFirestoreError(e, OperationType.CREATE, `teamRequests/${requestId}`));
      
      await sendNotification({
        recipientId: targetUser.uid,
        type: 'team_invite',
        title: 'Team Invitation',
        message: `${profile?.displayName} invited you to join ${team.name}`,
        link: `/teams`,
        senderId: user!.uid,
        senderName: profile?.displayName || 'Someone'
      });

      alert(`Invitation sent to ${targetUser.displayName}!`);
    } catch (error) {
      console.error("Error sending invitation:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-neutral-900 mb-2 tracking-tight">Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Team</span></h1>
          <p className="text-neutral-500">Collaborate with others to bring your ideas to life.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
        >
          <Plus size={20} />
          Create Team
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Incoming Requests */}
          {requests.length > 0 && (
            <section className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bell size={20} className="text-indigo-600" />
                Team Invitations
              </h2>
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req.id} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-neutral-900">{req.senderName} invited you to join their team.</p>
                      <p className="text-sm text-neutral-500">{req.message}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAcceptRequest(req)}
                        className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                      >
                        <Check size={20} />
                      </button>
                      <button 
                        onClick={() => handleRejectRequest(req)}
                        className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* My Teams */}
          <section>
            <h2 className="text-2xl font-bold mb-6">My Teams</h2>
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map(i => <div key={i} className="h-48 glass rounded-3xl animate-pulse" />)}
              </div>
            ) : teams.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {teams.map(team => (
                  <div key={team.id} className="glass rounded-3xl p-6 border border-neutral-100 hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Users size={24} />
                      </div>
                      <Link 
                        to="/messages" 
                        className="p-2 bg-neutral-50 text-neutral-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                      >
                        <MessageSquare size={20} />
                      </Link>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-600 transition-colors">{team.name}</h3>
                    <p className="text-neutral-500 text-sm mb-4 line-clamp-2">{team.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 3).map((m, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-neutral-200 border-2 border-white" />
                        ))}
                        {team.members.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-neutral-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-neutral-500">
                            +{team.members.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400 font-medium">{team.members.length} members</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {team.requiredSkills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-neutral-50 text-neutral-500 rounded-lg text-xs font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass rounded-3xl border border-dashed border-neutral-200">
                <Users size={48} className="mx-auto mb-4 text-neutral-300" />
                <p className="text-neutral-500 font-medium">You haven't joined any teams yet.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-indigo-600 font-bold hover:underline"
                >
                  Create your first team
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          {/* Skill-based Suggestions */}
          <section className="glass rounded-3xl p-6 border border-neutral-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Rocket size={20} className="text-orange-500" />
              Suggested Members
            </h2>
            <div className="space-y-6">
              {suggestions.length > 0 ? (
                suggestions.map(sug => (
                  <div key={sug.uid} className="flex items-center justify-between gap-4 p-3 hover:bg-neutral-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={sug.photoURL || `https://ui-avatars.com/api/?name=${sug.displayName}`} className="w-10 h-10 rounded-full shrink-0" />
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate">{sug.displayName}</p>
                        <p className="text-xs text-neutral-500 truncate">{sug.skills?.slice(0, 2).join(', ')}</p>
                      </div>
                    </div>
                    {teams.length > 0 && (
                      <button 
                        onClick={() => handleInvite(sug, teams[0])}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                        title="Invite to your first team"
                      >
                        <UserPlus size={16} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500 italic">Students matching your team's required skills will appear here.</p>
              )}
              <Link to="/explore" className="block text-center py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
                Find Talent
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Create New Team</h2>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateTeam} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-700">Team Name *</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. AI Innovators"
                      value={newTeam.name}
                      onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-700">Description *</label>
                    <textarea 
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      placeholder="What is your team's goal?"
                      value={newTeam.description}
                      onChange={e => setNewTeam({...newTeam, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-700">Required Skills (comma separated)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="React, Node.js, UI Design"
                      value={newTeam.requiredSkills}
                      onChange={e => setNewTeam({...newTeam, requiredSkills: e.target.value})}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Launch Team
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `notifications/${id}`));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-8">Notifications</h1>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 glass rounded-2xl animate-pulse" />)}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(n => (
            <Link 
              key={n.id} 
              to={n.link || '#'}
              onClick={() => markAsRead(n.id)}
              className={cn(
                "block p-4 rounded-2xl border transition-all",
                n.read ? "bg-white border-neutral-100" : "bg-indigo-50/50 border-indigo-100 shadow-sm"
              )}
            >
              <div className="flex gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  n.type === 'team_invite' ? "bg-blue-100 text-blue-600" :
                  n.type === 'message' ? "bg-pink-100 text-pink-600" :
                  "bg-indigo-100 text-indigo-600"
                )}>
                  {n.type === 'team_invite' ? <UserPlus size={20} /> :
                   n.type === 'message' ? <Mail size={20} /> :
                   <Bell size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">{n.title}</h3>
                  <p className="text-sm text-neutral-600">{n.message}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Bell size={64} className="mx-auto mb-4 text-neutral-200" />
          <p className="text-neutral-500">No notifications yet.</p>
        </div>
      )}
    </div>
  );
};


