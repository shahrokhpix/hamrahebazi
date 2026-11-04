import { readFile } from "node:fs/promises";
import { prisma } from "@/infrastructure/prisma";
import { currentAccount } from "@/server/auth";
import { tickFilePath } from "@/server/ticks";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) return new Response("وارد نشده‌اید.", { status: 401 });
  const { id } = await params;
  const file = await prisma.tickFile.findUnique({
    where: { id },
    include: { submission: { include: { profile: true } } },
  });
  if (!file) return new Response("پیدا نشد.", { status: 404 });
  const owner = file.submission.profile.accountId === account.id;
  if (!owner && account.role !== "admin") return new Response("اجازه ندارید.", { status: 403 });
  const full = tickFilePath(file.storedName);
  if (!full) return new Response("پیدا نشد.", { status: 404 });
  const bytes = await readFile(full);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": file.mime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
    },
  });
}
