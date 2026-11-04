import Link from "next/link";
import { DiceDoodle, FaceDoodle, TicketDoodle } from "@/components/doodles";
import { prisma } from "@/infrastructure/prisma";
import { formatRial } from "@/server/catalog";

export default async function AdminHomePage() {
  const [accounts, openSessions, bookings, hosts, tickets, ledger, pendingTicks, pendingRequests] = await Promise.all([
    prisma.account.count(),
    prisma.session.count({ where: { status: "open" } }),
    prisma.booking.count({ where: { status: { in: ["reserved", "checked_in"] } } }),
    prisma.host.count(),
    prisma.supportTicket.count(),
    prisma.ledgerEntry.findMany({ select: { type: true, amountRial: true } }),
    prisma.tickSubmission.count({ where: { status: "pending" } }),
    prisma.verificationRequest.count({ where: { status: "pending" } }),
  ]);
  const net = ledger.reduce((sum, entry) => sum + (entry.type === "refund" ? -entry.amountRial : entry.amountRial), 0);
  const cards = [
    { label: "حساب‌ها", value: String(accounts), tone: "bg-sky", Icon: FaceDoodle },
    { label: "رویداد باز", value: String(openSessions), tone: "bg-sun", Icon: DiceDoodle },
    { label: "صندلی فعال", value: String(bookings), tone: "bg-leaf", Icon: TicketDoodle },
    { label: "میزبان", value: String(hosts), tone: "bg-coral", Icon: FaceDoodle },
    { label: "تیکت", value: String(tickets), tone: "bg-card", Icon: TicketDoodle },
    { label: "خالص دریافتی", value: formatRial(net), tone: "bg-card", Icon: DiceDoodle },
  ];

  return (
    <main>
      <p className="mb-4 text-sm leading-7 text-muted">عددها از همین پایگاه داده می‌آیند. مدرسه همچنان اظهارشده و تأییدنشده است و اینجا ملاک دسترسی نیست.</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/ticks" className="rounded-[1.5rem] border-[3px] border-ink bg-sun p-4 font-display text-2xl shadow-[4px_4px_0_#1c2430]">
          تیک‌های در انتظار: {pendingTicks}
        </Link>
        <Link href="/admin/requests" className="rounded-[1.5rem] border-[3px] border-ink bg-leaf p-4 font-display text-2xl shadow-[4px_4px_0_#1c2430]">
          درخواست‌های در انتظار: {pendingRequests}
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.label} className={`rounded-[1.5rem] border-[3px] border-ink p-5 shadow-[4px_4px_0_#1c2430] ${card.tone}`}>
            <card.Icon className="h-10 w-10" />
            <p className="mt-3 text-sm font-semibold">{card.label}</p>
            <p className="mt-1 font-display text-3xl leading-tight">{card.value}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
