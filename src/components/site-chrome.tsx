"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DiceDoodle, FaceDoodle, HouseDoodle, MeepleDoodle, StarDoodle, TicketDoodle } from "@/components/doodles";

export function SiteHeader({
  account,
  brandName,
  logoPath,
  labels,
}: {
  account: { role: string; host: boolean; organizer: boolean } | null;
  brandName: string;
  logoPath: string;
  labels: {
    login: string;
    myGames: string;
    profile: string;
    home: string;
    games: string;
    cafes: string;
    how: string;
    host: string;
    organizer: string;
    admin: string;
  };
}) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: labels.home },
    { href: "/games", label: labels.games },
    { href: "/cafes", label: labels.cafes },
    { href: "/how", label: labels.how },
  ];
  return (
    <>
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-background/95">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 font-display text-xl text-foreground sm:text-2xl">
          {logoPath ? (
            <img src={logoPath} alt="" className="h-8 w-8 rounded-lg border-[3px] border-ink object-cover sm:h-9 sm:w-9" />
          ) : (
            <DiceDoodle className="h-8 w-8 sm:h-9 sm:w-9" />
          )}
          {brandName}
        </Link>
        <div className="flex gap-2">
          {account ? (
            <Link href="/shop" className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-coral px-4 text-sm font-semibold">
              فروشگاه
            </Link>
          ) : null}
          <div className="hidden gap-2 sm:flex">
            {account ? (
              <>
                <Link href="/me/games" className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-leaf px-4 text-sm font-semibold">
                  {labels.myGames}
                </Link>
                <Link href="/me/profile" className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-sun px-4 text-sm font-semibold">
                  {labels.profile}
                </Link>
              </>
            ) : (
              <Link href="/login" className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-sun px-4 text-sm font-semibold">
                {labels.login}
              </Link>
            )}
          </div>
        </div>
        <nav aria-label="ناوبری سایت" className="hidden w-full gap-2 overflow-x-auto md:flex">
          {[
            ...links,
            ...(account ? [{ href: "/shop", label: "فروشگاه" }] : []),
            ...(account?.host ? [{ href: "/host/slots", label: labels.host }] : []),
            ...(account?.organizer ? [{ href: "/organizer", label: labels.organizer }] : []),
            ...(account?.role === "admin" ? [{ href: "/admin", label: labels.admin }] : []),
          ].map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border-[3px] border-ink px-4 text-sm font-semibold ${active ? "bg-primary text-on-primary" : "bg-card text-foreground"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
    <MobileDock account={account} pathname={pathname} labels={labels} />
    </>
  );
}

function MobileDock({
  account,
  pathname,
  labels,
}: {
  account: { role: string; host: boolean; organizer: boolean } | null;
  pathname: string;
  labels: { home: string; games: string; cafes: string; myGames: string; profile: string; login: string };
}) {
  if (pathname.startsWith("/admin")) return null;
  const tabs = account
    ? [
        { href: "/", label: labels.home, icon: HouseDoodle, tone: "bg-sun" },
        { href: "/games", label: labels.games, icon: DiceDoodle, tone: "bg-sky" },
        { href: "/me/games", label: labels.myGames, icon: TicketDoodle, tone: "bg-leaf" },
        { href: "/me/profile", label: labels.profile, icon: FaceDoodle, tone: "bg-coral" },
      ]
    : [
        { href: "/", label: labels.home, icon: HouseDoodle, tone: "bg-sun" },
        { href: "/games", label: labels.games, icon: DiceDoodle, tone: "bg-sky" },
        { href: "/cafes", label: labels.cafes, icon: MeepleDoodle, tone: "bg-leaf" },
        { href: "/login", label: labels.login, icon: FaceDoodle, tone: "bg-sun" },
      ];
  return (
    <nav
      aria-label="ناوبری موبایل"
      className="fixed inset-x-3 z-40 rounded-[1.4rem] border-[3px] border-ink bg-card px-1 shadow-[4px_4px_0_#1c2430] md:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 text-center text-[11px] font-bold leading-tight ${active ? tab.tone : ""}`}
              >
                <Icon className="h-7 w-7" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SiteFooter({
  brandName,
  blurb,
  note,
  games,
  cafes,
  how,
  about,
  contact,
  blog,
  services,
  terms,
  enamadImage,
  enamadLink,
}: {
  brandName: string;
  blurb: string;
  note: string;
  games: string;
  cafes: string;
  how: string;
  about: string;
  contact: string;
  blog: string;
  services: string;
  terms: string;
  enamadImage: string;
  enamadLink: string;
}) {
  const play = [
    { href: "/games", label: games, tone: "bg-sun", icon: <DiceDoodle className="h-5 w-5" /> },
    { href: "/cafes", label: cafes, tone: "bg-leaf", icon: <HouseDoodle className="h-5 w-5" /> },
    { href: "/how", label: how, tone: "bg-sky", icon: <StarDoodle className="h-5 w-5" /> },
    { href: "/shop", label: "فروشگاه", tone: "bg-coral", icon: <TicketDoodle className="h-5 w-5" /> },
  ];
  const more = [
    { href: "/about", label: about, tone: "bg-card" },
    { href: "/services", label: services, tone: "bg-sun" },
    { href: "/blog", label: blog, tone: "bg-leaf" },
    { href: "/contact", label: contact, tone: "bg-sky" },
    { href: "/terms", label: terms, tone: "bg-coral" },
  ];
  return (
    <footer className="mt-auto mb-28 px-3 pb-3 md:mb-0 md:px-4 md:pb-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border-[3px] border-ink bg-card shadow-[6px_6px_0_#1c2430]">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
          <div className="flex items-start gap-3 bg-sun px-5 py-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.2rem] border-[3px] border-ink bg-card">
              <DiceDoodle className="h-10 w-10" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-4xl leading-none">{brandName}</p>
              <p className="mt-2 text-sm leading-7">{blurb}</p>
            </div>
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-5">
            <nav aria-label="پاورقی">
              <p className="mb-2 text-xs font-bold text-muted">بازی</p>
              <ul className="flex flex-wrap gap-2">
                {play.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[3px] border-ink px-4 text-sm font-semibold ${item.tone}`}>
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="صفحه‌های سایت">
              <p className="mb-2 text-xs font-bold text-muted">سایت</p>
              <ul className="flex flex-wrap gap-2">
                {more.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink px-4 text-sm font-semibold ${item.tone}`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 rounded-2xl border-[3px] border-ink bg-leaf px-3 py-2 text-sm leading-7">{note}</p>
              {enamadImage && enamadLink ? (
                <a href={enamadLink} target="_blank" rel="noopener noreferrer" className="inline-block rounded-2xl border-[3px] border-ink bg-card p-2">
                  <img src={enamadImage} alt="نماد اعتماد الکترونیکی" className="h-16 w-16 object-contain" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
