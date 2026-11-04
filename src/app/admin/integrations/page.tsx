import { IntegrationForm } from "@/components/integration-form";
import { getIntegration, paymentsAreLive, smsIsLive } from "@/server/integrations";

export default async function AdminIntegrationsPage() {
  const [row, smsLive, payLive] = await Promise.all([getIntegration(), smsIsLive(), paymentsAreLive()]);
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm leading-7 text-muted">
        تا وقتی کلید کاوه‌نگار و مرچنت زرین‌پال خالی باشد، کد ورود روی همین دستگاه نشان داده می‌شود و پرداخت آزمایشی می‌ماند. کلیدها دوباره در صفحه نوشته نمی‌شوند.
      </p>
      <IntegrationForm
        smsLive={smsLive}
        payLive={payLive}
        sender={row.kavenegarSender}
        template={row.kavenegarTemplate}
        sandbox={row.zarinpalSandbox}
        enamadLink={row.enamadLink}
        enamadImage={row.enamadImage}
        contactPhone={row.contactPhone}
        contactEmail={row.contactEmail}
        contactAddress={row.contactAddress}
      />
    </div>
  );
}
