import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";

const ADMIN_EMAIL = "abdullohmanopov24@gmail.com";
const ADMIN_PASSWORD = "manopov1122";
const H = { "x-admin-secret": ADMIN_PASSWORD, "Content-Type": "application/json" };

interface AdminStats {
  totalConversations: number;
  totalMessages: number;
  totalUsers: number;
  onlineUsers: number;
  recentConversations: Array<{
    id: number; title: string; userEmail: string | null;
    createdAt: string; messageCount: number;
  }>;
}

interface Ad {
  id: number; title: string; description: string | null;
  linkUrl: string | null; imageUrl: string | null;
  isActive: boolean; createdAt: string;
}

interface Announcement {
  id: number; title: string; content: string | null;
  linkUrl: string | null; linkLabel: string | null;
  isPinned: boolean; isActive: boolean; createdAt: string;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Hozir";
  if (min < 60) return `${min} daqiqa oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  return `${Math.floor(hr / 24)} kun oldin`;
}

type Tab = "stats" | "ads" | "posts";

/* ── Reusable toggle ─────────────────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-all flex-shrink-0 ${value ? "bg-purple-600" : "bg-white/10"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-4" : "left-0.5"}`} />
    </button>
  );
}

/* ── Field ─────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-purple-500/60 transition-all";
const textareaCls = `${inputCls} resize-none`;

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { user, isLoaded } = useUser();
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [posts, setPosts] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Ad form */
  const [showAdForm, setShowAdForm] = useState(false);
  const [adTitle, setAdTitle] = useState(""); const [adDesc, setAdDesc] = useState("");
  const [adLink, setAdLink] = useState(""); const [adImage, setAdImage] = useState("");
  const [adActive, setAdActive] = useState(true); const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState("");

  /* Post form */
  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState(""); const [postContent, setPostContent] = useState("");
  const [postLink, setPostLink] = useState(""); const [postLinkLabel, setPostLinkLabel] = useState("");
  const [postPinned, setPostPinned] = useState(false); const [postActive, setPostActive] = useState(true);
  const [postLoading, setPostLoading] = useState(false); const [postError, setPostError] = useState("");

  const isClerkAdmin = () =>
    isLoaded && !!user && (user.emailAddresses[0]?.emailAddress ?? "") === ADMIN_EMAIL;

  const isAuthed = () =>
    localStorage.getItem("adminAuth") === ADMIN_PASSWORD || isClerkAdmin();

  useEffect(() => {
    if (!isLoaded) return; // wait for Clerk to load
    // If signed in as admin via Clerk, auto-grant localStorage token
    if (isClerkAdmin()) {
      localStorage.setItem("adminAuth", ADMIN_PASSWORD);
    }
    if (!isAuthed()) { setLocation("/admin/login"); return; }
    fetchAll();
    // Poll stats every 30s for real-time online count
    if (!pollRef.current) {
      pollRef.current = setInterval(fetchStats, 30_000);
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [isLoaded, user]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", { headers: H });
      if (res.ok) setStats(await res.json() as AdminStats);
    } catch { /* silent */ }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, pRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: H }),
        fetch("/api/admin/ads", { headers: H }),
        fetch("/api/admin/announcements", { headers: H }),
      ]);
      if (sRes.ok) setStats(await sRes.json() as AdminStats);
      if (aRes.ok) setAds(await aRes.json() as Ad[]);
      if (pRes.ok) setPosts(await pRes.json() as Announcement[]);
    } catch { setError("Yuklab bo'lmadi"); }
    finally { setLoading(false); }
  };

  /* ── Ad actions ────────────────────────────────────────────── */
  const resetAdForm = () => { setAdTitle(""); setAdDesc(""); setAdLink(""); setAdImage(""); setAdActive(true); setAdError(""); setShowAdForm(false); };
  const submitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim()) { setAdError("Sarlavha majburiy"); return; }
    setAdLoading(true); setAdError("");
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST", headers: H,
        body: JSON.stringify({ title: adTitle, description: adDesc || null, linkUrl: adLink || null, imageUrl: adImage || null, isActive: adActive }),
      });
      if (res.ok) { const ad = await res.json() as Ad; setAds((p) => [ad, ...p]); resetAdForm(); }
      else { const d = await res.json() as { error?: string }; setAdError(d.error ?? "Xatolik"); }
    } catch { setAdError("Server xatosi"); } finally { setAdLoading(false); }
  };
  const toggleAd = async (ad: Ad) => {
    const res = await fetch(`/api/admin/ads/${ad.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ isActive: !ad.isActive }) });
    if (res.ok) { const u = await res.json() as Ad; setAds((p) => p.map((a) => a.id === ad.id ? u : a)); }
  };
  const deleteAd = async (id: number) => {
    if (!confirm("Reklamani o'chirasizmi?")) return;
    await fetch(`/api/admin/ads/${id}`, { method: "DELETE", headers: H });
    setAds((p) => p.filter((a) => a.id !== id));
  };

  /* ── Post actions ──────────────────────────────────────────── */
  const resetPostForm = () => { setPostTitle(""); setPostContent(""); setPostLink(""); setPostLinkLabel(""); setPostPinned(false); setPostActive(true); setPostError(""); setShowPostForm(false); };
  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) { setPostError("Sarlavha majburiy"); return; }
    setPostLoading(true); setPostError("");
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST", headers: H,
        body: JSON.stringify({ title: postTitle, content: postContent || null, linkUrl: postLink || null, linkLabel: postLinkLabel || null, isPinned: postPinned, isActive: postActive }),
      });
      if (res.ok) { const post = await res.json() as Announcement; setPosts((p) => [post, ...p]); resetPostForm(); }
      else { const d = await res.json() as { error?: string }; setPostError(d.error ?? "Xatolik"); }
    } catch { setPostError("Server xatosi"); } finally { setPostLoading(false); }
  };
  const togglePost = async (post: Announcement, field: "isActive" | "isPinned") => {
    const body = field === "isActive" ? { isActive: !post.isActive } : { isPinned: !post.isPinned };
    const res = await fetch(`/api/admin/announcements/${post.id}`, { method: "PATCH", headers: H, body: JSON.stringify(body) });
    if (res.ok) { const u = await res.json() as Announcement; setPosts((p) => p.map((a) => a.id === post.id ? u : a)); }
  };
  const deletePost = async (id: number) => {
    if (!confirm("Postni o'chirasizmi?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE", headers: H });
    setPosts((p) => p.filter((a) => a.id !== id));
  };

  const handleLogout = () => { localStorage.removeItem("adminAuth"); setLocation("/admin/login"); };

  if (loading) return (
    <div className="min-h-[100dvh] bg-[#0a0a14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-[100dvh] bg-[#0a0a14] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchAll} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm">Qayta</button>
      </div>
    </div>
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "📊 Statistika" },
    { id: "ads", label: "📢 Reklamalar" },
    { id: "posts", label: "📝 Postlar" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0a0a14] text-white"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 50%)" }}>

      {/* Header */}
      <div className="border-b border-white/8 bg-white/3 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">O'zbek AI — Admin Panel</h1>
              <p className="text-[11px] text-gray-500">abdullohmanopov24@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Live online indicator */}
            {stats && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="text-xs font-semibold text-emerald-400">{stats.onlineUsers} onlayn</span>
              </div>
            )}
            <button onClick={fetchAll} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all">🔄 Yangilash</button>
            <button onClick={() => setLocation("/")} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all">← Sayt</button>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/60 border border-red-800/30 text-red-400 text-xs transition-all">Chiqish</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${tab === t.id ? "border-purple-500 text-purple-400 bg-purple-500/8" : "border-transparent text-gray-600 hover:text-gray-400"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── STATS TAB ──────────────────────────────────────────── */}
        {tab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon="🟢" label="Hozir onlayn" value={stats?.onlineUsers ?? 0} sub="So'nggi 2 daqiqada" color="from-emerald-600/20 to-teal-600/10" border="border-emerald-500/25" live />
              <StatCard icon="👥" label="Foydalanuvchilar" value={stats?.totalUsers ?? 0} sub="Google orqali" color="from-blue-600/20 to-indigo-600/10" border="border-blue-500/20" />
              <StatCard icon="💬" label="Suhbatlar" value={stats?.totalConversations ?? 0} sub="Jami" color="from-purple-600/20 to-violet-600/10" border="border-purple-500/20" />
              <StatCard icon="📝" label="Xabarlar" value={stats?.totalMessages ?? 0} sub="Yuborilgan" color="from-amber-600/20 to-orange-600/10" border="border-amber-500/20" />
            </div>

            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">So'nggi faoliyat</h2>
                <span className="text-xs text-gray-600">{stats?.recentConversations.length ?? 0} ta oxirgi suhbat</span>
              </div>
              <div className="divide-y divide-white/5">
                {!stats?.recentConversations.length ? (
                  <div className="px-6 py-12 text-center text-gray-600 text-sm">Hali suhbat yo'q</div>
                ) : stats.recentConversations.map((conv) => (
                  <div key={conv.id} className="px-6 py-3.5 hover:bg-white/3 transition-colors flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-sm mt-0.5">
                        {conv.userEmail ? conv.userEmail[0].toUpperCase() : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{conv.userEmail ?? <span className="italic">Anonim</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-lg">{conv.messageCount} xabar</span>
                      <span className="text-xs text-gray-600 whitespace-nowrap">{timeAgo(conv.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ADS TAB ─────────────────────────────────────────────── */}
        {tab === "ads" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Reklamalar</h2>
                <p className="text-xs text-gray-500 mt-0.5">Sidebar'da ko'rinadigan banner reklamalar</p>
              </div>
              {!showAdForm && (
                <button onClick={() => setShowAdForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20">
                  + Yangi reklama
                </button>
              )}
            </div>

            {showAdForm && (
              <form onSubmit={submitAd} className="bg-white/4 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Yangi reklama</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Sarlavha *"><input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="Masalan: Premium chegirma!" className={inputCls} /></Field>
                  <Field label="Havola URL"><input value={adLink} onChange={(e) => setAdLink(e.target.value)} placeholder="https://t.me/..." className={inputCls} /></Field>
                </div>
                <Field label="Tavsif"><textarea value={adDesc} onChange={(e) => setAdDesc(e.target.value)} placeholder="Qisqa tavsif" rows={2} className={textareaCls} /></Field>
                <Field label="Rasm URL (ixtiyoriy)"><input value={adImage} onChange={(e) => setAdImage(e.target.value)} placeholder="https://example.com/image.jpg" className={inputCls} /></Field>
                <div className="flex items-center gap-2.5">
                  <Toggle value={adActive} onChange={setAdActive} />
                  <span className="text-sm text-gray-400">{adActive ? "Faol" : "Nofaol"}</span>
                </div>
                {adError && <p className="text-red-400 text-sm">{adError}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={adLoading} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">{adLoading ? "Saqlanmoqda..." : "Saqlash"}</button>
                  <button type="button" onClick={resetAdForm} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-sm rounded-xl transition-all">Bekor qilish</button>
                </div>
              </form>
            )}

            {ads.length === 0 ? (
              <EmptyState icon="📢" title="Hali reklama qo'shilmagan" sub="Yangi reklama tugmasini bosing" />
            ) : (
              <div className="space-y-3">
                {ads.map((ad) => (
                  <div key={ad.id} className={`bg-white/3 border rounded-2xl p-5 transition-all ${ad.isActive ? "border-purple-500/20" : "border-white/8 opacity-60"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {ad.imageUrl ? (
                          <img src={ad.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-lg">📢</div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-white truncate">{ad.title}</p>
                            <ActiveBadge active={ad.isActive} />
                          </div>
                          {ad.description && <p className="text-xs text-gray-500 truncate">{ad.description}</p>}
                          {ad.linkUrl && <p className="text-xs text-purple-400/70 truncate mt-0.5">{ad.linkUrl}</p>}
                          <p className="text-[10px] text-gray-700 mt-1">{timeAgo(ad.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ToggleBtn active={ad.isActive} onToggle={() => toggleAd(ad)} />
                        <DeleteBtn onDelete={() => deleteAd(ad.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── POSTS TAB ───────────────────────────────────────────── */}
        {tab === "posts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Postlar va E'lonlar</h2>
                <p className="text-xs text-gray-500 mt-0.5">Foydalanuvchilarga ko'rinadigan xabarlar</p>
              </div>
              {!showPostForm && (
                <button onClick={() => setShowPostForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20">
                  + Yangi post
                </button>
              )}
            </div>

            {showPostForm && (
              <form onSubmit={submitPost} className="bg-white/4 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Yangi post / e'lon</h3>
                <Field label="Sarlavha *"><input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Masalan: Yangi funksiya qo'shildi!" className={inputCls} /></Field>
                <Field label="Matn">
                  <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Post matni yoki batafsil ma'lumot..." rows={4} className={textareaCls} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Havola URL"><input value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder="https://t.me/..." className={inputCls} /></Field>
                  <Field label="Havola matni"><input value={postLinkLabel} onChange={(e) => setPostLinkLabel(e.target.value)} placeholder="Batafsil ko'rish" className={inputCls} /></Field>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2.5">
                    <Toggle value={postPinned} onChange={setPostPinned} />
                    <span className="text-sm text-gray-400">📌 Mahkamlangan</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Toggle value={postActive} onChange={setPostActive} />
                    <span className="text-sm text-gray-400">{postActive ? "Faol" : "Nofaol"}</span>
                  </div>
                </div>
                {postError && <p className="text-red-400 text-sm">{postError}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={postLoading} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">{postLoading ? "Saqlanmoqda..." : "Saqlash"}</button>
                  <button type="button" onClick={resetPostForm} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-sm rounded-xl transition-all">Bekor qilish</button>
                </div>
              </form>
            )}

            {posts.length === 0 ? (
              <EmptyState icon="📝" title="Hali post qo'shilmagan" sub="Yangi post tugmasini bosing" />
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className={`bg-white/3 border rounded-2xl p-5 transition-all ${post.isActive ? "border-purple-500/20" : "border-white/8 opacity-60"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {post.isPinned && <span className="text-xs text-amber-400">📌</span>}
                          <p className="text-sm font-bold text-white truncate">{post.title}</p>
                          <ActiveBadge active={post.isActive} />
                        </div>
                        {post.content && <p className="text-xs text-gray-400 line-clamp-2 mb-1">{post.content}</p>}
                        {post.linkUrl && (
                          <a href={post.linkUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                            🔗 {post.linkLabel ?? post.linkUrl}
                          </a>
                        )}
                        <p className="text-[10px] text-gray-700 mt-1">{timeAgo(post.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => togglePost(post, "isPinned")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${post.isPinned ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"}`}>
                          📌
                        </button>
                        <ToggleBtn active={post.isActive} onToggle={() => togglePost(post, "isActive")} />
                        <DeleteBtn onDelete={() => deletePost(post.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, border, live }: {
  icon: string; label: string; value: number; sub: string;
  color: string; border: string; live?: boolean;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">{icon}</span>
          {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </div>
        <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
      </div>
      <p className="text-sm font-semibold text-white/80">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-gray-600"}`}>
      {active ? "Faol" : "Nofaol"}
    </span>
  );
}

function ToggleBtn({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? "bg-white/5 border-white/10 text-gray-400 hover:text-white" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"}`}>
      {active ? "O'chirish" : "Yoqish"}
    </button>
  );
}

function DeleteBtn({ onDelete }: { onDelete: () => void }) {
  return (
    <button onClick={onDelete} className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/60 border border-red-800/30 text-red-400 text-xs transition-all">🗑</button>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl px-6 py-12 text-center">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-gray-700 text-xs mt-1">{sub}</p>
    </div>
  );
}
