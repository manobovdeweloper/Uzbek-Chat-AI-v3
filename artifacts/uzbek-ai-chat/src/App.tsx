import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminLogin from "@/pages/admin-login";
import AdminPanel from "@/pages/admin";
import { PremiumProvider } from "@/contexts/premium-context";
import { useTheme } from "@/hooks/use-theme";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#7c3aed",
    colorForeground: "#f8f8ff",
    colorMutedForeground: "#9ca3af",
    colorDanger: "#ef4444",
    colorBackground: "#0f0f1a",
    colorInput: "#1a1a2e",
    colorInputForeground: "#f8f8ff",
    colorNeutral: "#374151",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0f0f1a] border border-white/10 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-black/60",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-gray-400",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-gray-300 text-sm",
    footerActionLink: "text-purple-400 hover:text-purple-300",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-600",
    identityPreviewEditButton: "text-purple-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-red-400",
    logoBox: "flex justify-center mb-2",
    logoImage: "w-12 h-12",
    socialButtonsBlockButton: "border border-white/10 bg-white/5 hover:bg-white/10 text-white",
    formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-white",
    formFieldInput: "bg-[#1a1a2e] border border-white/10 text-white",
    footerAction: "bg-transparent",
    dividerLine: "bg-white/10",
    alert: "bg-red-950/30 border-red-800/30",
    otpCodeFieldInput: "bg-[#1a1a2e] border-white/10 text-white",
    formFieldRow: "",
    main: "",
  },
};

function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#07070f]" />
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.25) 0%, transparent 70%)",
      }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)", filter: "blur(60px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, #4f46e5, transparent)", filter: "blur(60px)" }} />
      {[...Array(18)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-purple-500/20"
          style={{
            width: `${2 + (i % 4)}px`, height: `${2 + (i % 4)}px`,
            top: `${(i * 17 + 5) % 90}%`, left: `${(i * 23 + 7) % 90}%`,
            animation: `pulse ${2 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.4) % 3}s`,
          }} />
      ))}
      <div className="absolute inset-0 opacity-[0.015]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
    </div>
  );
}

const features = [
  { icon: "💬", text: "O'zbek tilida suhbat" },
  { icon: "🖼️", text: "AI rasm yaratish" },
  { icon: "⚡", text: "Tezkor javoblar" },
  { icon: "🔒", text: "Xavfsiz va shaxsiy" },
];

function SignInPage() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4 py-8">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)" }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">O'zbek AI</h1>
          <p className="text-gray-400 text-sm">Uzbekiston'ning aqlli yordamchisi</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {features.map((f) => (
              <span key={f.text} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-purple-300 border border-purple-500/25 bg-purple-500/8">
                <span>{f.icon}</span>{f.text}
              </span>
            ))}
          </div>
        </div>
        <div style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.6))" }}>
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        </div>
        <p className="text-center text-xs text-gray-600 mt-4">
          Admin?{" "}
          <a href={`${basePath}/admin/login`} className="text-purple-500 hover:text-purple-400 underline">
            Admin paneliga kirish
          </a>
        </p>
        <p className="text-center text-[11px] text-gray-700 mt-3">
          MANOBOV &amp; MRX tomonidan yaratilgan
        </p>
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4 py-8">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)" }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">O'zbek AI</h1>
          <p className="text-gray-400 text-sm">Hisob yarating — bepul!</p>
        </div>
        <div style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.6))" }}>
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        </div>
        <p className="text-center text-[11px] text-gray-700 mt-3">
          MANOBOV &amp; MRX tomonidan yaratilgan
        </p>
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HeartbeatPinger() {
  const { addListener } = useClerk();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = addListener(({ user }) => { userIdRef.current = user?.id ?? null; });
    return unsub;
  }, [addListener]);

  useEffect(() => {
    const ping = () => {
      const userId = userIdRef.current ?? `anon_${Math.random().toString(36).slice(2, 8)}`;
      fetch("/api/public/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    };
    ping();
    const timer = setInterval(ping, 30_000);
    return () => clearInterval(timer);
  }, []);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <AppShellInner />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function AppShellInner() {
  useTheme();
  return (
    <PremiumProvider>
      <TooltipProvider>
        <Home />
        <Toaster />
      </TooltipProvider>
    </PremiumProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Xush kelibsiz!",
            subtitle: "Hisobingizga kiring",
          },
        },
        signUp: {
          start: {
            title: "Hisob yarating",
            subtitle: "O'zbek AI'dan bepul foydalaning",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <HeartbeatPinger />
        <Router />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
