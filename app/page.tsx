"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Plus, Trash2, X, Activity, Menu, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, 
  LogOut, Lock, Mail, Tag, BarChart3, ShieldAlert, Edit3, ExternalLink, User, 
  Image as ImageIcon, MessageCircle, UserPlus, Send, Search, Clock, Settings, 
  Palette, Paintbrush, Link2, Eye, Upload, MoreVertical
} from "lucide-react";

// --- KONFİGÜRASYON ---
const supabaseUrl = "https://wobnwchodzgsofpybztg.supabase.co";
const supabaseKey = "sb_publishable_JgD3W7_LA5OLvE_j2GzgSw_4vBaKN7N";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Category { id: string; name: string; }
interface ArchiveItem { id: number; title: string; mega_url: string; image_url: string; category: string; order_index: number; }
interface LogEntry { id: number; created_at: string; title: string; image_url: string; user_name?: string; file_id?: number | null; }
interface Message { 
  id?: number; 
  created_at?: string; 
  sender_name: string; 
  receiver_name: string; 
  text: string; 
  is_deleted?: boolean;
  image_url?: string;
  file_url?: string;
  file_name?: string;
}
interface ChatBackgroundSettings {
  imageUrl: string;
  blur: number;
  opacity: number;
}
interface BackgroundSettings {
  type: 'solid' | 'gradient' | 'image';
  solidColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientDirection: string;
  imageUrl: string;
  blur: number;
  opacity: number;
}

export default function EmreBoard() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [avatarUrl, setAvatarUrl] = useState("");
  const [files, setFiles] = useState<ArchiveItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: string}>({}); 
  const [friends, setFriends] = useState<string[]>([]);

  // Sohbet & Arkadaş Ekleme State'leri
  const [activeChatFriend, setActiveChatFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchFriendName, setSearchFriendName] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [showFriendsPanel, setShowFriendsPanel] = useState(true);
  
  // Chat background settings
  const [chatBackgroundSettings, setChatBackgroundSettings] = useState<ChatBackgroundSettings>({
    imageUrl: '',
    blur: 0,
    opacity: 30
  });
  
  // Chat file upload
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [editingItem, setEditingItem] = useState<ArchiveItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMegaUrl, setEditMegaUrl] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [randomCard, setRandomCard] = useState<ArchiveItem | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [megaUrl, setMegaUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

const [isAdmin, setIsAdmin] = useState(false);
  const ADMIN_NAME = "Emre";

  // Ayarlar State'leri
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchedUserData, setSearchedUserData] = useState<{user: string; files: ArchiveItem[]; logs: LogEntry[]} | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{[key: string]: {online: boolean; last_seen: string}}>({});
  const [activeConversations, setActiveConversations] = useState<string[]>([]);
  const [cardTransferMenu, setCardTransferMenu] = useState<{fileId: number; x: number; y: number} | null>(null);
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>({
    type: 'solid',
    solidColor: '#050505',
    gradientStart: '#050505',
    gradientEnd: '#1a1a2e',
    gradientDirection: 'to bottom right',
    imageUrl: '',
    blur: 0,
    opacity: 50
  });

  const currentUserName = session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || "Anonim";

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) fetchAllData();
    };
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
    });

    const savedProfiles = localStorage.getItem("emre_board_profiles");
    if (savedProfiles) setUserProfiles(JSON.parse(savedProfiles));

