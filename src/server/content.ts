import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";
import { prisma } from "@/infrastructure/prisma";

export type SiteCopy = {
  brandName: string;
  metaDescription: string;
  loginLabel: string;
  myGamesLabel: string;
  profileLabel: string;
  navHome: string;
  navGames: string;
  navCafes: string;
  navHow: string;
  navHost: string;
  navOrganizer: string;
  navAdmin: string;
  heroBadge: string;
  heroTitle: string;
  heroBody: string;
  heroCta: string;
  heroCafes: string;
  heroAlt: string;
  countGames: string;
  countCafes: string;
  homeStep1Title: string;
  homeStep1Text: string;
  homeStep2Title: string;
  homeStep2Text: string;
  homeStep3Title: string;
  homeStep3Text: string;
  homeStep4Title: string;
  homeStep4Text: string;
  shelfTitle: string;
  shelfAll: string;
  shelfEmpty: string;
  footerBlurb: string;
  footerNote: string;
  footerGames: string;
  footerCafes: string;
  footerHow: string;
  gamesTitle: string;
  gamesIntro: string;
  gamesSearch: string;
  gamesPlaceholder: string;
  gamesEmpty: string;
  cafesTitle: string;
  cafesIntro: string;
  howTitle: string;
  howBody: string;
  howCta: string;
  howAlt: string;
  howStep1Title: string;
  howStep1Text: string;
  howStep2Title: string;
  howStep2Text: string;
  howStep3Title: string;
  howStep3Text: string;
  howStep4Title: string;
  howStep4Text: string;
  loginTitle: string;
  loginSubtitle: string;
  phoneLabel: string;
  loginSubmit: string;
  verifyTitle: string;
  verifySubtitle: string;
  reserveLogin: string;
  reserveProfile: string;
  reserveClosed: string;
  reserveButton: string;
  playerLegend: string;
  ineligible: string;
  cancelPolicy: string;
  policyAck: string;
  footerAbout: string;
  footerContact: string;
  footerBlog: string;
  footerServices: string;
  footerTerms: string;
  aboutTitle: string;
  aboutBody: string;
  servicesTitle: string;
  servicesIntro: string;
  service1Title: string;
  service1Text: string;
  service2Title: string;
  service2Text: string;
  service3Title: string;
  service3Text: string;
  termsTitle: string;
  termsBody: string;
  contactTitle: string;
  contactIntro: string;
};

