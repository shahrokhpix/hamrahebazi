"use server";

import { randomBytes, randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  cancelReservedSeat,
  createHold,
  finishSession,
  issueCode,
  matchCode,
  recordMismatch,
  settlePayment,
} from "@/application/useCases";
import {
  isEligible,
  sessionBoundsValid,
  slotsOverlap,
  type Gender,
} from "@/domain/decisions";
import { reasonText } from "@/domain/messages";
import { prisma } from "@/infrastructure/prisma";
import { prismaStore } from "@/infrastructure/prismaStore";
import { requestZarinpal, zarinpalStartUrl } from "@/infrastructure/zarinpal";
import { getIntegration, paymentsAreLive } from "@/server/integrations";
import { saveSiteContent, saveUploadedImage, uploadedFile } from "@/server/content";
import { logoutAccount, requestOtp, verifyOtp } from "@/server/auth";
import { currentAccount } from "@/server/auth";
import { awardReservationPoints, reverseReservationPoints } from "@/server/points";

export type FormState = { error?: string; notice?: string };

function text(reason: string): string {
  return reasonText[reason] ?? "این کار انجام نشد.";
}

function finish(path: string, notice: string): never {
  redirect(`${path}?notice=${encodeURIComponent(notice)}`);
}

async function readImage(formData: FormData, field = "image"): Promise<{ path: string; error?: string }> {
  const file = uploadedFile(formData.get(field));
  if (!file) return { path: "" };
  try {
    return { path: await saveUploadedImage(file, field) };
  } catch (error) {
    return { path: "", error: error instanceof Error ? error.message : "تصویر پذیرفته نشد." };
  }
}

async function requireAccount() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  return account;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await requestOtp(String(formData.get("phone") ?? ""));
  if (!result.ok) return { error: text(result.reason) };
  redirect("/verify");
}

export async function verifyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await verifyOtp(String(formData.get("code") ?? ""));
  if (!result.ok) return { error: text(result.reason) };
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await logoutAccount();
  redirect("/login");
}

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "نام را کامل‌تر بنویسید.").max(40),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ تولد لازم است."),
  gender: z.enum(["female", "male"]),
  schoolName: z.string().trim().max(80).optional(),
});

const usernameSchema = z
  .string()
  .trim()
  .min(3, "نام کاربری حداقل ۳ حرف است.")
  .max(24, "نام کاربری حداکثر ۲۴ حرف است.")
  .regex(/^[\u0600-\u06FFa-zA-Z0-9_]+$/, "نام کاربری فقط حرف، عدد و زیرخط می‌پذیرد.");

function readCoordinates(formData: FormData): { latitude: number | null; longitude: number | null; error?: string } {
  const latText = String(formData.get("latitude") ?? "").trim();
  const lngText = String(formData.get("longitude") ?? "").trim();
  if (!latText && !lngText) return { latitude: null, longitude: null };
  const latitude = Number(latText);
  const longitude = Number(lngText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { latitude: null, longitude: null, error: "عرض و طول جغرافیایی معتبر نیست." };
  }
  return { latitude, longitude };
}

