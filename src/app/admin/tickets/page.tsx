import { reviewSupportTicketAction } from "@/server/actions";
import { DecisionForm } from "@/components/decision-form";
import { prisma } from "@/infrastructure/prisma";
import { formatWhen } from "@/server/catalog";

export default async function AdminTicketsPage() {
  const tickets = await prisma.supportTicket.findMany({
    where: { status: "open" },
    include: { session: { include: { game: true } }, booking: { include: { playerProfile: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="space-y-4">
      <h2 className="font-display text-3xl">تیکت‌ها</h2>
      {tickets.length === 0 ? (
        <p className="rounded-[1.5rem] border-[3px] border-ink bg-card p-6 text-sm leading-7 shadow-[4px_4px_0_#1c2430]">تیکت بازی برای بستن نمانده است. پاسخ را بنویسید و ببندید یا رد کنید.</p>
      ) : (
        tickets.map((ticket) => (
          <article key={ticket.id} className="space-y-3 rounded-[1.5rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
            <h3 className="font-display text-2xl">{ticket.session.game.name}</h3>
            <p className="text-sm leading-7">{ticket.reason}</p>
            <p className="text-sm text-muted">
              {ticket.booking.playerProfile.displayName} · {formatWhen(ticket.createdAt)}
            </p>
            <DecisionForm action={reviewSupportTicketAction} fields={[{ name: "ticketId", value: ticket.id }]} approveLabel="بستن تیکت" rejectLabel="رد" approveValue="resolved">
              <label className="block space-y-2 text-sm font-medium">
                پاسخ
                <textarea name="reply" rows={3} maxLength={1000} className="w-full min-h-24 rounded-2xl border-[3px] border-ink bg-background px-4 py-3 text-base" />
              </label>
            </DecisionForm>
          </article>
        ))
      )}
    </main>
  );
}
