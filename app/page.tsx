"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Plus, Trash2, X, Activity, Menu, ChevronLeft, ChevronUp, ChevronDown,
  LogOut, Lock, Mail, Tag, BarChart3, ShieldAlert, Edit3, ExternalLink, User,
  ImageIcon, MessageCircle, UserPlus, Send, Search, Clock, Settings,
  Palette, Paintbrush, Eye, ChevronRight, ArrowLeftRight,
  Upload, Camera, RefreshCw, Dices
} from "lucide-react";

const supabaseUrl = "https://wobnwchodzgsofpybztg.supabase.co";
const supabaseKey = "sb_publishable_JgD3W7_LA5OLvE_j2GzgSw_4vBaKN7N";
const supabase = createClient(supabaseUrl, supabaseKey);


// ── TYPES ─────────────────────────────────────────────────────────────────────
interface Category { 
  id: string; 
  title: string; 
  order_index: number; // order -> order_index oldu
}

interface ArchiveItem { 
  id: number; 
  title: string; 
  mega_url: string; 
  image_url: string; 
  category: string; 
  order_index: number; // order -> order_index oldu
}

interface LogEntry { 
  id: number; 
  created_at: string; 
  title: string; 
  image_url: string; 
  user_name?: string; 
  file_id?: number | null; 
}

