"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ChartIcon, SettingsIcon } from "./Icons";

const items = [
  { href: "/", label: "Agenda", icon: CalendarIcon },
  { href: "/reportes", label: "Reportes", icon: ChartIcon },
  { href: "/configuracion", label: "Config", icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto grid max-w-md grid-cols-3 px-3 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/turnos")
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                active ? "text-brand" : "text-muted hover:text-bone"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
