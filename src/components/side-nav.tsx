"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/worlds", label: "Worlds" },
  { href: "/skills", label: "Skills" },
  { href: "/profile", label: "Character" },
  { href: "/play/explain-the-login", label: "Senior briefing" },
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
      {LINKS.map((link) => {
        const active = path === link.href || (link.href !== "/dashboard" && path.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
              active ? "bg-amber/15 text-amber" : "text-muted hover:bg-white/5 hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
