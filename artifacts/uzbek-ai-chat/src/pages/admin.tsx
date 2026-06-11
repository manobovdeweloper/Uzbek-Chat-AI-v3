import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const ADMIN_PASSWORD = "manobov1122";
const H = { "x-admin-secret": ADMIN_PASSWORD, "Content-Type": "application/json" };

interface AdminStats {
  totalConversations: number;
  totalMessages: number;
  totalUsers: number;
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

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Hozir";
  if (min < 60) return `${min} daqiqa oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  return `${Math.floor(hr / 24)} kun oldin`;
}

type Tab = "stats" | "ads";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ad form state
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const isAuthed = () => localStorage.getItem("adminAuth") === ADMIN_PASSWORD;

  useEffect(() => {
    if (!isAuthed()) { setLocation("/admin/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, adsRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: H }),
        fetch("/api/admin/ads", { headers: H }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json() as AdminStats);
      if (adsRes.ok) setAds(await adsRes.json() as Ad[]);
    } catch {
      setError("Yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormTitle(""); setFormDesc(""); setFormLink("");
    setFormImage(""); setFormActive(true); setFormError(""); setShowForm(false);
  };

  const submitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) { setFormError("Sarlavha majburiy"); return; }
    setFormLoading(true); setFormError("");
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST", headers: H,
        body: JSON.stringify({ title: formTitle, description: formDesc || null, linkUrl: formLink || null, imageUrl: formImage || null, isActive: formActive }),
      });
      if (res.ok) {
        const ad = await res.json() as Ad;
        setAds((prev) => [ad, ...prev]);
        resetForm();
      } else {
        const d = await res.json() as { error?: string };
        setFormError(d.error ?? "Xatolik");
      }
    } catch { setFormError("Server xatosi"); }
    finally { setFormLoading(false); }
  };

  const toggleAd = async (ad: Ad) => {
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PATCH", headers: H,
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      if (res.ok) {
        const updated = await res.json() as Ad;
        setAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)));
      }
    } catch { /* ignore */ }
  };

  const deleteAd = async (id: number) => {
    if (!confirm("Reklamani o'chirasizmi?")) return;
    try {
      await fetch(`/api/admin/ads/${id}`, { method: "DELETE", headers: H });
      setAds((prev) => prev.filter((a) => a.id !== id));
    } catch { /* ignore */ }
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
            <button onClick={fetchAll} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all">🔄 Yangilash</button>
            <button onClick={() => setLocation("/")} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all">← Sayt</button>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/60 border border-red-800/30 text-red-400 text-xs transition-all">Chiqish</button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pb-0">
          {(["stats", "ads"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${tab === t ? "border-purple-500 text-purple-400 bg-purple-500/8" : "border-transparent text-gray-600 hover:text-gray-400"}`}>
              {t === "stats" ? "📊 Statistika" : "📢 Reklamalar"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* STATS TAB */}
        {tab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon="👥" label="Foydalanuvchilar" value={stats?.totalUsers ?? 0} sub="Google orqali kirganlar" color="from-blue-600/20 to-indigo-600/10" border="border-blue-500/20" />
              <StatCard icon="💬" label="Jami suhbatlar" value={stats?.totalConversations ?? 0} sub="Barcha foydalanuvchilar" color="from-purple-600/20 to-violet-600/10" border="border-purple-500/20" />
              <StatCard icon="📝" label="Jami xabarlar" value={stats?.totalMessages ?? 0} sub="Yuborilgan + AI javobi" color="from-emerald-600/20 to-teal-600/10" border="border-emerald-500/20" />
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

        {/* ADS TAB */}
        {tab === "ads" && (
          <div className="space-y-6">
            {/* Add new ad button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Reklamalar</h2>
                <p className="text-xs text-gray-500 mt-0.5">Chat saytida ko'rinadigan reklamalar</p>
              </div>
              {!showForm && (
                <button onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20">
                  + Yangi reklama
                </button>
              )}
            </div>

            {/* Ad creation form */}
            {showForm && (
              <form onSubmit={submitAd} className="bg-white/4 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white mb-4">Yangi reklama qo'shish</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Sarlavha *</label>
                    <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Masalan: Premium chegirma!"
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-purple-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Havola URL</label>
                    <input value={formLink} onChange={(e) => setFormLink(e.target.value)}
                      placeholder="https://t.me/..."
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-purple-500/60 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Tavsif</label>
                  <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Reklama matni yoki qisqa tavsif"
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-purple-500/60 transition-all resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Rasm URL (ixtiyoriy)</label>
                  <input value={formImage} onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-purple-500/60 transition-all" />
                </div>
                <div className="flex items-center gap-2.5">
                  <button type="button" onClick={() => setFormActive((v) => !v)}
                    className={`relative w-9 h-5 rounded-full transition-all ${formActive ? "bg-purple-600" : "bg-white/10"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${formActive ? "left-4" : "left-0.5"}`} />
                  </button>
                  <span className="text-sm text-gray-400">{formActive ? "Faol" : "Nofaol"}</span>
                </div>
                {formError && <p className="text-red-400 text-sm">{formError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={formLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
                    {formLoading ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                  <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-sm rounded-xl transition-all">
                    Bekor qilish
                  </button>
                </div>
              </form>
            )}

            {/* Ads list */}
            {ads.length === 0 ? (
              <div className="bg-white/3 border border-white/8 rounded-2xl px-6 py-12 text-center">
                <p className="text-4xl mb-3">📢</p>
                <p className="text-gray-500 text-sm">Hali reklama qo'shilmagan</p>
                <p className="text-gray-700 text-xs mt-1">Yangi reklama tugmasini bosing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ads.map((ad) => (
                  <div key={ad.id} className={`bg-white/3 border rounded-2xl p-5 transition-all ${ad.isActive ? "border-purple-500/20" : "border-white/8 opacity-60"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {ad.imageUrl ? (
                          <img src={ad.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-lg">
                            📢
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-white truncate">{ad.title}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ad.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-gray-600"}`}>
                              {ad.isActive ? "Faol" : "Nofaol"}
                            </span>
                          </div>
                          {ad.description && <p className="text-xs text-gray-500 truncate">{ad.description}</p>}
                          {ad.linkUrl && <p className="text-xs text-purple-400/70 truncate mt-0.5">{ad.linkUrl}</p>}
                          <p className="text-[10px] text-gray-700 mt-1">{timeAgo(ad.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => toggleAd(ad)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${ad.isActive ? "bg-white/5 border-white/10 text-gray-400 hover:text-white" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"}`}>
                          {ad.isActive ? "O'chirish" : "Yoqish"}
                        </button>
                        <button onClick={() => deleteAd(ad.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/60 border border-red-800/30 text-red-400 text-xs transition-all">
                          🗑
                        </button>
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

function StatCard({ icon, label, value, sub, color, border }: {
  icon: string; label: string; value: number; sub: string; color: string; border: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
      </div>
      <p className="text-sm font-semibold text-white/80">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}
