import { getIntegration } from "@/server/integrations";

export async function deliverLoginCode(phone: string, code: string): Promise<"mock" | "sent"> {
  const row = await getIntegration();
  const key = row.kavenegarApiKey.trim();
  if (!key) return "mock";
  const template = row.kavenegarTemplate.trim();
  const sender = row.kavenegarSender.trim();
  const base = `https://api.kavenegar.com/v1/${encodeURIComponent(key)}`;
  const params = new URLSearchParams({ receptor: phone });
  const path = template ? "/verify/lookup.json" : "/sms/send.json";
  if (template) {
    params.set("template", template);
    params.set("token", code);
  } else {
    params.set("message", `کد ورود همراهِ بازی: ${code}`);
    if (sender) params.set("sender", sender);
  }
  const response = await fetch(`${base}${path}`, { method: "POST", body: params, cache: "no-store" });
  if (!response.ok) throw new Error("sms");
  const payload = (await response.json()) as { return?: { status?: number } };
  if (payload.return?.status !== 200) throw new Error("sms");
  return "sent";
}
