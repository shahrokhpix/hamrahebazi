"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DiceDoodle, FaceDoodle, HouseDoodle, TicketDoodle } from "@/components/doodles";
import { pushToast } from "@/components/toaster";

const items = [
  { href: "/", label: "خانه", icon: HouseDoodle, active: "bg-sun" },
  { href: "/me/games", label: "بازی‌های من", icon: DiceDoodle, active: "bg-leaf" },
  { href: "/me/transactions", label: "تراکنش‌ها", icon: TicketDoodle, active: "bg-sky" },
  { href: "/me/profile", label: "پروفایل", icon: FaceDoodle, active: "bg-coral" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="ناوبری اصلی" className="fixed inset-x-3 bottom-3 z-20 mx-auto max-w-6xl rounded-[1.6rem] border-[3px] border-ink bg-card px-2 shadow-[4px_4px_0_#1c2430]">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold text-foreground transition-colors duration-200 ${active ? item.active : ""}`}
              >
                <Icon className="h-7 w-7 text-foreground" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PageHeader({ title, subtitle, brand = "همراهِ بازی" }: { title: string; subtitle?: string; brand?: string }) {
  return (
    <header className="mb-6">
      <p className="font-display text-lg text-primary">{brand}</p>
      <h1 className="mt-1 text-4xl leading-tight text-foreground">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm leading-7 text-muted">{subtitle}</p> : null}
    </header>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "ok"; children: React.ReactNode }) {
  const message = typeof children === "string" ? children : "";
  useEffect(() => {
    if (message) pushToast(message, tone === "ok" ? "ok" : "error");
  }, [message, tone]);
  return (
    <p
      role="alert"
      className={`rounded-2xl border-[3px] border-ink px-4 py-3 text-sm ${tone === "ok" ? "bg-leaf/30 text-foreground" : "bg-coral/25 text-foreground"}`}
    >
      {children}
    </p>
  );
}

export const fieldClass =
  "w-full min-h-12 rounded-2xl border-[3px] border-ink bg-card px-4 text-base text-foreground outline-none transition-colors duration-200 focus:ring-4 focus:ring-sun/80";

export const buttonClass =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border-[3px] border-ink bg-sun px-6 font-display text-lg text-on-accent shadow-[4px_4px_0_#1c2430] transition-colors duration-200 hover:bg-[#ffd35c] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border-[3px] border-ink bg-card px-6 font-display text-lg text-foreground transition-colors duration-200 hover:bg-sky/30 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary";
