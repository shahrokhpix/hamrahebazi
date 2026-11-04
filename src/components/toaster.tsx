"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { reasonText } from "@/domain/messages";

type Tone = "ok" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };

const knownErrors: Record<string, string> = {
  image: "تصویر باید jpg، png، webp یا gif و حداکثر ۲ مگابایت باشد.",
  fields: "نام، توضیح، امتیاز و موجودی را کامل کنید.",
  orders: "این کالا سفارش دارد و حذف نمی‌شود. موجودی را صفر کنید.",
};

function toneFor(message: string, fallback: Tone): Tone {
  if (message.includes("انتظار") || message.includes("پیش ادمین")) return "info";
  return fallback;
}

export function pushToast(message: string, tone: Tone) {
  window.dispatchEvent(new CustomEvent("hb-toast", { detail: { message, tone: toneFor(message, tone) } }));
}

function ToastList() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef("");
  const params = useSearchParams();

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<{ message: string; tone: Tone }>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message: detail.message, tone: detail.tone }]);
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200);
    }
    window.addEventListener("hb-toast", onToast);
    return () => window.removeEventListener("hb-toast", onToast);
  }, []);

  useEffect(() => {
    const notice = params.get("notice") ?? "";
    const errorCode = params.get("error") ?? "";
    const error = knownErrors[errorCode] ?? reasonText[errorCode] ?? (errorCode.length > 12 ? errorCode : "");
    const message = error || notice;
    const key = `${message}:${error ? "error" : "ok"}`;
    if (!message || seen.current === key) return;
    seen.current = key;
    pushToast(message, error ? "error" : "ok");
    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    if (!knownErrors[errorCode] && !reasonText[errorCode]) url.searchParams.delete("error");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [params]);

  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-3">
      {toasts.map((toast) => (
        <p
          key={toast.id}
          role="status"
          className={`pointer-events-auto max-w-md rounded-2xl border-[3px] border-ink px-4 py-3 text-sm font-semibold shadow-[4px_4px_0_#1c2430] ${toast.tone === "error" ? "bg-coral" : toast.tone === "info" ? "bg-sun" : "bg-leaf"}`}
        >
          {toast.message}
        </p>
      ))}
    </div>
  );
}

export function Toaster() {
  return (
    <Suspense fallback={null}>
      <ToastList />
    </Suspense>
  );
}