function parsedProfile(formData: FormData) {
  return profileSchema.safeParse({
    displayName: formData.get("displayName"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    schoolName: String(formData.get("schoolName") ?? ""),
  });
}

export async function createProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (account.profiles.length > 0) return { error: "هر شماره فقط یک پروفایل دارد." };
  const parsed = parsedProfile(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "اطلاعات پروفایل ناقص است." };
  const username = usernameSchema.safeParse(formData.get("publicId"));
  if (!username.success) return { error: username.error.issues[0]?.message ?? "نام کاربری معتبر نیست." };
  const taken = await prisma.playerProfile.findUnique({ where: { publicId: username.data } });
  if (taken) return { error: "این نام کاربری قبلاً گرفته شده." };
  const birth = new Date(`${parsed.data.birthDate}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime()) || birth.getTime() > Date.now()) {
    return { error: "تاریخ تولد معتبر نیست." };
  }
  await prisma.playerProfile.create({
    data: {
      accountId: account.id,
      displayName: parsed.data.displayName,
      publicId: username.data,
      birthDate: birth,
      gender: parsed.data.gender,
      schoolName: parsed.data.schoolName || null,
    },
  });
  revalidatePath("/");
  redirect("/");
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  const profile = account.profiles[0];
  if (!profile || account.profiles.length !== 1) return { error: "هر شماره فقط یک پروفایل دارد." };
  const parsed = parsedProfile(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "اطلاعات پروفایل ناقص است." };
  const birth = new Date(`${parsed.data.birthDate}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime()) || birth.getTime() > Date.now()) {
    return { error: "تاریخ تولد معتبر نیست." };
  }
  const schoolName = parsed.data.schoolName || null;
  const username = usernameSchema.safeParse(formData.get("publicId"));
  if (!username.success) return { error: username.error.issues[0]?.message ?? "نام کاربری معتبر نیست." };
  if (username.data !== profile.publicId) {
    const taken = await prisma.playerProfile.findUnique({ where: { publicId: username.data } });
    if (taken) return { error: "این نام کاربری قبلاً گرفته شده." };
  }
  const unchanged =
    profile.displayName === parsed.data.displayName &&
    profile.publicId === username.data &&
    profile.birthDate.toISOString().slice(0, 10) === parsed.data.birthDate &&
    profile.gender === parsed.data.gender &&
    (profile.schoolName ?? null) === schoolName;
  if (unchanged) return { notice: "تغییری در پروفایل نبود." };
  const changes = [
    profile.displayName === parsed.data.displayName ? "" : `نام: ${profile.displayName} → ${parsed.data.displayName}`,
    profile.publicId === username.data ? "" : `نام کاربری: ${profile.publicId} → ${username.data}`,
    profile.birthDate.toISOString().slice(0, 10) === parsed.data.birthDate ? "" : "تاریخ تولد تغییر کرد",
    profile.gender === parsed.data.gender ? "" : "جنسیت تغییر کرد",
    (profile.schoolName ?? null) === schoolName ? "" : "مدرسه تغییر کرد",
  ].filter(Boolean);
  const note = `ویرایش پروفایل برای تأیید دوباره\n${changes.join("\n")}`.slice(0, 2000);
  const pending = await prisma.tickSubmission.findFirst({ where: { profileId: profile.id, status: "pending" } });
  await prisma.$transaction(async (tx) => {
    if (pending) {
      await tx.tickSubmission.update({ where: { id: pending.id }, data: { note } });
    } else {
      await tx.tickSubmission.create({ data: { profileId: profile.id, status: "pending", note } });
    }
    await tx.playerProfile.update({
      where: { id: profile.id },
      data: {
        displayName: parsed.data.displayName,
        publicId: username.data,
        birthDate: birth,
        gender: parsed.data.gender,
        schoolName,
        tickStatus: "pending",
      },
    });
  });
  revalidatePath("/me/profile");
  revalidatePath("/admin/ticks");
  revalidatePath("/admin/accounts");
  return { notice: "پروفایل ذخیره شد و درخواست تأیید برای ادمین فرستاده شد." };
}

export async function submitTickAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  const profile = account.profiles[0];
  if (!profile) return { error: "اول پروفایل را بسازید." };
  const pending = await prisma.tickSubmission.findFirst({ where: { profileId: profile.id, status: "pending" } });
  if (pending) return { error: "درخواست قبلی هنوز پیش ادمین است." };
  const note = String(formData.get("note") ?? "").trim();
  if (note.length < 2) return { error: "متن را بنویسید." };
  if (note.length > 2000) return { error: "متن حداکثر ۲۰۰۰ حرف است." };
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  try {
    const stored = await storeTickFiles(files);
    await prisma.$transaction(async (tx) => {
      const submission = await tx.tickSubmission.create({ data: { profileId: profile.id, status: "pending", note } });
      if (stored.length > 0) {
        await tx.tickFile.createMany({
          data: stored.map((file) => ({ ...file, submissionId: submission.id })),
        });
      }
      await tx.playerProfile.update({ where: { id: profile.id }, data: { tickStatus: "pending" } });
    });
  } catch (error) {
    return { error: tickError(error instanceof Error ? error.message : "type") };
  }
  revalidatePath("/me/profile");
  revalidatePath("/admin/ticks");
  return { notice: "مدارک رسید. تا تأیید ادمین، تیک روی پروفایل نمی‌آید." };
}

export async function reserveAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  const sessionId = String(formData.get("sessionId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const profile = account.profiles.find((item) => item.id === profileId);
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { game: true, slot: true },
  });
  if (!profile || !session) return { error: text("missing") };
  const eligible = isEligible({
    birthDate: profile.birthDate,
    gender: profile.gender as Gender,
    at: session.slot.startsAt,
    ageMin: session.game.ageMin,
    ageMax: session.game.ageMax,
    genderConstraint: session.genderConstraint === "female" || session.genderConstraint === "male" ? session.genderConstraint : null,
  });
  const bookingId = `bk_${randomBytes(8).toString("hex")}`;
  const created = await createHold(prismaStore(), {
    bookingId,
    sessionId,
    profileId,
    accountId: account.id,
    eligible,
    now: new Date(),
  });
  if (!created.ok) {
    if (created.reason === "duplicate_profile") {
      const existing = await prisma.booking.findFirst({
        where: { activeKey: `${sessionId}:${profileId}`, status: "pending_payment" },
      });
      if (existing) redirect(`/checkout/${existing.id}`);
    }
    return { error: text(created.reason) };
  }
  redirect(`/checkout/${bookingId}`);
}

