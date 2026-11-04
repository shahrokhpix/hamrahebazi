import Image from "next/image";
import Link from "next/link";
import { artFor } from "@/components/game-card";
import { prisma } from "@/infrastructure/prisma";
import { getSiteContent } from "@/server/content";

export default async function CafesPage() {
  const [hosts, site] = await Promise.all([
    prisma.host.findMany({
      where: { status: "approved" },
      include: {
        tables: { include: { slots: { include: { sessions: { where: { status: "open" }, include: { game: true } } } } } },
      },
      orderBy: { displayName: "asc" },
    }),
    getSiteContent(),
  ]);
  const copy = site.copy;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <h1 className="text-4xl sm:text-5xl">{copy.cafesTitle}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{copy.cafesIntro}</p>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2">
        {hosts.map((host) => {
          const games = host.tables.flatMap((table) => table.slots.flatMap((slot) => slot.sessions.map((session) => session.game.name)));
          const cover = host.imagePath || artFor(games[0] ?? "");
          return (
            <li key={host.id} className="overflow-hidden rounded-[1.75rem] border-[3px] border-ink bg-card shadow-[5px_5px_0_#1c2430]">
              <Image src={cover} alt="" width={640} height={480} className="h-40 w-full object-cover sm:h-44" />
              <div className="space-y-2 p-4 sm:p-5">
                <h2 className="text-2xl sm:text-3xl">{host.displayName}</h2>
                <p className="text-sm leading-7 text-muted">{host.address}</p>
                {host.latitude != null && host.longitude != null ? (
                  <a className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-primary" href={`https://www.openstreetmap.org/?mlat=${host.latitude}&mlon=${host.longitude}#map=16/${host.latitude}/${host.longitude}`} target="_blank" rel="noopener noreferrer">
                    موقعیت روی نقشه
                  </a>
                ) : null}
                <p className="text-sm font-semibold">{host.tables.length} میز · {games.length} بازی باز</p>
                {games.length > 0 ? (
                  <Link href="/games" className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-primary">
                    دیدن بازی‌های باز
                  </Link>
                ) : (
                  <p className="text-sm text-muted">فعلاً رویداد بازی ندارد.</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
