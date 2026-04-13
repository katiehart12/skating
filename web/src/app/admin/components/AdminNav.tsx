"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/parent-kids", label: "Parent-Kids" },
  { href: "/admin/ice-locations", label: "Ice Locations" },
  { href: "/admin/class-templates", label: "Templates" },
  { href: "/admin/occurrences", label: "Occurrences" },
  { href: "/admin/ice-shows", label: "Ice Shows" },
];

export function AdminNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="mb-6 flex flex-wrap gap-2 text-sm">
      {LINKS.map((l) => {
        const active = pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              active
                ? "bg-sky-950 text-white rounded px-3 py-1.5"
                : "border border-sky-200 rounded px-3 py-1.5 hover:bg-sky-50 text-sky-950"
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