export async function payAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  const bookingId = String(formData.get("bookingId") ?? "");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.accountId !== account.id) return { error: text("missing") };
  if (formData.get("ack") !== "on") return { error: text("ack_required") };
  if (await paymentsAreLive()) {
    let start = "";
    try {
      const payment = await requestZarinpal(booking.amountRial, "رزرو صندلی همراهِ بازی");
      await prisma.booking.update({ where: { id: booking.id }, data: { gatewayAuthority: payment.authority } });
      start = zarinpalStartUrl(payment.authority, payment.sandbox);
    } catch {
      return { error: "اتصال به زرین‌پال برقرار نشد و مبلغی کم نشد." };
    }
    redirect(start);
  }
  const paid = await fakeCharge(formData.get("outcome") !== "fail", booking.amountRial, booking.id);
  const result = await settlePayment(prismaStore(), { bookingId, now: new Date(), paid });
  revalidatePath("/");
  revalidatePath("/me/games");
  revalidatePath("/me/transactions");
  if (!result.ok) return { error: text(result.reason) };
  await awardReservationPoints(bookingId);
  redirect("/me/games");
}

async function fakeCharge(succeed: boolean, _amountRial: number, _reference: string): Promise<boolean> {
  return succeed;
}

export async function cancelAction(formData: FormData): Promise<void> {
  const account = await requireAccount();
  const bookingId = String(formData.get("bookingId") ?? "");
  const result = await cancelReservedSeat(prismaStore(), { bookingId, accountId: account.id });
  if (result.ok) await reverseReservationPoints(bookingId);
  revalidatePath("/me/games");
  revalidatePath("/me/transactions");
  redirect(result.ok ? "/me/games" : `/me/games?error=${result.reason}`);
}

export async function arriveAction(formData: FormData): Promise<void> {
  const account = await requireAccount();
  const bookingId = String(formData.get("bookingId") ?? "");
  const code = String(randomInt(0, 10_000)).padStart(4, "0");
  const result = await issueCode(prismaStore(), { bookingId, accountId: account.id, now: new Date(), code });
  revalidatePath("/me/games");
  redirect(result.ok ? "/me/games" : `/me/games?error=${result.reason}`);
}

export async function checkInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (!account.organizer) return { error: text("forbidden") };
  const sessionId = String(formData.get("sessionId") ?? "");
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.organizerId !== account.organizer.id) return { error: text("forbidden") };
  const result = await matchCode(prismaStore(), {
    sessionId,
    code: String(formData.get("code") ?? "").trim(),
  });
  revalidatePath("/organizer");
  revalidatePath("/me/games");
  if (!result.ok) return { error: text(result.reason) };
  return { notice: "حضور ثبت شد." };
}

export async function mismatchAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (!account.organizer) return { error: text("forbidden") };
  const result = await recordMismatch(prismaStore(), {
    bookingId: String(formData.get("bookingId") ?? ""),
    organizerAccountId: account.id,
    reason: String(formData.get("reason") ?? "").trim() || "عدم تطابق اطلاعات حضور",
  });
  revalidatePath("/organizer");
  if (!result.ok) return { error: text(result.reason) };
  return { notice: "تیکت ثبت شد. رویداد لغو نشد." };
}

export async function endAction(formData: FormData): Promise<void> {
  const account = await requireAccount();
  if (!account.organizer) redirect("/organizer");
  const sessionId = String(formData.get("sessionId") ?? "");
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (session && session.organizerId === account.organizer.id) {
    await finishSession(prismaStore(), sessionId);
  }
  revalidatePath("/organizer");
  redirect("/organizer");
}

const slotSchema = z.object({
  tableId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
});

