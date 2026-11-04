import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await currentAccount();
  if (!account) redirect("/login");
  return <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>;
}
