"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const router = useRouter();
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const isAuthed = status === "authenticated" && !!data?.user;

  function goToDashboard() {
    if (!role) return router.push("/login");
    if (role === "ADMIN") return router.push("/admin");
    if (role === "INSTRUCTOR") return router.push("/instructor");
    if (role === "PARENT") return router.push("/parent");
    if (role === "KID") return router.push("/kid");
    return router.push("/login");
  }

  return (
    <header className="border-b border-sky-200 bg-sky-50/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-base sm:text-lg">
            Frank Skating Ops
          </Link>
          <span className="text-xs text-zinc-500 hidden sm:inline">
            Sports Management & Logistics MVP
          </span>
        </div>

        <nav className="flex items-center gap-3">
          {!isAuthed ? (
            <>
              <Link
                href="/login"
                className="text-sm text-sky-900/80 hover:text-sky-950"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm rounded bg-sky-600 text-white px-3 py-1.5 hover:bg-sky-700"
              >
                Sign up
              </Link>
            </>
          ) : null}

          {isAuthed ? (
            <>
              <button
                type="button"
                onClick={goToDashboard}
                className="text-sm rounded bg-sky-700 text-white px-3 py-1.5 hover:bg-sky-800"
              >
                My Dashboard
              </button>
              <button
                type="button"
                onClick={() => signOut({ redirect: false }).then(() => router.push("/"))}
                className="text-sm rounded border border-sky-200 px-3 py-1.5 hover:bg-sky-50"
              >
                Sign out
              </button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

