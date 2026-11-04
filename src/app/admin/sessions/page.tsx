import { prisma } from "@/infrastructure/prisma";
import { formatRial, formatWhen, statusLabel } from "@/server/catalog";

export default async function AdminSessionsPage() {
  const sessions = await prisma.session.findMany({
    include: { game: true, slot: { include: { table: { include: { host: true } } } } },
    orderBy: { slot: { startsAt: "asc" } },
  });
  return (
    <main className="overflow-x-auto rounded-[1.5rem] border-[3px] border-ink bg-card shadow-[4px_4px_0_#1c2430]">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="px-4 py-3 text-start font-display text-2xl">رویدادها</caption>
        <thead className="bg-sky/50 text-start">
          <tr>
            <th className="px-4 py-3 text-start">بازی</th>
            <th className="px-4 py-3 text-start">زمان</th>
            <th className="px-4 py-3 text-start">میزبان</th>
            <th className="px-4 py-3 text-start">صندلی</th>
            <th className="px-4 py-3 text-start">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-t border-ink/15">
              <td className="px-4 py-3 font-semibold">{session.game.name}</td>
              <td className="px-4 py-3">{formatWhen(session.slot.startsAt)}</td>
              <td className="px-4 py-3">{session.slot.table.host.displayName}</td>
              <td className="px-4 py-3">
                {session.reservedCount} از {session.maxPlayers} · {formatRial(session.priceRial)}
              </td>
              <td className="px-4 py-3">{statusLabel(session.status, session.maxPlayers - session.reservedCount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
