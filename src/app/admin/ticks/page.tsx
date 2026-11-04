import { reviewTickAction } from "@/server/actions";
import { DecisionForm } from "@/components/decision-form";
import { genderLabel, profileAge, tickLabel } from "@/server/catalog";
import { prisma } from "@/infrastructure/prisma";
import { readTickText } from "@/server/ticks";

export default async function AdminTicksPage() {
  const submissions = await prisma.tickSubmission.findMany({
    where: { status: "pending" },
    include: { files: true, profile: { include: { account: true } } },
    orderBy: { createdAt: "asc" },
  });
  const texts = await Promise.all(submissions.flatMap((submission) => submission.files.filter((file) => file.kind === "text").map(async (file) => [file.id, await readTickText(file.storedName)] as const)));
  const textById = new Map(texts);
  return (
    <main className="space-y-4">
      <h2 className="font-display text-3xl">تیک‌ها</h2>
      {submissions.length === 0 ? (
        <p className="rounded-[1.5rem] border-[3px] border-ink bg-card p-6 text-sm leading-7 shadow-[4px_4px_0_#1c2430]">درخواست تیکی برای تأیید نمانده است. ویرایش پروفایل و ارسال تیک اینجا می‌آید تا پاسخ بدهید و تأیید یا رد کنید.</p>
      ) : (
        submissions.map((submission) => (
          <article key={submission.id} className="space-y-4 rounded-[1.5rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
            <div>
              <h3 className="font-display text-2xl">{submission.profile.displayName}</h3>
              <p className="mt-1 text-sm font-semibold" dir="ltr">{submission.profile.publicId}</p>
              <p className="mt-1 text-sm" dir="ltr">
                {submission.profile.account.phone}
              </p>
              <p className="mt-1 text-sm">
                {profileAge(submission.profile.birthDate)} ساله · {genderLabel(submission.profile.gender)} · {tickLabel(submission.profile.tickStatus)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {submission.profile.schoolName ? `مدرسه اظهارشده، تأییدنشده: ${submission.profile.schoolName}` : "مدرسه‌ای ثبت نشده است."}
              </p>
              {submission.note ? <p className="mt-3 whitespace-pre-wrap rounded-2xl border-[3px] border-ink bg-background p-3 text-sm leading-7">{submission.note}</p> : null}
            </div>
            <ul className="space-y-3">
              {submission.files.map((file) => (
                <li key={file.id} className="rounded-2xl border-[3px] border-ink bg-background p-3">
                  <a className="cursor-pointer text-sm font-semibold text-primary" href={`/ticks/files/${file.id}`}>
                    {file.originalName}
                  </a>
                  {file.kind === "image" ? (
                    <img src={`/ticks/files/${file.id}`} alt="" className="mt-3 max-h-56 rounded-xl border-[3px] border-ink object-contain" />
                  ) : (
                    <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-7">{textById.get(file.id)}</pre>
                  )}
                </li>
              ))}
            </ul>
            <DecisionForm action={reviewTickAction} fields={[{ name: "submissionId", value: submission.id }]} approveLabel="تأیید تیک" rejectLabel="رد">
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
