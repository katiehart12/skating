"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function getDashboardHref(userRole?: string) {
    if (userRole === "ADMIN") return "/admin";
    if (userRole === "INSTRUCTOR") return "/instructor";
    if (userRole === "PARENT") return "/parent";
    if (userRole === "KID") return "/kid";
    return "/";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);
    if (!res?.ok) {
      setError("Invalid email or password.");
      return;
    }

    const session = await getSession();
    const role = (session?.user as any)?.role as string | undefined;
    router.push(getDashboardHref(role));
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-gradient-to-b from-sky-50 to-[--background]">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl" aria-hidden>❄️</span>
          <h1 className="mt-2 text-2xl font-semibold text-sky-950">Sign in</h1>
          <p className="text-sm text-zinc-500 mt-1">Frank Southern Ice Arena</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="card card-accent p-6 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Email
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Password
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          ) : null}

          <button
            className="w-full bg-sky-700 text-white rounded-lg px-3 py-2.5 font-medium disabled:opacity-50 hover:bg-sky-800 shadow-sm mt-1"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="text-center text-sm text-zinc-500">
            New here?{" "}
            <Link className="text-sky-700 hover:underline font-medium" href="/signup">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