export const defaultCopy: SiteCopy = {
  brandName: "همراهِ بازی",
  metaDescription: "رزرو صندلی بازی رومیزی",
  loginLabel: "ورود",
  myGamesLabel: "بازی‌های من",
  profileLabel: "پروفایل",
  navHome: "خانه",
  navGames: "بازی‌ها",
  navCafes: "کافه‌ها",
  navHow: "چطور بازی کنیم",
  navHost: "کافهٔ من",
  navOrganizer: "برگزارکننده",
  navAdmin: "ادمین",
  heroBadge: "بازی رومیزی، دور یک میز",
  heroTitle: "بیا بازی کنیم!",
  heroBody: "صندلی بازی را برای خودت یا فرزندت بردار. کافه‌ها و بازی‌ها را ادمین، یا کسی که ادمین تأیید کرده، به این قفسه اضافه می‌کند.",
  heroCta: "دیدن بازی‌ها",
  heroCafes: "کافه‌ها",
  heroAlt: "یک خانواده دور میز بازی رومیزی نشسته‌اند",
  countGames: "بازی باز",
  countCafes: "کافه",
  homeStep1Title: "پروفایل",
  homeStep1Text: "برای خودت یا فرزندت یک بازیکن بساز.",
  homeStep2Title: "انتخاب",
  homeStep2Text: "بازی و کافه را از قفسه بردار.",
  homeStep3Title: "صندلی",
  homeStep3Text: "پرداخت آزمایشی صندلی را ده دقیقه نگه می‌دارد.",
  homeStep4Title: "حضور",
  homeStep4Text: "کد را در محل به برگزارکننده نشان بده.",
  shelfTitle: "قفسهٔ بازی‌ها",
  shelfAll: "همه",
  shelfEmpty: "فعلاً رویداد بازی باز نیست.",
  footerBlurb: "صندلی بازی رومیزی برای خانواده. مدرسه فقط اظهارشده است و تأیید نمی‌شود.",
  footerNote: "کافه و بازی را ادمین، یا کسی که ادمین تأیید کرده، به سایت اضافه می‌کند.",
  footerGames: "بازی‌های باز",
  footerCafes: "کافه‌ها",
  footerHow: "چطور بازی کنیم",
  gamesTitle: "بازی‌های باز",
  gamesIntro: "بدون ورود هم می‌توانی قفسه را ببینی. رزرو صندلی بعد از ورود و ساخت پروفایل بازیکن انجام می‌شود.",
  gamesSearch: "اسم بازی",
  gamesPlaceholder: "مثلاً شهر و جاده",
  gamesEmpty: "بازی‌ای برای این جستجو پیدا نشد.",
  cafesTitle: "کافه‌ها",
  cafesIntro: "فقط کافه‌ای که ادمین تأیید کرده این‌جا دیده می‌شود. شمارهٔ صاحب کافه عمومی نیست.",
  howTitle: "چطور بازی کنیم",
  howBody: "از دیدن قفسه تا نشستن سر میز، چهار قدم است. کافه و بازی تازه فقط با تأیید ادمین وارد سایت می‌شود.",
  howCta: "برو به قفسه",
  howAlt: "میز کافه با کارت و قوری",
  howStep1Title: "۱. وارد شو",
  howStep1Text: "با شمارهٔ سرپرست کد می‌گیری. بازیکن، از جمله فرزند، پروفایل جدا دارد.",
  howStep2Title: "۲. بازی را بردار",
  howStep2Text: "قفسه را بدون ورود هم می‌شود دید. رزرو بعد از ورود است و سن و جنسیت را چک می‌کند.",
  howStep3Title: "۳. صندلی را نگه دار",
  howStep3Text: "پرداخت آزمایشی صندلی را ده دقیقه نگه می‌دارد. پیش از قطعی شدن، لغو مبلغ را برمی‌گرداند.",
  howStep4Title: "۴. سر میز حاضر شو",
  howStep4Text: "کد حضور را به برگزارکننده بده. شمارهٔ برگزارکننده فقط بعد از قطعی شدن، برای همان رزرو، دیده می‌شود.",
  loginTitle: "بیا داخل!",
  loginSubtitle: "با شماره موبایل سرپرست ادامه دهید. کد تأیید در محیط توسعه روی همین دستگاه نشان داده می‌شود.",
  phoneLabel: "شماره موبایل",
  loginSubmit: "ادامه",
  verifyTitle: "کد تأیید",
  verifySubtitle: "اگر کد نرسید، به ورود برگردید و دوباره درخواست کنید.",
  reserveLogin: "برای رزرو وارد شو",
  reserveProfile: "اول پروفایل بازیکن بساز",
  reserveClosed: "الان نمی‌شود صندلی تازه گرفت.",
  reserveButton: "رزرو صندلی",
  playerLegend: "بازیکن",
  ineligible: "واجد شرایط نیست",
  cancelPolicy:
    "تا پیش از قطعی شدن رویداد می‌توانید رزرو را لغو کنید و مبلغ کامل برمی‌گردد. پس از قطعی شدن، لغو خودخدمت بسته است. غیبت فقط ثبت می‌شود و هزینه بلیت دیگران از شما کسر نمی‌شود.",
  policyAck: "این شرط را خواندم",
  footerAbout: "درباره ما",
  footerContact: "تماس با ما",
  footerBlog: "بلاگ",
  footerServices: "خدمات",
  footerTerms: "شرایط استفاده",
  aboutTitle: "درباره همراهِ بازی",
  aboutBody:
    "همراهِ بازی جایی است برای برداشتن صندلی یک بازی رومیزی، دور یک میز واقعی.\n\nحساب مال سرپرست است. هر بازیکن، از جمله فرزند، پروفایل جدا دارد. مدرسه فقط اظهارشده است و تأیید نمی‌شود و در واجد بودن صندلی اثری ندارد.\n\nکافه و بازی را ادمین، یا کسی که ادمین تأیید کرده، به سایت اضافه می‌کند.",
  servicesTitle: "خدمات",
  servicesIntro: "از دیدن قفسه تا نشستن سر میز، این‌ها کار سایت است.",
  service1Title: "رزرو صندلی",
  service1Text: "صندلی را برای خودت یا فرزندت نگه می‌داری. تا پیش از قطعی شدن رویداد می‌توانی لغو کنی و مبلغ کامل برمی‌گردد.",
  service2Title: "کافهٔ بازی",
  service2Text: "میز و سانس را میزبان تأییدشده می‌سازد. شمارهٔ صاحب کافه روی صفحهٔ عمومی نیست.",
  service3Title: "برگزاری",
  service3Text: "برگزارکنندهٔ تأییدشده بازی را منتشر می‌کند و در محل حضور را با کد ثبت می‌کند.",
  termsTitle: "شرایط استفاده",
  termsBody:
    "با رزرو صندلی، این شرط‌ها را می‌پذیری.\n\nحساب با شمارهٔ سرپرست ساخته می‌شود. هر بازیکن پروفایل جدا دارد و سن و جنسیت در شروع سانس با قانون همان بازی سنجیده می‌شود.\n\nپرداخت آزمایشی صندلی را ده دقیقه نگه می‌دارد. تا پیش از قطعی شدن رویداد می‌توانید رزرو را لغو کنید و مبلغ کامل برمی‌گردد. پس از قطعی شدن، لغو خودخدمت بسته است. غیبت فقط ثبت می‌شود و هزینه بلیت دیگران از شما کسر نمی‌شود.\n\nشمارهٔ برگزارکننده فقط بعد از قطعی شدن، و فقط برای همان رزرو، دیده می‌شود. مدرسه اظهارشده است و تأیید نمی‌شود.",
  contactTitle: "تماس با ما",
  contactIntro: "پیام را همین‌جا بگذار. ادمین آن را در پنل می‌بیند. شمارهٔ صاحب کافه‌ها از این فرم عمومی نمی‌شود.",
};

