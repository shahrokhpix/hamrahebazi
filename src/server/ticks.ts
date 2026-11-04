import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const directory = path.join(process.cwd(), "data", "ticks");
const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export type StoredTickFile = {
  kind: "image" | "text";
  storedName: string;
  originalName: string;
  mime: string;
};

function safeOriginalName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const clean = base.replace(/[^\w.\-\u0600-\u06FF ]+/g, "").trim();
  return (clean || "file").slice(0, 60);
}

function isImage(bytes: Buffer, extension: string): boolean {
  if (bytes.length < 12) return false;
  if (extension === "jpg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (extension === "png") return bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (extension === "gif") return bytes.subarray(0, 3).equals(Buffer.from("GIF"));
  if (extension === "webp") return bytes.subarray(0, 4).equals(Buffer.from("RIFF")) && bytes.subarray(8, 12).equals(Buffer.from("WEBP"));
  return false;
}

function isPlainText(bytes: Buffer): boolean {
  if (bytes.includes(0)) return false;
  return !bytes.toString("utf8").includes("\uFFFD");
}

const maxBytes = 3 * 1024 * 1024;

export async function storeTickFiles(files: File[]): Promise<StoredTickFile[]> {
  if (files.length > 3) throw new Error("count");
  if (files.length === 0) return [];
  await mkdir(directory, { recursive: true });
  const stored: StoredTickFile[] = [];
  try {
    for (const file of files) {
      if (file.size > maxBytes) throw new Error("size");
      const bytes = Buffer.from(await file.arrayBuffer());
      const imageExtension = imageTypes.get(file.type);
      if (imageExtension) {
        if (!isImage(bytes, imageExtension)) throw new Error("image-type");
        const storedName = `tick-${randomBytes(8).toString("hex")}.${imageExtension}`;
        await writeFile(path.join(directory, storedName), bytes);
        stored.push({ kind: "image", storedName, originalName: safeOriginalName(file.name), mime: file.type });
        continue;
      }
      const textName = file.name.toLowerCase().endsWith(".txt");
      const textType = file.type === "text/plain" || file.type === "" || file.type === "application/octet-stream";
      if (!textName || !textType) throw new Error("type");
      if (!isPlainText(bytes)) throw new Error("text-type");
      const storedName = `tick-${randomBytes(8).toString("hex")}.txt`;
      await writeFile(path.join(directory, storedName), bytes);
      stored.push({ kind: "text", storedName, originalName: safeOriginalName(file.name), mime: "text/plain" });
    }
  } catch (error) {
    await Promise.all(stored.map((file) => unlink(path.join(directory, file.storedName)).catch(() => undefined)));
    throw error;
  }
  return stored;
}

export function tickFilePath(storedName: string): string | null {
  if (!/^tick-[a-f0-9]{16}\.(jpg|png|webp|gif|txt)$/.test(storedName)) return null;
  return path.join(directory, storedName);
}

export async function readTickText(storedName: string): Promise<string | null> {
  const full = tickFilePath(storedName);
  if (!full || !storedName.endsWith(".txt")) return null;
  const bytes = await readFile(full);
  return bytes.toString("utf8").slice(0, 4000);
}

export function tickError(code: string): string {
  if (code === "count") return "حداکثر ۳ سند می‌توانید الصاق کنید.";
  if (code === "size") return "حجم هر فایل حداکثر ۳ مگابایت است.";
  if (code === "image-type") return "عکس باید jpg، png، webp یا gif باشد.";
  return "سند باید txt یا عکس jpg، png، webp یا gif باشد.";
}
