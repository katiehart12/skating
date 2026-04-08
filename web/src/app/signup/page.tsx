"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ? String(json.error) : "Failed to sign up.");
        return;
      }

      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/parent",
      });

      if (!signInRes?.ok) {
        setError("Account created, but automatic sign-in failed. Try logging in.");
        return;
      }

      router.push("/parent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-gradient-to-b from-sky-50 to-[--background]">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl" aria-hidden>❄️</span>
          <h1 className="mt-2 text-2xl font-semibold text-sky-950">Create your account</h1>
          <p className="text-sm text-zinc-500 mt-1">Parent accounts only — kids are added by admin</p>
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
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Your name{" "}
            <span className="font-normal text-zinc-400">(optional)</span>
            <input
              className="field"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jamie Smith"
              autoComplete="name"
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
            {loading ? "Creating account…" : "Create account"}
          </button>

          <div className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link className="text-sky-700 hover:underline font-medium" href="/login">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