const savedFriends = localStorage.getItem("emre_board_friends");
    if (savedFriends) setFriends(JSON.parse(savedFriends));

    const savedBgSettings = localStorage.getItem("emre_board_bg_settings");
    if (savedBgSettings) setBackgroundSettings(JSON.parse(savedBgSettings));
    
    const savedChatBgSettings = localStorage.getItem("emre_board_chat_bg_settings");
    if (savedChatBgSettings) setChatBackgroundSettings(JSON.parse(savedChatBgSettings));
    
    const savedConversations = localStorage.getItem("emre_board_conversations");
    if (savedConversations) setActiveConversations(JSON.parse(savedConversations));

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
return () => { authListener.subscription.unsubscribe(); };
  }, []);

  // Presence (Online/Offline Durumu) ve Realtime Mesajlar
  useEffect(() => {
    if (!session || !currentUserName) return;

    // Presence channel for online status
    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: currentUserName } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const newOnlineUsers: {[key: string]: {online: boolean; last_seen: string}} = {};
        Object.keys(state).forEach(key => {
          newOnlineUsers[key] = { online: true, last_seen: new Date().toISOString() };
        });
        setOnlineUsers(prev => ({ ...prev, ...newOnlineUsers }));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => ({ ...prev, [key]: { online: true, last_seen: new Date().toISOString() } }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => ({ ...prev, [key]: { online: false, last_seen: new Date().toISOString() } }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user: currentUserName, online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(presenceChannel); };
  }, [session, currentUserName]);

  // Sohbet Gerçek Zamanlı Dinleyici
  useEffect(() => {
    if (!showChatPanel || !activeChatFriend) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_name.eq.${currentUserName},receiver_name.eq.${activeChatFriend}),and(sender_name.eq.${activeChatFriend},receiver_name.eq.${currentUserName})`)
        .order("id", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat:${activeChatFriend}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as Message;
        if ((newMsg.sender_name === currentUserName && newMsg.receiver_name === activeChatFriend) ||
            (newMsg.sender_name === activeChatFriend && newMsg.receiver_name === currentUserName)) {
          setMessages((prev) => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showChatPanel, activeChatFriend, currentUserName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchAllData() {
    const { data: catData } = await supabase.from("kategoriler").select("*").order("id", { ascending: true });
    if (catData) setCategories(catData as Category[]);
    const { data: fileData } = await supabase.from("arsiv").select("*").order("order_index", { ascending: true });
    if (fileData) setFiles(fileData as ArchiveItem[]);
    const { data: logData } = await supabase.from("logs").select("*").order("id", { ascending: false });
    if (logData) setLogs(logData as LogEntry[]);
  }

const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !chatFile) || !activeChatFriend) return;

    let imageUrl = '';
    let fileUrl = '';
    let fileName = '';

    // Dosya/Resim yukleme
    if (chatFile) {
      const uploadFileName = `chat-${Date.now()}-${chatFile.name.replace(/\s/g, '-')}`;
      const { error: uploadError } = await supabase.storage.from("arsiv-dosyalari").upload(uploadFileName, chatFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(uploadFileName);
        if (chatFile.type.startsWith('image/')) {
          imageUrl = urlData.publicUrl;
        } else {
          fileUrl = urlData.publicUrl;
          fileName = chatFile.name;
        }
      }
    }

    const { error } = await supabase.from("messages").insert([
      { 
        sender_name: currentUserName, 
        receiver_name: activeChatFriend, 
        text: newMessage.trim(),
        image_url: imageUrl || null,
        file_url: fileUrl || null,
        file_name: fileName || null
      }
    ]);

    if (error) {
        console.error("Mesaj Hatasi:", error);
        alert("Mesaj gonderilemedi. Lutfen veri tabaninda 'sender_name', 'receiver_name' ve 'text' sutunlarinin oldugunu kontrol edin.");
    } else {
        setNewMessage("");
        setChatFile(null);
        setChatImagePreview(null);
        
        // Otomatik sohbet baslatma - alici tarafa sohbet ekle
        if (!activeConversations.includes(activeChatFriend)) {
          const newConversations = [...activeConversations, activeChatFriend];
          setActiveConversations(newConversations);
          localStorage.setItem("emre_board_conversations", JSON.stringify(newConversations));
        }
    }
  };

  // CTRL+V ile chat arka plan resmi yapistirma
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!showChatPanel) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            // Eger sohbet arka plani ayarlari aciksa, arka plan olarak ayarla
            const settingsOpen = document.querySelector('[data-chat-settings]');
            if (settingsOpen) {
              // Arka plan icin upload
              const fileName = `chat-bg-${Date.now()}-${file.name || 'pasted.png'}`;
              const { error } = await supabase.storage.from("arsiv-dosyalari").upload(fileName, file);
              if (!error) {
                const { data: urlData } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fileName);
                const newSettings = { ...chatBackgroundSettings, imageUrl: urlData.publicUrl };
                setChatBackgroundSettings(newSettings);
                localStorage.setItem("emre_board_chat_bg_settings", JSON.stringify(newSettings));
              }
            } else {
              // Normal mesaj icin resim yapistir
              setChatFile(file);
              setChatImagePreview(URL.createObjectURL(file));
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showChatPanel, chatBackgroundSettings]);

  // Mesaj silme fonksiyonu (is_deleted flag)
  const handleDeleteMessage = async (msgId: number, senderName: string) => {
    if (senderName !== currentUserName && !isAdmin) {
      alert("Sadece kendi mesajlarinizi silebilirsiniz!");
      return;
    }
    if (!confirm("Bu mesaji silmek istediginize emin misiniz?")) return;
    
    const { error } = await supabase.from("messages").update({ is_deleted: true }).eq("id", msgId);
    if (!error) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m));
    }
  };

  // Sohbeti temizle (Admin)
  const handleClearChat = async () => {
    if (!isAdmin || !activeChatFriend) return;
    if (!confirm(`${activeChatFriend} ile tum sohbeti temizlemek istediginize emin misiniz?`)) return;
    
    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true })
      .or(`and(sender_name.eq.${currentUserName},receiver_name.eq.${activeChatFriend}),and(sender_name.eq.${activeChatFriend},receiver_name.eq.${currentUserName})`);
    
    if (!error) {
      setMessages(prev => prev.map(m => ({ ...m, is_deleted: true })));
    }
  };

  // Kullanici silme (Admin)
  const handleDeleteUser = async (userName: string) => {
    if (!isAdmin) return;
    if (!confirm(`${userName} kullanicisinin tum verilerini silmek istediginize emin misiniz? Bu islem geri alinamaz!`)) return;
    
    // Kullanicinin loglarini sil
    await supabase.from("logs").delete().eq("user_name", userName);
    // Kullanicinin mesajlarini sil
    await supabase.from("messages").delete().or(`sender_name.eq.${userName},receiver_name.eq.${userName}`);
    
    fetchAllData();
    alert(`${userName} kullanicisi silindi.`);
  };

  // Profil resmi yukleme (profiles bucket)
  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileName = `profile-${currentUserName}-${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from("profiles").upload(fileName, file);
      const { data: urlData } = supabase.storage.from("profiles").getPublicUrl(fileName);
      const newProfiles = { ...userProfiles, [currentUserName]: urlData.publicUrl };
      setUserProfiles(newProfiles);
      localStorage.setItem("emre_board_profiles", JSON.stringify(newProfiles));
    } catch (err: any) { 
      // profiles bucket yoksa arsiv-dosyalari kullan
      try {
        const fileName = `profile-${currentUserName}-${Date.now()}.${file.name.split('.').pop()}`;
        await supabase.storage.from("arsiv-dosyalari").upload(fileName, file);
        const { data: urlData } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fileName);
        const newProfiles = { ...userProfiles, [currentUserName]: urlData.publicUrl };
        setUserProfiles(newProfiles);
        localStorage.setItem("emre_board_profiles", JSON.stringify(newProfiles));
      } catch (e: any) { alert(e.message); }
    } finally { setLoading(false); }
  };

  // Liste sirasi degistirme (manuel sol/sag)
  const moveCategoryOrder = async (catIndex: number, direction: 'left' | 'right') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'left' ? catIndex - 1 : catIndex + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;
    
    // Swap
    [newCategories[catIndex], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[catIndex]];
    setCategories(newCategories);
    
    // Veritabaninda id'leri guncelle (basit yontem - local state tutarak)
    localStorage.setItem("emre_board_cat_order", JSON.stringify(newCategories.map(c => c.id)));
  };

  // Karti baska listeye tasima
  const transferCardToCategory = async (fileId: number, newCategoryId: string) => {
    const { error } = await supabase.from("arsiv").update({ category: newCategoryId }).eq("id", fileId);
    if (!error) {
      fetchAllData();
      setCardTransferMenu(null);
    }
  };

  // Arkadas silme + mesaj gecmisi temizleme
  const handleRemoveFriend = async (friendName: string) => {
    if (!confirm(`${friendName} arkadasinizi silmek istediginize emin misiniz? Mesaj gecmisi de silinecek.`)) return;
    
    // Mesajlari sil (local)
    const newFriends = friends.filter(f => f !== friendName);
    setFriends(newFriends);
    localStorage.setItem("emre_board_friends", JSON.stringify(newFriends));
    
    // Aktif sohbetten kaldir
    const newConversations = activeConversations.filter(c => c !== friendName);
    setActiveConversations(newConversations);
    localStorage.setItem("emre_board_conversations", JSON.stringify(newConversations));
    
    if (activeChatFriend === friendName) {
      setActiveChatFriend(null);
      setMessages([]);
    }
  };

  // Sohbet arka plani dosya yukleme
  const handleChatBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fileName = `chat-bg-${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    const { error } = await supabase.storage.from("arsiv-dosyalari").upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fileName);
      const newSettings = { ...chatBackgroundSettings, imageUrl: urlData.publicUrl };
      setChatBackgroundSettings(newSettings);
      localStorage.setItem("emre_board_chat_bg_settings", JSON.stringify(newSettings));
    }
  };

  const handleAddFriend = async () => {
    const target = searchFriendName.trim();
    if (!target) return;
    if (target === currentUserName) { alert("Kendini ekleyemezsin!"); return; }
    if (friends.includes(target)) { alert("Bu kişi zaten ekli!"); return; }

    // Kayıtlı Kullanıcı Kontrolü (Logs tablosu üzerinden aktif kullanıcıları kontrol ediyoruz)
    const { data: userCheck } = await supabase.from("logs").select("user_name").eq("user_name", target).limit(1);
    
    if (!userCheck || userCheck.length === 0) {
      alert("Hata: Bu kullanıcı adına sahip kayıtlı bir kullanıcı bulunamadı veya henüz hiç aktivite gerçekleştirmedi.");
      return;
    }

    const newFriends = [...friends, target];
    setFriends(newFriends);
    localStorage.setItem("emre_board_friends", JSON.stringify(newFriends));
    setSearchFriendName("");
    setShowAddFriendModal(false);
    alert(`${target} arkadaş olarak eklendi!`);
  };

  const handleCardClick = async (file: ArchiveItem) => {
    await supabase.from("logs").insert([{ title: file.title, image_url: file.image_url, user_name: currentUserName, file_id: file.id }]);
    fetchAllData();
    window.open(file.mega_url, "_blank");
  };

  const handleUserPhotoUpload = async (uName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fileName = `profile-${uName}-${Date.now()}`;
      await supabase.storage.from("arsiv-dosyalari").upload(fileName, file);
      const { data: urlData } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fileName);
      const newProfiles = { ...userProfiles, [uName]: urlData.publicUrl };
      setUserProfiles(newProfiles);
      localStorage.setItem("emre_board_profiles", JSON.stringify(newProfiles));
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const getStats = () => {
    const statsMap: { [key: string]: any } = {};
    logs.forEach(log => {
      if (!log.file_id) return;
      const id = log.file_id;
      if (!statsMap[id]) {
        statsMap[id] = {
          id: log.file_id, title: log.title, image_url: log.image_url,
          mega_url: files.find(f => f.id === log.file_id)?.mega_url || "#",
          totalClicks: 0, users: {} as any
        };
      }
      statsMap[id].totalClicks += 1;
      const uName = log.user_name || "Anonim";
      if (!statsMap[id].users[uName]) statsMap[id].users[uName] = { count: 0, lastDate: log.created_at };
      statsMap[id].users[uName].count += 1;
      if (new Date(log.created_at) > new Date(statsMap[id].users[uName].lastDate)) statsMap[id].users[uName].lastDate = log.created_at;
    });
    return Object.values(statsMap).sort((a: any, b: any) => b.totalClicks - a.totalClicks);
  };

  const deleteStatLogs = async (fileId: number | string) => {
    if (!isAdmin) return;
    if (confirm("Bu kartın popülerlik verisini sıfırlamak istiyor musun? (Aktivite geçmişi silinmez)")) {
      const { error } = await supabase.from("logs").update({ file_id: null }).eq("file_id", fileId);
      if (!error) fetchAllData();
    }
  };

const toggleAdminPower = () => {
    if (!isAdmin) {
      const pass = prompt("Admin Şifresi:");
      if (pass === "Emre_2013") setIsAdmin(true);
      else alert("Hatalı!");
    } else setIsAdmin(false);
  };

  // Online/Offline Durumu Kontrol Fonksiyonu
  const getLastSeen = (userName: string): string => {
    const userStatus = onlineUsers[userName];
    if (userStatus?.online) return "Çevrimiçi";
    if (userStatus?.last_seen) {
      const diff = Date.now() - new Date(userStatus.last_seen).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Az önce";
      if (mins < 60) return `${mins} dk önce`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} saat önce`;
      return new Date(userStatus.last_seen).toLocaleDateString('tr-TR');
    }
    return "Bilinmiyor";
  };

  const isUserOnline = (userName: string): boolean => {
    return onlineUsers[userName]?.online || false;
  };

  // Kullanici Arama Fonksiyonu
  const handleUserSearch = () => {
    if (!userSearchQuery.trim()) {
      setSearchedUserData(null);
      return;
    }
    const query = userSearchQuery.toLowerCase();
    const allUsers = getVisibleUsers();
    const matchedUser = allUsers.find(u => u.toLowerCase().includes(query));
    
    if (matchedUser) {
      const userFiles = files.filter(f => logs.some(l => l.file_id === f.id && l.user_name === matchedUser));
      const userLogs = logs.filter(l => l.user_name === matchedUser);
      setSearchedUserData({ user: matchedUser, files: userFiles, logs: userLogs });
    } else {
      setSearchedUserData(null);
      alert("Kullanici bulunamadi!");
    }
  };

  const startEditing = (file: ArchiveItem) => {
    setEditingItem(file); setEditTitle(file.title); setEditMegaUrl(file.mega_url); setEditFile(null); setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setLoading(true);
    try {
      let finalImageUrl = editingItem.image_url;
      if (editFile) {
        const fileName = `card-${Date.now()}-${editFile.name.replace(/\s/g, '-')}`;
        await supabase.storage.from("arsiv-dosyalari").upload(fileName, editFile);
        const { data: urlData } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }
      await supabase.from("arsiv").update({ title: editTitle.toUpperCase(), mega_url: editMegaUrl, image_url: finalImageUrl }).eq("id", editingItem.id);
      setShowEditModal(false); fetchAllData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleCategoryRename = async (id: string, oldName: string) => {
    const n = prompt("Yeni isim:", oldName);
    if (n) { await supabase.from("kategoriler").update({ name: n }).eq("id", id); fetchAllData(); }
  };

  const deleteCategory = async (id: string) => {
    if (confirm("Silinsin mi?")) { await supabase.from("kategoriler").delete().eq("id", id); fetchAllData(); }
  };

  const deleteFile = async (id: number) => {
    if (confirm("Kart silinsin mi?")) { await supabase.from("arsiv").delete().eq("id", id); fetchAllData(); }
  };

const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!username.trim()) { alert("Kullanici adi gerekli!"); setAuthLoading(false); return; }
        const { error } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { 
            data: { 
              display_name: username,
              avatar_url: avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username
            } 
          } 
        });
        if (error) throw error;
        // Avatar'i profile olarak da kaydet
        if (avatarUrl || username) {
          const newProfiles = { ...userProfiles, [username]: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` };
          setUserProfiles(newProfiles);
          localStorage.setItem("emre_board_profiles", JSON.stringify(newProfiles));
        }
        alert("Kayit basarili! Simdi giris yapabilirsin."); 
        setAuthMode('login');
        setUsername("");
        setAvatarUrl("");
      }
    } catch (err: any) { alert(err.message); } finally { setAuthLoading(false); }
  };

  const handleSignOut = async () => { if(confirm("Çıkış?")) { await supabase.auth.signOut(); setSession(null); } };

  const handleAddCategory = async () => {
    const name = prompt("Liste adı:");
    if (name) { await supabase.from("kategoriler").insert([{ id: `cat-${Date.now()}`, name: name.trim() }]); fetchAllData(); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title || !megaUrl || !targetCategoryId) return alert("Eksik!");
    setLoading(true);
    try {
      const fileName = `${Date.now()}-${selectedFile.name.replace(/\s/g, '-')}`;
      await supabase.storage.from("arsiv-dosyalari").upload(fileName, selectedFile);
      const { data: urlData } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fileName);
      const maxIdx = files.length > 0 ? Math.max(...files.map(f => f.order_index)) : 0;
      await supabase.from("arsiv").insert([{ title: title.toUpperCase(), mega_url: megaUrl, image_url: urlData.publicUrl, category: targetCategoryId, order_index: maxIdx + 1 }]);
      setShowAddModal(false); fetchAllData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const moveItem = async (index: number, direction: 'up' | 'down', catId: string) => {
    const catFiles = files.filter(f => f.category === catId);
    const tIdx = direction === 'up' ? index - 1 : index + 1;
    if (tIdx < 0 || tIdx >= catFiles.length) return;
    const cur = catFiles[index]; const tar = catFiles[tIdx];
    await supabase.from("arsiv").update({ order_index: tar.order_index }).eq("id", cur.id);
    await supabase.from("arsiv").update({ order_index: cur.order_index }).eq("id", tar.id);
    fetchAllData();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true); setStartX(e.pageX - scrollContainerRef.current.offsetLeft); setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault(); const x = e.pageX - scrollContainerRef.current.offsetLeft; const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const getVisibleUsers = () => {
    const allUsers = Array.from(new Set(logs.map(l => l.user_name || "Anonim")));
    return isAdmin ? allUsers : allUsers.filter(u => u === currentUserName || u === ADMIN_NAME);
  };

  if (!session) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="w-full max-w-md bg-zinc-900/50 border border-white/10 backdrop-blur-xl p-10 rounded-[3rem] z-10 shadow-4xl text-center">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Emre <span className="text-blue-600">Board</span></h1>
<p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-10">{authMode === 'login' ? 'Giriş' : 'Kayıt'}</p>
            <form onSubmit={handleAuth} className="space-y-4 text-left">
                {authMode === 'signup' && (
                  <>
                    {/* Profil Fotoğrafı Seçimi */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center overflow-hidden mb-3">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={32} className="text-zinc-500" />
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold mb-2">Profil Fotoğrafı URL</p>
                      <input 
                        type="url" 
                        placeholder="https://example.com/avatar.jpg" 
                        value={avatarUrl} 
                        onChange={(e) => setAvatarUrl(e.target.value)} 
                        className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-blue-600 text-center" 
                      />
                      {/* Hazır Avatarlar */}
                      <p className="text-[9px] text-zinc-600 uppercase font-bold mt-3 mb-2">veya birini sec</p>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {[
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
                          'https://api.dicebear.com/7.x/avataaars/svg?seed=Storm'
                        ].map((url, i) => (
                          <button 
                            key={i} 
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${avatarUrl === url ? 'border-blue-500 scale-110' : 'border-transparent hover:border-zinc-500'}`}
                          >
                            <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover bg-zinc-700" />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative"><Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input type="text" placeholder="KULLANICI ADI" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-blue-600" required /></div>
                  </>
                )}
                <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="email" placeholder="E-POSTA" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-blue-600" required /></div>
                <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="password" placeholder="ŞİFRE" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-blue-600" required /></div>
                <button type="submit" disabled={authLoading} className="w-full bg-blue-600 font-black py-5 rounded-2xl uppercase tracking-widest mt-4">{authLoading ? "..." : (authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}</button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="mt-8 text-zinc-500 hover:text-white text-[10px] font-black uppercase">{authMode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}</button>
        </div>
      </div>
    );
  }

