"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DiceDoodle, FaceDoodle, HouseDoodle, StarDoodle, TicketDoodle } from "@/components/doodles";

const items = [
  { href: "/admin", label: "نمای کلی", icon: HouseDoodle },
  { href: "/admin/sessions", label: "رویدادها", icon: DiceDoodle },
  { href: "/admin/bookings", label: "رزروها", icon: TicketDoodle },
  { href: "/admin/accounts", label: "حساب‌ها", icon: FaceDoodle },
  { href: "/admin/hosts", label: "میزبان‌ها", icon: HouseDoodle },
  { href: "/admin/requests", label: "درخواست‌ها", icon: FaceDoodle },
  { href: "/admin/ticks", label: "تیک‌ها", icon: StarDoodle },
  { href: "/admin/shop", label: "فروشگاه", icon: TicketDoodle },
  { href: "/admin/cafes", label: "کافه تازه", icon: HouseDoodle },
  { href: "/admin/games", label: "بازی تازه", icon: DiceDoodle },
  { href: "/admin/content", label: "ظاهر سایت", icon: StarDoodle },
  { href: "/admin/blog", label: "بلاگ", icon: DiceDoodle },
  { href: "/admin/messages", label: "پیام‌ها", icon: FaceDoodle },
  { href: "/admin/integrations", label: "اتصال‌ها", icon: TicketDoodle },
  { href: "/admin/tickets", label: "تیکت‌ها", icon: TicketDoodle },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="ادمین" className="mb-6 overflow-x-auto">
      <ul className="flex min-w-max gap-2">
        {items.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[3px] border-ink px-4 text-sm font-semibold ${active ? "bg-primary text-on-primary" : "bg-card text-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
