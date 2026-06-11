import { useState } from "react";
import { useLocation } from "wouter";

const ADMIN_EMAIL = "abdullohmanopov24@gmail.com";
const ADMIN_PASSWORD = "manobov1122";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        localStorage.setItem("adminAuth", ADMIN_PASSWORD);
        setLocation("/admin");
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Noto'g'ri ma'lumotlar");
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a14] flex items-center justify-center px-4"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 60%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-xl shadow-purple-500/30 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Faqat administrator uchun</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                required
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Parol</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all text-sm"
              />
            </div>
            {error && (
              <div className="px-3.5 py-2.5 bg-red-950/40 border border-red-800/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Kirish..." : "Admin paneliga kirish"}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-600 mt-4">
          <a href="/" className="text-purple-500 hover:text-purple-400 underline">
            ← Asosiy sahifaga qaytish
          </a>
        </p>
      </div>
    </div>
  );
}
