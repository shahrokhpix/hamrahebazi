"use client";

import { useActionState } from "react";
import { Alert, buttonClass, fieldClass } from "@/components/ui";
import { createArticleAction, type FormState } from "@/server/actions";

const initial: FormState = {};

export function ArticleForm() {
  const [state, action, pending] = useActionState(createArticleAction, initial);
  return (
    <form action={action} className="space-y-4 rounded-[1.5rem] border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_#1c2430]">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-semibold" htmlFor="article-title">
        عنوان
        <input id="article-title" name="title" required maxLength={80} className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-semibold" htmlFor="article-excerpt">
        خلاصه
        <textarea id="article-excerpt" name="excerpt" required rows={2} maxLength={180} className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-semibold" htmlFor="article-body">
        متن
        <textarea id="article-body" name="body" required rows={8} maxLength={8000} className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-semibold" htmlFor="article-image">
        عکس مقاله
        <input id="article-image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="block w-full text-sm" />
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
        <input name="published" type="checkbox" defaultChecked />
        منتشر شود
      </label>
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ذخیره" : "افزودن مقاله"}
      </button>
    </form>
  );
}
