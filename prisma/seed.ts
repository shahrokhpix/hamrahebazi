import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.session.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.table.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.host.deleteMany();
  await prisma.shopOrder.deleteMany();
  await prisma.pointEntry.deleteMany();
  await prisma.peerRank.deleteMany();
  await prisma.shopProduct.deleteMany();
  await prisma.tickFile.deleteMany();
  await prisma.tickSubmission.deleteMany();
  await prisma.playerProfile.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.game.deleteMany();
  await prisma.account.deleteMany();

  const organizerAccount = await prisma.account.create({ data: { phone: "09120000001" } });
  const hostAccount = await prisma.account.create({ data: { phone: "09120000002" } });
  const guestAccount = await prisma.account.create({ data: { phone: "09120000003" } });
  await prisma.account.create({
    data: {
      phone: "09129990000",
      role: "admin",
      profiles: {
        create: {
          displayName: "مدیر همراهِ بازی",
          publicId: "hb_seedadmin",
          birthDate: new Date("1990-01-01T00:00:00.000Z"),
          gender: "female",
        },
      },
    },
  });

  const organizer = await prisma.organizer.create({
    data: {
      accountId: organizerAccount.id,
      displayName: "نازنین داور",
      phone: "09120000001",
    },
  });
  const host = await prisma.host.create({
    data: {
      accountId: hostAccount.id,
      status: "approved",
      displayName: "کافه مهر",
      address: "تهران، خیابان نمونه، پلاک ۱۲",
    },
  });
  await prisma.playerProfile.create({
    data: {
      accountId: organizerAccount.id,
      displayName: "نازنین داور",
      publicId: "hb_seedorg1",
      birthDate: new Date("1992-04-01T00:00:00.000Z"),
      gender: "female",
    },
  });
  await prisma.playerProfile.create({
    data: {
      accountId: hostAccount.id,
      displayName: "میزبان کافه مهر",
      publicId: "hb_seedhost",
      birthDate: new Date("1988-04-01T00:00:00.000Z"),
      gender: "male",
    },
  });
  const guest = await prisma.playerProfile.create({
    data: {
      accountId: guestAccount.id,
      displayName: "کیان مهمان",
      publicId: "hb_seedguest",
      birthDate: new Date("2014-04-01T00:00:00.000Z"),
      gender: "male",
      schoolName: "مدرسه نمونه",
    },
  });

  const game = await prisma.game.create({
    data: {
      name: "شهر و جاده",
      ageMin: 8,
      difficulty: "متوسط",
      durationMinutes: 60,
      minPlayers: 2,
      maxPlayers: 4,
    },
  });
  const table = await prisma.table.create({
    data: { hostId: host.id, name: "میز ۱", capacity: 4 },
  });

  const soonStart = new Date(Date.now() + 20 * 60 * 1000);
  const soonEnd = new Date(soonStart.getTime() + 60 * 60 * 1000);
  const laterStart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const laterEnd = new Date(laterStart.getTime() + 60 * 60 * 1000);

  const soonSlot = await prisma.slot.create({
    data: { tableId: table.id, startsAt: soonStart, endsAt: soonEnd, currentSessionId: "session_soon" },
  });
  const laterSlot = await prisma.slot.create({
    data: { tableId: table.id, startsAt: laterStart, endsAt: laterEnd, currentSessionId: "session_later" },
  });

  await prisma.session.create({
    data: {
      id: "session_soon",
      gameId: game.id,
      slotId: soonSlot.id,
      organizerId: organizer.id,
      kind: "official",
      minPlayers: 2,
      maxPlayers: 4,
      priceRial: 1_500_000,
      status: "open",
      reservedCount: 1,
    },
  });
  await prisma.session.create({
    data: {
      id: "session_later",
      gameId: game.id,
      slotId: laterSlot.id,
      organizerId: organizer.id,
      kind: "official",
      minPlayers: 2,
      maxPlayers: 4,
      priceRial: 1_500_000,
      status: "open",
      reservedCount: 0,
    },
  });
  await prisma.booking.create({
    data: {
      sessionId: "session_soon",
      playerProfileId: guest.id,
      accountId: guestAccount.id,
      status: "reserved",
      amountRial: 1_500_000,
      activeKey: "session_soon:" + guest.id,
    },
  });
  await prisma.ledgerEntry.create({
    data: {
      accountId: guestAccount.id,
      type: "charge",
      amountRial: 1_500_000,
    },
  });

  const extra = [
    { id: "session_dice", name: "تاس و ستاره", day: 5 },
    { id: "session_cafe", name: "کافه کارت", day: 6 },
  ];
  for (const item of extra) {
    const extraGame = await prisma.game.create({
      data: {
        name: item.name,
        ageMin: 8,
        difficulty: "آسان",
        durationMinutes: 45,
        minPlayers: 2,
        maxPlayers: 4,
      },
    });
    const extraTable = await prisma.table.create({
      data: { hostId: host.id, name: item.name, capacity: 4 },
    });
    const start = new Date(Date.now() + item.day * 24 * 60 * 60 * 1000);
    const slot = await prisma.slot.create({
      data: {
        tableId: extraTable.id,
        startsAt: start,
        endsAt: new Date(start.getTime() + 45 * 60 * 1000),
        currentSessionId: item.id,
      },
    });
    await prisma.session.create({
      data: {
        id: item.id,
        gameId: extraGame.id,
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
