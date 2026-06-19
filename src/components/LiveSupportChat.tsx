import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  MessageSquare, 
  Send, 
  X, 
  User, 
  Check, 
  CheckCheck, 
  UserCheck, 
  Clock, 
  AlertCircle,
  Sparkles,
  ChevronDown,
  Trash2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  isAdmin: boolean;
}

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCountForAdmin: number;
  unreadCountForUser: number;
  status: 'active' | 'closed';
}

// ==========================================
// 1. FRONT-END CLIENT LIVE SUPPORT CHATBOX
// ==========================================
interface LiveSupportChatProps {
  user: any;
  profile: any;
  lang: 'vi' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

export const LiveSupportChat: React.FC<LiveSupportChatProps> = ({ 
  user, 
  profile, 
  lang, 
  isOpen, 
  onClose 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Setup Session ID
  useEffect(() => {
    if (user?.uid) {
      setSessionId(user.uid);
      setClientName(profile?.name || user.displayName || 'Khách hàng');
      setClientEmail(user.email || '');
      setShowIdentityForm(false);
    } else {
      let guestId = localStorage.getItem('nc_support_guest_id');
      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('nc_support_guest_id', guestId);
      }
      setSessionId(guestId);
      
      const storedName = localStorage.getItem('nc_support_guest_name');
      const storedEmail = localStorage.getItem('nc_support_guest_email');
      if (storedName) {
        setClientName(storedName);
        setClientEmail(storedEmail || '');
        setShowIdentityForm(false);
      } else {
        setClientName(`Khách vãng lai (${guestId.slice(6, 10).toUpperCase()})`);
        setClientEmail('');
        setShowIdentityForm(true);
      }
    }
  }, [user, profile]);

  // Listen to messages in real-time
  useEffect(() => {
    if (!sessionId || !isOpen) return;

    // Reset user's unread counter when they open the chat
    const sessionRef = doc(db, 'live_chats', sessionId);
    updateDoc(sessionRef, { unreadCountForUser: 0 }).catch(() => {});

    const msgCollectionRef = collection(db, 'live_chats', sessionId, 'messages');
    const q = query(msgCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          id: docSnap.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          timestamp: data.timestamp,
          isAdmin: !!data.isAdmin
        });
      });
      setMessages(msgs);
    }, (error) => {
      console.error("Firestore loading messages failed: ", error);
    });

    return () => unsubscribe();
  }, [sessionId, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    localStorage.setItem('nc_support_guest_name', clientName.trim());
    localStorage.setItem('nc_support_guest_email', clientEmail.trim());
    setShowIdentityForm(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (showIdentityForm) {
      setShowIdentityForm(false);
    }

    const textToSend = inputText.trim();
    setInputText('');

    try {
      // Create supporting documents
      const sessionRef = doc(db, 'live_chats', sessionId);
      const messagesRef = collection(db, 'live_chats', sessionId, 'messages');

      // Add actual message
      await addDoc(messagesRef, {
        senderId: sessionId,
        senderName: clientName,
        text: textToSend,
        timestamp: serverTimestamp(),
        isAdmin: false
      });

      // Update room status
      await setDoc(sessionRef, {
        id: sessionId,
        userId: user?.uid || sessionId,
        userName: clientName,
        userEmail: clientEmail || 'Guest (Offline)',
        lastMessage: textToSend,
        lastMessageTime: serverTimestamp(),
        unreadCountForAdmin: 1, // incremented implicitly or set to 1
        unreadCountForUser: 0,
        status: 'active'
      }, { merge: true });

    } catch (err) {
      console.error("Lỗi gửi tin nhắn hỗ trợ: ", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-[345px] h-[520px] mb-2 bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-indigo-700 text-white flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center relative shadow-inner">
              <MessageSquare size={18} className="text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-600 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black tracking-tight">{lang === 'vi' ? 'Hỗ trợ kỹ thuật / Dinh dưỡng' : 'Dignosis & Tech Support'}</p>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">{lang === 'vi' ? 'Trò chuyện với Admin' : 'Admin Live Consultation'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all focus:outline-none cursor-pointer border border-red-500/30"
          >
            <span>{lang === 'vi' ? 'Thoát' : 'Exit'}</span>
            <X size={12} className="stroke-[3]" />
          </button>
        </div>

        {/* Identity Settings for Guest */}
        {showIdentityForm ? (
          <div className="flex-1 p-6 flex flex-col bg-slate-50 justify-center">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-md">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-4 flex items-center gap-1.5 justify-center">
                <Sparkles size={14} className="text-emerald-500" />
                {lang === 'vi' ? 'Thông tin của bạn' : 'Identify Yourself'}
              </h3>
              <form onSubmit={handleSaveIdentity} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{lang === 'vi' ? 'Họ và tên' : 'Full Name'}</label>
                  <input 
                    type="text" 
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={lang === 'vi' ? 'Ví dụ: Nguyễn Văn A' : 'e.g., John Doe'}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{lang === 'vi' ? 'Email / SĐT (Không bắt buộc)' : 'Email or Phone (Optional)'}</label>
                  <input 
                    type="text" 
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder={lang === 'vi' ? 'Nhập email hoặc SĐT để admin liên hệ' : 'Enter email/phone for follow-up'}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-lg transition-all"
                >
                  {lang === 'vi' ? 'Bắt đầu kết nối' : 'Start Chating'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Real-time active chat viewport */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* System banner */}
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-start gap-2">
              <Clock size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-amber-800 font-medium font-sans">
                {lang === 'vi' 
                  ? 'Ý kiến, phản hồi, lỗi hoặc đề xuất thực đơn của bạn sẽ được gửi trực tiếp đến hệ điều hành của Quản Trị Viên.'
                  : 'Your feedback, bug reports, and menu requests are synced live with the management command center.'}
              </p>
            </div>

            {/* Chat list */}
            <div 
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-200"
            >
              {messages.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_5px_15px_rgba(0,0,0,0.03)] border border-slate-100">
                    <Sparkles className="text-indigo-500 animate-spin animate-duration-3000" size={20} />
                  </div>
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">{lang === 'vi' ? 'Kênh hỗ trợ trực tiếp' : 'Direct Support Channel'}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    {lang === 'vi' ? 'Hãy gửi lời nhắn của bạn. Admin sẽ nhận được và phản hồi ngay lập tức tại đây!' : 'Send your request. Active admin will track and reply in real-time!'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === sessionId;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Display Sender names for admin replies */}
                        {!isMe && (
                          <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5 ml-1">
                            {msg.senderName} (Admin)
                          </span>
                        )}
                        <div className={`px-3 py-2.5 rounded-2xl text-[11px] leading-relaxed font-medium ${
                          isMe 
                            ? 'bg-slate-900 text-white rounded-tr-none shadow-sm font-sans' 
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                        {/* Status detail */}
                        {msg.timestamp && typeof msg.timestamp.toDate === 'function' && (
                          <div className="flex items-center gap-1 mt-1 px-1">
                            <span className="text-[8px] font-bold text-slate-400 tracking-tighter">
                              {new Date(msg.timestamp.toDate()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCheck size={10} className="text-emerald-500 font-black" />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Form Input Message */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200/60 flex items-center gap-2">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập tin nhắn đến Admin...' : 'Type message to executive...'}
                className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all text-slate-800 outline-none"
              />
              <button
                type="submit"
                className="w-9 h-9 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-md active:scale-95"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ==========================================
// 2. ADMIN-SIDE SUPPORT DASHBOARD COMPONENT
// ==========================================
export const AdminChatPanel: React.FC<{ isAdminDarkMode: boolean }> = ({ isAdminDarkMode }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen to all sessions in real-time
  useEffect(() => {
    const sessionsRef = collection(db, 'live_chats');
    const q = query(sessionsRef, orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatSession[] = [];
      snapshot.forEach((snapDoc) => {
        const data = snapDoc.data();
        list.push({
          id: snapDoc.id,
          userId: data.userId || snapDoc.id,
          userName: data.userName || 'Unknown Client',
          userEmail: data.userEmail || '',
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime,
          unreadCountForAdmin: Number(data.unreadCountForAdmin || 0),
          unreadCountForUser: Number(data.unreadCountForUser || 0),
          status: data.status || 'active'
        });
      });
      setSessions(list);
      setLoading(false);
    }, (error) => {
      console.error("Listening sessions failed: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to active session messages in real-time
  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }

    // Reset unread counter for admin since admin is reading it
    const sessionRef = doc(db, 'live_chats', selectedSessionId);
    updateDoc(sessionRef, { unreadCountForAdmin: 0 }).catch(() => {});

    const msgsRef = collection(db, 'live_chats', selectedSessionId, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((snap) => {
        const data = snap.data();
        list.push({
          id: snap.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          timestamp: data.timestamp,
          isAdmin: !!data.isAdmin
        });
      });
      setMessages(list);
    }, (error) => {
      console.error("Listening session's messages failed: ", error);
    });

    return () => unsubscribe();
  }, [selectedSessionId]);

  // Auto-scroll inside chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !adminReplyText.trim()) return;

    const text = adminReplyText.trim();
    setAdminReplyText('');

    try {
      const messagesRef = collection(db, 'live_chats', selectedSessionId, 'messages');
      const sessionRef = doc(db, 'live_chats', selectedSessionId);

      // Add actual reply post
      await addDoc(messagesRef, {
        senderId: 'admin_team',
        senderName: 'Chuyên gia NutriCare',
        text: text,
        timestamp: serverTimestamp(),
        isAdmin: true
      });

      // Update session information
      await updateDoc(sessionRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        unreadCountForUser: 1, // trigger visual notify in guest chatbox
        unreadCountForAdmin: 0
      });

    } catch (err) {
      console.error("Review posting failed: ", err);
    }
  };

  const handleCloseSession = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn đóng phiên trò chuyện này không?")) return;
    try {
      await updateDoc(doc(db, 'live_chats', id), {
        status: 'closed'
      });
      if (selectedSessionId === id) setSelectedSessionId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm("HÀNH ĐỘNG KHÔNG THỂ KHÔI PHỤC: Bạn có muốn xóa vĩnh viễn toàn bộ lịch sử đoạn chat này không?")) return;
    try {
      // Delete subcollection messages first (though typical firestore requires batch deleting)
      const msgsPath = collection(db, 'live_chats', id, 'messages');
      const qSnap = await getDocs(msgsPath);
      for (const d of qSnap.docs) {
        await deleteDoc(doc(db, 'live_chats', id, 'messages', d.id));
      }
      // Delete main document
      await deleteDoc(doc(db, 'live_chats', id));
      if (selectedSessionId === id) setSelectedSessionId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`grid grid-cols-12 gap-6 h-[650px] rounded-3xl overflow-hidden border shadow-inner ${
      isAdminDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-100'
    }`}>
      {/* 1. SECTIONS DIRECTORIES SCREEN (LEFT) */}
      <div className={`col-span-12 md:col-span-4 border-r flex flex-col h-full ${
        isAdminDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className={`text-[11px] font-black uppercase tracking-widest ${isAdminDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Đoạn chat hỗ trợ ({sessions.length})
          </h3>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/10 p-2 space-y-1.5 custom-scroll">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400 italic">Đang tải danh sách hỗ trợ...</div>
          ) : sessions.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <MessageSquare size={28} className="text-slate-300 mx-auto" />
              <p className="text-[11px] font-black uppercase text-slate-400">Không có yêu cầu!</p>
              <p className="text-[10px] text-slate-400 font-medium">Hiện không có khách hàng nào yêu cầu hỗ trợ trực tuyến.</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isSelected = selectedSessionId === sess.id;
              const hasUnread = sess.unreadCountForAdmin > 0;
              return (
                <div 
                  key={sess.id}
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer flex flex-col justify-between transition-all border ${
                    isSelected 
                      ? (isAdminDarkMode ? 'bg-slate-800 border-indigo-900/60 shadow-md' : 'bg-indigo-50/50 border-indigo-100 shadow-md')
                      : (isAdminDarkMode ? 'border-transparent hover:bg-slate-800/40' : 'border-transparent hover:bg-white hover:shadow-xs')
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black truncate max-w-[70%] font-sans ${
                      isAdminDarkMode ? 'text-slate-100' : 'text-slate-800'
                    }`}>
                      {sess.userName}
                    </span>
                    {sess.lastMessageTime && typeof sess.lastMessageTime.toDate === 'function' && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase">
                        {new Date(sess.lastMessageTime.toDate()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] truncate max-w-[85%] font-medium ${
                      hasUnread 
                        ? 'text-indigo-500 font-black' 
                        : (isAdminDarkMode ? 'text-slate-400' : 'text-slate-500')
                    }`}>
                      {sess.lastMessage || 'Đang mở phòng...'}
                    </span>
                    {hasUnread && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce shadow-md shadow-emerald-400" />
                    )}
                  </div>
                  
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/5 pt-2">
                    <span className="text-[8px] font-bold text-slate-400/90 font-mono truncate max-w-[60%]">ID: {sess.id.slice(0,8).toUpperCase()}</span>
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => handleDeleteSession(sess.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isAdminDarkMode ? 'border-none bg-slate-820 hover:bg-rose-950/40 text-rose-400' : 'border-slate-100 hover:border-rose-100 hover:bg-rose-50 text-rose-500'
                        }`}
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 size={11} className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. LIVE INTEGRATED MESSAGING VIEWPORT (RIGHT) */}
      <div className={`col-span-12 md:col-span-8 flex flex-col h-full ${
        isAdminDarkMode ? 'bg-slate-900/40' : 'bg-slate-50/20'
      }`}>
        {selectedSessionId ? (
          (() => {
            const currentSession = sessions.find(s => s.id === selectedSessionId);
            return (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Active user details head */}
                <div className={`p-4 border-b flex items-center justify-between shadow-xs ${
                  isAdminDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white font-black text-xs">
                      <User size={16} />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${isAdminDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {currentSession?.userName}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                        {currentSession?.userEmail}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                      Đang nhận cuộc gọi
                    </span>
                  </div>
                </div>

                {/* Sub-scrolling chat bubbles */}
                <div 
                  ref={scrollRef}
                  className="flex-1 p-6 overflow-y-auto space-y-4 custom-scroll"
                >
                  {messages.map((m) => {
                    return (
                      <div 
                        key={m.id}
                        className={`flex ${m.isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] flex flex-col ${m.isAdmin ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-3 rounded-2xl text-xs gap-1 font-semibold shadow-xs ${
                            m.isAdmin 
                              ? 'bg-slate-900 text-white rounded-tr-none' 
                              : (isAdminDarkMode ? 'bg-slate-800 border border-slate-750 text-slate-100 rounded-tl-none' : 'bg-white border text-slate-800 rounded-tl-none')
                          }`}>
                            <p>{m.text}</p>
                          </div>
                          {m.timestamp && typeof m.timestamp.toDate === 'function' && (
                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 px-1">
                              {new Date(m.timestamp.toDate()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {m.senderName}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Input Reply controls */}
                <form 
                  onSubmit={handleSendAdminReply}
                  className={`p-4 border-t flex gap-2 items-center ${
                    isAdminDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
                  }`}
                >
                  <input 
                    type="text"
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder="Nhập câu trả lời Live của bạn..."
                    className={`flex-1 border rounded-xl px-4 py-3 text-xs outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all font-semibold ${
                      isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                  <button 
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all outline-none"
                  >
                    <Send size={12} />
                    <span>Gửi</span>
                  </button>
                </form>
              </div>
            );
          })()
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className={`w-20 h-20 rounded-full border flex items-center justify-center ${
              isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-100/80 text-slate-300'
            }`}>
              <MessageSquare size={40} className="stroke-1.5 animate-bounce animate-duration-2000" />
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${isAdminDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                HỆ THỐNG TRỰC LIVE CHAT ADMIN
              </p>
              <p className="text-[10px] text-slate-400 font-medium max-w-sm mx-auto mt-1 leading-relaxed">
                Hãy lựa chọn một đoạn hội thoại yêu cầu hỗ trợ từ ngăn xếp ở cột bên trái để trò chuyện, giải đáp hoặc hướng dẫn tận tình cho khách hàng trong thời gian thực.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