interface Message { 
  id?: number; 
  created_at?: string; 
  sender_name: string; 
  receiver_name: string; 
  text: string; 
}
export default function EmreBoard() {
  // --- EKSİK OLAN SESSION STATE BURADA ---
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login'); // Bunu tam buraya ekle
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Eğer hata verirse diye şunları da sağlama alalım:
  const [error, setError] = useState<string | null>(null);
  // ── Ana veri ──────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [files, setFiles] = useState<ArchiveItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: string }>({});
  const [friends, setFriends] = useState<string[]>([]);

  // ── Sohbet ────────────────────────────────────────────────────────────────
  const [activeChatFriend, setActiveChatFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchFriendName, setSearchFriendName] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [editingFile, setEditingFile] = useState<ArchiveItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMegaUrl, setEditMegaUrl] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editId, setEditListId] = useState("");

  const [showChangeCatModal, setShowChangeCatModal] = useState(false);
  const [changeCatTarget, setChangeCatTarget] = useState<any | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

 // --- STATE TANIMLAMALARI ---
  const [randomFiles, setRandomFiles] = useState<ArchiveItem | null>(null); // 'files' değil 'ArchiveItem' olmalı
  const [glowFilesId, setGlowFilesId] = useState<number | null>(null);

  const [targetListId, setTargetListId] = useState("");
  const [title, setTitle] = useState("");
  const [megaUrl, setMegaUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Bu resim seçmek içinse 'File' kalmalı
  const [loading, setLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [isAdmin, setIsAdmin] = useState(false);
  const ADMIN_NAME = "Emre";
  
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchedUserData, setSearchedUserData] = useState<{ user: string; files: ArchiveItem[]; logs: LogEntry[] } | null>(null);
  
  const [onlineUsers, setOnlineUsers] = useState<{ [key: string]: { online: boolean; last_seen: string } }>({});
  
  const [backgroundSettings, setBackgroundSettings] = useState<any>({
    type: 'solid', 
    solidColor: '#050505', 
    gradientStart: '#050505',
    gradientEnd: '#1a1a2e', 
    gradientDirection: 'to bottom right',
    imageUrl: '', 
    blur: 0, 
    opacity: 50
  });

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newProfileFile, setNewProfileFile] = useState<File | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [bgUploading, setBgUploading] = useState(false);

  const currentUserName = session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || "Anonim";

  // ── İLK YÜKLEME ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) fetchAllData();
    };
    init();
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) fetchAllData();
    });
    const sp = localStorage.getItem("emre_board_profiles");
    if (sp) setUserProfiles(JSON.parse(sp));
    const sf = localStorage.getItem("emre_board_friends");
    if (sf) setFriends(JSON.parse(sf));
    const sb = localStorage.getItem("emre_board_bg_settings");
    if (sb) setBackgroundSettings(JSON.parse(sb));
    if (typeof window !== 'undefined' && window.innerWidth < 768) setIsSidebarOpen(false);
    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  // ── CTRL+V PASTE ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!showAddModal && !showEditModal) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          const file = new File([blob], `paste-${Date.now()}.png`, { type: blob.type });
          if (showAddModal) setSelectedFile(file);
          else setEditFile(file);
          break;
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [showAddModal, showEditModal]);

  // ── PRESENCE ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !currentUserName) return;
    const ch = supabase.channel('online-users', { config: { presence: { key: currentUserName } } });
    ch.on('presence', { event: 'sync' }, () => {
        const st = ch.presenceState();
        const nu: { [k: string]: { online: boolean; last_seen: string } } = {};
        Object.keys(st).forEach(k => { nu[k] = { online: true, last_seen: new Date().toISOString() }; });
        setOnlineUsers(p => ({ ...p, ...nu }));
      })
      .on('presence', { event: 'join' }, ({ key: k }) => setOnlineUsers(p => ({ ...p, [k]: { online: true, last_seen: new Date().toISOString() } })))
      .on('presence', { event: 'leave' }, ({ key: k }) => setOnlineUsers(p => ({ ...p, [k]: { online: false, last_seen: new Date().toISOString() } })))
      .subscribe(async s => { if (s === 'SUBSCRIBED') await ch.track({ user: currentUserName, online_at: new Date().toISOString() }); });
    return () => { supabase.removeChannel(ch); };
  }, [session, currentUserName]);

  // ── SOHBET REALTIME ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!showChatPanel || !activeChatFriend) return;
    const fetch = async () => {
      const { data } = await supabase.from("messages").select("*")
        .or(`and(sender_name.eq.${currentUserName},receiver_name.eq.${activeChatFriend}),and(sender_name.eq.${activeChatFriend},receiver_name.eq.${currentUserName})`)
        .order("id", { ascending: true });
      if (data) setMessages(data);
    };
    fetch();
    const ch = supabase.channel(`chat:${[currentUserName, activeChatFriend].sort().join('-')}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        if ((m.sender_name === currentUserName && m.receiver_name === activeChatFriend) ||
            (m.sender_name === activeChatFriend && m.receiver_name === currentUserName))
          setMessages(p => [...p, m]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [showChatPanel, activeChatFriend, currentUserName]);

  // ── OTOMATİK ARKADAŞ EKLEMESİ ────────────────────────────────────────────
  // Bana mesaj gönderen kullanıcı otomatik arkadaş listesine eklenir
  useEffect(() => {
    if (!session || !currentUserName) return;
    const ch = supabase.channel(`inbox:${currentUserName}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        if (m.receiver_name === currentUserName && m.sender_name !== ADMIN_NAME) {
          setFriends(prev => {
            if (prev.includes(m.sender_name)) return prev;
            const updated = [...prev, m.sender_name];
            localStorage.setItem("emre_board_friends", JSON.stringify(updated));
            return updated;
          });
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session, currentUserName]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── VERİ ÇEKME ────────────────────────────────────────────────────────────
  async function fetchAllData() {
    // Kategorileri id'ye göre veya varsa kendi order_index'ine göre çekebilirsin
    const { data: catData } = await supabase.from("kategoriler").select("*").order("order_index", { ascending: true });
    if (catData) setCategories(catData as Category[]);

    // Arşivi senin eklediğin order_index sütununa göre çekiyoruz
    const { data: fileData } = await supabase.from("arsiv").select("*").order("order_index", { ascending: true });
    if (fileData) setFiles(fileData as ArchiveItem[]);

    // Loglar her zaman en yeni en üstte olacak şekilde kalsın (id veya created_at)
    const { data: logData } = await supabase.from("logs").select("*").order("id", { ascending: false });
    if (logData) setLogs(logData as LogEntry[]);
  }

  // ── LİSTE TAŞIMA — optimistik state ──────────────────────────────────────
  const moveList = async (index: number, direction: 'left' | 'right') => {
    const tIdx = direction === 'left' ? index - 1 : index + 1;
    if (tIdx < 0 || tIdx >= categories.length) return;
    const cur = categories[index];
    const tar = categories[tIdx];
    const updated = categories.map((l, i) => {
      if (i === index) return { ...l, order_index: tar.order_index };
      if (i === tIdx)  return { ...l, order_index: cur.order_index };
      return l;
    });
    setCategories([...updated].sort((a, b) => a.order_index - b.order_index));
    await supabase.from("kategoriler").update({ order_index: tar.order_index }).eq("id", cur.id);
    await supabase.from("kategoriler").update({ order_index: cur.order_index }).eq("id", tar.id);
  };

  // ── KART SIRALAMA — optimistik state ─────────────────────────────────────
  const movefiles = async (index: number, direction: 'up' | 'down', listId: string) => {
   const listfiles = files
  .filter(c => String(c.category) === String(listId))
  .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const tIdx = direction === 'up' ? index - 1 : index + 1;
    if (tIdx < 0 || tIdx >= listfiles.length) return;
    const cur = listfiles[index];
    const tar = listfiles[tIdx];
    setFiles(prev => prev.map(c => {
      if (c.id === cur.id) return { ...c, order_index: tar.order_index };
      if (c.id === tar.id) return { ...c, order_index: cur.order_index };
      return c;
    }));
    await supabase.from("arsiv").update({ order_index: tar.order_index }).eq("id", cur.id);
    await supabase.from("arsiv").update({ order_index: cur.order_index }).eq("id", tar.id);
  };

  // ── KART LİSTE DEĞİŞTİRME ────────────────────────────────────────────────
const handleChangeList = async (newListId: string) => {
  if (!changeCatTarget) return;

  // 1. Hedef kategorideki dosyaları filtrele (Sıralama için en büyük index'i bulacağız)
  const targetCategoryFiles = files.filter(c => String(c.category) === String(newListId));
  
  // 2. Yeni kategoride en sona eklemek için max index'i hesapla
  const maxIdx = targetCategoryFiles.length > 0 
    ? Math.max(...targetCategoryFiles.map(c => c.order_index || 0)) 
    : 0;

  // 3. Supabase'i güncelle (list_id bitti, artık category sütununa newListId yani kategori adını yazıyoruz)
  const { error } = await supabase
    .from("arsiv")
    .update({ 
      category: newListId, // Burası 'category' olmalı
      order_index: maxIdx + 1 
    })
    .eq("id", changeCatTarget.id);

  if (error) {
    console.error("Taşıma hatası:", error.message);
    return;
  }

  // 4. State'i ve Modalı kapat
  setShowChangeCatModal(false);
  setChangeCatTarget(null);
  
  // 5. Verileri tazele (Bu sayede Mega linkleri ve yeni sıralama anında düzelir)
  await fetchAllData();
};

  // ── GLOBAL RASTGELE KART (sağ-alt buton) ─────────────────────────────────
  const pickGlobalRandom = () => {
    if (files.length === 0) return;
    const picked = files[Math.floor(Math.random() * files.length)];
    setRandomFiles(picked);
    setGlowFilesId(picked.id);
    setTimeout(() => {
      const el = document.getElementById(`files-${picked.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setGlowFilesId(null), 3000);
  };

  // ── ARKA PLAN DOSYA YÜKLEMESİ ────────────────────────────────────────────
  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUploading(true);
    try {
      const fn = `bg-${Date.now()}-${file.name.replace(/\s/g, '-')}`;
      const { error } = await supabase.storage.from("arsiv-dosyalari").upload(fn, file);
      if (error) throw error;
      const { data: ud } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fn);
      const ns = { ...backgroundSettings, type: 'image' as const, imageUrl: ud.publicUrl };
      setBackgroundSettings(ns);
      localStorage.setItem("emre_board_bg_settings", JSON.stringify(ns));
    } catch (err: any) { alert(err.message); } finally { setBgUploading(false); }
  };

  // ── PROFİL GÜNCELLEME ─────────────────────────────────────────────────────
  const handleProfileUpdate = async () => {
    setProfileLoading(true);
    try {
      let finalAvatarUrl = userProfiles[currentUserName] || "";
      if (newProfileFile) {
        const fn = `profile-${currentUserName}-${Date.now()}`;
        const { error: ue } = await supabase.storage.from("arsiv-dosyalari").upload(fn, newProfileFile);
        if (ue) throw ue;
        const { data: ud } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fn);
        finalAvatarUrl = ud.publicUrl;
      }
      const ud: any = {};
      if (newDisplayName.trim() && newDisplayName.trim() !== currentUserName) ud.display_name = newDisplayName.trim();
      if (finalAvatarUrl) ud.avatar_url = finalAvatarUrl;
      if (Object.keys(ud).length > 0) {
        const { error } = await supabase.auth.updateUser({ data: ud });
        if (error) throw error;
      }
      const tn = newDisplayName.trim() || currentUserName;
      const np = { ...userProfiles, [tn]: finalAvatarUrl };
      if (newDisplayName.trim() && newDisplayName.trim() !== currentUserName) np[currentUserName] = finalAvatarUrl;
      setUserProfiles(np);
      localStorage.setItem("emre_board_profiles", JSON.stringify(np));
      setShowProfileEdit(false); setNewDisplayName(""); setNewProfileFile(null);
      alert("Profil güncellendi! Değişikliklerin görünmesi için sayfayı yenileyin.");
    } catch (err: any) { alert(err.message); } finally { setProfileLoading(false); }
  };

  // ── MESAJ GÖNDER ──────────────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatFriend) return;
    const { error } = await supabase.from("messages").insert([{
      sender_name: currentUserName,
      receiver_name: activeChatFriend,
      text: newMessage.trim()
    }]);
    if (error) { console.error(error); alert("Mesaj gönderilemedi."); }
    else setNewMessage("");
  };

  const handleAddFriend = async () => {
    const target = searchFriendName.trim();
    if (!target) return;
    if (target === currentUserName) { alert("Kendini ekleyemezsin!"); return; }
    if (friends.includes(target)) { alert("Zaten ekli!"); return; }
    const { data: uc } = await supabase.from("logs").select("user_name").eq("user_name", target).limit(1);
    if (!uc || uc.length === 0) { alert("Kullanıcı bulunamadı veya henüz aktivite yok."); return; }
    const nf = [...friends, target];
    setFriends(nf);
    localStorage.setItem("emre_board_friends", JSON.stringify(nf));
    setSearchFriendName(""); setShowAddFriendModal(false);
    alert(`${target} eklendi!`);
  };

  const handlefilesClick = async (file: ArchiveItem) => {
    await supabase.from("logs").insert([{ 
        title: file.title, image_url: file.image_url, user_name: currentUserName, file_id: file.id
    }]);
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
      alert("Profil fotoğrafı güncellendi!");
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

 // ── İSTATİSTİK — card_id üzerinden hesapla ───────────────────────────────
  const getStats = () => {
    const m: { [k: string]: any } = {};
    logs.forEach(log => {
      if (!log.file_id) return;
      const id = log.file_id;
      if (!m[id]) m[id] = {
        id,
        title: log.title,
        image_url: log.image_url,
        mega_url: files.find(c => c.id === id)?.mega_url || "#",
        totalClicks: 0,
        users: {}
      };
      m[id].totalClicks++;
      const u = log.user_name || "Anonim";
      if (!m[id].users[u]) m[id].users[u] = { count: 0, lastDate: log.created_at };
      m[id].users[u].count++;
      if (new Date(log.created_at) > new Date(m[id].users[u].lastDate)) m[id].users[u].lastDate = log.created_at;
    });
    return Object.values(m).sort((a: any, b: any) => b.totalClicks - a.totalClicks);
  };

  const deleteStatLogs = async (filesId: number | string) => {
    if (!isAdmin || !confirm("Sıfırlansın mı?")) return;
    const { error } = await supabase.from("logs").update({ file_id: null }).eq("file_id", filesId);
    if (!error) fetchAllData();
  };

  const toggleAdminPower = () => {
    if (!isAdmin) { const p = prompt("Admin Şifresi:"); if (p === "Emre_2013") setIsAdmin(true); else alert("Hatalı!"); }
    else setIsAdmin(false);
  };

  const getLastSeen = (u: string) => {
    const s = onlineUsers[u];
    if (s?.online) return "Çevrimiçi";
    if (s?.last_seen) {
      const diff = Date.now() - new Date(s.last_seen).getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1) return "Az önce";
      if (m < 60) return `${m} dk önce`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h} saat önce`;
      return new Date(s.last_seen).toLocaleDateString('tr-TR');
    }
    return "Bilinmiyor";
  };
  const isUserOnline = (u: string) => onlineUsers[u]?.online || false;

  const handleUserSearch = () => {
    if (!userSearchQuery.trim()) { setSearchedUserData(null); return; }
    const q = userSearchQuery.toLowerCase();
    const matched = getVisibleUsers().find(u => u.toLowerCase().includes(q));
    if (matched) {
      setSearchedUserData({
        user: matched,
        files: files.filter(c => logs.some(l => l.file_id === c.id && l.user_name === matched)),
        logs: logs.filter(l => l.user_name === matched)
      });
    } else { setSearchedUserData(null); alert("Kullanıcı bulunamadı!"); }
  };

  const startEditing = (file: ArchiveItem) => {
    setEditingFile(file);
    setEditTitle(file.title);
    setEditMegaUrl(file.mega_url);
    setEditFile(null);
    setEditListId(file.category);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;
    setLoading(true);
    try {
      let img = editingFile.image_url;
      if (editFile) {
        const fn = `files-${Date.now()}-${editFile.name.replace(/\s/g, '-')}`;
        await supabase.storage.from("arsiv-dosyalari").upload(fn, editFile);
        const { data: ud } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fn);
        img = ud.publicUrl;
      }
      let oi = editingFile.order_index;
      if (editId !== editingFile.category) {
        const lc = files.filter(c => c.category === editId);
        oi = lc.length > 0 ? Math.max(...lc.map(c => c.order_index)) + 1 : 0;
      }
      await supabase.from("arsiv").update({
        title: editTitle.toUpperCase(),
        mega_url: editMegaUrl,
        image_url: img,
        category: editId,
        order_index: oi
      }).eq("id", editingFile.id);
      setShowEditModal(false);
      fetchAllData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleListRename = async (id: string, oldTitle: string) => {
    const n = prompt("Yeni isim:", oldTitle);
    if (n) { await supabase.from("kategoriler").update({ title: n }).eq("id", id); fetchAllData(); }
  };

  const deleteList = async (id: string) => {
    if (confirm("Silinsin mi?")) { await supabase.from("kategoriler").delete().eq("id", id); fetchAllData(); }
  };

  const deletefiles = async (id: number) => {
    if (confirm("Kart silinsin mi?")) { await supabase.from("arsiv").delete().eq("id", id); fetchAllData(); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!email.trim()) { alert("E-posta gerekli!"); setAuthLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: email.split('@')[0] } }
        });
        if (error) throw error;
        alert("Kayıt başarılı!");
        setAuthMode('login');
      }
    } catch (err: any) { alert(err.message); } finally { setAuthLoading(false); }
  };

  const handleSignOut = async () => {
    if (confirm("Çıkış?")) { await supabase.auth.signOut(); setSession(null); }
  };

  const handleAddList = async () => {
    const name = prompt("Liste adı:");
    if (name) {
      const maxIdx = categories.length > 0 ? Math.max(...categories.map(l => l.order_index || 0)) : 0;
      await supabase.from("kategoriler").insert([{ id: `list-${Date.now()}`, title: name.trim(), order_index: maxIdx + 1 }]);
      fetchAllData();
    }
  };

  // ── KART YÜKLEMESİ — category kullan ─────────────────────────────────────
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title || !megaUrl || !targetListId) return alert("Eksik alan var!");
    setLoading(true);
    try {
      const fn = `${Date.now()}-${selectedFile.name.replace(/\s/g, '-')}`;
      await supabase.storage.from("arsiv-dosyalari").upload(fn, selectedFile);
      const { data: ud } = supabase.storage.from("arsiv-dosyalari").getPublicUrl(fn);
      const lc = files.filter(c => c.category === targetListId);
      const maxIdx = lc.length > 0 ? Math.max(...lc.map(c => c.order_index)) : 0;
      await supabase.from("arsiv").insert([{
        title: title.toUpperCase(),
        mega_url: megaUrl,
        image_url: ud.publicUrl,
        category: targetListId,
        order_index: maxIdx + 1
      }]);
      setShowAddModal(false); setTitle(""); setMegaUrl(""); setSelectedFile(null);
      fetchAllData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    scrollContainerRef.current.scrollLeft = scrollLeft - (e.pageX - scrollContainerRef.current.offsetLeft - startX) * 2;
  };

  const getVisibleUsers = () => {
    const all = Array.from(new Set(logs.map(l => l.user_name || "Anonim")));
    return isAdmin ? all : all.filter(u => u === currentUserName || u === ADMIN_NAME);
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    if (backgroundSettings.type === 'solid') return { backgroundColor: backgroundSettings.solidColor };
    if (backgroundSettings.type === 'gradient') return { background: `linear-gradient(${backgroundSettings.gradientDirection}, ${backgroundSettings.gradientStart}, ${backgroundSettings.gradientEnd})` };
    return {};
  };

  const getSortedListfiles = (listId: string) =>
    [...files.filter(c => c.category === listId)].sort((a, b) => a.order_index - b.order_index);

  const saveBg = (s: any) => {
    setBackgroundSettings(s);
    localStorage.setItem("emre_board_bg_settings", JSON.stringify(s));
  };
  
  // ── GLOW CSS ──────────────────────────────────────────────────────────────
  const glowCSS = `
    @keyframes glowPulse {
      0%,100%{box-shadow:0 0 8px 2px rgba(99,102,241,.4);border-color:rgba(99,102,241,.6);}
      50%{box-shadow:0 0 32px 10px rgba(99,102,241,.9),0 0 60px 20px rgba(165,180,252,.3);border-color:rgba(165,180,252,1);}
    }
    .glow-files{animation:glowPulse .7s ease-in-out infinite;border-width:2px!important;}
  `;

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (!session) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center p-6 text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"/>
      <div className="w-full max-w-md bg-zinc-900/50 border border-white/10 backdrop-blur-xl p-10 rounded-[3rem] z-10 text-center">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Emre <span className="text-blue-600">Board</span></h1>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-10">{authMode === 'login' ? 'Giriş' : 'Kayıt'}</p>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          {authMode === 'signup' && (<>
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center overflow-hidden mb-3">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover"/> : <User size={32} className="text-zinc-500"/>}
              </div>
              <input type="url" placeholder="Profil fotoğrafı URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-blue-600 text-center"/>
              <div className="flex gap-2 flex-wrap justify-center mt-3">
                {['Felix','Aneka','Max','Luna','Shadow','Storm'].map((seed, i) => {
                  const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                  return <button key={i} type="button" onClick={() => setAvatarUrl(url)} className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${avatarUrl === url ? 'border-blue-500 scale-110' : 'border-transparent hover:border-zinc-500'}`}><img src={url} alt="" className="w-full h-full object-cover bg-zinc-700"/></button>;
                })}
              </div>
            </div>
            <div className="relative"><Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
              <input type="text" placeholder="KULLANICI ADI" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-blue-600" required/></div>
          </>)}
          <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
            <input type="email" placeholder="E-POSTA" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-blue-600" required/></div>
          <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
            <input type="password" placeholder="ŞİFRE" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-blue-600" required/></div>
          <button type="submit" disabled={authLoading} className="w-full bg-blue-600 font-black py-5 rounded-2xl uppercase tracking-widest mt-4">{authLoading ? "..." : (authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}</button>
        </form>
        <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="mt-8 text-zinc-500 hover:text-white text-[10px] font-black uppercase">{authMode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}</button>
      </div>
    </div>
  );

  // ── ANA EKRAN ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen text-white font-sans overflow-hidden flex flex-row relative"
      style={backgroundSettings.type !== 'image' ? getBackgroundStyle() : { backgroundColor: '#050505' }}>
      <style>{glowCSS}</style>

      {/* ── ARKA PLAN RESMİ — cover + fixed + center ──────────────────────── */}
      {backgroundSettings.type === 'image' && backgroundSettings.imageUrl && (<>
        <div className="fixed inset-0 z-0" style={{
          backgroundImage: `url(${backgroundSettings.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          filter: backgroundSettings.blur > 0 ? `blur(${backgroundSettings.blur}px)` : 'none',
          transform: backgroundSettings.blur > 0 ? 'scale(1.08)' : 'none',
        }}/>
        <div className="fixed inset-0 z-0" style={{ backgroundColor: `rgba(0,0,0,${backgroundSettings.opacity / 100})` }}/>
      </>)}

      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="fixed top-6 left-6 z-[300] p-4 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl text-blue-500 shadow-2xl"><Menu/></button>
      )}

      {/* ── GLOBAL RANDOM DICE BUTTON (sağ-alt) ────────────────────────────── */}
      <button
        onClick={pickGlobalRandom}
        className="fixed bottom-8 right-8 z-[400] w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl border border-blue-400/30 hover:scale-105 active:scale-90 transition-all duration-150"
        title="Rastgele Kart Seç"
      >
        <Dices size={26} className="text-white drop-shadow"/>
      </button>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <div className={`fixed md:relative z-[200] h-full bg-zinc-900/95 backdrop-blur-md border-r border-white/5 flex flex-col shrink-0 transition-all duration-500 ${isSidebarOpen ? 'translate-x-0 w-80 p-6' : '-translate-x-full w-0 p-0'}`}>
        <div className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} flex flex-col h-full overflow-hidden`}>
          <div className="flex items-center justify-between mb-8 min-w-[260px]">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Emre <span className="text-blue-600">Board</span></h1>
            <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500"><ChevronLeft/></button>
          </div>
          <div className="space-y-3 mb-8">
            <button onClick={() => { fetchAllData(); setShowActivityPanel(true); }} className="w-full flex items-center gap-3 p-3 bg-green-600/10 text-green-500 rounded-xl border border-green-600/20 font-black uppercase italic text-[10px]"><Activity size={18}/> Aktivite</button>
            <button onClick={() => setShowChatPanel(true)} className="w-full flex items-center gap-3 p-3 bg-purple-600/10 text-purple-500 rounded-xl border border-purple-600/20 font-black uppercase italic text-[10px]"><MessageCircle size={18}/> Sohbet & Arkadaşlar</button>
            <button onClick={() => setShowSettingsPanel(true)} className="w-full flex items-center gap-3 p-3 bg-cyan-600/10 text-cyan-500 rounded-xl border border-cyan-600/20 font-black uppercase italic text-[10px]"><Settings size={18}/> Ayarlar</button>
            <button onClick={toggleAdminPower} className={`w-full flex items-center gap-3 p-3 rounded-xl border font-black uppercase italic text-[10px] ${isAdmin ? 'bg-orange-600/20 text-orange-500 border-orange-600/40' : 'bg-white/5 text-zinc-500 border-white/10'}`}><ShieldAlert size={18}/> Admin: {isAdmin ? 'AÇIK' : 'KAPALI'}</button>
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
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0"><img src={stat.image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" alt=""/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase italic truncate">{stat.title}</p>
                      {isAdmin && <p className="text-[8px] font-bold text-zinc-500">{stat.totalClicks} TIK</p>}
                    </div>
                    {isAdmin && <button onClick={() => deleteStatLogs(stat.id)} className="p-1 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 space-y-3 pt-4 border-t border-white/5">
            <button onClick={handleAddList} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 uppercase text-[10px] font-black hover:bg-blue-600/10"><Plus size={18}/> Liste Ekle</button>
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-black italic text-[10px] overflow-hidden">
                  {userProfiles[currentUserName] ? <img src={userProfiles[currentUserName]} className="w-full h-full object-cover" alt=""/> : currentUserName[0]}
                </div>
                <p className="text-[10px] font-black uppercase italic truncate">{currentUserName}</p>
              </div>
              <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-3 p-3 bg-red-600/10 text-red-500 rounded-xl font-black uppercase italic text-[10px]"><LogOut size={16}/> Çıkış</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOARD ───────────────────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => setIsDragging(false)}
        onMouseUp={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        className={`flex-1 overflow-x-auto custom-scrollbar flex items-start p-6 md:p-10 gap-6 md:gap-8 h-full transition-all duration-500 relative z-10 ${!isSidebarOpen ? 'md:pl-24' : ''} ${isDragging ? 'cursor-grabbing select-none' : 'cursor-default'}`}
      >
        {categories.map((list, listIdx) => {
          const listfiles = getSortedListfiles(list.id);
          return (
            <div key={list.id} className="w-[260px] md:w-[340px] shrink-0 bg-zinc-900/70 backdrop-blur-md border border-white/5 rounded-[2.5rem] flex flex-col max-h-[85vh] relative shadow-2xl">
              <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-0.5">
                  <button onClick={() => moveList(listIdx, 'left')} disabled={listIdx === 0}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-blue-600/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90">
                    <ChevronLeft size={14}/>
                  </button>
                  <button onClick={() => moveList(listIdx, 'right')} disabled={listIdx === categories.length - 1}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-blue-600/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90">
                    <ChevronRight size={14}/>
                  </button>
                </div>
                <h2 className="font-black text-[10px] md:text-[12px] uppercase tracking-widest text-blue-500 italic flex-1 text-center px-1">{list.title}</h2>
                <div className="flex items-center gap-0.5">
                  {isAdmin && <>
                    <button onClick={() => handleListRename(list.id, list.title)} className="p-1.5 text-blue-500/50 hover:text-blue-500 transition-all"><Edit3 size={14}/></button>
                    <button onClick={() => deleteList(list.id)} className="p-1.5 text-red-500/50 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                  </>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 custom-scrollbar-v flex flex-col">
                {listfiles.map((file, idx) => (
                  <div
                    id={`files-${file.id}`}
                    key={file.id}
                    className={`bg-[#0f0f11]/90 backdrop-blur-sm border rounded-[1.8rem] overflow-hidden relative group transition-all ${glowFilesId === file.id ? 'glow-files border-indigo-400' : 'border-white/5 hover:border-blue-600/40'}`}
                  >
                  {isAdmin && <button onClick={() => startEditing(file)} className="absolute top-3 right-3 z-30 bg-blue-600 p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={16}/></button>}
                  
                  {/* Kart içeriği buraya gelecek (4. parça devamı veya 5. parça) */}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setTargetListId(list.id);
                  setShowAddModal(true);
                }}
                className="mx-4 mb-4 p-4 bg-white/[0.02] border-2 border-dashed border-white/5 rounded-xl text-[10px] font-black text-zinc-600 hover:text-blue-500 transition-all uppercase"
              >
                + Kart Ekle
              </button>
            </div>
          );
        })}
      </div>

      {/* ── LİSTE DEĞİŞTİR MODAL ─────────────────────────────────────────── */}
      {showChangeCatModal && changeCatTarget && (
        <div className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-zinc-900 border border-purple-600/30 p-8 rounded-[3rem] shadow-4xl">
            <h2 className="text-xl font-black italic uppercase mb-2 text-purple-400 flex items-center gap-3">
              <ArrowLeftRight size={22} /> Liste Değiştir
            </h2>
            <p className="text-[10px] text-zinc-500 mb-6 font-bold uppercase">
              "{changeCatTarget.title}" kartını taşı
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar-v">
              {categories.filter((l) => l.id !== changeCatTarget.category).map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleChangeList(list.id)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-left font-black text-xs uppercase hover:bg-purple-600/20 hover:border-purple-600/40 transition-all"
                >
                  {list.title}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowChangeCatModal(false); setChangeCatTarget(null); }}
              className="w-full mt-4 p-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase"
            >
              İptal
            </button>
          </div>
        </div>
      )}
      
