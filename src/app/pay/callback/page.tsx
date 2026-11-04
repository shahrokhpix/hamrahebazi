import Link from "next/link";
import { verifyZarinpal } from "@/infrastructure/zarinpal";
import { prisma } from "@/infrastructure/prisma";
import { prismaStore } from "@/infrastructure/prismaStore";
import { settlePayment } from "@/application/useCases";

export default async function ZarinpalCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ Authority?: string; Status?: string }>;
}) {
  const { Authority = "", Status = "" } = await searchParams;
  const booking = Authority ? await prisma.booking.findUnique({ where: { gatewayAuthority: Authority } }) : null;
  let paid = false;
  if (booking && Status === "OK") {
    if (booking.status !== "pending_payment") {
      return (
        <main className="mx-auto max-w-xl px-4 py-10">
          <h1 className="text-4xl">این پرداخت قبلاً بسته شده</h1>
          <Link className="mt-6 inline-flex cursor-pointer text-primary" href="/me/games">
            بازی‌های من
          </Link>
        </main>
      );
    }
    paid = await verifyZarinpal(booking.amountRial, Authority).catch(() => false);
  }
    if (booking?.status === "pending_payment") {
    await settlePayment(prismaStore(), { bookingId: booking.id, now: new Date(), paid });
    if (paid) {
      const settled = await prisma.booking.findUnique({ where: { id: booking.id } });
      if (settled && settled.status !== "pending_payment") {
        const { awardReservationPoints } = await import("@/server/points");
        await awardReservationPoints(booking.id);
      }
    }
  }
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-4xl">{paid ? "پرداخت ثبت شد" : "پرداخت انجام نشد"}</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        {paid ? "صندلی در بازی‌های من دیده می‌شود." : "مبلغی کم نشد و صندلی رزرو نشد."}
      </p>
      <Link className="mt-6 inline-flex cursor-pointer font-semibold text-primary" href="/me/games">
        بازی‌های من
      </Link>
    </main>
  );
}
