import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canAttemptOtp,
  canRequestOtp,
  normalizePhone,
  OTP_TTL_MS,
  OTP_WINDOW_MS,
} from "@/domain/decisions";
import { prisma } from "@/infrastructure/prisma";
import { deliverLoginCode } from "@/infrastructure/kavenegar";

const SESSION_DAYS = 30;

function hashOtp(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

function hashesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requestOtp(phoneRaw: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { ok: false, reason: "invalid_phone" };
  const since = new Date(Date.now() - OTP_WINDOW_MS);
  const recent = await prisma.otpChallenge.count({ where: { phone, createdAt: { gt: since } } });
  const allowed = canRequestOtp(recent);
  if (!allowed.ok) return allowed;
  const code = String(randomInt(0, 100_000)).padStart(5, "0");
  await prisma.otpChallenge.create({
    data: {
      phone,
      codeHash: hashOtp(phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  const jar = await cookies();
  jar.set("hb_phone", phone, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  try {
    const delivery = await deliverLoginCode(phone, code);
    if (delivery === "mock" && process.env.NODE_ENV !== "production") {
      jar.set("hb_dev_otp", code, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 120 });
    }
  } catch {
    return { ok: false, reason: "sms_failed" };
  }
  return { ok: true };
}

export async function verifyOtp(codeRaw: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const jar = await cookies();
  const phone = jar.get("hb_phone")?.value;
  if (!phone) return { ok: false, reason: "expired" };
  const code = codeRaw.replace(/\D/g, "");
  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return { ok: false, reason: "expired" };
  const decision = canAttemptOtp(challenge.attempts, challenge.expiresAt.getTime() < Date.now(), false);
  if (!decision.ok) return decision;
  if (!hashesMatch(challenge.codeHash, hashOtp(phone, code))) {
    const attempts = challenge.attempts + 1;
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts } });
    return { ok: false, reason: attempts >= 5 ? "blocked" : "bad_code" };
  }
  await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
  const account = await prisma.account.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });
  const token = randomBytes(32).toString("hex");
  await prisma.authSession.create({
    data: {
      token,
      accountId: account.id,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  jar.set("hb_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  jar.delete("hb_dev_otp");
  return { ok: true };
}

export async function currentAccount() {
  const token = (await cookies()).get("hb_session")?.value;
  if (!token) return null;
  const session = await prisma.authSession.findUnique({
    where: { token },
    include: {
      account: {
        include: { profiles: { orderBy: { displayName: "asc" } }, host: true, organizer: true },
      },
    },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.account;
}

export async function requireAdmin() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (account.role !== "admin") redirect("/");
  return account;
}

export async function logoutAccount(): Promise<void> {
  const jar = await cookies();
  const token = jar.get("hb_session")?.value;
  if (token) await prisma.authSession.deleteMany({ where: { token } });
  jar.delete("hb_session");
  jar.delete("hb_phone");
  jar.delete("hb_dev_otp");
}

export async function devOtpPreview(): Promise<string | null> {
  if (process.env.NODE_ENV === "production") return null;
  return (await cookies()).get("hb_dev_otp")?.value ?? null;
}
