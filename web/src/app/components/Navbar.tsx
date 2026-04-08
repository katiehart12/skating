"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  PARENT: "Parent",
  KID: "Skater",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-indigo-100 text-indigo-800",
  INSTRUCTOR: "bg-sky-100 text-sky-800",
  PARENT: "bg-emerald-100 text-emerald-800",
  KID: "bg-amber-100 text-amber-800",
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;
  const name = (data?.user as any)?.name as string | undefined;
  const [mounted, setMounted] = useState(false);

  const isAuthed = status === "authenticated" && !!data?.user;

  useEffect(() => {
    setMounted(true);
  }, []);

  function getDashboardHref() {
    if (role === "ADMIN") return "/admin";
    if (role === "INSTRUCTOR") return "/instructor";
    if (role === "PARENT") return "/parent";
    if (role === "KID") return "/kid";
    return "/";
  }

  const dashboardHref = getDashboardHref();
  const isDashboard = pathname?.startsWith(dashboardHref) && dashboardHref !== "/";

  return (
    <header className="border-b border-sky-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="Frank Skating Ops home"
        >
          <span className="text-2xl leading-none select-none" aria-hidden>❄️</span>
          <div>
            <div className="font-semibold text-base sm:text-lg leading-tight text-sky-950 group-hover:text-sky-700 transition-colors">
              Frank Skating Ops
            </div>
            <div className="text-[10px] text-zinc-400 hidden sm:block leading-tight tracking-wide uppercase">
              Frank Southern Ice Arena
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {!mounted ? (
            <>
              <Link href="/login" className="text-sm text-sky-900/70 hover:text-sky-950 px-2 py-1">
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm rounded-lg bg-sky-600 text-white px-3 py-1.5 hover:bg-sky-700 shadow-sm"
              >
                Sign up
              </Link>
            </>
          ) : isAuthed ? (
            <>
              {/* Role badge */}
              {role && (
                <span className={`hidden sm:inline-flex badge text-xs ${ROLE_COLORS[role] ?? "bg-zinc-100 text-zinc-700"}`}>
                  {ROLE_LABELS[role] ?? role}
                  {name ? ` · ${name}` : ""}
                </span>
              )}

              {/* Dashboard link — highlighted when on that route */}
              <Link
                href={dashboardHref}
                className={`text-sm rounded-lg px-3 py-1.5 transition-colors shadow-sm ${
                  isDashboard
                    ? "bg-sky-950 text-white"
                    : "bg-sky-700 text-white hover:bg-sky-800"
                }`}
              >
                My Dashboard
              </Link>

              <button
                type="button"
                onClick={() => signOut({ redirect: false }).then(() => router.push("/"))}
                className="text-sm rounded-lg border border-sky-200 px-3 py-1.5 hover:bg-sky-50 text-sky-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm px-2 py-1 rounded transition-colors ${
                  pathname === "/login"
                    ? "text-sky-700 font-medium"
                    : "text-sky-900/70 hover:text-sky-950"
                }`}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className={`text-sm rounded-lg px-3 py-1.5 shadow-sm transition-colors ${
                  pathname === "/signup"
                    ? "bg-sky-800 text-white"
                    : "bg-sky-600 text-white hover:bg-sky-700"
                }`}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
