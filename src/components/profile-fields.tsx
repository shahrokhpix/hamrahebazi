"use client";

import { useState } from "react";
import { gregorianIso, jalaliMonthLength, jalaliMonths, toJalali } from "@/domain/jalali";
import { fieldClass, secondaryButtonClass } from "@/components/ui";

const years = Array.from({ length: 111 }, (_, index) => 1410 - index);

export function ShamsiDateField({ iso }: { iso?: string }) {
  const parsed = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const start = parsed ? toJalali(Number(parsed[1]), Number(parsed[2]), Number(parsed[3])) : { jy: 1370, jm: 1, jd: 1 };
  const [year, setYear] = useState(String(start.jy));
  const [month, setMonth] = useState(String(start.jm));
  const [day, setDay] = useState(String(start.jd));
  const length = jalaliMonthLength(Number(year), Number(month));
  const safeDay = Math.min(Number(day), length);

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">تاریخ تولد</legend>
      <div className="grid grid-cols-3 gap-2">
        <select aria-label="روز" className={fieldClass} value={String(safeDay)} onChange={(event) => setDay(event.target.value)}>
          {Array.from({ length }, (_, index) => index + 1).map((value) => (
            <option key={value} value={String(value)}>
              {value}
            </option>
          ))}
        </select>
        <select aria-label="ماه" className={fieldClass} value={month} onChange={(event) => setMonth(event.target.value)}>
          {jalaliMonths.map((name, index) => (
            <option key={name} value={String(index + 1)}>
              {name}
            </option>
          ))}
        </select>
        <select aria-label="سال" className={fieldClass} value={year} onChange={(event) => setYear(event.target.value)}>
          {years.map((value) => (
            <option key={value} value={String(value)}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <input name="birthDate" type="hidden" value={gregorianIso(Number(year), Number(month), safeDay)} />
    </fieldset>
  );
}

export function LocationField({ latitude, longitude }: { latitude?: number | null; longitude?: number | null }) {
  const [lat, setLat] = useState(latitude == null ? "" : String(latitude));
  const [lng, setLng] = useState(longitude == null ? "" : String(longitude));
  const [message, setMessage] = useState("");
  const ready = lat !== "" && lng !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

  function locate() {
    if (!navigator.geolocation) {
      setMessage("این مرورگر موقعیت را نمی‌دهد. عرض و طول را بنویسید.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setMessage("موقعیت ثبت شد.");
      },
      () => setMessage("اجازهٔ موقعیت داده نشد. عرض و طول را خودتان بنویسید."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">موقعیت روی نقشه</legend>
      <button className={secondaryButtonClass} type="button" onClick={locate}>
        ثبت موقعیت فعلی
      </button>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-2 text-sm font-medium">
          عرض
          <input name="latitude" inputMode="decimal" dir="ltr" value={lat} onChange={(event) => setLat(event.target.value)} className={fieldClass} />
        </label>
        <label className="space-y-2 text-sm font-medium">
          طول
          <input name="longitude" inputMode="decimal" dir="ltr" value={lng} onChange={(event) => setLng(event.target.value)} className={fieldClass} />
        </label>
      </div>
      {message ? <p className="text-sm leading-7">{message}</p> : null}
      {ready ? (
        <a className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-primary" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`} target="_blank" rel="noopener noreferrer">
          دیدن روی نقشه
        </a>
      ) : (
        <p className="text-sm leading-7 text-muted">برای کافه، موقعیت لازم است.</p>
      )}
    </fieldset>
  );
}