export const copyFields: { key: keyof SiteCopy; label: string; section: string; rows?: number; max: number }[] = [
  { key: "brandName", label: "نام سایت", section: "برند", max: 40 },
  { key: "metaDescription", label: "توضیح کوتاه برای مرورگر", section: "برند", rows: 2, max: 160 },
  { key: "loginLabel", label: "دکمهٔ ورود", section: "منو", max: 24 },
  { key: "myGamesLabel", label: "بازی‌های من", section: "منو", max: 24 },
  { key: "profileLabel", label: "پروفایل", section: "منو", max: 24 },
  { key: "navHome", label: "خانه", section: "منو", max: 24 },
  { key: "navGames", label: "بازی‌ها", section: "منو", max: 24 },
  { key: "navCafes", label: "کافه‌ها", section: "منو", max: 24 },
  { key: "navHow", label: "چطور بازی کنیم", section: "منو", max: 32 },
  { key: "navHost", label: "کافهٔ من", section: "منو", max: 24 },
  { key: "navOrganizer", label: "برگزارکننده", section: "منو", max: 24 },
  { key: "navAdmin", label: "ادمین", section: "منو", max: 24 },
  { key: "heroBadge", label: "نشان بالای عنوان", section: "صفحهٔ اول", max: 60 },
  { key: "heroTitle", label: "عنوان هیرو", section: "صفحهٔ اول", max: 60 },
  { key: "heroBody", label: "متن هیرو", section: "صفحهٔ اول", rows: 3, max: 400 },
  { key: "heroCta", label: "دکمهٔ بازی‌ها", section: "صفحهٔ اول", max: 32 },
  { key: "heroCafes", label: "دکمهٔ کافه‌ها", section: "صفحهٔ اول", max: 32 },
  { key: "heroAlt", label: "شرح تصویر هیرو", section: "صفحهٔ اول", max: 120 },
  { key: "countGames", label: "برچسب تعداد بازی", section: "صفحهٔ اول", max: 24 },
  { key: "countCafes", label: "برچسب تعداد کافه", section: "صفحهٔ اول", max: 24 },
  { key: "homeStep1Title", label: "قدم ۱، عنوان", section: "صفحهٔ اول", max: 40 },
  { key: "homeStep1Text", label: "قدم ۱، متن", section: "صفحهٔ اول", rows: 2, max: 200 },
  { key: "homeStep2Title", label: "قدم ۲، عنوان", section: "صفحهٔ اول", max: 40 },
  { key: "homeStep2Text", label: "قدم ۲، متن", section: "صفحهٔ اول", rows: 2, max: 200 },
  { key: "homeStep3Title", label: "قدم ۳، عنوان", section: "صفحهٔ اول", max: 40 },
  { key: "homeStep3Text", label: "قدم ۳، متن", section: "صفحهٔ اول", rows: 2, max: 200 },
  { key: "homeStep4Title", label: "قدم ۴، عنوان", section: "صفحهٔ اول", max: 40 },
  { key: "homeStep4Text", label: "قدم ۴، متن", section: "صفحهٔ اول", rows: 2, max: 200 },
  { key: "shelfTitle", label: "عنوان قفسه", section: "صفحهٔ اول", max: 40 },
  { key: "shelfAll", label: "لینک همه", section: "صفحهٔ اول", max: 24 },
  { key: "shelfEmpty", label: "وقتی بازی باز نیست", section: "صفحهٔ اول", rows: 2, max: 200 },
  { key: "footerBlurb", label: "معرفی فوتر", section: "فوتر", rows: 3, max: 300 },
  { key: "footerNote", label: "یادداشت فوتر", section: "فوتر", rows: 3, max: 300 },
  { key: "footerGames", label: "لینک بازی‌ها", section: "فوتر", max: 32 },
  { key: "footerCafes", label: "لینک کافه‌ها", section: "فوتر", max: 32 },
  { key: "footerHow", label: "لینک روش بازی", section: "فوتر", max: 32 },
  { key: "gamesTitle", label: "عنوان", section: "بازی‌ها", max: 40 },
  { key: "gamesIntro", label: "مقدمه", section: "بازی‌ها", rows: 3, max: 400 },
  { key: "gamesSearch", label: "برچسب جستجو", section: "بازی‌ها", max: 40 },
  { key: "gamesPlaceholder", label: "نمونهٔ جستجو", section: "بازی‌ها", max: 40 },
  { key: "gamesEmpty", label: "نتیجهٔ خالی", section: "بازی‌ها", max: 120 },
  { key: "cafesTitle", label: "عنوان", section: "کافه‌ها", max: 40 },
  { key: "cafesIntro", label: "مقدمه", section: "کافه‌ها", rows: 3, max: 400 },
  { key: "howTitle", label: "عنوان", section: "چطور بازی کنیم", max: 40 },
  { key: "howBody", label: "مقدمه", section: "چطور بازی کنیم", rows: 3, max: 400 },
  { key: "howCta", label: "دکمه", section: "چطور بازی کنیم", max: 32 },
  { key: "howAlt", label: "شرح تصویر", section: "چطور بازی کنیم", max: 120 },
  { key: "howStep1Title", label: "قدم ۱، عنوان", section: "چطور بازی کنیم", max: 40 },
  { key: "howStep1Text", label: "قدم ۱، متن", section: "چطور بازی کنیم", rows: 2, max: 300 },
  { key: "howStep2Title", label: "قدم ۲، عنوان", section: "چطور بازی کنیم", max: 40 },
  { key: "howStep2Text", label: "قدم ۲، متن", section: "چطور بازی کنیم", rows: 2, max: 300 },
  { key: "howStep3Title", label: "قدم ۳، عنوان", section: "چطور بازی کنیم", max: 40 },
  { key: "howStep3Text", label: "قدم ۳، متن", section: "چطور بازی کنیم", rows: 2, max: 300 },
  { key: "howStep4Title", label: "قدم ۴، عنوان", section: "چطور بازی کنیم", max: 40 },
  { key: "howStep4Text", label: "قدم ۴، متن", section: "چطور بازی کنیم", rows: 2, max: 300 },
  { key: "loginTitle", label: "عنوان ورود", section: "ورود", max: 40 },
  { key: "loginSubtitle", label: "توضیح ورود", section: "ورود", rows: 2, max: 240 },
  { key: "phoneLabel", label: "برچسب شماره", section: "ورود", max: 40 },
  { key: "loginSubmit", label: "دکمهٔ ادامه", section: "ورود", max: 24 },
  { key: "verifyTitle", label: "عنوان کد", section: "ورود", max: 40 },
  { key: "verifySubtitle", label: "توضیح کد", section: "ورود", rows: 2, max: 240 },
  { key: "reserveLogin", label: "دعوت به ورود", section: "رزرو", max: 40 },
  { key: "reserveProfile", label: "دعوت به ساخت پروفایل", section: "رزرو", max: 40 },
  { key: "reserveClosed", label: "وقتی رزرو بسته است", section: "رزرو", max: 80 },
  { key: "reserveButton", label: "دکمهٔ رزرو", section: "رزرو", max: 32 },
  { key: "playerLegend", label: "عنوان انتخاب بازیکن", section: "رزرو", max: 32 },
  { key: "ineligible", label: "بازیکن نامطابق", section: "رزرو", max: 32 },
  { key: "cancelPolicy", label: "جمله‌ای که پیش از پرداخت خوانده می‌شود", section: "رزرو", rows: 4, max: 500 },
  { key: "policyAck", label: "تأیید خواندن شرط", section: "رزرو", max: 40 },
  { key: "footerAbout", label: "لینک درباره ما", section: "فوتر", max: 32 },
  { key: "footerContact", label: "لینک تماس", section: "فوتر", max: 32 },
  { key: "footerBlog", label: "لینک بلاگ", section: "فوتر", max: 32 },
  { key: "footerServices", label: "لینک خدمات", section: "فوتر", max: 32 },
  { key: "footerTerms", label: "لینک شرایط", section: "فوتر", max: 32 },
  { key: "aboutTitle", label: "عنوان", section: "درباره ما", max: 60 },
  { key: "aboutBody", label: "متن", section: "درباره ما", rows: 6, max: 1500 },
  { key: "servicesTitle", label: "عنوان", section: "خدمات", max: 40 },
  { key: "servicesIntro", label: "مقدمه", section: "خدمات", rows: 2, max: 400 },
  { key: "service1Title", label: "خدمت ۱، عنوان", section: "خدمات", max: 40 },
  { key: "service1Text", label: "خدمت ۱، متن", section: "خدمات", rows: 3, max: 300 },
  { key: "service2Title", label: "خدمت ۲، عنوان", section: "خدمات", max: 40 },
  { key: "service2Text", label: "خدمت ۲، متن", section: "خدمات", rows: 3, max: 300 },
  { key: "service3Title", label: "خدمت ۳، عنوان", section: "خدمات", max: 40 },
  { key: "service3Text", label: "خدمت ۳، متن", section: "خدمات", rows: 3, max: 300 },
  { key: "termsTitle", label: "عنوان", section: "شرایط استفاده", max: 40 },
  { key: "termsBody", label: "متن", section: "شرایط استفاده", rows: 8, max: 2000 },
  { key: "contactTitle", label: "عنوان", section: "تماس با ما", max: 40 },
  { key: "contactIntro", label: "مقدمه", section: "تماس با ما", rows: 3, max: 400 },
];

