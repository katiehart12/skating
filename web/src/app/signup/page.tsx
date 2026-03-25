"use client";

import { useState } from "react";
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

      // Create a session immediately so the user can access their dashboard.
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-sky-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white/90 shadow rounded p-5 flex flex-col gap-3"
      >
        <h1 className="text-xl font-semibold">Create your parent account</h1>
        <p className="text-sm text-zinc-600 -mt-1">
          You will be able to view schedules and end-card feedback.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            className="border rounded p-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            className="border rounded p-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Display name (optional)
          <input
            className="border rounded p-2"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g., Jamie"
          />
        </label>

        {error ? <div className="text-red-600 text-sm">{error}</div> : null}

        <button
          className="bg-sky-700 text-white rounded px-3 py-2 disabled:opacity-50 hover:bg-sky-800"
          disabled={loading}
          type="submit"
        >
          {loading ? "Creating..." : "Create account"}
        </button>

        <div className="text-center text-sm text-zinc-600 mt-2">
          Already have an account?{" "}
          <a className="text-sky-700 hover:underline" href="/login">
            Sign in
          </a>
        </div>
      </form>
    </div>
  );
}

