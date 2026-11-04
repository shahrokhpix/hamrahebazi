import { prisma } from "@/infrastructure/prisma";
import { formatRial, statusLabel } from "@/server/catalog";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { playerProfile: true, session: { include: { game: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="overflow-x-auto rounded-[1.5rem] border-[3px] border-ink bg-card shadow-[4px_4px_0_#1c2430]">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="px-4 py-3 text-start font-display text-2xl">رزروها</caption>
        <thead className="bg-leaf/60 text-start">
          <tr>
            <th className="px-4 py-3 text-start">بازیکن</th>
            <th className="px-4 py-3 text-start">شناسه عمومی</th>
            <th className="px-4 py-3 text-start">بازی</th>
            <th className="px-4 py-3 text-start">مبلغ</th>
            <th className="px-4 py-3 text-start">وضعیت</th>
            <th className="px-4 py-3 text-start">کد حضور</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-t border-ink/15">
              <td className="px-4 py-3 font-semibold">{booking.playerProfile.displayName}</td>
              <td className="px-4 py-3" dir="ltr">
                {booking.playerProfile.publicId}
              </td>
              <td className="px-4 py-3">{booking.session.game.name}</td>
              <td className="px-4 py-3">{formatRial(booking.amountRial)}</td>
              <td className="px-4 py-3">{statusLabel(booking.status)}</td>
              <td className="px-4 py-3">{booking.attendanceCode ? "صادر شده" : "ندارد"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
