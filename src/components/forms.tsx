"use client";

import { useActionState, useRef, useState } from "react";
import { Alert, buttonClass, fieldClass, secondaryButtonClass } from "@/components/ui";
import { LocationField, ShamsiDateField } from "@/components/profile-fields";
import {
  checkInAction,
  createCafeAction,
  createGameAction,
  createProfileAction,
  createSlotAction,
  createTableAction,
  loginAction,
  requestVerificationAction,
  saveCafeAction,
  mismatchAction,
  payAction,
  publishAction,
  reserveAction,
  submitTickAction,
  updateAvatarAction,
  updateProfileAction,
  verifyAction,
  type FormState,
} from "@/server/actions";

const initial: FormState = {};

function ImagePicker({ id, label, hint }: { id: string; label: string; hint: string }) {
  return (
    <label className="block space-y-2 text-sm font-medium" htmlFor={id}>
      {label}
      <input id={id} name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={fieldClass} />
      <span className="block text-xs leading-6 text-muted">{hint}</span>
    </label>
  );
}

export function AvatarForm({ avatarPath }: { avatarPath: string }) {
  const [state, action, pending] = useActionState(updateAvatarAction, initial);
  return (
    <form action={action} className="space-y-3">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      {avatarPath ? <img src={avatarPath} alt="" className="h-20 w-20 rounded-full border-[3px] border-ink object-cover" /> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="avatar">
        تصویر پروفایل
        <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required className={fieldClass} />
      </label>
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ذخیره" : "ذخیره تصویر"}
      </button>
    </form>
  );
}

export function LoginForm({ phoneLabel, submitLabel }: { phoneLabel: string; submitLabel: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="phone">
        {phoneLabel}
        <input id="phone" name="phone" inputMode="numeric" autoComplete="tel" dir="ltr" required className={fieldClass} />
      </label>
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ارسال کد" : submitLabel}
      </button>
    </form>
  );
}

export function VerifyForm({ devCode }: { devCode: string | null }) {
  const [state, action, pending] = useActionState(verifyAction, initial);
  return (
    <form action={action} className="space-y-4">
      {devCode ? <Alert tone="ok">کد محیط توسعه: {devCode}</Alert> : null}
      {state.error ? <Alert>{state.error}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="code">
        کد تأیید
        <input id="code" name="code" inputMode="numeric" dir="ltr" required className={fieldClass} />
      </label>
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال بررسی" : "ورود"}
      </button>
    </form>
  );
}

export function ProfileForm({
  submitLabel,
  profile,
}: {
  submitLabel: string;
  profile?: { displayName: string; publicId: string; birthDate: string; gender: string; schoolName: string } | null;
}) {
  const [state, action, pending] = useActionState(profile ? updateProfileAction : createProfileAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="displayName">
        نام کاربر
        <input id="displayName" name="displayName" required defaultValue={profile?.displayName} className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="publicId">
        نام کاربری
        <input id="publicId" name="publicId" required dir="ltr" defaultValue={profile?.publicId} className={fieldClass} />
      </label>
      <ShamsiDateField iso={profile?.birthDate} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">جنسیت</legend>
        <label className="flex min-h-11 cursor-pointer items-center gap-2">
          <input type="radio" name="gender" value="female" required defaultChecked={profile?.gender === "female"} /> زن
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2">
          <input type="radio" name="gender" value="male" required defaultChecked={profile?.gender === "male"} /> مرد
        </label>
      </fieldset>
      <label className="block space-y-2 text-sm font-medium" htmlFor="schoolName">
        مدرسه (اظهارشده، تأییدنشده)
        <input id="schoolName" name="schoolName" defaultValue={profile?.schoolName} className={fieldClass} />
      </label>
      {profile ? <p className="text-sm leading-7 text-muted">با ذخیره، تغییر همین‌جا دیده می‌شود و درخواست تأیید برای ادمین فرستاده می‌شود.</p> : null}
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ذخیره" : submitLabel}
      </button>
    </form>
  );
}

export function TickForm() {
  const [state, action, pending] = useActionState(submitTickAction, initial);
  const [names, setNames] = useState<string[]>([]);
  const [localError, setLocalError] = useState("");
  const filesRef = useRef<HTMLInputElement>(null);
  const maxBytes = 3 * 1024 * 1024;

  function onFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const list = [...(event.target.files ?? [])];
    if (list.length > 3) {
      event.target.value = "";
      setNames([]);
      setLocalError("حداکثر ۳ سند می‌توانید الصاق کنید.");
      return;
    }
    if (list.some((file) => file.size > maxBytes)) {
      event.target.value = "";
      setNames([]);
      setLocalError("حجم هر فایل حداکثر ۳ مگابایت است.");
      return;
    }
    setLocalError("");
    setNames(list.map((file) => file.name));
  }

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {localError ? <Alert>{localError}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="tickNote">
        متن
        <textarea id="tickNote" name="note" required minLength={2} maxLength={2000} rows={5} className={`${fieldClass} min-h-32 py-3`} />
      </label>
      <div className="space-y-2">
        <input
          ref={filesRef}
          id="tickFiles"
          name="files"
          type="file"
          accept=".txt,image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={onFiles}
        />
        <button className={secondaryButtonClass} type="button" onClick={() => filesRef.current?.click()}>
          الصاق سند
        </button>
        {names.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {names.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-7 text-muted">تا ۳ سند. txt و jpg و png و webp و gif. هر فایل حداکثر ۳ مگابایت.</p>
        )}
      </div>
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ارسال" : "ارسال برای تیک"}
      </button>
    </form>
  );
}

export function ReserveForm({
  sessionId,
  profiles,
  submitLabel,
  playerLegend,
  ineligible,
}: {
  sessionId: string;
  profiles: { id: string; label: string; eligible: boolean }[];
  submitLabel: string;
  playerLegend: string;
  ineligible: string;
}) {
  const [state, action, pending] = useActionState(reserveAction, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{playerLegend}</legend>
        {profiles.map((profile) => (
          <label key={profile.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-3">
            <input type="radio" name="profileId" value={profile.id} required disabled={!profile.eligible} />
            <span>{profile.label}</span>
            {profile.eligible ? null : <span className="text-sm text-muted">{ineligible}</span>}
          </label>
        ))}
      </fieldset>
      <button className={buttonClass} type="submit" disabled={pending || profiles.every((profile) => !profile.eligible)}>
        {pending ? "در حال رزرو" : submitLabel}
      </button>
    </form>
  );
}

export function PayForm({ bookingId, policy, ack, live }: { bookingId: string; policy: string; ack: string; live: boolean }) {
  const [state, action, pending] = useActionState(payAction, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      <p className="rounded-lg border border-line bg-card p-4 text-sm leading-7">{policy}</p>
      <label className="flex min-h-11 cursor-pointer items-start gap-2 text-sm">
        <input className="mt-1" type="checkbox" name="ack" required />
        {ack}
      </label>
      <button className={buttonClass} name="outcome" value={live ? "zarinpal" : "ok"} type="submit" disabled={pending}>
        {pending ? "در حال پرداخت" : live ? "پرداخت با زرین‌پال" : "پرداخت آزمایشی"}
      </button>
      {live ? null : (
        <button className={secondaryButtonClass} name="outcome" value="fail" type="submit" disabled={pending}>
          شبیه‌سازی پرداخت ناموفق
        </button>
      )}
    </form>
  );
}

export function CheckInForm({ sessionId }: { sessionId: string }) {
  const [state, action, pending] = useActionState(checkInAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor={`code-${sessionId}`}>
        کد حضور
        <input id={`code-${sessionId}`} name="code" dir="ltr" required className={fieldClass} />
      </label>
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ثبت" : "تأیید حضور"}
      </button>
    </form>
  );
}

export function MismatchForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(mismatchAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm" htmlFor={`reason-${bookingId}`}>
        دلیل عدم تطابق
        <input id={`reason-${bookingId}`} name="reason" className={fieldClass} />
      </label>
      <button className={secondaryButtonClass} type="submit" disabled={pending}>
        ثبت تیکت، بدون لغو بازی
      </button>
    </form>
  );
}

export function SlotForm({ tables }: { tables: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createSlotAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="tableId">
        میز
        <select id="tableId" name="tableId" className={fieldClass}>
          {tables.map((table) => (
            <option key={table.id} value={table.id}>
              {table.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="startsAt">
        شروع
        <input id="startsAt" name="startsAt" type="datetime-local" required dir="ltr" className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="endsAt">
        پایان
        <input id="endsAt" name="endsAt" type="datetime-local" required dir="ltr" className={fieldClass} />
      </label>
      <button className={buttonClass} type="submit" disabled={pending || tables.length === 0}>
        {pending ? "در حال ثبت" : "ثبت سانس آزاد"}
      </button>
    </form>
  );
}

export function PublishForm({
  slots,
  games,
}: {
  slots: { id: string; label: string }[];
  games: { id: string; name: string; minPlayers: number; maxPlayers: number }[];
}) {
  const [state, action, pending] = useActionState(publishAction, initial);
  const game = games[0];
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="slotId">
        سانس آزاد
        <select id="slotId" name="slotId" className={fieldClass}>
          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="gameId">
        بازی
        <select id="gameId" name="gameId" className={fieldClass}>
          {games.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="minPlayers">
        حد نصاب
        <input id="minPlayers" name="minPlayers" type="number" min={1} defaultValue={game?.minPlayers ?? 2} required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="maxPlayers">
        سقف
        <input id="maxPlayers" name="maxPlayers" type="number" min={1} defaultValue={game?.maxPlayers ?? 4} required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="priceRial">
        هزینه هر صندلی (ریال)
        <input id="priceRial" name="priceRial" type="number" min={0} defaultValue={1500000} required dir="ltr" className={fieldClass} />
      </label>
      <button className={buttonClass} type="submit" disabled={pending || slots.length === 0}>
        {pending ? "در حال انتشار" : "انتشار رویداد"}
      </button>
    </form>
  );
}

export function RequestRoleForm() {
  const [state, action, pending] = useActionState(requestVerificationAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">چه چیزی می‌خواهید بسازید؟</legend>
        <label className="flex min-h-11 cursor-pointer items-center gap-2">
          <input type="radio" name="kind" value="host" required /> کافه
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2">
          <input type="radio" name="kind" value="organizer" /> بازی و رویداد
        </label>
      </fieldset>
      <label className="block space-y-2 text-sm font-medium" htmlFor="requestName">
        نام کافه یا برگزارکننده
        <input id="requestName" name="displayName" required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="requestAddress">
        آدرس کافه
        <input id="requestAddress" name="address" className={fieldClass} />
      </label>
      <LocationField />
      <ImagePicker id="requestImage" label="تصویر کافه" hint="برای کافه، تصویر بعد از تأیید ادمین روی صفحهٔ کافه‌ها دیده می‌شود. حداکثر ۲ مگابایت." />
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ثبت" : "درخواست تأیید"}
      </button>
    </form>
  );
}

export function CafeForm({ displayName, address, latitude, longitude }: { displayName: string; address: string; latitude?: number | null; longitude?: number | null }) {
  const [state, action, pending] = useActionState(saveCafeAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="cafeName">
        نام کافه
        <input id="cafeName" name="displayName" defaultValue={displayName} required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="cafeAddress">
        آدرس
        <input id="cafeAddress" name="address" defaultValue={address} required className={fieldClass} />
      </label>
      <LocationField latitude={latitude} longitude={longitude} />
      <ImagePicker id="cafeImage" label="تصویر تازهٔ کافه" hint="تصویر فعلی می‌ماند تا ادمین تصویر تازه را تأیید کند یا خودش عوض کند." />
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ذخیره" : "ذخیره کافه"}
      </button>
    </form>
  );
}

export function TableForm() {
  const [state, action, pending] = useActionState(createTableAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="tableName">
        نام میز
        <input id="tableName" name="name" required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="tableCapacity">
        ظرفیت
        <input id="tableCapacity" name="capacity" type="number" min={1} max={12} defaultValue={4} required dir="ltr" className={fieldClass} />
      </label>
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ساخت" : "افزودن میز"}
      </button>
    </form>
  );
}

export function GameForm() {
  const [state, action, pending] = useActionState(createGameAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="catalogName">
        نام بازی
        <input id="catalogName" name="name" required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="ageMin">
        حداقل سن
        <input id="ageMin" name="ageMin" type="number" min={0} defaultValue={8} required dir="ltr" className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="difficulty">
        سختی
        <input id="difficulty" name="difficulty" defaultValue="آسان" required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="durationMinutes">
        مدت (دقیقه)
        <input id="durationMinutes" name="durationMinutes" type="number" min={10} defaultValue={60} required dir="ltr" className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="catalogMin">
        حداقل بازیکن
        <input id="catalogMin" name="minPlayers" type="number" min={1} defaultValue={2} required dir="ltr" className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="catalogMax">
        حداکثر بازیکن
        <input id="catalogMax" name="maxPlayers" type="number" min={1} defaultValue={4} required dir="ltr" className={fieldClass} />
      </label>
      <ImagePicker id="gameImage" label="تصویر بازی" hint="اگر سازنده ادمین نباشد، تصویر بعد از تأیید ادمین روی کارت بازی دیده می‌شود." />
      <button className={buttonClass} type="submit" disabled={pending}>
        {pending ? "در حال ساخت" : "افزودن بازی"}
      </button>
    </form>
  );
}

export function AdminCafeForm({ accounts }: { accounts: { id: string; phone: string }[] }) {
  const [state, action, pending] = useActionState(createCafeAction, initial);
  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.notice ? <Alert tone="ok">{state.notice}</Alert> : null}
      <label className="block space-y-2 text-sm font-medium" htmlFor="cafeAccount">
        حساب صاحب کافه
        <select id="cafeAccount" name="accountId" className={fieldClass} required>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.phone}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="adminCafeName">
        نام کافه
        <input id="adminCafeName" name="displayName" required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="adminCafeAddress">
        آدرس
        <input id="adminCafeAddress" name="address" required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="adminTableName">
        میز اول
        <input id="adminTableName" name="tableName" required className={fieldClass} />
      </label>
      <label className="block space-y-2 text-sm font-medium" htmlFor="adminCapacity">
        ظرفیت میز
        <input id="adminCapacity" name="capacity" type="number" min={1} max={12} defaultValue={4} required dir="ltr" className={fieldClass} />
      </label>
      <ImagePicker id="adminCafeImage" label="تصویر کافه" hint="تصویر ادمین همان لحظه روی صفحهٔ کافه‌ها دیده می‌شود." />
      <button className={buttonClass} type="submit" disabled={pending || accounts.length === 0}>
        {pending ? "در حال ساخت" : "ساخت کافه تأییدشده"}
      </button>
    </form>
  );
}
