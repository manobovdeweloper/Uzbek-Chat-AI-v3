import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const ADMIN_PASSWORD = "manobov1122";

interface AdminStats {
  totalConversations: number;
  totalMessages: number;
  totalUsers: number;
  recentConversations: Array<{
    id: number;
    title: string;
    userEmail: string | null;
    createdAt: string;
    messageCount: number;
  }>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Hozir";
  if (min < 60) return `${min} daqiqa oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  return `${Math.floor(hr / 24)} kun oldin`;
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAuthed = () => localStorage.getItem("adminAuth") === ADMIN_PASSWORD;

  useEffect(() => {
    if (!isAuthed()) {
      setLocation("/admin/login");
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-secret": ADMIN_PASSWORD },
      });
      if (!res.ok) {
        setError("Ma'lumotlarni yuklashda xatolik");
        return;
      }
      const data = await res.json() as AdminStats;
      setStats(data);
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setLocation("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchStats} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm">Qayta urinish</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a0a14] text-white"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 50%)" }}>

      {/* Header */}
      <div className="border-b border-white/8 bg-white/3 backdrop-blur-sm">
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
          <div className="flex items-center gap-3">
            <button onClick={fetchStats} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all">
              🔄 Yangilash
            </button>
            <button onClick={() => setLocation("/")} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all">
              ← Saytga qaytish
            </button>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/60 border border-red-800/30 text-red-400 hover:text-red-300 text-xs transition-all">
              Chiqish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon="👥"
            label="Foydalanuvchilar"
            value={stats?.totalUsers ?? 0}
            sub="Google orqali kirganlar"
            color="from-blue-600/20 to-indigo-600/10"
            border="border-blue-500/20"
          />
          <StatCard
            icon="💬"
            label="Jami suhbatlar"
            value={stats?.totalConversations ?? 0}
            sub="Barcha foydalanuvchilar"
            color="from-purple-600/20 to-violet-600/10"
            border="border-purple-500/20"
          />
          <StatCard
            icon="📝"
            label="Jami xabarlar"
            value={stats?.totalMessages ?? 0}
            sub="Yuborilgan + AI javobi"
            color="from-emerald-600/20 to-teal-600/10"
            border="border-emerald-500/20"
          />
        </div>

        {/* Recent activity */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">So'nggi faoliyat</h2>
            <span className="text-xs text-gray-600">{stats?.recentConversations.length ?? 0} ta oxirgi suhbat</span>
          </div>
          <div className="divide-y divide-white/5">
            {!stats?.recentConversations.length ? (
              <div className="px-6 py-12 text-center text-gray-600 text-sm">Hali suhbat yo'q</div>
            ) : (
              stats.recentConversations.map((conv) => (
                <div key={conv.id} className="px-6 py-3.5 hover:bg-white/3 transition-colors flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-sm mt-0.5">
                      {conv.userEmail ? conv.userEmail[0].toUpperCase() : "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {conv.userEmail ?? <span className="text-gray-600 italic">Anonim foydalanuvchi</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-lg">
                      {conv.messageCount} xabar
                    </span>
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {timeAgo(conv.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
        <div className="text-right">
          <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
        </div>
      </div>
      <p className="text-sm font-semibold text-white/80">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}
