import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/forms";
import { currentAccount } from "@/server/auth";

export default async function OnboardingPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (account.profiles.length > 0) redirect("/");
  return (
    <main>
      <PageHeader title="پروفایل کاربر" subtitle="هر شماره موبایل یک کاربر است. نام کاربری را همین‌جا می‌گذارید." />
      <ProfileForm submitLabel="شروع" />
    </main>
  );
}
