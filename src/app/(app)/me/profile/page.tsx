import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckDoodle, DiceDoodle, FaceDoodle, HouseDoodle, MeepleDoodle, StarDoodle } from "@/components/doodles";
import { AvatarForm, ProfileForm, RequestRoleForm, TickForm } from "@/components/forms";
import { secondaryButtonClass } from "@/components/ui";
import { currentAccount } from "@/server/auth";
import { logoutAction } from "@/server/actions";
import { genderLabel, profileAge, tickLabel } from "@/server/catalog";
import { peerSummary, pointBalance, rankTitle } from "@/server/points";
import { prisma } from "@/infrastructure/prisma";

const cardTones = ["bg-coral/40", "bg-sky/50", "bg-leaf/50", "bg-sun"];

export default async function ProfilePage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  const requests = await prisma.verificationRequest.findMany({ where: { accountId: account.id } });
  const profile = account.profiles[0] ?? null;
  const summary = profile ? await peerSummary(account.id) : null;
  const balance = await pointBalance(account.id);
  const latestTick = profile
    ? await prisma.tickSubmission.findFirst({
        where: { profileId: profile.id, status: { in: ["pending", "approved", "rejected"] } },
        include: { files: true },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const requestLabel = (kind: string, status: string) =>
    `${kind === "host" ? "کافه" : "برگزارکننده"}: ${status === "pending" ? "در انتظار تأیید" : status === "approved" ? "تأیید شده" : "رد شده"}`;
  const shortcuts = [
    account.host ? { href: "/host/slots", label: "سانس‌های میزبان", tone: "bg-leaf", icon: HouseDoodle } : null,
    account.organizer ? { href: "/organizer", label: "پنل برگزارکننده", tone: "bg-sky", icon: DiceDoodle } : null,
    account.role === "admin" ? { href: "/admin", label: "پنل ادمین", tone: "bg-sun", icon: StarDoodle } : null,
  ].filter((item) => item !== null);

  return (
    <main className="mx-auto w-full max-w-xl space-y-6">
      <section className="overflow-hidden rounded-[2rem] border-[3px] border-ink bg-sun shadow-[6px_6px_0_#1c2430]">
        <div className="flex items-start gap-4 p-5">
          <div>
            <h1 className="font-display text-4xl leading-tight">پروفایل</h1>
            <p className="mt-2 max-w-md text-sm leading-7">هر شماره یک کاربر است. نام کاربری را خودتان می‌گذارید؛ بعد از تغییر، ادمین باید دوباره تأیید کند.</p>
          </div>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.2rem] border-[3px] border-ink bg-card">
            <FaceDoodle className="h-10 w-10" />
          </span>
        </div>
        <p className="mx-5 mb-5 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border-[3px] border-ink bg-card px-4 py-2 text-sm font-semibold">
          <span>شمارهٔ ورود</span>
          <span dir="ltr">{account.phone}</span>
        </p>
        <p className="mx-5 mb-5 text-sm font-semibold leading-7">
          {balance.toLocaleString("fa-IR")} امتیاز
          {summary ? ` · ${rankTitle(summary.average, summary.votes)}` : ""}
          {summary?.place ? ` · رتبهٔ ${summary.place.toLocaleString("fa-IR")} از رأی بازیکن‌ها` : ""}
          {" · "}
          <Link className="text-primary" href="/shop">فروشگاه</Link>
          {" · "}
          <Link className="text-primary" href="/me/games">ستاره به هم‌بازی‌ها</Link>
        </p>
      </section>

      {profile ? (
        <article className="overflow-hidden rounded-[1.75rem] border-[3px] border-ink bg-card shadow-[5px_5px_0_#1c2430]">
          <div className={`flex items-center gap-4 p-5 ${cardTones[0]}`}>
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-ink bg-card">
              {profile.avatarPath ? <img src={profile.avatarPath} alt="" className="h-full w-full object-cover" /> : <MeepleDoodle className="h-10 w-10" />}
            </span>
            <div className="min-w-0">
              <h2 className="flex flex-wrap items-center gap-2 font-display text-3xl leading-tight">
                {profile.displayName}
                {profile.tickStatus === "approved" ? <CheckDoodle className="h-8 w-8" /> : null}
              </h2>
              <p className="mt-2 inline-flex max-w-full rounded-full border-[3px] border-ink bg-card px-3 py-1 text-sm font-semibold" dir="ltr">
                {profile.publicId}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 p-4">
            <div className="rounded-2xl border-[3px] border-ink bg-sky/40 p-3">
              <dt className="text-xs font-semibold text-muted">سن</dt>
              <dd className="font-display text-2xl">{profileAge(profile.birthDate)} ساله</dd>
            </div>
            <div className="rounded-2xl border-[3px] border-ink bg-leaf/50 p-3">
              <dt className="text-xs font-semibold text-muted">جنسیت</dt>
              <dd className="font-display text-2xl">{genderLabel(profile.gender)}</dd>
            </div>
            <div className="col-span-2 rounded-2xl border-[3px] border-ink bg-background p-3">
              <dt className="text-xs font-semibold text-muted">مدرسه</dt>
              <dd className="mt-1 text-sm leading-7">
                {profile.schoolName ? `مدرسه اظهارشده، تأییدنشده: ${profile.schoolName}` : "مدرسه‌ای ثبت نشده است."}
              </dd>
            </div>
            <div className="col-span-2 rounded-2xl border-[3px] border-ink bg-sun/70 p-3">
              <dt className="text-xs font-semibold text-muted">تیک</dt>
              <dd className="font-display text-2xl">{tickLabel(profile.tickStatus)}</dd>
            </div>
          </dl>
        </article>
      ) : null}

      <section className="space-y-4 rounded-[1.75rem] border-[3px] border-ink bg-card p-5 shadow-[5px_5px_0_#1c2430]">
        <h2 className="font-display text-3xl">{profile ? "ویرایش پروفایل" : "ساخت پروفایل"}</h2>
        <ProfileForm
          key={profile ? `${profile.publicId}-${profile.displayName}-${profile.birthDate.toISOString()}-${profile.gender}-${profile.schoolName ?? ""}` : "new"}
          submitLabel={profile ? "ذخیره تغییرات" : "ساخت پروفایل"}
          profile={
            profile
              ? {
                  displayName: profile.displayName,
                  publicId: profile.publicId,
                  birthDate: profile.birthDate.toISOString().slice(0, 10),
                  gender: profile.gender,
                  schoolName: profile.schoolName ?? "",
                }
              : null
          }
        />
      </section>

      {profile ? (
        <section className="space-y-4 rounded-[1.75rem] border-[3px] border-ink bg-card p-5 shadow-[5px_5px_0_#1c2430]">
          <h2 className="font-display text-3xl">تصویر پروفایل</h2>
          <AvatarForm avatarPath={profile.avatarPath} />
        </section>
      ) : null}

      {profile ? (
        <section className="space-y-4 rounded-[1.75rem] border-[3px] border-ink bg-card p-5 shadow-[5px_5px_0_#1c2430]">
          <h2 className="font-display text-3xl">ارسال تیک</h2>
          <p className="text-sm leading-7 text-muted">اگر سند هویت دارید همین‌جا بفرستید. ویرایش پروفایل خودش هم برای ادمین درخواست تأیید می‌سازد.</p>
          {latestTick?.note ? <p className="whitespace-pre-wrap text-sm leading-7">{latestTick.note}</p> : null}
          {latestTick?.reply ? <p className="rounded-2xl border-[3px] border-ink bg-sun/60 p-3 text-sm leading-7">پاسخ ادمین: {latestTick.reply}</p> : null}
          {latestTick && latestTick.files.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {latestTick.files.map((file) => (
                <li key={file.id}>
                  <a className="cursor-pointer font-semibold text-primary" href={`/ticks/files/${file.id}`}>
                    {file.originalName}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {profile.tickStatus === "pending" ? <p className="text-sm font-semibold">این درخواست پیش ادمین است.</p> : <TickForm />}
        </section>
      ) : null}

      {shortcuts.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <li key={shortcut.href}>
                <Link
                  href={shortcut.href}
                  className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-[1.4rem] border-[3px] border-ink px-4 font-display text-2xl shadow-[4px_4px_0_#1c2430] ${shortcut.tone}`}
                >
                  <Icon className="h-8 w-8 shrink-0" />
                  {shortcut.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      <section className="space-y-4 rounded-[1.75rem] border-[3px] border-ink bg-card p-5 shadow-[5px_5px_0_#1c2430]">
        <h2 className="font-display text-3xl">کافه یا بازی تازه</h2>
        <p className="text-sm leading-7 text-muted">درخواست را ادمین می‌بیند. بعد از تأیید، ساختن کافه یا بازی برای همین حساب باز می‌شود.</p>
        {requests.length > 0 ? (
          <ul className="flex flex-wrap gap-2 text-sm">
            {requests.map((request) => (
              <li key={request.id} className="rounded-full border-[3px] border-ink bg-sky/40 px-4 py-2 font-semibold">
                {requestLabel(request.kind, request.status)} · {request.displayName}
                {request.reply ? ` · پاسخ: ${request.reply}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
        <RequestRoleForm />
      </section>

      <form action={logoutAction} className="[&>button]:w-full sm:w-fit">
        <button className={secondaryButtonClass} type="submit">
          خروج
        </button>
      </form>
    </main>
  );
}
