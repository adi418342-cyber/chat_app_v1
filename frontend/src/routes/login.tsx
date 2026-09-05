import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getSession, login } from "@/lib/chat-store";
import { BACKEND_URL } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Punishment Zone" },
      { name: "description", content: "Secret messages for 2 people." },
      { property: "og:title", content: "Sign in — Punishment Zone" },
      { property: "og:description", content: "You can be sorry a thousand times and still remain the same person" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverWarm, setServerWarm] = useState(false);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ping /api/health on mount so Render wakes up before the user clicks Login.
  // Free-tier cold starts can take 30-60 s; this hides that delay.
  useEffect(() => {
    async function pingUntilWarm() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          setServerWarm(true);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        }
      } catch {
        // still waking — next interval will retry
      }
    }
    pingUntilWarm();
    pingIntervalRef.current = setInterval(pingUntilWarm, 8000);
    return () => { if (pingIntervalRef.current) clearInterval(pingIntervalRef.current); };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    getSession().then((user) => {
      if (user) navigate({ to: "/chat" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate({ to: "/chat" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img
            src="/logo.jpg"
            alt="Punishment Zone logo"
            className="size-32 object-contain"
          />
          <h1 className="text-2xl font-semibold tracking-tight">Punishment Zone</h1>
          <p className="text-sm text-muted-foreground">You can be sorry a thousand times and still remain the same person.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {!serverWarm && (
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              ⏳ Waking up server… this takes ~30s on first load.
            </p>
          )}

          <button
            type="submit"
            id="login-submit"
            disabled={busy}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
