"use client";

import { useActionState } from "react";
import { Alert, buttonClass, fieldClass } from "@/components/ui";
import { saveSiteContentAction, type FormState } from "@/server/actions";
import type { SiteCopy } from "@/server/content";

const initial: FormState = {};

type Field = { key: keyof SiteCopy; label: string; section: string; rows?: number; max: number };

export function ContentForm({
  copy,
  fields,
  logoPath,
  heroImage,
  howImage,
}: {
  copy: SiteCopy;
  fields: Field[];
  logoPath: string;
  heroImage: string;
  howImage: string;
}) {
  const [state, action, pending] = useActionState(saveSiteContentAction, initial);
  const sections = [...new Set(fields.map((field) => field.section))];
  return (
    <form action={action} className="space-y-6">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      {sections.map((section) => (
        <fieldset key={section} className="space-y-4 rounded-[1.5rem] border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_#1c2430]">
          <legend className="px-2 font-display text-2xl">{section}</legend>
          {section === "برند" ? (
            <ImageField name="logo" label="لوگو" current={logoPath} clearName="clearLogo" clearLabel="برداشتن لوگو و برگشت به تاس" />
          ) : null}
          {section === "صفحهٔ اول" ? <ImageField name="hero" label="تصویر هیرو" current={heroImage} clearName="resetHero" clearLabel="برگشت به تصویر اصلی" /> : null}
          {section === "چطور بازی کنیم" ? <ImageField name="how" label="تصویر این صفحه" current={howImage} clearName="resetHow" clearLabel="برگشت به تصویر اصلی" /> : null}
          {fields
            .filter((field) => field.section === section)
            .map((field) => (
              <label key={field.key} className="block space-y-2 text-sm font-semibold" htmlFor={field.key}>
                {field.label}
                {field.rows ? (
                  <textarea id={field.key} name={field.key} rows={field.rows} required maxLength={field.max} defaultValue={copy[field.key]} className={fieldClass} />
                ) : (
                  <input id={field.key} name={field.key} required maxLength={field.max} defaultValue={copy[field.key]} className={fieldClass} />
                )}
              </label>
            ))}
          {section === "رزرو" ? (
            <p className="text-sm leading-7 text-muted">این جمله فقط روی صفحهٔ پرداخت دیده می‌شود. خودِ قانون لغو و برگشت پول در سیستم ثابت می‌ماند.</p>
          ) : null}
        </fieldset>
      ))}
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ذخیره" : "ذخیرهٔ ظاهر سایت"}
      </button>
    </form>
  );
}

function ImageField({
  name,
  label,
  current,
  clearName,
  clearLabel,
}: {
  name: string;
  label: string;
  current: string;
  clearName: string;
  clearLabel: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{label}</p>
      {current ? <img src={current} alt="" className="h-24 w-24 rounded-2xl border-[3px] border-ink object-cover" /> : <p className="text-sm text-muted">لوگویی ذخیره نشده.</p>}
      <input name={name} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="block w-full text-sm" />
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input name={clearName} type="checkbox" />
        {clearLabel}
      </label>
    </div>
  );
}
