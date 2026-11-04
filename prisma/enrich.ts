import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.account.upsert({
    where: { phone: "09129990000" },
    update: { role: "admin" },
    create: { phone: "09129990000", role: "admin" },
  });
  const profile = await prisma.playerProfile.findFirst({ where: { accountId: admin.id } });
  if (!profile) {
    await prisma.playerProfile.create({
      data: {
        accountId: admin.id,
        displayName: "مدیر همراهِ بازی",
        publicId: "hb_seedadmin",
        birthDate: new Date("1990-01-01T00:00:00.000Z"),
        gender: "female",
      },
    });
  }

  const host = await prisma.host.findFirst({ where: { status: "approved" } });
  const organizer = await prisma.organizer.findFirst();
  if (!host || !organizer) return;

  const extra = [
    { id: "session_dice", name: "تاس و ستاره", day: 5 },
    { id: "session_cafe", name: "کافه کارت", day: 6 },
  ];
  for (const item of extra) {
    const exists = await prisma.session.findUnique({ where: { id: item.id } });
    if (exists) continue;
    const game = await prisma.game.create({
      data: {
        name: item.name,
        ageMin: 8,
        difficulty: "آسان",
        durationMinutes: 45,
        minPlayers: 2,
        maxPlayers: 4,
      },
    });
    const table = await prisma.table.create({
      data: { hostId: host.id, name: item.name, capacity: 4 },
    });
    const start = new Date(Date.now() + item.day * 24 * 60 * 60 * 1000);
    const slot = await prisma.slot.create({
      data: {
        tableId: table.id,
        startsAt: start,
        endsAt: new Date(start.getTime() + 45 * 60 * 1000),
        currentSessionId: item.id,
      },
    });
    await prisma.session.create({
      data: {
        id: item.id,
        gameId: game.id,
        slotId: slot.id,
        organizerId: organizer.id,
        kind: "official",
        minPlayers: 2,
        maxPlayers: 4,
        priceRial: 900_000,
        status: "open",
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
