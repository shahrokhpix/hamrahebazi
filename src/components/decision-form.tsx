"use client";

import { useRef, type ReactNode } from "react";

export function DecisionForm({
  action,
  fields,
  children,
  approveLabel,
  rejectLabel,
  approveValue = "approved",
  rejectValue = "rejected",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: { name: string; value: string }[];
  children?: ReactNode;
  approveLabel: string;
  rejectLabel?: string;
  approveValue?: string;
  rejectValue?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function submit(decision: string) {
    const form = formRef.current;
    if (!form) return;
    const input = form.elements.namedItem("decision");
    if (input instanceof HTMLInputElement) input.value = decision;
    form.requestSubmit();
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {fields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <input type="hidden" name="decision" defaultValue={approveValue} />
      {children}
      <div className="relative z-20 flex flex-col gap-2 sm:flex-row">
        <button className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border-[3px] border-ink bg-leaf px-4 font-semibold" type="button" onClick={() => submit(approveValue)}>
          {approveLabel}
        </button>
        {rejectLabel ? (
          <button className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border-[3px] border-ink bg-coral px-4 font-semibold" type="button" onClick={() => submit(rejectValue)}>
            {rejectLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
