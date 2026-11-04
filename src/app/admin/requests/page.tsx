import { reviewVerificationAction } from "@/server/actions";
import { DecisionForm } from "@/components/decision-form";
import { prisma } from "@/infrastructure/prisma";

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const requests = await prisma.verificationRequest.findMany({
    where: { status: "pending" },
    include: { account: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <main className="space-y-4">
      {error ? <p className="rounded-2xl border-[3px] border-ink bg-coral px-4 py-3 text-sm">تصویر باید jpg، png، webp یا gif و حداکثر ۲ مگابایت باشد.</p> : null}
      {requests.length === 0 ? (
        <p className="rounded-[1.5rem] border-[3px] border-ink bg-card p-6 text-sm leading-7 shadow-[4px_4px_0_#1c2430]">درخواست تازه‌ای برای تأیید نمانده است. درخواست کافه یا بازی اینجا با پاسخ، تأیید یا رد بسته می‌شود.</p>
      ) : (
        requests.map((request) => (
          <article key={request.id} className="rounded-[1.5rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
            <h2 className="text-2xl">{request.kind === "host" ? "کافه" : "برگزارکننده"} · {request.displayName}</h2>
            <p className="mt-2 text-sm" dir="ltr">
              {request.account.phone}
            </p>
            {request.address ? <p className="mt-1 text-sm text-muted">{request.address}</p> : null}
            {request.latitude != null && request.longitude != null ? (
              <a className="mt-2 inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-primary" href={`https://www.openstreetmap.org/?mlat=${request.latitude}&mlon=${request.longitude}#map=16/${request.latitude}/${request.longitude}`} target="_blank" rel="noopener noreferrer">
                موقعیت روی نقشه
              </a>
            ) : null}
            {request.imagePath ? <img src={request.imagePath} alt="" className="mt-3 h-36 w-full rounded-2xl border-[3px] border-ink object-cover" /> : null}
            <DecisionForm action={reviewVerificationAction} fields={[{ name: "requestId", value: request.id }]} approveLabel="تأیید" rejectLabel="رد">
              <label className="block space-y-2 text-sm font-medium">
                تغییر تصویر
                <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="w-full min-h-12 rounded-2xl border-[3px] border-ink bg-background px-4 py-3 text-base" />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                پاسخ
                <textarea name="reply" rows={4} maxLength={1000} className="w-full min-h-24 rounded-2xl border-[3px] border-ink bg-background px-4 py-3 text-base" />
              </label>
            </DecisionForm>
          </article>
        ))
      )}
    </main>
  );
}
