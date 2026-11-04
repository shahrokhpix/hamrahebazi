import { grantRoleAction } from "@/server/actions";
import { tickLabel } from "@/server/catalog";
import { prisma } from "@/infrastructure/prisma";

export default async function AdminAccountsPage() {
  const accounts = await prisma.account.findMany({
    include: { profiles: true, host: true, organizer: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <main className="overflow-x-auto rounded-[1.5rem] border-[3px] border-ink bg-card shadow-[4px_4px_0_#1c2430]">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="px-4 py-3 text-start font-display text-2xl">حساب‌ها</caption>
        <thead className="bg-sun/70 text-start">
          <tr>
            <th className="px-4 py-3 text-start">موبایل سرپرست</th>
            <th className="px-4 py-3 text-start">نقش</th>
            <th className="px-4 py-3 text-start">پروفایل</th>
            <th className="px-4 py-3 text-start">مدرسه</th>
            <th className="px-4 py-3 text-start">تأیید</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id} className="border-t border-ink/15">
              <td className="px-4 py-3 font-semibold" dir="ltr">
                {account.phone}
              </td>
              <td className="px-4 py-3">{account.role === "admin" ? "ادمین" : account.organizer ? "برگزارکننده" : account.host ? "میزبان" : "بازیکن"}</td>
              <td className="px-4 py-3">
                {account.profiles[0] ? `${account.profiles[0].displayName} · ${tickLabel(account.profiles[0].tickStatus)}` : "—"}
              </td>
              <td className="px-4 py-3 text-muted">
                {account.profiles.some((profile) => profile.schoolName)
                  ? account.profiles
                      .filter((profile) => profile.schoolName)
                      .map((profile) => `${profile.schoolName}، اظهارشده و تأییدنشده`)
                      .join(" · ")
                  : "ثبت نشده"}
              </td>
              <td className="px-4 py-3">
                <form action={grantRoleAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="accountId" value={account.id} />
                  <button className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-leaf px-3 text-xs font-semibold" name="kind" value="host" type="submit">
                    میزبان
                  </button>
                  <button className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-sky px-3 text-xs font-semibold" name="kind" value="organizer" type="submit">
                    برگزارکننده
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
