"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    // Role-based redirect is handled by `/`.
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-sky-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white/90 shadow rounded p-5 flex flex-col gap-3"
      >
        <h1 className="text-xl font-semibold">Sign in</h1>

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
          />
        </label>

        {error ? <div className="text-red-600 text-sm">{error}</div> : null}

        <button
          className="bg-sky-700 text-white rounded px-3 py-2 disabled:opacity-50 hover:bg-sky-800"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="text-center text-sm text-zinc-600 mt-2">
          New here?{" "}
          <a className="text-sky-700 hover:underline" href="/signup">
            Create an account
          </a>
        </div>
      </form>
    </div>
  );
}