export async function createSlotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (!account.host || account.host.status !== "approved") return { error: text("forbidden") };
  const parsed = slotSchema.safeParse({
    tableId: formData.get("tableId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) return { error: "بازه سانس را کامل کنید." };
  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || endsAt <= startsAt) return { error: "پایان سانس باید بعد از شروع باشد." };
  const table = await prisma.table.findFirst({
    where: { id: parsed.data.tableId, hostId: account.host.id },
    include: { slots: true },
  });
  if (!table) return { error: text("missing") };
  if (table.slots.some((slot) => slotsOverlap(startsAt, endsAt, slot.startsAt, slot.endsAt))) {
    return { error: text("overlap") };
  }
  await prisma.slot.create({ data: { tableId: table.id, startsAt, endsAt } });
  revalidatePath("/host/slots");
  return { notice: "سانس آزاد ثبت شد." };
}

export async function publishAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (!account.organizer) return { error: text("forbidden") };
  const slotId = String(formData.get("slotId") ?? "");
  const gameId = String(formData.get("gameId") ?? "");
  const minPlayers = Number(formData.get("minPlayers"));
  const maxPlayers = Number(formData.get("maxPlayers"));
  const priceRial = Number(formData.get("priceRial"));
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { table: true, sessions: true },
  });
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!slot || !game || slot.currentSessionId) return { error: text("missing") };
  const bounds = sessionBoundsValid({
    minPlayers,
    maxPlayers,
    gameMin: game.minPlayers,
    gameMax: game.maxPlayers,
    tableCapacity: slot.table.capacity,
  });
  if (!bounds.ok) return { error: text(bounds.reason) };
  if (!Number.isFinite(priceRial) || priceRial < 0) return { error: "هزینه معتبر نیست." };
  const sessionId = `ss_${randomBytes(6).toString("hex")}`;
  try {
    await prisma.$transaction(async (tx) => {
      const held = await tx.slot.updateMany({
        where: { id: slot.id, currentSessionId: null },
        data: { currentSessionId: sessionId },
      });
      if (held.count !== 1) throw new Error("taken");
      await tx.session.create({
        data: {
          id: sessionId,
          gameId: game.id,
          slotId: slot.id,
          organizerId: account.organizer!.id,
          kind: "official",
          minPlayers,
          maxPlayers,
          priceRial,
          status: "open",
        },
      });
    });
  } catch {
    return { error: "این سانس همین حالا گرفته شده است." };
  }
  revalidatePath("/");
  revalidatePath("/organizer");
  return { notice: "کارت رویداد منتشر شد." };
}

export async function setHostStatusAction(formData: FormData): Promise<void> {
  const account = await currentAccount();
  if (!account || account.role !== "admin") redirect("/");
  const hostId = String(formData.get("hostId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "approved" && status !== "suspended") return;
  await prisma.host.update({ where: { id: hostId }, data: { status } });
  revalidatePath("/admin/hosts");
  revalidatePath("/host/slots");
  revalidatePath("/cafes");
}

async function requireAdminAccount() {
  const account = await currentAccount();
  if (!account || account.role !== "admin") redirect("/");
  return account;
}

export async function requestVerificationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  const kind = String(formData.get("kind") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (kind !== "host" && kind !== "organizer") return { error: "نوع درخواست روشن نیست." };
  if (displayName.length < 2) return { error: "نام را کامل بنویسید." };
  if (kind === "host" && address.length < 5) return { error: "آدرس کافه را کامل بنویسید." };
  const place = readCoordinates(formData);
  if (place.error) return { error: place.error };
  if (kind === "host" && (place.latitude === null || place.longitude === null)) return { error: "موقعیت کافه را روی نقشه مشخص کنید." };
  const image = await readImage(formData);
  if (image.error) return { error: image.error };
  if (kind === "host" && account.host?.status === "approved") return { error: "این حساب از قبل میزبان تأییدشده است." };
  if (kind === "organizer" && account.organizer) return { error: "این حساب از قبل برگزارکننده است." };
  await prisma.verificationRequest.upsert({
    where: { accountId_kind: { accountId: account.id, kind } },
    update: {
      status: "pending",
      displayName,
      address,
      latitude: place.latitude,
      longitude: place.longitude,
      reply: "",
      ...(image.path ? { imagePath: image.path } : {}),
    },
    create: {
      accountId: account.id,
      kind,
      status: "pending",
      displayName,
      address,
      latitude: place.latitude,
      longitude: place.longitude,
      imagePath: image.path,
    },
  });
  revalidatePath("/me/profile");
  revalidatePath("/admin/requests");
  return { notice: "درخواست ثبت شد. بعد از تأیید ادمین، ساختن کافه یا بازی باز می‌شود." };
}

export async function reviewVerificationAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected") {
    redirect(`/admin/requests?error=${encodeURIComponent("دکمهٔ تأیید یا رد به سرور نرسید. دوباره بزنید.")}`);
  }
  const reply = String(formData.get("reply") ?? "").trim().slice(0, 1000);
  const request = await prisma.verificationRequest.findUnique({ where: { id: requestId }, include: { account: true } });
  if (!request || request.status !== "pending") finish("/admin/requests", "این درخواست دیگر باز نیست.");
  const image = await readImage(formData);
  if (image.error) redirect("/admin/requests?error=image");
  const imagePath = image.path || request.imagePath;
  if (decision === "approved" && request.kind === "host") {
    await prisma.host.upsert({
      where: { accountId: request.accountId },
      update: { status: "approved", displayName: request.displayName, address: request.address, latitude: request.latitude, longitude: request.longitude, imagePath, pendingImagePath: "" },
      create: {
        accountId: request.accountId,
        status: "approved",
        displayName: request.displayName,
        address: request.address,
        latitude: request.latitude,
        longitude: request.longitude,
        imagePath,
      },
    });
  }
  if (decision === "approved" && request.kind === "organizer") {
    await prisma.organizer.upsert({
      where: { accountId: request.accountId },
      update: { displayName: request.displayName },
      create: { accountId: request.accountId, displayName: request.displayName, phone: request.account.phone },
    });
  }
  await prisma.verificationRequest.update({ where: { id: request.id }, data: { status: decision, reply } });
  revalidatePath("/admin/requests");
  revalidatePath("/cafes");
  revalidatePath("/me/profile");
  finish("/admin/requests", decision === "approved" ? "درخواست تأیید شد." : "درخواست رد شد.");
}