// Arka plan stili hesaplama
  const getBackgroundStyle = (): React.CSSProperties => {
    if (backgroundSettings.type === 'solid') {
      return { backgroundColor: backgroundSettings.solidColor };
    }
    if (backgroundSettings.type === 'gradient') {
      return { 
        background: `linear-gradient(${backgroundSettings.gradientDirection}, ${backgroundSettings.gradientStart}, ${backgroundSettings.gradientEnd})` 
      };
    }
    return {}; // image type için style ayrı ele alınacak
  };

  return (
    <div 
      className="h-screen text-white font-sans overflow-hidden flex flex-row relative"
      style={backgroundSettings.type !== 'image' ? getBackgroundStyle() : { backgroundColor: '#050505' }}
    >
      {/* Arka Plan Resmi */}
      {backgroundSettings.type === 'image' && backgroundSettings.imageUrl && (
        <>
          <div 
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${backgroundSettings.imageUrl})`,
              filter: `blur(${backgroundSettings.blur}px)`,
              transform: 'scale(1.1)' // blur kenarları için
            }}
          />
          <div 
            className="fixed inset-0 z-0"
            style={{ backgroundColor: `rgba(0,0,0,${backgroundSettings.opacity / 100})` }}
          />
        </>
      )}
      
{!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="fixed top-6 left-6 z-[300] p-4 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl text-blue-500 shadow-2xl"><Menu/></button>
      )}

      <div className={`fixed md:relative z-[200] h-full bg-zinc-900/95 backdrop-blur-md border-r border-white/5 flex flex-col shrink-0 transition-all duration-500 ${isSidebarOpen ? 'translate-x-0 w-80 p-6' : '-translate-x-full w-0 p-0'}`}>
        <div className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} flex flex-col h-full overflow-hidden`}>
            <div className="flex items-center justify-between mb-8 min-w-[260px]">
              <h1 className="text-2xl font-black italic tracking-tighter uppercase">Emre <span className="text-blue-600">Board</span></h1>
              <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500"><ChevronLeft/></button>
            </div>

<div className="space-y-3 mb-8">
              <button onClick={() => setShowChatPanel(true)} className="w-full flex items-center gap-3 p-3 bg-purple-600/10 text-purple-500 rounded-xl border border-purple-600/20 font-black uppercase italic text-[10px]"><MessageCircle size={18} /> Sohbet</button>
              <button onClick={() => setShowSettingsPanel(true)} className="w-full flex items-center gap-3 p-3 bg-cyan-600/10 text-cyan-500 rounded-xl border border-cyan-600/20 font-black uppercase italic text-[10px]"><Settings size={18} /> Ayarlar</button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <span className="text-[10px] font-black uppercase italic text-zinc-400 flex items-center gap-2"><BarChart3 size={14}/> En Popüler</span>
                {isAdmin && <button onClick={() => setShowStatsDetail(true)} className="text-[8px] font-black bg-blue-600/20 text-blue-500 px-2 py-1 rounded-md">Detaylar</button>}
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar-v">
                {getStats().slice(0, 10).map((stat: any, idx) => (
                  <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-2 group relative">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0"><img src={stat.image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" alt="" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase italic truncate">{stat.title}</p>
                        {isAdmin && <p className="text-[8px] font-bold text-zinc-500">{stat.totalClicks} TIK</p>}
                      </div>
                      {isAdmin && <button onClick={() => deleteStatLogs(stat.id)} className="p-1 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

<div className="mt-6 space-y-3 pt-4 border-t border-white/5">
                <button onClick={handleAddCategory} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 uppercase text-[10px] font-black hover:bg-blue-600/10"><Plus size={18} /> Liste Ekle</button>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                   <div className="flex items-center gap-3">
                      {/* Profil resmi yukleme */}
                      <label className="relative cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black italic text-[10px] overflow-hidden">
                          {userProfiles[currentUserName] ? (
                            <img src={userProfiles[currentUserName]} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                            currentUserName[0]
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <ImageIcon size={14} className="text-white" />
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
                      </label>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase italic truncate">{currentUserName}</p>
                        <p className="text-[8px] text-zinc-500">Profil icin tikla</p>
                      </div>
                   </div>
                   <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-3 p-3 bg-red-600/10 text-red-500 rounded-xl font-black uppercase italic text-[10px]"><LogOut size={16} /> Cikis</button>
                </div>
            </div>
        </div>
      </div>

{/* Kompakt Grid - 7 sutun masaustu, 3 sutun mobil */}
      <div 
        ref={scrollContainerRef} 
        onMouseDown={handleMouseDown} 
        onMouseLeave={() => setIsDragging(false)} 
        onMouseUp={() => setIsDragging(false)} 
        onMouseMove={handleMouseMove} 
        className={`flex-1 overflow-x-auto custom-scrollbar flex items-start p-3 md:p-6 gap-2 md:gap-3 h-full transition-all duration-500 relative z-10 ${!isSidebarOpen ? 'md:pl-20' : ''} ${isDragging ? 'cursor-grabbing select-none' : 'cursor-default'}`}
      >
        {categories.map((cat, catIndex) => (
          <div 
            key={cat.id} 
            className="w-[calc(33.33vw-16px)] md:w-[calc(14.28vw-24px)] min-w-[140px] max-w-[200px] shrink-0 bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col max-h-[calc(100vh-100px)] relative shadow-xl"
          >
            {/* Liste Basligi */}
            <div className="p-2 md:p-3 flex items-center justify-between border-b border-white/5 gap-1">
              <h2 className="font-black text-[8px] md:text-[10px] uppercase tracking-wide text-blue-500 italic truncate flex-1">{cat.name}</h2>
              <div className="flex items-center gap-0.5">
                {/* Sol/Sag Tasima Butonlari */}
                <button onClick={() => moveCategoryOrder(catIndex, 'left')} disabled={catIndex === 0} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"><ChevronLeft size={12}/></button>
                <button onClick={() => moveCategoryOrder(catIndex, 'right')} disabled={catIndex === categories.length - 1} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"><ChevronRight size={12}/></button>
                {isAdmin && (
                  <>
                    <button onClick={() => handleCategoryRename(cat.id, cat.name)} className="p-1 text-blue-500/50 hover:text-blue-500"><Edit3 size={12}/></button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-1 text-red-500/50 hover:text-red-500"><Trash2 size={12}/></button>
                  </>
                )}
              </div>
            </div>
            
            {/* Kartlar - 4 kart gorunecek sekilde optimize */}
            <div className="flex-1 overflow-y-auto p-1.5 md:p-2 space-y-1.5 md:space-y-2 custom-scrollbar-v flex flex-col">
              {files.filter(f => f.category === cat.id).map((file, idx) => (
                <div key={file.id} className="bg-[#0f0f11]/90 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden relative group hover:border-blue-600/40 transition-all">
                  {/* Kart Kontrol Butonlari */}
                  <div className="absolute top-1 right-1 flex gap-0.5 z-20 opacity-0 group-hover:opacity-100 transition-all">
                    {isAdmin && <button onClick={() => startEditing(file)} className="bg-blue-600 p-1 rounded-md text-white"><Edit3 size={10} /></button>}
                    <button onClick={(e) => setCardTransferMenu({ fileId: file.id, x: e.clientX, y: e.clientY })} className="bg-zinc-700 p-1 rounded-md text-white hover:bg-zinc-600"><MoreVertical size={10} /></button>
                  </div>
                  
                  {/* Yukari/Asagi Tasima */}
                  <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-20 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => moveItem(idx, 'up', cat.id)} className="bg-black/80 p-0.5 rounded hover:bg-blue-600"><ChevronUp size={10}/></button>
                    <button onClick={() => moveItem(idx, 'down', cat.id)} className="bg-black/80 p-0.5 rounded hover:bg-blue-600"><ChevronDown size={10}/></button>
                  </div>
                  
                  <button onClick={() => handleCardClick(file)} className="w-full aspect-[4/3] bg-black/40 relative block overflow-hidden">
                    <img src={file.image_url} className="w-full h-full object-contain p-1 hover:scale-105 transition-transform duration-500" alt="" />
                  </button>
                  <div className="p-1.5 md:p-2 flex justify-between items-center font-black text-[7px] md:text-[9px] uppercase italic text-zinc-200">
                    <span className="truncate pr-1">{file.title}</span>
                    {isAdmin && <button onClick={() => deleteFile(file.id)} className="text-red-500 hover:scale-110 shrink-0"><Trash2 size={10}/></button>}
                  </div>
                </div>
              ))}
              <button onClick={() => { setTargetCategoryId(cat.id); setShowAddModal(true); }} className="w-full p-2 bg-white/[0.02] border border-dashed border-white/5 rounded-lg text-[8px] font-black text-zinc-600 hover:text-blue-500 transition-all uppercase">+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Kart Transfer Menusu */}
      {cardTransferMenu && (
        <div 
          className="fixed z-[1200] bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-2 min-w-[120px]"
          style={{ left: cardTransferMenu.x, top: cardTransferMenu.y }}
        >
          <p className="text-[8px] font-black text-zinc-500 uppercase mb-2 px-2">Liste Degistir</p>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => transferCardToCategory(cardTransferMenu.fileId, cat.id)}
              className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-zinc-300 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg transition-all"
            >
              {cat.name}
            </button>
          ))}
          <button 
            onClick={() => setCardTransferMenu(null)}
            className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-600/20 rounded-lg transition-all mt-1 border-t border-white/5"
          >
            Iptal
          </button>
        </div>
      )}

{showActivityPanel && (
        <div className="fixed inset-0 z-[600] bg-[#050505] flex flex-col overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col gap-4 bg-zinc-900/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                 {(selectedUser || searchedUserData) && <button onClick={() => { setSelectedUser(null); setSearchedUserData(null); setUserSearchQuery(""); }} className="p-2 bg-white/5 rounded-lg text-zinc-400"><ChevronLeft size={20}/></button>}
                 <h2 className="text-3xl font-black uppercase italic">{searchedUserData ? `${searchedUserData.user} - Profil` : selectedUser ? `${selectedUser} - Aktiviteler` : 'Kullanıcı Listesi'}</h2>
              </div>
              <button onClick={() => { setShowActivityPanel(false); setSelectedUser(null); setSearchedUserData(null); setUserSearchQuery(""); }} className="p-3 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600 transition-all"><X size={24}/></button>
            </div>
            {/* Kullanici Arama */}
            {!selectedUser && !searchedUserData && (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                  <input 
                    type="text" 
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                    placeholder="Kullanici ara..." 
                    className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-green-600"
                  />
                </div>
                <button onClick={handleUserSearch} className="px-6 bg-green-600 rounded-2xl font-black text-[10px] uppercase hover:bg-green-500 transition-all">Ara</button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar-v">
            {/* Aranan Kullanici Sonucu */}
            {searchedUserData && (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Profil Karti */}
                <div className="bg-zinc-900/60 border border-white/10 rounded-[2rem] p-8 flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-zinc-800 rounded-2xl flex items-center justify-center font-black italic text-4xl overflow-hidden">
                      {userProfiles[searchedUserData.user] ? <img src={userProfiles[searchedUserData.user]} className="w-full h-full object-cover" alt=""/> : searchedUserData.user[0].toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-zinc-900 ${isUserOnline(searchedUserData.user) ? 'bg-green-500' : 'bg-zinc-500'}`}/>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic">{searchedUserData.user}</h3>
                    <p className={`text-sm font-bold ${isUserOnline(searchedUserData.user) ? 'text-green-400' : 'text-zinc-500'}`}>{getLastSeen(searchedUserData.user)}</p>
                    <p className="text-xs text-zinc-600 mt-2">{searchedUserData.logs.length} aktivite | {searchedUserData.files.length} dosya tiklamis</p>
                  </div>
                </div>
                
                {/* Son Aktiviteler */}
                <div>
                  <h4 className="text-sm font-black uppercase italic text-zinc-400 mb-4">Son Aktiviteler</h4>
                  <div className="space-y-3">
                    {searchedUserData.logs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-zinc-900/80 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 p-1"><img src={log.image_url} className="w-full h-full object-contain" alt="" /></div>
                          <div>
                            <p className="font-black italic uppercase text-sm">{log.title}</p>
                            <p className="text-[9px] text-zinc-500 font-bold">{new Date(log.created_at).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
)}
            {!selectedUser && !searchedUserData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {getVisibleUsers().map(uName => (
                  <div key={uName} className="relative group overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900 aspect-[4/3] flex flex-col items-center justify-center transition-all hover:border-blue-600/50 shadow-2xl">
                    {userProfiles[uName] && <img src={userProfiles[uName]} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50" alt="" />}
                    <label className="absolute top-4 right-4 p-2 bg-black/60 rounded-xl text-blue-500 opacity-0 group-hover:opacity-100 cursor-pointer z-20"><ImageIcon size={16} /><input type="file" accept="image/*" className="hidden" onChange={(e) => handleUserPhotoUpload(uName, e)} /></label>
                    {/* Admin: Kullanici Silme */}
                    {isAdmin && uName !== ADMIN_NAME && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(uName); }} 
                        className="absolute bottom-4 right-4 p-2 bg-red-600/80 rounded-xl text-white opacity-0 group-hover:opacity-100 z-20 hover:bg-red-600"
                        title="Kullaniciyi Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    {/* Online Status */}
                    <div className={`absolute top-4 left-4 px-2 py-1 rounded-full text-[8px] font-black uppercase ${isUserOnline(uName) ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                      {isUserOnline(uName) ? 'Cevrimici' : 'Cevrimdisi'}
                    </div>
                    <User className="mb-4 text-blue-500 relative z-10" size={48} />
                    <button onClick={() => setSelectedUser(uName)} className="relative z-10 font-black uppercase italic text-lg tracking-wider hover:text-blue-400">{uName}</button>
                  </div>
                ))}
              </div>
            )}
            {selectedUser && !searchedUserData && (
              <div className="max-w-4xl mx-auto space-y-4">
                {logs.filter(l => l.user_name === selectedUser).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-5 bg-zinc-900/80 border border-white/10 rounded-[1.5rem] group hover:bg-blue-600/5 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/40 p-1"><img src={log.image_url} className="w-full h-full object-contain" alt="" /></div>
                      <div>
                        <p className="font-black italic uppercase text-lg text-white group-hover:text-blue-400">{log.title}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(log.created_at).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

{showChatPanel && (
        <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden flex flex-row shadow-4xl relative">
            {/* Sol: Minimalist Sohbet Listesi */}
            {showFriendsPanel && (
            <div className="w-20 border-r border-white/5 flex flex-col bg-zinc-900/30">
              <div className="p-3 border-b border-white/5 flex flex-col items-center gap-2">
                <button onClick={() => setShowAddFriendModal(true)} className="p-2 bg-blue-600/20 text-blue-500 rounded-xl hover:bg-blue-600 transition-all"><UserPlus size={16}/></button>
                <button onClick={() => setShowFriendsPanel(false)} className="p-2 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600 transition-all"><X size={14}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 flex flex-col items-center">
                {/* Admin Sabit - Minimalist */}
                <button 
                  onClick={() => setActiveChatFriend(ADMIN_NAME)} 
                  className={`relative w-12 h-12 rounded-full transition-all ${activeChatFriend === ADMIN_NAME ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900' : 'hover:scale-110'}`}
                  title="Emre (Admin)"
                >
                  <div className="w-full h-full bg-blue-900 rounded-full flex items-center justify-center font-black overflow-hidden">
                    {userProfiles[ADMIN_NAME] ? <img src={userProfiles[ADMIN_NAME]} alt="" className="w-full h-full object-cover" /> : 'E'}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${isUserOnline(ADMIN_NAME) ? 'bg-green-500' : 'bg-zinc-500'}`}/>
                </button>
                
                {/* Ekli Arkadaslar - Minimalist */}
                {friends.map((fName, i) => (
                  <div key={i} className="relative group">
                    <button 
                      onClick={() => setActiveChatFriend(fName)} 
                      className={`relative w-12 h-12 rounded-full transition-all ${activeChatFriend === fName ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-900' : 'hover:scale-110'}`}
                      title={fName}
                    >
                      <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center font-black italic overflow-hidden text-xs">
                        {userProfiles[fName] ? <img src={userProfiles[fName]} alt="" className="w-full h-full object-cover" /> : fName[0].toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${isUserOnline(fName) ? 'bg-green-500' : 'bg-zinc-500'}`}/>
                    </button>
                    {/* Silme Butonu */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemoveFriend(fName); }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={10} className="text-white"/>
                    </button>
                  </div>
                ))}
                
                {/* Aktif Sohbetler (Otomatik baslayanlar) */}
                {activeConversations.filter(c => !friends.includes(c) && c !== ADMIN_NAME).map((convName, i) => (
                  <div key={`conv-${i}`} className="relative group">
                    <button 
                      onClick={() => setActiveChatFriend(convName)} 
                      className={`relative w-12 h-12 rounded-full transition-all border-2 border-dashed border-zinc-600 ${activeChatFriend === convName ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-900' : 'hover:scale-110'}`}
                      title={`${convName} (Yeni Sohbet)`}
                    >
                      <div className="w-full h-full bg-zinc-800/50 rounded-full flex items-center justify-center font-black italic overflow-hidden text-xs text-zinc-400">
                        {userProfiles[convName] ? <img src={userProfiles[convName]} alt="" className="w-full h-full object-cover" /> : convName[0].toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${isUserOnline(convName) ? 'bg-green-500' : 'bg-zinc-500'}`}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Sag: Mesajlasma */}
            <div className="flex-1 flex flex-col relative">
               {/* Chat Background */}
               {chatBackgroundSettings.imageUrl && (
                 <>
                   <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${chatBackgroundSettings.imageUrl})`, filter: `blur(${chatBackgroundSettings.blur}px)`, transform: 'scale(1.1)' }} />
                   <div className="absolute inset-0 z-0" style={{ backgroundColor: `rgba(0,0,0,${chatBackgroundSettings.opacity / 100})` }} />
                 </>
               )}
               
               {activeChatFriend ? (
                   <>
                       <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10 bg-black/50 backdrop-blur-md">
                          <div className="flex items-center gap-4">
                            {!showFriendsPanel && (
                              <button onClick={() => setShowFriendsPanel(true)} className="p-2 bg-white/10 rounded-lg mr-2"><Menu size={18}/></button>
                            )}
                            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center font-black overflow-hidden">
                              {userProfiles[activeChatFriend] ? <img src={userProfiles[activeChatFriend]} alt="" className="w-full h-full object-cover" /> : activeChatFriend[0].toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-black uppercase italic">{activeChatFriend}</h4>
                              <button onClick={() => { setSelectedUser(activeChatFriend); setShowActivityPanel(true); }} className="text-[9px] font-black text-blue-500 hover:underline">AKTIVITEYI GOR</button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Chat Background Upload */}
                            <label className="p-2 bg-purple-600/20 text-purple-500 rounded-xl hover:bg-purple-600 transition-all cursor-pointer" title="Arka plan yukle">
                              <Upload size={18}/>
                              <input type="file" accept="image/*" className="hidden" onChange={handleChatBgUpload} />
                            </label>
                            <button data-chat-settings onClick={() => {
                              const url = prompt("Sohbet arka plan URL (veya dosya yukle):", chatBackgroundSettings.imageUrl);
                              if (url !== null) {
                                const newSettings = { ...chatBackgroundSettings, imageUrl: url };
                                setChatBackgroundSettings(newSettings);
                                localStorage.setItem("emre_board_chat_bg_settings", JSON.stringify(newSettings));
                              }
                            }} className="p-2 bg-purple-600/20 text-purple-500 rounded-xl hover:bg-purple-600 transition-all"><Palette size={18}/></button>
                            {/* Admin: Clear Chat */}
                            {isAdmin && (
                              <button onClick={handleClearChat} className="p-2 bg-orange-600/20 text-orange-500 rounded-xl hover:bg-orange-600 transition-all" title="Sohbeti Temizle"><Trash2 size={18}/></button>
                            )}
                            <button onClick={() => setShowChatPanel(false)} className="p-2 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600 transition-all"><X size={18}/></button>
                          </div>
                       </div>
                       
                       <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar-v relative z-10">
                          {messages.filter(m => !m.is_deleted).map((msg, i) => {
                            const isMe = msg.sender_name === currentUserName;
                            const senderAvatar = userProfiles[msg.sender_name];
                            return (
                              <div key={i} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {/* Avatar (sol taraf - karsi taraf icin) */}
                                {!isMe && (
                                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-black text-xs overflow-hidden shrink-0">
                                    {senderAvatar ? <img src={senderAvatar} alt="" className="w-full h-full object-cover" /> : msg.sender_name[0].toUpperCase()}
                                  </div>
                                )}
                                <div className={`max-w-[70%] p-4 rounded-2xl relative group ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-800/90 backdrop-blur-sm text-zinc-200 rounded-tl-none'}`}>
                                  {/* Mesaj icerigi */}
                                  {msg.image_url && (
                                    <img src={msg.image_url} alt="Gonderilen resim" className="max-w-full rounded-xl mb-2 cursor-pointer" onClick={() => window.open(msg.image_url, '_blank')} />
                                  )}
                                  {msg.file_url && (
                                    <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg mb-2 text-xs hover:bg-black/40">
                                      <Link2 size={14} /> {msg.file_name || 'Dosya'}
                                    </a>
                                  )}
                                  {msg.text && <p className="text-sm font-medium">{msg.text}</p>}
                                  <p className="text-[8px] text-white/30 text-right mt-1">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ""}</p>
                                  
                                  {/* Silme butonu */}
                                  {(isMe || isAdmin) && msg.id && (
                                    <button 
                                      onClick={() => handleDeleteMessage(msg.id!, msg.sender_name)} 
                                      className="absolute -top-2 -right-2 p-1.5 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                                {/* Avatar (sag taraf - kendim icin) */}
                                {isMe && (
                                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center font-black text-xs overflow-hidden shrink-0">
                                    {userProfiles[currentUserName] ? <img src={userProfiles[currentUserName]} alt="" className="w-full h-full object-cover" /> : currentUserName[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                       </div>

                       {/* Image/File Preview */}
                       {chatImagePreview && (
                         <div className="p-4 border-t border-white/5 bg-zinc-900/50 relative z-10">
                           <div className="flex items-center gap-4">
                             <img src={chatImagePreview} alt="Onizleme" className="h-16 rounded-lg" />
                             <button onClick={() => { setChatFile(null); setChatImagePreview(null); }} className="p-2 bg-red-600/20 text-red-500 rounded-lg"><X size={16}/></button>
                           </div>
                         </div>
                       )}

                       <form onSubmit={handleSendMessage} className="p-6 border-t border-white/5 flex gap-4 bg-zinc-900/80 backdrop-blur-md relative z-10">
                          {/* Dosya yukleme butonu */}
                          <label className="p-4 bg-white/10 rounded-2xl cursor-pointer hover:bg-white/20 transition-all">
                            <ImageIcon size={18} />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*,application/pdf,.doc,.docx,.txt"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setChatFile(file);
                                  if (file.type.startsWith('image/')) {
                                    setChatImagePreview(URL.createObjectURL(file));
                                  }
                                }
                              }}
                            />
                          </label>
                          <input 
                            ref={chatInputRef}
                            type="text" 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            placeholder={`${activeChatFriend} kisisine mesaj yaz... (CTRL+V ile resim yapistir)`} 
                            className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-blue-600" 
                          />
                          <button type="submit" className="p-4 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all"><Send size={18}/></button>
                       </form>
                   </>
               ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 uppercase italic font-black relative z-10">
                       {!showFriendsPanel && (
                         <button onClick={() => setShowFriendsPanel(true)} className="p-4 bg-white/10 rounded-2xl mb-4"><Menu size={24}/></button>
                       )}
                       <MessageCircle size={64} className="mb-4 opacity-20"/>
                       <p>Mesajlasmak icin bir arkadas sec</p>
                   </div>
               )}
            </div>

            {/* Arkadas Ekleme Modali */}
            {showAddFriendModal && (
              <div className="absolute inset-0 z-[800] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="w-full max-w-sm bg-zinc-900 border border-white/10 p-8 rounded-[2rem] shadow-4xl text-center">
                  <h3 className="text-xl font-black uppercase italic text-blue-500 mb-6 flex items-center justify-center gap-3"><Search/> Arkadas Ara</h3>
                  <p className="text-[9px] text-zinc-500 mb-4 font-bold">SADECE KAYITLI VE AKTIF KULLANICILAR EKLENEBILIR</p>
                  <input type="text" value={searchFriendName} onChange={(e) => setSearchFriendName(e.target.value)} placeholder="Tam kullanici adi..." className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-xs font-bold outline-none focus:border-blue-600 mb-6" />
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setShowAddFriendModal(false)} className="flex-1 p-3 bg-white/5 rounded-xl text-[10px] font-black uppercase">Iptal</button>
                    <button type="button" onClick={handleAddFriend} className="flex-1 p-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase">Ekle</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- STATS DETAIL MODAL --- */}
      {showStatsDetail && isAdmin && (
        <div className="fixed inset-0 z-[900] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[85vh] shadow-3xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-500">Analiz & Tıklama Geçmişi</h2>
              <button onClick={() => setShowStatsDetail(false)} className="p-3 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 transition-all"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-v">
               {getStats().map((stat: any, idx) => (
                 <div key={idx} className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/40 p-2"><img src={stat.image_url} className="w-full h-full object-contain" alt="" /></div>
                        <div>
                          <h3 className="font-black italic uppercase text-lg leading-tight">{stat.title}</h3>
                          <p className="text-blue-500 font-bold text-xs uppercase">{stat.totalClicks} TOPLAM TIKLANMA</p>
                        </div>
                      </div>
                      <a href={stat.mega_url} target="_blank" rel="noreferrer" className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-2 font-black text-[10px] uppercase"><ExternalLink size={16}/> Git</a>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(stat.users).map(([uName, data]: any) => (
                        <div key={uName} className="p-3 bg-black/40 border border-white/5 rounded-xl">
                          <p className="text-[10px] font-black uppercase text-white italic">{uName}</p>
                          <div className="flex justify-between mt-1">
                            <span className="text-[8px] font-bold text-zinc-500">{data.count} TIKLAMA</span>
                            <span className="text-[8px] font-bold text-blue-500">{new Date(data.lastDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* --- ADD & EDIT MODALS --- */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-zinc-900 border border-blue-600/30 p-8 rounded-[3rem] shadow-4xl">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-blue-500 flex items-center gap-3"><Edit3/> Düzenle</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none text-xs focus:border-blue-600" />
              <input type="text" value={editMegaUrl} onChange={(e) => setEditMegaUrl(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none text-xs focus:border-blue-600" />
              <div><img src={editingItem.image_url} className="w-20 h-20 object-contain rounded-xl border border-white/10 mb-3" alt="" />
              <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] || null)} className="w-full text-xs text-zinc-400" /></div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 p-4 bg-white/5 rounded-2xl font-black text-xs uppercase">İPTAL</button>
                <button type="submit" disabled={loading} className="flex-1 p-4 bg-blue-600 rounded-2xl font-black text-xs uppercase">{loading ? "..." : "GÜNCELLE"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 p-8 rounded-[3rem]">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-blue-500">Yeni Kart Ekle</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <input type="text" placeholder="BAŞLIK" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none text-xs focus:border-blue-600" />
              <input type="text" placeholder="MEGA URL" value={megaUrl} onChange={(e) => setMegaUrl(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none text-xs focus:border-blue-600" />
              <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-xs text-zinc-400" required />
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 p-4 bg-white/5 rounded-2xl font-black text-xs uppercase">İPTAL</button>
                <button type="submit" disabled={loading} className="flex-1 p-4 bg-blue-600 rounded-2xl font-black text-xs uppercase">KAYDET</button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* --- SETTINGS PANEL --- */}
      {showSettingsPanel && (
        <div className="fixed inset-0 z-[750] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-4xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-cyan-600/10 to-transparent">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-cyan-500 flex items-center gap-3"><Settings size={28}/> Ayarlar</h2>
              <button onClick={() => setShowSettingsPanel(false)} className="p-3 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 transition-all"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar-v">
              {/* Hizli Erisim Butonlari */}
              <div>
                <h3 className="text-sm font-black uppercase italic text-zinc-300 mb-4 flex items-center gap-2"><Activity size={16}/> Hizli Erisim</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => { fetchAllData(); setShowActivityPanel(true); setShowSettingsPanel(false); }} 
                    className="p-4 bg-green-600/10 text-green-500 rounded-2xl border border-green-600/20 font-black uppercase italic text-[10px] hover:bg-green-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Activity size={18}/> Aktiviteler
                  </button>
                  <button 
                    onClick={toggleAdminPower} 
                    className={`p-4 rounded-2xl border font-black uppercase italic text-[10px] transition-all flex items-center justify-center gap-2 ${isAdmin ? 'bg-orange-600/20 text-orange-500 border-orange-600/40' : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10'}`}
                  >
                    <ShieldAlert size={18}/> Admin: {isAdmin ? 'ACIK' : 'KAPALI'}
                  </button>
                </div>
              </div>
              
              {/* Arka Plan Türü Seçimi */}
              <div>
                <h3 className="text-sm font-black uppercase italic text-zinc-300 mb-4 flex items-center gap-2"><Palette size={16}/> Arka Plan Turu</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => {
                      const newSettings = { ...backgroundSettings, type: 'solid' as const };
                      setBackgroundSettings(newSettings);
                      localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                    }}
                    className={`p-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${backgroundSettings.type === 'solid' ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                  >
                    Düz Renk
                  </button>
                  <button 
                    onClick={() => {
                      const newSettings = { ...backgroundSettings, type: 'gradient' as const };
                      setBackgroundSettings(newSettings);
                      localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                    }}
                    className={`p-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${backgroundSettings.type === 'gradient' ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                  >
                    Gradient
                  </button>
                  <button 
                    onClick={() => {
                      const newSettings = { ...backgroundSettings, type: 'image' as const };
                      setBackgroundSettings(newSettings);
                      localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                    }}
                    className={`p-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${backgroundSettings.type === 'image' ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                  >
                    Resim
                  </button>
                </div>
              </div>

              {/* Düz Renk Ayarları */}
              {backgroundSettings.type === 'solid' && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase italic text-zinc-400 flex items-center gap-2"><Paintbrush size={14}/> Düz Renk</h4>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={backgroundSettings.solidColor}
                      onChange={(e) => {
                        const newSettings = { ...backgroundSettings, solidColor: e.target.value };
                        setBackgroundSettings(newSettings);
                        localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                      }}
                      className="w-16 h-16 rounded-2xl border-2 border-white/10 cursor-pointer bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={backgroundSettings.solidColor}
                      onChange={(e) => {
                        const newSettings = { ...backgroundSettings, solidColor: e.target.value };
                        setBackgroundSettings(newSettings);
                        localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                      }}
                      placeholder="#050505"
                      className="flex-1 bg-black/40 border border-white/10 p-4 rounded-xl text-xs font-bold outline-none focus:border-cyan-600 uppercase"
                    />
                  </div>
                  {/* Hızlı Renkler */}
                  <div className="flex gap-2 flex-wrap">
                    {['#050505', '#0a0a0f', '#0f172a', '#1a1a2e', '#16213e', '#1f1f1f', '#2d132c', '#0f0f23'].map(color => (
                      <button 
                        key={color}
                        onClick={() => {
                          const newSettings = { ...backgroundSettings, solidColor: color };
                          setBackgroundSettings(newSettings);
                          localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                        }}
                        className="w-10 h-10 rounded-xl border-2 border-white/10 hover:border-cyan-500 transition-all"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Gradient Ayarları */}
              {backgroundSettings.type === 'gradient' && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase italic text-zinc-400 flex items-center gap-2"><Paintbrush size={14}/> Gradient Renkleri</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block">Başlangıç Rengi</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={backgroundSettings.gradientStart}
                          onChange={(e) => {
                            const newSettings = { ...backgroundSettings, gradientStart: e.target.value };
                            setBackgroundSettings(newSettings);
                            localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                          }}
                          className="w-12 h-12 rounded-xl border-2 border-white/10 cursor-pointer bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={backgroundSettings.gradientStart}
                          onChange={(e) => {
                            const newSettings = { ...backgroundSettings, gradientStart: e.target.value };
                            setBackgroundSettings(newSettings);
                            localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                          }}
                          className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-cyan-600 uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block">Bitiş Rengi</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={backgroundSettings.gradientEnd}
                          onChange={(e) => {
                            const newSettings = { ...backgroundSettings, gradientEnd: e.target.value };
                            setBackgroundSettings(newSettings);
                            localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                          }}
                          className="w-12 h-12 rounded-xl border-2 border-white/10 cursor-pointer bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={backgroundSettings.gradientEnd}
                          onChange={(e) => {
                            const newSettings = { ...backgroundSettings, gradientEnd: e.target.value };
                            setBackgroundSettings(newSettings);
                            localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                          }}
                          className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-cyan-600 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block">Yön</label>
                    <select 
                      value={backgroundSettings.gradientDirection}
                      onChange={(e) => {
                        const newSettings = { ...backgroundSettings, gradientDirection: e.target.value };
                        setBackgroundSettings(newSettings);
                        localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                      }}
                      className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-cyan-600 text-white"
                    >
                      <option value="to bottom">Yukarıdan Aşağı</option>
                      <option value="to top">Aşağıdan Yukarı</option>
                      <option value="to right">Soldan Sağa</option>
                      <option value="to left">Sağdan Sola</option>
                      <option value="to bottom right">Köşegen (Sağ Alt)</option>
                      <option value="to bottom left">Köşegen (Sol Alt)</option>
                      <option value="to top right">Köşegen (Sağ Üst)</option>
                      <option value="to top left">Köşegen (Sol Üst)</option>
                    </select>
                  </div>

                  {/* Önizleme */}
                  <div 
                    className="h-20 rounded-xl border border-white/10"
                    style={{ background: `linear-gradient(${backgroundSettings.gradientDirection}, ${backgroundSettings.gradientStart}, ${backgroundSettings.gradientEnd})` }}
                  />
                </div>
              )}

              {/* Resim URL Ayarları */}
              {backgroundSettings.type === 'image' && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase italic text-zinc-400 flex items-center gap-2"><Link2 size={14}/> Resim URL</h4>
                  <input 
                    type="text" 
                    value={backgroundSettings.imageUrl}
                    onChange={(e) => {
                      const newSettings = { ...backgroundSettings, imageUrl: e.target.value };
                      setBackgroundSettings(newSettings);
                      localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-xs font-bold outline-none focus:border-cyan-600"
                  />
                  
                  {/* Blur Ayarı */}
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Eye size={12}/> Bulanıklık (Blur)</span>
                      <span className="text-cyan-500">{backgroundSettings.blur}px</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="30" 
                      value={backgroundSettings.blur}
                      onChange={(e) => {
                        const newSettings = { ...backgroundSettings, blur: parseInt(e.target.value) };
                        setBackgroundSettings(newSettings);
                        localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                      }}
                      className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Opaklık Ayarı */}
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 flex items-center justify-between">
                      <span>Koyuluk (Overlay)</span>
                      <span className="text-cyan-500">{backgroundSettings.opacity}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={backgroundSettings.opacity}
                      onChange={(e) => {
                        const newSettings = { ...backgroundSettings, opacity: parseInt(e.target.value) };
                        setBackgroundSettings(newSettings);
                        localStorage.setItem("emre_board_bg_settings", JSON.stringify(newSettings));
                      }}
                      className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Resim Önizleme */}
                  {backgroundSettings.imageUrl && (
                    <div className="relative h-32 rounded-xl border border-white/10 overflow-hidden">
                      <img 
                        src={backgroundSettings.imageUrl} 
                        alt="Arka plan önizleme" 
                        className="w-full h-full object-cover"
                        style={{ filter: `blur(${backgroundSettings.blur}px)` }}
                      />
                      <div 
                        className="absolute inset-0"
                        style={{ backgroundColor: `rgba(0,0,0,${backgroundSettings.opacity / 100})` }}
                      />
                      <p className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase text-white/80">Önizleme</p>
                    </div>
                  )}
                </div>
              )}

              {/* Varsayılana Sıfırla */}
              <button 
                onClick={() => {
                  const defaultSettings: BackgroundSettings = {
                    type: 'solid',
                    solidColor: '#050505',
                    gradientStart: '#050505',
                    gradientEnd: '#1a1a2e',
                    gradientDirection: 'to bottom right',
                    imageUrl: '',
                    blur: 0,
                    opacity: 50
                  };
                  setBackgroundSettings(defaultSettings);
                  localStorage.setItem("emre_board_bg_settings", JSON.stringify(defaultSettings));
                }}
                className="w-full p-4 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-[10px] border border-red-600/20 hover:bg-red-600/20 transition-all"
              >
                Varsayılana Sıfırla
              </button>

              {/* Admin: Sistem Loglari */}
              {isAdmin && (
                <div className="border-t border-white/5 pt-6">
                  <h3 className="text-sm font-black uppercase italic text-orange-400 mb-4 flex items-center gap-2"><ShieldAlert size={16}/> Admin Paneli</h3>
                  <button 
                    onClick={() => { setShowSettingsPanel(false); setShowSystemLogs(true); }}
                    className="w-full p-4 bg-orange-600/10 text-orange-500 rounded-2xl font-black uppercase text-[10px] border border-orange-600/20 hover:bg-orange-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Activity size={16}/> Sistem Loglarini Gor
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SISTEM LOGLARI PANELI (ADMIN) --- */}
      {showSystemLogs && isAdmin && (
        <div className="fixed inset-0 z-[950] bg-black/98 backdrop-blur-2xl flex flex-col overflow-hidden">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-orange-600/10 to-transparent">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-orange-500 flex items-center gap-3"><ShieldAlert size={28}/> Sistem Loglari</h2>
            <button onClick={() => setShowSystemLogs(false)} className="p-3 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 transition-all"><X size={24}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-v">
            <div className="max-w-6xl mx-auto">
              {/* Ozet Istatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-black text-blue-500">{logs.length}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Toplam Log</p>
                </div>
                <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-black text-green-500">{getVisibleUsers().length}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Kullanici</p>
                </div>
                <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-black text-purple-500">{files.length}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Dosya</p>
                </div>
                <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-4xl font-black text-orange-500">{categories.length}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Kategori</p>
                </div>
              </div>
              
              {/* Tum Loglar Tablosu */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <h3 className="font-black uppercase italic text-sm text-white">Tum Tiklama Gecmisi</h3>
                  <p className="text-[9px] text-zinc-500 mt-1">Hangi kullanici, hangi dosyaya, ne zaman tikladi</p>
                </div>
                <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto custom-scrollbar-v">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-all">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 shrink-0 p-1">
                        <img src={log.image_url} className="w-full h-full object-contain" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black italic uppercase text-sm truncate">{log.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-bold text-blue-400 bg-blue-600/20 px-2 py-0.5 rounded-full">{log.user_name || 'Anonim'}</span>
                          <span className="text-[9px] font-bold text-zinc-500">{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                          {log.file_id && <span className="text-[9px] font-bold text-zinc-600">ID: {log.file_id}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {randomCard && (
        <div className="fixed inset-0 z-[800] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setRandomCard(null)}>
          <div className="w-full max-w-xl bg-zinc-900 border border-blue-600/30 p-4 rounded-[3rem]" onClick={e => e.stopPropagation()}>
            <div className="aspect-video mb-6 rounded-[2rem] overflow-hidden bg-black/40 p-4"><img src={randomCard.image_url} className="w-full h-full object-contain" alt="" /></div>
            <div className="text-center pb-6">
              <h2 className="text-3xl font-black italic uppercase mb-8">{randomCard.title}</h2>
              <div className="flex gap-4 px-6">
                <button onClick={() => setRandomCard(null)} className="flex-1 p-4 bg-white/5 rounded-2xl font-black text-xs uppercase">KAPAT</button>
                <button onClick={() => handleCardClick(randomCard)} className="flex-1 p-4 bg-blue-600 rounded-2xl font-black text-xs uppercase">GİT</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
