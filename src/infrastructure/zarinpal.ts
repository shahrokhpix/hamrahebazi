import { headers } from "next/headers";
import { getIntegration } from "@/server/integrations";

type ZarinpalResponse = {
  data?: { code?: number; authority?: string; ref_id?: number };
};

function gatewayHost(sandbox: boolean): string {
  return sandbox ? "https://sandbox.zarinpal.com" : "https://api.zarinpal.com";
}

export function zarinpalStartUrl(authority: string, sandbox: boolean): string {
  const host = sandbox ? "https://sandbox.zarinpal.com" : "https://www.zarinpal.com";
  return `${host}/pg/StartPay/${authority}`;
}

export async function appOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function requestZarinpal(amountRial: number, description: string): Promise<{ authority: string; sandbox: boolean }> {
  const row = await getIntegration();
  const merchant = row.zarinpalMerchantId.trim();
  if (!merchant) throw new Error("merchant");
  const callback = `${await appOrigin()}/pay/callback`;
  const response = await fetch(`${gatewayHost(row.zarinpalSandbox)}/pg/v4/payment/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      merchant_id: merchant,
      amount: amountRial,
      callback_url: callback,
      description,
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as ZarinpalResponse;
  const authority = payload.data?.authority;
  if (!response.ok || payload.data?.code !== 100 || !authority) throw new Error("request");
  return { authority, sandbox: row.zarinpalSandbox };
}

export async function verifyZarinpal(amountRial: number, authority: string): Promise<boolean> {
  const row = await getIntegration();
  const merchant = row.zarinpalMerchantId.trim();
  if (!merchant) return false;
  const response = await fetch(`${gatewayHost(row.zarinpalSandbox)}/pg/v4/payment/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ merchant_id: merchant, amount: amountRial, authority }),
    cache: "no-store",
  });
  const payload = (await response.json()) as ZarinpalResponse;
  return response.ok && (payload.data?.code === 100 || payload.data?.code === 101);
}
