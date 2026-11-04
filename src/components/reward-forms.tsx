"use client";

import { useActionState, useRef } from "react";
import { buyProductAction, rankPlayerAction, type FormState } from "@/server/actions";
import { Alert, buttonClass } from "@/components/ui";

const initial: FormState = {};

export function RankForm({ sessionId, toProfileId, name, game }: { sessionId: string; toProfileId: string; name: string; game: string }) {
  const [state, action, pending] = useActionState(rankPlayerAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  function rate(stars: number) {
    const form = formRef.current;
    if (!form) return;
    const input = form.elements.namedItem("stars");
    if (input instanceof HTMLInputElement) input.value = String(stars);
    form.requestSubmit();
  }

  return (
    <form ref={formRef} action={action} className="space-y-2 rounded-2xl border-[3px] border-ink bg-card p-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="toProfileId" value={toProfileId} />
      <input type="hidden" name="stars" defaultValue="5" />
      <p className="text-sm font-semibold">{name} · {game}</p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} className="inline-flex h-12 min-w-12 cursor-pointer items-center justify-center rounded-full border-[3px] border-ink bg-sun px-3 font-display text-lg" type="button" disabled={pending} onClick={() => rate(star)} aria-label={`${star} ستاره به ${name}`}>
            {star.toLocaleString("fa-IR")}
          </button>
        ))}
      </div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
    </form>
  );
}

export function BuyForm({ productId, label, disabled }: { productId: string; label: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(buyProductAction, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="productId" value={productId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <button className={buttonClass} type="submit" disabled={pending || disabled}>
        {pending ? "در حال خرید" : label}
      </button>
    </form>
  );
}