export async function reviewTickAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const submissionId = String(formData.get("submissionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected") {
    redirect(`/admin/ticks?error=${encodeURIComponent("دکمهٔ تأیید یا رد به سرور نرسید. دوباره بزنید.")}`);
  }
  const reply = String(formData.get("reply") ?? "").trim().slice(0, 1000);
  const submission = await prisma.tickSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.status !== "pending") finish("/admin/ticks", "این تیک دیگر باز نیست.");
  await prisma.$transaction([
    prisma.tickSubmission.update({ where: { id: submission.id }, data: { status: decision, reply } }),
    prisma.playerProfile.update({ where: { id: submission.profileId }, data: { tickStatus: decision } }),
  ]);
  revalidatePath("/admin/ticks");
  revalidatePath("/me/profile");
  finish("/admin/ticks", decision === "approved" ? "تیک تأیید شد." : "تیک رد شد.");
}

export async function rankPlayerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  const profile = account.profiles[0];
  if (!profile) return { error: "اول پروفایل را بسازید." };
  const sessionId = String(formData.get("sessionId") ?? "");
  const toProfileId = String(formData.get("toProfileId") ?? "");
  const stars = Number(formData.get("stars") ?? "");
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { error: "رتبه از ۱ تا ۵ است." };
  if (toProfileId === profile.id) return { error: "به خودتان رتبه نمی‌دهید." };
  const played = new Set(["reserved", "checked_in", "completed"]);
  const [mine, theirs] = await Promise.all([
    prisma.booking.findFirst({ where: { sessionId, playerProfileId: profile.id, status: { in: [...played] } } }),
    prisma.booking.findFirst({ where: { sessionId, playerProfileId: toProfileId, status: { in: [...played] } }, include: { playerProfile: true } }),
  ]);
  if (!mine || !theirs) return { error: "فقط هم‌بازی‌های همین میز را می‌توانید ستاره بدهید." };
  const existing = await prisma.peerRank.findUnique({
    where: { sessionId_fromProfileId_toProfileId: { sessionId, fromProfileId: profile.id, toProfileId } },
  });
  if (existing) return { error: "برای این بازیکن در این بازی قبلاً رتبه داده‌اید." };
  const points = stars * 4;
  await prisma.$transaction(async (tx) => {
    const rank = await tx.peerRank.create({ data: { sessionId, fromProfileId: profile.id, toProfileId, stars } });
    await tx.pointEntry.create({
      data: {
        accountId: theirs.playerProfile.accountId,
        amount: points,
        kind: "peer",
        sourceKey: `peer:${rank.id}`,
        note: `رتبهٔ ${stars} از بازیکن دیگر`,
      },
    });
  });
  revalidatePath("/me/games");
  revalidatePath("/shop");
  revalidatePath("/me/profile");
  redirect(`/me/games?notice=${encodeURIComponent("رتبه ثبت شد و امتیاز به آن بازیکن رسید.")}`);
}

export async function buyProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  const productId = String(formData.get("productId") ?? "");
  const product = await prisma.shopProduct.findUnique({ where: { id: productId } });
  if (!product || product.stock < 1) return { error: "این کالا تمام شده است." };
  try {
    await prisma.$transaction(async (tx) => {
      const balance = (await tx.pointEntry.aggregate({ where: { accountId: account.id }, _sum: { amount: true } }))._sum.amount ?? 0;
      if (balance < product.pointCost) throw new Error("points");
      const fresh = await tx.shopProduct.updateMany({ where: { id: product.id, stock: { gte: 1 } }, data: { stock: { decrement: 1 } } });
      if (fresh.count !== 1) throw new Error("stock");
      const order = await tx.shopOrder.create({
        data: { accountId: account.id, productId: product.id, points: product.pointCost, status: "placed" },
      });
      await tx.pointEntry.create({
        data: {
          accountId: account.id,
          amount: -product.pointCost,
          kind: "shop",
          sourceKey: `shop:${order.id}`,
          note: product.name,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "points") return { error: "امتیازتان برای این خرید کافی نیست." };
    return { error: "خرید انجام نشد." };
  }
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
  return { notice: "سفارش ثبت شد. کالا فیزیکی است و بعد از آماده‌شدن فرستاده می‌شود." };
}

export async function fulfillOrderAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const orderId = String(formData.get("orderId") ?? "");
  await prisma.shopOrder.updateMany({ where: { id: orderId, status: "placed" }, data: { status: "sent" } });
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
}

const shopProductSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(2).max(200),
  kind: z.enum(["sticker", "notebook", "mug", "toy", "other"]),
  pointCost: z.coerce.number().int().min(1).max(100000),
  stock: z.coerce.number().int().min(0).max(10000),
});