{/* KART İÇERİĞİ: Resim ve Link */}
{files
  .filter((f) => f.list_id === list.id)
  .map((file) => (
    <div key={file.id} className="group bg-zinc-900/40 border border-white/5 rounded-[2rem] overflow-hidden hover:border-blue-500/30 transition-all">
      <button 
        onClick={() => { if(file.mega_url) window.open(file.mega_url, "_blank"); }} 
        className="w-full aspect-video bg-black/40 relative block overflow-hidden"
      >
        <img src={file.image_url} className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-700" alt=""/>
      </button>

      <div className="p-3 md:p-4 flex justify-between items-center font-black text-[9px] md:text-xs uppercase italic text-zinc-200">
        <span className="truncate pr-2">{file.title}</span>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => { setEditingfiles(file); setEditTitle(file.title); setEditMegaUrl(file.mega_url || ""); setEditListId(file.list_id); setShowEditModal(true); }} className="text-blue-500 hover:scale-110"><Edit3 size={14}/></button>
            <button onClick={() => deletefiles(file.id)} className="text-red-500 hover:scale-110"><Trash2 size={14}/></button>
          </div>
        )}
      </div>
    </div> // Kapanması gereken div buydu
  ))}

<button 
  onClick={() => { setTargetListId(list.id); setShowAddModal(true); }} 
  className="w-full p-4 bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[2rem] text-[10px] font-black text-zinc-600 hover:text-blue-500 transition-all uppercase flex items-center justify-center gap-2"
