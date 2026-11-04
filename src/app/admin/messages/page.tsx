import { reviewMessageAction } from "@/server/actions";
import { DecisionForm } from "@/components/decision-form";
import { prisma } from "@/infrastructure/prisma";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({ where: { status: "open" }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl">پیام‌های تماس</h2>
      {messages.length === 0 ? (
        <p className="rounded-[1.5rem] border-[3px] border-ink bg-card p-6 text-sm leading-7">پیام بازی برای پاسخ نمانده است.</p>
      ) : (
        messages.map((message) => (
          <article key={message.id} className="space-y-3 rounded-[1.4rem] border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_#1c2430]">
            <p className="font-semibold">{message.name}</p>
            <p className="text-sm text-muted" dir="ltr">{message.phone}</p>
            <p className="whitespace-pre-wrap text-sm leading-7">{message.body}</p>
            <DecisionForm action={reviewMessageAction} fields={[{ name: "messageId", value: message.id }]} approveLabel="ذخیره پاسخ" rejectLabel="رد" approveValue="resolved">
              <label className="block space-y-2 text-sm font-medium">
                پاسخ
                <textarea name="reply" rows={3} maxLength={1000} className="w-full min-h-24 rounded-2xl border-[3px] border-ink bg-background px-4 py-3 text-base" />
              </label>
            </DecisionForm>
          </article>
        ))
      )}
    </div>
  );
}