export async function saveShopProductAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const parsed = shopProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    kind: formData.get("kind"),
    pointCost: formData.get("pointCost"),
    stock: formData.get("stock"),
  });
  if (!parsed.success) redirect("/admin/shop?error=fields");
  const image = await readImage(formData);
  if (image.error) redirect("/admin/shop?error=image");
  const productId = String(formData.get("productId") ?? "");
  if (productId) {
    const existing = await prisma.shopProduct.findUnique({ where: { id: productId } });
    if (!existing) return;
    await prisma.shopProduct.update({
      where: { id: productId },
      data: { ...parsed.data, ...(image.path ? { imagePath: image.path } : {}) },
    });
  } else {
    await prisma.shopProduct.create({ data: { ...parsed.data, imagePath: image.path } });
  }
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  finish("/admin/shop", productId ? "کالای فروشگاه ذخیره شد." : "کالای تازه اضافه شد.");
}

export async function deleteShopProductAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const productId = String(formData.get("productId") ?? "");
  const orders = await prisma.shopOrder.count({ where: { productId } });
  if (orders > 0) redirect("/admin/shop?error=orders");
  await prisma.shopProduct.delete({ where: { id: productId } }).catch(() => undefined);
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  finish("/admin/shop", "کالا حذف شد.");
}

export async function grantRoleAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const accountId = String(formData.get("accountId") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const person = await prisma.account.findUnique({ where: { id: accountId } });
  if (!person) return;
  if (kind === "host") {
    await prisma.host.upsert({
      where: { accountId },
      update: { status: "approved" },
      create: {
        accountId,
        status: "approved",
        displayName: "کافه تازه",
        address: "آدرس را در سانس‌های میزبان کامل کنید",
      },
    });
  }
  if (kind === "organizer") {
    await prisma.organizer.upsert({
      where: { accountId },
      update: {},
      create: { accountId, displayName: "برگزارکننده", phone: person.phone },
    });
  }
  revalidatePath("/admin/accounts");
  revalidatePath("/cafes");
}

const cafeSchema = z.object({
  displayName: z.string().trim().min(2),
  address: z.string().trim().min(5),
});

export async function saveCafeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (!account.host || account.host.status !== "approved") return { error: text("forbidden") };
  const parsed = cafeSchema.safeParse({ displayName: formData.get("displayName"), address: formData.get("address") });
  if (!parsed.success) return { error: "نام و آدرس کافه را کامل کنید." };
  const place = readCoordinates(formData);
  if (place.error) return { error: place.error };
  const image = await readImage(formData);
  if (image.error) return { error: image.error };
  await prisma.host.update({
    where: { id: account.host.id },
    data: { ...parsed.data, latitude: place.latitude, longitude: place.longitude, ...(image.path ? { pendingImagePath: image.path } : {}) },
  });
  revalidatePath("/host/slots");
  revalidatePath("/cafes");
  revalidatePath("/admin/cafes");
  return { notice: image.path ? "کافه ذخیره شد. تصویر تازه بعد از تأیید ادمین دیده می‌شود." : "کافه ذخیره شد." };
}

const tableSchema = z.object({
  name: z.string().trim().min(1),
  capacity: z.coerce.number().int().min(1).max(12),
});

export async function createTableAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (!account.host || account.host.status !== "approved") return { error: text("forbidden") };
  const parsed = tableSchema.safeParse({ name: formData.get("name"), capacity: formData.get("capacity") });
  if (!parsed.success) return { error: "نام میز و ظرفیت ۱ تا ۱۲ را وارد کنید." };
  await prisma.table.create({ data: { hostId: account.host.id, name: parsed.data.name, capacity: parsed.data.capacity } });
  revalidatePath("/host/slots");
  revalidatePath("/cafes");
  return { notice: "میز اضافه شد." };
}

const gameSchema = z.object({
  name: z.string().trim().min(2),
  ageMin: z.coerce.number().int().min(0).max(99),
  difficulty: z.string().trim().min(1),
  durationMinutes: z.coerce.number().int().min(10).max(600),
  minPlayers: z.coerce.number().int().min(1).max(20),
  maxPlayers: z.coerce.number().int().min(1).max(20),
});