>
  <Plus size={14}/> Kart Ekle
</button>

      {/* ── LİSTE DEĞİŞTİR ──────────────────────────────────────────────────── */}
      {showChangeCatModal && changeCatTarget && (
        <div className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-zinc-900 border border-purple-600/30 p-8 rounded-[3rem] shadow-4xl">
            <h2 className="text-xl font-black italic uppercase mb-2 text-purple-400 flex items-center gap-3"><ArrowLeftRight size={22}/> Liste Değiştir</h2>
            <p className="text-[10px] text-zinc-500 mb-6 font-bold uppercase">"{changeCatTarget.title}" kartını taşı</p>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar-v">
              {categories.filter(l => l.id !== changeCatTarget.category).map(list => (
                <button key={list.id} onClick={() => handleChangeList(list.id)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-left font-black text-xs uppercase hover:bg-purple-600/20 hover:border-purple-600/40 transition-all">{list.title}</button>
              ))}
            </div>
            <button onClick={() => { setShowChangeCatModal(false); setChangeCatTarget(null); }} className="w-full mt-4 p-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase">İptal</button>
          </div>
        </div>
      )}

      {/* ── AKTİVİTE PANELİ ─────────────────────────────────────────────────── */}
      {showActivityPanel && (
        <div className="fixed inset-0 z-[600] bg-[#050505] flex flex-col overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col gap-4 bg-zinc-900/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {(selectedUser || searchedUserData) && (
                  <button onClick={() => { setSelectedUser(null); setSearchedUserData(null); setUserSearchQuery(""); }} className="p-2 bg-white/5 rounded-lg text-zinc-400">
                    <ChevronLeft size={20}/>
                  </button>
                )}
                <h2 className="text-3xl font-black uppercase italic">
                  {searchedUserData ? `${searchedUserData.user} - Profil` : selectedUser ? `${selectedUser} - Aktiviteler` : 'Kullanıcı Listesi'}
                </h2>
              </div>
              <button onClick={() => { setShowActivityPanel(false); setSelectedUser(null); setSearchedUserData(null); setUserSearchQuery(""); }} className="p-3 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600 transition-all">
                <X size={24}/>
              </button>
            </div>

            {!selectedUser && !searchedUserData && (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
                  <input type="text" value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUserSearch()} placeholder="Kullanıcı ara..." className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-green-600"/>
                </div>
                <button onClick={handleUserSearch} className="px-6 bg-green-600 rounded-2xl font-black text-[10px] uppercase hover:bg-green-500 transition-all">Ara</button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar-v">
            {/* ARAMA SONUCU: PROFIL GÖRÜNÜMÜ */}
            {searchedUserData && (
              <div className="max-w-4xl mx-auto space-y-8">
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
                    <p className="text-xs text-zinc-600 mt-2">{searchedUserData.logs.length} aktivite | {searchedUserData.files?.length || 0} kart tıklamış</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {searchedUserData.logs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-center p-4 bg-zinc-900/80 border border-white/5 rounded-2xl gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 p-1"><img src={log.image_url} className="w-full h-full object-contain" alt=""/></div>
                      <div><p className="font-black italic uppercase text-sm">{log.title}</p><p className="text-[9px] text-zinc-500 font-bold">{new Date(log.created_at).toLocaleString('tr-TR')}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANA LİSTE: KULLANICI KARTLARI */}
            {!selectedUser && !searchedUserData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {getVisibleUsers().map(uName => (
                  <div key={uName} className="relative group overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900 aspect-[4/3] flex flex-col items-center justify-center transition-all hover:border-blue-600/50 shadow-2xl">
                    {userProfiles[uName] && <img src={userProfiles[uName]} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50" alt=""/>}
                    <label className="absolute top-4 right-4 p-2 bg-black/60 rounded-xl text-blue-500 opacity-0 group-hover:opacity-100 cursor-pointer z-20"><ImageIcon size={16}/><input type="file" accept="image/*" className="hidden" onChange={e => handleUserPhotoUpload(uName, e)}/></label>
                    <div className={`absolute top-4 left-4 px-2 py-1 rounded-full text-[8px] font-black uppercase ${isUserOnline(uName) ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>{isUserOnline(uName) ? 'Çevrimiçi' : 'Çevrimdışı'}</div>
                    <User className="mb-4 text-blue-500 relative z-10" size={48}/>
                    <button onClick={() => setSelectedUser(uName)} className="relative z-10 font-black uppercase italic text-lg tracking-wider hover:text-blue-400">{uName}</button>
                  </div>
                ))}
              </div>
            )}

            {/* SEÇİLİ KULLANICI AKTİVİTELERİ */}
            {selectedUser && !searchedUserData && (
              <div className="max-w-4xl mx-auto space-y-4">
                {logs.filter(l => l.user_name === selectedUser).map(log => (
                  <div key={log.id} className="flex items-center p-5 bg-zinc-900/80 border border-white/10 rounded-[1.5rem] group hover:bg-blue-600/5 transition-all gap-5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/40 p-1"><img src={log.image_url} className="w-full h-full object-contain" alt=""/></div>
                    <div><p className="font-black italic uppercase text-lg group-hover:text-blue-400">{log.title}</p><p className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(log.created_at).toLocaleString('tr-TR')}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SOHBET ──────────────────────────────────────────────────────────── */}
      {showChatPanel && (
        <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-row shadow-4xl relative">
            <div className="w-80 border-r border-white/5 flex flex-col bg-zinc-900/30">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-black uppercase italic text-sm text-blue-500">Arkadaşlar</h3>
                <button onClick={() => setShowAddFriendModal(true)} className="p-2 bg-blue-600/20 text-blue-500 rounded-lg hover:bg-blue-600 transition-all"><UserPlus size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div onClick={() => setActiveChatFriend(ADMIN_NAME)} className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${activeChatFriend === ADMIN_NAME ? 'bg-blue-600 border-blue-400 shadow-lg' : 'bg-blue-600/10 border-blue-600/20'}`}>
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center font-black overflow-hidden">
                      {userProfiles[ADMIN_NAME] ? <img src={userProfiles[ADMIN_NAME]} className="w-full h-full object-cover" alt=""/> : "E"}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${isUserOnline(ADMIN_NAME) ? 'bg-green-500' : 'bg-zinc-500'}`}/>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase italic">Emre (Admin)</p>
                    <p className={`text-[8px] font-bold flex items-center gap-1 ${isUserOnline(ADMIN_NAME) ? 'text-green-400' : 'text-white/50'}`}>
                      {isUserOnline(ADMIN_NAME) ? <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> : <Clock size={8}/>} {getLastSeen(ADMIN_NAME)}
                    </p>
                  </div>
                </div>
                {friends.map((fName, i) => (
                  <div key={i} onClick={() => setActiveChatFriend(fName)} className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${activeChatFriend === fName ? 'bg-zinc-700 border-zinc-500 shadow-lg' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                    <div className="relative">
                      <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-black italic overflow-hidden">
                        {userProfiles[fName] ? <img src={userProfiles[fName]} className="w-full h-full object-cover" alt=""/> : fName[0].toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${isUserOnline(fName) ? 'bg-green-500' : 'bg-zinc-500'}`}/>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase italic">{fName}</p>
                      <p className={`text-[8px] font-bold flex items-center gap-1 ${isUserOnline(fName) ? 'text-green-400' : 'text-zinc-500'}`}>
                        {isUserOnline(fName) ? <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> : <Clock size={8}/>} {getLastSeen(fName)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col relative bg-black/20">
              {activeChatFriend ? (
                <>
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center font-black overflow-hidden">
                        {userProfiles[activeChatFriend] ? <img src={userProfiles[activeChatFriend]} className="w-full h-full object-cover" alt=""/> : activeChatFriend[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black uppercase italic">{activeChatFriend}</h4>
                        <p className={`text-[9px] font-bold ${isUserOnline(activeChatFriend) ? 'text-green-400' : 'text-zinc-500'}`}>{getLastSeen(activeChatFriend)}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowChatPanel(false)} className="p-2 text-zinc-500 hover:text-white"><X/></button>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar-v">
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_name === currentUserName;
                      return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-4 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                            <p className="text-sm font-medium">{msg.text}</p>
                            <p className="text-[8px] text-white/30 text-right mt-1">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ""}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef}/>
                  </div>
                  <form onSubmit={handleSendMessage} className="p-6 border-t border-white/5 flex gap-4 bg-zinc-900/30">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={`${activeChatFriend} kişisine mesaj yaz...`} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-blue-600"/>
                    <button type="submit" className="p-4 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all"><Send size={18}/></button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 uppercase italic font-black">
                  <MessageCircle size={64} className="mb-4 opacity-20"/><p>Mesajlaşmak için bir arkadaş seç</p>
                </div>
              )}
            </div>
            {showAddFriendModal && (
        <div className="absolute inset-0 z-[800] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/10 p-8 rounded-[2rem] text-center">
            <h3 className="text-xl font-black uppercase italic text-blue-500 mb-6 flex items-center justify-center gap-3"><Search/> Arkadaş Ara</h3>
            <p className="text-[9px] text-zinc-500 mb-4 font-bold">SADECE KAYITLI VE AKTİF KULLANICILAR EKLENEBİLİR</p>
            <input type="text" value={searchFriendName} onChange={e => setSearchFriendName(e.target.value)} placeholder="Tam kullanıcı adı..." className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-xs font-bold outline-none focus:border-blue-600 mb-6"/>
            <div className="flex gap-4">
              <button onClick={() => setShowAddFriendModal(false)} className="flex-1 p-3 bg-white/5 rounded-xl text-[10px] font-black uppercase">İptal</button>
              <button onClick={handleAddFriend} className="flex-1 p-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase">Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      {showStatsDetail && isAdmin && (
        <div className="fixed inset-0 z-[900] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[85vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
              <h2 className="text-2xl font-black uppercase italic text-blue-500">Analiz & Tıklama Geçmişi</h2>
              <button onClick={() => setShowStatsDetail(false)} className="p-3 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 transition-all"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-v">
              {getStats().map((stat: any, idx: number) => (
                <div key={idx} className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/40 p-2">
                        <img src={stat.image_url} className="w-full h-full object-contain" alt=""/>
                      </div>
                      <div>
                        <h3 className="font-black italic uppercase text-lg">{stat.title}</h3>
                        <p className="text-blue-500 font-bold text-xs uppercase">{stat.totalClicks} TOPLAM TIKLANMA</p>
                      </div>
                    </div>
                    <a href={stat.mega_url} target="_blank" rel="noreferrer" className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600 transition-all flex items-center gap-2 font-black text-[10px] uppercase">
                      <ExternalLink size={16}/> Git
                    </a>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(stat.users).map(([uName, data]: any) => (
                      <div key={uName} className="p-3 bg-black/40 border border-white/5 rounded-xl">
                        <p className="text-[10px] font-black uppercase italic">{uName}</p>
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

      {/* ── DÜZENLEME MODAL ─────────────────────────────────────────────────── */}
      {showEditModal && editingfiles && (
        <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-zinc-900 border border-blue-600/30 p-8 rounded-[3rem] shadow-4xl">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-blue-500 flex items-center gap-3"><Edit3/> Düzenle</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none text-xs focus:border-blue-600" placeholder="BAŞLIK"/>
              <input type="text" value={editMegaUrl} onChange={e => setEditMegaUrl(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none text-xs focus:border-blue-600" placeholder="MEGA URL"/>
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Liste</label>
                <select value={editListId} onChange={e => setEditListId(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none text-xs focus:border-blue-600">
                  {categories.map(list => <option key={list.id} value={list.id}>{list.title}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img src={editFile ? URL.createObjectURL(editFile) : editingfiles.image_url} className="w-20 h-20 object-contain rounded-xl border border-white/10" alt=""/>
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Görsel Değiştir</p>
                    <p className="text-[9px] font-bold text-blue-400 mb-2">💡 Ctrl+V ile yapıştır</p>
                    <input type="file" accept="image/*" onChange={e => setEditFile(e.target.files?.[0] || null)} className="w-full text-xs text-zinc-400"/>
                  </div>
                </div>
                {editFile && (
                  <div className="flex items-center gap-2 p-2 bg-green-600/10 border border-green-600/20 rounded-xl">
                    <div className="w-2 h-2 bg-green-500 rounded-full"/>
                    <p className="text-[9px] font-bold text-green-400">{editFile.name} seçildi</p>
                    <button type="button" onClick={() => setEditFile(null)} className="ml-auto text-zinc-500 hover:text-red-400"><X size={12}/></button>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 p-4 bg-white/5 rounded-2xl font-black text-xs uppercase">İPTAL</button>
                <button type="submit" disabled={loading} className="flex-1 p-4 bg-blue-600 rounded-2xl font-black text-xs uppercase">{loading ? "..." : "GÜNCELLE"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── KART EKLEME MODAL ────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 p-8 rounded-[3rem]">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-blue-500">Yeni Kart Ekle</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <input type="text" placeholder="BAŞLIK" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none text-xs focus:border-blue-600"/>
              <input type="text" placeholder="MEGA URL" value={megaUrl} onChange={e => setMegaUrl(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-bold outline-none text-xs focus:border-blue-600"/>
              <div>
                <p className="text-[9px] font-bold text-blue-400 mb-2">💡 Ctrl+V ile panodan görsel yapıştır</p>
                <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-xs text-zinc-400"/>
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-green-600/10 border border-green-600/20 rounded-xl">
                    <img src={URL.createObjectURL(selectedFile)} alt="" className="w-12 h-12 object-cover rounded-lg"/>
                    <div className="flex-1"><p className="text-[9px] font-bold text-green-400">{selectedFile.name}</p><p className="text-[8px] text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</p></div>
                    <button type="button" onClick={() => setSelectedFile(null)} className="text-zinc-500 hover:text-red-400"><X size={14}/></button>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => { setShowAddModal(false); setSelectedFile(null); }} className="flex-1 p-4 bg-white/5 rounded-2xl font-black text-xs uppercase">İPTAL</button>
                <button type="submit" disabled={loading} className="flex-1 p-4 bg-blue-600 rounded-2xl font-black text-xs uppercase">{loading ? "..." : "KAYDET"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
      {/* ── KATEGORİLER VE KARTLARIN DÖNDÜĞÜ YER ─────────────────────────────── */}
      <div className="space-y-12">
        {categories.map((list) => (
          <div key={list.id} className="space-y-6">
            <div className="flex items-center gap-4 border-l-4 border-blue-600 pl-4">
              <h2 className="text-xl font-black uppercase italic">{list.title}</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {files
                .filter((f) => f.list_id === list.id)
                .map((file) => (
                  <div key={file.id} className="group bg-zinc-900/40 border border-white/5 rounded-[2rem] overflow-hidden hover:border-blue-500/30 transition-all">
                    <button 
                      onClick={() => { if(file.mega_url) window.open(file.mega_url, "_blank"); }} 
                      className="w-full aspect-video bg-black/40 relative block overflow-hidden"
                    >
                      <img src={file.image_url} className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-700" alt=""/>
                    </button>

                    <div className="p-3 md:p-4 flex justify-between items-center font-black text-[9px] md:text-xs uppercase italic text-zinc-200">
                      <span className="truncate pr-2">{file.title}</span>
                      {isAdmin && (
                        <button onClick={() => deletefiles(file.id)} className="text-red-500 hover:scale-110"><Trash2 size={14}/></button>
                      )}
                    </div>
                  </div>
                ))}

              <button 
                onClick={() => { setTargetListId(list.id); setShowAddModal(true); }} 
                className="w-full aspect-video p-4 bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[2rem] text-[10px] font-black text-zinc-600 hover:text-blue-500 transition-all uppercase flex flex-col items-center justify-center gap-2"
              >
                <Plus size={20}/>
                Kart Ekle
              </button>
            </div>
          </div>
        ))}
      </div>

{/* ── AYARLAR ─────────────────────────────────────────────────────────── */}
      {showSettingsPanel && (
        <div className="fixed inset-0 z-[750] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-4xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-cyan-600/10 to-transparent">
              <h2 className="text-2xl font-black uppercase italic text-cyan-500 flex items-center gap-3"><Settings size={28}/> Ayarlar</h2>
              <button onClick={() => setShowSettingsPanel(false)} className="p-3 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 transition-all"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar-v">
              {/* Profil */}
              <div>
                <h3 className="text-sm font-black uppercase italic text-zinc-300 mb-4 flex items-center gap-2"><User size={16}/> Profil Düzenle</h3>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center overflow-hidden font-black text-2xl">
                      {userProfiles[currentUserName] ? <img src={userProfiles[currentUserName]} className="w-full h-full object-cover" alt=""/> : currentUserName[0]}
                    </div>
                    <div><p className="font-black uppercase italic text-sm">{currentUserName}</p><p className="text-[9px] text-zinc-500">Mevcut profil</p></div>
                  </div>
                  {showProfileEdit ? (
                    <div className="space-y-3">
                      <input type="text" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder={currentUserName} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-cyan-600"/>
                      <input type="file" accept="image/*" onChange={e => setNewProfileFile(e.target.files?.[0] || null)} className="w-full text-xs text-zinc-400"/>
                      {newProfileFile && (
                        <div className="flex items-center gap-2 p-2 bg-cyan-600/10 border border-cyan-600/20 rounded-xl">
                          <img src={URL.createObjectURL(newProfileFile)} alt="" className="w-10 h-10 object-cover rounded-lg"/>
                          <p className="text-[9px] font-bold text-cyan-400 truncate flex-1">{newProfileFile.name}</p>
                          <button type="button" onClick={() => setNewProfileFile(null)} className="text-zinc-500 hover:text-red-400"><X size={12}/></button>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button onClick={() => { setShowProfileEdit(false); setNewDisplayName(""); setNewProfileFile(null); }} className="flex-1 p-3 bg-white/5 rounded-xl text-[10px] font-black uppercase">İptal</button>
                        <button onClick={handleProfileUpdate} disabled={profileLoading} className="flex-1 p-3 bg-cyan-600 rounded-xl text-[10px] font-black uppercase disabled:opacity-50">{profileLoading ? "..." : "Kaydet"}</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowProfileEdit(true)} className="w-full p-3 bg-cyan-600/10 text-cyan-500 rounded-xl font-black uppercase text-[10px] border border-cyan-600/20 hover:bg-cyan-600/20 transition-all flex items-center justify-center gap-2">
                      <Camera size={14}/> Profili Düzenle
                    </button>
                  )}
                </div>
              </div>
              {/* Arka Plan */}
              <div>
                <h3 className="text-sm font-black uppercase italic text-zinc-300 mb-4 flex items-center gap-2"><Palette size={16}/> Arka Plan Türü</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['solid', 'gradient', 'image'] as const).map(type => (
                    <button key={type} onClick={() => saveBg({ ...backgroundSettings, type })}
                      className={`p-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${backgroundSettings.type === type ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}>
                      {type === 'solid' ? 'Düz Renk' : type === 'gradient' ? 'Gradient' : 'Resim/GIF'}
                    </button>
                  ))}
                </div>
              </div>
              {backgroundSettings.type === 'solid' && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase italic text-zinc-400 flex items-center gap-2"><Paintbrush size={14}/> Düz Renk</h4>
                  <div className="flex items-center gap-4">
                    <input type="color" value={backgroundSettings.solidColor} onChange={e => saveBg({ ...backgroundSettings, solidColor: e.target.value })} className="w-16 h-16 rounded-2xl border-2 border-white/10 cursor-pointer bg-transparent"/>
                    <input type="text" value={backgroundSettings.solidColor} onChange={e => saveBg({ ...backgroundSettings, solidColor: e.target.value })} className="flex-1 bg-black/40 border border-white/10 p-4 rounded-xl text-xs font-bold outline-none focus:border-cyan-600 uppercase"/>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['#050505','#0a0a0f','#0f172a','#1a1a2e','#16213e','#1f1f1f','#2d132c','#0f0f23'].map(c => (
                      <button key={c} onClick={() => saveBg({ ...backgroundSettings, solidColor: c })} className="w-10 h-10 rounded-xl border-2 border-white/10 hover:border-cyan-500 transition-all" style={{ backgroundColor: c }}/>
                    ))}
                  </div>
                </div>
              )}
              {backgroundSettings.type === 'gradient' && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase italic text-zinc-400 flex items-center gap-2"><Paintbrush size={14}/> Gradient</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ label: 'Başlangıç', key: 'gradientStart' as const }, { label: 'Bitiş', key: 'gradientEnd' as const }].map(({ label, key }) => (
                      <div key={key}>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block">{label}</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={backgroundSettings[key]} onChange={e => saveBg({ ...backgroundSettings, [key]: e.target.value })} className="w-12 h-12 rounded-xl border-2 border-white/10 cursor-pointer bg-transparent"/>
                          <input type="text" value={backgroundSettings[key]} onChange={e => saveBg({ ...backgroundSettings, [key]: e.target.value })} className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-cyan-600 uppercase"/>
                        </div>
                      </div>
                    ))}
                  </div>
                  <select value={backgroundSettings.gradientDirection} onChange={e => saveBg({ ...backgroundSettings, gradientDirection: e.target.value })} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-cyan-600 text-white">
                    <option value="to bottom">Yukarıdan Aşağı</option>
                    <option value="to top">Aşağıdan Yukarı</option>
                    <option value="to right">Soldan Sağa</option>
                    <option value="to left">Sağdan Sola</option>
                    <option value="to bottom right">Köşegen (Sağ Alt)</option>
                    <option value="to bottom left">Köşegen (Sol Alt)</option>
                  </select>
                  <div className="h-20 rounded-xl border border-white/10" style={{ background: `linear-gradient(${backgroundSettings.gradientDirection},${backgroundSettings.gradientStart},${backgroundSettings.gradientEnd})` }}/>
                </div>
              )}
              {backgroundSettings.type === 'image' && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase italic text-zinc-400 flex items-center gap-2"><ImageIcon size={14}/> Resim / GIF Yükle</h4>
                  <input ref={bgFileInputRef} type="file" accept="image/*,image/gif,.gif" className="hidden" onChange={handleBgFileUpload}/>
                  <button onClick={() => bgFileInputRef.current?.click()} disabled={bgUploading}
                    className="w-full p-6 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-3 hover:bg-cyan-600/5 hover:border-cyan-600/30 transition-all disabled:opacity-50">
                    {bgUploading ? <RefreshCw size={32} className="text-cyan-500 animate-spin"/> : <Upload size={32} className="text-cyan-500"/>}
                    <p className="text-xs font-black uppercase text-zinc-400">{bgUploading ? "Yükleniyor..." : "Dosya Seç"}</p>
                    <p className="text-[9px] text-zinc-600">PNG, JPG, GIF, WEBP • cover + fixed + center</p>
                  </button>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 flex items-center justify-between"><span className="flex items-center gap-1"><Eye size={12}/> Bulanıklık</span><span className="text-cyan-500">{backgroundSettings.blur}px</span></label>
                    <input type="range" min="0" max="30" value={backgroundSettings.blur} onChange={e => saveBg({ ...backgroundSettings, blur: parseInt(e.target.value) })} className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"/>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 flex items-center justify-between"><span>Koyuluk</span><span className="text-cyan-500">{backgroundSettings.opacity}%</span></label>
                    <input type="range" min="0" max="100" value={backgroundSettings.opacity} onChange={e => saveBg({ ...backgroundSettings, opacity: parseInt(e.target.value) })} className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"/>
                  </div>
                  {backgroundSettings.imageUrl && (
                    <div className="relative h-32 rounded-xl border border-white/10 overflow-hidden">
                      <div className="absolute inset-0" style={{ backgroundImage: `url(${backgroundSettings.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: backgroundSettings.blur > 0 ? `blur(${backgroundSettings.blur}px)` : 'none' }}/>
                      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${backgroundSettings.opacity / 100})` }}/>
                      <p className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase text-white/80 z-10">Önizleme</p>
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => saveBg({ type: 'solid', solidColor: '#050505', gradientStart: '#050505', gradientEnd: '#1a1a2e', gradientDirection: 'to bottom right', imageUrl: '', blur: 0, opacity: 50 })}
                className="w-full p-4 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-[10px] border border-red-600/20 hover:bg-red-600/20 transition-all">
                Varsayılana Sıfırla
              </button>
              {isAdmin && (
                <div className="border-t border-white/5 pt-6">
                  <h3 className="text-sm font-black uppercase italic text-orange-400 mb-4 flex items-center gap-2"><ShieldAlert size={16}/> Admin Paneli</h3>
                  <button onClick={() => { setShowSettingsPanel(false); setShowSystemLogs(true); }} className="w-full p-4 bg-orange-600/10 text-orange-500 rounded-2xl font-black uppercase text-[10px] border border-orange-600/20 hover:bg-orange-600/20 transition-all flex items-center justify-center gap-2">
                    <Activity size={16}/> Sistem Loglarını Gör
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
       {/* Sistem Logları Bölümü */}
       {showSystemLogs && isAdmin && (
         <div className="fixed inset-0 z-[950] bg-black/98 backdrop-blur-2xl flex flex-col overflow-hidden">
           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-orange-600/10 to-transparent">
             <h2 className="text-2xl font-black uppercase italic text-orange-500 flex items-center gap-3">
               <ShieldAlert size={28} /> Sistem Logları
             </h2>
             <button 
               onClick={() => setShowSystemLogs(false)} 
               className="p-3 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 transition-all"
             >
               <X size={24} />
             </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-v">
             <div className="max-w-6xl mx-auto">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                 {[
                   { val: logs.length, label: 'Toplam Log', color: 'text-blue-500' },
                   { val: getVisibleUsers().length, label: 'Kullanıcı', color: 'text-green-500' },
                   { val: files.length, label: 'Kart', color: 'text-purple-500' },
                   { val: categories.length, label: 'Liste', color: 'text-orange-500' }
                 ].map(({ val, label, color }) => (
                   <div key={label} className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-center">
                     <p className={`text-4xl font-black ${color}`}>{val}</p>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">{label}</p>
                   </div>
                 ))}
               </div>

               <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] overflow-hidden">
                 <div className="p-6 border-b border-white/5">
                   <h3 className="font-black uppercase italic text-sm">Tüm Tıklama Geçmişi</h3>
                 </div>
                 <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto custom-scrollbar-v">
                   {logs.map(log => (
                     <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-all">
                       <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 shrink-0 p-1">
                         <img src={log.image_url} className="w-full h-full object-contain" alt="" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="font-black italic uppercase text-sm truncate">{log.title}</p>
                         <div className="flex items-center gap-3 mt-1">
                           <span className="text-[9px] font-bold text-blue-400 bg-blue-600/20 px-2 py-0.5 rounded-full">
                             {log.user_name || 'Anonim'}
                           </span>
                           <span className="text-[9px] font-bold text-zinc-500">
                             {new Date(log.created_at).toLocaleString('tr-TR')}
                           </span>
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

       {/* ŞANSLI KART MODAL */}
      {randomFiles && (
        <div className="fixed inset-0 z-[800] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setRandomFiles(null)}>
          <div className="w-full max-w-xl bg-zinc-900 border border-blue-600/30 p-4 rounded-[3rem]" onClick={e => e.stopPropagation()}>
            <div className="aspect-video mb-6 rounded-[2rem] overflow-hidden bg-black/40 p-4"><img src={randomFiles.image_url} className="w-full h-full object-contain" alt="" /></div>
            <div className="text-center pb-6">
              <h2 className="text-3xl font-black italic uppercase mb-8">{randomFiles.title}</h2>
              <div className="flex gap-4 px-6">
                <button onClick={() => setRandomFiles(null)} className="flex-1 p-4 bg-white/5 rounded-2xl font-black text-xs uppercase">KAPAT</button>
                <button onClick={() => handlefilesClick(randomFiles)} className="flex-1 p-4 bg-blue-600 rounded-2xl font-black text-xs uppercase text-center">GİT</button>
              </div>
            </div>
          </div>
        </div>
      )}
  );
}