const copySchema = z.object(
  Object.fromEntries(
    copyFields.map((field) => [field.key, z.string().trim().min(1, "هیچ متنی را خالی نگذارید.").max(field.max)]),
  ) as { [K in keyof SiteCopy]: z.ZodString },
);

const extensions = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

function mergeCopy(raw: string): SiteCopy {
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  const source = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  const copy = { ...defaultCopy };
  for (const field of copyFields) {
    const value = source[field.key];
    if (typeof value === "string" && value.trim()) copy[field.key] = value.trim();
  }
  return copy;
}

export const getSiteContent = cache(async () => {
  const row = await prisma.siteContent.findUnique({ where: { id: "site" } });
  return {
    copy: mergeCopy(row?.copy ?? ""),
    logoPath: row?.logoPath ?? "",
    heroImage: row?.heroImage || "/art/hero-play.jpg",
    howImage: row?.howImage || "/art/cafe-table.jpg",
  };
});

function isUpload(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

export async function saveUploadedImage(file: File, prefix: string): Promise<string> {
  try {
    return await storeImage(file, prefix);
  } catch (error) {
    if (error instanceof Error && error.message === "size") throw new Error("حجم هر تصویر حداکثر ۲ مگابایت است.");
    throw new Error("تصویر باید jpg، png، webp یا gif باشد.");
  }
}

export function uploadedFile(value: FormDataEntryValue | null): File | null {
  return isUpload(value) ? value : null;
}

async function storeImage(file: File, prefix: string): Promise<string> {
  const extension = extensions.get(file.type);
  if (!extension) throw new Error("type");
  if (file.size > 2_000_000) throw new Error("size");
  const name = `${prefix}-${randomBytes(8).toString("hex")}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function saveSiteContent(formData: FormData): Promise<{ error?: string; notice?: string }> {
  const raw = Object.fromEntries(copyFields.map((field) => [field.key, String(formData.get(field.key) ?? "")]));
  const parsed = copySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "متن‌ها کامل نیست." };
  const current = await prisma.siteContent.findUnique({ where: { id: "site" } });
  let logoPath = formData.get("clearLogo") === "on" ? "" : (current?.logoPath ?? "");
  let heroImage = formData.get("resetHero") === "on" ? "/art/hero-play.jpg" : (current?.heroImage || "/art/hero-play.jpg");
  let howImage = formData.get("resetHow") === "on" ? "/art/cafe-table.jpg" : (current?.howImage || "/art/cafe-table.jpg");
  try {
    const logo = formData.get("logo");
    const hero = formData.get("hero");
    const how = formData.get("how");
    if (isUpload(logo)) logoPath = await storeImage(logo, "logo");
    if (isUpload(hero)) heroImage = await storeImage(hero, "hero");
    if (isUpload(how)) howImage = await storeImage(how, "how");
  } catch (error) {
    if (error instanceof Error && error.message === "size") return { error: "حجم هر تصویر حداکثر ۲ مگابایت است." };
    return { error: "تصویر باید jpg، png، webp یا gif باشد." };
  }
  await prisma.siteContent.upsert({
    where: { id: "site" },
    update: { copy: JSON.stringify(parsed.data), logoPath, heroImage, howImage },
    create: { id: "site", copy: JSON.stringify(parsed.data), logoPath, heroImage, howImage },
  });
  return { notice: "لوگو، تصویرها و متن‌ها ذخیره شد." };
}