export async function createGameAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  if (account.role !== "admin" && !account.organizer) return { error: text("forbidden") };
  const parsed = gameSchema.safeParse({
    name: formData.get("name"),
    ageMin: formData.get("ageMin"),
    difficulty: formData.get("difficulty"),
    durationMinutes: formData.get("durationMinutes"),
    minPlayers: formData.get("minPlayers"),
    maxPlayers: formData.get("maxPlayers"),
  });
  if (!parsed.success) return { error: "مشخصات بازی را کامل کنید." };
  if (parsed.data.maxPlayers < parsed.data.minPlayers) return { error: "سقف بازیکن از حد نصاب کمتر است." };
  const image = await readImage(formData);
  if (image.error) return { error: image.error };
  const approved = account.role === "admin";
  await prisma.game.create({
    data: {
      ...parsed.data,
      imagePath: approved ? image.path : "",
      pendingImagePath: approved ? "" : image.path,
    },
  });
  revalidatePath("/admin/games");
  revalidatePath("/organizer");
  revalidatePath("/games");
  return {
    notice: approved
      ? "بازی به فهرست اضافه شد. برای دیده شدن در خانه باید روی یک سانس آزاد منتشر شود."
      : "بازی به فهرست اضافه شد. تصویر بعد از تأیید ادمین روی کارت دیده می‌شود.",
  };
}

const adminCafeSchema = z.object({
  accountId: z.string().min(1),
  displayName: z.string().trim().min(2),
  address: z.string().trim().min(5),
  tableName: z.string().trim().min(1),
  capacity: z.coerce.number().int().min(1).max(12),
});

export async function createCafeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdminAccount();
  const parsed = adminCafeSchema.safeParse({
    accountId: formData.get("accountId"),
    displayName: formData.get("displayName"),
    address: formData.get("address"),
    tableName: formData.get("tableName"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) return { error: "حساب، نام کافه، آدرس و میز را کامل کنید." };
  const person = await prisma.account.findUnique({ where: { id: parsed.data.accountId } });
  if (!person) return { error: "این حساب پیدا نشد. صاحب کافه اول باید یک بار وارد شود." };
  const image = await readImage(formData);
  if (image.error) return { error: image.error };
  const host = await prisma.host.upsert({
    where: { accountId: person.id },
    update: { status: "approved", displayName: parsed.data.displayName, address: parsed.data.address, ...(image.path ? { imagePath: image.path, pendingImagePath: "" } : {}) },
    create: {
      accountId: person.id,
      status: "approved",
      displayName: parsed.data.displayName,
      address: parsed.data.address,
      imagePath: image.path,
    },
  });
  await prisma.table.create({ data: { hostId: host.id, name: parsed.data.tableName, capacity: parsed.data.capacity } });
  revalidatePath("/admin/cafes");
  revalidatePath("/cafes");
  revalidatePath("/host/slots");
  return { notice: "کافه تأیید شد و میز اول ساخته شد." };
}

export async function updateAvatarAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount();
  const profile = account.profiles[0];
  if (!profile) return { error: "اول پروفایل را بسازید." };
  const image = await readImage(formData, "avatar");
  if (!image.path) return { error: image.error ?? "یک تصویر انتخاب کنید." };
  await prisma.playerProfile.update({ where: { id: profile.id }, data: { avatarPath: image.path } });
  revalidatePath("/me/profile");
  return { notice: "تصویر پروفایل ذخیره شد." };
}

export async function decideGameImageAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const gameId = String(formData.get("gameId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return;
  const image = await readImage(formData);
  if (image.error) redirect("/admin/games?error=image");
  if (image.path) {
    await prisma.game.update({ where: { id: game.id }, data: { imagePath: image.path, pendingImagePath: "" } });
  } else if (decision === "approved" && game.pendingImagePath) {
    await prisma.game.update({ where: { id: game.id }, data: { imagePath: game.pendingImagePath, pendingImagePath: "" } });
  } else if (decision === "rejected") {
    await prisma.game.update({ where: { id: game.id }, data: { pendingImagePath: "" } });
  }
  revalidatePath("/admin/games");
  revalidatePath("/games");
  revalidatePath("/");
  finish("/admin/games", decision === "rejected" ? "تصویر بازی رد شد." : "تصویر بازی ذخیره شد.");
}

export async function decideCafeImageAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const hostId = String(formData.get("hostId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const host = await prisma.host.findUnique({ where: { id: hostId } });
  if (!host) return;
  const image = await readImage(formData);
  if (image.error) redirect("/admin/cafes?error=image");
  if (image.path) {
    await prisma.host.update({ where: { id: host.id }, data: { imagePath: image.path, pendingImagePath: "" } });
  } else if (decision === "approved" && host.pendingImagePath) {
    await prisma.host.update({ where: { id: host.id }, data: { imagePath: host.pendingImagePath, pendingImagePath: "" } });
  } else if (decision === "rejected") {
    await prisma.host.update({ where: { id: host.id }, data: { pendingImagePath: "" } });
  }
  revalidatePath("/admin/cafes");
  revalidatePath("/cafes");
  finish("/admin/cafes", decision === "rejected" ? "تصویر کافه رد شد." : "تصویر کافه ذخیره شد.");
}

export async function saveSiteContentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdminAccount();
  const result = await saveSiteContent(formData);
  if (result.notice) revalidatePath("/", "layout");
  return result;
}

export async function reviewSupportTicketAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const ticketId = String(formData.get("ticketId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "resolved" && decision !== "rejected") {
    redirect(`/admin/tickets?error=${encodeURIComponent("دکمهٔ بستن یا رد به سرور نرسید. دوباره بزنید.")}`);
  }
  const reply = String(formData.get("reply") ?? "").trim().slice(0, 1000);
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== "open") finish("/admin/tickets", "این تیکت دیگر باز نیست.");
  await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: decision, reply } });
  revalidatePath("/admin/tickets");
  finish("/admin/tickets", decision === "resolved" ? "تیکت بسته شد." : "تیکت رد شد.");
}

