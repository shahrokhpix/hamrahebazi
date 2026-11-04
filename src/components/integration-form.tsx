"use client";

import { useActionState } from "react";
import { Alert, buttonClass, fieldClass } from "@/components/ui";
import { saveIntegrationAction, type FormState } from "@/server/actions";

const initial: FormState = {};

export function IntegrationForm({
  smsLive,
  payLive,
  sender,
  template,
  sandbox,
  enamadLink,
  enamadImage,
  contactPhone,
  contactEmail,
  contactAddress,
}: {
  smsLive: boolean;
  payLive: boolean;
  sender: string;
  template: string;
  sandbox: boolean;
  enamadLink: string;
  enamadImage: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
}) {
  const [state, action, pending] = useActionState(saveIntegrationAction, initial);
  return (
    <form action={action} className="space-y-6">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <fieldset className="space-y-4 rounded-[1.5rem] border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_#1c2430]">
        <legend className="px-2 font-display text-2xl">کاوه‌نگار</legend>
        <p className="text-sm leading-7">{smsLive ? "کلید ذخیره شده و ارسال کد از کاوه‌نگار انجام می‌شود." : "کلید خالی است؛ کد ورود آزمایشی است و روی همین دستگاه نشان داده می‌شود."}</p>
        <label className="block space-y-2 text-sm font-semibold" htmlFor="kavenegarApiKey">
          کلید API
          <input id="kavenegarApiKey" name="kavenegarApiKey" type="password" autoComplete="off" placeholder={smsLive ? "برای تعویض، کلید تازه را بنویسید" : ""} className={fieldClass} />
        </label>
        <label className="block space-y-2 text-sm font-semibold" htmlFor="kavenegarSender">
          خط ارسال
          <input id="kavenegarSender" name="kavenegarSender" defaultValue={sender} dir="ltr" className={fieldClass} />
        </label>
        <label className="block space-y-2 text-sm font-semibold" htmlFor="kavenegarTemplate">
          نام الگوی تأیید
          <input id="kavenegarTemplate" name="kavenegarTemplate" defaultValue={template} dir="ltr" className={fieldClass} />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input name="clearKavenegar" type="checkbox" />
          پاک کردن کلید و برگشت به ارسال آزمایشی
        </label>
      </fieldset>
      <fieldset className="space-y-4 rounded-[1.5rem] border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_#1c2430]">
        <legend className="px-2 font-display text-2xl">زرین‌پال</legend>
        <p className="text-sm leading-7">{payLive ? "مرچنت ذخیره شده و پرداخت به زرین‌پال می‌رود." : "مرچنت خالی است؛ پرداخت آزمایشی است و دکمهٔ ناموفق هم هست."}</p>
        <label className="block space-y-2 text-sm font-semibold" htmlFor="zarinpalMerchantId">
          مرچنت
          <input id="zarinpalMerchantId" name="zarinpalMerchantId" type="password" autoComplete="off" placeholder={payLive ? "برای تعویض، مرچنت تازه را بنویسید" : ""} dir="ltr" className={fieldClass} />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input name="zarinpalSandbox" type="checkbox" defaultChecked={sandbox} />
          سندباکس زرین‌پال
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input name="clearZarinpal" type="checkbox" />
          پاک کردن مرچنت و برگشت به پرداخت آزمایشی
        </label>
      </fieldset>
      <fieldset className="space-y-4 rounded-[1.5rem] border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_#1c2430]">
        <legend className="px-2 font-display text-2xl">اینماد</legend>
        <p className="text-sm leading-7">عکس نشان و لینک https صفحهٔ اینماد را بگذار. اسکریپت خام اینماد در سایت گذاشته نمی‌شود.</p>
        {enamadImage ? <img src={enamadImage} alt="" className="h-20 w-20 rounded-2xl border-[3px] border-ink object-contain" /> : null}
        <label className="block space-y-2 text-sm font-semibold" htmlFor="enamad">
          عکس نشان
          <input id="enamad" name="enamad" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="block w-full text-sm" />
        </label>
        <label className="block space-y-2 text-sm font-semibold" htmlFor="enamadLink">
          لینک اینماد
          <input id="enamadLink" name="enamadLink" defaultValue={enamadLink} dir="ltr" placeholder="https://" className={fieldClass} />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input name="clearEnamad" type="checkbox" />
          برداشتن نشان از فوتر
        </label>
      </fieldset>
      <fieldset className="space-y-4 rounded-[1.5rem] border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_#1c2430]">
        <legend className="px-2 font-display text-2xl">راه‌های تماس</legend>
        <label className="block space-y-2 text-sm font-semibold" htmlFor="contactPhone">
          تلفن
          <input id="contactPhone" name="contactPhone" defaultValue={contactPhone} className={fieldClass} />
        </label>
        <label className="block space-y-2 text-sm font-semibold" htmlFor="contactEmail">
          ایمیل
          <input id="contactEmail" name="contactEmail" defaultValue={contactEmail} dir="ltr" className={fieldClass} />
        </label>
        <label className="block space-y-2 text-sm font-semibold" htmlFor="contactAddress">
          نشانی
          <textarea id="contactAddress" name="contactAddress" defaultValue={contactAddress} rows={2} className={fieldClass} />
        </label>
      </fieldset>
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ذخیره" : "ذخیرهٔ اتصال‌ها"}
      </button>
    </form>
  );
}
