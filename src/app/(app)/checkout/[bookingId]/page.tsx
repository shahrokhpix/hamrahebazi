import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { PayForm } from "@/components/forms";
import { currentAccount } from "@/server/auth";
import { formatRial } from "@/server/catalog";
import { getSiteContent } from "@/server/content";
import { paymentsAreLive } from "@/server/integrations";
import { prisma } from "@/infrastructure/prisma";

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const [account, site, live] = await Promise.all([currentAccount(), getSiteContent(), paymentsAreLive()]);
  if (!account) redirect("/login");
  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { playerProfile: true, session: { include: { game: true } } },
  });
  if (!booking || booking.accountId !== account.id) notFound();
  if (booking.status !== "pending_payment") {
    return (
      <main>
        <PageHeader title="این پرداخت فعال نیست" />
        <Link className="cursor-pointer text-primary" href="/me/games">
          بازی‌های من
        </Link>
      </main>
    );
  }
  return (
    <main className="space-y-6">
      <PageHeader
        title="پرداخت صندلی"
        subtitle={`${booking.session.game.name} برای ${booking.playerProfile.displayName}`}
      />
      <p className="text-lg font-bold">{formatRial(booking.amountRial)}</p>
      <PayForm bookingId={booking.id} policy={site.copy.cancelPolicy} ack={site.copy.policyAck} live={live} />
    </main>
  );
}