export async function reviewMessageAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const messageId = String(formData.get("messageId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "resolved" && decision !== "rejected") {
    redirect(`/admin/messages?error=${encodeURIComponent("دکمهٔ پاسخ به سرور نرسید. دوباره بزنید.")}`);
  }
  const reply = String(formData.get("reply") ?? "").trim().slice(0, 1000);
  const message = await prisma.contactMessage.findUnique({ where: { id: messageId } });
  if (!message || message.status !== "open") finish("/admin/messages", "این پیام دیگر باز نیست.");
  await prisma.contactMessage.update({ where: { id: message.id }, data: { status: decision, reply } });
  revalidatePath("/admin/messages");
  finish("/admin/messages", decision === "resolved" ? "پاسخ پیام ذخیره شد." : "پیام رد شد.");
}

export async function createArticleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdminAccount();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (title.length < 2 || excerpt.length < 2 || body.length < 10) return { error: "عنوان، خلاصه و متن مقاله را کامل بنویسید." };
  if (title.length > 80 || excerpt.length > 180 || body.length > 8000) return { error: "متن مقاله از حد مجاز بلندتر است." };
  let imagePath = "";
  const image = uploadedFile(formData.get("image"));
  if (image) {
    try {
      imagePath = await saveUploadedImage(image, "article");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "تصویر ذخیره نشد." };
    }
  }
  await prisma.article.create({
    data: { title, excerpt, body, imagePath, published: formData.get("published") === "on" },
  });
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { notice: "مقاله ذخیره شد." };
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  await requireAdminAccount();
  const id = String(formData.get("id") ?? "");
  await prisma.article.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

export async function sendContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const body = String(formData.get("body") ?? "").trim();
  if (name.length < 2) return { error: "نام را بنویسید." };
  if (phone.length < 8 || phone.length > 15) return { error: "شماره تماس درست نیست." };
  if (body.length < 5 || body.length > 1000) return { error: "پیام را بین ۵ تا ۱۰۰۰ حرف بنویسید." };
  await prisma.contactMessage.create({ data: { name, phone, body } });
  revalidatePath("/admin/messages");
  return { notice: "پیام رسید. ادمین آن را می‌بیند." };
}

function httpsLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveIntegrationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdminAccount();
  const current = await getIntegration();
  let kavenegarApiKey = formData.get("clearKavenegar") === "on" ? "" : current.kavenegarApiKey;
  const nextKey = String(formData.get("kavenegarApiKey") ?? "").trim();
  if (nextKey) kavenegarApiKey = nextKey;
  let zarinpalMerchantId = formData.get("clearZarinpal") === "on" ? "" : current.zarinpalMerchantId;
  const nextMerchant = String(formData.get("zarinpalMerchantId") ?? "").trim();
  if (nextMerchant) zarinpalMerchantId = nextMerchant;
  const enamadLink = String(formData.get("enamadLink") ?? "").trim();
  if (enamadLink && !httpsLink(enamadLink)) return { error: "لینک اینماد باید با https شروع شود." };
  let enamadImage = formData.get("clearEnamad") === "on" ? "" : current.enamadImage;
  const badge = uploadedFile(formData.get("enamad"));
  if (badge) {
    try {
      enamadImage = await saveUploadedImage(badge, "enamad");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "تصویر اینماد ذخیره نشد." };
    }
  }
  const data = {
    kavenegarApiKey,
    kavenegarSender: String(formData.get("kavenegarSender") ?? "").trim(),
    kavenegarTemplate: String(formData.get("kavenegarTemplate") ?? "").trim(),
    zarinpalMerchantId,
    zarinpalSandbox: formData.get("zarinpalSandbox") === "on",
    enamadImage,
    enamadLink,
    contactPhone: String(formData.get("contactPhone") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
    contactAddress: String(formData.get("contactAddress") ?? "").trim(),
  };
  await prisma.integration.upsert({ where: { id: "site" }, update: data, create: { id: "site", ...data } });
  revalidatePath("/", "layout");
  revalidatePath("/contact");
  revalidatePath("/admin/integrations");
  return { notice: "تنظیم اتصال‌ها ذخیره شد. تا وقتی کلید خالی باشد، پرداخت و کد ورود آزمایشی می‌مانند." };
}
