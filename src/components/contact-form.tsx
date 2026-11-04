"use client";

import { useActionState } from "react";
import { Alert, buttonClass, fieldClass } from "@/components/ui";
import { sendContactAction, type FormState } from "@/server/actions";

const initial: FormState = {};

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-semibold" htmlFor="contact-name">
        نام
        <input id="contact-name" name="name" required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-semibold" htmlFor="contact-phone">
        شماره تماس
        <input id="contact-phone" name="phone" required inputMode="tel" dir="ltr" className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-semibold" htmlFor="contact-body">
        پیام
        <textarea id="contact-body" name="body" required rows={5} className={fieldClass} />
      </label>
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ارسال" : "فرستادن پیام"}
      </button>
    </form>
  );
}
